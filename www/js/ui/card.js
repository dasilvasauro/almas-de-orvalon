/* Almas de Orvalon — renderização de cartas e utilitários de interface */
(function (root) {
  const G = root.G; const el = G.el;
  G.lang = G.lang || 'pt';
  G.L = (o) => (o ? (o[G.lang] || o.pt || '') : '');
  G.uiUrl = (n) => (G.UI && G.UI[n]) || 'assets/ui/' + n + '.webp';
  G.artUrl = (id) => (G.ART && G.ART[id]) || 'assets/cards/' + id + '.webp';
  const sv = (d, stroke) => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="${stroke ? 'none' : 'currentColor'}" stroke="${stroke ? 'currentColor' : 'none'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const I = G.ICON = {
    ign: sv('M12 2c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-3 3 1 4 4 4 6a6 6 0 01-12 0c0-5 5-7 6-12z'),
    sac: sv('M12 2l2.6 6.3L21 9l-5 4.4 1.6 6.6L12 16.6 6.4 20l1.6-6.6L3 9l6.4-.7z'),
    occ: sv('M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z'),
    ene: sv('M13 2L4 14h7l-1 8 9-12h-7z'),
    pri: sv('M5 20C5 9 12 4 21 3c0 9-5 16-15 16zM5 20l9-9'),
    neu: sv('M12 3l8 9-8 9-8-9z'),
    shard: sv('M12 2l6 7-6 13L6 9z'),
    booster: sv('M6 2h12v20H6zM9 6h6M9 10h6'),
    gear: sv('M12 8a4 4 0 100 8 4 4 0 000-8zM3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4', 1),
    back: sv('M15 5l-7 7 7 7', 1), close: sv('M6 6l12 12M18 6L6 18', 1),
    play: sv('M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z'),
    decks: sv('M4 6h12v14H4zM8 2h12v14', 1), coll: sv('M3 4h7v7H3zM14 4h7v7h-7zM3 15h7v6H3zM14 15h7v6h-7z', 1),
    shop: sv('M5 8h14l-1 12H6zM9 8a3 3 0 016 0', 1), prof: sv('M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6', 1),
    trophy: sv('M7 4h10v5a5 5 0 01-10 0zM5 5H3a3 3 0 003 4M19 5h2a3 3 0 01-3 4M12 14v4M8 21h8', 1),
    pause: sv('M7 5h3v14H7zM14 5h3v14h-3z'), resume: sv('M7 4l13 8-13 8z'), log: sv('M5 6h14M5 12h14M5 18h9', 1), flag: sv('M5 21V4h11l-2 4 2 4H5', 1), eye: sv('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z', 1),
    sun: '<svg viewBox="0 0 24 24" width="1em" height="1em"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3" stroke="currentColor" stroke-width="2"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M20 15A8 8 0 019 4a8 8 0 1011 11z" fill="currentColor"/></svg>'
  };
  G.orb = (aff) => el('span.orb.' + aff, { html: I[aff], title: G.L(G.AFF[aff]) });
  G.costEl = (cost) => el('span.cost', cost.map((a) => G.orb(a)));
  G.res = (icon, v, title) => el('span.res', { title }, el('span', { html: I[icon] }), String(v));
  G.cardName = (id) => G.L(G.CARDS[id].name);
  G.kindLabel = function (c) {
    const t = G.t;
    switch (c.kind) {
      case 'creature': return G.L(G.RACE[c.race]);
      case 'effect': return t(c.mode === 'cont' ? 'kind.effectCont' : 'kind.effectInst');
      case 'god': return G.L(G.KIND.god) + ' · ' + G.L(G.AFF[c.aff]);
      case 'charge': return G.L(G.KIND.charge);
      default: return G.L(G.KIND[c.kind]);
    }
  };
  G.ui = {};
  G.ui.card = function (id, o) {
    o = o || {}; const c = G.CARDS[id]; const w = o.w || 200; const t = G.t;
    const node = el('div.card.k-' + c.kind + (c.legend ? '.legend' : '') + (c.variantOf ? '.variant' : '') + (c.aff ? '.a-' + c.aff : '') + '.r-' + c.rarity + (o.mini ? '.mini' : ''), { style: o.noW ? null : { '--cw': w + 'px' }, dataset: { id } });
    const head = el('div.chead', el('span.cname', G.L(c.name)));
    if (c.kind === 'creature') head.appendChild(el('span.chp', el('small', t('hp')), String(c.hp + (o.hpBonus || 0))));
    if (c.kind === 'creature' || c.kind === 'charge' || c.kind === 'god') head.appendChild(G.orb(c.aff));
    const art = el('div.cart', { style: { backgroundImage: `url(${G.artUrl(c.art)})` } });
    if (c.kind === 'creature') { art.appendChild(el('span.cbadge', c.stage ? t('stage.asc') : t('stage.basic'))); if (c.legend) art.appendChild(el('span.cbadge.leg', t('legend'))); if (c.variantOf) art.appendChild(el('span.cbadge.var', t('variant'))); }
    if (c.kind === 'effect' && c.mode === 'cont') art.appendChild(el('span.cbadge', t('cont')));
    const reg = c.region ? G.L(G.REGIONS[c.region].name) : '';
    const type = el('div.ctype', el('span', G.kindLabel(c) + (c.kind === 'creature' ? ' · ' + G.L(G.AFF[c.aff]) : '')), el('span', reg));
    const cin = el('div.cin', head);
    if (c.sub) cin.appendChild(el('div.csub', G.L(c.sub)));
    cin.appendChild(art); cin.appendChild(type);
    if (!o.mini) {
      const body = el('div.cbody');
      if (c.kind === 'creature') {
        if (c.ab) body.appendChild(el('div.cab', el('b', t('gift') + ': ' + G.L(c.ab.name) + ' '), G.abilityText(c.ab, G.lang)));
        c.attacks.forEach((a) => {
          let d = a.dmg ? String(a.dmg) : ''; if (a.fx.some((f) => f.t === 'coins')) d = a.dmg ? a.dmg + '+' : a.fx.find((f) => f.t === 'coins').v + '×'; if (a.fx.some((f) => ['perCharge', 'perDmg', 'perBench', 'tag', 'vsCond', 'vsDamaged', 'vsRace', 'coinPlus'].includes(f.t)) && a.dmg) d += '+';
          const tx = G.attackText(a, G.lang);
          body.appendChild(el('div.catk', G.costEl(a.cost), el('span.an', G.L(a.name)), el('span.ad', d), tx ? el('div.at', tx) : null));
        });
      } else body.appendChild(el('div.ctext', G.cardText(c, G.lang)));
      cin.appendChild(body);
      if (c.kind === 'creature') {
        const wk = Object.keys(G.WEAK).find((k) => k === c.aff) ? G.WEAK[c.aff] : null;
        cin.appendChild(el('div.cfoot',
          el('span', t('weak') + ' ', wk ? G.orb(wk) : '—', wk ? '+30' : ''),
          el('span', t('resist') + ' ', c.res ? G.orb(c.res) : '—', c.res ? '−20' : ''),
          el('span', t('retreat') + ' ', c.ret ? G.costEl(Array(c.ret).fill('neu')) : '0')));
      }
      if (c.flavor) cin.appendChild(el('div.cflav', G.L(c.flavor)));
      cin.appendChild(el('div.cset', el('span', el('i.rar.' + c.rarity), ' ' + G.L(G.RARITY[c.rarity])), el('span', c.from ? t('ascFrom', { n: G.cardName(c.from) }) : '', ' ', (G.CARD_ORDER.indexOf(id) + 1) + '/' + G.CARD_ORDER.length)));
    }
    node.appendChild(cin);
    return node;
  };
  G.ui.back = (w) => el('div.cback', { style: { '--cw': (w || 100) + 'px' } }, el('span', 'ORVALON'));

  // ---------- modais ----------
  const mroot = () => document.getElementById('modal-root');
  G.ui.modal = function (content, o) {
    o = o || {};
    const panel = el('div.panel' + (o.narrow ? '.narrow' : ''), o.title ? el('h2', o.title) : null, content);
    const veil = el('div.veil', panel);
    const close = () => { if (veil.classList.contains('closing')) return; veil.classList.add('closing'); setTimeout(() => veil.remove(), 230); if (o.onClose) o.onClose(); };
    if (o.dismiss !== false) { panel.prepend(el('button.btn.icon.ghost.x', { html: I.close, 'aria-label': G.t('close'), onclick: close })); veil.addEventListener('click', (e) => { if (e.target === veil) close(); }); }
    mroot().appendChild(veil); return { close, el: panel, veil };
  };
  G.ui.sheet = function (content, o) {
    o = o || {};
    const veil = el('div.veil', { style: { alignItems: 'flex-end', padding: 0, background: 'rgba(6,3,9,.45)' } });
    const sh = el('div.sheet', content);
    const close = () => { if (sh.classList.contains('closing')) return; veil.classList.add('closing'); sh.classList.add('closing'); setTimeout(() => { veil.remove(); sh.remove(); }, 240); if (o.onClose) o.onClose(); };
    veil.addEventListener('click', close);
    mroot().appendChild(veil); mroot().appendChild(sh); return { close, el: sh };
  };
  G.ui.toast = function (msg, cls, ms) {
    const box = document.getElementById('toasts'); const n = el('div.toast' + (cls ? '.' + cls : ''), msg);
    box.appendChild(n); setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = 0; setTimeout(() => n.remove(), 400); }, ms || 2600);
  };
  G.ui.confirm = (text, ok, cancel) => new Promise((res) => {
    let m; const done = (v) => { m.close(); res(v); };
    m = G.ui.modal(el('div.col', el('p', text), el('div.row', { style: { justifyContent: 'flex-end' } }, el('button.btn.ghost', { onclick: () => done(false) }, cancel || G.t('cancel')), el('button.btn.primary', { onclick: () => done(true) }, ok || G.t('confirm')))), { narrow: true, onClose: () => res(false) });
  });
  G.ui.zoom = function (id, extra) {
    const w = Math.min(window.innerWidth * 0.82, 330);
    return G.ui.modal(el('div.col', { style: { alignItems: 'center' } }, G.ui.card(id, { w }), extra || null), { narrow: true });
  };
  // cursores estilo RPG (só em dispositivos com mouse)
  G.ui.installCursors = function () {
    const svg = (s, hx, hy, fb) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>${s}</svg>`)}") ${hx} ${hy}, ${fb}`;
    const sword = (glow) => `${glow ? "<circle cx='25' cy='7' r='3.2' fill='#6fe3d6' opacity='.95'/>" : ''}<path d='M2 2 L7 3 L22 18 L18 22 L3 7 Z' fill='${glow ? '#fff4d0' : '#e9d39a'}' stroke='#2a1608' stroke-width='1.4' stroke-linejoin='round'/><path d='M15 25 L25 15' stroke='#8a5a1c' stroke-width='3.2' stroke-linecap='round'/><path d='M21 21 L27 27' stroke='#3a2410' stroke-width='3.4' stroke-linecap='round'/><circle cx='28.5' cy='28.5' r='2.2' fill='#c9a24e' stroke='#2a1608'/>`;
    const C = {
      def: svg(sword(false), 2, 2, 'auto'), hand: svg(sword(true), 2, 2, 'pointer'),
      target: svg("<circle cx='16' cy='16' r='11' fill='none' stroke='#6fe3d6' stroke-width='2.4'/><circle cx='16' cy='16' r='2.4' fill='#6fe3d6'/><path d='M16 1 V8 M16 24 V31 M1 16 H8 M24 16 H31' stroke='#6fe3d6' stroke-width='2.4'/>", 16, 16, 'crosshair'),
      attack: svg("<path d='M4 4 L20 20 M28 4 L12 20' stroke='#f2e2bd' stroke-width='3.2' stroke-linecap='round'/><path d='M17 23 L23 17 M9 17 L15 23' stroke='#8a5a1c' stroke-width='3' stroke-linecap='round'/><path d='M22 22 L28 28 M10 22 L4 28' stroke='#3a2410' stroke-width='3.2' stroke-linecap='round'/><circle cx='16' cy='12' r='2' fill='#d33a3f'/>", 16, 12, 'pointer'),
      wait: svg("<path d='M8 3 H24 M8 29 H24' stroke='#c9a24e' stroke-width='3' stroke-linecap='round'/><path d='M10 4 C10 12 22 12 22 16 C22 20 10 20 10 28 H22 C22 20 10 20 10 16 C10 12 22 12 22 4 Z' fill='rgba(30,20,10,.65)' stroke='#e9d39a' stroke-width='1.6'/><path d='M12 26 H20 L16 21 Z' fill='#e9b84a'/>", 16, 16, 'wait'),
      no: svg("<circle cx='16' cy='16' r='11' fill='rgba(0,0,0,.35)' stroke='#d33a3f' stroke-width='3'/><path d='M8 24 L24 8' stroke='#d33a3f' stroke-width='3'/>", 16, 16, 'not-allowed')
    };
    const css = `@media (pointer:fine){html,body,*{cursor:${C.def}}
button,a,.chip,.card,.tok,.mode,.cta,.starter,.flip,.pile,input[type=range],.avatar,.cell,.pack{cursor:${C.hand}!important}
button[disabled],.cell.locked,.dim{cursor:${C.no}!important}
.sheet .acts .btn.primary,.tok.pick{cursor:${C.attack}!important}
input:not([type]),input[type=text]{cursor:text!important}
body.cur-target,body.cur-target *{cursor:${C.target}!important}body.cur-target .tok.pick{cursor:${C.attack}!important}
body.cur-wait .board,body.cur-wait .board *{cursor:${C.wait}!important}.dragging{cursor:${C.target}!important}}`;
    document.head.appendChild(el('style', { text: css }));
  };
  G.click = () => G.audio && G.audio.play('ui');
})(typeof window !== 'undefined' ? window : globalThis);
