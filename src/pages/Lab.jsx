import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { portfolioData } from '../data/portfolioData';
import { useDocumentTitle, useMediaQuery, usePrefersReducedMotion } from '../hooks/useUI';
import { useTier } from '../lib/perfTier';
import { useSound } from '../context/SoundContext';
import { IconArrowUpRight } from '../components/Icons';
import { ProjectCover } from '../components/ProjectCover';

const { site, projects } = portfolioData;

const RowTag = site.projectPagesEnabled ? Link : 'div';
const rowProps = (project) =>
  site.projectPagesEnabled ? { to: `/project/${project.slug}` } : { tabIndex: 0 };

/*
 * Lente de vidro líquido (@ybouane/liquidglass): desliza sobre a lista,
 * refrata os títulos por baixo e mostra capa, nome e paleta do projeto.
 * Só liga com mouse, sem "reduzir movimento" e no nível alto de aparelho;
 * senão cai na prévia simples.
 */
const LENS_CONFIG = {
  cornerRadius: 30,
  zRadius: 30,
  refraction: 0.85,
  chromAberration: 0.08,
  edgeHighlight: 0.12,
  specular: 0.25,
  fresnel: 1,
  blurAmount: 0.45,
  brightness: 0.1,
  saturation: 0.15,
  shadowOpacity: 0.28,
  shadowSpread: 18,
  shadowOffsetY: 10,
};

export function Lab() {
  const [preview, setPreview] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [lensReady, setLensReady] = useState(false);
  const reduced = usePrefersReducedMotion();
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const { playHover } = useSound();
  const listRef = useRef(null);
  const lensRef = useRef(null);
  const glassRef = useRef(null);
  const tier = useTier();
  // a lente é WebGL por cima da lista: só no nível alto (nos outros, a prévia simples)
  const lensEnabled = finePointer && !reduced && tier === 'alto';

  useDocumentTitle(`Laboratório — ${site.name}`);

  useEffect(() => {
    projects.forEach((project) => {
      if (!project.cover) return;
      const image = new Image();
      image.src = project.cover;
    });
  }, []);

  useEffect(() => {
    if (!lensEnabled || !listRef.current || !lensRef.current) return undefined;
    let cancelled = false;

    lensRef.current.dataset.config = JSON.stringify(LENS_CONFIG);
    import('@ybouane/liquidglass')
      .then(({ LiquidGlass }) =>
        LiquidGlass.init({ root: listRef.current, glassElements: [lensRef.current] }),
      )
      .then((instance) => {
        if (cancelled) {
          instance.destroy();
          return;
        }
        glassRef.current = instance;
        setLensReady(true);
      })
      .catch(() => setLensReady(false));

    return () => {
      cancelled = true;
      glassRef.current?.destroy();
      glassRef.current = null;
      setLensReady(false);
    };
  }, [lensEnabled]);

  const moveLens = useCallback((event) => {
    const list = listRef.current;
    const lens = lensRef.current;
    if (!list || !lens) return;
    const box = list.getBoundingClientRect();
    const x = event.clientX - box.left - lens.offsetWidth / 2;
    const y = event.clientY - box.top - lens.offsetHeight / 2;
    lens.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    glassRef.current?.markChanged(lens);
  }, []);

  const showPreview = (project, event) => {
    setPreview(project);
    setPointer({ x: event.clientX, y: event.clientY });
  };

  return (
    <main className="page" id="main">
      <header className="page-head grid16">
        <span className="page-head__eyebrow">Tudo feito pela OrvionWeb</span>
        <h1 className="page-title">Laboratório</h1>
        <p className="page-intro">
          Sites, estudos e experimentos da OrvionWeb. Por enquanto, os {projects.length} sites
          conceituais para clínicas e profissionais de saúde.
        </p>
      </header>

      <section
        className={`work-list${lensReady ? ' has-lens' : ''}`}
        aria-label="Todos os projetos"
        ref={listRef}
        onMouseMove={lensReady ? moveLens : undefined}
        onMouseLeave={() => setPreview(null)}
      >
        {projects.map((project) => (
          <RowTag
            key={project.slug}
            {...rowProps(project)}
            className="work-row"
            onMouseEnter={(event) => {
              playHover();
              showPreview(project, event);
            }}
            onMouseMove={
              lensReady ? undefined : (event) => setPointer({ x: event.clientX, y: event.clientY })
            }
            onFocus={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              setPreview(project);
              setPointer({ x: window.innerWidth - box.height * 0.5, y: box.top + box.height * 0.5 });
            }}
            onBlur={() => setPreview(null)}
          >
            <span className="work-row__index">{project.number}</span>
            <span className="work-row__title">{project.title}</span>
            <span className="work-row__cat">{project.category}</span>
            <span className="work-row__year">{project.year}</span>
            <span className="work-row__rec">{project.typography.join(' + ')}</span>
            <span className="work-row__arrow">
              {site.projectPagesEnabled && <IconArrowUpRight size={11} />}
            </span>
            <span className="work-row__thumb">
              <ProjectCover project={project} />
            </span>
          </RowTag>
        ))}

        {lensEnabled && (
          <div
            ref={lensRef}
            className={`work-lens${lensReady && preview ? ' is-on' : ''}`}
            aria-hidden="true"
          >
            {preview && (
              <>
                <div className="work-lens__cover">
                  <ProjectCover project={preview} />
                </div>
                <div className="work-lens__meta">
                  <span className="work-lens__title">{preview.title}</span>
                  <span className="work-lens__palette">
                    {preview.colors.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <div className="work-end grid16">
        <p>
          Quer um site assim para a sua clínica? Estou com agenda aberta para novos projetos.
        </p>
        <Link to="/contact" className="pill">
          Começar um projeto <IconArrowUpRight size={12} />
        </Link>
      </div>

      <AnimatePresence>
        {preview && !reduced && !lensReady && (
          <motion.div
            className="work-preview"
            style={{ left: pointer.x, top: pointer.y }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          >
            <ProjectCover project={preview} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
