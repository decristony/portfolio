import { PulseBackdrop } from './PulseBackdrop';
import { StarsBackdrop } from './StarsBackdrop';

/*
 * Ambiente de cada projeto: uma cena viva, feita a partir da capa, que fica
 * atrás do conteúdo em Projetos (projeto em foco) e na página do projeto.
 * As cores vêm da paleta do projeto (--a1..--a4) e o tom (claro/escuro) do
 * fundo decide a cor das linhas (--ink). O movimento é quase todo CSS
 * (@property, gradientes cônicos, máscaras, offset-path, SVG com stroke-dash);
 * só o pulso e o céu estrelado usam canvas.
 */
const SCENE = {
  'tez-dermatologia-estetica': 'skin',
  'compasso-cardiologia': 'pulse',
  'nervura-neurologia': 'synapse',
  'ciranda-pediatria': 'growth',
  'clareira-psicologia': 'breath',
  'passada-medicina-esportiva': 'speed',
  'sereno-clinica-do-sono': 'stars',
  'iris-oftalmologia': 'focus',
  'marfim-odontologia': 'marble',
  'faro-clinica-veterinaria': 'paws',
  'raiz-fisioterapia-pilates': 'roots',
  'colo-obstetricia': 'cotton',
  'meridiano-acupuntura': 'meridian',
  'timbre-otorrino-audiologia': 'sound',
};

export const sceneFor = (project) => (project ? SCENE[project.slug] : undefined);

/* curva senoidal em SVG (para ondas e linhas) */
const wave = (w, h, amp, periods, phase = 0, steps = 160) => {
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * w;
    const y = h / 2 + Math.sin((i / steps) * periods * Math.PI * 2 + phase) * amp;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

/* ramos que se dividem (nervos e raízes) a partir de uma origem */
const branches = (x, y, angle, length, depth, seed, out = []) => {
  if (depth === 0 || length < 12) return out;
  const rand = (n) => {
    const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const bend = (rand(1) - 0.5) * 0.9;
  const x2 = x + Math.cos(angle) * length;
  const y2 = y + Math.sin(angle) * length;
  const cx = x + Math.cos(angle + bend) * length * 0.55;
  const cy = y + Math.sin(angle + bend) * length * 0.55;
  out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, depth });
  const spread = 0.35 + rand(2) * 0.4;
  branches(x2, y2, angle - spread, length * (0.62 + rand(3) * 0.15), depth - 1, seed * 1.7 + 1, out);
  branches(x2, y2, angle + spread, length * (0.62 + rand(4) * 0.15), depth - 1, seed * 2.3 + 2, out);
  return out;
};

const NERVES = [
  ...branches(-20, 180, 0.25, 260, 6, 1),
  ...branches(1460, 720, Math.PI + 0.2, 280, 6, 7),
  ...branches(700, -20, Math.PI / 2 + 0.1, 220, 5, 3),
];
const ROOTS = [
  ...branches(260, 920, -Math.PI / 2 - 0.15, 230, 6, 4),
  ...branches(820, 920, -Math.PI / 2 + 0.05, 260, 7, 9),
  ...branches(1260, 920, -Math.PI / 2 + 0.2, 210, 6, 13),
];
const PET_NAMES = ['Luna', 'Thor', 'Mel', 'Amora', 'Theo', 'Pipoca', 'Nina', 'Bidu', 'Fred', 'Olívia', 'Loki', 'Bella', 'Chico', 'Paçoca', 'Zoe', 'Milo'];

function Scene({ scene, dark }) {
  switch (scene) {
    case 'skin':
      return (
        <>
          <div className="amb-skin__word amb-skin__word--outline">pele</div>
          <div className="amb-skin__word amb-skin__word--fill">pele</div>
          <svg className="amb-lines" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <path pathLength="1" className="amb-draw" d="M-40 760 C 260 520, 380 180, 760 120 S 1300 260, 1500 40" />
            <path pathLength="1" className="amb-draw amb-draw--late" d="M-40 880 C 420 760, 640 520, 980 560 S 1360 760, 1500 640" />
          </svg>
        </>
      );
    case 'pulse':
      return <PulseBackdrop color={dark ? '#F08A86' : '#B21E2D'} className="amb-canvas" />;
    case 'stars':
      return <StarsBackdrop className="amb-canvas amb-stars" />;
    case 'synapse':
      return (
        <svg className="amb-lines amb-synapse" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          {NERVES.map((n, i) => (
            <g key={n.d}>
              <path className="amb-synapse__nerve" d={n.d} style={{ opacity: 0.18 + n.depth * 0.05 }} />
              {i % 3 === 0 && (
                <path pathLength="1" className="amb-synapse__signal" d={n.d} style={{ animationDelay: `${(i * 0.37) % 4}s` }} />
              )}
            </g>
          ))}
        </svg>
      );
    case 'growth':
      return (
        <>
          <svg className="amb-lines" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <path pathLength="1" className="amb-draw amb-draw--slow" d="M-20 700 C 200 640, 260 560, 420 590 S 640 520, 760 470 S 1000 360, 1160 300 S 1380 180, 1480 120" />
          </svg>
          {/* marcos da infância ao longo da linha, como na capa */}
          {[
            ['primeiros dias', 12, 69],
            ['primeiros passos', 29, 65.5],
            ['primeiras conquistas', 53, 52],
            ['novos sonhos', 80.5, 33.5],
          ].map(([label, x, y], i) => (
            <span key={label} className="amb-growth__mark" style={{ left: `${x}%`, top: `${y}%`, '--i': i }}>
              <em>{label}</em>
            </span>
          ))}
          <span className="amb-growth__plane" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34">
              <path d="M2 11 22 3l-7 18-3-8-10-2Z M12 13 22 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </span>
          {[...Array(6)].map((_, i) => (
            <i key={i} className="amb-growth__spark" style={{ '--i': i }} />
          ))}
        </>
      );
    case 'breath':
      return (
        <>
          <div className="amb-breath__mist amb-breath__mist--a" />
          <div className="amb-breath__mist amb-breath__mist--b" />
          <div className="amb-breath__ring" />
          <div className="amb-breath__ring amb-breath__ring--2" />
          <div className="amb-breath__word">calma</div>
        </>
      );
    case 'speed':
      return (
        <>
          <div className="amb-speed__lanes" />
          {[...Array(7)].map((_, i) => (
            <i key={i} className="amb-speed__streak" style={{ '--i': i }} />
          ))}
          <div className="amb-speed__word">
            <span>FÔLEGO FÔLEGO FÔLEGO </span>
            <span>FÔLEGO FÔLEGO FÔLEGO </span>
          </div>
        </>
      );
    case 'focus':
      return (
        <div className="amb-focus">
          <div className="amb-focus__iris" />
          <div className="amb-focus__ring" />
          <div className="amb-focus__ring amb-focus__ring--2" />
          <div className="amb-focus__chart">E F P T O Z L P E D</div>
        </div>
      );
    case 'marble':
      return (
        <>
          <div className="amb-marble__stone" />
          <div className="amb-marble__sheen" />
        </>
      );
    case 'paws':
      return (
        <>
          <div className="amb-paws__names">
            {PET_NAMES.map((name, i) => (
              <span key={name} style={{ '--i': i }}>
                {name}
              </span>
            ))}
          </div>
          <div className="amb-paws__trail">
            {[...Array(10)].map((_, i) => (
              <svg key={i} className="amb-paws__print" style={{ '--i': i }} viewBox="0 0 40 40" width="30" height="30">
                <ellipse cx="20" cy="27" rx="9" ry="7.5" />
                <ellipse cx="9" cy="15" rx="3.6" ry="4.6" />
                <ellipse cx="16" cy="9" rx="3.6" ry="4.8" />
                <ellipse cx="24" cy="9" rx="3.6" ry="4.8" />
                <ellipse cx="31" cy="15" rx="3.6" ry="4.6" />
              </svg>
            ))}
          </div>
          <div className="amb-paws__light" />
        </>
      );
    case 'roots':
      return (
        <>
          <svg className="amb-lines amb-roots" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
            {ROOTS.map((r, i) => (
              <path
                key={r.d}
                pathLength="1"
                className="amb-roots__root"
                d={r.d}
                style={{ strokeWidth: 0.6 + r.depth * 0.45, animationDelay: `${(7 - r.depth) * 0.9 + (i % 5) * 0.12}s` }}
              />
            ))}
          </svg>
          <div className="amb-roots__word">
            <span>MOVA-SE SEM DOR · MOVA-SE SEM DOR · </span>
            <span>MOVA-SE SEM DOR · MOVA-SE SEM DOR · </span>
          </div>
        </>
      );
    case 'cotton':
      return (
        <>
          <div className="amb-cotton__word">espera</div>
          {[...Array(14)].map((_, i) => (
            <i key={i} className="amb-cotton__fleck" style={{ '--i': i }} />
          ))}
        </>
      );
    case 'meridian':
      return (
        <svg className="amb-lines amb-meridian" viewBox="0 0 1440 900" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 180 + i * 270;
            const d = `M${x} -20 C ${x + 90} 220, ${x - 90} 460, ${x + 40} 640 S ${x - 30} 860, ${x + 20} 940`;
            return (
              <g key={i}>
                <path className="amb-meridian__channel" d={d} />
                <path pathLength="1" className="amb-meridian__flow" d={d} style={{ animationDelay: `${i * 0.9}s` }} />
                {[0.18, 0.42, 0.66, 0.88].map((t, j) => (
                  <circle
                    key={t}
                    className="amb-meridian__point"
                    cx={x + Math.sin(t * 6 + i) * 46}
                    cy={t * 900}
                    r="4"
                    style={{ animationDelay: `${i * 0.9 + j * 0.6}s` }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      );
    case 'sound':
      return (
        <>
          <svg className="amb-lines amb-sound" viewBox="0 0 2880 900" preserveAspectRatio="none">
            {[
              [70, 4, 0, 0.55],
              [110, 3, 1.2, 0.35],
              [40, 6, 2.1, 0.45],
              [150, 2, 0.6, 0.2],
            ].map(([amp, periods, phase, op], i) => (
              <path
                key={i}
                className="amb-sound__wave"
                d={wave(2880, 900, amp, periods * 2, phase)}
                style={{ opacity: op }}
              />
            ))}
          </svg>
          <div className="amb-sound__ripples">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} style={{ '--i': i }} />
            ))}
          </div>
          <div className="amb-sound__word">ouvir</div>
        </>
      );
    default:
      return null;
  }
}

/*
 * fixed: na página do projeto a cena fica presa à tela, atrás do post.
 * Em Projetos ela fica dentro do fundo (absoluta), e troca com o projeto em foco.
 */
export function Ambience({ project, dark = false, fixed = false }) {
  const scene = sceneFor(project);
  if (!scene) return null;
  const [, a1, a2, a3, a4] = project.colors;
  return (
    <div
      className={`amb amb--${scene}${fixed ? ' amb--fixed' : ''}`}
      data-tone={dark ? 'dark' : 'light'}
      aria-hidden="true"
      style={{ '--a1': a1, '--a2': a2, '--a3': a3, '--a4': a4 }}
    >
      <Scene scene={scene} dark={dark} />
    </div>
  );
}
