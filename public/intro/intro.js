/*
 * Abertura do portfólio + som. Script clássico (sem build): o site carrega
 * /intro/intro.js e a prévia (preview/abertura.html) carrega ../public/intro/intro.js.
 *
 *   window.OrvionIntro.play(opções) -> função para cancelar
 *   window.OrvionLofi.start() / .stop()  -> ambiente lo-fi japonês (Projetos)
 *   window.OrvionSound.resume()          -> libera o áudio num gesto do usuário
 *
 * Roteiro, numa página só (a barrinha de digitação conduz tudo):
 *  0. Começa direto, com som (se o navegador bloquear, o som entra no primeiro gesto).
 *  1. As saudações são digitadas: devagar no começo e cada vez mais rápido,
 *     até "Boas-vindas".
 *  2. No mesmo lugar, "Olá mundo" e "Hello world" são digitados juntos.
 *  3. A barrinha pisca 3 vezes.
 *  4. A abertura some num fade e mostra Projetos; o lo-fi começa.
 * Som da abertura: só a digitação. Som de Projetos: o lo-fi. Tudo sintetizado na
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
     Abertura: uma página só
     ====================================================================== */
  const GREETINGS = ['Olá', 'Hello', 'Bonjour', 'Ciao', 'Hola', 'Hallo', 'こんにちは', 'Boas-vindas'];
  const LINES = ['Olá mundo', 'Hello world'];

  const FADE_MS = 600; // igual à transição de opacidade de .oi (intro.css)

  function play(opts) {
    const o = Object.assign(
      {
        root: document.body,
        sound: true, // com som por padrão
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onSound: function () {},
        onDone: function () {},
        onReveal: function () {},
        // abertura primeiro: antes da saída, espera o site avisar que está pronto (com teto)
        ready: Promise.resolve(),
        readyTimeout: 6000,
      },
      opts || {},
    );

    let alive = true;
    const timers = [];
    const wait = (ms) =>
      new Promise((res, rej) => {
        timers.push(
          setTimeout(() => {
            if (alive) res();
            else rej(new Error('cancelado'));
          }, ms),
        );
      });

    /* ---------- palco: uma página escura, na tinta da marca TD ---------- */
    const el = document.createElement('div');
    el.className = 'oi';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Abertura do site');
    el.innerHTML = `
      <div class="oi-stage">
        <div class="oi-grain"></div>
        <p class="oi-hello" aria-hidden="true" hidden><span></span></p>
        <div class="oi-type" aria-hidden="true" hidden><p></p><p></p></div>
      </div>
      <button type="button" class="oi-skip" hidden>Pular abertura</button>`;
    o.root.appendChild(el);

    const hello = el.querySelector('.oi-hello');
    const helloText = hello.querySelector('span');
    const type = el.querySelector('.oi-type');
    const lines = Array.prototype.slice.call(type.querySelectorAll('p'));
    const skip = el.querySelector('.oi-skip');

    const caret = document.createElement('span');
    caret.className = 'oi-caret';

    /* ---------- digitação ---------- */
    async function typeInto(node, text, perChar) {
      for (let c = 1; c <= text.length; c += 1) {
        node.textContent = text.slice(0, c);
        node.appendChild(caret);
        if (text[c - 1] !== ' ') sfx.tick();
        await wait(typeof perChar === 'function' ? perChar(c) : perChar);
      }
    }

    async function erase(node, perChar) {
      let text = node.textContent;
      while (text.length) {
        text = text.slice(0, -1);
        node.textContent = text;
        node.appendChild(caret);
        await wait(perChar);
      }
    }

    /* ---------- saída: a abertura some num fade simples e mostra Projetos ---------- */
    function reveal() {
      el.classList.add('is-revealing', 'is-gone');
      return new Promise((res) => setTimeout(res, FADE_MS));
    }

    /* ---------- fim ---------- */
    let finished = false;
    function finish(fast) {
      if (finished) return;
      finished = true;
      alive = false;
      timers.forEach(clearTimeout);
      if (sfx.on) Lofi.start();
      if (fast) el.classList.add('is-gone');
      setTimeout(
        () => {
          window.removeEventListener('keydown', onKey);
          unlockEvents.forEach((ev) => window.removeEventListener(ev, unlock));
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
    async function story() {
      await wait(450); // um respiro na página escura antes da primeira letra
      skip.hidden = false;

      // 1. saudações: devagar no começo, cada vez mais rápido
      hello.hidden = false;
      for (let k = 0; k < GREETINGS.length; k += 1) {
        await typeInto(helloText, GREETINGS[k], Math.max(30, 175 * Math.pow(0.72, k)));
        const last = k === GREETINGS.length - 1;
        await wait(last ? 800 : 120 + 600 * Math.pow(0.62, k));
        await erase(helloText, Math.max(14, 45 * Math.pow(0.75, k)));
      }

      // 2. no mesmo lugar: "Olá mundo" e "Hello world", digitados juntos
      hello.classList.add('is-out');
      await wait(260);
      hello.hidden = true;
      type.hidden = false;
      const caret2 = caret.cloneNode();
      const longest = Math.max(LINES[0].length, LINES[1].length);
      for (let c = 1; c <= longest; c += 1) {
        lines[0].textContent = LINES[0].slice(0, c);
        lines[0].appendChild(caret2);
        lines[1].textContent = LINES[1].slice(0, c);
        lines[1].appendChild(caret);
        sfx.tick();
        await wait(c < 3 ? 150 : 82);
      }
      await wait(380);
      caret2.remove(); // fica uma barrinha só, no fim de "Hello world"

      // 3. a barrinha pisca 3 vezes
      for (let b = 0; b < 3; b += 1) {
        caret.classList.add('is-off');
        await wait(240);
        caret.classList.remove('is-off');
        await wait(240);
      }

      // o site carregou por trás durante o roteiro; se ainda não, segura aqui (no máximo readyTimeout)
      await Promise.race([o.ready, wait(o.readyTimeout)]);

      // 4. a abertura some num fade e entra em Projetos
      o.onReveal();
      type.classList.add('is-out');
      if (sfx.on) Lofi.start();
      await reveal();
      finish(false);
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
      // a saída começa: o fundo escuro do primeiro quadro sai para o site aparecer no fade
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
