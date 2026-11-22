/* Gera docs/REGRAS.md, docs/RULES.md e docs/CARTAS.md a partir dos dados do jogo */
const fs = require('fs'); const path = require('path'); const R = (f) => require(path.join(__dirname, '..', 'www', 'js', f));
R('core/util.js'); R('data/cards.js'); R('data/i18n.js'); R('data/tutorial.js'); R('core/engine.js');
const G = globalThis.G; const md = (h) => h.replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<[^>]+>/g, '');
function rules(lang) {
  G.lang = lang; let o = `# ${lang === 'pt' ? 'Almas de Orvalon — Livro de Regras' : 'Souls of Orvalon — Rulebook'}\n\n> ${G.LORE[lang]}\n\n`;
  G.TUT.forEach((c, i) => { o += `## ${i + 1}. ${c.t[lang]}\n\n`; c.b.forEach((b) => { if (b.p) o += md(b.p[lang]) + '\n\n'; if (b.list) o += b.list[lang].map((s) => '- ' + md(s)).join('\n') + '\n\n'; if (b.ex) o += `**${b.ex.t[lang]}**\n\n` + b.ex.s[lang].map((s, k) => `${k + 1}. ${md(s)}`).join('\n') + '\n\n'; if (b.cards) o += (lang === 'pt' ? '_Cartas de exemplo: ' : '_Example cards: ') + b.cards.map((id) => G.CARDS[id].name[lang]).join(', ') + '_\n\n'; }); });
  o += `## ${lang === 'pt' ? 'Regras rápidas' : 'Quick rules'}\n\n` + G.TUT_QUICK[lang].map((s) => '- ' + s).join('\n') + '\n';
  return o;
}
fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'REGRAS.md'), rules('pt'));
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'RULES.md'), rules('en'));
G.lang = 'pt'; let c = '# Almas de Orvalon — Lista de cartas\n\n';
Object.keys(G.REGIONS).forEach((k) => { c += `- **${G.REGIONS[k].name.pt}**: ${G.REGIONS[k].desc.pt}\n`; }); c += '\n';
const kinds = ['creature', 'effect', 'relic', 'action', 'god', 'marker', 'charge'];
kinds.forEach((k) => {
  c += `## ${G.KIND[k].pt}\n\n`;
  G.CARD_ORDER.filter((id) => G.CARDS[id].kind === k).forEach((id) => {
    const x = G.CARDS[id]; const cost = (a) => a.cost.map((q) => G.AFF[q].pt[0]).join('');
    c += `### ${x.name.pt}${x.sub ? ' — _' + x.sub.pt + '_' : ''} \`${id}\` (${G.RARITY[x.rarity].pt})\n`;
    if (k === 'creature') {
      c += `${G.RACE[x.race].pt} · ${G.AFF[x.aff].pt} · ${G.REGIONS[x.region].name.pt} · PV ${x.hp} · Recuo ${x.ret}${x.stage ? ' · Ascende de ' + G.CARDS[x.from].name.pt : ''}${x.legend ? ' · **Lenda**' : ''} · Fraqueza ${G.AFF[G.WEAK[x.aff]].pt}\n\n`;
      if (x.ab) c += `- **Dom — ${x.ab.name.pt}:** ${G.abilityText(x.ab, 'pt')}\n`;
      x.attacks.forEach((a) => { c += `- **${a.name.pt}** [${cost(a)}] ${a.dmg || ''} — ${G.attackText(a, 'pt') || ''}\n`; });
      if (x.flavor) c += `\n_${x.flavor.pt}_\n`;
    } else c += G.cardText(x, 'pt') + '\n';
    c += '\n';
  });
});
c += '\nLegenda de custo: Í=Ígnea, S=Sagrada, O=Oculta, E=Energética, N=Neutra.\n';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'CARTAS.md'), c);
console.log('docs ok');
