/* Almas de Orvalon — perfil, progressão, coleção, boosters, conquistas e ranking fictício */
(function (root) {
  const G = root.G; const KEY = 'orvalon_save_v1';
  const P = G.Prog = {};
  G.fmtN = (n, l) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, (l || G.lang) === 'en' ? ',' : '.');
  const L = (pt, en) => ({ pt, en });
  P.defaults = () => ({
    v: 1, created: Date.now(), name: '', lang: null, avatar: 'h3_11', level: 1, xp: 0, shards: 300, boosters: 0, pity: 0, packs: {}, frags: {},
    collection: {}, decks: [], mastery: {}, calendar: { day: 0, last: null, cycle: 1 }, activeDeck: null, mmr: 900, peak: 900, skill: 0.42, rep: 60, streak: 0, mmrHist: [900],
    stats: { matches: 0, wins: 0, losses: 0, draws: 0, rankedWins: 0, rankedMatches: 0, quickWins: 0, advWins: 0, trainMatches: 0, spectated: 0, kos: 0, kosAff: {}, dmg: 0, maxHit: 0, prizes: 0, perfect: 0, comebacks: 0, winReasons: {}, ascends: 0, conds: {}, heals: 0, effects: 0, relics: 0, actions: 0, gods: {}, played: {}, boosters: 0, legendsPulled: 0, decksBuilt: 0, bestStreak: 0, fastWin: 999, legendKos: 0, winsAff: {}, abilities: 0, retreats: 0, markers: 0, turns: 0, concedes: 0, attacks: 0 },
    ach: {}, history: [], daily: null, settings: { music: 0.55, sfx: 0.85, speed: 1, particles: 'high', privacy: true, confirmEnd: true }, tutorialDone: false, starter: null, inMatch: null, onboarded: false
  });
  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  P.load = () => { const d = G.store.get(KEY, null); P.d = d ? merge(P.defaults(), d) : P.defaults(); if (P.d.boosters > 0) { P.d.packs.basic = (P.d.packs.basic || 0) + P.d.boosters; P.d.boosters = 0; } return P.d; };
  P.save = () => G.store.set(KEY, P.d);
  P.reset = () => { G.store.del(KEY); P.load(); };
  P.own = (id) => (G.CARDS[id] && G.CARDS[id].kind === 'charge') ? 99 : (P.d.collection[id] || 0);
  P.addCard = (id, n) => { const c = G.CARDS[id]; const lim = G.copyLimit(c); P.d.collection[id] = Math.min(lim, (P.d.collection[id] || 0) + (n || 1)); };
  P.uniqueOwned = () => Object.keys(P.d.collection).filter((id) => P.d.collection[id] > 0).length;
  P.collectible = () => G.CARD_ORDER.filter((id) => G.CARDS[id].kind !== 'charge');

  // ---------- Santuário: boosters, fragmentos e forja ----------
  P.DUST = { C: 2, U: 5, R: 12, E: 30, L: 60 };          // Essência por cópia acima do limite
  P.CRAFT = { C: 6, U: 12, R: 25, E: 50, L: 100 };       // fragmentos para forjar
  P.FRAG_AMT = { C: [4, 8], U: [3, 6], R: [2, 5], E: [2, 4], L: [1, 3] };
  P.PITY = 150; // rede de segurança oculta (não é exibida)
  const RORD = ['C', 'U', 'R', 'E', 'L'];
  const W = P.W = { C: { C: 1 }, U: { U: 1 }, RP: { R: 0.922, E: 0.07, L: 0.008 }, CU: { C: 0.7, U: 0.3 }, EP: { E: 0.92, L: 0.08 }, R: { R: 1 }, E: { E: 1 }, L: { L: 1 }, TAG: { C: 0.5, U: 0.35, R: 0.13, E: 0.02 }, VAR: { U: 0.62, R: 0.32, E: 0.055, L: 0.005 }, FR: { C: 0.46, U: 0.3, R: 0.18, E: 0.055, L: 0.005 }, FRR: { R: 0.74, E: 0.23, L: 0.03 } };
  const coll = () => P.collectible().map((id) => G.CARDS[id]);
  const F = {
    any: () => true, creature: (c) => c.kind === 'creature', relic: (c) => c.kind === 'relic', effect: (c) => c.kind === 'effect',
    decree: (c) => ['action', 'god', 'marker'].includes(c.kind), actionish: (c) => ['action', 'effect', 'god', 'marker'].includes(c.kind),
    aff: (a) => (c) => c.aff === a || (c.kind === 'effect' && c.fx.some((f) => f.aff === a)), region: (r) => (c) => c.region === r,
    tag: (tg) => (c) => c.kind === 'creature' && (c.tags || []).includes(tg), theme: (th) => (c) => c.theme === th, variant: (c) => !!c.variantOf, base: (c) => c.kind === 'creature' && !c.variantOf
  };
  const SL = (n, w, f) => ({ n, w, f: f || F.any });
  P.PACKS = [];
  const pk = (o) => P.PACKS.push(Object.assign({ lvl: 1, slots: [], frag: [], bonusFrag: 0 }, o));
  pk({ id: 'aprendiz', tier: 'basic', price: 150, art: 'h3_15', name: L('Selo do Aprendiz', 'Apprentice Seal'), desc: L('3 cartas Comuns e Incomuns. Barato, bom para completar decks.', '3 Common and Uncommon cards. Cheap, good for filling decks.'), slots: [SL(2, 'C'), SL(1, 'U')] });
  pk({ id: 'basic', tier: 'basic', price: 300, art: 'e1_25', name: L('Selos de Orvalon', 'Seals of Orvalon'), desc: L('O booster clássico: 3 Comuns, 1 Incomum e 1 Rara ou melhor. Pode trazer fragmentos.', 'The classic booster: 3 Commons, 1 Uncommon and 1 Rare or better. May include fragments.'), slots: [SL(3, 'C'), SL(1, 'U'), SL(1, 'RP')], bonusFrag: 0.3 });
  const AFFP = { ign: ['brasa', 'h1_01'], sac: ['solen', 'h3_14'], occ: ['umbra', 'h2_11'], ene: ['vort', 'h2_09'], pri: ['sylv', 'h1_09'] };
  Object.keys(AFFP).forEach((a) => { const reg = G.REGIONS[AFFP[a][0]].name; const f = F.aff(a); pk({ id: 'aff_' + a, tier: 'aff', price: 450, art: AFFP[a][1], name: L('Selos de ' + reg.pt, 'Seals of ' + reg.en), desc: L(`5 cartas ${G.AFF[a].ptPl}: 3 Comuns, 1 Incomum e 1 Rara ou melhor.`, `5 ${G.AFF[a].en} cards: 3 Commons, 1 Uncommon and 1 Rare or better.`), slots: [SL(3, 'C', f), SL(1, 'U', f), SL(1, 'RP', f)] }); });
  [['sahr', 'h1_17'], ['valc', 'h2_15']].forEach(([r, art]) => { const reg = G.REGIONS[r].name; pk({ id: 'reg_' + r, tier: 'aff', price: 450, lvl: 3, art, name: L('Selos de ' + reg.pt, 'Seals of ' + reg.en), desc: L(`3 criaturas de ${reg.pt} e 2 cartas variadas.`, `3 creatures from ${reg.en} and 2 assorted cards.`), slots: [SL(2, 'CU', F.region(r)), SL(1, 'RP', F.region(r)), SL(2, 'CU')] }); });
  pk({ id: 'hoste', tier: 'kind', price: 400, art: 'h2_12', name: L('Hoste de Almas', 'Host of Souls'), desc: L('Só criaturas: 3 Comuns, 1 Incomum e 1 Rara ou melhor.', 'Creatures only: 3 Commons, 1 Uncommon and 1 Rare or better.'), slots: [SL(3, 'C', F.creature), SL(1, 'U', F.creature), SL(1, 'RP', F.creature)] });
  pk({ id: 'arsenal', tier: 'kind', price: 400, art: 'r2_19', name: L('Arsenal de Relíquias', 'Relic Arsenal'), desc: L('5 Relíquias, com 1 Rara ou melhor.', '5 Relics, including 1 Rare or better.'), slots: [SL(3, 'C', F.relic), SL(1, 'U', F.relic), SL(1, 'RP', F.relic)] });
  pk({ id: 'grimorio', tier: 'kind', price: 400, art: 'e2_11', name: L('Grimório Proibido', 'Forbidden Grimoire'), desc: L('5 Efeitos, com 1 Raro ou melhor.', '5 Effects, including 1 Rare or better.'), slots: [SL(3, 'C', F.effect), SL(1, 'U', F.effect), SL(1, 'RP', F.effect)] });
  pk({ id: 'decretos', tier: 'kind', price: 450, art: 'm_17', name: L('Decretos dos Deuses', 'Decrees of the Gods'), desc: L('4 cartas entre Ações, Deuses e Marcadores.', '4 cards among Actions, Gods and Markers.'), slots: [SL(2, 'CU', F.decree), SL(1, 'U', F.decree), SL(1, 'RP', F.decree)] });
  [['coro', 'h2_03'], ['matilha', 'h1_04'], ['arqueira', 'h3_25']].forEach(([tg, art]) => pk({ id: 'tag_' + tg, tier: 'theme', price: 500, lvl: 2, art, name: L('Selos: ' + G.TAGS[tg].pt, 'Seals: ' + G.TAGS[tg].en), desc: L(`2 criaturas ${G.TAGS[tg].pt} e 3 cartas variadas.`, `2 ${G.TAGS[tg].en} creatures and 3 assorted cards.`), slots: [SL(2, 'TAG', F.tag(tg)), SL(2, 'C'), SL(1, 'U')] }));
  [['blood', 'h1_01v'], ['eclipse', 'h1_02v'], ['ancestral', 'h1_03v'], ['spectral', 'h1_04v']].forEach(([th, art]) => { const nm = { blood: L('Lua Sangrenta', 'Blood Moon'), eclipse: L('Eclipse', 'Eclipse'), ancestral: L('Ancestral', 'Ancestral'), spectral: L('Espectral', 'Spectral') }[th]; pk({ id: 'th_' + th, tier: 'theme', price: 650, lvl: 4, art, name: L('Reflexos: ' + nm.pt, 'Reflections: ' + nm.en), desc: L(`3 variantes ${nm.pt} e 2 criaturas originais.`, `3 ${nm.en} variants and 2 original creatures.`), slots: [SL(3, 'VAR', F.theme(th)), SL(2, 'CU', F.base)] }); });
  pk({ id: 'reflexos', tier: 'theme', price: 700, lvl: 4, art: 'h3_14v', name: L('Galeria de Reflexos', 'Gallery of Reflections'), desc: L('3 variantes de qualquer tema e 2 cartas variadas.', '3 variants of any theme and 2 assorted cards.'), slots: [SL(3, 'VAR', F.variant), SL(2, 'CU')] });
  pk({ id: 'bau', tier: 'premium', price: 1100, lvl: 3, art: 'e1_10', name: L('Baú do Coliseu', 'Coliseum Chest'), desc: L('12 cartas: 7 Comuns, 3 Incomuns e 2 Raras ou melhores.', '12 cards: 7 Commons, 3 Uncommons and 2 Rares or better.'), slots: [SL(7, 'C'), SL(3, 'U'), SL(2, 'RP')] });
  pk({ id: 'aureo', tier: 'premium', price: 1400, lvl: 5, art: 'm_12', name: L('Selo Áureo', 'Golden Seal'), desc: L('2 Incomuns, 2 Raras e 1 Épica garantida (8% de chance de Lendária).', '2 Uncommons, 2 Rares and 1 guaranteed Epic (8% Legendary chance).'), slots: [SL(2, 'U'), SL(2, 'R'), SL(1, 'EP')] });
  pk({ id: 'relicario', tier: 'legend', price: 4000, lvl: 10, art: 'h2_20', name: L('Relicário Lendário', 'Legendary Reliquary'), desc: L('3 cartas: 1 Rara, 1 Épica e 1 Lendária garantidas.', '3 cards: 1 Rare, 1 Epic and 1 Legendary, guaranteed.'), slots: [SL(1, 'R'), SL(1, 'E'), SL(1, 'L')] });
  pk({ id: 'fr_cri', tier: 'frag', price: 250, art: 'h1_04v', name: L('Fragmentos de Criaturas', 'Creature Fragments'), desc: L('4 pacotes de fragmentos de criaturas para a Forja.', '4 bundles of creature fragments for the Forge.'), frag: [SL(4, 'FR', F.creature)] });
  pk({ id: 'fr_acao', tier: 'frag', price: 250, art: 'm_18', name: L('Fragmentos de Ações', 'Action Fragments'), desc: L('4 pacotes de fragmentos de Ações, Efeitos, Deuses e Marcadores.', '4 bundles of fragments of Actions, Effects, Gods and Markers.'), frag: [SL(4, 'FR', F.actionish)] });
  pk({ id: 'fr_rel', tier: 'frag', price: 250, art: 'r1_22', name: L('Fragmentos de Relíquias', 'Relic Fragments'), desc: L('4 pacotes de fragmentos de Relíquias.', '4 bundles of Relic fragments.'), frag: [SL(4, 'FR', F.relic)] });
  pk({ id: 'fr_var', tier: 'frag', price: 400, lvl: 4, art: 'h3_25v', name: L('Fragmentos de Variantes', 'Variant Fragments'), desc: L('4 pacotes de fragmentos de variantes.', '4 bundles of variant fragments.'), frag: [SL(4, 'VAR', F.variant)] });
  pk({ id: 'fr_raro', tier: 'frag', price: 900, lvl: 6, art: 'h2_09', name: L('Estilhaços Raros', 'Rare Shards'), desc: L('3 pacotes de fragmentos de cartas Raras, Épicas ou Lendárias.', '3 bundles of fragments of Rare, Epic or Legendary cards.'), frag: [SL(3, 'FRR')] });
  const wOf = (s) => (typeof s.w === 'string' ? W[s.w] : s.w);
  function rollR(w, rng) { const ks = Object.keys(w); let x = rng() * G.sum(ks, (k) => w[k]); for (const k of ks) { x -= w[k]; if (x <= 0) return k; } return ks[ks.length - 1]; }
  function pickCard(f, r, rng, avoid) {
    const pool = coll().filter(f).filter((c) => !(avoid && avoid.has(c.id))); const ri = RORD.indexOf(r);
    const order = RORD.slice().sort((a, b) => Math.abs(RORD.indexOf(a) - ri) - Math.abs(RORD.indexOf(b) - ri));
    for (const rr of order) { const p = pool.filter((c) => c.rarity === rr); if (p.length) return p[rng.int(p.length)].id; }
    return null;
  }
  P.packById = (id) => P.PACKS.find((p) => p.id === id);
  P.genPack = function (pack, rng) {
    const items = []; let gotL = false; const pity = (P.d.pity || 0) >= P.PITY - 1;
    const avoid = new Set((P.d.lastHigh || []).concat([]));
    pack.slots.forEach((s) => { const w = wOf(s); for (let k = 0; k < s.n; k++) { let r = rollR(w, rng); if (pity && !gotL && w.L) r = 'L'; const id = pickCard(s.f, r, rng, avoid) || pickCard(s.f, r, rng); if (id) { items.push({ type: 'card', id }); avoid.add(id); const rr = G.CARDS[id].rarity; if (rr === 'L') gotL = true; if (rr === 'L' || rr === 'E') { P.d.lastHigh = [id].concat(P.d.lastHigh || []).slice(0, 6); } } } });
    const fr = pack.frag.slice(); if (pack.bonusFrag && rng() < pack.bonusFrag) fr.push(SL(1, 'FR'));
    fr.forEach((s) => { const w = wOf(s); for (let k = 0; k < s.n; k++) { const id = pickCard(s.f, rollR(w, rng), rng); if (id) { const a = P.FRAG_AMT[G.CARDS[id].rarity]; items.push({ type: 'frag', id, n: a[0] + rng.int(a[1] - a[0] + 1) }); } } });
    if (pack.slots.some((s) => wOf(s).L)) P.d.pity = gotL ? 0 : (P.d.pity || 0) + 1;
    return items;
  };
  P.openPack = function (id) {
    const pack = P.packById(id); if (!pack || !(P.d.packs[id] > 0)) return null; P.d.packs[id]--;
    const items = P.genPack(pack, G.rng((Date.now() ^ (Math.random() * 4294967295)) >>> 0));
    items.forEach((it) => {
      const c = G.CARDS[it.id];
      if (it.type === 'card') { const before = P.own(it.id); it.isNew = before === 0; if (before >= G.copyLimit(c)) { it.dup = P.DUST[c.rarity]; P.d.shards += it.dup; } else P.d.collection[it.id] = before + 1; if (c.rarity === 'L') P.d.stats.legendsPulled++; }
      else { P.d.frags[it.id] = (P.d.frags[it.id] || 0) + it.n; it.total = P.d.frags[it.id]; it.cost = P.CRAFT[c.rarity]; }
    });
    P.d.stats.boosters++; P.save(); return items;
  };
  P.packPrice = (pack, n) => Math.round(pack.price * n * (n >= 5 ? 0.9 : 1));
  P.buyPack = (id, n) => { const pack = P.packById(id); n = n || 1; if (!pack) return false; const cost = P.packPrice(pack, n); if (P.d.level < pack.lvl || P.d.shards < cost) return false; P.d.shards -= cost; P.addPack(id, n); P.save(); return true; };
  P.addPack = (id, n) => { P.d.packs[id] = (P.d.packs[id] || 0) + (n || 1); };
  P.totalPacks = () => G.sum(Object.values(P.d.packs || {}));
  P.canCraft = (id) => (P.d.frags[id] || 0) >= P.CRAFT[G.CARDS[id].rarity] && P.own(id) < G.copyLimit(G.CARDS[id]);
  P.craft = (id) => { if (!P.canCraft(id)) return false; P.d.frags[id] -= P.CRAFT[G.CARDS[id].rarity]; P.d.collection[id] = P.own(id) + 1; P.d.stats.crafted = (P.d.stats.crafted || 0) + 1; P.save(); return true; };
  // teto de cartas raras nos decks da CPU, de acordo com o nível do jogador (mesma realidade de coleção)
  P.aiCap = () => { const l = P.d.level; return { L: l < 8 ? 0 : l < 20 ? 1 : 2, E: l < 5 ? 1 : l < 15 ? 2 : 4, R: l < 5 ? 4 : l < 15 ? 7 : 12 }; };
  P.craftableCount = () => Object.keys(P.d.frags || {}).filter((id) => P.canCraft(id)).length;

  // ---------- decks ----------
  P.newDeckId = () => 'd' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  P.saveDeck = (deck) => { const i = P.d.decks.findIndex((d) => d.id === deck.id); if (i >= 0) P.d.decks[i] = deck; else { P.d.decks.push(deck); P.d.stats.decksBuilt++; } P.save(); };
  P.deleteDeck = (id) => { P.d.decks = P.d.decks.filter((d) => d.id !== id); if (P.d.activeDeck === id) P.d.activeDeck = P.d.decks[0] ? P.d.decks[0].id : null; P.save(); };
  P.validDecks = () => P.d.decks.filter((d) => G.validateDeck(d.cards).length === 0 && d.cards.every((id) => P.countIn(d.cards, id) <= P.own(id)));
  P.countIn = (cards, id) => cards.filter((x) => x === id).length;
  P.grantStarter = function (s) {
    const cards = G.starterDeck(s);
    cards.forEach((id) => { if (G.CARDS[id].kind !== 'charge') P.d.collection[id] = Math.max(P.d.collection[id] || 0, P.countIn(cards, id)); });
    const deck = { id: P.newDeckId(), name: s.name[G.lang] || s.name.pt, cards, cover: s.cover };
    P.d.decks.push(deck); P.d.activeDeck = deck.id; P.d.starter = s.id; P.addPack('basic', 3); P.d.avatar = s.cover; P.save();
  };

  // ---------- nível ----------
  P.xpNeed = (L) => 150 + 60 * L;
  P.ARENAS = [
    { id: 'coliseum', lvl: 1, art: 'e1_25', amb: 'coliseum', name: L('Coliseu das Almas', 'Coliseum of Souls') },
    { id: 'solen', lvl: 3, art: 'e2_02', amb: 'sac', name: L('Catedral de Solênia', 'Cathedral of Solenne') },
    { id: 'brasa', lvl: 6, art: 'e1_18', amb: 'ign', name: L('Forja de Brasaforja', 'Forge of Emberforge') },
    { id: 'umbra', lvl: 10, art: 'e1_05', amb: 'occ', name: L('Necrópole de Umbravel', 'Necropolis of Umbravel') },
    { id: 'vort', lvl: 15, art: 'e2_05', amb: 'ene', name: L('Picos de Vórtica', 'Peaks of Vortica') },
    { id: 'sylv', lvl: 20, art: 'e2_10', amb: 'pri', name: L('Bosque de Sylvanor', 'Grove of Sylvanor') }
  ];
  P.arenasUnlocked = () => P.ARENAS.filter((a) => P.d.level >= a.lvl);
  P.addXP = function (n) {
    const d = P.d; d.xp += n; const ups = [];
    while (d.xp >= P.xpNeed(d.level)) { d.xp -= P.xpNeed(d.level); d.level++; const rw = { level: d.level, boosters: 1, shards: 0 }; if (d.level % 5 === 0) { rw.boosters++; rw.premium = true; rw.shards = 150; } const ar = P.ARENAS.find((a) => a.lvl === d.level); if (ar) rw.arena = ar.id; P.addPack('basic', 1); if (rw.premium) P.addPack('aureo', 1); d.shards += rw.shards; ups.push(rw); }
    return ups;
  };

  // ---------- Elos ----------
  P.TIERS = [
    { min: 0, key: 'stone', color: '#8f8a84', name: L('Pedra', 'Stone') }, { min: 1000, key: 'bronze', color: '#c0844d', name: L('Bronze', 'Bronze') },
    { min: 1200, key: 'silver', color: '#c8d0da', name: L('Prata', 'Silver') }, { min: 1400, key: 'gold', color: '#e8c55e', name: L('Ouro', 'Gold') },
    { min: 1600, key: 'obsidian', color: '#9a7ae0', name: L('Obsidiana', 'Obsidian') }, { min: 1800, key: 'diamond', color: '#86e3ff', name: L('Diamante', 'Diamond') },
    { min: 2000, key: 'legend', color: '#ff9a4d', name: L('Lendário', 'Legendary') }
  ];
  P.rankOf = function (mmr) {
    let i = 0; P.TIERS.forEach((t, k) => { if (mmr >= t.min) i = k; });
    const t = P.TIERS[i]; const nx = P.TIERS[i + 1];
    let div = '';
    if (nx) { const lo = i === 0 ? 800 : t.min; const band = nx.min - lo; const pr = (mmr - lo) / band; div = pr < 1 / 3 ? 'III' : pr < 2 / 3 ? 'II' : 'I'; }
    return { i, t, div, label: t.name[G.lang] + (div ? ' ' + div : ''), next: nx };
  };

  // ---------- jogadores fictícios ----------
  const SA = ['Vex', 'Mor', 'Kael', 'Lyr', 'Thal', 'Nyx', 'Ser', 'Dra', 'Gor', 'Ves', 'Ul', 'Zar', 'Ash', 'Bel', 'Cyr', 'Eld', 'Fen', 'Hra', 'Isk', 'Jor', 'Kor', 'Mal', 'Nor', 'Ory', 'Pyr', 'Quel', 'Rav', 'Syl', 'Tor', 'Umb', 'Val', 'Wyr', 'Xan', 'Yse', 'Zeph', 'Ari', 'Bran', 'Cael', 'Duna', 'Ery'];
  const SB = ['ra', 'mor', 'eth', 'ion', 'dris', 'wyn', 'ath', 'ix', 'or', 'ael', 'une', 'is', 'ar', 'en', 'oth', 'ys', 'an', 'iel', 'vash', 'ka'];
  const W1 = ['Sombra', 'Cinza', 'Lua', 'Brasa', 'Vitral', 'Corvo', 'Ferro', 'Rubro', 'Noite', 'Trovão', 'Raiz', 'Osso', 'Alma', 'Lâmina', 'Shadow', 'Ash', 'Moon', 'Ember', 'Raven', 'Iron', 'Storm', 'Bone', 'Soul', 'Blade', 'Hex', 'Rune'];
  const W2 = ['Rubra', 'Eterna', 'Partida', 'Negra', 'Fria', 'Viva', 'Caller', 'Bound', 'Wraith', 'Fang', 'Born', 'Heart', 'do_Norte', 'da_Forja', 'Errante', 'Real'];
  P.fakes = (function () {
    const r = G.rng(777); const out = []; const used = {};
    for (let i = 0; i < 420; i++) {
      let n; const k = r();
      if (k < 0.5) n = r.pick(SA) + r.pick(SB) + (r() < 0.35 ? (r() < 0.5 ? '_' : '') + (r.int(98) + 1) : '');
      else if (k < 0.82) n = r.pick(W1) + (r() < 0.4 ? '_' : '') + r.pick(W2) + (r() < 0.25 ? r.int(9) : '');
      else { const c = G.CARDS[r.pick(G.CARD_ORDER.filter((id) => G.CARDS[id].kind === 'creature'))]; n = (r() < 0.5 ? 'xX_' : '') + c.name.pt.split(/[ ,]/)[0].replace(/[^A-Za-zÀ-ú]/g, '') + (r() < 0.5 ? r.int(999) : '_Main'); }
      if (used[n]) n += r.int(9); used[n] = 1;
      const base = Math.round(G.clamp(1250 + (r() + r() + r() - 1.5) * 700, 650, 2450));
      const affs = G.AFF_LIST; const aff = r.pick(affs); let aff2 = r.pick(affs); if (aff2 === aff) aff2 = null;
      out.push({ id: 'f' + i, name: n, base, ph: r() * 6.28, f: 0.15 + r() * 0.4, aff, aff2, avatar: r.pick(G.CARD_ORDER.filter((id) => G.CARDS[id].kind === 'creature')), level: Math.max(1, Math.round((base - 600) / 22 + r.int(10))) });
    }
    return out;
  })();
  P.fakeMmr = (f, day) => Math.round(f.base + 90 * Math.sin(day * f.f + f.ph) + 35 * ((G.hash(day + ':' + f.id) % 1000) / 500 - 1));
  P.leaderboard = function () {
    const day = G.dayIndex();
    const list = P.fakes.map((f) => ({ name: f.name, mmr: P.fakeMmr(f, day), aff: f.aff, avatar: f.avatar, level: f.level, id: f.id }));
    list.push({ name: P.d.name || '—', mmr: P.d.mmr, aff: null, avatar: P.d.avatar, level: P.d.level, you: true });
    list.sort((a, b) => b.mmr - a.mmr); list.forEach((x, i) => { x.pos = i + 1; });
    return list;
  };
  P.onlineCount = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return Math.round(1400 + 900 * Math.sin((h - 8) / 24 * 6.283) + (G.hash(Math.floor(Date.now() / 60000)) % 180)); };
  P.oppSkill = function (rng) {
    const s = P.d.skill; const r = rng(); let v;
    if (r < 0.1) v = s - 0.22; else if (r > 0.9) v = s + 0.2; else v = s + (rng() - 0.5) * 0.1;
    return G.clamp(v, 0.08, 0.98);
  };
  P.findOpponent = function (mode) {
    const rng = G.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0); const day = G.dayIndex();
    const me = P.d.mmr; const near = P.fakes.map((f) => ({ f, m: P.fakeMmr(f, day) })).sort((a, b) => Math.abs(a.m - me) - Math.abs(b.m - me)).slice(0, 18);
    const pick = near[rng.int(near.length)];
    const skill = P.oppSkill(rng);
    return { name: pick.f.name, mmr: mode === 'ranked' ? pick.m : null, avatar: pick.f.avatar, aff: pick.f.aff, aff2: pick.f.aff2, skill, q: G.clamp(skill + 0.1, 0.2, 0.95), level: pick.f.level, seed: rng.int(1e9) };
  };
  // Calendário do Ciclo das Luas (28 dias): uma oferenda por dia real, recompensas maiores nos marcos
  P.CAL = Array.from({ length: 28 }, (_, i) => { const d = i + 1;
    if (d === 7) return { ess: 120, packs: [['basic', 2]], big: true };
    if (d === 14) return { ess: 200, packs: [['reg_valc', 1]], big: true };
    if (d === 21) return { ess: 250, packs: [['aureo', 1]], big: true };
    if (d === 28) return { ess: 600, packs: [['bau', 1], ['aureo', 1]], big: true };
    return { ess: 40 + Math.floor(d / 7) * 15 + (d % 7) * 5 }; });
  P.calCanClaim = () => { const c = P.d.calendar || {}; return c.last !== G.todayKey(); };
  P.claimCalendar = () => { const c = P.d.calendar = P.d.calendar || { day: 0, last: null, cycle: 1 }; if (!P.calCanClaim()) return null; const rw = P.CAL[c.day]; P.d.shards += rw.ess || 0; (rw.packs || []).forEach(([id, n]) => P.addPack(id, n)); c.last = G.todayKey(); c.day++; if (c.day >= 28) { c.day = 0; c.cycle++; } P.save(); return rw; };
  // Eventos datados (estrutura para o futuro Modo Campeonato: um embate por dia)
  P.events = () => { const now = new Date(); const sat = new Date(now); sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7)); const fmt = (dt) => dt.toLocaleDateString(G.lang === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' });
    const e2 = new Date(sat); e2.setDate(sat.getDate() + 14);
    return [{ id: 'cup_blood', name: { pt: 'Torneio da Lua Sangrenta', en: 'Blood Moon Tournament' }, desc: { pt: 'Chave de 64 Invocadores por Elo · melhor de 3 · em breve', en: '64-Summoner bracket per Rank · best of 3 · coming soon' }, when: fmt(sat), start: sat.getTime(), days: 6, status: 'soon' },
      { id: 'cup_eclipse', name: { pt: 'Copa do Eclipse', en: 'Eclipse Cup' }, desc: { pt: 'Disputa entre as camadas Mid Tier · em breve', en: 'Mid Tier showdown · coming soon' }, when: fmt(e2), start: e2.getTime(), days: 6, status: 'soon' }]; };
  P.checkDaily = function () { return P.calCanClaim(); };

  // ---------- reputação e estilo ----------
  P.repLabel = (r) => r < 30 ? L('Duvidosa', 'Dubious') : r < 55 ? L('Neutra', 'Neutral') : r < 75 ? L('Honrada', 'Honored') : r < 90 ? L('Respeitada', 'Respected') : L('Lendária', 'Legendary');
  P.playstyle = function () {
    const s = P.d.stats; const m = Math.max(1, s.matches);
    const ax = {
      agg: G.clamp(Math.round((s.dmg / Math.max(1, s.turns)) / 0.9), 0, 100),
      mag: G.clamp(Math.round(s.effects / m * 12), 0, 100),
      ctl: G.clamp(Math.round(G.sum(Object.values(s.conds)) / m * 22), 0, 100),
      def: G.clamp(Math.round(s.heals / m / 1.4), 0, 100),
      str: G.clamp(Math.round((s.relics + s.abilities + s.retreats) / m * 9), 0, 100)
    };
    const keys = Object.keys(ax).sort((a, b) => ax[b] - ax[a]);
    const spread = ax[keys[0]] - ax[keys[4]];
    return { ax, key: s.matches < 3 ? 'new' : spread < 18 ? 'bal' : keys[0] };
  };

  // ---------- conquistas (Marcos) ----------
  P.ACH = (function () {
    const out = []; const add = (id, n, d, get, goal, sh) => out.push({ id, n, d, get, goal, sh: sh || 20 });
    const tiers = (id, arr, names, dpt, den, get, base) => arr.forEach((g, i) => add(id + '_' + g, L(names[i][0], names[i][1]), L(dpt.replace('{n}', G.fmtN(g, 'pt')), den.replace('{n}', G.fmtN(g, 'en'))), get, g, Math.round((base || 20) * (1 + i * 0.8))));
    const S = (k) => (d) => d.stats[k] || 0;
    tiers('wins', [1, 5, 10, 25, 50, 100, 250, 500, 1000], [['Primeiro Sangue', 'First Blood'], ['Aprendiz do Coliseu', 'Coliseum Apprentice'], ['Duelista', 'Duelist'], ['Veterano', 'Veteran'], ['Campeão Local', 'Local Champion'], ['Senhor das Arenas', 'Lord of Arenas'], ['Lenda Viva', 'Living Legend'], ['Imortal', 'Immortal'], ['Deus do Coliseu', 'God of the Coliseum']], 'Vença {n} partidas.', 'Win {n} matches.', S('wins'), 25);
    tiers('rwins', [1, 5, 10, 25, 50, 100, 250, 500], [['Glória I', 'Glory I'], ['Glória II', 'Glory II'], ['Glória III', 'Glory III'], ['Glória IV', 'Glory IV'], ['Glória V', 'Glory V'], ['Glória VI', 'Glory VI'], ['Glória VII', 'Glory VII'], ['Glória VIII', 'Glory VIII']], 'Vença {n} partidas no Coliseu das Almas.', 'Win {n} matches in the Coliseum of Souls.', S('rankedWins'), 30);
    tiers('matches', [1, 10, 50, 100, 500, 1000], [['O Primeiro Selo', 'The First Seal'], ['Frequentador', 'Regular'], ['Assíduo', 'Devoted'], ['Incansável', 'Tireless'], ['Obcecado', 'Obsessed'], ['Eterno Invocador', 'Eternal Summoner']], 'Jogue {n} partidas.', 'Play {n} matches.', S('matches'), 15);
    tiers('kos', [10, 50, 100, 250, 500, 1000, 2500, 5000], [['Ceifador I', 'Reaper I'], ['Ceifador II', 'Reaper II'], ['Ceifador III', 'Reaper III'], ['Ceifador IV', 'Reaper IV'], ['Ceifador V', 'Reaper V'], ['Ceifador VI', 'Reaper VI'], ['Ceifador VII', 'Reaper VII'], ['Ceifador VIII', 'Reaper VIII']], 'Derrote {n} criaturas.', 'Defeat {n} creatures.', S('kos'), 20);
    G.AFF_LIST.forEach((a) => {
      const an = G.AFF[a];
      [10, 50, 200].forEach((g, i) => add('kaff_' + a + '_' + g, L('Caçador ' + an.pt + ' ' + 'I'.repeat(i + 1), an.en + ' Hunter ' + 'I'.repeat(i + 1)), L(`Derrote ${g} criaturas ${an.ptPl}.`, `Defeat ${g} ${an.en} creatures.`), (d) => d.stats.kosAff[a] || 0, g, 20 + i * 25));
      [1, 10, 25, 100].forEach((g, i) => add('waff_' + a + '_' + g, L('Devoto ' + an.pt + ' ' + 'I'.repeat(i + 1), an.en + ' Devotee ' + 'I'.repeat(i + 1)), L(`Vença ${g} partidas com um deck majoritariamente ${an.pt}.`, `Win ${g} matches with a mostly ${an.en} deck.`), (d) => d.stats.winsAff[a] || 0, g, 20 + i * 25));
    });
    tiers('dmg', [1000, 10000, 50000, 100000, 500000], [['Golpe Firme', 'Firm Strike'], ['Destruidor', 'Destroyer'], ['Aniquilador', 'Annihilator'], ['Cataclismo', 'Cataclysm'], ['Fim dos Tempos', 'End of Days']], 'Cause {n} de dano no total.', 'Deal {n} total damage.', S('dmg'), 25);
    tiers('hit', [80, 120, 160, 200, 250], [['Impacto', 'Impact'], ['Esmagador', 'Crusher'], ['Fúria Divina', 'Divine Fury'], ['Golpe Lendário', 'Legendary Blow'], ['Além do Limite', 'Beyond the Limit']], 'Cause {n} ou mais de dano em um único ataque.', 'Deal {n}+ damage with a single attack.', S('maxHit'), 25);
    tiers('prizes', [10, 50, 200, 1000], [['Colecionador de Almas', 'Soul Collector'], ['Mercador de Almas', 'Soul Merchant'], ['Senhor das Almas', 'Lord of Souls'], ['Devorador de Almas', 'Soul Devourer']], 'Pegue {n} Almas.', 'Claim {n} Souls.', S('prizes'), 20);
    tiers('perfect', [1, 10, 50], [['Intocável', 'Untouchable'], ['Imaculado', 'Immaculate'], ['Perfeição', 'Perfection']], 'Vença {n} partidas sem perder nenhuma Alma.', 'Win {n} matches without losing a Soul.', S('perfect'), 40);
    tiers('comeback', [1, 10], [['Virada', 'Comeback'], ['Rei das Viradas', 'Comeback King']], 'Vença {n} partidas depois de estar 2+ Almas atrás.', 'Win {n} matches after being 2+ Souls behind.', S('comebacks'), 40);
    [['prizes', 'Pelas Almas', 'By the Souls', 'Vença pegando todas as Almas.', 'Win by claiming all Souls.'], ['wipe', 'Terra Arrasada', 'Scorched Earth', 'Vença deixando o oponente sem criaturas.', 'Win by leaving the opponent with no creatures.'], ['deckout', 'Paciência Ancestral', 'Ancestral Patience', 'Vença pelo Esgotamento do deck do oponente.', 'Win by the opponent’s deck Exhaustion.']].forEach((x) => add('reason_' + x[0], L(x[1], x[2]), L(x[3], x[4]), (d) => d.stats.winReasons[x[0]] || 0, 1, 40));
    tiers('asc', [1, 10, 50, 200], [['Ascensão', 'Ascension'], ['Transcendência', 'Transcendence'], ['Apoteose', 'Apotheosis'], ['Divindade', 'Divinity']], 'Ascenda {n} criaturas.', 'Ascend {n} creatures.', S('ascends'), 20);
    Object.keys(G.COND).forEach((k) => [5, 50].forEach((g, i) => add('cond_' + k + '_' + g, L('Mestre do ' + G.COND_NOUN[k].pt + ' ' + 'I'.repeat(i + 1), G.COND_NOUN[k].en + ' Master ' + 'I'.repeat(i + 1)), L(`Aplique ${G.COND_NOUN[k].pt} ${g} vezes.`, `Apply ${G.COND_NOUN[k].en} ${g} times.`), (d) => d.stats.conds[k] || 0, g, 20 + i * 30)));
    tiers('heals', [500, 5000, 20000], [['Mãos Curadoras', 'Healing Hands'], ['Santo', 'Saint'], ['Milagreiro', 'Miracle Worker']], 'Cure {n} de dano no total.', 'Heal {n} total damage.', S('heals'), 25);
    tiers('effects', [10, 100, 500, 2000], [['Iniciado Arcano', 'Arcane Initiate'], ['Arcanista', 'Arcanist'], ['Arquimago', 'Archmage'], ['Tecelão da Realidade', 'Reality Weaver']], 'Jogue {n} Efeitos.', 'Play {n} Effects.', S('effects'), 20);
    tiers('relics', [10, 100, 500], [['Relicário', 'Reliquary'], ['Guardião de Relíquias', 'Relic Keeper'], ['Museu Vivo', 'Living Museum']], 'Ligue {n} Relíquias.', 'Attach {n} Relics.', S('relics'), 20);
    tiers('actions', [10, 100, 500], [['Estrategista', 'Strategist'], ['Comandante', 'Commander'], ['Grão-Mestre', 'Grandmaster']], 'Jogue {n} Ações.', 'Play {n} Actions.', S('actions'), 20);
    G.CARD_ORDER.filter((id) => G.CARDS[id].kind === 'god').forEach((id) => { const c = G.CARDS[id]; [1, 25].forEach((g, i) => add('god_' + id + '_' + g, L((i ? 'Sumo Sacerdote de ' : 'Devoção a ') + c.name.pt, (i ? 'High Priest of ' : 'Devotion to ') + c.name.en), L(`Coloque ${c.name.pt} no Domínio ${g} vez(es).`, `Put ${c.name.en} in the Dominion ${g} time(s).`), (d) => d.stats.gods[id] || 0, g, 20 + i * 40)); });
    tiers('boosters', [1, 10, 25, 50, 100, 250], [['Primeiro Selo Rompido', 'First Seal Broken'], ['Colecionador', 'Collector'], ['Garimpeiro', 'Prospector'], ['Arqueólogo', 'Archaeologist'], ['Caçador de Tesouros', 'Treasure Hunter'], ['Mestre dos Selos', 'Seal Master']], 'Abra {n} boosters.', 'Open {n} boosters.', S('boosters'), 15);
    tiers('legpull', [1, 5, 10], [['Toque Lendário', 'Legendary Touch'], ['Abençoado', 'Blessed'], ['Escolhido dos Deuses', 'Chosen of the Gods']], 'Encontre {n} cartas Lendárias em boosters.', 'Pull {n} Legendary cards from boosters.', S('legendsPulled'), 40);
    const total = P.collectible().length;
    [20, 50, 100, 150, total].forEach((g, i) => add('coll_' + g, L(['Acervo', 'Biblioteca', 'Galeria', 'Tesouraria', 'Grimório Completo'][i], ['Hoard', 'Library', 'Gallery', 'Treasury', 'Complete Grimoire'][i]), L(`Tenha ${g} cartas diferentes.`, `Own ${g} different cards.`), () => P.uniqueOwned(), g, 25 + i * 30));
    G.AFF_LIST.forEach((a) => { const ids = G.CARD_ORDER.filter((id) => G.CARDS[id].kind === 'creature' && G.CARDS[id].aff === a); add('collaff_' + a, L('Todas as almas: ' + G.AFF[a].pt, 'Every soul: ' + G.AFF[a].en), L(`Tenha todas as criaturas ${G.AFF[a].ptPl}.`, `Own every ${G.AFF[a].en} creature.`), (d) => ids.filter((id) => d.collection[id]).length, ids.length, 100); });
    tiers('level', [5, 10, 20, 30, 50, 75, 100], [['Desperto', 'Awakened'], ['Adepto', 'Adept'], ['Conjurador', 'Conjurer'], ['Mestre Invocador', 'Master Summoner'], ['Arcano Supremo', 'Supreme Arcane'], ['Avatar', 'Avatar'], ['Herdeiro da Coroa', 'Heir to the Crown']], 'Alcance o nível {n}.', 'Reach level {n}.', (d) => d.level, 30);
    P.TIERS.slice(1).forEach((t, i) => add('tier_' + t.key, L('Elo ' + t.name.pt, t.name.en + ' Rank'), L(`Alcance o Elo ${t.name.pt} no Coliseu.`, `Reach ${t.name.en} in the Coliseum.`), (d) => d.peak, t.min, 40 + i * 30));
    tiers('streak', [3, 5, 10, 15], [['Embalado', 'On a Roll'], ['Imparável', 'Unstoppable'], ['Invicto', 'Undefeated'], ['Lenda Invicta', 'Unbeaten Legend']], 'Vença {n} partidas seguidas.', 'Win {n} matches in a row.', S('bestStreak'), 30);
    add('fast_10', L('Blitz', 'Blitz'), L('Vença em 10 turnos ou menos (total).', 'Win in 10 total turns or fewer.'), (d) => d.stats.fastWin <= 10 ? 1 : 0, 1, 40);
    add('fast_7', L('Relâmpago', 'Lightning'), L('Vença em 7 turnos ou menos (total).', 'Win in 7 total turns or fewer.'), (d) => d.stats.fastWin <= 7 ? 1 : 0, 1, 60);
    tiers('legko', [1, 10, 50], [['Mata-Lendas', 'Legend Slayer'], ['Ruína das Lendas', 'Bane of Legends'], ['Fim dos Mitos', 'End of Myths']], 'Derrote {n} Lendas.', 'Defeat {n} Legends.', S('legendKos'), 30);
    tiers('spect', [1, 10, 50], [['Espectador', 'Spectator'], ['Analista', 'Analyst'], ['Cronista', 'Chronicler']], 'Assista {n} duelos no modo Espectador.', 'Watch {n} duels in Spectator mode.', S('spectated'), 10);
    tiers('train', [1, 10], [['Aquecimento', 'Warm-up'], ['Disciplina', 'Discipline']], 'Jogue {n} partidas de Treino.', 'Play {n} Training matches.', S('trainMatches'), 10);
    tiers('adv', [1, 10], [['Aprendiz Atento', 'Attentive Apprentice'], ['Discípulo do Mentor', 'Mentor’s Disciple']], 'Vença {n} partidas de Treino Avançado.', 'Win {n} Advanced Training matches.', S('advWins'), 15);
    add('tutorial', L('Leitor de Grimórios', 'Grimoire Reader'), L('Conclua o tutorial.', 'Finish the tutorial.'), (d) => d.tutorialDone ? 1 : 0, 1, 50);
    tiers('decks', [1, 5, 10], [['Arquiteto', 'Architect'], ['Engenheiro de Decks', 'Deck Engineer'], ['Mestre Construtor', 'Master Builder']], 'Crie {n} decks.', 'Build {n} decks.', S('decksBuilt'), 15);
    tiers('abil', [10, 100, 500], [['Dom Revelado', 'Gift Revealed'], ['Dom Dominado', 'Gift Mastered'], ['Dom Supremo', 'Supreme Gift']], 'Use {n} Doms.', 'Use {n} Gifts.', S('abilities'), 15);
    tiers('mark', [10, 100], [['Afortunado', 'Fortunate'], ['Sorte dos Deuses', 'Luck of the Gods']], 'Ative {n} Marcadores.', 'Trigger {n} Markers.', S('markers'), 15);
    G.CARD_ORDER.forEach((id) => {
      const c = G.CARDS[id]; if (!['creature', 'effect', 'relic'].includes(c.kind)) return;
      const verb = { creature: ['Invocação', 'Summoning', 'Coloque em jogo', 'Put into play'], effect: ['Ritual', 'Ritual', 'Jogue', 'Play'], relic: ['Relíquia', 'Relic', 'Ligue', 'Attach'] }[c.kind];
      add('card_' + id, L(verb[0] + ': ' + c.name.pt, verb[1] + ': ' + c.name.en), L(`${verb[2]} ${c.name.pt} em uma partida.`, `${verb[3]} ${c.name.en} in a match.`), (d) => d.stats.played[id] || 0, 1, 5);
    });
    return out;
  })();
  P.checkAch = function () {
    const out = [];
    P.ACH.forEach((a) => { if (P.d.ach[a.id]) return; let v = 0; try { v = a.get(P.d); } catch (e) { } if (v >= a.goal) { P.d.ach[a.id] = Date.now(); P.d.shards += a.sh; out.push(a); } });
    if (out.length) P.save(); return out;
  };

  // ---------- registro de partida ----------
  P.recordMatch = function (info) {
    const d = P.d; const s = d.stats; const st = info.st || {}; const win = info.win;
    const res = { xp: 0, shards: 0, mmrDelta: 0, ups: [], ach: [] };
    if (info.mode === 'spectate') { s.spectated++; res.ach = P.checkAch(); P.save(); return res; }
    s.matches++; s.turns += st.turns || 0;
    if (win === true) s.wins++; else if (win === false) s.losses++; else s.draws++;
    if (info.mode === 'train') s.trainMatches++;
    s.kos += st.kos || 0; Object.keys(st.kosAff || {}).forEach((k) => { s.kosAff[k] = (s.kosAff[k] || 0) + st.kosAff[k]; });
    s.dmg += st.dmg || 0; s.maxHit = Math.max(s.maxHit, st.maxHit || 0); s.prizes += st.prizes || 0; s.ascends += st.ascends || 0;
    Object.keys(st.conds || {}).forEach((k) => { s.conds[k] = (s.conds[k] || 0) + st.conds[k]; });
    s.heals += st.heals || 0; s.effects += (st.effects || []).length; s.relics += (st.relics || []).length; s.actions += st.actions || 0;
    (st.gods || []).forEach((id) => { s.gods[id] = (s.gods[id] || 0) + 1; });
    (st.creatures || []).concat(st.effects || [], st.relics || []).forEach((id) => { s.played[id] = (s.played[id] || 0) + 1; });
    G.uniq(st.creatures || []).forEach((id) => { const b = G.baseId(id); const m = d.mastery[b] = d.mastery[b] || { plays: 0, kos: 0, falls: 0, wins: 0 }; m.plays++; if (win === true) m.wins++; });
    Object.keys(st.killsBy || {}).forEach((id) => { const b = G.baseId(id); const m = d.mastery[b] = d.mastery[b] || { plays: 0, kos: 0, falls: 0, wins: 0 }; m.kos += st.killsBy[id]; });
    Object.keys(st.fallen || {}).forEach((id) => { const b = G.baseId(id); const m = d.mastery[b] = d.mastery[b] || { plays: 0, kos: 0, falls: 0, wins: 0 }; m.falls += st.fallen[id]; });
    s.legendKos += st.legendKos || 0; s.abilities += st.abilities || 0; s.retreats += st.retreats || 0; s.markers += st.markers || 0; s.attacks += st.attacks || 0;
    if (info.conceded) { s.concedes++; d.rep = G.clamp(d.rep - 6, 0, 100); } else d.rep = G.clamp(d.rep + 1, 0, 100);
    if (info.mode !== 'train') {
      if (win === true) {
        d.streak++; s.bestStreak = Math.max(s.bestStreak, d.streak);
        s.winReasons[info.reason] = (s.winReasons[info.reason] || 0) + 1;
        if (info.lostPrizes === 0) s.perfect++;
        if ((st.maxBehind || 0) >= 2) s.comebacks++;
        s.fastWin = Math.min(s.fastWin, info.turns || 999);
        if (info.deckAff) s.winsAff[info.deckAff] = (s.winsAff[info.deckAff] || 0) + 1;
        if (info.mode === 'quick') s.quickWins++; if (info.mode === 'adv') s.advWins++;
      } else if (win === false) d.streak = 0;
      // habilidade estimada (para IA acompanhar o jogador)
      d.skill = G.clamp(d.skill + (win === true ? 0.035 : win === false ? -0.03 : 0), 0.12, 0.97);
    }
    const mult = { ranked: 1.3, quick: 1, adv: 0.8, train: 0.4 }[info.mode] || 1;
    res.xp = Math.round(((win === true ? 120 : 50) + 10 * (st.prizes || 0)) * mult);
    res.shards = Math.round((win === true ? ({ ranked: 40, quick: 25, adv: 20, train: 5 }[info.mode] || 10) : (info.mode === 'train' ? 2 : 10)) * (d.rep >= 75 ? 1.1 : 1));
    if (info.mode === 'ranked') {
      s.rankedMatches++; if (win) s.rankedWins++;
      const exp = 1 / (1 + Math.pow(10, ((info.oppMmr || d.mmr) - d.mmr) / 400));
      let delta = Math.round(32 * ((win === true ? 1 : win === false ? 0 : 0.5) - exp));
      if (win === true) delta = Math.max(8, delta); if (win === false) delta = Math.min(-6, delta);
      d.mmr = Math.max(0, d.mmr + delta); d.peak = Math.max(d.peak, d.mmr); d.mmrHist.push(d.mmr); if (d.mmrHist.length > 60) d.mmrHist.shift();
      res.mmrDelta = delta;
    }
    d.shards += res.shards; res.ups = P.addXP(res.xp);
    d.history.unshift({ mode: info.mode, win, opp: info.oppName, oppAff: info.oppAff, turns: info.turns, mmr: res.mmrDelta, date: Date.now(), reason: info.reason });
    d.history = d.history.slice(0, 30); d.inMatch = null;
    res.ach = P.checkAch(); P.save();
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
