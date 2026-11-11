import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { bindStepInput } from '../../lib/stepInput';
import { ProjectCover } from '../ProjectCover';

/*
 * Vista "Sanfona": as capas empilhadas uma atrás da outra. A da frente é o
 * projeto em foco; as de trás aparecem em degraus acima dela, menores.
 * Rolar, deslizar, as setas e os botões passam um projeto por vez.
 *
 * Leve para o celular: só existem na tela as capas da janela [anterior .. 5 atrás].
 * Imagem só na capa em foco, na de trás e na que acabou de sair; as outras são
 * "vultos" (um retângulo nas cores do projeto), sem imagem e sem filtro de
 * desfoque animado. A cada troca a janela anda uma posição e carrega só a
 * próxima capa de trás.
 *
 * A capa da frente tem o tamanho e o lugar da capa em foco na vista Espacial
 * (ver o CSS de .card-stack). Vinda da Espacial (gather), as de trás saem de
 * onde flutuavam e se juntam na pilha.
 */
const FALLBACK_RATIO = 1616 / 1264;
const ratios = new Map(); // proporção de cada capa, guardada ao carregar
const BEHIND = 4; // degraus visíveis atrás da da frente
const STEP_Y = 4.5; // % da altura da capa que cada degrau sobe

const place = (k) => {
  // saindo: cresce um pouco e se dissolve no lugar
  if (k < 0) return { x: 0, rotate: 0, y: '-2%', scale: 1.06, opacity: 0, zIndex: 20 };
  // logo além da pilha: invisível, pronta para entrar no último degrau
  if (k > BEHIND) return { x: 0, rotate: 0, y: `${-BEHIND * STEP_Y}%`, scale: 1 - BEHIND * 0.07, opacity: 0, zIndex: 0 };
  return {
    x: 0,
    rotate: 0,
    y: `${-k * STEP_Y}%`,
    scale: 1 - k * 0.07,
    opacity: k === 0 ? 1 : k === 1 ? 0.78 : Math.max(0.2, 0.6 - (k - 2) * 0.16),
    zIndex: 20 - k,
  };
};

// de onde cada capa de trás parte quando a pilha se forma (perto de onde flutuava)
const scattered = (k) => {
  const angle = k * 2.399963;
  return {
    x: `${Math.cos(angle) * 30}vw`,
    y: `${Math.sin(angle) * 24}vh`,
    scale: 0.42,
    rotate: Math.sin(angle) * 5,
    opacity: 0.55,
  };
};

const SPRING = { type: 'spring', stiffness: 140, damping: 24, mass: 0.9 };

export function CardStack({
  projects,
  focus,
  onStep,
  onSelect,
  onOpen,
  onHover,
  gather = false,
  interactive = true,
  className = '',
  reduced = false,
}) {
  const wrapRef = useRef(null);
  const stepRef = useRef(onStep);
  const [gathering, setGathering] = useState(gather && !reduced);
  const [, setLoaded] = useState(0); // redesenha quando uma proporção nova chega
  const total = projects.length;

  useEffect(() => {
    if (!gathering) return undefined;
    const id = window.setTimeout(() => setGathering(false), 1200);
    return () => window.clearTimeout(id);
  }, [gathering]);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || !interactive) return undefined;
    return bindStepInput(node, (dir) => stepRef.current?.(dir));
  }, [interactive]);

  return (
    <div
      ref={wrapRef}
      className={`card-stack${className ? ` ${className}` : ''}`}
      aria-hidden={interactive ? undefined : true}
      onPointerLeave={() => onHover?.(null)}
    >
      {projects.map((project, index) => {
        // distância até o foco, na ordem circular (o anterior fica em -1)
        let k = (index - focus + total) % total;
        if (k === total - 1) k = -1;
        if (k > BEHIND + 1) return null; // fora da janela: nem existe na página
        const front = k === 0;
        // foco, a de trás e a que acabou de sair. Na ponte (por baixo da abertura)
        // só as 2 primeiras: a "que saiu" é invisível e não precisa ser baixada
        const withImage = k >= (interactive ? -1 : 0) && k <= 1;
        // a capa da frente já nasce no lugar: nunca some nem muda ao trocar de vista
        const from = gathering && !front && k > 0 && k <= BEHIND ? scattered(k) : false;
        const [c0, c1] = project.colors;
        return (
          <motion.button
            type="button"
            key={project.slug}
            className={`card-stack__card${front ? ' is-front' : ''}${withImage ? '' : ' is-ghost'}`}
            initial={from}
            animate={place(k)}
            transition={reduced ? { duration: 0 } : SPRING}
            style={{
              '--r': ratios.get(project.cover) ?? FALLBACK_RATIO,
              pointerEvents: interactive && k >= 0 && k <= BEHIND ? 'auto' : 'none',
            }}
            tabIndex={interactive && front ? 0 : -1}
            aria-label={front ? `Abrir o projeto ${project.title}` : `Trazer ${project.title} para frente`}
            onClick={() => (front ? onOpen?.(index) : onSelect?.(index))}
            onPointerEnter={() => interactive && onHover?.(index)}
          >
            {!withImage ? (
              <span className="card-stack__ghost" style={{ '--g0': c0, '--g1': c1 }} />
            ) : project.cover ? (
              <img
                src={project.cover}
                alt=""
                draggable="false"
                decoding="async"
                fetchPriority={front ? 'high' : 'low'} // a capa da frente é o LCP de Projetos
                onLoad={(e) => {
                  const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                  if (w && h && ratios.get(project.cover) !== w / h) {
                    ratios.set(project.cover, w / h);
                    setLoaded((n) => n + 1);
                  }
                }}
              />
            ) : (
              <ProjectCover project={project} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
