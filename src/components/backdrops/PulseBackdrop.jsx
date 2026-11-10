import { useEffect, useRef } from 'react';

/*
 * Fundo de pulso: linhas de eletrocardiograma atravessando a tela, como num
 * monitor cardíaco. Cada linha tem uma "cabeça" que avança e deixa um rastro
 * que se apaga. Fica atrás do conteúdo da página do projeto.
 */
const LINES = [
  { y: 0.2, amp: 0.09, speed: 210, trail: 0.75, alpha: 0.5, width: 1.6, delay: 0 },
  { y: 0.56, amp: 0.13, speed: 150, trail: 0.9, alpha: 0.32, width: 1.3, delay: 0.45 },
  { y: 0.86, amp: 0.07, speed: 260, trail: 0.6, alpha: 0.24, width: 1.1, delay: 0.2 },
];
const PERIOD = 340; // px por batimento

// forma do batimento (onda P, complexo QRS, onda T), u de 0 a 1
function ecg(u) {
  const g = (c, w, a) => a * Math.exp(-((u - c) ** 2) / (2 * w * w));
  return g(0.18, 0.025, 0.1) - g(0.3, 0.006, 0.12) + g(0.32, 0.008, 1) - g(0.345, 0.008, 0.28) + g(0.56, 0.04, 0.2);
}

const hexToRgb = (hex) => {
  const v = parseInt(String(hex).replace('#', ''), 16);
  return `${(v >> 16) & 255},${(v >> 8) & 255},${v & 255}`;
};

export function PulseBackdrop({ color = '#B21E2D', className = 'case__pulse' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const rgb = hexToRgb(color);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    };

    const yAt = (line, x) => h * line.y - ecg((((x % PERIOD) + PERIOD) % PERIOD) / PERIOD) * h * line.amp * 2.2;

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      LINES.forEach((line) => {
        ctx.lineWidth = line.width;
        if (reduced) {
          ctx.strokeStyle = `rgba(${rgb},${line.alpha * 0.45})`;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 2) (x ? ctx.lineTo : ctx.moveTo).call(ctx, x, yAt(line, x));
          ctx.stroke();
          return;
        }
        const trail = w * line.trail;
        const span = w + trail;
        const head = ((now / 1000 + line.delay * 10) * line.speed) % span;
        const start = Math.max(0, head - trail);
        const step = 3;
        for (let x = start; x < Math.min(head, w); x += step) {
          const fade = 1 - (head - x) / trail; // 0 no fim do rastro, 1 na cabeça
          ctx.strokeStyle = `rgba(${rgb},${(fade * fade * line.alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(x, yAt(line, x));
          ctx.lineTo(x + step, yAt(line, x + step));
          ctx.stroke();
        }
        // ponto brilhante na cabeça da linha
        if (head <= w) {
          const hy = yAt(line, head);
          const glow = ctx.createRadialGradient(head, hy, 0, head, hy, 14);
          glow.addColorStop(0, `rgba(${rgb},${line.alpha * 1.2})`);
          glow.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(head, hy, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      if (!reduced) frame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
