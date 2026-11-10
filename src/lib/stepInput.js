/*
 * Navegação por passos (Projetos): cada gesto passa exatamente um projeto.
 * - Mouse (roda com "dentes"): um passo por dente, com um intervalo mínimo.
 * - Trackpad: um passo por gesto; a inércia que vem depois é ignorada, e só
 *   um novo empurrão (mais forte que a inércia) conta como outro gesto.
 * - Toque: um deslize maior que SWIPE_MIN.
 * - Teclado: setas e Page Up/Down.
 */
const WHEEL_THRESHOLD = 36;
const MOUSE_INTERVAL = 380; // ms entre passos com a roda do mouse
const TRACKPAD_INTERVAL = 450; // ms antes de aceitar um novo empurrão
const GESTURE_GAP = 200; // ms sem eventos = gesto novo
const SWIPE_MIN = 42; // px

export function createWheelStepper(step) {
  const s = { acc: 0, last: 0, stepAt: 0, used: false, peak: 0 };
  return (e) => {
    e.preventDefault();
    const now = performance.now();
    const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const d = e.deltaMode === 1 ? raw * 16 : e.deltaMode === 2 ? raw * 400 : raw;
    const mouse = e.deltaMode !== 0 || (Number.isInteger(raw) && Math.abs(raw) >= 50);
    if (now - s.last > GESTURE_GAP) {
      s.acc = 0;
      s.used = false;
      s.peak = 0;
    }
    s.last = now;
    if (s.used) {
      const fresh = mouse
        ? now - s.stepAt > MOUSE_INTERVAL
        : now - s.stepAt > TRACKPAD_INTERVAL && Math.abs(d) > s.peak * 1.35;
      s.peak = Math.max(s.peak * 0.9, Math.abs(d));
      if (!fresh) return;
      s.used = false;
      s.acc = 0;
    }
    s.acc += d;
    s.peak = Math.max(s.peak, Math.abs(d));
    if (Math.abs(s.acc) >= WHEEL_THRESHOLD) {
      step(Math.sign(s.acc));
      s.used = true;
      s.stepAt = now;
      s.acc = 0;
    }
  };
}

export function createSwipeStepper(step) {
  let start = null;
  return {
    onTouchStart: (e) => {
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = start.x - t.clientX;
      const dy = start.y - t.clientY;
      const along = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      if (Math.abs(along) >= SWIPE_MIN) step(Math.sign(along));
      start = null;
    },
  };
}

export function createKeyStepper(step) {
  return (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) step(1);
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) step(-1);
    else return;
    e.preventDefault();
  };
}

/* Liga roda, toque e teclado a uma função step(dir). Devolve a limpeza. */
export function bindStepInput(node, step) {
  const onWheel = createWheelStepper(step);
  const onKey = createKeyStepper(step);
  const swipe = createSwipeStepper(step);
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  node.addEventListener('touchstart', swipe.onTouchStart, { passive: true });
  node.addEventListener('touchend', swipe.onTouchEnd, { passive: true });
  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    node.removeEventListener('touchstart', swipe.onTouchStart);
    node.removeEventListener('touchend', swipe.onTouchEnd);
  };
}
