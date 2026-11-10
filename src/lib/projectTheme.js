const MOTIFS = ['wash', 'orbit', 'grid', 'ribbon'];
const paletteCache = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function parseColor(value) {
  if (value && typeof value === 'object') {
    if ([value.r, value.g, value.b].every((channel) => typeof channel === 'number')) {
      return {
        r: clamp(value.r, 0, 255),
        g: clamp(value.g, 0, 255),
        b: clamp(value.b, 0, 255),
        weight: typeof value.count === 'number' ? value.count : 1,
      };
    }
    return null;
  }
  if (typeof value !== 'string') return null;
  const input = value.trim();

  if (input.startsWith('#')) {
    let hex = input.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((part) => part + part)
        .join('');
    }
    if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const match = input.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  return {
    r: clamp(parts[0], 0, 255),
    g: clamp(parts[1], 0, 255),
    b: clamp(parts[2], 0, 255),
  };
}

function toHex({ r, g, b }) {
  const channel = (value) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function toHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return { h: hue, s: saturation, l: lightness };
}

function fromHsl({ h, s, l }) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const angle = ((h % 360) + 360) % 360;
  const x = chroma * (1 - Math.abs(((angle / 60) % 2) - 1));
  const m = l - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (angle < 60) [red, green, blue] = [chroma, x, 0];
  else if (angle < 120) [red, green, blue] = [x, chroma, 0];
  else if (angle < 180) [red, green, blue] = [0, chroma, x];
  else if (angle < 240) [red, green, blue] = [0, x, chroma];
  else if (angle < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    r: (red + m) * 255,
    g: (green + m) * 255,
    b: (blue + m) * 255,
  };
}

function mix(a, b, amount) {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  };
}

function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return channel(r) * 0.2126 + channel(g) * 0.7152 + channel(b) * 0.0722;
}

function colorScore(color, count) {
  const hsl = toHsl(color);
  const centerBias = 1 - Math.abs(hsl.l - 0.52) * 0.9;
  return count * (0.55 + hsl.s * 1.8) * Math.max(0.2, centerBias);
}

function backgroundFrom(dominant, accent) {
  const mixed = mix(dominant, accent, 0.34);
  const hsl = toHsl(mixed);
  const light = clamp(hsl.l, 0.18, 0.82);
  const saturation = hsl.s < 0.08 ? 0 : clamp(hsl.s, 0.16, 0.62);
  return fromHsl({ h: hsl.h, s: saturation, l: light });
}

function ambientFrom(color, background) {
  const hsl = toHsl(color);
  const backgroundLuminance = relativeLuminance(background);
  const lightness = backgroundLuminance < 0.35
    ? clamp(hsl.l, 0.5, 0.78)
    : clamp(hsl.l, 0.3, 0.62);
  return fromHsl({
    h: hsl.h,
    s: hsl.s < 0.08 ? 0 : clamp(hsl.s, 0.34, 0.86),
    l: lightness,
  });
}

function motifFor(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return MOTIFS[hash % MOTIFS.length];
}

function normalizeColors(colors) {
  if (!Array.isArray(colors)) return [];
  return colors.map(parseColor).filter(Boolean);
}

export function colorsFromProject(project) {
  return normalizeColors(project?.colors);
}

export function createProjectTheme(project, colors, index = 0) {
  const override = project?.theme ?? {};
  const parsed = normalizeColors(colors);
  const fallback = parseColor('#ececec');
  const dominant = parsed[0] ?? fallback;
  const ranked = parsed
    .slice(0, 12)
    .map((color, position) => ({
      color,
      position,
      score: colorScore(color, color.weight ?? 12 - position),
    }))
    .sort((a, b) => b.score - a.score);
  const chromatic = parsed
    .slice(0, 12)
    .filter((color) => {
      const hsl = toHsl(color);
      return hsl.s > 0.16 && hsl.l > 0.06 && hsl.l < 0.96 && (color.weight ?? 1) > 2;
    })
    .sort((a, b) => {
      const aScore = toHsl(a).s * Math.sqrt(a.weight ?? 1);
      const bScore = toHsl(b).s * Math.sqrt(b.weight ?? 1);
      return bScore - aScore;
    });
  const accent = chromatic[0] ?? ranked[0]?.color ?? dominant;
  const secondary = chromatic[1] ?? ranked[1]?.color ?? accent;
  const background = backgroundFrom(dominant, accent);
  const primary = ambientFrom(accent, background);
  const second = ambientFrom(secondary, background);
  const seed = project?.slug ?? `project-${index}`;
  const backgroundOverride = parseColor(override.background);
  const primaryOverride = parseColor(override.primary);
  const secondaryOverride = parseColor(override.secondary);
  const accentOverride = parseColor(override.accent);

  return {
    background: toHex(backgroundOverride ?? background),
    primary: toHex(primaryOverride ?? primary),
    secondary: toHex(secondaryOverride ?? second),
    accent: toHex(accentOverride ?? ambientFrom(accent, background)),
    motif: override.motif ?? motifFor(seed),
    isDark: relativeLuminance(backgroundOverride ?? background) < 0.42,
  };
}

export function extractCoverPalette(source) {
  if (!source) return Promise.resolve([]);
  if (paletteCache.has(source)) return paletteCache.get(source);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve([]);
          return;
        }

        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        const buckets = new Map();

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3];
          if (alpha < 160) continue;

          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const key = `${red >> 4}-${green >> 4}-${blue >> 4}`;
          const bucket = buckets.get(key) ?? {
            r: 0,
            g: 0,
            b: 0,
            count: 0,
          };
          bucket.r += red;
          bucket.g += green;
          bucket.b += blue;
          bucket.count += 1;
          buckets.set(key, bucket);
        }

        const colors = [...buckets.values()]
          .map((bucket) => ({
            r: bucket.r / bucket.count,
            g: bucket.g / bucket.count,
            b: bucket.b / bucket.count,
            count: bucket.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        resolve(colors);
      } catch {
        resolve([]);
      }
    };

    image.onerror = () => resolve([]);
    image.src = source;
  });

  paletteCache.set(source, promise);
  return promise;
}
