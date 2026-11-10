import { useEffect } from 'react';
import { useSound } from '../../context/SoundContext';
import { loadIntro } from '../../lib/intro';

/*
 * Abertura da primeira visita da sessão. Todo o roteiro (portão de som,
 * saudações e "Olá mundo" digitados numa página só, e a bolha de vidro que
 * revela Projetos) e os sons vivem em public/intro/intro.js, o mesmo arquivo
 * usado pela prévia preview/abertura.html. Este componente só o carrega e o
 * liga ao site: a escolha "com som / sem som" vira o botão de som do site.
 */
export const INTRO_KEY = 'orvion:intro-seen';

export function Loader({ onDone }) {
  const { setSound } = useSound();

  useEffect(() => {
    let cancel = null;
    let alive = true;
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* sem armazenamento: a abertura volta na próxima visita */
    }
    loadIntro()
      .then(() => {
        if (!alive) return;
        cancel = window.OrvionIntro.play({
          revealTarget: '#root', // o site entra com zoom atrás da bolha
          sound: 'ask',
          onSound: (on) => setSound(on),
          onDone: () => onDone?.(),
        });
      })
      .catch(() => onDone?.()); // sem a abertura, o site segue normalmente
    return () => {
      alive = false;
      cancel?.();
    };
  }, [onDone, setSound]);

  return null;
}
