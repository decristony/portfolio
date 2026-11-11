import { useEffect, useRef } from 'react';

/*
 * Rastro de luz atrás do cursor normal: uma linha fina que afina e some em
 * ~0,35 s. Clara sobre fundo escuro, escura sobre fundo claro.
 * Só com mouse e sem "reduzir movimento".
 */
const LIFE = 350; // ms que cada ponto do rastro dura

export function CursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const ok =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ctx || !ok) return undefined;

    let points = [];
    let rgb = '30, 30, 30';
    let frame = 0;
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // aba oculta: descarta o rastro e para o loop
    const onVisibility = () => {
      if (!document.hidden) return;
      cancelAnimationFrame(frame);
      points = [];
      running = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const draw = () => {
      const now = performance.now();
      points = points.filter((p) => now - p.t < LIFE);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = 'round';
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        const life = 1 - (now - b.t) / LIFE; // 1 na ponta, 0 no fim do rastro
        ctx.strokeStyle = `rgba(${rgb}, ${(life * 0.45).toFixed(3)})`;
        ctx.lineWidth = 0.5 + life * 2.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (points.length) frame = requestAnimationFrame(draw);
      else running = false;
    };

    const onMove = (e) => {
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      const dark = e.target.closest?.('[data-tone]')?.getAttribute('data-tone') === 'dark';
      rgb = dark ? '255, 255, 255' : '30, 30, 30';
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />;
}
