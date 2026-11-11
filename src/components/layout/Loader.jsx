import { useEffect } from 'react';
import { useSound } from '../../context/SoundContext';
import { loadIntro } from '../../lib/intro';

/*
 * Abertura da primeira visita da sessão, já com som. Todo o roteiro (saudações
 * e "Olá mundo" digitados numa página só, e o fade que
 * revela Projetos) e os sons vivem em public/intro/intro.js, o mesmo arquivo
 * usado pela prévia preview/abertura.html.
 *
 * Abertura primeiro: o index.html já carrega intro.js antes do React e a
 * abertura começa sozinha (window.__oiBoot). Este componente só liga o som e o
 * fim dela ao site, e avisa quando o site terminou de carregar por trás, para a
 * abertura sumir sobre a página pronta. Se o index.html não iniciou a abertura,
 * cai no caminho antigo: carrega intro.js daqui.
 */
export const INTRO_KEY = 'orvion:intro-seen';

/* Site pronto = fontes carregadas e primeira imagem decodificada (com teto de tempo). */
function whenSiteReady() {
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const img = document.querySelector('#root img');
  const cover = img?.decode ? img.decode().catch(() => {}) : Promise.resolve();
  const cap = new Promise((r) => setTimeout(r, 4000));
  return Promise.race([Promise.all([fonts, cover]), cap]).then(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
}

export function Loader({ onDone }) {
  const { setSound } = useSound();

  useEffect(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* sem armazenamento: a abertura volta na próxima visita */
    }
    performance.mark?.('site-montado');

    const boot = window.__oiBoot;
    if (boot) {
      // a abertura já está rodando desde o HTML: só se liga a ela
      boot.onSound = (on) => setSound(on);
      boot.onDone = () => onDone?.();
      if (boot.sound !== null) setSound(boot.sound);
      whenSiteReady().then(() => {
        performance.mark?.('site-pronto');
        window.__orvionSiteReady?.();
      });
      if (boot.done) onDone?.();
      // não cancela ao desmontar: o StrictMode remonta e a abertura não pode recomeçar
      return () => {
        boot.onSound = null;
        boot.onDone = null;
      };
    }

    // caminho antigo (sem a abertura no HTML)
    let cancel = null;
    let alive = true;
    loadIntro()
      .then(() => {
        if (!alive) return;
        cancel = window.OrvionIntro.play({
          sound: true, // a abertura já começa com som
          ready: whenSiteReady(),
          onSound: (on) => setSound(on),
          onDone: () => onDone?.(),
        });
      })
      .catch(() => {
        document.documentElement.classList.remove('intro-on');
        onDone?.(); // sem a abertura, o site segue normalmente
      });
    return () => {
      alive = false;
      cancel?.();
    };
  }, [onDone, setSound]);

  return null;
}
