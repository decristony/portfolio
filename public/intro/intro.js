/*
 * Abertura do portfólio + som. Script clássico (sem build): o site carrega
 * /intro/intro.js e a prévia (preview/abertura.html) carrega ../public/intro/intro.js.
 *
 *   window.OrvionIntro.play(opções) -> função para cancelar
 *   window.OrvionLofi.start() / .stop()  -> ambiente lo-fi japonês (Projetos)
 *   window.OrvionSound.resume()          -> libera o áudio num gesto do usuário
 *
 * Roteiro:
 *  0. Começa direto, com som (se o navegador bloquear, o som entra no primeiro gesto).
 *  1. ORVION sobe letra por letra, com o subtítulo.
 *  2. Uma faixa curva de capas passa girando e para no card do Tez.
 *  3. O card do Tez abre até o tamanho exato do card de Projetos.
 *  4. Uma bolha de vidro abre do centro (o mesmo efeito do clique num projeto)
 *     e revela Projetos; o lo-fi começa.
 * Som da abertura: um toque suave a cada letra de ORVION. Som de Projetos: o lo-fi. Tudo sintetizado na
 * hora (Web Audio), sem arquivos.
 */
(function () {
  'use strict';

  /* ======================================================================
     Som
     ====================================================================== */
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let master = null;
  let wet = null;
  let noiseBuf = null;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function audio() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 3;
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp);
      comp.connect(ctx.destination);
      // reverberação: um "quarto" curto e macio
      const conv = ctx.createConvolver();
      conv.buffer = impulse(2.6, 2.4);
      wet = ctx.createGain();
      wet.gain.value = 0.32;
      wet.connect(conv);
      conv.connect(master);
      noiseBuf = noise(2);
    }
    return ctx;
  }

  function resume() {
    const c = audio();
    if (c && c.state === 'suspended') c.resume();
    return c;
  }

  function impulse(seconds, decay) {
    const c = ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function noise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  const sfx = {
    on: false,
    // tecla: um "tic" de máquina macia, um pouco diferente a cada vez
    tick(vol) {
      // áudio ainda bloqueado (sem gesto): não cria nós, que só geram aviso no console
      if (!sfx.on || !ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2200 + Math.random() * 2200;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      const v = (vol == null ? 0.055 : vol) * (0.8 + Math.random() * 0.4);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      src.connect(bp).connect(g).connect(master);
      src.start(t, Math.random() * 1.5, 0.05);
      const o = ctx.createOscillator();
      o.frequency.value = 1500 + Math.random() * 700;
      const og = ctx.createGain();
      og.gain.setValueAtTime(v * 0.25, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      o.connect(og).connect(master);
      o.start(t);
      o.stop(t + 0.03);
    },
  };

  /* ======================================================================
     Lo-fi japonês, limpo e aconchegante: Rhodes quente, um pad macio, baixo
     redondo, batida bem leve e uma melodia rara na escala "in".
     Sem chiado, sem ruído e sem pratos.
     ====================================================================== */
  const Lofi = (function () {
    let bus = null;
    let timer = null;
    let step = 0;
    let nextTime = 0;
    let running = false;
    const BPM = 64;
    const CHORDS = [
      { bass: 41, notes: [57, 60, 64, 67] }, // Fá maj9
      { bass: 40, notes: [55, 59, 62, 67] }, // Mi m7
      { bass: 38, notes: [57, 60, 64, 65] }, // Ré m9
      { bass: 36, notes: [55, 59, 62, 64] }, // Dó maj7
    ];
    const MELODY = [64, 65, 69, 71, 72, 76]; // escala "in", região média

    // nota quente: seno com um pouco da segunda harmônica, num filtro baixo
    function warm(m, t, len, vol, attack, cutoff) {
      const f = mtof(m);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff || 1500;
      lp.Q.value = 0.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.03));
      g.gain.exponentialRampToValueAtTime(vol * 0.45, t + Math.min(1.2, len * 0.5));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      [
        [1, 1, 0],
        [2, 0.08, 4],
      ].forEach(([ratio, amp, detune]) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * ratio;
        o.detune.value = detune + (Math.random() - 0.5) * 4;
        const og = ctx.createGain();
        og.gain.value = amp;
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + len + 0.05);
      });
      lp.connect(g).connect(bus);
      return g;
    }

    function pad(notes, t, len) {
      notes.forEach((m) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = mtof(m - 12);
        o.detune.value = (Math.random() - 0.5) * 8;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 700;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.012, t + len * 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.6);
        o.connect(lp).connect(g).connect(bus);
        o.start(t);
        o.stop(t + len + 0.7);
      });
    }

    function kick(t) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(62, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + 0.34);
    }

    function schedule() {
      // áudio ainda bloqueado: espera o primeiro gesto sem criar notas (cada
      // nota criada num contexto suspenso gerava um aviso no console)
      if (ctx.state !== 'running') {
        nextTime = ctx.currentTime + 0.1;
        return;
      }
      const beat = 60 / BPM;
      const eighth = beat / 2;
      while (nextTime < ctx.currentTime + 0.25) {
        const bar = Math.floor(step / 8) % CHORDS.length;
        const pos = step % 8;
        const t = nextTime + (pos % 2 ? eighth * 0.12 : 0); // um balanço leve
        const chord = CHORDS[bar];
        if (pos === 0) {
          warm(chord.bass, t, beat * 4, 0.07, 0.04, 400); // baixo redondo
          chord.notes.forEach((m, i) => warm(m, t + i * 0.035, beat * 3.8, 0.022, 0.05, 1400)); // Rhodes
          pad(chord.notes, t, beat * 4);
        }
        if (pos === 4) chord.notes.slice(1).forEach((m, i) => warm(m, t + i * 0.03, beat * 1.8, 0.012, 0.05, 1300));
        if (pos === 0 || pos === 5) kick(t);
        // melodia rara, sempre num tempo forte, nota longa e suave
        if (pos % 2 === 0 && Math.random() < 0.16) {
          const n = warm(MELODY[Math.floor(Math.random() * MELODY.length)], t, beat * 2.4, 0.02, 0.08, 1800);
          n.connect(wet);
        }
        nextTime += eighth;
        step += 1;
      }
    }

    function start() {
      const c = resume();
      if (!c || running) return;
      running = true;
      bus = ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(master);
      bus.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 5);
      step = 0;
      nextTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 40);
    }

    function stop() {
      if (!running) return;
      running = false;
      clearInterval(timer);
      const b = bus;
      const now = ctx.currentTime;
      b.gain.cancelScheduledValues(now);
      b.gain.setValueAtTime(Math.max(b.gain.value, 0.0001), now);
      b.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      setTimeout(() => {
        try {
          b.disconnect();
        } catch {
          /* já parado */
        }
      }, 1700);
    }

    return {
      start,
      stop,
      get running() {
        return running;
      },
    };
  })();

  /* ======================================================================
     Abertura: ORVION, uma faixa curva de capas passando e girando, o card do
     Tez no tamanho exato do card de Projetos, e a bolha de vidro.
     ====================================================================== */
  const BRAND = 'ORVION';
  // capas da faixa, na ordem em que passam; a última a parar é a do Tez
  const LEAD = ['marfim-odontologia', 'nervura-neurologia', 'ciranda-pediatria', 'iris-oftalmologia'];
  const HERO = 'tez-dermatologia-estetica';
  const TRAIL = ['sereno-clinica-do-sono', 'compasso-cardiologia'];
  const COVER_RATIO = 1672 / 941; // proporção da capa do Tez (a do card de Projetos)
  const CARD_RADIUS = 14; // o mesmo raio do card de Projetos

  // tempos (s)
  const TEXT_END = 2.4; // ORVION termina de subir (letra por letra, devagar)
  const TEXT_OUT_AT = TEXT_END + 0.15; // quase sem pausa: completo, já começa a sair
  const OUT_STEP = 0.14; // cada letra sai uma depois da outra, de trás para a frente
  const OUT_LETTER = 0.45; // tempo de cada letra descendo
  const TEXT_OUT_S = (BRAND.length - 1) * OUT_STEP + OUT_LETTER;
  const RIBBON_AT = TEXT_OUT_AT + TEXT_OUT_S + 0.15; // só então a faixa entra: dá tempo de as capas carregarem
  const OPEN_AT = RIBBON_AT + 2.6; // o card do Tez abre até o tamanho de Projetos
  // lente curva: a fileira é reta e as capas longe do centro ficam mais altas e mais curvas
  const BEND = 0.55; // quanto a lente curva as capas de fora (0 = reta)
  const GAP = 0.14; // espaço entre as capas, em fração da largura
  const OMEGA = 2.3; // mola amortecida: a fileira assenta no card do Tez
  const START_POS = -1.8; // a faixa começa com a primeira capa na borda direita
  const INTRO_S = 1.1; // as capas sobem de baixo, uma depois da outra
  const OPEN_DUR = 1.0;
  const REVEAL_MS = 2300; // a bolha abre mais devagar, para dar para ver

  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // power2.inOut, como a bolha do clique
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function springEase(t, freq) {
    const f = freq || 6;
    const c = clamp(t);
    const thresh = 0.82;
    const decay = (v) => 1 - Math.exp(-8 * v) * (Math.cos(f * v) + (8 / f) * Math.sin(f * v));
    if (c <= thresh) return decay(c);
    const d = ((64 + f * f) / f) * Math.exp(-8 * thresh) * Math.sin(f * thresh);
    const i = (c - thresh) / (1 - thresh);
    const a = 1 - thresh;
    const o = i * i;
    const s = o * i;
    return (2 * s - 3 * o + 1) * decay(thresh) + (s - 2 * o + i) * d * a + (-2 * s + 3 * o) * 1;
  }

  // a pasta do site (com /portfolio/ no GitHub Pages), pelo endereço deste script
  const BASE = (() => {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/intro\/intro\.js.*$/, '') : '/';
  })();
  const coverUrl = (slug) => BASE + 'projects/orvion/' + slug + '.webp';

  /* ---------- WebGL: faixa de capas ---------- */
  const COLS = 14;
  const ROWS = 2;
  function createRibbon(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true }) || canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return null;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(
      gl.VERTEX_SHADER,
      'attribute vec2 a_pos;attribute vec2 a_uv;attribute float a_shade;varying vec2 v_uv;varying float v_shade;uniform vec2 u_view;' +
        'void main(){v_uv=a_uv;v_shade=a_shade;gl_Position=vec4(a_pos.x/u_view.x*2.0-1.0,1.0-a_pos.y/u_view.y*2.0,0.0,1.0);}',
    );
    const fs = sh(
      gl.FRAGMENT_SHADER,
      'precision mediump float;varying vec2 v_uv;varying float v_shade;uniform sampler2D u_tex;uniform vec2 u_cover;uniform vec2 u_size;' +
        'uniform float u_rad;uniform float u_alpha;uniform float u_zoom;uniform float u_shift;uniform float u_blur;' +
        'void main(){vec2 uv=(v_uv-0.5)*u_cover/u_zoom+0.5;uv.x+=u_shift;vec4 c=texture2D(u_tex,uv,u_blur);' +
        'vec2 p=(v_uv-0.5)*u_size;vec2 q=abs(p)-(u_size*0.5-u_rad);' +
        'float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-u_rad;' +
        'float a=(1.0-smoothstep(-0.7,0.7,d))*u_alpha;' +
        'gl_FragColor=vec4(c.rgb*v_shade*a,a);}',
    );
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const U = {};
    ['u_view', 'u_tex', 'u_cover', 'u_size', 'u_rad', 'u_alpha', 'u_zoom', 'u_shift', 'u_blur'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const aUv = gl.getAttribLocation(prog, 'a_uv');
    const aShade = gl.getAttribLocation(prog, 'a_shade');

    // malha de uma capa: (COLS+1) x (ROWS+1) pontos, posição na tela + uv
    const verts = new Float32Array((COLS + 1) * (ROWS + 1) * 5);
    const idx = [];
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const a = r * (COLS + 1) + c;
        const b = a + 1;
        const d = a + COLS + 1;
        idx.push(a, b, d, b, d + 1, d);
      }
    }
    const indices = new Uint16Array(idx);
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aUv);
    gl.enableVertexAttribArray(aShade);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 8);
    gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 20, 16);
    gl.uniform1i(U.u_tex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const textures = {};
    async function load(slug, width) {
      try {
        const blob = await (await fetch(coverUrl(slug))).blob();
        let src;
        if (window.createImageBitmap) {
          src = await createImageBitmap(blob, { resizeWidth: width, resizeQuality: 'high' });
        } else {
          src = await new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = URL.createObjectURL(blob);
          });
        }
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (isGL2) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        textures[slug] = { tex, w: src.width, h: src.height };
        if (src.close) src.close();
      } catch {
        /* sem essa capa: a faixa segue sem ela */
      }
    }

    function resize(W, H) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(W * dpr);
      const h = Math.round(H * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(U.u_view, W, H);
    }

    function begin() {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // desenha uma capa: pos(u, v) -> [x, y, sombra] em pixels
    function draw(slug, pos, cardAspect, size, rad, alpha, zoom, shift, blur) {
      const t = textures[slug];
      if (!t || alpha <= 0.002) return;
      let o = 0;
      for (let r = 0; r <= ROWS; r += 1) {
        for (let c = 0; c <= COLS; c += 1) {
          const u = c / COLS;
          const v = r / ROWS;
          const p = pos(u, v);
          verts[o] = p[0];
          verts[o + 1] = p[1];
          verts[o + 2] = u;
          verts[o + 3] = v;
          verts[o + 4] = p[2];
          o += 5;
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
      const imgAspect = t.w / t.h;
      gl.uniform2f(U.u_cover, imgAspect > cardAspect ? cardAspect / imgAspect : 1, imgAspect > cardAspect ? 1 : imgAspect / cardAspect);
      gl.uniform2f(U.u_size, size[0], size[1]);
      gl.uniform1f(U.u_rad, rad);
      gl.uniform1f(U.u_alpha, alpha);
      gl.uniform1f(U.u_zoom, zoom);
      gl.uniform1f(U.u_shift, shift);
      gl.uniform1f(U.u_blur, blur);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    function dispose() {
      try {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch {
        /* ok */
      }
    }

    return { load, resize, begin, draw, dispose, has: (s) => Boolean(textures[s]) };
  }

  function play(opts) {
    const o = Object.assign(
      {
        root: document.body,
        sound: true, // com som por padrão
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onSound: function () {},
        onDone: function () {},
        onReveal: function () {},
        // abertura primeiro: antes da bolha, espera o site avisar que está pronto (com teto)
        ready: Promise.resolve(),
        readyTimeout: 6000,
      },
      opts || {},
    );

    let alive = true;
    let frame = 0;
    const timers = [];

    /* ---------- palco: página clara, o texto e a tela de desenho ---------- */
    const el = document.createElement('div');
    el.className = 'oi';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Abertura do site');
    el.innerHTML = `
      <div class="oi-stage">
        <div class="oi-brand" aria-hidden="true">
          <div class="oi-brand__title"></div>
          <div class="oi-brand__sub">DESIGN, DIREÇÃO E ARTE</div>
        </div>
        <canvas class="oi-canvas" aria-hidden="true"></canvas>
      </div>
      <div class="oi-rim" aria-hidden="true"></div>
      <button type="button" class="oi-skip" hidden>Pular abertura</button>`;
    o.root.appendChild(el);

    const stage = el.querySelector('.oi-stage');
    const canvas = el.querySelector('.oi-canvas');
    const title = el.querySelector('.oi-brand__title');
    const sub = el.querySelector('.oi-brand__sub');
    const rim = el.querySelector('.oi-rim');
    const skip = el.querySelector('.oi-skip');

    const chars = BRAND.split('').map((ch) => {
      const s = document.createElement('span');
      s.className = 'oi-brand__char';
      s.textContent = ch;
      title.appendChild(s);
      return s;
    });
    const ticked = chars.map(() => false);

    const ribbon = o.reduced ? null : createRibbon(canvas);

    /* ---------- o card de Projetos: tamanho e lugar reais ---------- */
    function fallbackRect() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const w = Math.min(W * 0.84, H * 0.6 * COVER_RATIO);
      const h = w / COVER_RATIO;
      return { x: (W - w) / 2, y: (H - h) / 2, w, h };
    }
    function targetRect() {
      const front = document.querySelector('.card-stack__card.is-front');
      if (front) {
        const r = front.getBoundingClientRect();
        if (r.width > 40 && r.height > 40) return { x: r.left, y: r.top, w: r.width, h: r.height };
      }
      return fallbackRect();
    }

    /* ---------- bolha de vidro: abre do centro e revela Projetos ---------- */
    function reveal() {
      return new Promise((res) => {
        el.classList.add('is-revealing');
        const t0 = performance.now();
        const run = (now) => {
          const W = window.innerWidth;
          const H = window.innerHeight;
          const max = Math.hypot(W, H) / 2 + 80;
          const t = clamp((now - t0) / REVEAL_MS);
          const r = lerp(t, easeInOut(t), 0.55) * max; // crescimento mais uniforme: não some no meio
          // a página clara ganha um buraco redondo que cresce...
          const mask = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 1.5}px)`;
          stage.style.webkitMaskImage = mask;
          stage.style.maskImage = mask;
          // ...com uma borda de vidro que refrata o que passa por ela
          const band = Math.max(18, r * 0.16);
          rim.style.width = `${(r + band) * 2}px`;
          rim.style.height = `${(r + band) * 2}px`;
          rim.style.setProperty('--edge', `${(r / (r + band)) * 100}%`);
          // a borda só aparece quando a bolha já é grande: sem a bolhinha no centro; some só no fim
          rim.style.opacity = String(smooth(max * 0.16, max * 0.3, r) * (1 - smooth(0.78, 1, t)));
          if (t < 1) frame = requestAnimationFrame(run);
          else res();
        };
        frame = requestAnimationFrame(run);
      });
    }

    /* ---------- fim ---------- */
    let finished = false;
    function finish(fast) {
      if (finished) return;
      finished = true;
      alive = false;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      if (sfx.on) Lofi.start();
      if (fast) el.classList.add('is-gone');
      setTimeout(
        () => {
          window.removeEventListener('keydown', onKey);
          unlockEvents.forEach((ev) => window.removeEventListener(ev, unlock));
          if (ribbon) ribbon.dispose();
          el.remove();
        },
        fast ? 650 : 0,
      );
      o.onDone();
    }

    const onKey = (e) => {
      if (e.key === 'Escape') finish(true);
    };
    window.addEventListener('keydown', onKey);
    skip.addEventListener('click', () => finish(true));

    /* ---------- roteiro ---------- */
    const slugs = LEAD.concat([HERO], TRAIL);
    const T = LEAD.length; // posição do Tez na faixa
    let siteReady = false;
    let readyAt = Infinity;
    Promise.resolve(o.ready).then(() => {
      siteReady = true;
    });

    function story() {
      return new Promise((resolve) => {
        const start = performance.now();
        let revealed = false;
        let openedAt = -1;
        const smoothRect = { ...fallbackRect() };
        let shown = false;
        let pos = START_POS; // posição da fileira, em capas
        let vel = 0;
        let lastNow = 0;

        if (ribbon) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          // as capas de passagem ficam em baixa resolução: mais leves, e só a do Tez precisa de nitidez total
          LEAD.concat(TRAIL).forEach((s) => ribbon.load(s, 256));
          ribbon.load(HERO, Math.round(clamp(fallbackRect().w * dpr, 800, 1672)));
        }

        const tick = (now) => {
          if (!alive) return;
          const t = (now - start) / 1000;
          const W = window.innerWidth;
          const H = window.innerHeight;

          // ORVION: cada letra sobe com mola; depois saem na ordem inversa (de trás para a frente)
          const tp = clamp(t / TEXT_END);
          chars.forEach((s, i) => {
            const d = (i / chars.length) * 0.35;
            const p = clamp((tp - d) / (1 - d));
            const q = clamp((t - TEXT_OUT_AT - (chars.length - 1 - i) * OUT_STEP) / OUT_LETTER);
            s.style.transform = `translateY(${((1 - springEase(p, 6)) + q * q) * 105}%)`;
            s.style.opacity = p > 0 && q < 1 ? '1' : '0';
            if (p > 0 && !ticked[i]) {
              ticked[i] = true;
              sfx.tick();
            }
          });
          if (t > TEXT_END * 0.45) sub.classList.add('is-in');
          if (t >= TEXT_OUT_AT) {
            sub.classList.remove('is-in');
            sub.classList.add('is-out');
          }
          if (!shown && t > 0.3) {
            skip.hidden = false;
            shown = true;
          }

          // faixa curva de capas
          if (ribbon) {
            ribbon.resize(W, H);
            ribbon.begin();
            // tamanho e espaçamento: as capas ocupam uma fração fixa da tela (menos que o card final)
            const cw = Math.min(W < 640 ? W * 0.56 : W * 0.22, H * 0.34 * COVER_RATIO);
            const ch = cw / COVER_RATIO;
            const step = cw * (1 + GAP);
            // mola: depois de RIBBON_AT a fileira corre até o Tez e assenta sem passar do ponto
            const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60;
            lastNow = now;
            if (t >= RIBBON_AT) {
              const acc = (T - pos) * OMEGA * OMEGA - vel * 2 * OMEGA;
              vel += acc * dt;
              pos += vel * dt;
            }
            const intro = clamp((t - RIBBON_AT) / INTRO_S, 0, 1.5);
            const openT = openedAt < 0 ? 0 : clamp((now - openedAt) / 1000 / OPEN_DUR);
            const e = easeInOutCubic(openT);
            const tr = targetRect();
            // segue o card real de Projetos (ele pode mudar de tamanho ao carregar a capa)
            smoothRect.x = lerp(smoothRect.x, tr.x, 0.35);
            smoothRect.y = lerp(smoothRect.y, tr.y, 0.35);
            smoothRect.w = lerp(smoothRect.w, tr.w, 0.35);
            smoothRect.h = lerp(smoothRect.h, tr.h, 0.35);
            const uVel = clamp(vel * 0.12, -1, 1);
            const halfW = W / 2;
            const halfH = H / 2;

            const items = slugs.map((slug, i) => ({ slug, i, d: i - pos }));
            items.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)); // as de fora primeiro, a do centro por cima
            items.forEach((it) => {
              const { slug, i, d } = it;
              const hero = i === T;
              const x0 = d * step;
              if (Math.abs(x0) > halfW + step * 1.5) return; // fora da tela
              // entrada: cada capa sobe de baixo e aparece, com atraso por distância do centro
              const tt = clamp((intro - Math.abs(d) * 0.12) / 0.6);
              const eIn = 1 - Math.pow(1 - tt, 3);
              let alpha = eIn;
              if (!hero) alpha *= 1 - smooth(0, 0.55, e);
              if (alpha <= 0.002) return;
              const pos2 = (u, v) => {
                const px = x0 + (u - 0.5) * cw;
                const py = (v - 0.5) * ch + (1 - eIn) * ch * 0.9;
                const nx = px / halfW;
                const x = clamp(nx, -1.4, 1.4);
                let ny = py / halfH;
                ny *= 1 + BEND * x * x; // mais alta quanto mais longe do centro
                ny += uVel * 0.05 * Math.sin(Math.PI * u) * (v - 0.5); // a velocidade arqueia as capas
                const nxs = nx * (1 - 0.06 * BEND * x * x); // e fecha um pouco nas pontas
                let X = halfW + nxs * halfW;
                let Y = halfH + ny * halfH;
                if (hero && e > 0) {
                  X = lerp(X, smoothRect.x + u * smoothRect.w, e);
                  Y = lerp(Y, smoothRect.y + v * smoothRect.h, e);
                }
                return [X, Y, 1 - 0.42 * Math.min(1, x * x)]; // escurece para as bordas
              };
              const xc = clamp(x0 / halfW, -1.4, 1.4);
              const sizeW = hero ? lerp(cw, smoothRect.w, e) : cw;
              const sizeH = hero ? lerp(ch * (1 + BEND * xc * xc), smoothRect.h, e) : ch * (1 + BEND * xc * xc);
              const rad = hero ? lerp(CARD_RADIUS * (cw / smoothRect.w), CARD_RADIUS, e) : CARD_RADIUS * (cw / smoothRect.w);
              const zoom = hero ? lerp(1.12, 1, e) : 1.12; // a imagem entra um pouco mais fechada
              const shift = clamp(-d * 0.035, -0.05, 0.05) * (hero ? 1 - e : 1); // e desliza ao passar
              // quanto mais longe do centro, mais desfocada (só a do meio, o Tez, fica 100% nítida)
              const blur = smooth(0.25, 2.0, Math.abs(d)) * 2.6;
              ribbon.draw(slug, pos2, COVER_RATIO, [sizeW, sizeH], rad, alpha, zoom, shift, blur);
            });

            // abrir o card do Tez quando a faixa chegou e a capa dele existe
            if (openedAt < 0 && t >= OPEN_AT && ribbon.has(HERO)) openedAt = now;
            if (openedAt < 0 && t >= OPEN_AT + 2.5) openedAt = now; // sem a capa: segue mesmo assim
          }

          // abre a bolha: depois do card aberto e com o site pronto (com teto)
          const opened = !ribbon || (openedAt >= 0 && (now - openedAt) / 1000 >= OPEN_DUR);
          const base0 = ribbon ? 0 : RIBBON_AT + 0.6;
          if (!revealed && opened && t >= base0 && (siteReady || t * 1000 > o.readyTimeout + 3000)) {
            if (readyAt === Infinity) readyAt = now;
            // um respiro para o card de Projetos terminar de assentar
            if (now - readyAt > 450) {
              revealed = true;
              o.onReveal();
              if (sfx.on) Lofi.start();
              reveal().then(() => {
                finish(false);
                resolve();
              });
              return;
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    }

    // o navegador só libera o áudio depois de um gesto: se ele bloquear, o som
    // entra no primeiro clique, toque ou tecla, no meio da abertura mesmo
    const unlock = () => resume();
    const unlockEvents = ['pointerdown', 'touchstart', 'keydown'];
    function begin(withSound) {
      sfx.on = Boolean(withSound);
      if (sfx.on) {
        resume();
        unlockEvents.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
      }
      o.onSound(sfx.on);
      if (o.reduced) {
        finish(true); // movimento reduzido: sem roteiro, só some
        return;
      }
      story().catch(() => {});
    }

    begin(o.sound);

    return () => finish(true);
  }

  window.OrvionIntro = { play };
  window.OrvionLofi = Lofi;
  window.OrvionSound = { resume, sfx };

  /* ======================================================================
     Abertura primeiro: o index.html marca <html class="intro-on"> e carrega
     este arquivo antes do React. A abertura começa aqui, sem esperar o site,
     e o React só se liga a ela (components/layout/Loader.jsx) via __oiBoot.
     ====================================================================== */
  const docEl = document.documentElement;
  if (docEl.classList.contains('intro-on') && !window.__oiBoot) {
    let readyRes;
    const ready = new Promise((r) => (readyRes = r));
    window.__orvionSiteReady = () => readyRes();
    // waiters: quem espera a abertura terminar para montar o que é pesado (túnel 3D)
    const boot = (window.__oiBoot = { sound: null, done: false, onSound: null, onDone: null, waiters: [] });
    boot.cancel = play({
      ready,
      onSound: (on) => {
        boot.sound = on;
        if (boot.onSound) boot.onSound(on);
      },
      // a bolha abre: o fundo claro do primeiro quadro sai para o site aparecer pelo buraco
      onReveal: () => docEl.classList.remove('intro-on'),
      onDone: () => {
        boot.done = true;
        docEl.classList.remove('intro-on');
        if (boot.onDone) boot.onDone();
        boot.waiters.splice(0).forEach((fn) => fn());
      },
    });
  }
})();
