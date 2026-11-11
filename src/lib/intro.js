/*
 * Carrega a abertura e o motor de som (public/intro/intro.js + intro.css) uma
 * vez só. É um script sem build, compartilhado com a prévia preview/abertura.html.
 */
import { useEffect, useState } from 'react';
import { asset } from './asset';

/*
 * A abertura (iniciada pelo index.html) já terminou? Enquanto ela roda, o site
 * monta só o leve por trás; o que é pesado (túnel 3D: three.js + 14 texturas)
 * espera este sinal, para não travar o celular nem engasgar a digitação.
 * Sem abertura nesta visita, responde "sim" na hora.
 */
const introRunning = () => {
  const boot = typeof window !== 'undefined' ? window.__oiBoot : null;
  return Boolean(boot && !boot.done);
};

export function useIntroDone() {
  const [done, setDone] = useState(() => !introRunning());
  useEffect(() => {
    if (done) return undefined;
    const boot = window.__oiBoot;
    const finish = () => setDone(true);
    // terminou entre o render e este efeito: avisa no próximo tique
    if (!boot || boot.done) {
      queueMicrotask(finish);
      return undefined;
    }
    boot.waiters.push(finish);
    return () => {
      boot.waiters = boot.waiters.filter((fn) => fn !== finish);
    };
  }, [done]);
  return done;
}

let loading = null;

export function loadIntro() {
  if (window.OrvionIntro) return Promise.resolve(window);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = asset('/intro/intro.css');
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = asset('/intro/intro.js');
    js.async = true;
    js.onload = () => resolve(window);
    js.onerror = reject;
    document.head.appendChild(js);
  });
  return loading;
}
