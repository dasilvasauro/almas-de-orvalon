/* Almas de Orvalon — partículas (sprites pré-renderizados para manter 60fps) */
(function (root) {
  const G = root.G;
  const F = G.fx = { parts: [], amb: [], mode: null, sprites: {} };
  F.init = function () {
    F.cv = document.getElementById('fxc'); F.cx = F.cv.getContext('2d');
    F.bg = document.getElementById('bgfx'); F.bx = F.bg.getContext('2d');
    const rs = F.resize = () => { const d = Math.min([1, 1.25, 1.5, 2][G.gfxLevel ? G.gfxLevel() : 1], root.devicePixelRatio || 1); [F.cv, F.bg].forEach((c) => { c.width = innerWidth * d; c.height = innerHeight * d; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; }); F.d = d; };
    addEventListener('resize', rs); rs(); requestAnimationFrame(F.loop);
  };
  F.quality = () => [0.3, 0.65, 1, 1.35][G.gfxLevel ? G.gfxLevel() : 1] * (innerWidth < 600 ? 0.8 : 1);
  F.sprite = (c) => {
    if (F.sprites[c]) return F.sprites[c];
    const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, c); g.addColorStop(0.3, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (F.sprites[c] = s);
  };
  const PAL = { menu: ['#ffb36b', '#6fe3d6', '#c98bff'], ign: ['#ff8a3d', '#ffcf6b', '#ff5a2b'], sac: ['#fff1b0', '#ffe28a', '#ffffff'], occ: ['#c98bff', '#7f5cff', '#e0b8ff'], ene: ['#9fd2ff', '#5fb0ff', '#ffffff'], pri: ['#b6f08a', '#7fd65a', '#e8ffb0'], coliseum: ['#ffb36b', '#e8dcc2', '#c9a24e'] };
  F.ambient = function (mode) {
    F.mode = mode; F.amb = [];
    if (!mode || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const n = Math.round((mode === 'menu' ? 70 : 40) * F.quality()); for (let i = 0; i < n; i++) F.amb.push(F.mkAmb(true));
  };
  F.mkAmb = function (init) { const pal = PAL[F.mode] || PAL.menu; return { x: Math.random() * innerWidth, y: init ? Math.random() * innerHeight : innerHeight + 10, vx: (Math.random() - 0.5) * 0.15, vy: -(0.15 + Math.random() * 0.45), r: 0.6 + Math.random() * 2.2, life: 0, max: 400 + Math.random() * 600, c: pal[Math.floor(Math.random() * pal.length)], ph: Math.random() * 6.28 }; };
  F.burst = function (x, y, o) {
    o = o || {}; const n = Math.round((o.n || 20) * F.quality());
    for (let i = 0; i < n; i++) {
      let ang = o.ang != null ? o.ang + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * 6.283; const sp = (o.spd || 3) * (0.3 + Math.random());
      let px = x, py = y, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - (o.up || 0);
      if (o.orbit) { const R = o.orbit * (0.6 + Math.random() * 0.6); px = x + Math.cos(ang) * R; py = y + Math.sin(ang) * R; vx = -Math.sin(ang) * sp; vy = Math.cos(ang) * sp; }
      F.parts.push({ x: px, y: py, vx, vy, ox: o.orbit ? x : null, oy: y, g: o.grav == null ? 0.12 : o.grav, r: (o.size || 2.5) * (0.5 + Math.random()), life: 0, max: (o.life || 50) * (0.6 + Math.random() * 0.6), c: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : (o.color || '#fff'), drag: o.drag || 0.98, glow: o.glow !== false, sq: o.sq });
    }
  };
  F.at = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  F.blood = (x, y) => F.burst(x, y, { n: 30, color: ['#8e0f1c', '#b3192a', '#5c0710'], spd: 4.8, grav: 0.34, size: 2.8, life: 48, glow: false, sq: true });
  F.splat = (x, y) => { F.burst(x, y, { n: 48, color: ['#a01020', '#6e0812', '#c8202f'], spd: 7.5, grav: 0.4, size: 3.4, life: 55, glow: false, sq: true }); F.burst(x, y, { n: 10, color: ['#5c0710', '#8e0f1c'], spd: 3, grav: 0.5, size: 5.5, life: 70, glow: false, sq: true }); };
  F.sparks = (x, y, c) => F.burst(x, y, { n: 30, color: c || ['#ffd27a', '#fff'], spd: 6, grav: 0.18, size: 1.8, life: 30 });
  F.heal = (x, y) => F.burst(x, y, { n: 22, color: ['#9cff9c', '#e8ffd0', '#6fe3d6'], spd: 1.2, grav: -0.05, up: 1.2, size: 2.4, life: 60 });
  F.soul = (x, y, c) => F.burst(x, y, { n: 40, color: c || ['#cfe9ff', '#6fe3d6', '#ffffff'], spd: 1.4, grav: -0.08, up: 1.6, size: 3, life: 90, drag: 0.985 });
  F.ring = (x, y, c) => F.burst(x, y, { n: 36, color: c || ['#fff1b0'], spd: 5, grav: 0, size: 2, life: 28, drag: 0.92 });
  F.spiral = (x, y, c) => F.burst(x, y, { n: 34, color: c || ['#c98bff', '#fff'], spd: 2.6, grav: 0, size: 2.2, life: 55, orbit: 46, drag: 0.985 });
  F.loop = function () {
    requestAnimationFrame(F.loop); if (!F.cx) return; const d = F.d || 1;
    if (F.amb.length || F._bgDirty) {
      const bx = F.bx; bx.setTransform(d, 0, 0, d, 0, 0); bx.clearRect(0, 0, innerWidth, innerHeight); F._bgDirty = F.amb.length > 0;
      bx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < F.amb.length; i++) {
        const p = F.amb[i]; p.life++; p.ph += 0.02; p.x += p.vx + Math.sin(p.ph) * 0.2; p.y += p.vy;
        const t = p.life / p.max; const a = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
        if (p.life > p.max || p.y < -10) { F.amb[i] = F.mkAmb(false); continue; }
        bx.globalAlpha = a * 0.55; const s = p.r * 5; bx.drawImage(F.sprite(p.c), p.x - s, p.y - s, s * 2, s * 2);
      }
      bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over';
    }
    if (!F.parts.length && !F._fgDirty) return;
    const cx = F.cx; cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight); F._fgDirty = F.parts.length > 0;
    F.parts = F.parts.filter((p) => p.life < p.max);
    for (const p of F.parts) {
      p.life++;
      if (p.ox != null) { const dx = p.x - p.ox, dy = p.y - p.oy; p.vx += -dy * 0.0035 - dx * 0.0025; p.vy += dx * 0.0035 - dy * 0.0025; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy;
      const a = Math.max(0, 1 - p.life / p.max);
      if (p.glow) { cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = a * 0.6; const s = p.r * 3.2; cx.drawImage(F.sprite(p.c), p.x - s, p.y - s, s * 2, s * 2); cx.globalCompositeOperation = 'source-over'; }
      cx.globalAlpha = a; cx.fillStyle = p.c; cx.beginPath();
      if (p.sq) cx.ellipse(p.x, p.y, p.r * 1.4, p.r * 0.8, Math.atan2(p.vy, p.vx), 0, 6.283); else cx.arc(p.x, p.y, p.r, 0, 6.283);
      cx.fill();
    }
    cx.globalAlpha = 1;
  };
})(typeof window !== 'undefined' ? window : globalThis);
