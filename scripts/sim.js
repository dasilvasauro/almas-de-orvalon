global.window = undefined;
require('../www/js/core/util.js'); require('../www/js/data/cards.js'); require('../www/js/core/engine.js'); require('../www/js/core/ai.js');
const G = globalThis.G;
const N = +process.argv[2] || 20;
const AFFS = [['ign','pri'],['sac','pri'],['occ','ene'],['ene','sac'],['pri','occ']];
const res = {}; const reasons = {}; let ohko = 0, kos = 0, hitsN = 0;
const view = { ev(type, d, g) { if (type === 'hit' && !d.bench && d.to && g.inst[d.to]) { hitsN++; if ((g.inst[d.to].dmg || 0) === 0 && d.v >= g.maxHP(d.to)) ohko++; } if (type === 'ko') kos++; } }; let errors = 0, turns = 0, games = 0, draws = 0; const t0 = Date.now();
async function play(da, db, sa, sb, seed) {
  const g = new G.Game({ seed, view, players: [{ name: 'A', deck: da }, { name: 'B', deck: db }], ctrls: [new G.AI(sa, { seed: seed + 1 }), new G.AI(sb, { seed: seed + 2 })] });
  const r = await g.run(); if (r.reason === 'error') { errors++; console.log('ERR', g.error && g.error.stack); }
  return { r, g };
}
(async () => {
  // validação de decks
  for (const s of G.STARTERS) { const d = G.starterDeck(s); const e = G.validateDeck(d); if (e.length) console.log('starter invalid', s.id, e); }
  for (let i = 0; i < AFFS.length; i++) for (let j = 0; j < AFFS.length; j++) {
    if (i === j) continue;
    for (let k = 0; k < N; k++) {
      const seed = 1000 + i * 1000 + j * 100 + k;
      const da = G.buildDeck({ aff: AFFS[i][0], aff2: AFFS[i][1], q: 0.85, seed });
      const db = G.buildDeck({ aff: AFFS[j][0], aff2: AFFS[j][1], q: 0.85, seed: seed + 7 });
      const ea = G.validateDeck(da), eb = G.validateDeck(db); if (ea.length || eb.length) { console.log('invalid deck', ea, eb); continue; }
      const { r } = await play(da, db, 0.85, 0.85, seed);
      games++; turns += r.turns; reasons[r.reason] = (reasons[r.reason] || 0) + 1;
      const A = AFFS[i][0], B = AFFS[j][0];
      res[A] = res[A] || { w: 0, n: 0 }; res[B] = res[B] || { w: 0, n: 0 };
      res[A].n++; res[B].n++;
      if (r.winner === 0) res[A].w++; else if (r.winner === 1) res[B].w++; else draws++;
    }
  }
  console.log('games', games, 'avg turns', (turns / games).toFixed(1), 'errors', errors, 'draws', draws, 'time', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  console.log('reasons', JSON.stringify(reasons)); console.log('one-hit KOs:', (100 * ohko / Math.max(1, kos)).toFixed(1) + '% dos KOs (' + ohko + '/' + kos + ')');
  Object.keys(res).forEach((a) => console.log(a, (100 * res[a].w / res[a].n).toFixed(1) + '%', res[a].n));
  // habilidade importa?
  let hw = 0, hn = 0;
  for (let k = 0; k < N * 3; k++) {
    const i = k % 5; const da = G.buildDeck({ aff: AFFS[i][0], aff2: AFFS[i][1], q: 0.8, seed: k }); const db = G.buildDeck({ aff: AFFS[(i + 2) % 5][0], aff2: AFFS[(i + 2) % 5][1], q: 0.8, seed: k + 9 });
    const strongFirst = k % 2 === 0;
    const { r } = await play(da, db, strongFirst ? 0.95 : 0.2, strongFirst ? 0.2 : 0.95, 50000 + k); hn++;
    if ((strongFirst && r.winner === 0) || (!strongFirst && r.winner === 1)) hw++;
  }
  console.log('skill 0.95 vs 0.2 winrate:', (100 * hw / hn).toFixed(1) + '%');
  // primeiro jogador
  console.log('starter deck sample:', JSON.stringify(G.starterDeck(G.STARTERS[0]).reduce((m, id) => (m[G.CARDS[id].kind] = (m[G.CARDS[id].kind] || 0) + 1, m), {})));
})();
