/*
 * Medidas da página do projeto, usadas pelo CSS (variáveis) e pela bolha de
 * vidro do clique, para a transição revelar o post já no lugar e tamanho finais.
 */
export const CASE = {
  left: 300, // painel de informações
  right: 168, // minimapa
  gap: 28,
  top: 72, // início do post (mesma altura do minimapa)
  radius: 14,
  desktop: 1100,
};

const cssPad = () => {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad'));
  return Number.isFinite(value) ? value : 20;
};

/* Retângulo do post (em px, a partir do canto superior esquerdo da tela). */
export function casePostRect(width = window.innerWidth) {
  if (width < CASE.desktop) {
    return { x: 16, y: 84, width: width - 32 };
  }
  const pad = cssPad();
  const x = pad + CASE.left + CASE.gap;
  return { x, y: CASE.top, width: width - x - (pad + CASE.right + CASE.gap) };
}
