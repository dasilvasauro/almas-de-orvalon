/* Almas de Orvalon — tabuleiro de duelo (view + controlador humano + mentor + espectador) */
(function (root) {
  const INDIV = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('translate', '1px 1px');
  const G = root.G; const el = G.el; const t = (k, p) => G.t(k, p);
  const CC = { poison: '#7fd65a', burn: '#ff7a3d', trance: '#9fb4ff', stun: '#ffe066', madness: '#d07aff' };
  const D = G.Duel = {};
  const MCSVG = '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3"/><polygon points="50,8 86,71 14,71" fill="none" stroke="currentColor" stroke-width="1.2"/><polygon points="50,92 14,29 86,29" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="50" cy="50" r="6" fill="currentColor" opacity=".6"/></svg>';
  class Human { constructor(v) { this.v = v; this.kind = 'human'; } main(g, p) { this.v.onHumanTurn(p); return g.waitTurnEnd(); } ask(g, req) { return this.v.ask(req); } }

  G.logText = function (e, g) {
    const a = e.a; const nm = (p) => (g.P[p] ? g.P[p].name : ''); const cn = (id) => (id ? G.cardName(id) : '');
    const P = { name: nm(a.p), card: cn(a.id), to: cn(a.to), from: cn(a.from), n: a.n, v: a.v };
    switch (e.k) {
      case 'draw': case 'setupDone': return '';
      case 'ability': P.ab = G.L(a.name); break;
      case 'attack': P.atk = G.L(G.CARDS[a.id].attacks[a.i].name); break;
      case 'dmg': return t('log.dmg', P) + (a.weak ? ' ' + t('log.weak') : '') + (a.res ? ' ' + t('log.res') : '');
      case 'cond': case 'condEnd': P.cond = G.L(G.COND[a.k]); break;
      case 'coin': P.r = a.heads ? t('sun') : t('moon'); break;
      case 'win': return a.p == null ? t('log.draw') : t('log.win', { name: nm(a.p) });
      case 'lose': P.r = t('reason.' + a.reason); break;
    }
    return t('log.' + e.k, P);
  };

  class View {
    constructor(cfg) {
      this.cfg = cfg; this.paused = false; this._unp = []; this.askState = null; this.viewP = 0; this.mentorOn = !!cfg.mentor;
      this.speed = cfg.spectate ? 1.6 : (G.Prog.d.settings.speed || 1);
      this.humans = cfg.humans; this.hotseat = cfg.humans[0] && cfg.humans[1];
      const ctrls = [0, 1].map((i) => (cfg.humans[i] ? new Human(this) : new G.AI(cfg.players[i].skill == null ? 0.6 : cfg.players[i].skill)));
      this.g = new G.Game({ players: cfg.players.map((p) => ({ name: p.name, avatar: p.avatar, deck: p.deck, runes: p.runes || [] })), ctrls, view: this, mode: cfg.mode });
      this.build();
    }
    // ---------- tempo ----------
    dur(ms) { return ms / this.speed; }
    gate() { if (!this.paused) return Promise.resolve(); return new Promise((r) => this._unp.push(r)); }
    async wait(ms) { await G.sleep(this.dur(ms)); await this.gate(); }
    aiWait(f) { return this.wait((this.cfg.spectate ? 520 : 400) * f); }
    handP() { return this.hotseat ? this.viewP : 0; }
    canAct() { const g = this.g; return !this.cfg.spectate && !g.over && g.turn > 0 && this.humans[g.cur] && g.cur === this.handP() && !g.busy && !this.askState && !g.turnEnded; }
    // ---------- construção ----------
    build() {
      const arena = this.cfg.arena || G.Prog.ARENAS[0];
      this.root = el('div.duel', el('div.arena.arena-' + arena.id));
      const z = this.z = {};
      z.bar1 = el('div.pbar'); z.bench1 = el('div.bench', { dataset: { drop: 'bench1' } }); z.row1 = el('div.arow');
      z.dom = el('div.dom'); z.tools = el('div.tools'); z.info = el('div.info'); z.btns = el('div.btns');
      z.mid = el('div.mid' + (this.cfg.spectate ? '.spec' : ''), el('div.midL', z.dom, z.tools), z.info, z.btns);
      addEventListener('resize', () => this.fanHand());
      z.row0 = el('div.arow'); z.bench0 = el('div.bench', { dataset: { drop: 'bench0' } }); z.bar0 = el('div.pbar'); z.hand = el('div.hand');
      this.board = el('div.board', z.bar1, z.bench1, z.row1, z.mid, z.row0, z.bench0, z.bar0, z.hand);
      this.prev = el('div.prev'); this.logEl = el('div.log');
      this.side = el('div.sidepanel', this.prev, el('h3', t('log')), this.logEl);
      this.root.append(this.board, this.side);
      this.root.addEventListener('click', (e) => {
        const tk = e.target.closest('.tok[data-u]'); if (tk) { this.onTok(tk.dataset.u); return; }
        const ct = e.target.closest('.cont[data-u],.dom .card'); if (ct) { const u = ct.dataset.u || (this.g.domain && this.g.domain.uid); if (u) G.ui.zoom(this.g.inst[u].id); return; }
        const pl = e.target.closest('[data-pile]'); if (pl && pl.dataset.pile.startsWith('discard')) this.showDiscard(+pl.dataset.pile.slice(-1));
      });
      this.root.addEventListener('mouseover', (e) => { const n = e.target.closest('[data-u]'); if (n && this.g.inst[n.dataset.u] && (n.classList.contains('tok') || !n.classList.contains('cback'))) this.preview(this.g.inst[n.dataset.u].id); });
      this.bindHand();
      if (this.cfg.spectate) this.buildSpec();
    }
    preview(id) { if (this.prevId === id) return; this.prevId = id; G.fill(this.prev, G.ui.card(id, { w: 230 })); }
    buildSpec() {
      const sp = el('input', { type: 'range', min: 0.5, max: 4, step: 0.25, value: this.speed, 'aria-label': t('spec.speed'), oninput: (e) => { this.speed = +e.target.value; lab.textContent = this.speed + '×'; } });
      const lab = el('small', this.speed + '×');
      const pb = el('button.btn.small.icon', { html: G.ICON.pause, 'aria-label': t('spec.pause'), onclick: () => { this.paused = !this.paused; pb.innerHTML = this.paused ? G.ICON.resume : G.ICON.pause; if (!this.paused) { const u = this._unp; this._unp = []; u.forEach((r) => r()); } } });
      this.specbar = el('div.specbar', pb, sp, lab, el('button.btn.small', { onclick: () => this.analyze() }, t('spec.analyze')), el('button.btn.small.ghost', { onclick: () => { this.exitSpec = true; this.g.concede(0); } }, t('spec.exit')));
    }
    // ---------- renderização ----------
    tokEl(u) { return this.root.querySelector(`.tok[data-u="${u}"]`); }
    snap() { const m = new Map(); G.$$('[data-u]', this.root).forEach((e) => m.set(e.dataset.u, { r: e.getBoundingClientRect(), el: e })); return m; }
    render() {
      const before = this.snap();
      for (const p of [0, 1]) { this.renderBar(p); this.renderBench(p); this.renderRow(p); }
      this.renderMid(); this.renderHand();
      this.flip(before);
      if (!this.prevId) { const a = this.g.P[this.handP()].active; if (a) this.preview(this.g.inst[a].id); }
    }
    pileEl(p, k) { return this.root.querySelector(`[data-pile="${k}${p}"]`); }
    rectOf(n) { return n ? n.getBoundingClientRect() : null; }
    destRect(u) {
      const g = this.g; const I = g.inst[u]; if (!I) return null; const pl = g.P[I.owner];
      if (pl.discard.includes(u)) return this.rectOf(this.pileEl(I.owner, 'discard'));
      if (pl.deck.includes(u)) return this.rectOf(this.pileEl(I.owner, 'deck'));
      if (pl.prizes.includes(u)) return this.rectOf(this.pileEl(I.owner, 'prize'));
      for (const x of g.allInPlay()) { const J = g.inst[x]; if ((J.att || []).includes(u) || J.relic === u || (J.under || []).includes(u)) return this.rectOf(this.tokEl(x)); }
      if (this.g.domain && this.g.domain.uid === u) return this.rectOf(this.z.dom);
      return null;
    }
    flip(before) {
      const d = this.dur(380); const now = new Map(); G.$$('[data-u]', this.root).forEach((e) => now.set(e.dataset.u, e));
      now.forEach((e, u) => {
        const b = before.get(u); const r = e.getBoundingClientRect(); let from = b ? b.r : null;
        if (from && Math.abs(from.left - r.left) < 1 && Math.abs(from.top - r.top) < 1 && Math.abs(from.width - r.width) < 1) return;
        if (!from) { const I = this.g.inst[u]; const pile = this.pileEl(I.owner, this.g.P[I.owner].hand.includes(u) ? 'deck' : 'deck'); from = this.rectOf(pile); }
        if (!from || !r.width) { e.animate([{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { duration: d, easing: 'ease-out' }); return; }
        const s = Math.max(0.15, from.width / r.width);
        if (INDIV) { const dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.top + from.height / 2 - (r.top + r.height / 2); e.animate([{ translate: `${dx}px ${dy}px`, scale: String(s) }, { translate: '0px 0px', scale: '1' }], { duration: d, easing: 'cubic-bezier(.3,.7,.2,1)' }); }
        else { const dx = from.left - r.left, dy = from.top - r.top; e.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})`, transformOrigin: 'top left' }, { transform: 'none', transformOrigin: 'top left' }], { duration: d, easing: 'cubic-bezier(.3,.7,.2,1)' }); }
      });
      before.forEach((b, u) => {
        if (now.has(u)) return;
        const dest = this.destRect(u); const gh = b.el; const rr = this.root.getBoundingClientRect();
        gh.classList.add('flyghost'); gh.classList.remove('pick', 'hint', 'playable');
        Object.assign(gh.style, { left: b.r.left + 'px', top: b.r.top + 'px', width: b.r.width + 'px', height: b.r.height + 'px', margin: 0, position: 'fixed' });
        this.root.appendChild(gh);
        const dx = dest ? dest.left + dest.width / 2 - (b.r.left + b.r.width / 2) : 0, dy = dest ? dest.top + dest.height / 2 - (b.r.top + b.r.height / 2) : -20;
        const sc = dest ? Math.max(0.12, dest.width / b.r.width) : 0.6;
        const an = gh.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(${sc})`, opacity: 0.15 }], { duration: d * 1.25, easing: 'ease-in' });
        an.onfinish = () => gh.remove(); setTimeout(() => gh.remove(), d * 1.25 + 300);
      });
    }
    fxNode(cls, x, y, vars) { const n = el('div.fxl.' + cls, { style: Object.assign({ left: x + 'px', top: y + 'px' }, vars || {}) }); document.body.appendChild(n); setTimeout(() => n.remove(), 4000); return n; }
    orbFly(ax, ay, bx, by, pal, d) {
      const orb = this.fxNode('fxorb', ax, ay, { '--c1': pal[0], '--c2': pal[1], '--s': '26px' }); const lv = G.gfxLevel();
      return new Promise((res) => { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / d); const e = k * k * (3 - 2 * k); const x = ax + (bx - ax) * e, y = ay + (by - ay) * e - Math.sin(k * Math.PI) * 34; orb.style.left = x + 'px'; orb.style.top = y + 'px'; if (lv > 0 && Math.random() < 0.7) G.fx.burst(x, y, { n: 2, color: pal, spd: 0.5, grav: 0, size: 2.2, life: 22 }); if (k < 1) requestAnimationFrame(step); else { orb.remove(); res(); } }; requestAnimationFrame(step); });
    }
    async ranged(a, b, st, pal) {
      const [ax, ay] = this.center(a), [bx, by] = this.center(b); const dx = bx - ax, dy = by - ay; const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      if (st === 'arrow') {
        const d = this.dur(320);
        for (let k = 0; k < 3; k++) { const ar = this.fxNode('fxarrow', ax, ay, { '--c1': pal[0] }); const off = (k - 1) * 12; const arc = -Math.min(70, Math.abs(dx) * 0.2) - 24;
          ar.animate([{ transform: `translate(0px,${off}px) rotate(${ang - 18}deg)`, opacity: 0 }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc + off}px) rotate(${ang}deg)`, opacity: 1 }, { transform: `translate(${dx}px,${dy + off * 0.3}px) rotate(${ang + 14}deg)`, opacity: 1 }], { duration: d, easing: 'linear' }).onfinish = () => ar.remove();
          G.audio.play('whoosh'); await this.wait(80); }
        await this.wait(d - 80); G.fx.sparks(bx, by, [pal[0], '#fff']); return;
      }
      if (st === 'gun') {
        const d = this.dur(170); const fl = this.fxNode('fxflash', ax + dx * 0.14, ay + dy * 0.14); fl.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 240 }).onfinish = () => fl.remove();
        const tr = this.fxNode('fxtracer', ax, ay, { width: Math.hypot(dx, dy) + 'px', transform: `rotate(${ang}deg)` });
        tr.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)', offset: 0.45 }, { clipPath: 'inset(0 0 0 100%)', opacity: 0 }], { duration: d * 1.8, easing: 'ease-out' }).onfinish = () => tr.remove();
        this.shake(3); await this.wait(d); G.fx.sparks(bx, by, ['#ffd27a', '#fff']); return;
      }
      // orbe mágico: carrega e viaja nas cores da arte do personagem
      const orb = this.fxNode('fxorb', ax, ay, { '--c1': pal[0], '--c2': pal[1] });
      orb.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: this.dur(280), easing: 'ease-out' });
      G.fx.burst(ax, ay, { n: 14, color: [pal[0], pal[1], '#fff'], spd: 1.7, grav: -0.02, size: 2, life: 26 }); G.audio.play('charge');
      await this.wait(280); orb.remove();
      await this.orbFly(ax, ay, bx, by, pal, this.dur(430));
      this.mcircleXY(bx, by, pal[0]); G.fx.burst(bx, by, { n: 26, color: [pal[0], pal[1], '#fff'], spd: 3, grav: 0.02, size: 2.4, life: 34 }); G.fx.ring(bx, by, [pal[0]]);
    }
    async melee(a, b, st) {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); const dx = rb.left - ra.left, dy = rb.top - ra.top;
      if (st === 'slam') {
        a.animate([{ transform: 'none' }, { transform: `translate(${dx * 0.22}px,${dy * 0.22 - 46}px) scale(1.2)`, offset: 0.55 }, { transform: `translate(${dx * 0.42}px,${dy * 0.42}px) scale(1.04)`, offset: 0.8 }, { transform: 'none' }], { duration: this.dur(600), easing: 'ease-in-out' });
        await this.wait(470); const [bx, by] = this.center(b);
        const sh = this.fxNode('fxshock', bx, by, { '--c1': '#e8dcc2' }); sh.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(4.2)', opacity: 0 }], { duration: this.dur(560), easing: 'ease-out' }).onfinish = () => sh.remove();
        G.fx.burst(bx, by + 18, { n: 22, color: ['#8a7a66', '#c9b89a', '#4a3d30'], spd: 2.4, grav: 0.12, size: 2.6, life: 34 }); this.shake(9); return;
      }
      a.animate([{ transform: 'none' }, { transform: `translate(${dx * 0.42}px,${dy * 0.42}px) scale(1.08)` }, { transform: 'none' }], { duration: this.dur(st === 'claw' ? 320 : 380), easing: 'ease-in-out' }); await this.wait(170);
    }
    styledSlash(n, st, aff, pal) {
      if (st === 'slam' || st === 'orb' || st === 'arrow' || st === 'gun') return;
      const [x, y] = this.center(n); const id = 'sg' + Math.random().toString(36).slice(2, 7);
      const SH = { ign: ['M14 112 Q60 20 136 34', 9, '#ff5a1f', '#ffe08a'], sac: ['M22 22 L128 128 M128 22 L22 128', 6, '#fff3c4', '#ffd27a'], occ: ['M30 20 Q70 80 60 130 M60 14 Q100 74 90 124 M90 10 Q130 70 120 120', 4, '#8a2be2', '#e0c0ff'], ene: ['M20 30 L66 64 L54 76 L104 104 L92 114 L136 128', 5, '#4ab8ff', '#ffffff'], pri: ['M12 100 L40 82 L52 94 L84 58 L96 70 L138 36', 7, '#46c65a', '#d9ff9a'] };
      let [path, w, c1, c2] = SH[aff] || SH.ign;
      if (st === 'claw') { path = 'M40 18 Q70 70 52 132 M70 14 Q100 66 82 128 M100 10 Q130 62 112 124'; w = 5; c1 = pal[0]; c2 = '#fff'; }
      const svg = el('div.fxl.fxslash', { style: { left: x + 'px', top: y + 'px' }, html: `<svg viewBox="0 0 150 150" width="150" height="150"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><path d="${path}" stroke="${c1}" stroke-width="${w * 2.4}" fill="none" stroke-linecap="round" opacity=".35" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><path d="${path}" stroke="url(#${id})" stroke-width="${w}" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>` });
      document.body.appendChild(svg); const d = this.dur(aff === 'ene' ? 200 : 300);
      G.$$('path', svg).forEach((p) => p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: d, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
      svg.animate([{ opacity: 1, transform: 'scale(.9) rotate(-6deg)' }, { opacity: 1, transform: 'scale(1.05) rotate(0deg)', offset: 0.5 }, { opacity: 0, transform: 'scale(1.12)' }], { duration: d + 320, easing: 'ease-out' }).onfinish = () => svg.remove();
      if (aff === 'ign') G.fx.burst(x, y, { n: 16, color: ['#ff5a1f', '#ffd27a'], spd: 2.4, grav: -0.05, size: 2, life: 30 });
      if (aff === 'ene') G.fx.sparks(x, y, ['#4ab8ff', '#fff']);
      if (aff === 'sac') G.fx.ring(x, y, ['#fff3c4']);
    }
    beam(x, y, col) { const bm = this.fxNode('fxbeam', x, 0, { height: y + 'px', '--c1': col }); bm.animate([{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 0.9, offset: 0.3 }, { transform: 'scaleY(1)', opacity: 0 }], { duration: 950, easing: 'ease-out' }).onfinish = () => bm.remove(); }
    pulverize(n, pal) {
      const r = n.getBoundingClientRect(); const cols = 7, rows = 9; const C = [pal[0], pal[1], '#2a1a14', '#e8dcc2'];
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = r.left + (i + 0.5) * r.width / cols, y = r.top + (j + 0.5) * r.height / rows; setTimeout(() => G.fx.burst(x, y, { n: 2, color: [C[(i + j) % 4]], spd: 0.9, grav: -0.035, size: 2.6, life: 60 + Math.random() * 30 }), (cols - i) * 24 + Math.random() * 60); }
      n.animate([{ opacity: 1, filter: 'none' }, { opacity: 0, filter: 'blur(3px) brightness(1.7)' }], { duration: 760, fill: 'forwards' });
    }
    renderBar(p) {
      const g = this.g; const pl = g.P[p]; const bar = this.z['bar' + p];
      bar.className = 'pbar' + (g.cur === p && g.turn > 0 ? ' cur' : '');
      const showHandHere = this.handP() !== p;
      const top = pl.discard.length ? g.inst[pl.discard[pl.discard.length - 1]].id : null;
      G.fill(bar, 
        el('div.avatar', { style: { backgroundImage: `url(${G.artUrl(pl.avatar || 'h3_11')})`, width: '34px', height: '34px' } }),
        el('div.grow', { style: { minWidth: 0 } }, el('div.nm', pl.name), el('div.sub', t('d.hand', { n: pl.hand.length }))),
        showHandHere ? el('div.handcount', pl.hand.map((u) => { const b = G.ui.back(14); b.dataset.u = u; return b; })) : null,
        el('div.pile', { dataset: { pile: 'prize' + p }, title: t('d.souls') }, el('div.prz', pl.prizes.map(() => G.ui.back(16))), el('span', String(pl.prizes.length))),
        el('div.pile' + (pl.deck.length <= 5 ? '.low' : ''), { dataset: { pile: 'deck' + p }, title: t('d.deck') }, G.ui.back(24), String(pl.deck.length)),
        el('div.pile', { dataset: { pile: 'discard' + p }, title: t('d.discard') }, el('div.dthumb', { style: top ? { backgroundImage: `url(${G.artUrl(G.CARDS[top].art)})` } : null }), String(pl.discard.length)));
    }
    picks() { if (this.tmode) return new Set(this.tmode.acts.map((a) => a.target).filter(Boolean)); const a = this.askState; return a && a.req.from === 'board' ? new Set(a.req.options) : null; }
    enterTarget(u) {
      const acts = this.actsFor(u).filter((a) => a.target || a.type === 'bench'); if (!acts.length) return;
      this.tmode = { u, acts }; this.render(); if (this.tPrompt) this.tPrompt.remove();
      this.tPrompt = el('div.prompt', el('span', t('d.pickTarget', { c: G.cardName(this.g.inst[u].id) })), el('button.btn.small', { onclick: () => this.exitTarget() }, t('cancel')));
      this.root.appendChild(this.tPrompt);
    }
    exitTarget() { this.tmode = null; if (this.tPrompt) this.tPrompt.remove(); this.tPrompt = null; this.render(); }
    token(u, big) {
      const g = this.g; const I = g.inst[u]; const c = g.c(u); const max = g.maxHP(u); const left = Math.max(0, max - (I.dmg || 0)); const pct = 100 * left / max;
      const conds = Object.keys(I.conds || {}).filter((k) => I.conds[k]).map((k) => el('i', { style: { color: CC[k], borderColor: CC[k] } }, t('cs.' + k)));
      (I.effs || []).forEach((e) => { const k = { noRetreat: 'es.seal', noAtk: 'es.tired', guard: 'es.guard', atk: 'es.atk', force: 'es.force', aegis: 'es.aegis', ward: 'es.ward', feeble: 'es.feeble', expose: 'es.expose' }[e.k]; if (k) conds.push(el('i.e', t(k))); });
      const pk = this.picks();
      const n = el('div.tok' + (big ? '.big' : '') + (c.legend ? '.legend' : '') + (pk && pk.has(u) ? '.pick' : ''), { dataset: { u }, style: { '--ac': G.AFF[c.aff].color }, title: G.L(c.name) },
        el('div.ti', el('div.art', { style: { backgroundImage: `url(${G.artUrl(c.art)})` } }), el('div.nm', G.L(c.name)),
          el('div.hp', el('i' + (pct < 25 ? '.low' : pct < 50 ? '.mid' : ''), { style: { width: pct + '%' } }), el('span', left + '/' + max)),
          el('div.ch', (I.att || []).map((x) => G.orb(g.c(x).aff)))),
        el('div.badges', el('div.col', { style: { gap: '2px' } }, I.relic ? el('div.rel', { style: { backgroundImage: `url(${G.artUrl(g.c(I.relic).art)})` }, title: G.L(g.c(I.relic).name) }) : null, c.stage ? el('span.stg', 'A') : null), el('div.conds', conds)));
      return n;
    }
    renderBench(p) {
      const g = this.g; const z = this.z['bench' + p]; const pl = g.P[p];
      const kids = pl.bench.map((u) => this.token(u));
      const ba = this.tmode && p === g.cur && this.tmode.acts.find((a) => a.type === 'bench');
      for (let i = pl.bench.length; i < G.CFG.BENCH; i++) kids.push(ba ? el('div.slot.pick', { onclick: () => { this.exitTarget(); this.doAct(ba); } }, t('d.reserve')) : el('div.slot', t('d.reserve')));
      G.fill(z, ...kids);
    }
    renderRow(p) {
      const g = this.g; const pl = g.P[p]; const z = this.z['row' + p];
      const conts = el('div.side', pl.conts.map((x) => el('div.cont', { dataset: { u: x.uid } }, G.ui.card(g.inst[x.uid].id, { mini: true, noW: true }), el('b', String(Math.max(1, Math.ceil((x.exp - g.turn + 1) / 2)))))));
      G.fill(z, conts, pl.active ? this.token(pl.active, true) : el('div.aslot', el('small.muted', t('d.active'))), el('div.side'));
    }
    renderMid() {
      const g = this.g; const z = this.z;
      G.fill(z.dom, g.domain ? (() => { const c = G.ui.card(g.inst[g.domain.uid].id, { mini: true, noW: true }); c.dataset.u = g.domain.uid; return c; })() : t('d.dominion'));
      const pl = g.P[g.cur]; const f = pl.flags || {};
      const chip = (on, k) => el('span', { style: { color: on ? 'var(--bone2)' : 'var(--soul)', marginRight: '.4em' } }, (on ? '✓ ' : '○ ') + t(k));
      G.fill(z.info, el('b', g.turn ? t('d.turnN', { n: g.turn }) : t('d.setup')), g.turn ? el('span', g.P[g.cur].name) : null, (this.canAct() || (this.humans[g.cur] && !this.cfg.spectate)) && g.turn ? el('div', chip(f.attached, 'd.fCharge'), chip(f.action, 'd.fAction'), chip(f.retreated, 'd.fRetreat')) : null);
      const btns = []; const tools = [];
      if (!this.cfg.spectate && this.humans[g.cur] && g.turn > 0) btns.push(el('button.btn.primary.endbtn', { disabled: !this.canAct(), onclick: () => this.endTurn() }, t('d.end')));
      tools.push(el('button.btn.icon.ghost.logbtn', { html: G.ICON.log, 'aria-label': t('log'), onclick: () => this.showLog() }));
      if (this.cfg.spectate && this.specbar) btns.push(this.specbar);
      if (!this.cfg.spectate) tools.push(el('button.btn.icon.ghost', { html: G.ICON.flag, 'aria-label': t('d.menu'), onclick: () => this.menu() }));
      G.fill(z.btns, ...btns); G.fill(z.tools, ...tools);
      document.body.classList.toggle('cur-wait', !this.cfg.spectate && !this.canAct() && !this.askState && !g.over);
      document.body.classList.toggle('cur-target', !!(this.askState && this.askState.req.from === 'board'));
    }
    renderHand() {
      const g = this.g; const p = this.handP(); const pl = g.P[p]; const z = this.z.hand;
      const face = this.cfg.spectate || this.humans[p];
      const can = this.canAct(); const playable = new Set(can ? g.legalActions(p).filter((a) => a.u && pl.hand.includes(a.u)).map((a) => a.u) : []);
      z.className = 'hand' + (can ? '' : ' locked');
      const old = new Map(); Array.from(z.children).forEach((c) => { if (c.dataset.u) old.set(c.dataset.u + (c.classList.contains('cback') ? 'b' : 'f'), c); });
      const fresh = []; const kids = pl.hand.map((u) => { const key = u + (face ? 'f' : 'b'); let n = old.get(key); if (n) old.delete(key); else { n = face ? G.ui.card(g.inst[u].id, { mini: true, noW: true }) : G.ui.back(); n.dataset.u = u; n.classList.add('fresh'); fresh.push(n); } n.classList.toggle('playable', playable.has(u)); n.classList.remove('lift'); return n; });
      old.forEach((n) => n.remove());
      kids.forEach((n, i) => { if (z.children[i] !== n) z.insertBefore(n, z.children[i] || null); });
      this.fanHand();
      if (fresh.length) { void z.offsetWidth; requestAnimationFrame(() => fresh.forEach((n) => n.classList.remove('fresh'))); }
    }
    // ---------- interação ----------
    bindHand() {
      const z = this.z.hand;
      z.addEventListener('pointerdown', (e) => {
        const cards = Array.from(z.querySelectorAll('[data-u]')).filter((c) => !c.classList.contains('cback')); if (!cards.length) return;
        e.preventDefault();
        const lefts = cards.map((c) => c.getBoundingClientRect().left);
        const at = (x) => { let k = 0; for (let q = 0; q < lefts.length; q++) if (x >= lefts[q]) k = q; return cards[k]; };
        const hit = e.target.closest('[data-u]'); let cur = hit && cards.includes(hit) ? hit : at(e.clientX); const sy = e.clientY; let drag = null; let last = 0;
        const lift = (c) => { cards.forEach((x) => x.classList.toggle('lift', x === c)); z.classList.add('scrubbing'); if (this.g.inst[c.dataset.u]) this.preview(this.g.inst[c.dataset.u].id); };
        lift(cur);
        const move = (ev) => {
          if (drag) { ev.preventDefault(); drag.el.style.left = ev.clientX + 'px'; drag.el.style.top = ev.clientY + 'px'; return; }
          if (ev.clientY - sy < -38 && this.canAct()) { cards.forEach((x) => x.classList.remove('lift')); z.classList.remove('scrubbing'); drag = this.startDrag(cur.dataset.u, cur, ev); return; }
          const c = at(ev.clientX); if (c && c !== cur) { cur = c; lift(cur); const now = performance.now(); if (now - last > 70) { G.audio.play('card'); last = now; } }
        };
        const end = (ev, cancel) => {
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cc);
          cards.forEach((x) => x.classList.remove('lift')); z.classList.remove('scrubbing');
          if (drag) this.endDrag(cur.dataset.u, ev, drag); else if (!cancel) this.openHand(cur.dataset.u);
        };
        const up = (ev) => end(ev, false); const cc = (ev) => end(ev, true);
        window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cc);
      });
    }
    actsFor(u) { const g = this.g; return g.legalActions(g.cur).filter((a) => a.u === u); }
    startDrag(u, card, ev) {
      const r = card.getBoundingClientRect(); const clone = card.cloneNode(true); clone.classList.add('dragging'); clone.style.width = r.width + 'px'; clone.style.height = r.height + 'px';
      clone.style.left = ev.clientX + 'px'; clone.style.top = ev.clientY + 'px'; this.root.appendChild(clone); card.style.opacity = 0.3;
      const acts = this.actsFor(u);
      acts.forEach((a) => { if (a.target) { const n = this.tokEl(a.target); if (n) n.classList.add('pick'); } if (a.type === 'bench') this.z['bench' + this.g.cur].classList.add('drop'); if (['effect', 'action', 'god'].includes(a.type)) this.z.mid.classList.add('zoneglow'); });
      G.audio.play('card');
      return { el: clone, acts, card };
    }
    endDrag(u, ev, drag) {
      drag.el.remove(); drag.card.style.opacity = '';
      G.$$('.pick', this.root).forEach((n) => n.classList.remove('pick')); G.$$('.drop', this.root).forEach((n) => n.classList.remove('drop')); this.z.mid.classList.remove('zoneglow');
      const hit = document.elementFromPoint(ev.clientX, ev.clientY); if (!hit) return;
      const tk = hit.closest('.tok[data-u]'); const bench = hit.closest('[data-drop]'); const handR = this.z.hand.getBoundingClientRect();
      let a = null;
      if (tk) a = drag.acts.find((x) => x.target === tk.dataset.u);
      if (!a && bench) a = drag.acts.find((x) => x.type === 'bench');
      if (!a && ev.clientY < handR.top - 10) a = drag.acts.find((x) => ['effect', 'action', 'god', 'bench'].includes(x.type));
      if (a) this.doAct(a); else this.render();
    }
    async doAct(a) { if (!this.canAct()) return; G.click(); await this.g.perform(this.g.cur, a); this.render(); this.refreshMentor(); }
    async endTurn() {
      if (!this.canAct()) return; const g = this.g; const p = g.cur;
      const canAtk = g.P[p].active && g.c(g.P[p].active).attacks.some((_, i) => g.canAttack(p, i));
      if (G.Prog.d.settings.confirmEnd && canAtk && !(await G.ui.confirm(t('d.endQ'), t('d.end')))) return;
      this.doAct({ type: 'end' });
    }
    whyNot(u) {
      const g = this.g; const p = g.cur; const c = g.c(u); const pl = g.P[p];
      if (!this.canAct()) return t('why.notYourTurn');
      switch (c.kind) {
        case 'creature': if (c.stage === 0) return pl.bench.length >= G.CFG.BENCH ? t('why.benchFull') : ''; return g.isFirstTurn(p) ? t('why.firstAscend') : t('why.noBase', { n: G.cardName(c.from) });
        case 'charge': return pl.flags.attached ? t('why.chargeUsed') : '';
        case 'relic': return t('why.noRelicTarget');
        case 'action': return pl.flags.action ? t('why.actionUsed') : (p === g.first && g.turn === 1) ? t('why.firstAction') : t('why.noEffect');
        case 'god': return pl.flags.god ? t('why.godUsed') : t('why.sameGod');
        case 'effect': return c.mode === 'cont' && pl.conts.length >= G.CFG.CONT_SLOTS ? t('why.contFull') : t('why.noEffect');
        case 'marker': return t('why.marker');
      }
      return '';
    }
    openHand(u) {
      const g = this.g; if (!g.inst[u]) return; const id = g.inst[u].id; const w = Math.min(innerWidth * 0.62, 250);
      const acts = this.canAct() ? this.actsFor(u) : []; let sh;
      const pos = (x) => (g.P[g.cur].active === x ? t('d.active') : t('d.reserve'));
      const box = el('div.acts');
      acts.forEach((a) => {
        let lb; switch (a.type) {
          case 'bench': lb = t('act.bench'); break; case 'ascend': lb = t('act.ascend', { n: G.cardName(g.inst[a.target].id) }); break;
          case 'attach': lb = t('act.attach', { n: G.cardName(g.inst[a.target].id), p: pos(a.target) }); break; case 'relic': lb = t('act.relic', { n: G.cardName(g.inst[a.target].id), p: pos(a.target) }); break;
          default: lb = t('act.play');
        }
        box.appendChild(el('button.btn.primary', { onclick: () => { sh.close(); this.doAct(a); } }, lb));
      });
      if (!acts.length && this.humans[g.inst[u].owner] && !this.cfg.spectate) { const w2 = this.whyNot(u); if (w2) box.appendChild(el('div.why', w2)); }
      if (acts.some((a) => a.target || a.type === 'bench')) box.appendChild(el('button.btn', { onclick: () => { sh.close(); this.enterTarget(u); } }, t('d.pickOnBoard')));
      if (acts.length) box.appendChild(el('small.muted', t('d.dragHint')));
      box.appendChild(el('button.btn.ghost', { onclick: () => sh.close() }, t('close')));
      sh = G.ui.sheet([G.ui.card(id, { w }), box]);
    }
    onTok(u) {
      const g = this.g; const a = this.askState;
      if (this.tmode) { const ac = this.tmode.acts.find((x) => x.target === u); if (ac) { G.click(); this.exitTarget(); this.doAct(ac); } else G.audio.play('error'); return; }
      if (a && a.req.from === 'board') { if (a.req.options.includes(u)) { G.click(); a.finish([u]); } else G.audio.play('error'); return; }
      const I = g.inst[u]; const c = g.c(u); const p = I.owner; const w = Math.min(innerWidth * 0.6, 250); let sh;
      const info = el('div.info',
        el('div', el('b', t('hp') + ': '), (g.maxHP(u) - (I.dmg || 0)) + '/' + g.maxHP(u)),
        (I.att || []).length ? el('div', el('b', t('d.charges') + ': '), (I.att || []).map((x) => G.orb(g.c(x).aff))) : null,
        I.relic ? el('div', el('b', t('kindRelic') + ': '), el('a', { href: '#', onclick: (e) => { e.preventDefault(); G.ui.zoom(g.inst[I.relic].id); } }, G.cardName(g.inst[I.relic].id))) : null,
        Object.keys(I.conds || {}).filter((k) => I.conds[k]).length ? el('div', el('b', t('d.conds') + ': '), Object.keys(I.conds).filter((k) => I.conds[k]).map((k) => G.L(G.COND[k])).join(', ')) : null,
        (I.under || []).length ? el('div', el('b', t('d.under') + ': '), I.under.map((x) => G.cardName(g.inst[x].id)).join(', ')) : null);
      const box = el('div.acts', info);
      if (this.canAct() && p === g.cur) {
        if (g.P[p].active === u) {
          c.attacks.forEach((atk, i) => {
            const blk = g.attackBlocked(p, i); const pv = blk ? null : g.previewAttack(u, i);
            box.appendChild(el('button.btn' + (blk ? '' : '.primary'), { disabled: !!blk, onclick: () => { sh.close(); this.doAct({ type: 'attack', i }); } }, el('span.row', { style: { gap: '.35em' } }, G.costEl(g.attackCost(u, atk)), G.L(atk.name)), el('span', pv ? '≈ ' + pv.dmg + (pv.weak ? ' (+30)' : '') : '')));
            if (blk) box.appendChild(el('div.why', t('why.atk.' + blk)));
          });
          const rb = g.retreatBlocked(p);
          if (!rb) g.P[p].bench.forEach((b) => box.appendChild(el('button.btn', { onclick: () => { sh.close(); this.doAct({ type: 'retreat', target: b }); } }, t('act.retreat', { n: G.cardName(g.inst[b].id) }), g.retreatCost(u) ? G.costEl(Array(g.retreatCost(u)).fill('neu')) : el('small', t('free')))));
          else if (rb !== 'nobench') box.appendChild(el('div.why', t('why.ret.' + rb, { n: g.retreatCost(u) })));
        }
        g.abilitySource(u).forEach((s) => { const ok = g.canAbility(p, u, s.src); box.appendChild(el('button.btn' + (ok ? '.gilded' : ''), { disabled: !ok, onclick: () => { sh.close(); this.doAct({ type: 'ability', u, src: s.src }); } }, t('gift') + ': ' + G.L(s.a.name))); });
      }
      box.appendChild(el('button.btn.ghost', { onclick: () => sh.close() }, t('close')));
      sh = G.ui.sheet([G.ui.card(I.id, { w, hpBonus: g.maxHP(u) - c.hp }), box]);
    }
    showDiscard(p) {
      const g = this.g; const ids = g.P[p].discard.slice().reverse();
      G.ui.modal(ids.length ? el('div.grid', { style: { '--gw': '112px' } }, ids.map((u) => { const n = G.ui.card(g.inst[u].id, { w: 110 }); n.addEventListener('click', () => G.ui.zoom(g.inst[u].id)); return n; })) : el('p.muted', t('d.emptyDiscard')), { title: t('d.discardOf', { n: g.P[p].name }) });
    }
    showLog() { const items = this.g.log.map((e) => ({ e, s: G.logText(e, this.g) })).filter((x) => x.s).slice(-120).reverse(); G.ui.modal(el('div.log', items.map((x) => el('div.le.' + (x.e.a.p != null ? 'p' + x.e.a.p : 'sys'), x.s))), { title: t('log') }); }
    menu() {
      let m; const g = this.g;
      m = G.ui.modal(el('div.col', el('button.btn', { onclick: () => { m.close(); G.ui.modal(el('div.prose', G.TUT_QUICK ? G.L(G.TUT_QUICK).map((s) => el('p', { html: s })) : null), { title: t('d.quick') }); } }, t('d.quick')),
        el('button.btn', { onclick: () => { this.mentorOn = !this.mentorOn; m.close(); if (!this.mentorOn && this.mentorEl) { this.mentorEl.remove(); this.mentorEl = null; } this.refreshMentor(); } }, this.mentorOn ? t('d.mentorOff') : t('d.mentorOn')),
        el('button.btn.primary', { onclick: async () => { m.close(); if (await G.ui.confirm(t('d.concedeQ'), t('d.concede'))) g.concede(this.hotseat ? g.cur : 0); } }, t('d.concede'))), { title: t('d.menu'), narrow: true });
    }
    analyze() {
      const g = this.g; const was = this.paused; this.paused = true;
      const sec = (title, list) => el('div', el('h3', title + ' (' + list.length + ')'), el('div.grid', { style: { '--gw': '96px' } }, list.map((u) => { const n = G.ui.card(g.inst[u].id, { w: 92 }); n.addEventListener('click', () => G.ui.zoom(g.inst[u].id)); return n; })));
      const pane = (p) => { const pl = g.P[p]; const deck = pl.deck.slice().sort((a, b) => G.CARD_ORDER.indexOf(g.inst[a].id) - G.CARD_ORDER.indexOf(g.inst[b].id)); return el('div.col', el('h2', pl.name), el('small.muted', t('spec.skill', { n: Math.round(100 * (this.cfg.players[p].skill || 0)) })), sec(t('d.handT'), pl.hand), sec(t('d.souls'), pl.prizes), sec(t('d.deck'), deck), sec(t('d.discard'), pl.discard)); };
      G.ui.modal(el('div.col', pane(0), pane(1)), { title: t('spec.analyze'), onClose: () => { this.paused = was; if (!was) { const u = this._unp; this._unp = []; u.forEach((r) => r()); } } });
    }
    // ---------- perguntas ao humano ----------
    ask(req) {
      return new Promise((res) => {
        const finish = (val) => { if (!this.askState) return; this.askState = null; if (this.promptEl) { this.promptEl.remove(); this.promptEl = null; } if (this.pickerM) { this.pickerM.close(); this.pickerM = null; } this.render(); res(val); };
        this.askState = { req, finish };
        const go = () => { if (req.from === 'board') this.boardAsk(req, finish); else this.pickerAsk(req, finish); this.mentorAsk(req); };
        if (this.hotseat && req.p !== this.viewP && G.Prog.d.settings.privacy && ['hand', 'deck', 'opphand'].includes(req.from)) this.passVeil(req.p).then(go);
        else { if (this.hotseat && ['hand', 'deck'].includes(req.from)) this.viewP = req.p; go(); }
      });
    }
    askText(req) { const s = t('ask.' + req.purpose, { v: req.v, n: req.max }); return this.hotseat ? this.g.P[req.p].name + ': ' + s : s; }
    boardAsk(req, finish) {
      this.render();
      const pr = el('div.prompt', el('span', this.askText(req)), (req.min === 0 || req.cancel) ? el('button.btn.small', { onclick: () => finish([]) }, t('skip')) : null);
      this.root.appendChild(pr); this.promptEl = pr;
    }
    pickerAsk(req, finish) {
      const g = this.g; const p = req.p; const pl = g.P[p];
      let pool = req.options.slice();
      if (req.showAll) { const src = req.from === 'deck' ? pl.deck : req.from === 'discard' ? pl.discard : req.from === 'opphand' ? (req.all || g.P[1 - p].hand) : req.from === 'hand' ? pl.hand : req.options; pool = G.uniq(src.concat(req.options)); }
      const ord = ['creature', 'effect', 'relic', 'action', 'god', 'marker', 'charge'];
      pool.sort((a, b) => (ord.indexOf(g.c(a).kind) - ord.indexOf(g.c(b).kind)) || (G.CARD_ORDER.indexOf(g.inst[a].id) - G.CARD_ORDER.indexOf(g.inst[b].id)));
      const max = req.max == null ? 1 : req.max, min = req.min == null ? 1 : req.min; const sel = new Set();
      const ok = el('button.btn.primary', {}, max === 0 ? t('ok') : t('confirm')); const cnt = el('small.muted');
      const upd = () => { ok.disabled = !(sel.size >= min && sel.size <= max); cnt.textContent = max > 0 ? t('pick.count', { n: sel.size, m: max }) : ''; };
      const w = Math.min(118, innerWidth / 3.6);
      const grid = el('div.grid', { style: { '--gw': (w + 6) + 'px' } }, pool.map((u) => {
        const opt = req.options.includes(u); const cell = el('div.cell' + (opt ? '' : '.dim'), G.ui.card(g.inst[u].id, { w }));
        let tm; cell.addEventListener('pointerdown', () => { tm = setTimeout(() => { tm = null; G.ui.zoom(g.inst[u].id); }, 450); });
        cell.addEventListener('pointerup', () => { if (!tm) return; clearTimeout(tm); if (!opt || max === 0) return; if (sel.has(u)) sel.delete(u); else { if (max === 1) { sel.clear(); G.$$('.cell.on', grid).forEach((x) => x.classList.remove('on')); } if (sel.size < max) sel.add(u); } cell.classList.toggle('on', sel.has(u)); G.audio.play('card'); upd(); });
        cell.addEventListener('contextmenu', (e) => e.preventDefault());
        return cell;
      }));
      ok.addEventListener('click', () => { if (!ok.disabled) finish(Array.from(sel)); });
      const foot = el('div.row', { style: { justifyContent: 'flex-end', marginTop: '.6rem' } }, cnt, el('span.grow'), min === 0 && max > 0 ? el('button.btn.ghost', { onclick: () => finish([]) }, t('skip')) : null, ok);
      upd();
      this.pickerM = G.ui.modal(el('div.picker', el('p.muted', t('pick.hint')), grid, foot), { title: this.askText(req), dismiss: false });
    }
    passVeil(p) {
      return new Promise((r) => {
        const v = el('div.passveil', el('h2', t('d.passTo', { n: this.g.P[p].name })), el('p.muted', t('d.passDesc')), el('button.btn.primary', { onclick: () => { v.remove(); this.viewP = p; this.render(); r(); } }, t('d.ready')));
        this.root.appendChild(v);
      });
    }
    onHumanTurn(p) {
      if (this.hotseat && this.viewP !== p) { if (G.Prog.d.settings.privacy) { this.passVeil(p).then(() => this.refreshMentor()); return; } this.viewP = p; }
      this.render(); this.refreshMentor(); this.deckWarn(p);
    }
    deckWarn(p) { const n = this.g.P[p].deck.length; if (n <= 5 && this._warned !== n) { this._warned = n; G.ui.toast(n === 0 ? t('d.deckEmpty') : t('d.deckLow', { n }), null, 4200); } }
    // ---------- Mentor ----------
    setMentor(html, ids) {
      G.$$('.hint', this.root).forEach((n) => n.classList.remove('hint'));
      if (!this.mentorOn) return;
      if (!this.mentorEl) { this.mentorEl = el('div.mentor', el('div.ic'), el('div.tx')); this.mentorEl.addEventListener('click', () => this.mentorEl.classList.toggle('min')); this.root.appendChild(this.mentorEl); }
      this.mentorEl.querySelector('.tx').innerHTML = '<b>' + t('m.name') + '</b> ' + html;
      (ids || []).forEach((u) => { const n = this.root.querySelector(`[data-u="${u}"]`); if (n) n.classList.add('hint'); });
    }
    refreshMentor() {
      if (!this.mentorOn) return; const g = this.g;
      if (!this.canAct()) { if (!this.askState) this.setMentor(g.cur === 0 ? t('m.watch') : t('m.wait'), []); return; }
      const s = G.AIH.suggest(g, 0); this.setMentor(this.mentorText(s), [s.a.u, s.a.target].filter(Boolean));
    }
    mentorText(s) {
      const g = this.g; const a = s.a; const p = 0; const n = (u) => G.cardName(g.inst[u].id); let txt = '';
      const first = g.first === 0 && g.turn === 1 ? t('m.firstTurn') + ' ' : '';
      switch (a.type) {
        case 'bench': txt = t('m.bench', { c: n(a.u) }); break;
        case 'ascend': txt = t('m.ascend', { b: n(a.target), c: n(a.u) }); break;
        case 'attach': {
          const aff = g.c(a.u).aff; const before = G.AIH.need(g, a.target), after = G.AIH.need(g, a.target, [aff]);
          txt = after === 0 && before > 0 ? t('m.attachNow', { ch: n(a.u), c: n(a.target) }) : t('m.attach', { ch: n(a.u), c: n(a.target), k: after }); break;
        }
        case 'relic': txt = t('m.relic', { r: n(a.u), c: n(a.target) }); break;
        case 'effect': txt = t('m.effect', { c: n(a.u), d: G.effectText(g.c(a.u), G.lang) }); break;
        case 'action': txt = t('m.action', { c: n(a.u), d: G.actionText(g.c(a.u), G.lang) }); break;
        case 'god': txt = t('m.god', { c: n(a.u), a: G.L(G.AFF[g.c(a.u).aff]) }); break;
        case 'ability': txt = t('m.ability', { c: n(a.u) }); break;
        case 'retreat': txt = t('m.retreat', { c: n(g.P[p].active), b: n(a.target) }); break;
        case 'attack': {
          const act = g.P[p].active; const atk = g.c(act).attacks[a.i]; const info = s.info || G.AIH.attackScore(g, p, a.i);
          const pv = g.previewAttack(act, a.i);
          txt = (info.ko ? t('m.attackKO', { a: G.L(atk.name), d: info.dmg, c: n(info.target), k: G.AIH.prizesFor(g, info.target) }) : t('m.attack', { a: G.L(atk.name), d: info.dmg, c: info.target ? n(info.target) : '' })) + (pv.weak ? ' ' + t('m.weak') : '');
          return first + txt;
        }
        default: txt = t('m.end');
      }
      return first + txt;
    }
    mentorAsk(req) {
      if (!this.mentorOn || req.p !== 0) return;
      try { const pick = new G.AI(1).choose(this.g, req); this.setMentor(pick.length ? t('m.ask', { c: pick.map((u) => G.cardName(this.g.inst[u].id)).join(', ') }) : t('m.askSkip'), pick); } catch (e) { }
    }
    // ---------- eventos do motor ----------
    onLog(e) {
      const s = G.logText(e, this.g); if (!s) return;
      this.logEl.appendChild(el('div.le.' + (e.a.p != null ? 'p' + e.a.p : 'sys'), s)); this.logEl.scrollTop = 1e6;
    }
    center(n) { const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
    floatAt(n, text, cls, dy) {
      if (!n) return; const [x, y] = this.center(n); const rr = this.root.getBoundingClientRect();
      const f = el('div.floatnum.' + cls, { style: { left: (x - rr.left) + 'px', top: (y - rr.top + (dy || 0)) + 'px', animationDuration: this.dur(1100) + 'ms' } }, text);
      this.root.appendChild(f); setTimeout(() => f.remove(), this.dur(1150));
    }
    async banner(title, sub, ms) { const b = el('div.banner', { style: { animationDuration: this.dur(ms || 1100) + 'ms' } }, el('h2', title), sub ? el('small', sub) : null); this.root.appendChild(b); await this.wait(ms || 1100); b.remove(); }
    async showcase(u, ms) { const id = this.g.inst[u].id; const s = el('div.showcase', G.ui.card(id, { w: Math.min(innerWidth * 0.58, 240) })); this.root.appendChild(s); G.audio.play('card'); await this.wait(ms); s.remove(); }
    async coin(d) {
      const lbl = el('div.lbl', t('coin.' + d.label));
      const spin = el('div.spin', el('div.f.sun', { style: { backgroundImage: `url(${G.uiUrl('coin_sun')})` } }), el('div.f.moon', { style: { backgroundImage: `url(${G.uiUrl('coin_moon')})` } }));
      const toss = el('div.toss', spin); const sh = el('div.shadow');
      const c = el('div.coin3d', sh, toss, lbl); this.root.appendChild(c);
      const D = this.dur(1200); G.audio.play('whoosh'); G.audio.play('coin');
      spin.animate([{ transform: 'rotateX(0deg)' }, { transform: `rotateX(${d.heads ? 2160 : 2340}deg)` }], { duration: D * 0.82, easing: 'cubic-bezier(.12,.6,.25,1)', fill: 'forwards' });
      toss.animate([{ transform: 'translateY(60px) scale(.5)', filter: 'blur(0)' }, { transform: 'translateY(-180px) scale(1.18)', filter: 'blur(1.2px)', offset: 0.42 }, { transform: 'translateY(0) scale(1)', filter: 'blur(0)', offset: 0.82 }, { transform: 'translateY(-16px) scale(1.03)', offset: 0.9 }, { transform: 'translateY(0) scale(1)' }], { duration: D, easing: 'ease-in-out', fill: 'forwards' });
      sh.animate([{ transform: 'scale(1)', opacity: 0.7 }, { transform: 'scale(.3)', opacity: 0.2, offset: 0.42 }, { transform: 'scale(1)', opacity: 0.75, offset: 0.82 }, { transform: 'scale(1)', opacity: 0.75 }], { duration: D, fill: 'forwards' });
      await this.wait(1200 * 0.82);
      const r = toss.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      G.audio.play('hit'); G.fx.ring(cx, cy, [d.heads ? '#ffd27a' : '#dfe6ff']); G.fx.sparks(cx, cy, d.heads ? ['#ffd27a', '#fff'] : ['#cfd8ff', '#fff']); this.shake(4);
      await this.wait(1200 * 0.18);
      lbl.textContent = t('coin.' + d.label) + ' — ' + (d.heads ? t('sun') : t('moon')); lbl.classList.add('on'); G.audio.play(d.heads ? 'charge' : 'cond');
      await this.wait(700); c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.dur(260), fill: 'forwards' }); await this.wait(260); c.remove();
    }
    fanHand() {
      const z = this.z.hand; const cs = Array.from(z.children); if (!cs.length) return;
      const w = cs[0].offsetWidth || 80; const n = cs.length; const narrow = innerWidth < 640;
      const avail = z.clientWidth - 18 - (n > 6 ? w * (narrow ? 0.45 : 0.3) : 0); if (avail <= 0) { requestAnimationFrame(() => this.fanHand()); return; }
      const ml = n > 1 && n * w > avail ? Math.max(-w * 0.86, (avail - w) / (n - 1) - w) : -Math.round(w * 0.04);
      const maxRot = n > 1 ? Math.min(narrow ? 7 : 11, 2 + n * 0.6) : 0; const curve = w * 0.1;
      cs.forEach((c, k) => { const tt = n > 1 ? (k - (n - 1) / 2) / ((n - 1) / 2) : 0; c.style.marginLeft = k ? ml + 'px' : '0px'; c.style.zIndex = k + 1; c.style.setProperty('--rot', (tt * maxRot).toFixed(2) + 'deg'); c.style.setProperty('--ty', (tt * tt * curve).toFixed(1) + 'px'); });
    }
    async projectile(a, b, color) {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      const p = el('div.proj', { style: { '--pc': color, left: (ra.left + ra.width / 2 - rr.left) + 'px', top: (ra.top + ra.height / 2 - rr.top) + 'px' } });
      this.root.appendChild(p); const dx = rb.left - ra.left + (rb.width - ra.width) / 2, dy = rb.top - ra.top + (rb.height - ra.height) / 2; const D = this.dur(360);
      G.audio.play('whoosh');
      p.animate([{ transform: 'translate(0,0) scale(.6)' }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 50}px) scale(1.25)` }, { transform: `translate(${dx}px,${dy}px) scale(.9)` }], { duration: D, easing: 'ease-in' });
      for (let k = 1; k <= 7; k++) setTimeout(() => { const q = p.getBoundingClientRect(); if (q.width) G.fx.burst(q.left + q.width / 2, q.top + q.height / 2, { n: 4, color: [color, '#fff'], spd: 0.6, grav: 0, size: 2, life: 18 }); }, D * k / 8);
      await this.wait(360); p.remove();
    }
    decal(n) {
      if (!n) return; const r = n.getBoundingClientRect(), rr = this.root.getBoundingClientRect(); const s = [];
      for (let k = 0; k < 6; k++) { const x = 10 + Math.random() * 80, y = 10 + Math.random() * 75, q = 10 + Math.random() * 20; s.push(`radial-gradient(circle at ${x}% ${y}%, rgba(130,0,12,.95) 0 ${q * 0.4}%, rgba(90,0,8,.55) ${q * 0.65}%, transparent ${q}%)`); }
      const d = el('div.decal', { style: { left: (r.left - rr.left) + 'px', top: (r.top - rr.top) + 'px', width: r.width + 'px', height: r.height + 'px', background: s.join(',') } });
      this.root.appendChild(d); setTimeout(() => d.remove(), 2600);
    }
    shake(px) { this.board.animate([0, 1, 2, 3, 4, 5].map((k) => ({ transform: k === 5 ? 'none' : `translate(${(Math.random() * 2 - 1) * px}px,${(Math.random() * 2 - 1) * px}px)` })), { duration: this.dur(320), easing: 'linear' }); }
    mcircleXY(x, y, color) {
      const rr = this.root.getBoundingClientRect();
      const c = el('div.mcircle', { style: { left: (x - rr.left) + 'px', top: (y - rr.top) + 'px', color, animationDuration: this.dur(1000) + 'ms' }, html: MCSVG });
      this.root.appendChild(c); setTimeout(() => c.remove(), this.dur(1050)); G.fx.spiral(x, y, [color, '#fff']);
    }
    mcircle(n, color) { if (!n) return; const [x, y] = this.center(n); this.mcircleXY(x, y, color); }
    async outro(r) {
      const win = this.cfg.spectate ? null : (r.winner === 0 ? true : r.winner === 1 ? false : null);
      document.body.classList.remove('cur-wait', 'cur-target');
      this.root.classList.add('ending');
      const title = this.cfg.spectate ? (r.winner != null ? t('log.win', { name: this.g.P[r.winner].name }) : t('res.draw')) : (win === true ? t('res.win') : win === false ? t('res.lose') : t('res.draw'));
      this.root.appendChild(el('div.endban', el('h1.' + (win === false ? 'lose' : 'win'), title), el('small', t('reason' + (win === true ? 'W.' : win === false ? 'L.' : '.') + (r.reason || 'prizes')))));
      G.audio.music(null); G.audio.play(win === false ? 'defeat' : 'victory');
      if (win !== false) setTimeout(() => G.fx.soul(innerWidth / 2, innerHeight * 0.45, ['#fff1b0', '#f2d68d', '#ff9a4d']), 250);
      await G.sleep(2300);
    }
    slash(n, color) {
      const [x, y] = this.center(n); const rr = this.root.getBoundingClientRect();
      const s = el('div.slash', { style: { left: (x - rr.left) + 'px', top: (y - rr.top) + 'px' }, html: `<svg viewBox="0 0 100 100" width="180" height="180"><path d="M8 88 L92 12" stroke="${color}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M18 94 L96 26" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>` });
      this.root.appendChild(s); setTimeout(() => s.remove(), this.dur(450));
    }
    async ev(type, d) {
      await this.gate(); const g = this.g;
      switch (type) {
        case 'sync': case 'start': case 'setupDone': case 'switch': case 'promote': case 'bounce': case 'discardRelic': case 'godGone': case 'handDiscard': this.render(); return this.wait(type === 'sync' ? 260 : 380);
        case 'draw': G.audio.play('draw'); this.render(); return this.wait(300);
        case 'shuffle': G.audio.play('shuffle'); return this.wait(160);
        case 'turn': this.render(); G.audio.play('turn'); return this.banner(this.humans[d.p] && !this.hotseat && !this.cfg.spectate ? t('d.yourTurn') : t('d.turnOf', { n: g.P[d.p].name }), t('d.turnN', { n: g.turn }), 1000);
        case 'coin': return this.coin(d);
        case 'play': G.audio.play('place'); this.render(); await this.wait(380); { const n = this.tokEl(d.u); if (n) { const [x, y] = this.center(n); G.fx.burst(x, y, { n: 18, color: ['#e8dcc2', '#c9a24e'], spd: 2.2, grav: 0.05, size: 2, life: 30 }); } } return;
        case 'attach': { G.audio.play('charge'); const col = G.AFF[g.c(d.u).aff].glow; const src = d.from ? this.tokEl(d.from) : null; const sc = src ? this.center(src) : null; this.render(); await this.wait(d.steal ? 120 : 300); const n = this.tokEl(d.target); if (n) { const [x, y] = this.center(n); if (sc) await this.orbFly(sc[0], sc[1], x, y, [col, '#fff'], this.dur(420)); G.fx.ring(x, y, [col]); G.fx.burst(x, y, { n: 14, color: [col, '#fff'], spd: 1.8, grav: -0.04, size: 2, life: 30 }); if (d.steal) { this.floatAt(n, t('d.stolen'), 'txt'); await this.wait(420); } } return; }
        case 'relic': { G.audio.play('place'); this.render(); await this.wait(300); const n = this.tokEl(d.target || d.u); if (n) { const [x, y] = this.center(n); G.fx.ring(x, y, ['#ffe08a']); this.mcircle(n, '#e7c873'); } return this.wait(200); }
        case 'ascend': { G.audio.play('rare'); this.render(); await this.wait(380); const n = this.tokEl(d.u); if (n) { const [x, y] = this.center(n); this.beam(x, y, G.AFF[g.c(d.u).aff].glow); G.fx.soul(x, y, [G.AFF[g.c(d.u).aff].glow, '#fff']); } return this.wait(350); }
        case 'god': { G.audio.play('choir', [57, 64, 69]); await this.showcase(d.u, 1000); this.render(); const dz = this.z.dom; if (dz) { const [x, y] = this.center(dz); this.beam(x, y, '#ffe08a'); } return this.wait(400); }
        case 'reveal': { const kk = g.c(d.u).kind; if (kk === 'effect' || kk === 'action' || kk === 'god') this.mcircleXY(innerWidth / 2, innerHeight * 0.45, kk === 'action' ? '#7fa8ff' : kk === 'god' ? '#ffe08a' : '#6fe3d6'); return this.showcase(d.u, d.marker ? 900 : (this.humans[d.p] && !this.cfg.spectate ? 550 : 1000)); }
        case 'ability': { const n = this.tokEl(d.u); G.audio.play('charge'); this.mcircle(n, '#c98bff'); this.floatAt(n, t('gift') + ': ' + G.L(d.a.name), 'txt'); return this.wait(550); }
        case 'attackStart': { const n = this.tokEl(d.u); if (n) n.classList.add('acting'); G.audio.play('whoosh'); this.floatAt(n, G.L(g.c(d.u).attacks[d.i].name), 'txt', -40); await this.wait(480); if (n) n.classList.remove('acting'); return; }
        case 'hit': {
          const a = this.tokEl(d.from), b = this.tokEl(d.to); if (!b) return;
          const aid = d.from && g.inst[d.from] ? g.inst[d.from].id : null; let stl = aid ? G.styleOf(aid) : 'blade'; const pal = aid ? G.pal(aid) : [G.AFF[d.aff].glow, '#ffffff'];
          if ((d.bench || d.splash) && !['arrow', 'gun', 'orb'].includes(stl)) stl = 'orb';
          const ranged = ['arrow', 'gun', 'orb'].includes(stl);
          if (a && ranged) await this.ranged(a, b, stl, pal); else if (a) await this.melee(a, b, stl);
          this.styledSlash(b, stl, d.aff, pal); G.audio.play(stl === 'gun' ? 'hit' : 'slash');
          if (d.v > 0) {
            G.audio.play('hit'); if (d.v >= 30) G.audio.play('blood');
            b.classList.remove('dmgshake'); void b.offsetWidth; b.classList.add('dmgshake');
            const [x, y] = this.center(b); G.fx.blood(x, y); G.fx.sparks(x, y, [G.AFF[d.aff].glow, '#fff']); if (d.v >= 50) G.fx.splat(x, y); this.decal(b); if (d.v >= 60) this.shake(d.v >= 100 ? 10 : 6);
            this.floatAt(b, '−' + d.v, 'dmg'); if (d.weak) this.floatAt(b, t('d.weak'), 'txt', 34); if (d.res) this.floatAt(b, t('d.res'), 'txt', 34);
          } else { this.floatAt(b, '0', 'dmg'); G.audio.play('cond'); }
          return this.wait(d.splash ? 260 : 540);
        }
        case 'damage': { const n = this.tokEl(d.u); if (!n) return; this.floatAt(n, '−' + d.v, 'placed'); n.classList.remove('dmgshake'); void n.offsetWidth; n.classList.add('dmgshake'); G.audio.play(d.cond ? 'cond' : 'hit'); if (d.cond) this.floatAt(n, G.L(G.COND_NOUN[d.cond]), 'txt', 30); return this.wait(450); }
        case 'heal': { const n = this.tokEl(d.u); if (!n || !d.v) return; this.floatAt(n, '+' + d.v, 'heal'); const [x, y] = this.center(n); G.fx.heal(x, y); G.audio.play('heal'); return this.wait(380); }
        case 'cond': { this.render(); const n = this.tokEl(d.u); G.audio.play('cond'); this.mcircle(n, CC[d.k]); this.floatAt(n, G.L(G.COND[d.k]), 'txt'); if (n) { const [x, y] = this.center(n); G.fx.burst(x, y, { n: 16, color: [CC[d.k]], spd: 1.5, grav: -0.03, size: 2.2, life: 40 }); } return this.wait(450); }
        case 'ko': { const n = this.tokEl(d.u); if (n) { n.classList.add('ko', 'dmgshake'); const [x, y] = this.center(n); if (G.gfxLevel() >= 2) this.pulverize(n, G.pal(g.inst[d.u].id)); else G.fx.soul(x, y); G.fx.splat(x, y); this.decal(n); this.shake(7); } G.audio.play('ko'); return this.wait(780); }
        case 'prize': {
          const from = this.rectOf(this.pileEl(d.p, 'prize')); const to = this.rectOf(this.handP() === d.p ? this.z.hand : this.z['bar' + d.p]);
          if (from && to) for (let i = 0; i < d.n; i++) { const b = G.ui.back(40); Object.assign(b.style, { position: 'fixed', left: from.left + 'px', top: from.top + 'px', zIndex: 800 }); this.root.appendChild(b); b.animate([{ transform: 'none' }, { transform: `translate(${to.left + to.width / 2 - from.left}px,${to.top - from.top}px) rotate(${10 - i * 8}deg)`, opacity: 0.2 }], { duration: this.dur(600), easing: 'ease-in-out' }).onfinish = () => b.remove(); }
          G.audio.play('coin'); if (this.humans[d.p] || this.cfg.spectate) G.ui.toast(t('d.prize', { n: d.n, name: g.P[d.p].name })); this.render(); return this.wait(650);
        }
        case 'retreat': G.audio.play('whoosh'); this.render(); return this.wait(380);
        case 'strip': G.audio.play('cond'); this.render(); return this.wait(300);
        case 'mulligan': G.ui.toast(t('log.mulligan', { name: g.P[d.p].name })); return this.wait(700);
        case 'checkup': { const any = [0, 1].some((q) => g.P[q].active && g.anyCond(g.P[q].active)); if (any) return this.banner(t('d.checkup'), null, 700); return; }
        case 'miss': this.floatAt(this.tokEl(d.u), t('d.miss'), 'txt'); return this.wait(500);
        case 'debuff': { this.render(); const n = this.tokEl(d.u); G.audio.play('cond'); this.mcircle(n, d.k === 'feeble' ? '#9fb4ff' : '#ff7a9a'); this.floatAt(n, t('es.' + d.k), 'txt'); return this.wait(520); }
        case 'fatigue': G.audio.play('bell'); return this.banner(t('d.fatigueT'), t('d.fatigue', { name: g.P[d.p].name }), 1400);
        case 'sacrifice': G.audio.play('blood'); G.audio.play('groan'); return this.wait(400);
      }
    }
    async run() {
      const s = document.getElementById('screen'); G.fill(s, this.root); s.className = '';
      document.body.classList.add('induel'); G.App.cur = 'duel';
      const arena = this.cfg.arena || G.Prog.ARENAS[0]; G.fx.ambient(arena.amb); G.audio.arenaMood = 'arena_' + arena.id; G.audio.music(G.audio.arenaMood);
      this.root.classList.add('intro'); this.render();
      const ib = el('div.introban', el('small', G.L(arena.name)), el('h2', this.g.P[0].name, el('em', ' ' + t('vs') + ' '), this.g.P[1].name));
      this.root.appendChild(ib); G.audio.play('horn'); G.audio.play('drum');
      await G.sleep(1400); this.root.classList.remove('intro'); ib.classList.add('out'); await G.sleep(650); ib.remove();
      const r = await this.g.run();
      if (this.promptEl) this.promptEl.remove(); if (this.pickerM) this.pickerM.close(); if (this.mentorEl) this.mentorEl.remove();
      await this.outro(r);
      this.finish(r);
    }
    finish(r) {
      const g = this.g; const cfg = this.cfg;
      if (r.reason === 'error') G.ui.toast(t('d.error'));
      if (cfg.spectate) { G.Prog.recordMatch({ mode: 'spectate' }); if (this.exitSpec) { G.App.go('hub'); return; } G.App.go('results', { mode: 'spectate', win: null, reason: r.reason, turns: r.turns, winnerName: r.winner != null ? g.P[r.winner].name : null }); return; }
      const win = r.winner === 0 ? true : r.winner === 1 ? false : null;
      const info = { mode: cfg.mode, win, oppMmr: cfg.players[1].mmr, oppName: cfg.players[1].name, oppAff: cfg.players[1].aff, turns: r.turns, st: g.P[0].st, reason: r.reason, conceded: r.reason === 'concede' && r.winner === 1, lostPrizes: g.P[1].st.prizes, deckAff: cfg.deckAff };
      const rewards = G.Prog.recordMatch(info);
      if (rewards.essence) setTimeout(() => G.ui.toast('✦ ' + t('ess.drop')), 1200);
      (rewards.mastery || []).forEach((x, i) => setTimeout(() => G.ui.toast(t('mas.up', { c: G.cardName(x.id), l: t('mas.lv' + x.to) })), 2000 + i * 1500));
      if (cfg.mode === 'cup') { const st = G.Prog.cupGame(win === true, cfg.players[0].deck); G.App.go('cup', { last: { win: win === true, st } }); return; }
      G.App.go('results', { mode: cfg.mode, win, reason: r.reason, turns: r.turns, rewards, souls: [g.P[0].st.prizes, g.P[1].st.prizes] });
    }
  }
  D.View = View;
  D.start = async function (cfg) {
    const ids = ['coin_sun']; const scan = (o, dep) => { if (!o || dep > 3) return; if (Array.isArray(o)) o.forEach((x) => { if (typeof x === 'string' && G.CARDS[x]) ids.push(G.CARDS[x].art); else scan(x, dep + 1); }); else if (typeof o === 'object') Object.keys(o).forEach((k) => scan(o[k], dep + 1)); }; scan(cfg, 0);
    const work = Promise.all([G.preloadArt(ids.filter((x) => G.CARDS[x] || /^[a-z]\d/.test(x))), G.audio.renderMood ? G.audio.renderMood('arena_' + ((cfg.arena || G.Prog.ARENAS[0]).id)) : null]).catch(() => { });
    await G.App.loader(1300, Promise.race([work, G.sleep(5000)])); const v = new View(cfg); D.current = v; return v.run();
  };
})(typeof window !== 'undefined' ? window : globalThis);
