import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProject, getProjectNeighbours, padIndex, portfolioData } from '../data/portfolioData';
import { useDocumentTitle } from '../hooks/useUI';
import { useSound } from '../context/SoundContext';
import { useProjectTheme } from '../hooks/useProjectTheme';
import { CASE } from '../lib/caseLayout';
import { releaseGlassReveal } from '../components/layout/GlassReveal';
import { IconArrowLeft, IconArrowRight, IconArrowUpRight } from '../components/Icons';
import { capitalize, madeFor } from '../lib/projectText';
import { Ambience } from '../components/backdrops/Ambience';
import { NotFound } from './NotFound';

const { site, projects } = portfolioData;

/*
 * Página do projeto.
 * Ordem de entrada: menu e post (centro) → minimapa (direita) → informações
 * (esquerda), que abre por último, com um feixe de vidro, quando tudo carregou.
 * Anterior/próximo ficam no painel e no fim do post: dá para passar de um
 * projeto para outro sem voltar para Projetos.
 */
export function Project() {
  const { slug } = useParams();
  const project = getProject(slug);
  const { previous, next } = getProjectNeighbours(slug);
  const { playHover, playClick } = useSound();
  const theme = useProjectTheme(project, (project?.index ?? 1) - 1);
  const [postReady, setPostReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTop, setInfoTop] = useState(260);
  const postRef = useRef(null);
  const mapRef = useRef(null);
  const lensRef = useRef(null);

  useDocumentTitle(
    project ? `${capitalize(project.title)} — ${site.name}` : `Não encontrado — ${site.name}`,
  );

  // reinicia a sequência ao trocar de projeto
  useEffect(() => {
    setPostReady(false);
    setMapReady(false);
    setInfoOpen(false);
  }, [slug]);

  // o painel de informações fica sempre logo abaixo do menu
  useEffect(() => {
    const measure = () => {
      const menu = document.querySelector('.nav__menu');
      if (menu) setInfoTop(Math.round(menu.getBoundingClientRect().bottom + 12));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // a bolha de vidro do clique só some quando o post já está na tela
  useEffect(() => {
    if (postReady) releaseGlassReveal();
  }, [postReady]);

  // sequência de entrada
  useEffect(() => {
    if (!postReady) return undefined;
    const timers = [window.setTimeout(() => setMapReady(true), 350)];
    const openInfo = () => timers.push(window.setTimeout(() => setInfoOpen(true), 650));
    if (document.readyState === 'complete') openInfo();
    else window.addEventListener('load', openInfo, { once: true });
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('load', openInfo);
    };
  }, [postReady]);

  // minimapa: retângulo do trecho visível do post
  const syncLens = useCallback(() => {
    const post = postRef.current;
    const lens = lensRef.current;
    if (!post || !lens) return;
    const box = post.getBoundingClientRect();
    const top = Math.max(0, -box.top / box.height);
    const size = Math.min(1 - top, window.innerHeight / box.height);
    lens.style.top = `${top * 100}%`;
    lens.style.height = `${Math.max(0, size) * 100}%`;
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncLens);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    syncLens();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [syncLens, postReady]);

  // clicar num ponto do minimapa rola o site até ele
  const goTo = (event) => {
    const post = postRef.current;
    const map = mapRef.current;
    if (!post || !map) return;
    const mapBox = map.getBoundingClientRect();
    const fraction = (event.clientY - mapBox.top) / mapBox.height;
    const postBox = post.getBoundingClientRect();
    const target = window.scrollY + postBox.top + fraction * postBox.height - window.innerHeight / 2;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' });
    playClick();
  };

  const onMapKey = (event) => {
    const step = { ArrowDown: 0.6, ArrowUp: -0.6, PageDown: 1, PageUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    window.scrollBy({ top: step * window.innerHeight, behavior: 'smooth' });
  };

  if (!project) return <NotFound />;

  return (
    <main
      className={`case${mapReady ? ' is-map-ready' : ''}${infoOpen ? ' is-info-open' : ''}`}
      id="main"
      data-tone={theme.isDark ? 'dark' : 'light'}
      style={{
        '--case-bg': theme.background,
        '--case-left': `${CASE.left}px`,
        '--case-right': `${CASE.right}px`,
        '--case-gap': `${CASE.gap}px`,
        '--case-top': `${CASE.top}px`,
        '--case-info-top': `${infoTop}px`,
      }}
    >
      <Ambience project={project} dark={theme.isDark} fixed />

      <figure className="case__post" ref={postRef}>
        <img
          src={project.post}
          srcSet={`${project.postSmall} 800w, ${project.post} 1400w`}
          sizes="(max-width: 1099px) 100vw, 62vw"
          decoding="async"
          alt={`${capitalize(project.title)}: apresentação do projeto`}
          onLoad={() => setPostReady(true)}
          ref={(img) => {
            if (img?.complete && img.naturalWidth) setPostReady(true);
          }}
        />
      </figure>

      <aside className="case__map glass" aria-label="Mapa do projeto: clique para ir ao trecho">
        <div
          className="case__map-frame"
          ref={mapRef}
          onClick={goTo}
          onKeyDown={onMapKey}
          role="slider"
          tabIndex={0}
          aria-label="Navegar pelo projeto"
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <img src={project.postSmall} alt="" draggable="false" decoding="async" />
          <span className="case__map-lens" ref={lensRef} aria-hidden="true" />
        </div>
      </aside>

      <aside className="case__info glass" aria-hidden={!infoOpen}>
        <span className="case__count">
          {project.number} / {padIndex(projects.length)}
        </span>
        <h1 className="case__title">{project.title}</h1>
        <p className="case__for">{madeFor(project)}</p>

        <section className="case__block">
          <h2>Sobre</h2>
          <p>{project.description}</p>
        </section>

        <section className="case__block">
          <h2>Cores</h2>
          <ul className="case__colors">
            {project.colors.map((color) => (
              <li key={color} title={color.toUpperCase()}>
                <i style={{ background: color }} />
                <span>{color.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="case__block case__block--row">
          <div>
            <h2>Tipografia</h2>
            <p>{project.typography.join(' + ')}</p>
          </div>
          <div>
            <h2>Lançamento</h2>
            <p>{project.date}</p>
          </div>
        </section>

        {project.liveUrl ? (
          <a
            className="case__visit"
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={playHover}
            tabIndex={infoOpen ? 0 : -1}
          >
            Visitar site <IconArrowUpRight size={12} />
          </a>
        ) : (
          <span className="case__visit is-disabled" aria-disabled="true">
            Site em breve
          </span>
        )}

        <nav className="case__pager" aria-label="Outros projetos">
          <Link
            to={`/project/${previous.slug}`}
            onMouseEnter={playHover}
            onClick={playClick}
            tabIndex={infoOpen ? 0 : -1}
            aria-label={`Projeto anterior: ${capitalize(previous.title)}`}
          >
            <IconArrowLeft size={12} />
            <span>{capitalize(previous.title)}</span>
          </Link>
          <Link
            to={`/project/${next.slug}`}
            onMouseEnter={playHover}
            onClick={playClick}
            tabIndex={infoOpen ? 0 : -1}
            aria-label={`Próximo projeto: ${capitalize(next.title)}`}
          >
            <span>{capitalize(next.title)}</span>
            <IconArrowRight size={12} />
          </Link>
        </nav>
      </aside>

      {/* fim do post: segue direto para o próximo projeto */}
      <Link className="case__next" to={`/project/${next.slug}`} onMouseEnter={playHover} onClick={playClick}>
        <span className="case__next-label">Próximo projeto</span>
        <strong className="case__next-title">{next.title}</strong>
        <span className="case__next-cat">{next.category}</span>
        <IconArrowRight size={22} className="case__next-arrow" />
      </Link>
    </main>
  );
}
