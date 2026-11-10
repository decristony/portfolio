import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset';

const SoundContext = createContext({
  soundEnabled: false,
  toggleSound: () => {},
  setSound: () => {},
  playHover: () => {},
  playClick: () => {},
  playOpen: () => {},
  playTransition: () => {},
});

const STORAGE_KEY = 'portfolio:sound';

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const cache = useRef({});

  useEffect(() => {
    const create = (src, volume) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = volume;
      return audio;
    };

    cache.current = {
      hover: create(asset('/sounds/hover.mp3'), 0.18),
      click: create(asset('/sounds/click.mp3'), 0.3),
      open: create(asset('/sounds/open.mp3'), 0.26),
    };
  }, []);

  const play = useCallback(
    (name, volume) => {
      if (!soundEnabled) return;
      const source = cache.current[name];
      if (!source) return;
      try {
        const audio = source.cloneNode();
        audio.volume = volume ?? source.volume;
        audio.play().catch(() => {});
      } catch {
        /* audio is optional */
      }
    },
    [soundEnabled],
  );

  const playHover = useCallback(() => play('hover', 0.16), [play]);
  const playClick = useCallback(() => play('click', 0.3), [play]);
  const playOpen = useCallback(() => play('open', 0.24), [play]);
  const playTransition = useCallback(() => play('open', 0.18), [play]);

  // liga ou desliga sem tocar o clique (usado pela escolha da abertura)
  const setSound = useCallback((on) => {
    setSoundEnabled(Boolean(on));
    try {
      localStorage.setItem(STORAGE_KEY, String(Boolean(on)));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      if (next) {
        const audio = cache.current.click?.cloneNode();
        if (audio) {
          audio.volume = 0.28;
          audio.play().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider
      value={{ soundEnabled, toggleSound, setSound, playHover, playClick, playOpen, playTransition }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
