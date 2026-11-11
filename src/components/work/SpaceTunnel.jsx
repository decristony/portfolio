/*
 * Vista "Espacial": túnel de projetos em 3D (base: "3d-gallery-photography" do 21st.dev).
 *
 * Como funciona:
 * - Os projetos ficam espalhados em profundidade, cada um num ponto (x, y),
 *   flutuando devagar. Nada avança sozinho.
 * - O projeto em foco fica no centro e a CÂMERA vai até ele.
 * - Cada gesto de rolagem, deslize, seta do teclado ou botão passa exatamente
 *   um projeto (para frente ou para trás).
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bindStepInput } from '../../lib/stepInput';
import { hasWebGL } from '../../lib/webgl';
import { useTier } from '../../lib/perfTier';

const COVER_ASPECT = 1616 / 1264;
const SPACING = 6; // distância entre projetos no túnel
const AHEAD = 7; // quantos projetos aparecem à frente do foco
const MAX_BLUR = 6;

const vertexShader = `
  uniform float scrollForce;
  uniform float time;
  uniform float waveT; // segundos desde que o mouse entrou (onda única)
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float curveIntensity = scrollForce * 0.3;
    float d = length(pos.xy);
    float curve = d * d * curveIntensity;
    float ripple = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02 + sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
    float flag = 0.0;
    if (waveT < 1.4) {
      // uma única onda: sobe, atravessa a capa e assenta em 1,4 s
      float env = sin(3.14159 * waveT / 1.4);
      float damp = smoothstep(-0.5, 0.5, pos.x);
      flag = sin(pos.x * 3.0 - waveT * 9.0) * 0.09 * env * damp;
    }
    pos.z -= (curve + ripple * abs(curveIntensity) * 2.0 + flag);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D map;
  uniform float opacity;
  uniform float blurAmount;
  uniform float aspect;       // largura / altura da capa
  uniform float cornerRadius; // raio do canto, em fração da altura
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (blurAmount > 0.01) {
      vec2 texel = 1.0 / vec2(textureSize(map, 0));
      vec4 sum = vec4(0.0);
      float total = 0.0;
      for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
          float w = 1.0 / (1.0 + length(vec2(x, y)));
          sum += texture2D(map, vUv + vec2(x, y) * texel * blurAmount) * w;
          total += w;
        }
      }
      color = sum / total;
    }
    // acabamento da capa: cantos arredondados como na Sanfona (14px) e borda
    // suavizada no próprio shader, com 1 pixel de tela de transição. Assim a
    // borda não serrilha nem mostra a linha de pixels da textura, com ou sem
    // antialias (que fica desligado nos níveis médio e baixo).
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 q = abs(p) - (vec2(aspect, 1.0) * 0.5 - cornerRadius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
    float edge = max(fwidth(dist), 1e-4);
    float shape = 1.0 - smoothstep(-edge, 0.0, dist);
    gl_FragColor = vec4(color.rgb, color.a * opacity * shape);
    // a textura é lida em espaço linear: converte de volta para sRGB,
    // senão as capas aparecem mais escuras do que são
    #include <colorspace_fragment>
  }
`;

const createMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: null },
      opacity: { value: 0 },
      blurAmount: { value: 0 },
      aspect: { value: COVER_ASPECT },
      // 14px da Sanfona sobre a altura típica da capa da frente (~520px)
      cornerRadius: { value: 0.027 },
      scrollForce: { value: 0 },
      time: { value: 0 },
      waveT: { value: 99 },
    },
    vertexShader,
    fragmentShader,
  });

const lum = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return 0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255);
};

/* Capa genérica desenhada a partir da paleta (projetos sem capa do Behance). */
function paletteTexture(project) {
  const w = 1024;
  const h = Math.round(w / COVER_ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const [base, ...rest] = project.colors;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const bandH = h * 0.34;
  rest.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect((w / rest.length) * i, h - bandH, w / rest.length + 1, bandH);
  });
  const ink = rest.reduce(
    (best, c) => ((lum(c) - lum(base)) ** 2 > (lum(best) - lum(base)) ** 2 ? c : best),
    rest[0],
  );
  ctx.fillStyle = ink;
  ctx.textBaseline = 'top';
  ctx.font = `${Math.round(w * 0.15)}px Glyphius, "Times New Roman", serif`;
  ctx.fillText(project.title, w * 0.07, h * 0.08);
  ctx.globalAlpha = 0.72;
  ctx.font = `${Math.round(w * 0.032)}px Grotesk, Arial, sans-serif`;
  ctx.fillText(project.category, w * 0.07, h * 0.08 + w * 0.17);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/*
 * Fila de capas: em vez de baixar, decodificar e mandar para a placa de vídeo as
 * 14 capas no mesmo instante (o que travava o celular logo depois da abertura),
 * carrega uma por vez, a partir do projeto em foco:
 * - as 2 primeiras (foco e a de trás) já foram baixadas pela Sanfona durante a
 *   abertura e entram na hora;
 * - as outras esperam a pilha se abrir (1,2 s) e entram uma atrás da outra, nos
 *   intervalos livres, cada uma decodificada fora da thread principal e enviada
 *   sozinha para a placa de vídeo.
 * Capa que falhar (404, rede) vira a capa genérica da paleta, sem derrubar o 3D.
 * As texturas ficam guardadas: voltar para a vista Espacial não baixa de novo.
 */
const coverCache = new Map(); // src → THREE.Texture
const FIRST_BATCH = 2;
const AFTER_OPEN_MS = 1200;
const GAP_MS = 140;

const waitIdle = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: 400 });
      else window.requestAnimationFrame(() => resolve());
    }, ms);
  });

async function loadCover(project) {
  if (!project.cover) return paletteTexture(project);
  const hit = coverCache.get(project.cover);
  if (hit) return hit;
  const img = new Image();
  img.decoding = 'async';
  img.src = project.cover;
  try {
    await img.decode();
  } catch {
    return paletteTexture(project);
  }
  const texture = new THREE.Texture(img);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  coverCache.set(project.cover, texture);
  return texture;
}

function useCoverQueue(projects, initial, gl) {
  const textures = useRef(projects.map(() => null));
  useEffect(() => {
    let alive = true;
    const total = projects.length;
    (async () => {
      for (let n = 0; n < total && alive; n += 1) {
        const i = (initial + n) % total;
        const cached = projects[i].cover && coverCache.has(projects[i].cover);
        if (n === FIRST_BATCH) await waitIdle(AFTER_OPEN_MS);
        else if (n > FIRST_BATCH && !cached) await waitIdle(GAP_MS);
        if (!alive) return;
        const texture = await loadCover(projects[i]);
        if (!alive) return;
        gl.initTexture(texture); // sobe para a placa de vídeo agora, sozinha
        textures.current[i] = texture;
      }
    })();
    return () => {
      alive = false;
    };
    // a fila começa uma vez por montagem, a partir do foco daquele momento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return textures;
}

/* Posição fixa de cada passo do túnel (o mesmo j sempre cai no mesmo lugar). */
const spot = (j, spreadX, spreadY) => {
  // ângulo de ouro: cada projeto cai numa direção diferente, sempre longe do anterior
  const angle = j * 2.399963;
  const radius = 0.75 + 0.25 * Math.sin(j * 1.37);
  return { x: Math.cos(angle) * spreadX * radius, y: Math.sin(angle) * spreadY * radius };
};

const smooth = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * dt));

const POOL = AHEAD + 7; // meshes reaproveitados: fila + foco + os que estão saindo

/*
 * Fila de projetos:
 * - focus: o projeto parado no centro.
 * - queue: os que vêm atrás, em ordem. O de posição r mira a distância
 *   focus + (r + 1 - phase) * SPACING, então todos andam juntos, devagar.
 * - leaving: os que saíram (voam para fora) ou foram empurrados para o fundo.
 * Clicar num projeto da fila tira ele dela e coloca no foco; os que estavam
 * atrás dele sobem uma posição (fecham o espaço) e os da frente não mudam.
 */
function TunnelScene({
  projects,
  initial = 0,
  intro = false,
  onReady,
  velocityRef,
  onFocusChange,
  onHoverChange,
  onOpen,
  pointerRef,
  stepRef,
  lite = false,
}) {
  const { camera, size, gl } = useThree();
  const total = projects.length;

  // capas chegam uma por uma (ver useCoverQueue); até chegar, a capa não aparece
  const textures = useCoverQueue(projects, initial, gl);
  const appear = useRef(projects.map(() => 0)); // 0 → 1: cada capa surge suave ao chegar

  const materials = useMemo(() => Array.from({ length: POOL }, createMaterial), []);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const meshes = useRef([]);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const cam = useRef(null);
  const introT = useRef(intro ? 0 : 1); // 0 → 1: as capas saem da pilha da Sanfona
  const ready = useRef(false);
  const hoverRef = useRef(null);
  const lastProject = useRef(null);
  const sim = useRef(null);

  // Distância em que o projeto em foco ocupa bem a tela (desktop e celular).
  const aspect = size.width / size.height;
  const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(55 / 2));
  const focusD = Math.max(2 / (viewH * 0.6), (2 * COVER_ASPECT) / (viewH * aspect * 0.84));
  // largura visível na distância do foco: capas mais largas (ex.: 16:9) encolhem
  // para caber inteiras, sem cortar as laterais
  const fitW = focusD * viewH * aspect * 0.84;
  const spreadX = aspect < 0.8 ? 1.6 : 4.5;
  const spreadY = aspect < 0.8 ? 3.2 : 2.6;
  const pushX = 0.62 * 0.52 * aspect;
  const pushY = 0.62 * 0.52;
  const farD = focusD + (AHEAD + 1) * SPACING;

  if (!sim.current) {
    const s = {
      seq: 0,
      back: -1,
      phase: 0,
      queue: [],
      leaving: [],
      history: [],
      next: initial % total,
      free: [],
    };
    for (let i = POOL - 1; i >= 0; i -= 1) s.free.push(i);
    s.make = (project, seq = s.seq++) => ({ seq, project, d: null, slot: s.free.pop() ?? -1 });
    s.drop = (item) => {
      if (item.slot >= 0) s.free.push(item.slot);
      item.slot = -1;
    };
    s.has = (p) => s.focus?.project === p || s.queue.some((it) => it.project === p);
    s.nextProject = () => {
      let p = s.next;
      for (let n = 0; n < total && s.has(p); n += 1) p = (p + 1) % total;
      s.next = (p + 1) % total;
      return p;
    };
    s.focus = s.make(s.nextProject());
    for (let r = 0; r < AHEAD; r += 1) s.queue.push(s.make(s.nextProject()));
    sim.current = s;
  }

  useFrame((state, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    const time = state.clock.getElapsedTime();

    const retire = (item, out) => {
      item.out = out;
      s.leaving.push(item);
    };
    const remember = (item) => {
      s.history.push({ seq: item.seq, project: item.project });
      if (s.history.length > 30) s.history.shift();
    };

    // ponteiro: qual capa está embaixo dele (pausa, onda, cursor e clique)
    let hovered = null;
    if (pointerRef.current.inside) {
      ndc.set(pointerRef.current.x, pointerRef.current.y);
      ray.setFromCamera(ndc, camera);
      const pickable = meshes.current.filter((m) => m && m.visible && m.userData.pickable);
      const hit = ray.intersectObjects(pickable, false)[0];
      hovered = hit ? hit.object.userData.item : null;
    }
    if (hovered !== hoverRef.current) {
      hoverRef.current = hovered;
      if (hovered && hovered.slot >= 0) materials[hovered.slot].userData.hoverAt = time;
      onHoverChange?.(hovered ? hovered.project : null);
    }
    gl.domElement.style.cursor = hovered ? 'pointer' : '';

    if (pointerRef.current.clicked) {
      pointerRef.current.clicked = false;
      if (hovered && hovered === s.focus) onOpen?.(s.focus.project); // abre a página do projeto
      const r = hovered ? s.queue.indexOf(hovered) : -1;
      if (r >= 0) {
        // reordena: o clicado vai para o foco, a fila fecha o espaço
        s.queue.splice(r, 1);
        remember(s.focus);
        retire(s.focus, 'near');
        s.focus = hovered;
        const fresh = s.make(s.nextProject());
        s.queue.push(fresh);
        // o clicado ganha o tempo de foco inteiro (antes ele herdava o tempo
        // que restava e podia sair logo, parecendo passar direto)
        s.phase = 0;
      }
      if (pointerRef.current.touch) pointerRef.current.inside = false;
    }

    // nada avança sozinho: só passos exatos (roda, toque, setas e botões).
    // a "velocidade" só curva as capas durante a troca, como um impulso.
    velocityRef.current *= Math.exp(-3.2 * dt);
    if (stepRef.current) {
      s.phase += stepRef.current;
      stepRef.current = 0;
    }

    while (s.phase >= 1) {
      // o primeiro da fila chegou no foco: o atual sai voando
      remember(s.focus);
      retire(s.focus, 'near');
      s.focus = s.queue.shift();
      s.queue.push(s.make(s.nextProject()));
      s.phase -= 1;
    }
    while (s.phase < 0) {
      // sem histórico (início ou depois de muitas voltas): o anterior na ordem
      const back = s.history.pop() ?? { seq: s.back--, project: (s.focus.project - 1 + total) % total };
      // voltar: o último da fila vai para o fundo, o foco volta para a fila
      const last = s.queue.pop();
      if (last) {
        retire(last, 'far');
        s.next = last.project; // ele volta a ser o próximo da fila, sem pular nenhum
      }
      s.queue.unshift(s.focus);
      const i = s.leaving.findIndex((it) => it.seq === back.seq);
      const returning = i >= 0 ? s.leaving.splice(i, 1)[0] : s.make(back.project, back.seq);
      returning.out = null;
      if (returning.d === null) returning.d = focusD - SPACING;
      s.focus = returning;
      s.phase += 1;
    }

    if (lastProject.current !== s.focus.project) {
      lastProject.current = s.focus.project;
      onFocusChange?.(s.focus.project);
    }

    // câmera vai até o projeto em foco com uma mola suave
    const target = spot(s.focus.seq, spreadX, spreadY);
    if (!cam.current) cam.current = { x: target.x, y: target.y, vx: 0, vy: 0, roll: 0 };
    const c = cam.current;
    if (!ready.current && textures.current[s.focus.project]) {
      // a capa em foco já está na placa de vídeo: a Sanfona por cima já pode sair
      ready.current = true;
      onReady?.();
    }
    // as capas só saem da pilha depois que a do foco chegou
    if (ready.current && introT.current < 1) introT.current = Math.min(1, introT.current + dt / 1.1);
    for (let i = 0; i < total; i += 1) {
      if (textures.current[i] && appear.current[i] < 1) appear.current[i] = Math.min(1, appear.current[i] + dt / 0.6);
    }
    const stiffness = 9;
    const damping = 2 * Math.sqrt(stiffness) * 0.92;
    c.vx += ((target.x - c.x) * stiffness - c.vx * damping) * dt;
    c.vy += ((target.y - c.y) * stiffness - c.vy * damping) * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    const travel = Math.min(1, Math.hypot(target.x - c.x, target.y - c.y) / spreadX);
    c.roll = smooth(c.roll, THREE.MathUtils.clamp(-c.vx * 0.012, -0.08, 0.08), 6, dt);
    camera.position.set(c.x, c.y, travel * focusD * 0.55);
    camera.rotation.set(c.vy * 0.004, -c.vx * 0.004, c.roll);

    meshes.current.forEach((m) => {
      if (m) m.visible = false;
    });

    const draw = (item, goal, rate, pickable, r = -1) => {
      if (item.d === null) item.d = goal;
      item.d = smooth(item.d, goal, rate, dt);
      const d = item.d;
      const fadeFar = 1 - THREE.MathUtils.clamp((d - (farD - SPACING * 1.5)) / (SPACING * 1.5), 0, 1);
      const fadeNear = THREE.MathUtils.clamp((d - 0.6) / (focusD * 0.6), 0, 1);
      const opacity = Math.min(fadeFar, fadeNear);
      const tex = textures.current[item.project];
      if (item.slot < 0) return opacity;
      if (!tex) {
        // capa ainda na fila: o lugar fica reservado, sem desenhar nada
        const mesh = meshes.current[item.slot];
        if (mesh) mesh.visible = false;
        return opacity;
      }
      const shown = opacity * appear.current[item.project];
      const base = spot(item.seq, spreadX, spreadY);
      const extra = Math.max(0, d - focusD);
      const dir = item.seq * 2.399963 + 0.8;
      const mat = materials[item.slot];
      mat.uniforms.map.value = tex;
      mat.uniforms.opacity.value = shown;
      // nível baixo: sem o desfoque de profundidade (25 leituras de textura por pixel)
      mat.uniforms.blurAmount.value =
        item === s.focus || lite ? 0 : Math.min(MAX_BLUR, (Math.abs(d - focusD) / SPACING) * 1.6);
      mat.uniforms.time.value = time;
      mat.uniforms.waveT.value = mat.userData.hoverAt >= 0 ? time - mat.userData.hoverAt : 99;
      mat.uniforms.scrollForce.value = velocityRef.current * 0.6;
      const mesh = meshes.current[item.slot];
      if (mesh) {
        // cada capa na sua proporção (ex.: a da Tez é quadrada), sem esticar
        const img = tex.image;
        const ratio = img && img.width && img.height ? img.width / img.height : COVER_ASPECT;
        const h = Math.min(2, fitW / ratio);
        mesh.scale.set(h * ratio, h, 1);
        // flutuação lenta, diferente para cada capa
        const fx = Math.sin(time * 0.42 + item.seq * 1.7) * 0.06;
        const fy = Math.sin(time * 0.55 + item.seq * 2.3) * 0.08;
        let px = base.x + Math.cos(dir) * extra * pushX + fx;
        let py = base.y + Math.sin(dir) * extra * pushY + fy;
        let pz = -d;
        let rz = 0;
        if (introT.current < 1 && r >= 0) {
          // vinda da Sanfona: começa empilhada atrás do foco (degraus para cima)
          // e cada capa se solta da pilha, uma depois da outra, até o seu lugar
          // todas juntas, sem atraso entre elas; entra e assenta suave
          const k = introT.current;
          const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
          px = THREE.MathUtils.lerp(target.x, px, e);
          py = THREE.MathUtils.lerp(target.y + r * 0.2, py, e);
          pz = THREE.MathUtils.lerp(-(focusD + r * 0.55), pz, e);
          rz = Math.sin(e * Math.PI) * (r % 2 ? 0.035 : -0.035);
        }
        mesh.position.set(px, py, pz);
        mesh.rotation.set(
          Math.sin(time * 0.37 + item.seq) * 0.025,
          Math.sin(time * 0.31 + item.seq * 1.3) * 0.04,
          rz,
        );
        mesh.renderOrder = Math.round(1000 - d * 10);
        mesh.visible = shown > 0.01;
        mesh.userData.item = item;
        mesh.userData.pickable = pickable && shown > 0.4;
      }
      return opacity;
    };

    draw(s.focus, focusD, 2.6, true, 0);
    s.queue.forEach((item, r) => draw(item, focusD + (r + 1 - s.phase) * SPACING, 3, true, r + 1));
    s.leaving = s.leaving.filter((item) => {
      const goal = item.out === 'far' ? farD + SPACING : Math.min(item.d ?? focusD, focusD - SPACING * 1.5);
      const opacity = draw(item, goal, 2.4, false);
      const gone = item.out === 'far' ? item.d > farD + SPACING * 0.5 : opacity < 0.01 && item.d < focusD;
      if (gone) s.drop(item);
      return !gone;
    });
  });

  return materials.map((material, slot) => (
    <mesh
      key={slot}
      ref={(node) => {
        meshes.current[slot] = node;
      }}
      visible={false}
      scale={[2 * COVER_ASPECT, 2, 1]}
      material={material}
    >
      <planeGeometry args={lite ? [1, 1, 12, 12] : [1, 1, 32, 32]} />
    </mesh>
  ));
}

export default function SpaceTunnel({
  projects,
  initial = 0,
  intro = false,
  active = true,
  onReady,
  className = '',
  onFocusChange,
  onHoverChange,
  onOpen,
  controlsRef,
  fallback = null,
}) {
  const [webgl] = useState(hasWebGL);
  const tier = useTier();
  const wrapRef = useRef(null);
  const velocityRef = useRef(0);
  const pointerRef = useRef({ inside: false, x: 0, y: 0, clicked: false });
  const stepRef = useRef(0);

  useEffect(() => {
    const step = (dir) => {
      stepRef.current += dir;
      velocityRef.current = THREE.MathUtils.clamp(velocityRef.current + dir * 1.4, -3, 3);
    };
    const node = wrapRef.current;
    // em segundo plano (vista Sanfona): o 3D fica carregado, mas parado e sem ouvir nada
    if (!node || !active) return undefined;
    if (controlsRef) controlsRef.current = { step };

    const onPointerMove = (e) => {
      const box = node.getBoundingClientRect();
      pointerRef.current.inside = e.pointerType === 'mouse';
      pointerRef.current.x = ((e.clientX - box.left) / box.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - box.top) / box.height) * 2 + 1;
    };
    let down = null;
    const onPointerDown = (e) => {
      down = { x: e.clientX, y: e.clientY };
    };
    // escolhe o projeto que está no ponto (x, y) da tela
    const pick = (x, y, touch) => {
      const box = node.getBoundingClientRect();
      pointerRef.current.x = ((x - box.left) / box.width) * 2 - 1;
      pointerRef.current.y = -((y - box.top) / box.height) * 2 + 1;
      pointerRef.current.inside = true;
      pointerRef.current.touch = touch;
      pointerRef.current.clicked = true;
    };
    // mouse: o clique vale no pointerup (arraste não conta)
    const onPointerUp = (e) => {
      if (e.pointerType !== 'mouse') return;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
      pick(e.clientX, e.clientY, false);
    };
    // toque: o celular às vezes troca o pointerup por pointercancel; o "click"
    // do fim de um toque chega sempre (e não chega depois de um deslize)
    const onClick = (e) => {
      if (lastType === 'mouse') return;
      pick(e.clientX, e.clientY, true);
    };
    let lastType = 'mouse';
    const onType = (e) => {
      lastType = e.pointerType;
    };
    const onPointerLeave = () => {
      pointerRef.current.inside = false;
    };
    const unbind = bindStepInput(node, step);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerleave', onPointerLeave);
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointerdown', onType);
    node.addEventListener('click', onClick);
    return () => {
      unbind();
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointerdown', onType);
      node.removeEventListener('click', onClick);
      if (controlsRef) controlsRef.current = null;
    };
  }, [controlsRef, active]);

  if (!webgl) return fallback;

  return (
    <div
      ref={wrapRef}
      className={className}
      style={active ? undefined : { visibility: 'hidden', pointerEvents: 'none' }}
      aria-hidden={active ? undefined : true}
    >
      {/* o Canvas (e as capas já enviadas para a placa de vídeo) continua montado;
          a cena recomeça do projeto em foco a cada vez que a vista volta */}
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        // alto: como sempre; médio e baixo desenham menos pixels e sem antialias
        dpr={tier === 'alto' ? [1, 1.75] : tier === 'medio' ? [1, 1.5] : 1}
        gl={{ antialias: tier === 'alto', alpha: true }}
        frameloop={active ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          {active && (
            <TunnelScene
              projects={projects}
              initial={initial}
              intro={intro}
              onReady={onReady}
              velocityRef={velocityRef}
              onFocusChange={onFocusChange}
              onHoverChange={onHoverChange}
              onOpen={onOpen}
              pointerRef={pointerRef}
              stepRef={stepRef}
              lite={tier === 'baixo'}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
