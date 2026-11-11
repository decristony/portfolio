/*
 * Transição de clique: uma bolha de vidro cresce do centro da tela e revela a
 * imagem do projeto (efeito "glass" do Lumina Interactive List, adaptado).
 *
 * <GlassRevealHost /> fica montado no App (sobrevive à troca de página).
 * playGlassReveal({ src, rect, bg }) devolve uma Promise que resolve quando a
 * tela está coberta. A bolha mostra a página já no tamanho final: fundo do
 * projeto (bg) e o post dentro do retângulo da coluna central (rect).
 * Depois disso a camada some sozinha.
 * O three.js e o contexto WebGL só são criados no primeiro clique (a bolha só
 * existe a partir de Projetos, onde o túnel 3D já baixou o three.js). Antes,
 * toda página baixava o three.js e abria um contexto WebGL logo ao carregar.
 */
import { useEffect, useRef } from 'react';
import { getTier } from '../../lib/perfTier';

const DURATION = 1.7; // segundos para a bolha cobrir a tela
const FADE = 0.55; // segundos para a camada sumir depois da troca de página

let request = null; // { src, rect, bg, resolve }
let wake = null;
// a bolha só some quando a página nova já está pronta (post carregado), para
// não aparecer um quadro vazio ou claro no meio da troca
let released = false;
const MAX_HOLD = 1.2; // segundos: limite de espera pela página

export function releaseGlassReveal() {
  released = true;
}

const hexToRgb = (hex) => {
  const v = parseInt(String(hex).replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

export function playGlassReveal({ src, rect, bg = '#ececec' }) {
  return new Promise((resolve) => {
    released = false;
    request = { src, rect, bg, resolve };
    wake?.();
  });
}

const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uFade;
  uniform vec2 uResolution;
  uniform vec2 uTextureSize;
  uniform vec4 uRect;   // x, y (topo), largura, altura do post em px
  uniform float uRadius;
  uniform vec3 uBg;
  varying vec2 vUv;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  // como a página fica: fundo do projeto e o post na coluna central
  vec3 page(vec2 p) {
    vec2 px = vec2(p.x, uResolution.y - p.y);
    vec2 q = px - uRect.xy;
    vec2 hs = uRect.zw * 0.5; // "half" é palavra reservada no GLSL
    if (roundedBox(q - hs, hs, uRadius) > 0.0) return uBg;
    vec2 uv = vec2(q.x / uRect.z, 1.0 - q.y / uRect.w);
    return texture2D(uTexture, uv).rgb;
  }

  void main() {
    float progress = uProgress;
    float time = progress * 5.0;
    vec2 p = vUv * uResolution;
    vec2 c = uResolution * 0.5;
    float maxR = length(uResolution) * 0.85;
    float br = progress * maxR;
    float d = length(p - c);
    float nd = d / max(br, 0.001);
    float inside = smoothstep(br + 3.0, br - 3.0, d);

    vec3 col = vec3(0.0);
    if (inside > 0.0) {
      vec2 dir = d > 0.0 ? (p - c) / d : vec2(0.0);
      float ro = 0.08 * uResolution.y * pow(smoothstep(0.3, 1.0, nd), 1.5);
      vec2 dp = p - dir * ro;
      dp += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uResolution.y * nd * inside;
      float ca = 0.02 * uResolution.y * pow(smoothstep(0.3, 1.0, nd), 1.2);
      col = vec3(page(dp + dir * ca * 1.2).r, page(dp + dir * ca * 0.2).g, page(dp - dir * ca * 0.8).b);
      float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
      col += rim * 0.08;
      if (progress > 0.95) col = mix(col, page(p), (progress - 0.95) / 0.05);
    }
    float alpha = inside * (1.0 - uFade);
    gl_FragColor = vec4(col * alpha, alpha); // alfa pré-multiplicado
  }
`;

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2); // power2.inOut

export function GlassRevealHost() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let alive = true;
    let loading = null;
    // primeiro pedido: baixa o three.js e monta o renderizador; o setup troca
    // o wake pelo de verdade e já toca o pedido que estava esperando
    wake = () => {
      loading ??= import('three')
        .then((THREE) => {
          if (alive) cleanup = setup(THREE, canvasRef.current);
        })
        .catch(() => {
          request?.resolve(); // sem o motor 3D, a troca de página segue sem a bolha
          request = null;
        });
    };
    return () => {
      alive = false;
      wake = null;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className="glass-reveal" aria-hidden="true" />;
}

function setup(THREE, canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch {
    // sem WebGL: a troca de página acontece sem a bolha
    wake = () => {
      request?.resolve();
      request = null;
    };
    wake();
    return () => {};
  }
  const tier = getTier();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'alto' ? 2 : tier === 'medio' ? 1.5 : 1));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    premultipliedAlpha: true, // o shader já devolve a cor multiplicada pelo alfa
    uniforms: {
      uTexture: { value: null },
      uProgress: { value: 0 },
      uFade: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTextureSize: { value: new THREE.Vector2(1, 1) },
      uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uRadius: { value: 14 },
      uBg: { value: new THREE.Vector3(0.93, 0.93, 0.93) },
    },
    vertexShader,
    fragmentShader,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const loader = new THREE.TextureLoader();
  let frame = 0;

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };
  resize();
  window.addEventListener('resize', resize);

  const run = () => {
    const job = request;
    request = null;
    if (!job) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    loader.load(
      job.src,
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        material.uniforms.uTexture.value?.dispose();
        material.uniforms.uTexture.value = texture;
        material.uniforms.uTextureSize.value.set(texture.image.width, texture.image.height);
        const r = job.rect ?? { x: 0, y: 0, width: window.innerWidth };
        const h = (r.width * texture.image.height) / texture.image.width;
        material.uniforms.uRect.value.set(r.x, r.y, r.width, h);
        material.uniforms.uBg.value.set(...hexToRgb(job.bg));
        material.uniforms.uFade.value = 0;
        canvas.style.visibility = 'visible';
        const total = reduced ? 0.01 : DURATION;
        const start = performance.now();
        let covered = false;
        let fadeFrom = null;
        cancelAnimationFrame(frame);
        const tick = (now) => {
          const t = (now - start) / 1000;
          material.uniforms.uProgress.value = ease(Math.min(1, t / total));
          if (t >= total && !covered) {
            covered = true;
            job.resolve(); // tela coberta: pode trocar de página
          }
          if (covered && fadeFrom === null && (released || t - total > MAX_HOLD)) {
            fadeFrom = t + 0.08; // um respiro para a página pintar o primeiro quadro
          }
          if (fadeFrom !== null) {
            material.uniforms.uFade.value = Math.max(0, Math.min(1, (t - fadeFrom) / FADE));
          }
          renderer.render(scene, camera);
          if (material.uniforms.uFade.value < 1) {
            frame = requestAnimationFrame(tick);
          } else {
            canvas.style.visibility = 'hidden';
          }
        };
        frame = requestAnimationFrame(tick);
      },
      undefined,
      () => job.resolve(),
    );
  };
  wake = run;
  if (request) run();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    material.uniforms.uTexture.value?.dispose();
    material.dispose();
    renderer.dispose();
  };
}
