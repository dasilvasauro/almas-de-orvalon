/* Mede o impacto das runas: mesmo deck dos dois lados, só um lado com runas. Uso: node scripts/sim-runes.js [jogos] [página] */
global.window = undefined;
['core/util.js', 'data/lore.js', 'data/cards.js', 'data/runes.js', 'core/engine.js', 'core/ai.js'].forEach((f) => require('../www/js/' + f));
const G = globalThis.G; const N = +process.argv[2] || 120; const only = process.argv[3];
const SEC = { ign: 'pri', sac: 'pri', occ: 'ene', ene: 'sac', pri: 'occ' };
const pages = only ? { [only]: only.split(',') } : Object.assign({}, ...Object.keys(G.AI_RUNES).map((a) => ({ ['ia_' + a]: G.AI_RUNES[a] })));
(async () => {
  const out = {};
  for (const name of Object.keys(pages)) {
    const runes = pages[name]; const aff = G.RUNES[runes[0]].branch === 'neu' ? 'ign' : G.RUNES[runes[0]].branch; let w = 0, n = 0, base = 0;
    for (let k = 0; k < N; k++) {
      const seed = 5000 + k * 13; const deck = G.buildDeck({ aff, aff2: SEC[aff], q: 0.85, seed });
      const side = k % 2; const res2 = [];
      for (const on of [false, true]) { const pl = [0, 1].map((i) => ({ name: 'P' + i, deck: deck.slice(), runes: on && i === side ? runes : [] }));
        const g = new G.Game({ seed, first: k % 4 < 2 ? 0 : 1, players: pl, ctrls: [new G.AI(0.85, { seed: seed + 1 }), new G.AI(0.85, { seed: seed + 2 })] });
        const r = await g.run(); if (r.reason === 'error') { console.log('ERRO', g.error && g.error.stack); } res2.push(r.winner === side ? 1 : 0); }
      n++; w += res2[1] - res2[0]; base += res2[0];
    }
    out[name] = { delta: +(100 * w / n).toFixed(1), base: +(100 * base / n).toFixed(1), n };
  }
  console.log(JSON.stringify(out));
})();
