/* Almas de Orvalon — áudio procedural (Web Audio). Arquivos reais em assets/audio substituem os sintetizados. */
(function (root) {
  const G = root.G;
  const A = G.audio = { ctx: null, vol: { music: 0.55, sfx: 0.85 }, samples: {}, mood: null };
  A.init = function () {
    if (A.ctx) return; const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    const c = A.ctx = new AC();
    A.out = c.createDynamicsCompressor(); A.out.threshold.value = -16; A.out.ratio.value = 4; A.out.connect(c.destination);
    A.sfx = c.createGain(); A.sfx.connect(A.out); A.mus = c.createGain(); A.mus.connect(A.out);
    A.rev = c.createConvolver(); A.rev.buffer = A.impulse(3.4, 2.4); A.revG = c.createGain(); A.revG.gain.value = 0.42; A.rev.connect(A.revG); A.revG.connect(A.out);
    A.setVol(A.vol.music, A.vol.sfx); A.loadSamples();
  };
  A.unlock = () => { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };
  A.setVol = (m, s) => { A.vol.music = m; A.vol.sfx = s; if (A.ctx) { A.mus.gain.value = m * 0.5; A.sfx.gain.value = s; } };
  A.impulse = (dur, decay) => { const c = A.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; };
  A.noise = () => { if (A._nb) return A._nb; const c = A.ctx, n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (A._nb = b); };
  A.loadSamples = function () {
    if (G.SINGLE) return;
    // opcional: assets/audio/manifest.json -> {"slash":"slash.mp3", ...}
    try {
      fetch('assets/audio/manifest.json').then((r) => r.ok ? r.json() : {}).then((m) => {
        Object.keys(m || {}).forEach((k) => fetch('assets/audio/' + m[k]).then((r) => r.arrayBuffer()).then((ab) => A.ctx.decodeAudioData(ab)).then((buf) => { A.samples[k] = buf; }).catch(() => { }));
      }).catch(() => { });
    } catch (e) { }
  };
  const now = () => A.ctx.currentTime;
  function g(v, dest) { const n = A.ctx.createGain(); n.gain.value = v; n.connect(dest || A.sfx); return n; }
  function env(node, t, a, d, peak) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function noiseBurst(t, dur, type, f, q, peak, dest, f2) {
    const s = A.ctx.createBufferSource(); s.buffer = A.noise(); const fl = A.ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 1;
    const gg = g(0, dest); env(gg, t, 0.004, dur, peak); s.connect(fl); fl.connect(gg); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return gg;
  }
  function tone(type, f, t, dur, peak, dest, f2, att) {
    const o = A.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const gg = g(0, dest); env(gg, t, att || 0.005, dur, peak); o.connect(gg); o.start(t); o.stop(t + dur + 0.1); return o;
  }
  function send(node, amt) { const s = g(amt, A.rev); node.connect(s); }
  function playSample(k, rate) { const b = A.samples[k]; if (!b) return false; const s = A.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1; s.connect(A.sfx); s.start(); return true; }
  // vogais (formantes)
  const VOW = { a: [800, 1150, 2900], o: [500, 800, 2800], e: [400, 1700, 2600], u: [350, 600, 2700] };
  function voice(t, f0, dur, vowel, peak, opts) {
    opts = opts || {}; const c = A.ctx; const out = g(0, opts.dest || A.sfx); env(out, t, opts.att || 0.06, dur, peak);
    const src = c.createOscillator(); src.type = 'sawtooth'; src.frequency.setValueAtTime(f0, t);
    if (opts.glide) { src.frequency.linearRampToValueAtTime(f0 * opts.glide[0], t + dur * 0.35); src.frequency.linearRampToValueAtTime(f0 * opts.glide[1], t + dur); }
    const lfo = c.createOscillator(); lfo.frequency.value = opts.vib || 5.5; const lg = c.createGain(); lg.gain.value = f0 * (opts.vibD || 0.02); lfo.connect(lg); lg.connect(src.frequency); lfo.start(t); lfo.stop(t + dur + 0.2);
    const fm = VOW[vowel] || VOW.a; const v2 = opts.to ? VOW[opts.to] : null;
    fm.forEach((f, i) => { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9 + i * 3; bp.frequency.setValueAtTime(f, t); if (v2) bp.frequency.linearRampToValueAtTime(v2[i], t + dur); const fg = g([1, 0.5, 0.25][i], out); src.connect(bp); bp.connect(fg); });
    src.start(t); src.stop(t + dur + 0.2); send(out, opts.rev || 0.5); return out;
  }
  const S = {
    ui: (t) => { tone('sine', 1900, t, 0.04, 0.08); },
    card: (t) => { noiseBurst(t, 0.06, 'highpass', 1800 + Math.random() * 900, 0.7, 0.22); tone('sine', 140, t, 0.05, 0.12); },
    draw: (t) => { noiseBurst(t, 0.2, 'bandpass', 700, 1.2, 0.18, null, 3200); },
    shuffle: (t) => { for (let i = 0; i < 9; i++) noiseBurst(t + i * 0.035 + Math.random() * 0.01, 0.03, 'highpass', 2200, 0.8, 0.14); },
    place: (t) => { tone('sine', 85, t, 0.16, 0.35, null, 45); S.card(t); },
    charge: (t) => { const a = tone('sine', 880, t, 0.5, 0.12); const b = tone('sine', 1320, t + 0.05, 0.6, 0.08); noiseBurst(t, 0.25, 'bandpass', 1200, 2, 0.08, null, 4000); },
    slash: (t) => { noiseBurst(t, 0.17, 'highpass', 6500, 0.8, 0.45, null, 1400); [1250, 2310, 3720].forEach((f, i) => tone('sine', f, t + 0.02, 0.35 - i * 0.08, 0.05)); },
    hit: (t) => { tone('sine', 70, t, 0.3, 0.6, null, 34); noiseBurst(t, 0.12, 'lowpass', 500, 0.7, 0.4); },
    blood: (t) => { for (let i = 0; i < 4; i++) noiseBurst(t + i * 0.035 + Math.random() * 0.02, 0.06 + Math.random() * 0.05, 'bandpass', 450 + Math.random() * 500, 1.6, 0.22); tone('sine', 160, t, 0.18, 0.18, null, 55); },
    scream: (t) => { const f0 = 170 + Math.random() * 220; voice(t, f0, 0.85, 'a', 0.22, { glide: [1.45, 0.8], vib: 7, vibD: 0.035, to: 'o', att: 0.03, rev: 0.6 }); noiseBurst(t, 0.6, 'bandpass', 2200, 1.4, 0.05); },
    groan: (t) => { const f0 = 120 + Math.random() * 120; voice(t, f0, 0.9, 'o', 0.18, { glide: [1.1, 0.7], vib: 5, vibD: 0.03, to: 'u' }); },
    coin: (t) => { [2600, 3720, 5200].forEach((f, i) => tone('sine', f, t, 0.5 - i * 0.12, 0.07)); [2900, 4100].forEach((f) => tone('sine', f, t + 0.12, 0.35, 0.05)); },
    bell: (t, f) => { f = f || 220; [1, 2, 2.4, 3, 4.2, 5.4].forEach((m, i) => { const o = tone('sine', f * m, t, 2.6 / (1 + i * 0.5), 0.12 / (1 + i), null); }); },
    drum: (t) => { tone('sine', 95, t, 0.38, 0.5, null, 42); noiseBurst(t, 0.09, 'lowpass', 900, 0.8, 0.25); },
    horn: (t) => { [110, 165].forEach((f, i) => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(1600, t + 0.35); lp.frequency.linearRampToValueAtTime(600, t + 1.3); const gg = g(0); env(gg, t, 0.15, 1.3, 0.14 - i * 0.04); o.connect(lp); lp.connect(gg); send(gg, 0.5); o.start(t); o.stop(t + 1.6); }); },
    heal: (t) => { [523, 659, 784, 1046].forEach((f, i) => { const o = tone('sine', f, t + i * 0.07, 0.45, 0.08); }); },
    cond: (t) => { tone('sine', 300, t, 0.5, 0.1, null, 260); tone('sine', 307, t, 0.5, 0.1, null, 250); noiseBurst(t, 0.3, 'bandpass', 900, 4, 0.05); },
    tear: (t) => { noiseBurst(t, 0.45, 'bandpass', 600, 1.5, 0.3, null, 5000); for (let i = 0; i < 6; i++) noiseBurst(t + i * 0.05, 0.03, 'highpass', 3000, 1, 0.12); },
    whoosh: (t) => { noiseBurst(t, 0.35, 'bandpass', 300, 1.2, 0.2, null, 2400); },
    choir: (t, notes, dur) => { (notes || [57, 61, 64, 69]).forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); voice(t + i * 0.04, f, dur || 2.4, i % 2 ? 'o' : 'a', 0.09, { att: 0.5, vib: 5 + Math.random(), vibD: 0.012, rev: 1 }); voice(t, f * 1.004, dur || 2.4, 'a', 0.05, { att: 0.6, vibD: 0.01, rev: 1 }); }); },
    rare: (t) => { S.choir(t, [62, 66, 69, 74], 2.2); S.charge(t); },
    legend: (t) => { S.choir(t, [57, 64, 69, 73, 76], 3.2); S.bell(t + 0.1, 196); S.hit(t); },
    ko: (t) => { S.hit(t); (Math.random() < 0.6 ? S.scream : S.groan)(t + 0.06); tone('sine', 50, t, 1.2, 0.25, null, 30); },
    victory: (t) => { S.horn(t); S.choir(t + 0.4, [60, 64, 67, 72], 3); S.bell(t + 0.5, 262); },
    defeat: (t) => { S.bell(t, 147); S.choir(t + 0.3, [57, 60, 64], 3); },
    turn: (t) => { S.bell(t, 330); },
    error: (t) => { tone('square', 160, t, 0.12, 0.05); }
  };
  A._last = {};
  A.play = function (name, opt) {
    if (!A.ctx || A.vol.sfx <= 0 || A.ctx.state !== 'running') return;
    const now2 = performance.now(); if (A._last[name] && now2 - A._last[name] < 45) return; A._last[name] = now2; try { if (playSample(name)) return; const fn = S[name]; if (fn) fn(now() + 0.01, opt); } catch (e) { }
  };
  // ---------- Música: pads etéreos (menu) e trilhas macabras por arena ----------
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = {
    menu: { dur: 8, chords: [[50, 57, 62, 65], [46, 53, 58, 62], [53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [43, 50, 55, 58], [46, 53, 58, 62], [45, 52, 57, 61]] },
    duel: { dur: 6, chords: [[52, 59, 64, 67], [48, 55, 60, 64], [50, 57, 62, 66], [47, 54, 59, 63]] },
    victory: { dur: 6, chords: [[48, 55, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [48, 55, 60, 64]] },
    defeat: { dur: 7, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [45, 52, 57, 60]] }
  };
  // cada arena: harmonia, percussão, cântico de culto, textura
  const AR = {
    coliseum: { dur: 7, root: 38, filt: 1100, chords: [[50, 57, 62, 65], [51, 58, 63, 67], [50, 57, 62, 65], [48, 55, 60, 64], [46, 53, 58, 62], [51, 58, 63, 67], [50, 57, 62, 65], [45, 52, 57, 61]], drums: [1, 0, 0, 0.5, 1, 0, 0.6, 0.3], chant: [0, 4], noise: null, bell: 4 },
    solen: { dur: 8, root: 33, filt: 1700, organ: true, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [47, 50, 53, 56], [45, 52, 57, 60], [43, 50, 55, 58], [44, 47, 50, 53], [45, 52, 57, 60], [40, 47, 52, 56]], drums: [1, 0, 0, 0, 0, 0, 0, 0], chant: [0, 4], choirHi: true, noise: null, bell: 1 },
    brasa: { dur: 6, root: 40, filt: 900, chords: [[52, 56, 59, 64], [53, 57, 60, 65], [52, 56, 59, 64], [50, 53, 57, 62], [52, 56, 59, 64], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]], drums: [1, 0.4, 0.8, 0.4, 1, 0.4, 0.8, 0.6], anvil: [2, 6], chant: [0, 2, 4, 6], noise: 'fire', bell: 0 },
    umbra: { dur: 9, root: 36, filt: 700, chords: [[48, 51, 55, 60], [49, 52, 55, 61], [48, 51, 54, 60], [44, 48, 51, 56], [48, 51, 55, 60], [47, 50, 54, 59], [48, 51, 55, 60], [42, 48, 51, 54]], drums: [1, 0.6, 0, 0, 0, 0, 0, 0], chant: [0, 4], noise: 'whisper', bell: 2 },
    vort: { dur: 7, root: 42, filt: 1300, chords: [[54, 57, 61, 66], [50, 54, 57, 62], [52, 55, 59, 64], [49, 53, 56, 61], [54, 57, 61, 66], [47, 50, 54, 59], [50, 54, 57, 62], [49, 53, 56, 61]], drums: [1, 0, 0.4, 0, 0.7, 0.4, 0.4, 0.4], chant: [0], choirHi: true, noise: 'storm', bell: 0 },
    sylv: { dur: 6.5, root: 33, filt: 1000, chords: [[45, 48, 52, 57], [43, 47, 50, 55], [41, 45, 48, 53], [40, 43, 47, 52], [45, 48, 52, 57], [48, 52, 55, 60], [43, 47, 50, 55], [40, 44, 47, 52]], drums: [1, 0, 0.6, 0.6, 1, 0, 0.6, 0], chant: [0, 3, 4, 7], noise: 'wind', bell: 0 }
  };
  function padChord(t, notes, dur, bus, filt, organ) {
    filt = filt || 1300; const c = A.ctx; const att = Math.min(3, dur * 0.4), rel = dur * 0.8;
    notes.forEach((m, i) => {
      const gg = c.createGain(); const pk = 0.055 / (1 + i * 0.25);
      gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(pk, t + att); gg.gain.setValueAtTime(pk, t + dur); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(filt * 0.4, t); lp.frequency.linearRampToValueAtTime(filt * (0.9 + Math.random() * 0.4), t + dur * 0.6); lp.frequency.linearRampToValueAtTime(filt * 0.45, t + dur + rel); lp.Q.value = 0.7;
      [-7, 7].forEach((det) => { const o = c.createOscillator(); o.type = organ ? (det < 0 ? 'square' : 'triangle') : 'sawtooth'; o.frequency.value = mf(m); o.detune.value = det + (Math.random() * 4 - 2); o.connect(lp); o.start(t); o.stop(t + dur + rel + 0.1); });
      lp.connect(gg); gg.connect(bus); const sg = c.createGain(); sg.gain.value = 0.9; gg.connect(sg); sg.connect(A.rev);
    });
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = mf(notes[0] - 12); const og = c.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.08, t + att); og.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel); o.connect(og); og.connect(bus); o.start(t); o.stop(t + dur + rel + 0.1);
  }
  function drone(bus, root, filt, t0, t1) {
    const c = A.ctx; t0 = t0 || 0; const gd = c.createGain(); gd.gain.setValueAtTime(0.0001, t0); gd.gain.setTargetAtTime(0.06, t0, 2);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filt * 0.35; const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = filt * 0.15; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t0); if (t1) lfo.stop(t1);
    [0, 6, 12].forEach((iv) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mf(root + iv); o.detune.value = Math.random() * 8 - 4; o.connect(lp); o.start(t0); if (t1) o.stop(t1); });
    lp.connect(gd); gd.connect(bus);
  }
  function war(t, v, bus) { const o = A.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.35); const gg = A.ctx.createGain(); env(gg, t, 0.004, 0.42, 0.26 * v); o.connect(gg); gg.connect(bus); o.start(t); o.stop(t + 0.5); noiseBurst(t, 0.07, 'lowpass', 700, 0.8, 0.1 * v, bus); }
  function anvil(t, bus) { [1180, 2950, 4130].forEach((f, i) => tone('sine', f, t, 0.5 - i * 0.12, 0.03, bus)); noiseBurst(t, 0.03, 'highpass', 3000, 1, 0.045, bus); }
  // cântico de culto: vozes graves em uníssono, quinta e oitava, sílabas alternadas
  function chant(t, ch, dur, bus, j) {
    const vw = ['o', 'u', 'a', 'o'][j % 4];
    [ch[0] - 24, ch[0] - 17, ch[0] - 12].forEach((m, k) => voice(t + k * 0.012, mf(m), dur, vw, 0.05 - k * 0.01, { att: 0.05, glide: [1.01, 0.96], vib: 4.5, vibD: 0.012, rev: 0.7, dest: bus, to: vw === 'a' ? 'o' : null }));
    noiseBurst(t, dur * 0.5, 'bandpass', 1100, 2, 0.01, bus);
  }
  function texture(t, kind, dur, bus) {
    if (kind === 'fire') for (let k = 0; k < 14; k++) noiseBurst(t + Math.random() * dur, 0.02 + Math.random() * 0.03, 'highpass', 2000 + Math.random() * 3000, 1, 0.025 + Math.random() * 0.03, bus);
    if (kind === 'whisper') for (let k = 0; k < 3; k++) noiseBurst(t + Math.random() * dur, 0.6 + Math.random() * 0.6, 'bandpass', 1500 + Math.random() * 1500, 6, 0.03, bus, 900);
    if (kind === 'storm') { noiseBurst(t, dur, 'lowpass', 300, 0.5, 0.04, bus, 900); if (Math.random() < 0.5) noiseBurst(t + Math.random() * dur * 0.7, 1.6, 'lowpass', 180, 0.7, 0.15, bus, 60); }
    if (kind === 'wind') noiseBurst(t, dur, 'bandpass', 400, 3, 0.03, bus, 1400);
  }
  function arenaStep(t, ar, i, bus) {
    const ch = ar.chords[i % ar.chords.length]; const beat = ar.dur / 8;
    padChord(t, ch, ar.dur, bus, ar.filt, ar.organ);
    ar.drums.forEach((v, k) => { if (v) war(t + k * beat, v, bus); });
    (ar.anvil || []).forEach((k) => anvil(t + k * beat, bus));
    ar.chant.forEach((k, jx) => chant(t + k * beat, ch, beat * 1.5, bus, jx + i));
    if (ar.choirHi && i % 2 === 0) voice(t + 0.6, mf(ch[2] + 12), ar.dur * 0.9, 'a', 0.02, { att: 1.6, vibD: 0.015, rev: 1.3, dest: bus });
    if (ar.bell && i % ar.bell === 0) [1, 2, 2.4, 3].forEach((m, k) => tone('sine', mf(ar.root + 12) * m, t + 0.2, 3 / (1 + k * 0.5), 0.05 / (1 + k), bus));
    if (ar.noise) texture(t, ar.noise, ar.dur, bus);
  }
  // Renderiza a trilha UMA vez (OfflineAudioContext) e toca como loop: nada é sintetizado durante o jogo.
  A._loops = {}; A._rendering = {};
  A.renderMood = function (mood) {
    if (A._loops[mood]) return Promise.resolve(A._loops[mood]);
    if (A._rendering[mood]) return A._rendering[mood];
    const OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OAC || !A.ctx) return Promise.resolve(null);
    const ar = mood.indexOf('arena_') === 0 ? (AR[mood.slice(6)] || AR.coliseum) : null; const pr = ar ? null : (PROG[mood] || PROG.duel);
    const loop = !(mood === 'victory' || mood === 'defeat');
    const cfg = ar || pr; const N = cfg.chords.length; const L = cfg.dur * N; const tail = loop ? 6 : cfg.dur * 0.8 + 2;
    const sr = 24000; const oc = new OAC(2, Math.ceil(sr * (L + tail)), sr);
    const sv = { ctx: A.ctx, rev: A.rev, sfx: A.sfx };
    A.ctx = oc;
    const out = oc.createGain(); out.connect(oc.destination);
    const rev = oc.createConvolver(); rev.buffer = A.impulse(3.4, 2.4); const rg = oc.createGain(); rg.gain.value = 0.42; rev.connect(rg); rg.connect(out); A.rev = rev; A.sfx = out;
    try {
      if (ar) { drone(out, ar.root, ar.filt, 0, L + tail); for (let k = 0; k < N; k++) arenaStep(k * ar.dur, ar, k, out); }
      else for (let k = 0; k < N; k++) { const t = k * pr.dur; padChord(t, pr.chords[k], pr.dur, out); if (k % 4 === 0 && mood === 'menu') voice(t + 1, mf(pr.chords[k][1] + 12), pr.dur * 0.9, 'a', 0.025, { att: 2, vibD: 0.01, rev: 1.2, dest: out }); }
    } finally { A.ctx = sv.ctx; A.rev = sv.rev; A.sfx = sv.sfx; }
    const pr2 = oc.startRendering().then((buf) => {
      let res = buf;
      if (loop) { const n = Math.floor(sr * L); const nb = A.ctx.createBuffer(2, n, sr); for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); const o = new Float32Array(n); o.set(d.subarray(0, n)); for (let k = n; k < d.length; k++) o[k - n] += d[k]; nb.copyToChannel(o, ch); } res = nb; }
      A._loops[mood] = res; delete A._rendering[mood];
      const keys = Object.keys(A._loops); if (keys.length > 3) { const drop = keys.find((k) => k !== mood && k !== A.mood && k !== 'menu'); if (drop) delete A._loops[drop]; }
      return res;
    }).catch(() => { delete A._rendering[mood]; return null; });
    A._rendering[mood] = pr2; return pr2;
  };
  A.music = function (mood) {
    if (!A.ctx) return; if (A.mood === mood) return; A.mood = mood;
    const c = A.ctx; const old = A._musSrc; A._musSrc = null;
    if (old) { try { old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.6); old.s.stop(c.currentTime + 3); } catch (e) { } }
    if (!mood) return;
    A.renderMood(mood).then((buf) => {
      if (!buf || A.mood !== mood || A._musSrc) return;
      const s = c.createBufferSource(); s.buffer = buf; s.loop = !(mood === 'victory' || mood === 'defeat');
      const gg = c.createGain(); gg.gain.value = 0.0001; s.connect(gg); gg.connect(A.mus); gg.gain.setTargetAtTime(1, c.currentTime, 1.2); s.start();
      A._musSrc = { s, g: gg };
    });
  };
  // pausa todo o áudio quando o app vai para o fundo (tela bloqueada): evita estalos e economiza bateria
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!A.ctx) return; try { if (document.hidden) A.ctx.suspend(); else A.ctx.resume(); } catch (e) { } });
})(typeof window !== 'undefined' ? window : globalThis);
