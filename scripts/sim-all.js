/* Simulação justa: decks sorteados entre as 5 afinidades puras e as 20 duplas (como os oponentes do jogo). Uso: node scripts/sim-all.js [jogos] */
const path = require('path');
if (process.env.TUNE) globalThis.ORVALON_TUNE = JSON.parse(process.env.TUNE);
['core/util.js', 'data/cards.js', 'core/engine.js', 'core/ai.js'].forEach((f) => require(path.join(__dirname, '..', 'www', 'js', f)));
const G = globalThis.G; const N = +process.argv[2] || 600; const A = G.AFF_LIST;
const cfgs = []; A.forEach((a) => { cfgs.push([a, null]); A.forEach((b) => { if (a !== b) cfgs.push([a, b]); }); });
const res = {}; let ohko = 0, kos = 0, turns = 0, errors = 0, firstW = 0, decided = 0; const reasons = {};
const view = { ev(type, d, g) { if (type === 'hit' && !d.bench && d.to && g.inst[d.to]) { if ((g.inst[d.to].dmg || 0) === 0 && d.v >= g.maxHP(d.to)) ohko++; } if (type === 'ko') kos++; } };
(async () => {
  for (let k = 0; k < N; k++) {
    const ca = cfgs[k % 25], cb = cfgs[(k * 7 + 3) % 25]; if (ca[0] === cb[0]) continue;
    const da = G.buildDeck({ aff: ca[0], aff2: ca[1], q: 0.85, seed: 100 + k, cap: { L: 1, E: 2, R: 7 } }), db = G.buildDeck({ aff: cb[0], aff2: cb[1], q: 0.85, seed: 900 + k, cap: { L: 1, E: 2, R: 7 } });
    const g = new G.Game({ seed: 5000 + k, view, players: [{ name: 'A', deck: da }, { name: 'B', deck: db }], ctrls: [new G.AI(0.85, { seed: k }), new G.AI(0.85, { seed: k + 1 })] });
    const r = await g.run(); if (r.reason === 'error') errors++; if (r.winner != null) { decided++; if (r.winner === g.first) firstW++; } turns += r.turns; reasons[r.reason] = (reasons[r.reason] || 0) + 1;
    [ca[0], cb[0]].forEach((a, i) => { res[a] = res[a] || { w: 0, n: 0 }; res[a].n++; if (r.winner === i) res[a].w++; });
  }
  const wr = {}; A.forEach((a) => { wr[a] = +(100 * res[a].w / res[a].n).toFixed(1); });
  const vals = Object.values(wr); const games = G.sum(Object.values(res), (x) => x.n) / 2;
  console.log(JSON.stringify({ games, wr, spread: +(Math.max(...vals) - Math.min(...vals)).toFixed(1), ohko: +(100 * ohko / kos).toFixed(1), firstPlayerWin: +(100 * firstW / decided).toFixed(1), turns: +(turns / games).toFixed(1), errors, reasons }));
})();
