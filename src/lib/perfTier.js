/*
 * Nível de efeito que o aparelho aguenta: 'alto' (tudo como foi desenhado),
 * 'medio' (blur menor, canvas mais leve) ou 'baixo' (vidro sólido, fundo
 * parado, túnel 3D simplificado). O main.jsx grava o palpite em <html data-perf>
 * antes do React desenhar qualquer coisa (o HTML inicial é só o #root vazio,
 * então nada pisca). Depois, autoTune() mede o FPS e pode rebaixar.
 *
 * Para testar: /?perf=baixo, /?perf=medio, /?perf=alto (vale para a sessão).
 */
import { useSyncExternalStore } from 'react';

const LEVELS = ['baixo', 'medio', 'alto'];
const SESSION_KEY = 'orvion:perf';
const FORCED_KEY = 'orvion:perf-forced';

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function detectTier() {
  if (typeof window === 'undefined') return 'alto';
  // forçado à mão (?perf= ou localStorage): vale a sessão toda e não é rebaixado
  const fromUrl = new URLSearchParams(window.location.search).get('perf');
  const fromLocal = safe(() => localStorage.getItem('perf'));
  const manual = LEVELS.includes(fromUrl) ? fromUrl : LEVELS.includes(fromLocal) ? fromLocal : null;
  if (manual) {
    safe(() => sessionStorage.setItem(SESSION_KEY, manual)); // vale ao trocar de página
    safe(() => sessionStorage.setItem(FORCED_KEY, '1'));
    return manual;
  }
  // decidido antes nesta sessão (medição automática): mantém
  const saved = safe(() => sessionStorage.getItem(SESSION_KEY));
  if (LEVELS.includes(saved)) return saved;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // só existe no Chromium; ausente = médio-alto
  const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (reduce || saveData || cores <= 2 || mem <= 2) return 'baixo';
  if (cores <= 4 || mem <= 4 || (touch && cores <= 6)) return 'medio';
  return 'alto';
}

export function getTier() {
  if (typeof document === 'undefined') return 'alto';
  const tier = document.documentElement.dataset.perf;
  return LEVELS.includes(tier) ? tier : 'alto';
}

export function applyTier(tier) {
  document.documentElement.dataset.perf = tier;
}

/* Mede o FPS real por ~1,5 s. */
export function probeFps(ms = 1500) {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    const tick = (t) => {
      if (!start) start = t;
      frames += 1;
      if (t - start < ms) requestAnimationFrame(tick);
      else resolve((frames * 1000) / (t - start));
    };
    requestAnimationFrame(tick);
  });
}

/*
 * Depois que a página assenta, mede o FPS uma vez por sessão e, se ficar abaixo
 * de 45, desce um nível. A decisão fica na sessão (sessionStorage), e um nível
 * forçado por ?perf= / localStorage já chega gravado lá pelo detectTier(), então
 * não é medido. Nunca sobe sozinho: oscilar é pior que ficar estável.
 */
let probed = false;
export function autoTune() {
  if (probed || typeof window === 'undefined' || import.meta.env.DEV) return;
  probed = true;
  if (safe(() => sessionStorage.getItem(SESSION_KEY))) return;
  const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1200));
  idle(
    () => {
      if (document.hidden) {
        probed = false; // aba em segundo plano mede errado: tenta na próxima vez
        return;
      }
      probeFps().then((fps) => {
        const current = getTier();
        const next = fps < 45 && current !== 'baixo' ? LEVELS[LEVELS.indexOf(current) - 1] : current;
        if (next !== current) applyTier(next);
        safe(() => sessionStorage.setItem(SESSION_KEY, next));
      });
    },
    { timeout: 4000 },
  );
}

/*
 * A página parada roda bem até em aparelho fraco; o peso aparece na troca de
 * projeto (fundo, capa, vidro e túnel mudando juntos). Por isso o Work avisa cada
 * troca: mede o FPS durante ela e, se a média de duas trocas ficar abaixo de 40,
 * desce um nível (pode descer de novo nas duas seguintes). Nível forçado à mão
 * não é mexido.
 */
let measuring = false;
let samples = [];
let warmups = 1; // a 1ª troca sobe texturas e compila shaders: lenta em qualquer aparelho
export function noteTransition(ms = 1100) {
  // em desenvolvimento (npm run dev) tudo roda mais lento: não rebaixa por engano
  if (import.meta.env.DEV) return;
  if (measuring || typeof window === 'undefined' || document.hidden) return;
  if (warmups > 0) {
    warmups -= 1;
    return;
  }
  if (safe(() => sessionStorage.getItem(FORCED_KEY))) return;
  if (getTier() === 'baixo') return;
  measuring = true;
  probeFps(ms).then((fps) => {
    measuring = false;
    samples.push(fps);
    if (samples.length < 2) return;
    const avg = (samples[0] + samples[1]) / 2;
    samples = [];
    if (avg >= 40) return;
    const next = LEVELS[LEVELS.indexOf(getTier()) - 1];
    applyTier(next);
    safe(() => sessionStorage.setItem(SESSION_KEY, next));
  });
}

/* Nível atual para os componentes; acompanha um rebaixamento no meio da sessão. */
const subscribe = (onChange) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-perf'] });
  return () => observer.disconnect();
};

export function useTier() {
  return useSyncExternalStore(subscribe, getTier, () => 'alto');
}
