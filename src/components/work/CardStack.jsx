import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { bindStepInput } from '../../lib/stepInput';
import { ProjectCover } from '../ProjectCover';

/*
 * Vista "Sanfona": as capas empilhadas uma atrás da outra. A da frente é o
 * projeto em foco; as de trás aparecem em degraus acima dela, menores e
 * desfocadas. Rolar, deslizar, as setas e os botões passam um projeto por vez;
 * a da frente cai para fora e a próxima sobe para o lugar dela.
 *
 * A capa da frente tem exatamente o tamanho e o lugar da capa em foco na vista
 * Espacial (ver o CSS de .card-stack), então ela não muda ao trocar de vista.
 * Vinda da Espacial (gather), só as capas de trás se movem: saem de onde
 * flutuavam e se juntam na pilha, todas ao mesmo tempo.
 *
 * As capas de trás têm todas o mesmo tamanho (pilha organizada); só a da frente
 * assume a proporção real da sua capa, e a troca de tamanho é animada no CSS.
 */
const FALLBACK_RATIO = 1616 / 1264;
const ratios = new Map(); // proporção de cada capa, guardada ao carregar
const BEHIND = 4; // capas visíveis atrás da da frente
const STEP_Y = 4.5; // % da altura da capa que cada degrau sobe

const place = (k) => {
  // saindo: cresce um pouco e se dissolve no lugar (não cai sobre as caixas de baixo)
  if (k < 0) return { x: 0, rotate: 0, y: '-2%', scale: 1.08, opacity: 0, filter: 'blur(4px)', zIndex: 20 };
  if (k > BEHIND)
    return { x: 0, rotate: 0, y: `${-BEHIND * STEP_Y}%`, scale: 1 - BEHIND * 0.07, opacity: 0, filter: 'blur(6px)', zIndex: 0 };
  return {
    x: 0,
    rotate: 0,
    y: `${-k * STEP_Y}%`,
    scale: 1 - k * 0.07,
    opacity: k === 0 ? 1 : Math.max(0.22, 0.8 - k * 0.15),
    filter: k === 0 ? 'blur(0px)' : `blur(${Math.min(4, k * 1)}px)`,
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
    filter: 'blur(3px)',
  };
};

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 1 };

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
        const front = k === 0;
        // a capa da frente já nasce no lugar: nunca some nem muda ao trocar de vista
        const from = gathering && !front && k > 0 && k <= BEHIND ? scattered(k) : false;
        return (
          <motion.button
            type="button"
            key={project.slug}
            className={`card-stack__card${front ? ' is-front' : ''}`}
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
            {project.cover ? (
              <img
                src={project.cover}
                alt=""
                draggable="false"
                loading={k <= 2 ? 'eager' : 'lazy'}
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
