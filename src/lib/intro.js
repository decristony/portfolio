/*
 * Carrega a abertura e o motor de som (public/intro/intro.js + intro.css) uma
 * vez só. É um script sem build, compartilhado com a prévia preview/abertura.html.
 */
import { asset } from './asset';

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
