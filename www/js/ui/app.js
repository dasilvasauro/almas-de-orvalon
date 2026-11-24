/* Almas de Orvalon — telas e navegação */
(function (root) {
  const G = root.G; const el = G.el; const t = (k, p) => G.t(k, p); const P = () => G.Prog.d; const I = () => G.ICON;
  const App = G.App = { cur: null };
  const scr = () => document.getElementById('screen');
  const NAV = [['hub', 'play', 'nav.play'], ['decks', 'decks', 'nav.decks'], ['collection', 'coll', 'nav.coll'], ['shop', 'shop', 'nav.shop'], ['profile', 'prof', 'nav.prof']];
  App.go = function (name, arg) {
    App.cur = name; G.click();
    const s = scr(); const old = Array.from(s.children);
    if (old.length) { const ov = el('div.xfade'); ov.className = 'xfade ' + s.className; old.forEach((n) => ov.appendChild(n)); document.body.appendChild(ov); requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('go'))); setTimeout(() => ov.remove(), 560); }
    s.className = '';
    document.body.classList.toggle('induel', name === 'duel'); document.body.classList.remove('cur-wait', 'cur-target');
    if (name !== 'duel') { G.fx.ambient(null); G.audio.music('menu'); if (G.audio.warm) G.audio.warm(['menu'].concat(G.Prog.arenasUnlocked().map((a) => 'arena_' + a.id), ['victory', 'defeat'])); if (!G.$('.bgglow')) document.body.prepend(el('div.bgglow')); }
    const fn = S[name]; const node = fn(arg);
    if (node) { node.classList.add('fadein'); s.appendChild(node); }
    if (NAV.some((n) => n[0] === name) || ['achievements', 'ranking', 'settings', 'tutorial', 'deckEdit', 'calendar', 'chronicle'].includes(name)) {
      s.classList.add('has-nav');
      const nav = el('nav.nav', NAV.map(([k, ic, lb]) => el('button' + ((name === k || (name === 'deckEdit' && k === 'decks')) ? '.on' : ''), { onclick: () => App.go(k) }, el('span', { html: G.ICON[ic] }), t(lb))));
      s.appendChild(nav);
    }
  };
  const S = App.S = {};
  App.tip = () => { const L = G.TIPS[G.lang] || G.TIPS.pt; return L[Math.floor(Math.random() * L.length)]; };
  const ORN = '<svg viewBox="0 0 240 20" width="230" height="18" aria-hidden="true"><path d="M0 10 H96 M144 10 H240" stroke="#c9a24e" stroke-width="1.4"/><path d="M120 1 L129 10 L120 19 L111 10 Z" fill="#f2d68d"/><circle cx="101" cy="10" r="2.6" fill="#c9a24e"/><circle cx="139" cy="10" r="2.6" fill="#c9a24e"/></svg>';
  App.logo = () => { const big = t('title.big'); return el('div.logo', el('div.orn', { html: ORN }), el('div.lsmall', t('title.small')), el('h1.lbig', { 'data-t': big }, big.split('').map((ch, i) => el('span', { style: { animationDelay: (0.15 + i * 0.07) + 's, 0s', '--i': i } }, ch))), el('div.orn.b', { html: ORN })); };
  // carregamento curto (logo pulsando + dica)
  App.loader = (ms, work) => new Promise((res) => {
    const l = el('div.loader', App.logo(), el('p.tip', App.tip())); document.body.appendChild(l);
    Promise.all([G.sleep(ms || 1200), work || null]).then(() => { l.classList.add('out'); setTimeout(() => { l.remove(); res(); }, 520); });
  });
  // carregamento de abertura (uma imagem de loading por vez)
  App.bootLoad = (next) => {
    const img = G.uiUrl('loading' + (1 + Math.floor(Math.random() * 4)));
    const bar = el('i'); const st = el('small.muted'); const steps = t('boot.steps').split('|');
    const b = el('div.boot', el('div.bart', { style: { backgroundImage: `url(${img})` } }), App.logo(), el('div.pbar', bar), st, el('p.tip', App.tip()));
    document.body.appendChild(b); try { G.audio.renderMood && G.audio.ctx && G.audio.renderMood('menu'); } catch (e) { }
    const total = 6200 + Math.random() * 1600; const t0 = performance.now(); let done = false;
    // curva com trechos rápidos e pausas (como um carregamento de verdade)
    const K = [[0, 0], [0.08, 0.12], [0.2, 0.18], [0.3, 0.37], [0.42, 0.41], [0.55, 0.58], [0.68, 0.63], [0.8, 0.82], [0.9, 0.9], [1, 1]];
    const curve = (p) => { for (let k = 1; k < K.length; k++) if (p <= K[k][0]) { const a = K[k - 1], c = K[k]; const u = (p - a[0]) / (c[0] - a[0]); return a[1] + (c[1] - a[1]) * (u * u * (3 - 2 * u)); } return 1; };
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / total); const e = curve(p);
      bar.style.width = (e * 100) + '%'; st.textContent = steps[Math.min(steps.length - 1, Math.floor(p * steps.length))];
      if (p < 1) requestAnimationFrame(tick); else if (!done) { done = true; next(); b.classList.add('out'); setTimeout(() => b.remove(), 700); }
    };
    requestAnimationFrame(tick);
  };
  const back = (to) => el('button.btn.icon.ghost', { 'aria-label': t('back'), html: I().back, onclick: () => App.go(to || 'hub') });
  const resBar = () => el('div.row', G.res('shard', G.fmtN(P().shards), t('shards')), G.res('booster', G.Prog.totalPacks(), t('boosters')));
  const top = (title, to) => el('div.topbar', to !== false ? back(to) : null, el('h2.grow', title), resBar());
  function rankBadge(mmr) { const r = G.Prog.rankOf(mmr); return el('span.rankb', { style: { color: r.t.color } }, r.label); }

  // ---------- onboarding ----------
  S.onboard = function (step) {
    step = step || 0; const wrap = el('div.scr', el('div.scroll', el('div.onb')));
    const box = wrap.querySelector('.onb');
    const title = el('div.hub-title', App.logo());
    if (step === 0) {
      box.append(title, el('h3', 'Escolha o idioma · Choose your language'), el('div.row', el('button.btn.gilded', { onclick: () => { P().lang = 'pt'; G.lang = 'pt'; G.Prog.save(); App.go('onboard', 1); } }, 'Português (Brasil)'), el('button.btn.gilded', { onclick: () => { P().lang = 'en'; G.lang = 'en'; G.Prog.save(); App.go('onboard', 1); } }, 'English')));
    } else if (step === 1) {
      const inp = el('input', { maxlength: 18, value: P().name || '', placeholder: t('onb.namePh'), 'aria-label': t('onb.name') });
      box.append(title, el('p.lore', G.L(G.LORE)), el('div.field', { style: { width: 'min(360px,100%)' } }, el('label', t('onb.name')), inp),
        el('button.btn.primary', { onclick: () => { const v = inp.value.trim(); if (v.length < 2) { G.ui.toast(t('onb.nameShort')); return; } P().name = v; G.Prog.save(); App.go('onboard', 2); } }, t('next')));
    } else if (step === 2) {
      let sel = null; const grid = el('div.starters');
      G.STARTERS.forEach((s) => {
        const deck = G.starterDeck(s); const aff2 = s.aff2;
        const b = el('button.starter', { onclick: () => { sel = s; G.$$('.starter', grid).forEach((x) => x.classList.remove('on')); b.classList.add('on'); go.disabled = false; } },
          el('div.bg', { style: { backgroundImage: `url(${G.artUrl(s.cover)})` } }),
          el('div.in', el('h3', G.L(s.name)), el('div.row', G.orb(s.aff), G.L(G.AFF[s.aff]), '+', G.orb(aff2), G.L(G.AFF[aff2])), el('small.muted', t('onb.region', { r: G.L(G.REGIONS[Object.keys(G.REGIONS).find((k) => G.REGIONS[k].aff === s.aff)].name) }))));
        grid.appendChild(b);
      });
      const go = el('button.btn.primary', { disabled: true, onclick: () => { if (!sel) return; G.Prog.grantStarter(sel); P().onboarded = true; G.Prog.checkDaily(); G.Prog.save(); App.go('onboard', 3); } }, t('onb.take'));
      box.append(el('h2', t('onb.pick')), el('p.muted', t('onb.pickDesc')), grid, go);
    } else {
      box.append(el('h2', t('onb.ready', { n: P().name })), el('p', t('onb.readyDesc')), el('div.row.wrap', { style: { justifyContent: 'center' } },
        el('button.btn.gilded', { onclick: () => App.go('tutorial', 0) }, t('onb.learn')), el('button.btn.primary', { onclick: () => App.go('shop') }, t('onb.open')), el('button.btn', { onclick: () => App.go('hub') }, t('onb.skip'))));
    }
    return wrap;
  };

  // ---------- hub ----------
  S.hub = function () {
    const d = P(); const r = G.Prog.rankOf(d.mmr);
    const bar = el('div.topbar.hubbar',
      el('button.avatar', { style: { backgroundImage: `url(${G.artUrl(d.avatar)})` }, 'aria-label': t('nav.prof'), onclick: () => App.go('profile') }),
      el('div.grow', el('div.row', el('b.lvl', d.name), rankBadge(d.mmr)), el('div.row', el('small.muted', t('level') + ' ' + d.level), el('div.xpbar', el('i', { style: { width: (100 * d.xp / G.Prog.xpNeed(d.level)) + '%' } })))),
      resBar(), el('button.btn.icon.ghost', { html: I().gear, 'aria-label': t('settings'), onclick: () => App.go('settings') }));
    const mode = (k, art, desc, fn) => el('button.mode', { onclick: fn }, el('div.bg', { style: { backgroundImage: `url(${G.artUrl(art)})` } }), el('div.in', el('h3', t('mode.' + k)), el('small', t(desc))));
    const cta = el('button.cta', { onclick: () => App.setup('ranked') }, el('div.bg', { style: { backgroundImage: `url(${G.artUrl('h2_15')})` } }), el('div.shade'),
      el('div.in', el('h2', t('mode.ranked')), el('div.row', el('span.rankb', { style: { color: r.t.color } }, r.label), el('small.muted', d.mmr + ' ' + t('mmr'))), el('p', t('mode.rankedDesc'))));
    const sc = el('div.scroll',
      el('div.hub-title', App.logo()),
      el('div.daily', el('span.online', el('i'), t('online', { n: G.fmtN(G.Prog.onlineCount()) })), G.Prog.calCanClaim() ? el('button.chip.on', { onclick: () => App.go('calendar') }, '☾ ' + t('cal.waiting')) : null, G.Prog.totalPacks() ? el('button.chip', { onclick: () => App.go('shop') }, t('hub.boostersReady', { n: G.Prog.totalPacks() })) : null),
      cta,
      el('div.modes',
        mode('quick', 'h2_12', 'mode.quickDesc', () => App.setup('quick')),
        mode('adv', 'h3_21', 'mode.advDesc', () => App.setup('adv')),
        mode('train', 'h3_11', 'mode.trainDesc', () => App.setup('train')),
        mode('spectate', 'h2_04', 'mode.spectateDesc', () => App.setup('spectate')),
        mode('learn', 'e2_11', 'mode.learnDesc', () => App.go('tutorial', 0)),
        mode('ranking', 'h2_01', 'mode.rankingDesc', () => App.go('ranking')),
        mode('cal', 'r1_05', 'mode.calDesc', () => App.go('calendar')),
        mode('chron', 'h2_01', 'mode.chronDesc', () => App.go('chronicle')),
        mode('ach', 'e1_25', 'mode.achDesc', () => App.go('achievements'))));
    return el('div.scr', bar, sc);
  };

  // ---------- preparação de partida ----------
  App.setup = function (mode) {
    const decks = G.Prog.validDecks();
    if (!decks.length && mode !== 'spectate') { G.ui.toast(t('setup.noDeck')); App.go('decks'); return; }
    let deck = decks.find((x) => x.id === P().activeDeck) || decks[0]; let deck2 = decks[1] || decks[0]; let arena = G.Prog.arenasUnlocked()[0];
    let archA = G.STARTERS[0], archB = G.STARTERS[2];
    const body = el('div.col');
    const chips = (list, getL, isOn, onPick) => { const box = el('div.row.wrap'); const draw = () => { G.fill(box, ...list.map((x) => el('button.chip' + (isOn(x) ? '.on' : ''), { onclick: () => { onPick(x); draw(); } }, getL(x)))); }; draw(); return box; };
    if (mode !== 'spectate') {
      body.append(el('h3', mode === 'train' ? t('setup.deckP1') : t('setup.deck')), chips(decks, (x) => x.name, (x) => x === deck, (x) => { deck = x; }));
      if (mode === 'train') body.append(el('h3', t('setup.deckP2')), chips(decks, (x) => x.name, (x) => x === deck2, (x) => { deck2 = x; }));
    } else {
      body.append(el('h3', t('setup.archA')), chips(G.STARTERS, (x) => G.L(x.name), (x) => x === archA, (x) => { archA = x; }), el('h3', t('setup.archB')), chips(G.STARTERS, (x) => G.L(x.name), (x) => x === archB, (x) => { archB = x; }));
    }
    body.append(el('h3', t('setup.arena')), chips(G.Prog.arenasUnlocked(), (x) => G.L(x.name), (x) => x === arena, (x) => { arena = x; }));
    const locked = G.Prog.ARENAS.filter((a) => P().level < a.lvl);
    if (locked.length) body.append(el('small.muted', t('setup.arenaLock', { n: G.L(locked[0].name), l: locked[0].lvl })));
    let m;
    body.append(el('div.row', { style: { justifyContent: 'flex-end', marginTop: '.6rem' } }, el('button.btn.primary', { onclick: () => { m.close(); App.launch(mode, { deck, deck2, arena, archA, archB }); } }, t(mode === 'ranked' ? 'setup.find' : 'setup.start'))));
    m = G.ui.modal(body, { title: t('mode.' + mode) });
  };
  function deckAffOf(cards) { const cnt = {}; cards.forEach((id) => { const c = G.CARDS[id]; if (c.kind === 'creature') cnt[c.aff] = (cnt[c.aff] || 0) + 1; }); return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'pri'; }
  App.deckAffOf = deckAffOf;
  App.launch = async function (mode, o) {
    const d = P(); const me = { name: d.name, avatar: d.avatar, deck: o.deck ? o.deck.cards.slice() : null, mmr: d.mmr, level: d.level };
    if (mode === 'train') return G.Duel.start({ mode, arena: o.arena, players: [Object.assign({}, me, { name: d.name + ' I' }), { name: d.name + ' II', avatar: G.CARDS[o.deck2.cover || o.deck2.cards[0]] ? (o.deck2.cover || 'h3_03') : 'h3_03', deck: o.deck2.cards.slice() }], humans: [true, true] });
    if (mode === 'spectate') {
      const f1 = G.Prog.findOpponent('quick'), f2 = G.Prog.findOpponent('quick');
      return G.Duel.start({ mode, arena: o.arena, spectate: true, players: [{ name: f1.name, avatar: o.archA.cover, deck: G.buildDeck({ aff: o.archA.aff, aff2: o.archA.aff2, q: 0.85, seed: f1.seed, cap: G.Prog.aiCap() }), skill: 0.85 }, { name: f2.name, avatar: o.archB.cover, deck: G.buildDeck({ aff: o.archB.aff, aff2: o.archB.aff2, q: 0.85, seed: f2.seed, cap: G.Prog.aiCap() }), skill: 0.85 }], humans: [false, false] });
    }
    const opp = G.Prog.findOpponent(mode);
    if (mode === 'adv') { opp.skill = G.clamp(d.skill - 0.15, 0.1, 0.8); opp.q = G.clamp(opp.skill + 0.05, 0.2, 0.8); }
    const target = G.deckScore(me.deck) * (1 + (opp.skill - d.skill) * 0.25);
    const oppDeck = G.fairDeck({ aff: opp.aff, aff2: opp.aff2, q: opp.q, seed: opp.seed, cap: G.Prog.aiCap() }, target);
    if (mode === 'ranked') { await App.matchmaking(opp); d.inMatch = { mode, oppMmr: opp.mmr }; G.Prog.save(); }
    await App.versus(me, opp, mode);
    G.Duel.start({ mode, arena: o.arena, mentor: mode === 'adv', deckAff: deckAffOf(me.deck), players: [me, { name: opp.name, avatar: opp.avatar, deck: oppDeck, skill: opp.skill, mmr: opp.mmr, aff: opp.aff, level: opp.level }], humans: [true, false] });
  };
  App.matchmaking = (opp) => new Promise((res) => {
    const s = scr(); const box = el('div.vs', el('div.col', { style: { alignItems: 'center', textAlign: 'center' } }, App.logo(), el('h2', t('mm.searching')), el('p.muted', t('online', { n: G.fmtN(G.Prog.onlineCount()) })), el('small.muted', t('mm.ping', { n: 28 + Math.floor(Math.random() * 40) }))));
    s.appendChild(box); G.audio.play('drum');
    setTimeout(() => { box.querySelector('h2').textContent = t('mm.found'); G.audio.play('horn'); setTimeout(() => { box.remove(); res(); }, 700); }, 1300 + Math.random() * 1600);
  });
  App.versus = (me, opp, mode) => new Promise((res) => {
    const side = (p, right) => el('div.side2' + (right ? '.opp' : '.me'), el('div.big', { style: { backgroundImage: `url(${G.artUrl(p.avatar)})` } }), el('h2', p.name), el('div.row', el('small.muted', t('level') + ' ' + (p.level || 1)), mode === 'ranked' && p.mmr ? rankBadge(p.mmr) : null));
    const v = el('div.vs', side(me), el('h1', 'VS'), side(opp, true));
    scr().appendChild(v); G.audio.play('slash'); G.audio.play('drum');
    setTimeout(() => { v.style.transition = 'opacity .35s'; v.style.opacity = '0'; setTimeout(() => { v.remove(); res(); }, 360); }, 2100);
  });

  // ---------- resultado ----------
  S.results = function (r) {
    const win = r.win; const d = P();
    const box = el('div.result');
    box.append(el('h1.' + (win === true || r.winnerName ? 'win' : 'lose'), r.winnerName ? t('log.win', { name: r.winnerName }) : win === true ? t('res.win') : win === false ? t('res.lose') : t('res.draw')), el('p.muted', t((win === true ? 'reasonW.' : win === false ? 'reasonL.' : 'reason.') + (r.reason || 'prizes'))), r.souls ? el('p', t('res.souls', { a: r.souls[0], b: r.souls[1] })) : null);
    if (r.mode !== 'spectate') {
      const rw = r.rewards;
      box.append(el('div.stats', { style: { width: 'min(560px,100%)' } }, el('div.stat', el('b', '+' + rw.xp), el('span', t('xp'))), el('div.stat', el('b', '+' + rw.shards), el('span', t('shards'))), r.mode === 'ranked' ? el('div.stat', el('b', (rw.mmrDelta >= 0 ? '+' : '') + rw.mmrDelta), el('span', t('mmr'))) : null, el('div.stat', el('b', r.turns), el('span', t('turns')))));
      box.append(el('div', { style: { width: 'min(420px,100%)' } }, el('div.row', el('span.grow', t('level') + ' ' + d.level), el('small.muted', d.xp + '/' + G.Prog.xpNeed(d.level))), el('div.bar', el('i', { style: { width: (100 * d.xp / G.Prog.xpNeed(d.level)) + '%' } }))));
      if (r.mode === 'ranked') box.append(rankBadge(d.mmr));
      rw.ups.forEach((u) => box.append(el('div.tip.good', t('res.levelUp', { l: u.level, b: u.boosters }) + (u.arena ? ' ' + t('res.arena', { n: G.L(G.Prog.ARENAS.find((a) => a.id === u.arena).name) }) : ''))));
      if (rw.ach.length) box.append(el('div.col', { style: { width: 'min(560px,100%)' } }, el('h3', t('res.ach')), rw.ach.slice(0, 8).map((a) => el('div.tip', el('b', G.L(a.n)), ' — ', G.L(a.d), ' (+' + a.sh + ')')), rw.ach.length > 8 ? el('small.muted', t('res.more', { n: rw.ach.length - 8 })) : null));
    }
    box.append(el('div.row.wrap', { style: { justifyContent: 'center' } }, el('button.btn.primary', { onclick: () => App.setup(r.mode === 'spectate' ? 'spectate' : r.mode) }, t('res.again')), el('button.btn', { onclick: () => App.go('hub') }, t('res.menu'))));
    G.audio.music(win === false ? 'defeat' : 'victory');
    return el('div.scr', el('div.scroll', box));
  };

  // ---------- decks ----------
  S.decks = function () {
    const list = el('div.list.section');
    const valid = new Set(G.Prog.validDecks().map((x) => x.id));
    P().decks.forEach((dk) => {
      const errs = G.validateDeck(dk.cards); const ok = valid.has(dk.id);
      list.appendChild(el('div.li',
        el('div.thumb', { style: { backgroundImage: `url(${G.artUrl(dk.cover || dk.cards.find((id) => G.CARDS[id].kind === 'creature') || 'm_06')})` } }),
        el('div.grow', el('b', dk.name, P().activeDeck === dk.id ? ' ★' : ''), el('div', el('small.muted', dk.cards.length + '/40 · ' + (ok ? t('deck.valid') : t('deck.invalid'))))),
        el('button.btn.small', { onclick: () => App.go('deckEdit', dk.id) }, t('edit')),
        el('button.btn.small.ghost', { onclick: () => { P().activeDeck = dk.id; G.Prog.save(); App.go('decks'); } }, t('deck.use')),
        el('button.btn.small.ghost', { onclick: () => { const c = Object.assign({}, dk, { id: G.Prog.newDeckId(), name: dk.name + ' 2', cards: dk.cards.slice() }); G.Prog.saveDeck(c); App.go('decks'); } }, t('deck.dup')),
        el('button.btn.small.ghost', { onclick: async () => { if (await G.ui.confirm(t('deck.delQ', { n: dk.name }))) { G.Prog.deleteDeck(dk.id); App.go('decks'); } } }, t('delete'))));
    });
    const newDeck = () => {
      const body = el('div.col', el('p.muted', t('deck.newDesc')));
      let m; const mk = (aff) => { const cards = aff ? G.buildDeck({ aff, aff2: null, q: 0.75, seed: Date.now() % 100000, pool: Object.assign({}, P().collection) }) : []; const dk = { id: G.Prog.newDeckId(), name: aff ? t('deck.autoName', { a: G.L(G.AFF[aff]) }) : t('deck.newName'), cards, cover: cards.find((id) => G.CARDS[id].kind === 'creature') }; G.Prog.saveDeck(dk); m.close(); App.go('deckEdit', dk.id); };
      body.append(el('button.btn', { onclick: () => mk(null) }, t('deck.empty')), el('div.row.wrap', G.AFF_LIST.map((a) => el('button.chip', { onclick: () => mk(a) }, G.orb(a), t('deck.auto', { a: G.L(G.AFF[a]) })))));
      m = G.ui.modal(body, { title: t('deck.new'), narrow: true });
    };
    return el('div.scr', top(t('nav.decks')), el('div.scroll', el('div.section', el('div.row', el('p.muted.grow', t('deck.intro')), el('button.btn.primary', { onclick: newDeck }, t('deck.new')))), list));
  };

  // análise do deck (dicas de construção)
  const DRAWS = ['draw3', 'reshuffle6', 'swapDraw'];
  const drawFx = ['draw', 'drawTo', 'discardDraw', 'drawDiscard', 'topLook', 'tutor'];
  G.analyzeDeck = function (cards) {
    const cs = cards.map((id) => G.CARDS[id]); const by = (k) => cs.filter((c) => c.kind === k).length;
    const cr = cs.filter((c) => c.kind === 'creature'); const basics = cr.filter((c) => c.stage === 0).length; const legends = cr.filter((c) => c.legend).length;
    const aff = {}; cr.forEach((c) => { aff[c.aff] = (aff[c.aff] || 0) + 1; });
    const ch = {}; cs.filter((c) => c.kind === 'charge').forEach((c) => { ch[c.aff] = (ch[c.aff] || 0) + 1; });
    const need = {}; cr.forEach((c) => c.attacks.forEach((a) => a.cost.forEach((k) => { if (k !== 'neu') need[k] = (need[k] || 0) + 1; })));
    const curve = [0, 0, 0, 0, 0]; cr.forEach((c) => c.attacks.forEach((a) => { curve[Math.min(4, a.cost.length)]++; }));
    const draws = cs.filter((c) => (c.kind === 'action' && DRAWS.includes(c.act)) || (c.kind === 'effect' && c.fx.some((f) => drawFx.includes(f.t)))).length;
    const switches = cs.filter((c) => (c.kind === 'action' && c.act === 'swapDraw') || (c.kind === 'effect' && c.fx.some((f) => f.t === 'switchOwn'))).length + cr.filter((c) => c.ab && c.ab.k === 'swapA').length;
    const ax = { agg: 0, mag: 0, def: 0, ctl: 0, spd: 0 };
    cr.forEach((c) => {
      const best = Math.max(...c.attacks.map((a) => (a.dmg + G.sum(a.fx, (f) => (f.t === 'coins' ? f.n * f.v / 2 : f.t === 'coinPlus' ? f.v / 2 : 0))) / Math.max(1, a.cost.length)));
      ax.agg += best / 10; c.attacks.forEach((a) => a.fx.forEach((f) => { if (f.t === 'cond' || f.t === 'seal' || f.t === 'handDisrupt' || f.t === 'stripOpp' || f.t === 'forceSwitch') ax.ctl += 2; if (f.t === 'healSelf' || f.t === 'healTeam' || f.t === 'guard') ax.def += 1.5; }));
      if (c.attacks.some((a) => a.cost.length <= 1)) ax.spd += 1.5; if (c.ab && ['dr', 'regen', 'regenTeam', 'healA', 'thorns', 'benchWard'].includes(c.ab.k)) ax.def += 3;
    });
    cs.forEach((c) => {
      if (c.kind === 'effect') { ax.mag += 2; c.fx.forEach((f) => { if (['heal', 'healAll', 'healEnd', 'dmgDown', 'activeDmgDown', 'tempShield', 'benchGuard', 'condWard'].includes(f.t)) ax.def += 2; if (['condOpp', 'stripOpp', 'revealHand', 'gustOpp', 'forceSwitchOpp', 'shuffleHands', 'oppPing', 'spread'].includes(f.t)) ax.ctl += 2; if (['atkUp', 'affAtkUp', 'tempAtk'].includes(f.t)) ax.agg += 2; }); }
      if (c.kind === 'relic') { const r = c.r; if (r.atkUp || r.vsRace || r.vsAff || r.vsLegend) ax.agg += 2; if (r.dr || r.hp || r.regen || r.thorns) ax.def += 2; if (r.poisonOnAttack || r.tranceOnAttack || r.lockOppRetreat) ax.ctl += 2; }
      if (c.kind === 'action') ax.mag += 1;
    });
    ax.spd += draws * 1.2;
    const mx = Math.max(1, ...Object.values(ax)); Object.keys(ax).forEach((k) => { ax[k] = Math.round(100 * ax[k] / mx); });
    const sorted = Object.keys(ax).sort((a, b) => ax[b] - ax[a]);
    const style = ax[sorted[0]] - ax[sorted[1]] < 8 ? 'bal' : sorted[0];
    const tips = []; const tp = (k, p, kind) => tips.push({ k, p, kind: kind || 'bad' });
    const n = cards.length;
    if (n < 40) tp('tip.missing', { n: 40 - n }); if (n > 40) tp('tip.over', { n: n - 40 });
    if (basics < 8) tp('tip.basics', { n: basics });
    const charges = by('charge'); if (n >= 30 && charges < 11) tp('tip.fewCharges', { n: charges }); if (charges > 19) tp('tip.manyCharges', { n: charges });
    Object.keys(need).forEach((k) => { if (!ch[k]) tp('tip.noChargeAff', { a: G.L(G.AFF[k]) }); else if (ch[k] < need[k] / 3 && ch[k] < 4) tp('tip.lowChargeAff', { a: G.L(G.AFF[k]) }); });
    cr.filter((c) => c.stage === 1 && !cards.some((x) => G.baseId(x) === c.from)).forEach((c) => tp('tip.orphan', { c: G.L(c.name), b: G.cardName(c.from) }));
    const affs = Object.keys(aff).filter((a) => a !== 'pri'); if (affs.length >= 3) tp('tip.tooManyAff', { n: affs.length });
    if (n >= 30 && draws < 4) tp('tip.fewDraw', { n: draws });
    if (n >= 30 && switches === 0) tp('tip.noSwitch');
    if (legends > 3) tp('tip.legends', { n: legends });
    const main = Object.keys(aff).sort((a, b) => aff[b] - aff[a])[0];
    if (main) tp('tip.weakTo', { a: G.L(G.AFF[G.WEAK[main]]), m: G.L(G.AFF[main]) }, 'info');
    if (!tips.some((x) => x.kind === 'bad') && n === 40) tp('tip.solid', {}, 'good');
    return { n, kinds: { creature: cr.length, effect: by('effect'), relic: by('relic'), action: by('action'), god: by('god'), marker: by('marker'), charge: charges }, basics, legends, aff, ch, curve, ax, style, tips, draws };
  };

  S.deckEdit = function (id) {
    const dk = P().decks.find((x) => x.id === id); if (!dk) return S.decks();
    const cards = dk.cards.slice(); let filter = { kind: 'all', aff: 'all', q: '', owned: true, rar: 'all' };
    const dst = P().settings.deckColl = P().settings.deckColl || { sort: 'num', dir: 1, view: 'm' };
    const cnt = (cid) => cards.filter((x) => x === cid).length;
    const name = el('input', { value: dk.name, maxlength: 24, style: { background: 'transparent', border: 0, color: 'var(--bone)', fontFamily: 'var(--disp)', fontSize: '1.3rem', width: '100%' }, 'aria-label': t('deck.name') });
    const countEl = el('b.sc');
    const collGrid = el('div.grid', { style: { '--gw': '112px' } }); const deckList = el('div.decklist'); const ana = el('div');
    const save = () => { dk.cards = cards.slice(); dk.name = name.value.trim() || dk.name; dk.cover = dk.cover && cards.includes(dk.cover) ? dk.cover : cards.find((x) => G.CARDS[x].kind === 'creature'); G.Prog.saveDeck(dk); };
    const addCard = (cid) => { const c = G.CARDS[cid]; if (cnt(cid) >= G.Prog.own(cid) || cards.filter((x) => G.baseId(x) === G.baseId(cid)).length >= G.copyLimit(c)) { G.ui.toast(t(c.variantOf || G.CARD_ORDER.some((k) => G.CARDS[k].variantOf === cid) ? 'deck.limitName' : 'deck.limit')); G.audio.play('error'); return; } if (cards.length >= 40) { G.ui.toast(t('deck.full')); return; } if (c.kind === 'marker' && cards.filter((x) => G.CARDS[x].kind === 'marker').length >= G.CFG.MAX_MARKERS) { G.ui.toast(t('deck.markers')); return; } cards.push(cid); G.audio.play('card'); refresh(); };
    const remCard = (cid) => { const i = cards.lastIndexOf(cid); if (i >= 0) { cards.splice(i, 1); G.audio.play('card'); refresh(); } };
    const KINDS = ['all', 'creature', 'effect', 'relic', 'action', 'god', 'marker', 'charge'];
    const fbar = el('div.col', { style: { padding: '.5rem 0' } });
    const drawFilters = () => {
      const search = el('input', { value: filter.q, placeholder: t('search'), style: { flex: 1, minWidth: '120px' }, oninput: (e) => { filter.q = e.target.value; drawGrid(); } });
      G.fill(fbar, App.filterBar(filter, dst, () => { drawFilters(); drawGrid(); }, { neu: true, owned: true, noList: true, search: el('div.field.srch', search) }));
    };
    const drawGrid = () => {
      const q = filter.q.toLowerCase();
      const ids = G.CARD_ORDER.filter((cid) => { const c = G.CARDS[cid]; if (filter.kind !== 'all' && c.kind !== filter.kind) return false; if (filter.aff !== 'all' && c.aff !== filter.aff && !(c.kind === 'effect' && c.fx.some((f) => f.aff === filter.aff))) return false; if (filter.owned && !G.Prog.own(cid)) return false; if (filter.rar !== 'all' && c.rarity !== filter.rar) return false; if (q && !(G.L(c.name).toLowerCase().includes(q) || (c.kind === 'creature' ? G.attackText(c.attacks[0], G.lang) : G.cardText(c, G.lang)).toLowerCase().includes(q))) return false; return true; });
      const cw = { s: 88, m: 110, l: 140 }[dst.view] || 110; collGrid.style.setProperty('--gw', (cw + 2) + 'px');
      G.fill(collGrid, ...App.sortIds(ids, dst.sort, dst.dir).map((cid) => {
        const own = G.Prog.own(cid); const n = cnt(cid);
        const cell = el('div.cell' + (own ? '' : '.locked'), G.ui.card(cid, { w: cw }), el('span.cnt', G.CARDS[cid].kind === 'charge' ? '∞' : t('owned', { n: own })), n ? el('span.indeck', String(n)) : null);
        let tm; cell.addEventListener('pointerdown', () => { tm = setTimeout(() => { tm = null; G.ui.zoom(cid); }, 450); });
        cell.addEventListener('pointerup', () => { if (tm) { clearTimeout(tm); if (own) addCard(cid); else G.ui.zoom(cid); } });
        cell.addEventListener('pointerleave', () => { if (tm) clearTimeout(tm); });
        cell.addEventListener('contextmenu', (e) => { e.preventDefault(); });
        return cell;
      }));
    };
    const drawDeck = () => {
      const groups = [['creature', G.KIND.creature], ['effect', G.KIND.effect], ['relic', G.KIND.relic], ['action', G.KIND.action], ['god', G.KIND.god], ['marker', G.KIND.marker], ['charge', G.KIND.charge]];
      G.fill(deckList, );
      groups.forEach(([k, lb]) => {
        const ids = G.uniq(cards.filter((x) => G.CARDS[x].kind === k)).sort((a, b) => G.CARD_ORDER.indexOf(a) - G.CARD_ORDER.indexOf(b)); if (!ids.length) return;
        deckList.appendChild(el('div.grp', G.L(lb) + ' (' + cards.filter((x) => G.CARDS[x].kind === k).length + ')'));
        ids.forEach((cid) => { const c = G.CARDS[cid]; deckList.appendChild(el('div.dl', el('div.thumb', { style: { backgroundImage: `url(${G.artUrl(c.art)})`, width: '34px', height: '34px' }, onclick: () => G.ui.zoom(cid) }), c.aff ? el('span.pip', { style: { background: G.AFF[c.aff].color } }) : null, el('span.nm', G.L(c.name), c.legend ? ' ✦' : ''), el('button.btn.small.icon.ghost', { onclick: () => remCard(cid), 'aria-label': '−' }, '−'), el('span.n', String(cnt(cid))), el('button.btn.small.icon.ghost', { onclick: () => addCard(cid), 'aria-label': '+' }, '+'))); });
      });
      if (!cards.length) deckList.appendChild(el('p.muted', t('deck.emptyHint')));
    };
    const drawAna = () => {
      const a = G.analyzeDeck(cards);
      const affTot = G.sum(Object.values(a.aff)) || 1;
      const mx = Math.max(1, ...a.curve);
      G.fill(ana, 
        el('h3', t('ana.title')), el('div', el('span.tag', t('style.' + a.style))), el('p.muted', t('styleDesc.' + a.style)),
        el('h3', t('ana.kinds')), el('div.stats', Object.keys(a.kinds).filter((k) => a.kinds[k]).map((k) => el('div.stat', el('b', a.kinds[k]), el('span', G.L(G.KIND[k]))))),
        el('h3', t('ana.aff')), el('div.dist', Object.keys(a.aff).map((k) => el('i', { style: { width: (100 * a.aff[k] / affTot) + '%', background: G.AFF[k].color }, title: G.L(G.AFF[k]) }))),
        el('div.row.wrap', { style: { marginTop: '.4rem' } }, Object.keys(a.aff).map((k) => el('small', G.orb(k), ' ' + a.aff[k] + '  '))),
        el('h3', t('ana.curve')), el('div.curve', a.curve.map((v, i) => el('div', { style: { height: (100 * v / mx) + '%' } }, el('b', String(v)), el('span', String(i))))), el('div', { style: { height: '1.4em' } }),
        el('h3', t('ana.axes')), Object.keys(a.ax).map((k) => el('div', el('div.row', el('small.grow', t('axis.' + k)), el('small', a.ax[k])), el('div.bar', el('i', { style: { width: a.ax[k] + '%' } })))),
        el('h3', t('ana.tips')), a.tips.map((x) => el('div.tip.' + x.kind, t(x.k, x.p))));
    };
    const refresh = () => { countEl.textContent = cards.length + '/40'; countEl.style.color = cards.length === 40 && !G.validateDeck(cards).length ? '#58e07a' : 'var(--gold2)'; drawGrid(); drawDeck(); drawAna(); };
    const panes = { coll: el('div.pane.on', el('div.scroll', fbar, collGrid)), deck: el('div.pane.deck', el('div.scroll', deckList)), ana: el('div.pane.ana', el('div.scroll', ana)) };
    const tabs = el('div.tabs.dtabs', [['coll', 'deck.tabColl'], ['deck', 'deck.tabDeck'], ['ana', 'deck.tabAna']].map(([k, l]) => el('button.chip' + (k === 'coll' ? '.on' : ''), { onclick: (e) => { G.$$('.dtabs .chip').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); Object.keys(panes).forEach((p) => panes[p].classList.toggle('on', p === k)); } }, t(l))));
    const bar = el('div.topbar', el('button.btn.icon.ghost', { html: I().back, 'aria-label': t('back'), onclick: async () => { save(); App.go('decks'); } }), el('div.grow', name), countEl,
      el('button.btn.small', { onclick: () => { if (cards.length >= 40) { G.ui.toast(t('deck.alreadyFull')); return; } const pool = Object.assign({}, P().collection); const main = deckAffOf(cards.length ? cards : Object.keys(pool).filter((x) => pool[x] > 0)); const fill = G.buildDeck({ aff: main, aff2: null, q: 0.75, seed: Date.now() % 9999, pool, base: cards.slice() }); if (fill.length < 40) G.ui.toast(t('deck.cantFill')); cards.length = 0; fill.forEach((x) => cards.push(x)); refresh(); } }, t('deck.fill')),
      el('button.btn.small.ghost', { onclick: () => { cards.length = 0; refresh(); } }, t('deck.clear')),
      el('button.btn.small.primary', { onclick: () => { save(); G.ui.toast(t('saved')); } }, t('save')));
    drawFilters(); refresh();
    return el('div.scr', bar, tabs, el('div.deckwrap', panes.coll, panes.deck, panes.ana));
  };

  // ---------- ordenação / visualização ----------
  const SORTS = ['num', 'name', 'power', 'rarity', 'owned', 'hp', 'cost'];
  App.sortIds = (ids, key, dir) => {
    const v = (id) => { const c = G.CARDS[id]; switch (key) { case 'name': return G.L(c.name); case 'power': return G.cardPower(c); case 'rarity': return 'CUREL'.indexOf(c.rarity); case 'owned': return c.kind === 'charge' ? -1 : G.Prog.own(id); case 'hp': return c.hp || 0; case 'cost': return c.kind === 'creature' ? Math.min(...c.attacks.map((a) => a.cost.length)) : -1; default: return G.CARD_ORDER.indexOf(id); } };
    const out = ids.slice().sort((a, b) => { const x = v(a), y = v(b); return (typeof x === 'string' ? x.localeCompare(y) : x - y) || (G.CARD_ORDER.indexOf(a) - G.CARD_ORDER.indexOf(b)); });
    return dir < 0 ? out.reverse() : out;
  };
  // menu suspenso compacto
  App.dd = (label, opts, cur, onPick, right) => {
    const wrap = el('div.dd'); const co = opts.find((o) => o[0] === cur) || opts[0]; let menu = null;
    const out = (e) => { if (!wrap.contains(e.target)) close(); };
    const close = () => { if (menu) { menu.remove(); menu = null; document.removeEventListener('pointerdown', out, true); } };
    const btn = el('button.btn.small', { onclick: () => { if (menu) { close(); return; } G.click(); menu = el('div.ddmenu' + (right ? '.r' : ''), opts.map((o) => el('button' + (o[0] === cur ? '.on' : ''), { onclick: () => { close(); onPick(o[0]); } }, o[2] || null, o[1]))); wrap.appendChild(menu); setTimeout(() => document.addEventListener('pointerdown', out, true)); } }, el('span.muted', label), co[2] || null, el('span.v', co[1]), el('span', '▾'));
    wrap.appendChild(btn); return wrap;
  };
  const KOPTS = () => ['all', 'creature', 'effect', 'relic', 'action', 'god', 'marker', 'charge'].map((k) => [k, k === 'all' ? t('all') : G.L(G.KIND[k])]);
  const AOPTS = (neu) => [['all', t('allAff')]].concat(G.AFF_LIST.map((a) => [a, G.L(G.AFF[a]), G.orb(a)]), neu ? [['neu', t('neutral')]] : []);
  const ROPTS = () => [['all', t('all')]].concat('CUREL'.split('').map((r) => [r, G.L(G.RARITY[r]), el('i.rar.' + r)]));
  App.filterBar = (f, st, redraw, o) => el('div.fbar2',
    App.dd(t('f.kind'), KOPTS(), f.kind, (v) => { f.kind = v; redraw(); }),
    App.dd(t('f.aff'), AOPTS(o.neu), f.aff, (v) => { f.aff = v; redraw(); }),
    App.dd(t('f.rar'), ROPTS(), f.rar || 'all', (v) => { f.rar = v; redraw(); }),
    o.show ? App.dd(t('f.show'), [['all', t('coll.all')], ['owned', t('coll.owned')], ['missing', t('coll.missing')]], f.show, (v) => { f.show = v; redraw(); }) : null,
    o.owned ? el('button.chip' + (f.owned ? '.on' : ''), { onclick: () => { f.owned = !f.owned; redraw(); } }, t('ownedOnly')) : null,
    App.dd(t('sort.by'), SORTS.map((k) => [k, t('sort.' + k)]), st.sort, (v) => { st.sort = v; st.dir = ['power', 'rarity', 'owned', 'hp'].includes(v) ? -1 : 1; G.Prog.save(); redraw(); }, true),
    el('button.btn.icon.ghost', { style: { minWidth: '36px', minHeight: '36px' }, 'aria-label': t('sort.dir'), onclick: () => { st.dir = -st.dir; G.Prog.save(); redraw(); } }, st.dir > 0 ? '↑' : '↓'),
    App.dd(t('f.view'), (o.noList ? ['s', 'm', 'l'] : ['s', 'm', 'l', 'list']).map((v) => [v, t('view.' + v)]), st.view, (v) => { st.view = v; G.Prog.save(); redraw(); }, true),
    o.search || null);
  App.sortBar = (st, redraw, noList) => el('div.row.wrap.sortbar', el('small.muted', t('sort.by')),
    SORTS.map((k) => el('button.chip' + (st.sort === k ? '.on' : ''), { onclick: () => { if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = ['power', 'rarity', 'owned', 'hp'].includes(k) ? -1 : 1; } G.Prog.save(); redraw(); } }, t('sort.' + k) + (st.sort === k ? (st.dir > 0 ? ' ↑' : ' ↓') : ''))),
    el('span.grow'), (noList ? ['s', 'm', 'l'] : ['s', 'm', 'l', 'list']).map((v) => el('button.chip' + (st.view === v ? '.on' : ''), { onclick: () => { st.view = v; G.Prog.save(); redraw(); } }, t('view.' + v))));
  // ---------- coleção ----------
  S.collection = function () {
    let f = { kind: 'all', aff: 'all', show: 'all', rar: 'all' }; const st = P().settings.coll = P().settings.coll || { sort: 'num', dir: 1, view: 'm' };
    const grid = el('div'); const fb = el('div.col.section'); const total = G.Prog.collectible().length;
    const draw = () => {
      G.fill(fb, el('div.row', el('b', t('coll.progress', { n: G.Prog.uniqueOwned(), t: total })), el('div.bar.grow', el('i', { style: { width: (100 * G.Prog.uniqueOwned() / total) + '%' } }))),
        App.filterBar(f, st, draw, { show: true }));
      let ids = G.CARD_ORDER.filter((id) => { const c = G.CARDS[id]; if (f.kind !== 'all' && c.kind !== f.kind) return false; if (f.aff !== 'all' && c.aff !== f.aff) return false; if (f.rar !== 'all' && c.rarity !== f.rar) return false; const o = G.Prog.own(id); if (f.show === 'owned' && !o) return false; if (f.show === 'missing' && o) return false; return true; });
      ids = App.sortIds(ids, st.sort, st.dir);
      if (st.view === 'list') {
        grid.className = 'list section clist';
        G.fill(grid, ids.map((id) => { const c = G.CARDS[id]; const o = G.Prog.own(id); return el('div.li' + (o ? '' : '.dim2'), { onclick: () => G.ui.zoom(id) }, el('div.thumb', { style: { backgroundImage: `url(${G.artUrl(c.art)})` } }), el('div.grow', el('b', G.L(c.name)), el('div', el('small.muted', G.kindLabel(c) + (c.aff ? ' · ' + G.L(G.AFF[c.aff]) : '') + (c.hp ? ' · ' + t('hp') + ' ' + c.hp : '')))), el('i.rar.' + c.rarity), el('small.muted', G.L(G.RARITY[c.rarity])), el('b.sc', { style: { minWidth: '2.5em', textAlign: 'right' } }, c.kind === 'charge' ? '∞' : '×' + o)); }));
      } else {
        const w = { s: 96, m: 124, l: 168 }[st.view] || 124; grid.className = 'grid'; grid.style.setProperty('--gw', (w + 4) + 'px');
        G.fill(grid, ids.map((id) => { const o = G.Prog.own(id); return el('div.cell' + (o ? '' : '.locked'), { onclick: () => G.ui.zoom(id) }, G.ui.card(id, { w }), el('span.cnt', G.CARDS[id].kind === 'charge' ? '∞' : '×' + o)); }));
      }
    };
    draw();
    return el('div.scr', top(t('nav.coll')), el('div.scroll', fb, grid));
  };

  // ---------- santuário (boosters, fragmentos, forja) ----------
  const TABS = [['all', 'shop.tAll'], ['basic', 'shop.tBasic'], ['aff', 'shop.tAff'], ['kind', 'shop.tKind'], ['theme', 'shop.tTheme'], ['frag', 'shop.tFrag'], ['premium', 'shop.tPremium'], ['forge', 'shop.tForge']];
  S.shop = function (tab) {
    tab = tab || App._shopTab || 'all'; App._shopTab = tab; const ready = G.Prog.craftableCount();
    const tabs = el('div.tabs', TABS.map(([k, l]) => el('button.chip' + (tab === k ? '.on' : ''), { onclick: () => App.go('shop', k) }, t(l), k === 'forge' && ready ? el('b.badge', String(ready)) : null)));
    let body;
    if (tab === 'forge') body = App.forge();
    else body = el('div.packgrid', G.Prog.PACKS.filter((p) => tab === 'all' || (tab === 'premium' ? ['premium', 'legend'].includes(p.tier) : p.tier === tab)).map((p) => App.packTile(p)));
    return el('div.scr', top(t('nav.shop')), tabs, el('div.scroll', el('div.section', el('p.muted', tab === 'forge' ? t('forge.intro') : t('shop.intro')), body)));
  };
  App.packVars = (p) => { const pl = G.pal(p.art); return { '--p1': G.shade(pl[0], -0.15), '--p2': G.shade(pl[1], -0.6) }; };
  App.packEl = (p) => el('div.pack.t-' + p.tier, { style: App.packVars(p) }, el('div.part', { style: { backgroundImage: `url(${G.artUrl(p.art)})` } }), el('div.strip'), el('div.tear'), el('div.ttl', G.L(p.name)), el('div.sub', t('tier.' + p.tier)));
  App.packTile = (p) => {
    const d = P(); const locked = d.level < p.lvl; const own = d.packs[p.id] || 0;
    return el('button.ptile.t-' + p.tier + (locked ? '.locked' : ''), { onclick: () => App.packDetail(p), style: App.packVars(p) },
      el('div.part', { style: { backgroundImage: `url(${G.artUrl(p.art)})` } }), el('div.pshine'),
      el('div.pin', el('small.ptier', t('tier.' + p.tier)), el('h3', G.L(p.name)), el('div.row', el('span.price', G.res('shard', G.fmtN(p.price))), own ? el('span.owned', '×' + own) : null)),
      locked ? el('div.plock', t('shop.lvl', { l: p.lvl })) : null);
  };
  App.packOdds = (p) => {
    const R = (k) => G.L(G.RARITY[k]); const out = [];
    const fmtW = (w) => { const ks = Object.keys(w); const tot = G.sum(ks, (k) => w[k]); return ks.length === 1 ? R(ks[0]) : ks.map((k) => R(k) + ' ' + G.fmtN(+(100 * w[k] / tot).toFixed(1)).replace('.', G.lang === 'en' ? '.' : ',') + '%').join(' · '); };
    p.slots.forEach((s) => out.push(s.n + '× ' + fmtW(typeof s.w === 'string' ? G.Prog.W[s.w] : s.w)));
    p.frag.forEach((s) => out.push(s.n + '× ' + t('frag.bundle') + ' (' + fmtW(typeof s.w === 'string' ? G.Prog.W[s.w] : s.w) + ')'));
    if (p.bonusFrag) out.push(t('shop.bonusFrag', { p: Math.round(p.bonusFrag * 100) }));
    return out;
  };
  App.packDetail = (p) => {
    const d = P(); let m; const own = d.packs[p.id] || 0; const locked = d.level < p.lvl;
    const buy = (n) => { if (G.Prog.buyPack(p.id, n)) { G.audio.play('coin'); G.ui.toast(t('shop.bought', { n, p: G.L(p.name) })); m.close(); App.go('shop'); setTimeout(() => App.packDetail(p), 380); } else G.ui.toast(locked ? t('shop.lvl', { l: p.lvl }) : t('shop.noEss')); };
    const body = el('div.pdetail', App.packEl(p), el('div.col.grow', el('p', G.L(p.desc)), el('h3', t('shop.contents')), el('ul.odds', App.packOdds(p).map((s) => el('li', s))),
      el('div.row.wrap', el('button.btn.gilded', { disabled: locked || d.shards < p.price, onclick: () => buy(1) }, t('shop.buy1', { n: G.fmtN(p.price) })), el('button.btn', { disabled: locked || d.shards < G.Prog.packPrice(p, 5), onclick: () => buy(5) }, t('shop.buy5', { n: G.fmtN(G.Prog.packPrice(p, 5)) })), el('button.btn.primary', { disabled: !own, onclick: () => { m.close(); setTimeout(() => App.openPack(p.id), 240); } }, t('shop.openN', { n: own }))),
      locked ? el('small.muted', t('shop.lvl', { l: p.lvl })) : null));
    m = G.ui.modal(body, { title: G.L(p.name) });
  };
  App.fragEl = (it, w) => el('div.fragcard', { style: { width: w + 'px', height: (w * 1.397) + 'px' } }, G.ui.card(it.id, { w }), el('div.fragov', el('b', '×' + it.n), el('small', t('frag.label')), el('div.bar', el('i', { style: { width: Math.min(100, 100 * it.total / it.cost) + '%' } })), el('small', it.total + '/' + it.cost)));
  App.openPack = async function (id) {
    if (App._opening) return; const p = G.Prog.packById(id); const res = G.Prog.openPack(id); if (!res) return; App._opening = true;
    const pack = App.packEl(p); const stage = el('div.pstage', pack); document.body.appendChild(stage); const pl = G.pal(p.art);
    pack.animate([{ transform: 'translateY(40vh) rotateX(40deg) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    await G.sleep(750); G.audio.play('whoosh'); pack.classList.add('shake'); await G.sleep(900); pack.classList.remove('shake');
    // rasgo percorre a borda superior
    const r0 = pack.getBoundingClientRect(); pack.classList.add('tearing'); G.audio.play('tear');
    await new Promise((res) => { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / 700); pack.style.setProperty('--tp', (k * 100) + '%'); if (Math.random() < 0.6) G.fx.sparks(r0.left + r0.width * k, r0.top + r0.height * 0.125, [pl[0], '#fff', '#ffe7a8']); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    pack.classList.add('torn'); G.audio.play('card'); await G.sleep(320);
    // as cartas saem de dentro do pacote
    const sw = Math.min(r0.width * 0.78, 190); const stack = el('div.pstack'); stage.appendChild(stack);
    for (let k = 0; k < Math.min(res.length, 6); k++) { const b = G.ui.back(sw); b.style.transform = `translate(-50%,-50%) translate(${(k - 2.5) * 1.5}px,${-k * 1.5}px) rotate(${(k - 2.5) * 1.2}deg)`; stack.appendChild(b); }
    stack.animate([{ transform: `translate(-50%,-50%) translateY(${r0.height * 0.15}px)`, clipPath: 'inset(80% -20% -20% -20%)' }, { transform: `translate(-50%,-50%) translateY(${-r0.height * 0.32}px)`, clipPath: 'inset(-40% -20% -20% -20%)' }], { duration: 760, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
    pack.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(55vh) rotate(-6deg)', opacity: 0 }], { duration: 900, delay: 420, easing: 'cubic-bezier(.6,0,.8,.6)', fill: 'forwards' });
    G.audio.play('draw'); await G.sleep(900);
    const [x, y] = G.fx.at(stack); document.body.appendChild(el('div.flash')); setTimeout(() => G.$('.flash') && G.$('.flash').remove(), 900);
    G.fx.soul(x, y - r0.height * 0.3, [pl[0], pl[1], '#ffe7a8']); G.audio.play('choir', [57, 61, 64]);
    await G.sleep(260); stage.classList.add('out'); setTimeout(() => stage.remove(), 450);
    const w = Math.min(innerWidth / (res.length > 6 ? 4.4 : 3.4), 170);
    const rk = (it) => (it.type === 'frag' ? -1 : 'CUREL'.indexOf(G.CARDS[it.id].rarity));
    const order = res.slice().sort((a, b) => rk(a) - rk(b));
    const glowC = { C: 'transparent', U: '#5fb4a8', R: '#e0c25a', E: '#b57cff', L: '#ff9a4d' };
    let flipped = 0; const reveal = el('div.reveal'); let m;
    const again = el('button.btn.hidden', { onclick: () => { m.close(); App._opening = false; setTimeout(() => App.openPack(id), 260); } }, t('shop.another'));
    const cont = el('button.btn.primary.hidden', { onclick: () => { m.close(); App._opening = false; App.go('shop'); } }, t('continue'));
    const all = el('button.btn', { onclick: () => G.$$('.flip:not(.on)', reveal).forEach((f, k) => setTimeout(() => f.click(), k * 120)) }, t('shop.flipAll'));
    order.forEach((it, i) => {
      const c = G.CARDS[it.id];
      const front = it.type === 'frag' ? App.fragEl(it, w) : G.ui.card(it.id, { w });
      const f = el('div.flip', { style: { width: w + 'px', height: (w * 1.397) + 'px', animationDelay: (i * 0.12) + 's' } }, el('div.glow', { style: { background: it.type === 'frag' ? '#3f8ff0' : glowC[c.rarity] } }), G.ui.back(w), front, it.isNew ? el('span.newb', t('new')) : null, it.dup ? el('span.dupb', '+' + it.dup + ' ' + t('shards')) : null);
      f.addEventListener('click', () => {
        if (f.classList.contains('on')) { G.ui.zoom(it.id); return; }
        f.classList.add('on'); flipped++; G.audio.play('card');
        const [fx, fy] = G.fx.at(f);
        if (it.type === 'frag') { G.audio.play('charge'); G.fx.sparks(fx, fy, ['#9fd2ff', '#fff']); }
        else if (c.rarity === 'L') { G.audio.play('legend'); document.body.appendChild(el('div.flash')); G.fx.soul(fx, fy, ['#ff9a4d', '#ffe08a', '#b98aff']); G.fx.ring(fx, fy, ['#ffe08a']); }
        else if (c.rarity === 'E') { G.audio.play('rare'); G.fx.sparks(fx, fy, ['#b57cff', '#fff']); }
        else if (c.rarity === 'R') { G.audio.play('charge'); G.fx.sparks(fx, fy, ['#e0c25a', '#fff']); }
        if (flipped === order.length) { cont.classList.remove('hidden'); all.classList.add('hidden'); if ((P().packs[id] || 0) > 0) again.classList.remove('hidden'); }
      });
      reveal.appendChild(f);
    });
    m = G.ui.modal(el('div.col', { style: { alignItems: 'center' } }, el('h2', G.L(p.name)), reveal, el('div.row', all, again, cont)), { dismiss: false });
    m.veil.style.background = 'rgba(6,3,9,.92)';
  };
  App.forge = () => {
    const d = P(); const ids = Object.keys(d.frags || {}).filter((id) => d.frags[id] > 0).sort((a, b) => (Number(G.Prog.canCraft(b)) - Number(G.Prog.canCraft(a))) || (d.frags[b] / G.Prog.CRAFT[G.CARDS[b].rarity] - d.frags[a] / G.Prog.CRAFT[G.CARDS[a].rarity]));
    if (!ids.length) return el('p.muted', t('forge.empty'));
    return el('div.grid', { style: { '--gw': '152px' } }, ids.map((id) => {
      const c = G.CARDS[id]; const cost = G.Prog.CRAFT[c.rarity]; const n = d.frags[id]; const full = G.Prog.own(id) >= G.copyLimit(c); const ok = G.Prog.canCraft(id);
      return el('div.cell.forgecell', G.ui.card(id, { w: 140 }), el('div.bar', { style: { width: '140px' } }, el('i', { style: { width: Math.min(100, 100 * n / cost) + '%' } })), el('small', n + '/' + cost + ' · ' + t('owned', { n: G.Prog.own(id) })),
        el('button.btn.small' + (ok ? '.gilded' : ''), { disabled: !ok, onclick: () => { if (G.Prog.craft(id)) { G.audio.play('rare'); G.ui.toast(t('forge.done', { c: G.L(c.name) })); App.go('shop', 'forge'); } } }, full ? t('forge.full') : t('forge.craft')));
    }));
  };

  // ---------- perfil ----------
  function radar(ax) {
    const keys = ['agg', 'mag', 'ctl', 'def', 'str']; const R = 70, cx = 110, cy = 95;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let s = `<svg class="radar" viewBox="0 0 220 200" width="220" height="200">`;
    [0.33, 0.66, 1].forEach((k) => { s += `<polygon points="${keys.map((_, i) => pt(i, R * k).join(',')).join(' ')}" fill="none" stroke="rgba(201,162,78,.25)"/>`; });
    s += `<polygon points="${keys.map((k, i) => pt(i, R * Math.max(0.05, ax[k] / 100)).join(',')).join(' ')}" fill="rgba(111,227,214,.25)" stroke="#6fe3d6" stroke-width="2"/>`;
    keys.forEach((k, i) => { const [x, y] = pt(i, R + 16); s += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${t('axisP.' + k)}</text>`; });
    return el('div', { html: s + '</svg>' });
  }
  App.emblem = (tier, div) => el('div.emblem', { html: `<svg viewBox="0 0 96 110" width="96" height="110"><defs><linearGradient id="emg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${tier.color}"/><stop offset="1" stop-color="#1a0f10"/></linearGradient></defs><path d="M48 3 L90 18 L86 62 Q80 92 48 107 Q16 92 10 62 L6 18 Z" fill="url(#emg)" stroke="#f2d68d" stroke-width="2"/><path d="M48 14 L80 25 L77 60 Q72 84 48 96 Q24 84 19 60 L16 25 Z" fill="none" stroke="#07040a" stroke-opacity=".5" stroke-width="2"/><path d="M48 30 l9 14 -9 14 -9 -14z" fill="#fff" fill-opacity=".85"/><text x="48" y="86" text-anchor="middle" font-family="Grenze Gotisch,serif" font-size="18" fill="#fff" stroke="#000" stroke-width=".6">${div || '★'}</text></svg>` });
  App.eloPanel = () => {
    const d = P(); const r = G.Prog.rankOf(d.mmr); const T = G.Prog.TIERS; const i = r.i; const nx = T[i + 1];
    let nextTxt, prog;
    if (nx) { const lo = i === 0 ? 800 : r.t.min; const band = (nx.min - lo) / 3; const k = Math.max(0, Math.min(2, Math.floor((d.mmr - lo) / band))); const at = Math.round(lo + (k + 1) * band); prog = Math.max(0, Math.min(1, (d.mmr - lo - k * band) / band)); const lbl = k < 2 ? r.t.name[G.lang] + ' ' + ['II', 'I'][k] : nx.name[G.lang] + ' III'; nextTxt = t('elo.next', { n: Math.max(1, at - d.mmr), r: lbl }); }
    else { prog = 1; nextTxt = t('elo.top'); }
    const h = d.mmrHist.slice(-30); const mn = Math.min(...h) - 20, mx = Math.max(...h) + 20; const W = 300, H = 90;
    const pts = h.map((v, k) => [(k / Math.max(1, h.length - 1)) * W, H - ((v - mn) / Math.max(1, mx - mn)) * (H - 10) - 5]);
    const spark = el('div', { html: `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${r.t.color}" stop-opacity=".45"/><stop offset="1" stop-color="${r.t.color}" stop-opacity="0"/></linearGradient></defs>${pts.length > 1 ? `<path d="M${pts.map((p) => p.join(' ')).join(' L')} L${W} ${H} L0 ${H}Z" fill="url(#spg)"/><polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${r.t.color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/>` : ''}</svg>` });
    const rk = d.history.filter((x) => x.mode === 'ranked'); const rw = rk.filter((x) => x.win === true).length;
    const pos = (G.Prog.leaderboard().find((x) => x.you) || {}).pos;
    const now = new Date(); const end = new Date(now.getFullYear(), now.getMonth() + 1, 1); const days = Math.ceil((end - now) / 864e5);
    const st = (v, l) => el('div.stat', el('b', String(v == null ? 0 : v)), el('span', l));
    return el('div.section.elo', { style: { '--tc': r.t.color } },
      el('div.elohead', App.emblem(r.t, r.div), el('div.col.grow', el('small.muted', t('elo.title')), el('h3', r.label), el('div', el('b', d.mmr + ' ' + t('mmr')), el('small.muted', ' · ' + t('prof.peak') + ' ' + d.peak + ' (' + G.Prog.rankOf(d.peak).label + ')')),
        el('div.bar', { style: { marginTop: '.4rem' } }, el('i', { style: { width: (prog * 100) + '%', background: r.t.color } })), el('small.muted', nextTxt))),
      el('div.ladder', T.map((x, k) => el('div' + (k === i ? '.on' : k < i ? '.past' : ''), { style: { '--tc': x.color }, title: x.name[G.lang] + ' ' + x.min }))),
      el('div.ladlab', T.map((x) => el('span', x.name[G.lang]))),
      el('h3', { style: { marginTop: '.8rem' } }, t('elo.hist')), spark,
      el('div.elogrid', st(pos ? '#' + pos : '—', t('elo.pos')), st(rk.length ? Math.round(100 * rw / rk.length) + '%' : '—', t('elo.recentWr')), st(rw + '/' + rk.length, t('elo.recent')), st(d.streak, t('elo.streak')), st(d.stats.rankedWins, t('st.rwins')), st(days + 'd', t('elo.season'))),
      el('small.muted', { style: { display: 'block', marginTop: '.5rem' } }, t('elo.seasonDesc')));
  };
  // ---------- calendário lunar ----------
  App.moon = (k) => { const ph = (k % 8) / 8; const r = 20; const lit = ph <= 0.5 ? ph * 2 : (1 - ph) * 2; const wax = ph <= 0.5; const rx = Math.abs(1 - 2 * lit) * r; const sw = wax ? 1 : 0; const term = lit > 0.5 ? (wax ? 1 : 0) : (wax ? 0 : 1);
    return el('div.moon', { html: `<svg viewBox="0 0 48 48"><defs><radialGradient id="mg${k}" cx=".4" cy=".35"><stop offset="0" stop-color="#fff8e1"/><stop offset="1" stop-color="#c9a24e"/></radialGradient></defs><circle cx="24" cy="24" r="${r}" fill="#160d22" stroke="#c9a24e" stroke-opacity=".55"/>${lit > 0.02 ? `<path d="M24 ${24 - r} A${r} ${r} 0 0 ${sw} 24 ${24 + r} A${rx} ${r} 0 0 ${term} 24 ${24 - r}Z" fill="url(#mg${k})"/>` : ''}</svg>` }); };
  App.calRw = (rw) => [rw.ess ? G.fmtN(rw.ess) + ' ' + t('shards') : null].concat((rw.packs || []).map(([id, n]) => (n > 1 ? n + '× ' : '') + G.L(G.Prog.packById(id).name))).filter(Boolean).join(' + ');
  S.calendar = function () {
    const c = P().calendar; const can = G.Prog.calCanClaim();
    const claim = () => { const rw = G.Prog.claimCalendar(); if (!rw) return; G.audio.play('choir', [57, 64, 69]); G.fx.soul(innerWidth / 2, innerHeight * 0.4, ['#fff8e1', '#e7c873', '#c98bff']); G.ui.modal(el('div.col', { style: { alignItems: 'center', textAlign: 'center' } }, App.moon(4), el('h2', t('cal.claimed')), el('p', App.calRw(rw)), el('button.btn.primary', { onclick: () => { G.$$('.veil').forEach((v) => v.remove()); App.go('calendar'); } }, t('continue'))), { narrow: true }); };
    const grid = el('div.calgrid', G.Prog.CAL.map((rw, k) => { const done = k < c.day; const today = k === c.day && can; return el('button.calday' + (done ? '.done' : '') + (today ? '.today' : '') + (rw.big ? '.big' : ''), { onclick: today ? claim : () => G.ui.toast(done ? t('cal.done') : k === c.day ? t('cal.tomorrow') : t('cal.locked')) }, el('b', String(k + 1)), App.moon(k), el('span.rw', rw.big ? App.calRw(rw) : G.fmtN(rw.ess))); }));
    const ev = el('div.evlist', el('h3', t('cal.events')), G.Prog.events().map((e) => el('div.ev', el('i'), el('div.grow', el('b', G.L(e.name)), el('div', el('small.muted', G.L(e.desc)))), el('small.muted', e.when))));
    return el('div.scr', top(t('mode.cal')), el('div.scroll', el('div.calhead', el('h2', t('cal.title', { n: c.cycle })), el('p', t('cal.desc'))), grid, can ? el('div.row', { style: { justifyContent: 'center', marginTop: '1rem' } }, el('button.btn.primary', { onclick: claim }, t('cal.claim'))) : el('p.muted', { style: { textAlign: 'center' } }, t('cal.come')), ev));
  };
  // ---------- crônicas ----------
  S.chronicle = function () {
    const facs = Object.keys(G.FACTIONS).map((k) => { const f = G.FACTIONS[k]; return el('div.fac.s-' + f.side, el('b', G.L(f.name)), el('small', G.L(G.SIDES[f.side]) + ' — ' + G.L(f.desc))); });
    return el('div.scr', top(t('mode.chron')), el('div.scroll', el('div.chron',
      G.CHRONICLE.map((ch) => el('div.chap', el('h3', G.L(ch.t)), ch.p.map((p) => el('p', G.L(p))))),
      el('div.chap', el('h3', t('chron.factions')), el('div.facgrid', facs)),
      el('div.chap', el('h3', t('chron.regions')), Object.keys(G.REGIONS).map((k) => el('p', el('b', G.L(G.REGIONS[k].name) + ' — '), G.L(G.REGIONS[k].desc)))))));
  };
  S.profile = function () {
    const d = P(); const s = d.stats; const ps = G.Prog.playstyle(); const r = G.Prog.rankOf(d.mmr); const rep = G.Prog.repLabel(d.rep);
    const nameIn = el('input', { value: d.name, maxlength: 18, 'aria-label': t('onb.name'), onchange: (e) => { const v = e.target.value.trim(); if (v.length >= 2) { d.name = v; G.Prog.save(); G.ui.toast(t('saved')); } } });
    const pickAvatar = () => { const own = G.CARD_ORDER.filter((id) => G.CARDS[id].kind === 'creature' && G.Prog.own(id)); let m; const g = el('div.grid', { style: { '--gw': '64px' } }, own.map((id) => el('button.avatar', { style: { width: '60px', height: '60px', backgroundImage: `url(${G.artUrl(id)})` }, onclick: () => { d.avatar = id; G.Prog.save(); m.close(); App.go('profile'); } }))); m = G.ui.modal(g, { title: t('prof.avatar') }); };
    const stat = (v, l) => el('div.stat', el('b', v), el('span', l));
    const hist = el('div.list', d.history.length ? d.history.map((h) => el('div.li', el('b', { style: { color: h.win ? '#58e07a' : h.win === false ? '#e0655a' : 'var(--bone2)', width: '4.5em' } }, h.win ? t('res.winS') : h.win === false ? t('res.loseS') : t('res.drawS')), el('span.grow', t('mode.' + h.mode) + ' · ' + (h.opp || '—')), h.oppAff ? G.orb(h.oppAff) : null, el('small.muted', (h.mmr ? (h.mmr > 0 ? '+' : '') + h.mmr + ' · ' : '') + h.turns + ' ' + t('turns')))) : el('p.muted', t('prof.noHist')));
    const body = el('div.scroll',
      el('div.section.row.wrap', el('button.avatar', { style: { width: '84px', height: '84px' , backgroundImage: `url(${G.artUrl(d.avatar)})` }, onclick: pickAvatar, 'aria-label': t('prof.avatar') }),
        el('div.col.grow', el('div.field', nameIn), el('div.row.wrap', el('span.rankb', { style: { color: r.t.color } }, r.label), el('small.muted', d.mmr + ' ' + t('mmr') + ' · ' + t('prof.peak') + ' ' + d.peak), el('small.muted', t('level') + ' ' + d.level)))),
      App.eloPanel(),
      el('div.section', el('h3', t('prof.style')), el('div.row.wrap', radar(ps.ax), el('div.col', { style: { maxWidth: '40ch' } }, el('span.tag', t('pstyle.' + ps.key)), el('p.muted', t('pstyleDesc.' + ps.key)), el('div', el('b', t('prof.rep') + ': '), G.L(rep), ' (' + d.rep + '/100)'), el('small.muted', t('prof.repDesc'))))),
      el('div.section', el('h3', t('prof.stats')), el('div.stats', stat(s.matches, t('st.matches')), stat(s.wins, t('st.wins')), stat(s.matches ? Math.round(100 * s.wins / s.matches) + '%' : '—', t('st.wr')), stat(s.rankedWins, t('st.rwins')), stat(G.fmtN(s.kos), t('st.kos')), stat(G.fmtN(s.dmg), t('st.dmg')), stat(s.maxHit, t('st.maxHit')), stat(s.bestStreak, t('st.streak')), stat(s.perfect, t('st.perfect')), stat(Object.keys(d.ach).length + '/' + G.Prog.ACH.length, t('st.ach')))),
      el('div.section.row.wrap', el('button.btn', { onclick: () => App.go('achievements') }, t('mode.ach')), el('button.btn', { onclick: () => App.go('ranking') }, t('mode.ranking')), el('button.btn', { onclick: () => App.go('settings') }, t('settings')), el('button.btn', { onclick: () => App.go('chronicle') }, t('mode.chron')), el('button.btn', { onclick: () => App.go('calendar') }, t('mode.cal'))),
      el('div.section', el('h3', t('prof.hist')), hist));
    return el('div.scr', top(t('nav.prof')), body);
  };

  // ---------- conquistas ----------
  S.achievements = function () {
    let tab = 'prog'; const list = el('div.list.section');
    const tabs = el('div.tabs');
    const draw = () => {
      G.fill(tabs, ...['prog', 'done', 'all'].map((k) => el('button.chip' + (tab === k ? '.on' : ''), { onclick: () => { tab = k; draw(); } }, t('ach.' + k))));
      const items = G.Prog.ACH.map((a) => { let v = 0; try { v = a.get(P()); } catch (e) { } return { a, v, done: !!P().ach[a.id] }; }).filter((x) => tab === 'all' || (tab === 'done' ? x.done : !x.done)).sort((x, y) => (y.v / y.a.goal) - (x.v / x.a.goal));
      G.fill(list, el('p.muted', t('ach.count', { n: Object.keys(P().ach).length, t: G.Prog.ACH.length })), ...items.slice(0, 400).map((x) => el('div.li', el('div.thumb', { style: { display: 'grid', placeItems: 'center', background: x.done ? 'linear-gradient(135deg,#e7c873,#a27a2a)' : 'rgba(255,255,255,.04)' }, html: G.ICON.trophy }), el('div.grow', el('b', G.L(x.a.n)), el('div', el('small.muted', G.L(x.a.d))), el('div.bar', { style: { marginTop: '.25rem' } }, el('i', { style: { width: Math.min(100, 100 * x.v / x.a.goal) + '%' } }))), el('small.gold', x.done ? '✓' : G.fmtN(Math.min(x.v, x.a.goal)) + '/' + G.fmtN(x.a.goal)), el('small.muted', '+' + x.a.sh))));
    };
    draw();
    return el('div.scr', top(t('mode.ach')), tabs, el('div.scroll', list));
  };
  // ---------- ranking ----------
  S.ranking = function () {
    const lb = G.Prog.leaderboard(); const me = lb.find((x) => x.you);
    const row = (x) => el('div.li' + (x.you ? '.me' : ''), el('b', { style: { width: '3em', fontFamily: 'var(--disp)', fontSize: '1.1rem' } }, '#' + x.pos), el('div.thumb', { style: { backgroundImage: `url(${G.artUrl(x.avatar)})`, borderRadius: '50%' } }), el('div.grow', el('b', x.name + (x.you ? ' (' + t('you') + ')' : '')), el('div', el('small.muted', t('level') + ' ' + x.level))), x.aff ? G.orb(x.aff) : null, rankBadge(x.mmr), el('small', x.mmr));
    const list = el('div.list.section', el('p.muted', t('rank.info')), lb.slice(0, 100).map(row), me.pos > 100 ? [el('div', { style: { textAlign: 'center', color: 'var(--bone2)' } }, '⋯'), row(me)] : null);
    return el('div.scr', top(t('mode.ranking')), el('div.scroll', list));
  };
  // ---------- opções ----------
  S.settings = function () {
    const d = P(); const st = d.settings;
    const slider = (k, lbl) => el('div.field', el('label', t(lbl)), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[k], oninput: (e) => { st[k] = +e.target.value; G.audio.setVol(st.music, st.sfx); G.Prog.save(); }, onchange: () => G.audio.play('card') }));
    const opt = (k, vals, lbl) => el('div.field', el('label', t(lbl)), el('div.row.wrap', vals.map((v) => el('button.chip' + (st[k] === v[0] ? '.on' : ''), { onclick: () => { st[k] = v[0]; G.Prog.save(); if (k === 'gfx') G.applyGfx(); App.go('settings'); } }, v[1]))));
    const body = el('div.scroll', el('div.section.col',
      el('div.field', el('label', t('set.lang')), el('div.row', [['pt', 'Português (Brasil)'], ['en', 'English']].map(([k, l]) => el('button.chip' + (G.lang === k ? '.on' : ''), { onclick: () => { d.lang = k; G.lang = k; G.Prog.save(); App.go('settings'); } }, l)))),
      slider('music', 'set.music'), slider('sfx', 'set.sfx'),
      opt('speed', [[0.75, '0.75×'], [1, '1×'], [1.5, '1.5×'], [2, '2×']], 'set.speed'),
      opt('gfx', [['low', t('gfx.low')], ['med', t('gfx.med')], ['high', t('gfx.high')], ['ultra', t('gfx.ultra')]], 'set.gfx'),
      el('small.muted', t('gfx.help')),
      opt('confirmEnd', [[true, t('yes')], [false, t('no')]], 'set.confirmEnd'),
      opt('privacy', [[true, t('yes')], [false, t('no')]], 'set.privacy'),
      el('div.field', el('label', t('set.backup')), el('small.muted', t('set.backupDesc')), el('div.row.wrap', { style: { marginTop: '.4rem' } },
        el('button.btn', { onclick: async () => { const c = G.Prog.exportCode(); let ok = false; try { await navigator.clipboard.writeText(c); ok = true; } catch (e) { } const ta = el('textarea', { readonly: true, style: { width: '100%', height: '120px', fontSize: '.7rem' } }); ta.value = c; G.ui.modal(el('div.col', el('p', t(ok ? 'set.copied' : 'set.copyManual')), ta), { title: t('set.export'), narrow: true }); setTimeout(() => ta.select(), 100); } }, t('set.export')),
        el('button.btn', { onclick: () => { const ta = el('textarea', { placeholder: 'ORV1:…', style: { width: '100%', height: '120px', fontSize: '.7rem' } }); let m; m = G.ui.modal(el('div.col', el('p', t('set.importDesc')), ta, el('button.btn.primary', { onclick: async () => { if (!(await G.ui.confirm(t('set.importQ')))) return; if (G.Prog.importCode(ta.value)) { G.ui.toast(t('set.imported')); setTimeout(() => location.reload(), 600); } else G.ui.toast(t('set.importBad')); } }, t('set.import'))), { title: t('set.import'), narrow: true }); } }, t('set.import')))),
      el('div.row.wrap', el('button.btn', { onclick: () => App.go('tutorial', 0) }, t('mode.learn')), el('button.btn.ghost', { onclick: async () => { if (await G.ui.confirm(t('set.resetQ'))) { G.Prog.reset(); location.reload(); } } }, t('set.reset'))),
      el('p.muted', t('set.credits'))));
    return el('div.scr', top(t('settings')), body);
  };
  // ---------- tutorial ----------
  S.tutorial = function (ch) {
    const T = G.TUT; ch = G.clamp(ch || 0, 0, T.length - 1); const c = T[ch];
    const side = el('div.row.wrap', { style: { gap: '.35rem' } }, T.map((x, i) => el('button.chip' + (i === ch ? '.on' : ''), { onclick: () => App.go('tutorial', i) }, (i + 1) + '. ' + G.L(x.t))));
    const art = el('div.prose');
    c.b.forEach((b) => {
      if (b.p) art.appendChild(el('p', { html: G.L(b.p) }));
      if (b.h) art.appendChild(el('h3', G.L(b.h)));
      if (b.cards) art.appendChild(el('div.cards-row', b.cards.map((id) => { const n = G.ui.card(id, { w: Math.min(190, innerWidth / 2.4) }); n.addEventListener('click', () => G.ui.zoom(id)); return n; })));
      if (b.ex) art.appendChild(el('div.example', el('b.gold', G.L(b.ex.t)), el('ol', G.L(b.ex.s).map((s) => el('li', { html: s })))));
      if (b.list) art.appendChild(el('ul', G.L(b.list).map((s) => el('li', { html: s }))));
    });
    if (ch === T.length - 1 && !P().tutorialDone) { P().tutorialDone = true; G.Prog.save(); const a = G.Prog.checkAch(); a.forEach((x) => G.ui.toast(t('achUnlocked', { n: G.L(x.n) }), 'ach')); }
    const nav = el('div.row', { style: { justifyContent: 'space-between', margin: '1.4rem 0' } }, ch > 0 ? el('button.btn', { onclick: () => App.go('tutorial', ch - 1) }, t('prev')) : el('span'), ch < T.length - 1 ? el('button.btn.primary', { onclick: () => App.go('tutorial', ch + 1) }, t('next')) : el('button.btn.primary', { onclick: () => App.setup('adv') }, t('tut.practice')));
    return el('div.scr', top(t('mode.learn')), el('div.scroll', el('div.section', side, el('h2', { style: { margin: '1rem 0 .3rem', fontSize: '2rem' } }, (ch + 1) + '. ' + G.L(c.t)), art, nav)));
  };
})(typeof window !== 'undefined' ? window : globalThis);
