import { useEffect, useRef } from 'react';
import { useTier } from '../../lib/perfTier';

/*
 * Céu estrelado: um campo de estrelas que cintilam e derivam bem devagar, em
 * três profundidades, e de vez em quando uma estrela cadente atravessa a tela.
 * Fica atrás do post na página do projeto.
 */
const LAYERS = [
  { count: 140, size: [0.4, 0.9], speed: 3, alpha: 0.55 },
  { count: 70, size: [0.8, 1.4], speed: 7, alpha: 0.75 },
  { count: 22, size: [1.3, 2.1], speed: 13, alpha: 0.95 },
];
const TINTS = ['255,255,255', '243,233,207', '183,178,245']; // branco, creme e lilás da paleta do Sereno

const rand = (a, b) => a + Math.random() * (b - a);

export function StarsBackdrop({ className = 'case__pulse case__stars' }) {
  const canvasRef = useRef(null);
  const tier = useTier();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    // nível baixo: céu parado, como no "reduzir movimento"
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || tier === 'baixo';
    const maxDpr = tier === 'alto' ? 2 : tier === 'medio' ? 1.5 : 1;
    let w = 0;
    let h = 0;
    let stars = [];
    let shooters = [];
    let nextShot = 0;
    let frame = 0;
    let last = 0;

    const seed = () => {
      const area = (w * h) / (1440 * 900); // densidade igual em qualquer tela
      stars = LAYERS.flatMap((layer, depth) =>
        Array.from({ length: Math.round(layer.count * Math.max(area, 0.35)) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(...layer.size),
          a: layer.alpha * rand(0.5, 1),
          speed: layer.speed,
          tw: rand(0.6, 2.2), // velocidade do cintilar
          ph: Math.random() * Math.PI * 2,
          tint: TINTS[depth === 2 ? Math.floor(Math.random() * 3) : Math.random() < 0.8 ? 0 : 1],
        })),
      );
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const shoot = () => {
      const fromLeft = Math.random() < 0.5;
      const angle = rand(0.28, 0.5) * (fromLeft ? 1 : -1);
      const speed = rand(700, 1000);
      shooters.push({
        x: fromLeft ? rand(-0.1, 0.5) * w : rand(0.5, 1.1) * w,
        y: rand(-0.05, 0.35) * h,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1) * (fromLeft ? 1 : 1),
        vy: Math.abs(Math.sin(angle)) * speed,
        life: 0,
        max: rand(0.9, 1.4),
        len: rand(120, 220),
      });
    };

    function draw(now) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      stars.forEach((s) => {
        if (!reduced) {
          s.x -= s.speed * dt;
          if (s.x < -4) {
            s.x = w + 4;
            s.y = Math.random() * h;
          }
        }
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * s.tw + s.ph);
        const a = s.a * twinkle;
        ctx.fillStyle = `rgba(${s.tint},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.4) {
          // halo nas estrelas maiores
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, `rgba(${s.tint},${(a * 0.35).toFixed(3)})`);
          g.addColorStop(1, `rgba(${s.tint},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!reduced) {
        if (now > nextShot) {
          if (nextShot) shoot();
          nextShot = now + rand(2600, 6000);
        }
        shooters = shooters.filter((s) => s.life < s.max);
        shooters.forEach((s) => {
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const p = s.life / s.max;
          const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
          const norm = Math.hypot(s.vx, s.vy);
          const tx = s.x - (s.vx / norm) * s.len;
          const ty = s.y - (s.vy / norm) * s.len;
          const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
          g.addColorStop(0, `rgba(255,250,235,${(0.9 * fade).toFixed(3)})`);
          g.addColorStop(0.3, `rgba(243,233,207,${(0.35 * fade).toFixed(3)})`);
          g.addColorStop(1, 'rgba(183,178,245,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        });
        frame = requestAnimationFrame(draw);
      }
    }

    // aba oculta: o loop para; ao voltar, recomeça sem salto (last zerado)
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden && !reduced) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduced) frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tier]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
