import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { playGlassReveal } from '../components/layout/GlassReveal';
import { casePostRect } from '../lib/caseLayout';
import { madeFor } from '../lib/projectText';
import { hasWebGL } from '../lib/webgl';
import { loadIntro, useIntroDone } from '../lib/intro';
import { getTier, noteTransition, useTier } from '../lib/perfTier';
import { portfolioData, padIndex } from '../data/portfolioData';
import { useBodyLock, useDocumentTitle, useMediaQuery, usePrefersReducedMotion } from '../hooks/useUI';
import { useSound } from '../context/SoundContext';
import { ProjectBackdrop } from '../components/backdrops/ProjectBackdrop';
import { CardStack } from '../components/work/CardStack';
import { useProjectTheme } from '../hooks/useProjectTheme';
import { IconArrowLeft, IconArrowRight } from '../components/Icons';

const { site, projects } = portfolioData;
const total = projects.length;

// three.js fica fora do pacote inicial: baixa logo depois que Projetos abre.
const SpaceTunnel = lazy(() => import('../components/work/SpaceTunnel'));

const VIEW_KEY = 'orvion:work-view';
const VIEWS = [
  { id: 'space', label: 'Espacial' },
  { id: 'stack', label: 'Sanfona' },
];

// vista escolhida antes pela pessoa; sem escolha, aparelho fraco (nível baixo)
// começa na Sanfona, bem mais leve que o túnel 3D (dá para trocar no botão)
const readView = () => {
  let saved = null;
  try {
    saved = localStorage.getItem(VIEW_KEY);
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  if (saved === 'stack' || saved === 'space') return saved;
  return getTier() === 'baixo' ? 'stack' : 'space';
};

/*
 * Projetos: tela cheia, sem rolagem de página. Duas vistas:
 * - Espacial: as capas flutuam num túnel 3D e a câmera vai até a do foco.
 * - Sanfona: as capas empilhadas uma atrás da outra.
 * Nada avança sozinho: rolar, deslizar, as setas e os botões passam um
 * projeto por vez. O fundo assume o tema do projeto em foco.
 */
export function Work() {
  const [webgl] = useState(hasWebGL);
  const [view, setView] = useState(readView);
  const space = view === 'space' && webgl;
  const tier = useTier();
  const introDone = useIntroDone();
  // o túnel (three.js + 14 texturas) só monta depois da abertura: durante ela a
  // Sanfona-ponte segura a tela. No nível baixo, só monta se a vista for Espacial.
  const tunnel = webgl && introDone && (space || tier !== 'baixo');
  const [switched, setSwitched] = useState(false); // troca de vista nesta visita: anima a passagem
  // ponte: a Sanfona fica por cima do 3D até o primeiro quadro dele ficar pronto,
  // e some devagar enquanto as capas se separam (nada pisca nem some na troca)
  const [bridge, setBridge] = useState(space ? 'on' : 'off');
  const [focus, setFocus] = useState(0);
  const [hovered, setHovered] = useState(null);
  const controls = useRef(null);
  const reduced = usePrefersReducedMotion();
  const { playClick, playHover, playOpen, soundEnabled } = useSound();
  const navigate = useNavigate();
  const opening = useRef(false);
  const project = projects[focus];
  const theme = useProjectTheme(project, focus);
  // sem hover (celular/tablet): a ficha mostra sempre o projeto em foco
  const compact = useMediaQuery('(max-width: 1099px), (hover: none)');
  const info = compact ? project : hovered === null ? null : projects[hovered];

  // ambiente lo-fi japonês bem baixo enquanto Projetos está aberto e o som está ligado
  useEffect(() => {
    if (!soundEnabled) {
      window.OrvionLofi?.stop();
      return undefined;
    }
    let alive = true;
    // o navegador só libera o áudio depois de um gesto: tenta de novo no primeiro clique/tecla
    const wake = () => window.OrvionSound?.resume();
    loadIntro().then(() => {
      if (alive) window.OrvionLofi.start();
    });
    window.addEventListener('pointerdown', wake, { once: true });
    window.addEventListener('keydown', wake, { once: true });
    return () => {
      alive = false;
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.OrvionLofi?.stop();
    };
  }, [soundEnabled]);

  useDocumentTitle(`Projetos — ${site.name}`);
  useBodyLock(true);

  const changeView = (next) => {
    if (next === view) return;
    playClick();
    setHovered(null);
    setSwitched(true);
    setBridge(next === 'space' && webgl ? 'on' : 'off');
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  };

  // clique no projeto em foco: bolha de vidro e depois a página do projeto
  const openProject = async (index) => {
    if (opening.current) return;
    opening.current = true;
    const target = projects[index];
    playOpen?.();
    setHovered(null); // fecha a ficha antes da bolha
    await playGlassReveal({ src: target.hero, rect: casePostRect(), bg: theme.background });
    navigate(`/project/${target.slug}`, { state: { glass: true } });
  };

  useEffect(() => {
    if (bridge === 'off') return undefined;
    // túnel ainda não montado (abertura rodando): a ponte fica, sem prazo
    if (bridge === 'on' && !tunnel) return undefined;
    // 'fading': some em 0,5 s. 'on': se o 3D demorar demais (aba em segundo plano,
    // placa de vídeo lenta), a ponte sai mesmo assim para não ficar na frente
    const id = window.setTimeout(() => setBridge(bridge === 'fading' ? 'off' : 'fading'), bridge === 'fading' ? 500 : 12000);
    return () => window.clearTimeout(id);
  }, [bridge, tunnel]);

  // um projeto para frente ou para trás, nas duas vistas
  const move = (dir) => {
    if (space && controls.current) controls.current.step(dir);
    else setFocus((f) => (f + dir + total) % total);
  };

  const step = (dir) => move(dir);

  // som de clique a cada troca de projeto, venha de onde vier: setas, rolagem,
  // deslize, teclado ou clique numa capa de trás
  const lastFocus = useRef(focus);
  useEffect(() => {
    if (lastFocus.current === focus) return;
    lastFocus.current = focus;
    playClick();
    noteTransition(); // mede o FPS da troca e rebaixa o nível se o aparelho não aguentar
  }, [focus, playClick]);

  const stack = (
    <CardStack
      projects={projects}
      focus={focus}
      onStep={move}
      onSelect={setFocus}
      onOpen={openProject}
      onHover={setHovered}
      gather={switched}
      reduced={reduced}
    />
  );

  return (
    <main
      className="home work-stage"
      id="main"
      data-view={view}
      data-tone={theme.isDark ? 'dark' : 'light'}
      style={{ '--theme-accent': theme.accent }}
    >
      <ProjectBackdrop theme={theme} project={project} activeKey={project.slug} reduced={reduced} />

      {/* o 3D fica montado nas duas vistas (só roda na Espacial): voltar para ela é imediato */}
      {tunnel && (
        <Suspense fallback={null}>
          <SpaceTunnel
            projects={projects}
            initial={focus}
            intro={!reduced}
            active={space}
            className="work-stage__canvas"
            onReady={() => setBridge((b) => (b === 'on' ? 'fading' : b))}
            onFocusChange={setFocus}
            onHoverChange={setHovered}
            onOpen={openProject}
            controlsRef={controls}
          />
        </Suspense>
      )}

      {!space && stack}

      {space && bridge !== 'off' && (
        <CardStack
          projects={projects}
          focus={focus}
          interactive={false}
          className={`is-bridge${bridge === 'fading' ? ' is-done' : ''}`}
          reduced={reduced}
        />
      )}

      {/* ficha no body: fica na frente de tudo, inclusive do menu e da caixa de som */}
      {info &&
        createPortal(
          <aside
            className={`work-info glass${compact ? ' work-info--compact' : ''}`}
            // no celular a caixa fica parada e só o texto troca; no desktop ela abre a cada hover
            key={compact ? 'compact' : info.slug}
            data-tone={theme.isDark ? 'dark' : 'light'}
            aria-live="polite"
          >
            <span className="work-info__kicker">
              {hovered === focus
                ? 'Clique para abrir o projeto'
                : view === 'stack'
                  ? 'Clique para trazer para frente'
                  : 'Clique para trazer ao centro'}
            </span>
            <h2 className="work-info__title">{info.title}</h2>
            <p className="work-info__for work-info__swap" key={info.slug}>
              {madeFor(info)}
            </p>

            <dl className="work-info__rows">
              <div>
                <dt>Objetivo</dt>
                <dd>{info.description}</dd>
              </div>
              <div>
                <dt>Tipografia</dt>
                <dd>{info.typography.join(' + ')}</dd>
              </div>
              <div>
                <dt>Papel</dt>
                <dd>{info.roles.join(', ')}</dd>
              </div>
              <div>
                <dt>Lançamento</dt>
                <dd>{info.date}</dd>
              </div>
            </dl>

            <div className="work-info__palette">
              {info.colors.map((color) => (
                <span key={color}>
                  <i style={{ background: color }} />
                  {color.toUpperCase()}
                </span>
              ))}
            </div>
          </aside>,
          document.body,
        )}

      <div className="work-stage__caption glass">
        <button
          type="button"
          className="work-stage__nav"
          onClick={() => step(-1)}
          onMouseEnter={playHover}
          aria-label="Projeto anterior"
        >
          <IconArrowLeft size={14} />
        </button>
        <span className="work-stage__count">
          {padIndex(focus + 1)}
          <span>/{padIndex(total)}</span>
        </span>
        <span className="work-stage__name blur-in" key={project.slug} aria-live="polite">
          <strong>{project.title}</strong>
          <span>{project.category}</span>
        </span>
        <span className="work-stage__palette" aria-hidden="true">
          {project.colors.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </span>
        <button
          type="button"
          className="work-stage__nav"
          onClick={() => step(1)}
          onMouseEnter={playHover}
          aria-label="Próximo projeto"
        >
          <IconArrowRight size={14} />
        </button>
      </div>

      {/* sem WebGL só existe a Sanfona: não há o que trocar */}
      {webgl && (
        <div className="work-view glass" role="radiogroup" aria-label="Modo de exibição dos projetos">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={view === item.id}
              className={view === item.id ? 'is-active' : ''}
              onClick={() => changeView(item.id)}
              onMouseEnter={playHover}
            >
              <ViewIcon id={item.id} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <p className="work-stage__hint">Role ou use as setas para trocar de projeto</p>
    </main>
  );
}

function ViewIcon({ id }) {
  return id === 'space' ? (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <rect x="1.5" y="5" width="6" height="5" rx="1" fill="none" stroke="currentColor" />
      <rect x="9" y="2" width="5.5" height="4" rx="1" fill="none" stroke="currentColor" opacity=".6" />
      <rect x="9.5" y="10" width="4" height="3.5" rx="1" fill="none" stroke="currentColor" opacity=".4" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <rect x="3.5" y="1.5" width="9" height="3" rx="1" fill="none" stroke="currentColor" opacity=".4" />
      <rect x="2.5" y="4" width="11" height="3.5" rx="1" fill="none" stroke="currentColor" opacity=".65" />
      <rect x="1.5" y="7" width="13" height="7.5" rx="1.2" fill="none" stroke="currentColor" />
    </svg>
  );
}
