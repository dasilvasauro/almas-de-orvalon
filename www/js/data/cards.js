/* Almas de Orvalon — banco de cartas
   Todo o texto de regras é GERADO a partir das primitivas de efeito,
   garantindo que o que está escrito é exatamente o que o motor executa. */
(function (root) {
  const G = root.G;
  const L = (pt, en) => ({ pt, en });

  // ---------- Afinidades ----------
  G.AFF = {
    ign: { pt: 'Ígnea', ptPl: 'Ígneas', en: 'Ember', enPl: 'Ember', color: '#e2582b', glow: '#ff8a3d', icon: 'm_07' },
    sac: { pt: 'Sagrada', ptPl: 'Sagradas', en: 'Sacred', enPl: 'Sacred', color: '#e8c25a', glow: '#fff1b0', icon: 'm_08' },
    occ: { pt: 'Oculta', ptPl: 'Ocultas', en: 'Occult', enPl: 'Occult', color: '#9a4fd6', glow: '#c98bff', icon: 'm_09' },
    ene: { pt: 'Energética', ptPl: 'Energéticas', en: 'Storm', enPl: 'Storm', color: '#3f8ff0', glow: '#9fd2ff', icon: 'm_10' },
    pri: { pt: 'Primal', ptPl: 'Primais', en: 'Primal', enPl: 'Primal', color: '#5aa84a', glow: '#b6f08a', icon: 'm_13' },
    neu: { pt: 'Neutra', ptPl: 'Neutras', en: 'Neutral', enPl: 'Neutral', color: '#b9bfc8', glow: '#ffffff', icon: 'm_06' }
  };
  // X é fraco contra WEAK[X]
  G.WEAK = { occ: 'sac', pri: 'occ', ene: 'pri', ign: 'ene', sac: 'ign' };
  G.AFF_LIST = ['ign', 'sac', 'occ', 'ene', 'pri'];

  G.COND = {
    poison: L('Envenenado', 'Poisoned'), burn: L('Queimado', 'Burned'), trance: L('Em Transe', 'Entranced'),
    stun: L('Atordoado', 'Stunned'), madness: L('Enlouquecido', 'Maddened')
  };
  G.COND_NOUN = {
    poison: L('Veneno', 'Poison'), burn: L('Queimadura', 'Burn'), trance: L('Transe', 'Trance'),
    stun: L('Atordoamento', 'Stun'), madness: L('Loucura', 'Madness')
  };
  G.RACE = { hero: L('Herói', 'Hero'), mon: L('Monstro', 'Monster') };
  G.RACE_PL = { hero: L('Heróis', 'Heroes'), mon: L('Monstros', 'Monsters') };
  G.TAGS = { coro: L('Coro Profano', 'Unholy Choir'), matilha: L('Matilha', 'Pack'), arqueira: L('Arqueira', 'Archer'), vitral: L('Vitral', 'Stained Glass') };
  G.RARITY = {
    C: L('Comum', 'Common'), U: L('Incomum', 'Uncommon'), R: L('Rara', 'Rare'), E: L('Épica', 'Epic'), L: L('Lendária', 'Legendary')
  };
  G.KIND = {
    creature: L('Criatura', 'Creature'), effect: L('Efeito', 'Effect'), relic: L('Relíquia', 'Relic'), god: L('Deus', 'God'),
    marker: L('Marcador', 'Marker'), charge: L('Carga', 'Charge'), action: L('Ação', 'Action')
  };

  // ---------- Lore ----------
  G.REGIONS = {
    brasa: { name: L('Brasaforja', 'Emberforge'), aff: 'ign', desc: L('Forjas vulcânicas do sul, onde o metal canta e os portões do abismo nunca esfriam.', 'Volcanic forges of the south, where metal sings and the abyss gates never cool.') },
    solen: { name: L('Solênia', 'Solenne'), aff: 'sac', desc: L('Cidades-catedral de vitrais vivos, guardadas por paladinos e curandeiras.', 'Cathedral-cities of living stained glass, guarded by paladins and healers.') },
    umbra: { name: L('Umbravel', 'Umbravel'), aff: 'occ', desc: L('Pântanos e necrópoles do oeste, onde a noite tem corte e a morte tem nome.', 'Western marshes and necropolises, where night holds court and death has a name.') },
    vort: { name: L('Vórtica', 'Vortica'), aff: 'ene', desc: L('Picos da tempestade, academias de engrenagens e a Costa Partida.', 'Storm peaks, clockwork academies and the Shattered Coast.') },
    sylv: { name: L('Sylvanor', 'Sylvanor'), aff: 'pri', desc: L('Bosques ancestrais do norte, lar de feras, xamãs e arqueiras.', 'Ancient northern woods, home to beasts, shamans and archers.') },
    sahr: { name: L('Sahrim', 'Sahrim'), aff: null, desc: L('As Areias Sepultas, deserto de tumbas e enigmas.', 'The Buried Sands, a desert of tombs and riddles.') },
    valc: { name: L('Valcoroa', 'Valcrown'), aff: null, desc: L('A capital, sede do Coliseu das Almas, onde mercenários de todo o reino buscam glória.', 'The capital, seat of the Coliseum of Souls, where mercenaries from every land seek glory.') }
  };
  G.LORE = L(
    'Orvalon foi um só reino enquanto viveu Aldren, o Último Rei. Na noite em que ele morreu sem herdeiros, a Coroa de Ferro se partiu, e cada fragmento prendeu-se à alma de um herói ou monstro de uma das terras do reino. Os Cinco Deuses despertaram e fizeram um decreto: quem reunir as Almas no Coliseu de Valcoroa governará Orvalon. Desde então, Invocadores aprisionam essas almas em Selos — as cartas — e duelam por elas.',
    'Orvalon was one kingdom while Aldren, the Last King, lived. On the night he died without heirs, the Iron Crown shattered, and every shard bound itself to the soul of a hero or monster from one of the kingdom’s lands. The Five Gods awoke and made a decree: whoever gathers the Souls in the Coliseum of Valcrown shall rule Orvalon. Since then, Summoners have bound those souls into Seals — the cards — and duel for them.'
  );

  // ---------- helpers de definição ----------
  const CARDS = G.CARDS = {};
  const ORDER = G.CARD_ORDER = [];
  const costMap = { I: 'ign', S: 'sac', O: 'occ', E: 'ene', N: 'neu' };
  const parseCost = (s) => s.split('').map((c) => costMap[c]);
  function add(c) { CARDS[c.id] = c; ORDER.push(c.id); return c; }
  function A(pt, en, cost, dmg, fx, extra) {
    return Object.assign({ name: L(pt, en), cost: parseCost(cost), dmg: dmg, fx: fx || [] }, extra || {});
  }
  function cr(id, o) {
    add({
      id, kind: 'creature', art: id, aff: o.aff, race: o.race, hp: Math.round(o.hp * G.HP_SCALE / 10) * 10, ret: o.ret, region: o.reg, rarity: o.rar,
      stage: o.from ? 1 : 0, from: o.from || null, legend: !!o.legend, tags: o.tags || [], res: o.res || null,
      name: L(o.n[0], o.n[1]), sub: L(o.s[0], o.s[1]), ab: o.ab || null, attacks: o.atk, flavor: o.fl ? L(o.fl[0], o.fl[1]) : null
    });
  }
  G.HP_SCALE = 1.35; // vida de todas as criaturas (+35%) para reduzir derrotas em um golpe
  const ab = (pt, en, k, p) => Object.assign({ name: L(pt, en), k }, p || {});

  // ======================= CRIATURAS =======================
  // ---- ÍGNEA ----
  cr('h1_01', { aff: 'ign', race: 'mon', hp: 90, ret: 2, reg: 'brasa', rar: 'U', n: ['Vorgul', 'Vorgul'], s: ['Filho da Fornalha', 'Son of the Furnace'],
    atk: [A('Garras de Magma', 'Magma Claws', 'I', 20), A('Erupção', 'Eruption', 'IIN', 70, [{ t: 'recoil', v: 10 }])],
    fl: ['Nasceu quando a primeira forja de Brasaforja rachou.', 'Born when the first forge of Emberforge cracked.'] });
  cr('h2_18', { aff: 'ign', race: 'mon', hp: 200, ret: 3, reg: 'brasa', rar: 'L', legend: true, from: 'h1_01', n: ['Vorgul Desacorrentado', 'Vorgul Unchained'], s: ['O Rei de Lava', 'The Lava King'],
    ab: ab('Pele de Magma', 'Magma Hide', 'thorns', { v: 20 }),
    atk: [A('Correntes Ígneas', 'Ember Chains', 'IN', 50, [{ t: 'cond', c: 'burn' }]), A('Cataclismo', 'Cataclysm', 'IINN', 150, [{ t: 'discardSelf', n: 2 }])],
    fl: ['As correntes que o prendiam agora são sua arma.', 'The chains that bound him are now his weapon.'] });
  cr('h1_14', { aff: 'ign', race: 'mon', hp: 70, ret: 1, reg: 'brasa', rar: 'C', tags: ['matilha'], n: ['Cinzal', 'Cinzal'], s: ['Cão do Portão Rubro', 'Hound of the Crimson Gate'],
    atk: [A('Mordida Ardente', 'Burning Bite', 'I', 10, [{ t: 'cond', c: 'burn', coin: true }]), A('Investida da Matilha', 'Pack Rush', 'IN', 30, [{ t: 'tag', tag: 'matilha', v: 20 }])],
    fl: ['Onde ele fareja, o chão começa a fumegar.', 'Where it sniffs, the ground begins to smoke.'] });
  cr('h1_23', { aff: 'ign', race: 'hero', hp: 100, ret: 2, reg: 'valc', rar: 'U', n: ['Brom Rachaferro', 'Brom Ironsplit'], s: ['O Martelo do Cerco', 'The Siege Hammer'],
    atk: [A('Esmagar', 'Crush', 'IN', 30), A('Cerco Final', 'Final Siege', 'IIN', 50, [{ t: 'vsDamaged', v: 40 }])],
    fl: ['Derrubou três muralhas de Valcoroa antes do café.', 'Brought down three walls of Valcrown before breakfast.'] });
  cr('h2_03', { aff: 'ign', race: 'mon', hp: 80, ret: 1, reg: 'brasa', rar: 'R', tags: ['coro'], n: ['Rangar Cordafogo', 'Rangar Firestring'], s: ['O Guitarrista Profano', 'The Unholy Guitarist'],
    atk: [A('Riff Flamejante', 'Blazing Riff', 'IN', 30, [{ t: 'tag', tag: 'coro', v: 20 }]), A('Distorção Infernal', 'Infernal Distortion', 'IIN', 60, [{ t: 'cond', c: 'madness', coin: true }])],
    fl: ['Cada acorde abre uma rachadura no mundo.', 'Every chord opens a crack in the world.'] });
  cr('h2_08', { aff: 'ign', race: 'mon', hp: 90, ret: 2, reg: 'brasa', rar: 'U', tags: ['coro'], n: ['Tamborath', 'Tamborath'], s: ['O Ritmo do Abismo', 'The Rhythm of the Abyss'],
    ab: ab('Ritmo de Guerra', 'War Rhythm', 'drawA', { needTag: 'coro' }),
    atk: [A('Tambores de Guerra', 'War Drums', 'INN', 60)],
    fl: ['Seus tambores são feitos de crânios que ainda riem.', 'His drums are made of skulls that still laugh.'] });
  cr('h2_12', { aff: 'ign', race: 'hero', hp: 90, ret: 1, reg: 'brasa', rar: 'R', n: ['Kael Asa-de-Brasa', 'Kael Emberwing'], s: ['O Anjo Caído das Forjas', 'Fallen Angel of the Forges'],
    atk: [A('Lâmina Negra', 'Black Blade', 'I', 30, [{ t: 'recoil', v: 10 }]), A('Mergulho Flamejante', 'Blazing Dive', 'IIN', 90, [{ t: 'exhaust' }])],
    fl: ['Caiu do céu de Solênia e aprendeu a voar com fogo.', 'He fell from Solenne’s sky and learned to fly on fire.'] });
  cr('h2_17', { aff: 'ign', race: 'mon', hp: 100, ret: 2, reg: 'brasa', rar: 'U', n: ['Bispo Cinéreo', 'The Ashen Bishop'], s: ['Pregador das Cinzas', 'Preacher of Ashes'],
    atk: [A('Sermão Ardente', 'Searing Sermon', 'IN', 10, [{ t: 'cond', c: 'burn' }, { t: 'expose', v: 20 }]), A('Juízo de Cinzas', 'Judgment of Ash', 'IIN', 60, [{ t: 'vsCond', v: 40 }])],
    fl: ['Prega que tudo que existe é lenha.', 'He preaches that everything that exists is firewood.'] });
  cr('h2_20', { aff: 'ign', race: 'mon', hp: 210, ret: 3, reg: 'brasa', rar: 'L', legend: true, n: ['Pyrrhax', 'Pyrrhax'], s: ['O Dragão Bicéfalo', 'The Two-Headed Dragon'],
    atk: [A('Sopro Duplo', 'Twin Breath', 'IN', 40, [{ t: 'benchHit', v: 20 }]), A('Inferno Bicéfalo', 'Two-Headed Inferno', 'IINN', 150, [{ t: 'discardSelf', n: 2, aff: 'ign' }])],
    fl: ['Uma cabeça odeia; a outra lembra por quê.', 'One head hates; the other remembers why.'] });
  cr('h3_20', { aff: 'ign', race: 'hero', hp: 90, ret: 2, reg: 'brasa', rar: 'U', n: ['Thessa Bigorna', 'Thessa Anvil'], s: ['A Ferreira de Brasaforja', 'Smith of Emberforge'],
    ab: ab('Forja Viva', 'Living Forge', 'accelA', { aff: 'ign' }),
    atk: [A('Martelada', 'Hammer Blow', 'INN', 50)],
    fl: ['Ela não forja armas. Forja vontades.', 'She does not forge weapons. She forges resolve.'] });
  cr('h3_16', { aff: 'ign', race: 'mon', hp: 130, ret: 3, reg: 'valc', rar: 'C', n: ['Grukk Cravejado', 'Grukk the Studded'], s: ['O Ogro das Correntes', 'The Chain Ogre'],
    atk: [A('Pancada', 'Wallop', 'INN', 50), A('Fúria Cravejada', 'Studded Fury', 'IINN', 80, [{ t: 'perDmg', v: 10 }])],
    fl: ['Quanto mais apanha, mais ri.', 'The more he is hit, the more he laughs.'] });
  cr('h3_05', { aff: 'ign', race: 'hero', hp: 100, ret: 2, reg: 'valc', rar: 'C', n: ['Morra Grilhão', 'Morra Shackle'], s: ['Gladiadora de Valcoroa', 'Gladiator of Valcrown'],
    ab: ab('Escudo de Arena', 'Arena Shield', 'dr', { v: 10 }),
    atk: [A('Mangual', 'Flail', 'IN', 30, [{ t: 'coinPlus', v: 30 }])],
    fl: ['Cem lutas no Coliseu. Nenhuma desistência.', 'A hundred bouts in the Coliseum. Not one surrender.'] });
  cr('h3_06', { aff: 'ign', race: 'hero', hp: 70, ret: 1, reg: 'valc', rar: 'R', tags: ['arqueira'], n: ['Nyssa Telhanegra', 'Nyssa Blackroof'], s: ['A Caçadora e seu Draco', 'The Huntress and her Drake'],
    atk: [A('Flecha Certeira', 'True Arrow', 'I', 20, [], { snipe: true }), A('Sopro do Draco', 'Drake Breath', 'INN', 60, [{ t: 'cond', c: 'burn', coin: true }])],
    fl: ['Caça sobre os telhados; o draco cuida do resto.', 'She hunts over rooftops; the drake handles the rest.'] });

  // ---- SAGRADA ----
  cr('h3_11', { aff: 'sac', race: 'hero', hp: 90, ret: 2, reg: 'solen', rar: 'C', n: ['Sir Aldric Varenne', 'Sir Aldric Varenne'], s: ['O Juramentado de Solênia', 'The Sworn of Solenne'],
    atk: [A('Golpe Juramentado', 'Sworn Strike', 'SN', 30), A('Lâmina da Fé', 'Blade of Faith', 'SSN', 70)],
    fl: ['Jurou proteger a cidade até que o último vitral caia.', 'He swore to guard the city until the last window falls.'] });
  cr('h1_02', { aff: 'sac', race: 'hero', hp: 140, ret: 2, reg: 'solen', rar: 'R', from: 'h3_11', tags: ['vitral'], n: ['Aldric, o Vitral Vivo', 'Aldric, the Living Glass'], s: ['Paladino Ascendido', 'Ascended Paladin'],
    ab: ab('Égide de Vitral', 'Glass Aegis', 'benchWard'),
    atk: [A('Investida Sagrada', 'Holy Charge', 'SNN', 70, [{ t: 'guard', v: 20 }]), A('Julgamento', 'Judgment', 'SSNN', 110)],
    fl: ['Atravessou o vitral da catedral e saiu feito de luz.', 'He passed through the cathedral window and came out made of light.'] });
  cr('h3_03', { aff: 'sac', race: 'hero', hp: 70, ret: 1, reg: 'solen', rar: 'C', n: ['Irmã Selene', 'Sister Selene'], s: ['A Portadora do Incensário', 'Bearer of the Censer'],
    ab: ab('Incenso Bento', 'Blessed Incense', 'healA', { v: 10 }),
    atk: [A('Fumaça Sagrada', 'Holy Smoke', 'SN', 10, [{ t: 'weaken', v: 20 }])],
    fl: ['Onde a fumaça passa, as feridas esquecem de doer.', 'Where the smoke drifts, wounds forget to ache.'] });
  cr('h2_06', { aff: 'sac', race: 'hero', hp: 120, ret: 1, reg: 'solen', rar: 'R', from: 'h3_03', n: ['Madre Selene', 'Mother Selene'], s: ['A Freira Alada', 'The Winged Nun'],
    ab: ab('Bênção Alada', 'Winged Blessing', 'healA', { v: 20 }),
    atk: [A('Vendaval Esmeralda', 'Emerald Gale', 'SNN', 60, [{ t: 'healTeam', v: 10 }])],
    fl: ['Suas preces ganharam asas.', 'Her prayers grew wings.'] });
  cr('h2_02', { aff: 'sac', race: 'hero', hp: 100, ret: 1, reg: 'solen', rar: 'U', n: ['Seraphel', 'Seraphel'], s: ['A Lança da Aurora', 'Spear of the Dawn'],
    atk: [A('Lança Divina', 'Divine Spear', 'SN', 30, [{ t: 'vsRace', race: 'mon', v: 20 }]), A('Queda Celeste', 'Heavenfall', 'SSN', 60, [{ t: 'coinPlus', v: 30 }])],
    fl: ['Desce dos céus apenas quando um monstro ergue a cabeça.', 'She descends only when a monster raises its head.'] });
  cr('h2_07', { aff: 'sac', race: 'mon', hp: 130, ret: 3, reg: 'solen', rar: 'U', tags: ['vitral'], n: ['Colosso de Vitral', 'Stained-Glass Colossus'], s: ['O Guardião da Nave', 'Guardian of the Nave'],
    ab: ab('Vidro Consagrado', 'Consecrated Glass', 'dr', { v: 10 }),
    atk: [A('Punho Prismático', 'Prismatic Fist', 'SNN', 50), A('Estilhaço', 'Shatter', 'SSNN', 100, [{ t: 'recoil', v: 20 }])],
    fl: ['Mil santos coloridos compõem seu corpo.', 'A thousand colored saints make up its body.'] });
  cr('h2_13', { aff: 'sac', race: 'mon', hp: 80, ret: 1, reg: 'solen', rar: 'R', n: ['Querubim das Mil Mãos', 'Cherub of a Thousand Hands'], s: ['O Abraço Celeste', 'The Heavenly Embrace'],
    atk: [A('Abraço Sufocante', 'Smothering Hug', 'SN', 20, [{ t: 'cond', c: 'stun', coin: true }]), A('Mãos da Contrição', 'Hands of Contrition', 'SSN', 20, [{ t: 'perBench', who: 'opp', v: 20 }])],
    fl: ['Seu amor é sincero. E esmagador.', 'Its love is sincere. And crushing.'] });
  cr('h2_15', { aff: 'sac', race: 'hero', hp: 120, ret: 2, reg: 'valc', rar: 'E', n: ['Dorian Martelo-Áureo', 'Dorian Goldhammer'], s: ['O Campeão do Coliseu', 'Champion of the Coliseum'],
    ab: ab('Glória Inabalável', 'Unshaken Glory', 'condImmune'),
    atk: [A('Martelo da Arena', 'Arena Hammer', 'SNN', 60), A('Golpe do Campeão', 'Champion’s Blow', 'SSNN', 100)],
    fl: ['A multidão grita seu nome antes de ele entrar.', 'The crowd chants his name before he enters.'] });
  cr('h3_14', { aff: 'sac', race: 'mon', hp: 190, ret: 2, reg: 'solen', rar: 'L', legend: true, tags: ['vitral'], n: ['Auryel', 'Auryel'], s: ['O Serafim de Vitral', 'The Stained-Glass Seraph'],
    ab: ab('Luz Restauradora', 'Restoring Light', 'regenTeam', { v: 10 }),
    atk: [A('Raio Prismático', 'Prismatic Ray', 'SN', 50), A('Redenção', 'Redemption', 'SSNN', 140, [{ t: 'healSelf', v: 20 }])],
    fl: ['Quando abre as asas, até as sombras ganham cor.', 'When it spreads its wings, even shadows gain color.'] });
  cr('h3_17', { aff: 'sac', race: 'hero', hp: 80, ret: 1, reg: 'solen', rar: 'C', n: ['Irmãs da Fonte Clara', 'Sisters of the Clear Spring'], s: ['As Curandeiras de Solênia', 'Healers of Solenne'],
    atk: [A('Bênção da Fonte', 'Spring Blessing', 'S', 0, [{ t: 'healTeam', v: 10 }]), A('Aspersão', 'Aspersion', 'SN', 30)],
    fl: ['A água da fonte lembra quem você era antes da ferida.', 'The spring water remembers who you were before the wound.'] });
  cr('h1_17', { aff: 'sac', race: 'mon', hp: 110, ret: 2, reg: 'sahr', rar: 'U', n: ['Sahrakhet', 'Sahrakhet'], s: ['A Esfinge dos Enigmas', 'Sphinx of Riddles'],
    ab: ab('Último Enigma', 'Final Riddle', 'koDraw', { n: 2 }),
    atk: [A('Charada', 'Riddle', 'S', 10, [{ t: 'handDisrupt', coin: true }]), A('Garras Áureas', 'Golden Claws', 'SNN', 60)],
    fl: ['Responda certo e passe. Responda errado e fique — para sempre.', 'Answer right and pass. Answer wrong and stay — forever.'] });
  cr('h2_01', { aff: 'sac', race: 'mon', hp: 110, ret: 2, reg: 'solen', rar: 'E', n: ['Pontífice Velmar', 'Pontiff Velmar'], s: ['O Último Concílio', 'The Last Council'],
    ab: ab('Concílio Prismático', 'Prismatic Council', 'accelA', { aff: 'sac' }),
    atk: [A('Raio de Vitral', 'Glass Ray', 'SSN', 70, [{ t: 'cond', c: 'madness', coin: true }])],
    fl: ['Morreu durante a missa e não percebeu.', 'He died during mass and did not notice.'] });

  // ---- OCULTA ----
  cr('h1_03', { aff: 'occ', race: 'mon', hp: 90, ret: 1, reg: 'umbra', rar: 'C', n: ['Morthis', 'Morthis'], s: ['A Lich do Cemitério Verde', 'Lich of the Green Graveyard'],
    atk: [A('Toque Pútrido', 'Putrid Touch', 'O', 20, [{ t: 'cond', c: 'poison' }]), A('Lamento Fúnebre', 'Funeral Lament', 'ON', 30, [{ t: 'weaken', v: 20 }])],
    fl: ['Seu sussurro faz as lápides suarem.', 'Her whisper makes tombstones sweat.'] });
  cr('h2_19', { aff: 'occ', race: 'mon', hp: 130, ret: 1, reg: 'umbra', rar: 'R', from: 'h1_03', n: ['Morthis, Rainha dos Crânios', 'Morthis, Queen of Skulls'], s: ['A Feiticeira Ascendida', 'The Ascended Sorceress'],
    ab: ab('Coro de Crânios', 'Choir of Skulls', 'condA', { c: 'poison' }),
    atk: [A('Tempestade de Crânios', 'Skull Storm', 'OON', 70, [{ t: 'vsCond', v: 40 }])],
    fl: ['Cada crânio que gira ao seu redor já foi um Invocador.', 'Every skull circling her was once a Summoner.'] });
  cr('h3_04', { aff: 'occ', race: 'mon', hp: 80, ret: 1, reg: 'umbra', rar: 'C', n: ['Vyl', 'Vyl'], s: ['A Tecelã das Lápides', 'Weaver of Tombstones'],
    atk: [A('Teia', 'Web', 'O', 20, [{ t: 'seal' }]), A('Picada', 'Sting', 'ON', 30, [{ t: 'cond', c: 'poison' }])],
    fl: ['Tece mortalhas sob a lua.', 'She weaves shrouds beneath the moon.'] });
  cr('h1_12', { aff: 'occ', race: 'mon', hp: 120, ret: 2, reg: 'umbra', rar: 'R', from: 'h3_04', n: ['Vyl, Mãe da Teia', 'Vyl, Mother of Webs'], s: ['A Rainha das Cavernas', 'Queen of the Caverns'],
    atk: [A('Teia Venenosa', 'Venom Web', 'ON', 40, [{ t: 'cond', c: 'poison' }, { t: 'seal' }]), A('Banquete', 'Feast', 'OON', 70, [{ t: 'vsCond', v: 30 }, { t: 'healSelf', v: 20 }])],
    fl: ['Suas teias brilham para atrair os curiosos.', 'Her webs glow to lure the curious.'] });
  cr('h3_24', { aff: 'occ', race: 'mon', hp: 110, ret: 2, reg: 'umbra', rar: 'C', n: ['Armadura Vazia', 'Empty Armor'], s: ['O Guardião Sem Rosto', 'The Faceless Guardian'],
    ab: ab('Aço Oco', 'Hollow Steel', 'dr', { v: 10 }),
    atk: [A('Maça Fantasma', 'Phantom Mace', 'ONN', 60)],
    fl: ['Ninguém está dentro. Mesmo assim, ela luta.', 'No one is inside. It fights anyway.'] });
  cr('h2_05', { aff: 'occ', race: 'mon', hp: 140, ret: 2, reg: 'umbra', rar: 'R', from: 'h3_24', n: ['Cavaleiro Sem Rosto', 'The Faceless Rider'], s: ['O Cavaleiro do Cemitério', 'Rider of the Graveyard'],
    ab: ab('Aço Oco', 'Hollow Steel', 'dr', { v: 10 }),
    atk: [A('Carga Espectral', 'Spectral Charge', 'ON', 40), A('Galope da Morte', 'Death Gallop', 'OONN', 120)],
    fl: ['Encontrou um cavalo tão morto quanto ele.', 'It found a horse as dead as itself.'] });
  cr('h1_25', { aff: 'occ', race: 'hero', hp: 90, ret: 2, reg: 'valc', rar: 'U', n: ['Vargas Mil-Lâminas', 'Vargas Thousand-Blades'], s: ['Senhor do Campo das Espadas', 'Lord of the Sword Field'],
    atk: [A('Corte Sombrio', 'Shadow Cut', 'ON', 50), A('Mil Lâminas', 'Thousand Blades', 'OON', 30, [{ t: 'coins', n: 3, v: 20 }])],
    fl: ['Cada espada fincada é um rival que ele enterrou.', 'Every blade in the ground is a rival he buried.'] });
  cr('h2_10', { aff: 'occ', race: 'hero', hp: 140, ret: 2, reg: 'valc', rar: 'E', from: 'h1_25', n: ['Vargas, a Lâmina Rubra', 'Vargas, the Crimson Blade'], s: ['O Juramento Quebrado', 'The Broken Oath'],
    ab: ab('Vingança Rubra', 'Crimson Vengeance', 'curse', { v: 40 }),
    atk: [A('Lâmina Sanguinária', 'Bloodthirsty Blade', 'ONN', 60, [{ t: 'healSelf', v: 20 }]), A('Execução', 'Execution', 'OONN', 100, [{ t: 'vsDamaged', v: 40 }])],
    fl: ['Sua espada aprendeu a gostar do gosto.', 'His sword learned to like the taste.'] });
  cr('h1_13', { aff: 'occ', race: 'mon', hp: 120, ret: 2, reg: 'umbra', rar: 'E', n: ['Príncipe Malakor', 'Prince Malakor'], s: ['Senhor do Castelo Negro', 'Lord of the Black Castle'],
    ab: ab('Decreto Sombrio', 'Dark Decree', 'affBoost', { aff: 'occ', v: 10 }),
    atk: [A('Asas da Noite', 'Wings of Night', 'OON', 80, [{ t: 'switchSelf' }])],
    fl: ['Herdeiro de um trono que ninguém mais ousa reclamar.', 'Heir to a throne no one else dares to claim.'] });
  cr('h1_15', { aff: 'occ', race: 'mon', hp: 100, ret: 1, reg: 'umbra', rar: 'R', n: ['Conde Valerian Noctis', 'Count Valerian Noctis'], s: ['O Anfitrião Eterno', 'The Eternal Host'],
    atk: [A('Mordida', 'Bite', 'ON', 40, [{ t: 'healSelf', v: 20 }]), A('Banquete Carmesim', 'Crimson Banquet', 'OON', 70, [{ t: 'healSelf', v: 30 }])],
    fl: ['Seus banquetes duram séculos. Os convidados, não.', 'His banquets last centuries. The guests do not.'] });
  cr('h1_11', { aff: 'occ', race: 'mon', hp: 110, ret: 2, reg: 'sahr', rar: 'C', n: ['Kha-Neferet', 'Kha-Neferet'], s: ['A Múmia Desperta', 'The Awakened Mummy'],
    atk: [A('Bandagens', 'Bandages', 'O', 20, [{ t: 'seal' }]), A('Maldição do Sarcófago', 'Sarcophagus Curse', 'ONN', 60, [{ t: 'cond', c: 'madness' }])],
    fl: ['Três mil anos dormindo e acordou com fome.', 'Three thousand years asleep, and woke up hungry.'] });
  cr('h2_11', { aff: 'occ', race: 'mon', hp: 200, ret: 3, reg: 'umbra', rar: 'L', legend: true, n: ['Azhur', 'Azhur'], s: ['O Rei dos Cultos Acorrentado', 'The Chained King of Cults'],
    ab: ab('Correntes da Devoção', 'Chains of Devotion', 'dr', { v: 20 }),
    atk: [A('Correntes do Culto', 'Cult Chains', 'ON', 50, [{ t: 'seal' }]), A('Oferenda Final', 'Final Offering', 'OONN', 130, [{ t: 'perBench', who: 'self', v: 10 }])],
    fl: ['Seus fiéis o acorrentaram para que ele nunca os deixasse.', 'His faithful chained him so he could never leave them.'] });
  cr('h2_16', { aff: 'occ', race: 'mon', hp: 90, ret: 1, reg: 'umbra', rar: 'U', n: ['Legião do Túmulo', 'Legion of the Tomb'], s: ['Os Gritos Sepultados', 'The Buried Screams'],
    ab: ab('Último Grito', 'Final Scream', 'curse', { v: 30 }),
    atk: [A('Gritos Sepultados', 'Buried Screams', 'ON', 30, [{ t: 'benchHit', v: 10, all: true }])],
    fl: ['Quando um cai, os outros gritam mais alto.', 'When one falls, the others scream louder.'] });
  cr('h3_19', { aff: 'occ', race: 'mon', hp: 80, ret: 0, reg: 'umbra', rar: 'C', n: ['Enxame de Sombras', 'Shadow Swarm'], s: ['Os Que Atravessam Portões', 'Those Who Pass Through Gates'],
    atk: [A('Sussurro', 'Whisper', 'O', 20, [{ t: 'handDisrupt', coin: true }]), A('Enxamear', 'Swarm', 'ON', 50)],
    fl: ['Grades não os detêm. Luz, às vezes.', 'Bars do not stop them. Light, sometimes.'] });
  cr('h3_12', { aff: 'occ', race: 'hero', hp: 80, ret: 1, reg: 'umbra', rar: 'U', n: ['Doutor Corvus Peste', 'Doctor Corvus Plague'], s: ['O Médico da Praga', 'The Plague Doctor'],
    atk: [A('Arpão Pestilento', 'Pestilent Harpoon', 'ON', 30, [{ t: 'cond', c: 'poison' }]), A('Quarentena', 'Quarantine', 'OON', 50, [{ t: 'vsCond', v: 40 }])],
    fl: ['A cura que ele oferece é rápida. Sempre.', 'The cure he offers is quick. Always.'] });
  cr('h3_08', { aff: 'occ', race: 'hero', hp: 80, ret: 0, reg: 'valc', rar: 'U', n: ['Zahra Véu-Negro', 'Zahra Blackveil'], s: ['A Ladra das Catacumbas', 'Thief of the Catacombs'],
    atk: [A('Punhaladas', 'Stabs', 'O', 10, [{ t: 'coins', n: 2, v: 20 }]), A('Furtar', 'Pilfer', 'ON', 20, [{ t: 'stripOpp', coin: true }])],
    fl: ['Rouba dos mortos. Eles nunca reclamam.', 'She steals from the dead. They never complain.'] });

  // ---- ENERGÉTICA ----
  cr('h1_05', { aff: 'ene', race: 'mon', hp: 120, ret: 3, reg: 'vort', rar: 'U', n: ['Glacius', 'Glacius'], s: ['O Colosso dos Picos Gelados', 'Colossus of the Frozen Peaks'],
    atk: [A('Avalanche', 'Avalanche', 'ENN', 40, [{ t: 'cond', c: 'stun', coin: true }]), A('Era Glacial', 'Ice Age', 'EENN', 100, [{ t: 'exhaust' }])],
    fl: ['O raio que o atingiu congelou no meio do caminho.', 'The lightning that struck him froze halfway.'] });
  cr('h1_07', { aff: 'ene', race: 'mon', hp: 80, ret: 2, reg: 'vort', rar: 'C', n: ['Autômato K-7', 'Automaton K-7'], s: ['Protótipo de Vórtica', 'Vortica Prototype'],
    atk: [A('Vapor', 'Steam', 'E', 20), A('Pistão', 'Piston', 'ENN', 50)],
    fl: ['Primeiro sucesso da Academia. O sexto, na verdade.', 'The Academy’s first success. The sixth, actually.'] });
  cr('h1_16', { aff: 'ene', race: 'mon', hp: 150, ret: 3, reg: 'vort', rar: 'R', from: 'h1_07', n: ['Titã K-7 Bastião', 'Titan K-7 Bastion'], s: ['A Máquina de Guerra', 'The War Machine'],
    ab: ab('Blindagem', 'Plating', 'dr', { v: 10 }),
    atk: [A('Esmagar', 'Crush', 'EN', 40), A('Canhão de Arco', 'Arc Cannon', 'EEN', 90, [{ t: 'discardSelf', n: 1, aff: 'ene' }])],
    fl: ['A Academia parou de contar as versões.', 'The Academy stopped counting versions.'] });
  cr('h1_08', { aff: 'ene', race: 'mon', hp: 90, ret: 2, reg: 'vort', rar: 'U', n: ['Ondra', 'Ondra'], s: ['A Serpente das Marés Partidas', 'Serpent of the Broken Tides'],
    atk: [A('Maremoto', 'Tidal Surge', 'EN', 10, [{ t: 'benchHit', v: 10, all: true }]), A('Constrição', 'Constrict', 'EEN', 50, [{ t: 'seal' }])],
    fl: ['Os pescadores da Costa Partida rezam para ela não ter fome.', 'Shattered Coast fishers pray she is not hungry.'] });
  cr('h2_09', { aff: 'ene', race: 'mon', hp: 200, ret: 3, reg: 'vort', rar: 'L', legend: true, from: 'h1_08', n: ['Ondra, Leviatã Acorrentado', 'Ondra, the Chained Leviathan'], s: ['A Tempestade Viva', 'The Living Storm'],
    atk: [A('Raio das Correntes', 'Chain Lightning', 'EN', 40, [{ t: 'cond', c: 'stun', coin: true }]), A('Dilúvio Elétrico', 'Electric Deluge', 'EENN', 150, [{ t: 'benchHit', v: 10, all: true }])],
    fl: ['Tentaram acorrentá-la ao céu. O céu perdeu.', 'They tried to chain her to the sky. The sky lost.'] });
  cr('h1_19', { aff: 'ene', race: 'hero', hp: 80, ret: 1, reg: 'vort', rar: 'C', n: ['Maré’Lys', 'Mare’Lys'], s: ['A Lanceira do Abismo Azul', 'Lancer of the Blue Abyss'],
    atk: [A('Lança Marinha', 'Sea Spear', 'E', 20), A('Redemoinho', 'Whirlpool', 'EN', 30, [{ t: 'switchSelf' }])],
    fl: ['Guarda as ruínas submersas da antiga capital.', 'She guards the sunken ruins of the old capital.'] });
  cr('h1_22', { aff: 'ene', race: 'mon', hp: 90, ret: 2, reg: 'vort', rar: 'E', n: ['Draconis Arcanum', 'Draconis Arcanum'], s: ['O Arquimago Escamado', 'The Scaled Archmage'],
    ab: ab('Grimório Vivo', 'Living Grimoire', 'drawA'),
    atk: [A('Selo Arcano', 'Arcane Seal', 'E', 10, [{ t: 'expose', v: 20 }]), A('Runa Fulminante', 'Thundering Rune', 'EEN', 30, [{ t: 'perCharge', who: 'self', v: 10 }])],
    fl: ['Leu todos os livros da Academia. Duas vezes.', 'He read every book in the Academy. Twice.'] });
  cr('h1_24', { aff: 'ene', race: 'mon', hp: 80, ret: 1, reg: 'vort', rar: 'C', tags: ['coro'], n: ['Gárgula Tempestuosa', 'Tempest Gargoyle'], s: ['A Vigia das Torres', 'Watcher of the Towers'],
    atk: [A('Raio Pétreo', 'Stone Bolt', 'E', 10, [{ t: 'cond', c: 'stun', coin: true }]), A('Mergulho', 'Dive', 'ENN', 40)],
    fl: ['Desce das torres a cada trovão.', 'It descends from the towers at every thunderclap.'] });
  cr('h2_04', { aff: 'ene', race: 'mon', hp: 120, ret: 1, reg: 'vort', rar: 'R', from: 'h1_24', tags: ['coro'], n: ['Gorgo, a Voz do Trovão', 'Gorgo, Voice of Thunder'], s: ['O Vocalista do Coro', 'Lead Voice of the Choir'],
    atk: [A('Grito Trovejante', 'Thunder Scream', 'EN', 40, [{ t: 'tag', tag: 'coro', v: 20 }]), A('Réquiem da Tempestade', 'Storm Requiem', 'EEN', 70, [{ t: 'benchHit', v: 20 }])],
    fl: ['Seu primeiro grito derrubou o sino da catedral.', 'His first scream toppled the cathedral bell.'] });
  cr('h3_01', { aff: 'ene', race: 'hero', hp: 70, ret: 1, reg: 'vort', rar: 'R', n: ['Lyra Vossker', 'Lyra Vossker'], s: ['A Violinista da Tempestade', 'The Storm Violinist'],
    atk: [A('Ária Elétrica', 'Electric Aria', 'E', 20, [], { snipe: true }), A('Crescendo', 'Crescendo', 'EEN', 50, [{ t: 'cond', c: 'trance', coin: true }])],
    fl: ['Afina o violino pelo som dos raios.', 'She tunes her violin by the sound of lightning.'] });
  cr('h3_02', { aff: 'ene', race: 'mon', hp: 120, ret: 3, reg: 'vort', rar: 'U', n: ['Ferrumbra', 'Ferrumbra'], s: ['A Artilharia de Vórtica', 'Vortica Artillery'],
    atk: [A('Bombardeio', 'Bombard', 'ENN', 40, [{ t: 'benchHit', v: 20 }]), A('Salva Total', 'Full Salvo', 'EENN', 100, [{ t: 'exhaust' }])],
    fl: ['Calibrado para acertar uma moeda a três léguas.', 'Calibrated to hit a coin three leagues away.'] });
  cr('h3_09', { aff: 'ene', race: 'hero', hp: 120, ret: 2, reg: 'vort', rar: 'C', n: ['Hargrim Âncora', 'Hargrim Anchor'], s: ['O Guardião do Porto', 'Warden of the Harbor'],
    ab: ab('Correntes do Porto', 'Harbor Chains', 'thorns', { v: 10 }),
    atk: [A('Âncora Girante', 'Spinning Anchor', 'ENN', 50, [{ t: 'seal' }])],
    fl: ['Nenhum navio sai do porto sem a permissão dele.', 'No ship leaves port without his leave.'] });
  cr('h3_22', { aff: 'ene', race: 'mon', hp: 50, ret: 0, reg: 'vort', rar: 'C', n: ['Olho-Sentinela V-9', 'Sentinel Eye V-9'], s: ['O Drone de Vigilância', 'Surveillance Drone'],
    ab: ab('Varredura', 'Scan', 'enterDraw', { n: 1 }),
    atk: [A('Laser Focal', 'Focal Laser', 'E', 10, [{ t: 'coinPlus', v: 20 }])],
    fl: ['Vê tudo. Relata tudo. Não esquece nada.', 'Sees everything. Reports everything. Forgets nothing.'] });
  cr('h1_20', { aff: 'ene', race: 'hero', hp: 70, ret: 1, reg: 'valc', rar: 'U', n: ['Pip Tecelúmen', 'Pip Lightweaver'], s: ['O Bufão das Esferas', 'The Jester of Orbs'],
    atk: [A('Esferas Hipnóticas', 'Hypnotic Orbs', 'E', 10, [{ t: 'weaken', v: 20 }]), A('Truque Final', 'Final Trick', 'EN', 30, [{ t: 'cond', c: 'madness' }])],
    fl: ['Fazia o rei rir. Agora faz Invocadores chorarem.', 'He made the king laugh. Now he makes Summoners weep.'] });
  cr('h1_06', { aff: 'ene', race: 'hero', hp: 60, ret: 0, reg: 'valc', rar: 'U', n: ['Kurogane Sem-Lua', 'Kurogane Moonless'], s: ['A Sombra das Torres', 'Shadow of the Towers'],
    ab: ab('Passo das Sombras', 'Shadow Step', 'swapA'),
    atk: [A('Shuriken Trovão', 'Thunder Shuriken', 'E', 20, [], { snipe: true }), A('Lâmina Relâmpago', 'Lightning Blade', 'EN', 30)],
    fl: ['Só é visto quando um raio cai.', 'Seen only when lightning strikes.'] });

  // ---- PRIMAL ----
  cr('h1_04', { aff: 'pri', race: 'mon', hp: 110, ret: 2, reg: 'sylv', rar: 'U', tags: ['matilha'], n: ['Rugor', 'Rugor'], s: ['A Fera da Ponte Velha', 'Beast of the Old Bridge'],
    atk: [A('Rugido', 'Roar', 'N', 20, [{ t: 'cond', c: 'stun', coin: true }]), A('Investida Bestial', 'Bestial Rush', 'NNN', 70, [{ t: 'tag', tag: 'matilha', v: 20 }])],
    fl: ['Cobra pedágio em carne.', 'He charges a toll in meat.'] });
  cr('h1_09', { aff: 'pri', race: 'mon', hp: 220, ret: 3, reg: 'sylv', rar: 'L', legend: true, n: ['Velho Musgoso', 'Old Mossback'], s: ['O Ancestral do Pântano', 'Ancient of the Marsh'],
    ab: ab('Raízes Profundas', 'Deep Roots', 'regen', { v: 20 }),
    atk: [A('Enraizar', 'Take Root', 'NN', 40, [{ t: 'seal' }]), A('Fúria da Floresta', 'Forest Fury', 'NNNN', 140, [{ t: 'healSelf', v: 30 }])],
    fl: ['Era árvore quando Orvalon ainda era só pântano.', 'It was a tree when Orvalon was still only marsh.'] });
  cr('h1_10', { aff: 'pri', race: 'mon', hp: 70, ret: 0, reg: 'sylv', rar: 'C', tags: ['matilha'], n: ['Zéfira', 'Zephira'], s: ['A Harpia dos Picos Gelados', 'Harpy of the Frozen Peaks'],
    atk: [A('Rasante', 'Swoop', 'N', 20), A('Garras do Vento', 'Wind Talons', 'NN', 40, [{ t: 'switchSelf' }])],
    fl: ['Caça com o vento a favor. Sempre.', 'She hunts with the wind at her back. Always.'] });
  cr('h1_21', { aff: 'pri', race: 'hero', hp: 100, ret: 1, reg: 'sylv', rar: 'U', n: ['Thalor Cascoforte', 'Thalor Stronghoof'], s: ['O Lanceiro Centauro', 'The Centaur Lancer'],
    atk: [A('Galope', 'Gallop', 'NN', 40), A('Lança Selvagem', 'Wild Lance', 'NNN', 60, [{ t: 'vsRace', race: 'mon', v: 30 }])],
    fl: ['Patrulha os bosques contra o que vem da noite.', 'He patrols the woods against what comes at night.'] });
  cr('h2_14', { aff: 'pri', race: 'hero', hp: 100, ret: 1, reg: 'sylv', rar: 'E', n: ['Mestre Sannavar', 'Master Sannavar'], s: ['O Monge dos Seis Braços', 'The Six-Armed Monk'],
    ab: ab('Fluxo Interior', 'Inner Flow', 'moveA'),
    atk: [A('Seis Golpes', 'Six Strikes', 'NNN', 20, [{ t: 'coins', n: 4, v: 10 }])],
    fl: ['Meditou tanto que o corpo pediu mais braços.', 'He meditated so long his body asked for more arms.'] });
  cr('h3_07', { aff: 'pri', race: 'mon', hp: 80, ret: 1, reg: 'sylv', rar: 'U', n: ['Trimáscara', 'Trimask'], s: ['O Espírito dos Três Rostos', 'Spirit of Three Faces'],
    atk: [A('Três Faces', 'Three Faces', 'NN', 20, [{ t: 'cond', c: 'madness' }]), A('Possessão', 'Possession', 'NNN', 60, [{ t: 'forceSwitch' }])],
    fl: ['Um rosto ri, um chora, o terceiro observa você.', 'One face laughs, one weeps, the third watches you.'] });
  cr('h3_13', { aff: 'pri', race: 'hero', hp: 80, ret: 1, reg: 'sylv', rar: 'C', tags: ['arqueira'], n: ['Kesra Duna-Rubra', 'Kesra Reddune'], s: ['A Besteira dos Cânions', 'Crossbow of the Canyons'],
    atk: [A('Disparo Distante', 'Far Shot', 'NN', 30, [], { snipe: true }), A('Rajada', 'Volley', 'NNN', 60)],
    fl: ['Acerta o que vê. Vê tudo.', 'She hits what she sees. She sees everything.'] });
  cr('h3_18', { aff: 'pri', race: 'hero', hp: 70, ret: 1, reg: 'sylv', rar: 'C', tags: ['arqueira'], n: ['Lirien Folhaverde', 'Lirien Greenleaf'], s: ['A Arqueira do Carvalho', 'Archer of the Oak'],
    atk: [A('Flecha', 'Arrow', 'N', 20), A('Chuva de Flechas', 'Arrow Rain', 'NNN', 40, [{ t: 'benchHit', v: 10, all: true }])],
    fl: ['Nasceu num galho e nunca quis descer.', 'Born on a branch, she never wanted to come down.'] });
  cr('h3_25', { aff: 'pri', race: 'hero', hp: 120, ret: 1, reg: 'sylv', rar: 'R', from: 'h3_18', tags: ['arqueira'], n: ['Lirien, Flecha da Tempestade', 'Lirien, Storm Arrow'], s: ['A Arqueira Ascendida', 'The Ascended Archer'],
    atk: [A('Flecha Relâmpago', 'Lightning Arrow', 'NN', 50, [], { snipe: true }), A('Tempestade de Flechas', 'Arrow Storm', 'NNNN', 100, [{ t: 'benchHit', v: 10, all: true }])],
    fl: ['Desceu do carvalho e encontrou o céu.', 'She came down from the oak and found the sky.'] });
  cr('h3_21', { aff: 'pri', race: 'hero', hp: 90, ret: 2, reg: 'sylv', rar: 'U', n: ['Ancião Tavyr', 'Elder Tavyr'], s: ['A Voz das Raízes', 'Voice of the Roots'],
    ab: ab('Cura das Raízes', 'Root Mending', 'healA', { v: 20 }),
    atk: [A('Canto dos Ancestrais', 'Chant of the Ancestors', 'N', 10, [{ t: 'weaken', v: 20 }]), A('Espíritos da Mata', 'Forest Spirits', 'NNN', 50, [{ t: 'healTeam', v: 10 }])],
    fl: ['Ouve o que as árvores contam às netas.', 'He hears what the trees tell their grandchildren.'] });
  cr('h3_15', { aff: 'pri', race: 'hero', hp: 60, ret: 0, reg: 'valc', rar: 'C', n: ['Isolde Corda-Leve', 'Isolde Lightrope'], s: ['A Escaladora de Torres', 'The Tower Climber'],
    ab: ab('Reconhecimento', 'Reconnaissance', 'enterSearch'),
    atk: [A('Golpe Rápido', 'Quick Strike', 'N', 20)],
    fl: ['Não existe torre alta demais. Só corda curta.', 'No tower is too tall. Only rope too short.'] });
  cr('h3_23', { aff: 'pri', race: 'hero', hp: 70, ret: 1, reg: 'valc', rar: 'C', n: ['Vexa das Adagas', 'Vexa of the Daggers'], s: ['A Arremessadora', 'The Knife Thrower'],
    atk: [A('Adagas Gêmeas', 'Twin Daggers', 'N', 10, [{ t: 'coinPlus', v: 20 }]), A('Arremesso Duplo', 'Double Throw', 'NN', 30, [{ t: 'benchHit', v: 10 }])],
    fl: ['Errou uma vez. O alvo agradeceu.', 'She missed once. The target thanked her.'] });
  cr('h1_18', { aff: 'pri', race: 'mon', hp: 110, ret: 2, reg: 'sylv', rar: 'C', n: ['Abominação do Pântano', 'Marsh Abomination'], s: ['O Fruto da Seiva Podre', 'Fruit of the Rotten Sap'],
    atk: [A('Seiva Ácida', 'Acid Sap', 'NN', 30, [{ t: 'cond', c: 'poison' }]), A('Explosão Tóxica', 'Toxic Burst', 'NNN', 70, [{ t: 'recoil', v: 20 }])],
    fl: ['A floresta também tem seus erros.', 'The forest has its mistakes too.'] });
  cr('h3_10', { aff: 'pri', race: 'hero', hp: 70, ret: 1, reg: 'sylv', rar: 'U', n: ['Mirela Raizeira', 'Mirela Rootwise'], s: ['A Herbalista de Sylvanor', 'Herbalist of Sylvanor'],
    ab: ab('Colheita', 'Harvest', 'searchA'),
    atk: [A('Poção Corrosiva', 'Corrosive Potion', 'NN', 30, [{ t: 'expose', v: 20 }])],
    fl: ['Sabe o nome de cada erva — e o que cada uma mata.', 'She knows every herb by name — and what each one kills.'] });


  // ======================= SET 4 — 25 heróis (5 por afinidade, mesmo molde de equilíbrio) =======================
  // ---- Ígnea ----
  cr('h4_16', { aff: 'ign', race: 'hero', hp: 70, ret: 1, reg: 'brasa', rar: 'C', n: ['Rixa Brasaviva', 'Rixa Embervein'], s: ['A Arruaceira das Correntes', 'The Chain Brawler'],
    atk: [A('Corrente Ardente', 'Burning Chain', 'I', 20), A('Rodopio Flamejante', 'Blazing Whirl', 'IN', 40)],
    fl: ['Aprendeu a lutar nas tavernas de Brasaforja. Nunca perdeu uma briga — nem uma corrente.', 'She learned to fight in Emberforge taverns. Never lost a brawl — or a chain.'] });
  cr('h4_07', { aff: 'ign', race: 'hero', hp: 100, ret: 2, reg: 'brasa', rar: 'C', n: ['Sir Calder Lançarrubra', 'Sir Calder Redlance'], s: ['O Cavaleiro da Lança Ardente', 'Knight of the Burning Lance'],
    atk: [A('Estocada', 'Thrust', 'IN', 30), A('Lança de Magma', 'Magma Lance', 'IIN', 70)],
    fl: ['Sua lança foi temperada na boca de um vulcão.', 'His lance was tempered in a volcano’s mouth.'] });
  cr('h4_14', { aff: 'ign', race: 'hero', hp: 80, ret: 1, reg: 'valc', rar: 'U', n: ['Zahirah das Mil Lâminas', 'Zahirah of a Thousand Blades'], s: ['A Feiticeira do Redemoinho', 'Sorceress of the Whirlwind'],
    ab: ab('Forja de Lâminas', 'Blade Forge', 'searchA'),
    atk: [A('Véu de Lâminas', 'Veil of Blades', 'IN', 20, [{ t: 'weaken', v: 20 }])],
    fl: ['Cada lâmina que gira ao seu redor tem o nome de um inimigo.', 'Every blade spinning around her bears an enemy’s name.'] });
  cr('h4_10', { aff: 'ign', race: 'hero', hp: 90, ret: 1, reg: 'brasa', rar: 'U', n: ['Vesk Fumarola', 'Vesk Fumarole'], s: ['O Ladrão das Chaminés', 'Thief of the Chimneys'],
    atk: [A('Dardo em Brasa', 'Ember Dart', 'IN', 20, [{ t: 'cond', c: 'burn' }]), A('Corrente de Fumaça', 'Smoke Chain', 'IIN', 50, [{ t: 'vsCond', v: 30 }])],
    fl: ['Entra pelas chaminés. Sai pelas chamas.', 'He comes in through chimneys. Leaves through flames.'] });
  cr('h4_02', { aff: 'ign', race: 'mon', hp: 120, ret: 3, reg: 'brasa', rar: 'R', n: ['Ferrocolosso', 'Ironcolossus'], s: ['O Guardião da Fornalha', 'Warden of the Furnace'],
    atk: [A('Punho de Bigorna', 'Anvil Fist', 'INN', 50), A('Desabamento', 'Collapse', 'IINN', 100, [{ t: 'recoil', v: 20 }])],
    fl: ['Forjado para proteger as forjas — de tudo, inclusive de seus ferreiros.', 'Forged to protect the forges — from everything, its smiths included.'] });
  // ---- Sagrada ----
  cr('h4_05', { aff: 'sac', race: 'hero', hp: 70, ret: 1, reg: 'solen', rar: 'C', n: ['Irmão Caius', 'Brother Caius'], s: ['O Monge Vendado', 'The Blindfolded Monk'],
    atk: [A('Corrente Sagrada', 'Holy Chain', 'S', 20), A('Juízo Cego', 'Blind Judgment', 'SN', 40)],
    fl: ['Vendou os olhos para não julgar pela aparência.', 'He blindfolded himself so as not to judge by appearances.'] });
  cr('h4_18', { aff: 'sac', race: 'hero', hp: 100, ret: 2, reg: 'solen', rar: 'C', n: ['Sir Bastian Alabarda-Áurea', 'Sir Bastian Goldhalberd'], s: ['O Guardião da Escadaria', 'Warden of the Stairway'],
    atk: [A('Golpe de Haste', 'Shaft Strike', 'SN', 30), A('Alabarda Consagrada', 'Consecrated Halberd', 'SSN', 70)],
    fl: ['Ninguém sobe à torre do bispo sem passar por ele.', 'No one climbs the bishop’s tower without getting past him.'] });
  cr('h4_08', { aff: 'sac', race: 'hero', hp: 80, ret: 1, reg: 'solen', rar: 'U', n: ['Amara Luz-de-Lanterna', 'Amara Lanternlight'], s: ['A Guia dos Perdidos', 'Guide of the Lost'],
    ab: ab('Luz da Lanterna', 'Lantern Light', 'healA', { v: 20 }),
    atk: [A('Luz Ofuscante', 'Blinding Light', 'SN', 20, [{ t: 'weaken', v: 20 }])],
    fl: ['Sua lanterna nunca apaga. Dizem que a chama é uma alma agradecida.', 'Her lantern never goes out. They say the flame is a grateful soul.'] });
  cr('h4_11', { aff: 'sac', race: 'hero', hp: 90, ret: 2, reg: 'solen', rar: 'U', n: ['Hector Muralha', 'Hector Bulwark'], s: ['O Escudo Inquebrável', 'The Unbreakable Shield'],
    atk: [A('Muralha de Escudo', 'Shield Wall', 'SN', 20, [{ t: 'guard', v: 20 }]), A('Investida de Escudo', 'Shield Charge', 'SSN', 50, [{ t: 'seal' }])],
    fl: ['Mil flechas no escudo. Nenhuma no coração.', 'A thousand arrows in the shield. None in the heart.'] });
  cr('h4_21', { aff: 'sac', race: 'hero', hp: 120, ret: 3, reg: 'solen', rar: 'R', n: ['Grão-Templário Osric', 'Grand Templar Osric'], s: ['O Mangual da Penitência', 'The Flail of Penance'],
    atk: [A('Mangual Bento', 'Blessed Flail', 'SNN', 50), A('Penitência em Chamas', 'Burning Penance', 'SSNN', 100, [{ t: 'exhaust' }])],
    fl: ['Cada golpe é uma oração. Cada oração, um golpe.', 'Every blow is a prayer. Every prayer, a blow.'] });
  // ---- Oculta ----
  cr('h4_01', { aff: 'occ', race: 'hero', hp: 70, ret: 1, reg: 'umbra', rar: 'C', n: ['Lyss Lâmina-Lunar', 'Lyss Moonblade'], s: ['A Dançarina do Luar', 'The Moonlight Dancer'],
    atk: [A('Chicote Lunar', 'Lunar Whip', 'O', 20), A('Valsa das Lâminas', 'Waltz of Blades', 'ON', 40)],
    fl: ['Dança apenas sob a lua cheia. Ninguém assiste duas vezes.', 'She dances only under a full moon. No one watches twice.'] });
  cr('h4_22', { aff: 'occ', race: 'hero', hp: 100, ret: 2, reg: 'valc', rar: 'C', n: ['Corva', 'Corva'], s: ['A Gatuna dos Beirais', 'The Eaves Prowler'],
    atk: [A('Bote', 'Pounce', 'ON', 30), A('Golpe nas Sombras', 'Shadow Strike', 'OON', 70)],
    fl: ['Os telhados de Valcoroa são o seu reino.', 'The rooftops of Valcrown are her kingdom.'] });
  cr('h4_03', { aff: 'occ', race: 'mon', hp: 80, ret: 1, reg: 'umbra', rar: 'U', tags: ['coro'], n: ['Maestro Vesper', 'Maestro Vesper'], s: ['O Violoncelista dos Mortos', 'Cellist of the Dead'],
    ab: ab('Réquiem Pútrido', 'Putrid Requiem', 'condA', { c: 'poison' }),
    atk: [A('Réquiem Dissonante', 'Dissonant Requiem', 'ON', 20, [{ t: 'expose', v: 20 }])],
    fl: ['Toca para os mortos. Às vezes, eles respondem.', 'He plays for the dead. Sometimes, they answer.'] });
  cr('h4_06', { aff: 'occ', race: 'hero', hp: 90, ret: 1, reg: 'umbra', rar: 'U', n: ['Nyra Garra-Negra', 'Nyra Blackclaw'], s: ['A Bruxa do Cemitério em Chamas', 'Witch of the Burning Graveyard'],
    atk: [A('Garras da Noite', 'Night Claws', 'ON', 20, [{ t: 'cond', c: 'poison' }]), A('Maldição Rastejante', 'Creeping Curse', 'OON', 50, [{ t: 'vsCond', v: 30 }])],
    fl: ['Ateou fogo ao cemitério só para ver quem sairia correndo.', 'She set the graveyard on fire just to see who would run out.'] });
  cr('h4_25', { aff: 'occ', race: 'mon', hp: 120, ret: 3, reg: 'umbra', rar: 'R', n: ['Draven', 'Draven'], s: ['O Sentinela da Cova', 'Sentinel of the Grave'],
    atk: [A('Espadão Fúnebre', 'Funeral Greatsword', 'ONN', 50), A('Ceifa dos Túmulos', 'Reaping of Tombs', 'OONN', 100, [{ t: 'recoil', v: 20 }])],
    fl: ['Guarda a fogueira dos mortos. Ela nunca se apaga.', 'He guards the bonfire of the dead. It never dies out.'] });
  // ---- Energética ----
  cr('h4_24', { aff: 'ene', race: 'hero', hp: 70, ret: 1, reg: 'vort', rar: 'C', n: ['Kaia Raio-Fino', 'Kaia Thinbolt'], s: ['A Lâmina Relampejante', 'The Flashing Blade'],
    atk: [A('Faísca', 'Spark', 'E', 20), A('Corte Elétrico', 'Electric Cut', 'EN', 40)],
    fl: ['Sua espada brilha um instante antes do trovão.', 'Her sword gleams an instant before the thunder.'] });
  cr('h4_23', { aff: 'ene', race: 'hero', hp: 100, ret: 2, reg: 'vort', rar: 'C', n: ['Sargento Brann Pólvora', 'Sergeant Brann Powder'], s: ['O Bacamarteiro de Vórtica', 'The Vortica Blunderbusser'],
    atk: [A('Coronhada', 'Rifle Butt', 'EN', 30), A('Disparo de Bacamarte', 'Blunderbuss Blast', 'EEN', 70)],
    fl: ['A Academia inventou a pólvora. Ele inventou o resto.', 'The Academy invented gunpowder. He invented the rest.'] });
  cr('h4_20', { aff: 'ene', race: 'hero', hp: 70, ret: 1, reg: 'vort', rar: 'U', n: ['Ilsa Tecelã-de-Adagas', 'Ilsa Daggerweaver'], s: ['A Arcanista Azul', 'The Blue Arcanist'],
    ab: ab('Leitura Arcana', 'Arcane Reading', 'drawA'),
    atk: [A('Adagas Arcanas', 'Arcane Daggers', 'EN', 20, [{ t: 'benchHit', v: 10 }])],
    fl: ['Lê o futuro no voo das adagas.', 'She reads the future in the flight of daggers.'] });
  cr('h4_09', { aff: 'ene', race: 'hero', hp: 90, ret: 1, reg: 'vort', rar: 'U', n: ['Mestre Tenzo Anel-Dourado', 'Master Tenzo Goldring'], s: ['O Punho da Tempestade', 'The Storm Fist'],
    atk: [A('Chute Anelar', 'Ring Kick', 'EN', 20, [{ t: 'cond', c: 'stun', coin: true }]), A('Vórtice Dourado', 'Golden Vortex', 'EEN', 50, [{ t: 'seal' }])],
    fl: ['Treinou nos picos até que os raios desviassem dele.', 'He trained on the peaks until lightning swerved around him.'] });
  cr('h4_17', { aff: 'ene', race: 'mon', hp: 120, ret: 3, reg: 'vort', rar: 'R', n: ['Ramagem Fulgurante', 'Fulgurant Boughs'], s: ['O Espírito da Árvore-Raio', 'Spirit of the Lightning Tree'],
    atk: [A('Galho Elétrico', 'Electric Branch', 'ENN', 50), A('Tempestade de Seiva', 'Sap Storm', 'EENN', 100, [{ t: 'discardSelf', n: 1, aff: 'ene' }])],
    fl: ['Nasceu onde um raio caiu sete vezes.', 'It was born where lightning struck seven times.'] });
  // ---- Primal (custos Neutros: +10 PV e −10 nos ataques de 3+ Cargas) ----
  cr('h4_19', { aff: 'pri', race: 'hero', hp: 80, ret: 1, reg: 'sylv', rar: 'C', n: ['Tavo Pele-Pintada', 'Tavo Paintedskin'], s: ['O Saltador das Cumeadas', 'The Ridge Leaper'],
    atk: [A('Corte Duplo', 'Double Cut', 'N', 20), A('Salto Selvagem', 'Wild Leap', 'NN', 40)],
    fl: ['Cada tatuagem conta um pico que ele saltou.', 'Every tattoo tells of a peak he leapt.'] });
  cr('h4_15', { aff: 'pri', race: 'hero', hp: 110, ret: 2, reg: 'valc', rar: 'C', n: ['Orrin, o Machado Silencioso', 'Orrin, the Silent Axe'], s: ['O Carrasco das Muralhas', 'Executioner of the Walls'],
    atk: [A('Cabo do Machado', 'Axe Haft', 'NN', 30), A('Sentença', 'Sentence', 'NNN', 60)],
    fl: ['Nunca disse uma palavra. Nunca precisou.', 'He has never said a word. He never needed to.'] });
  cr('h4_04', { aff: 'pri', race: 'hero', hp: 90, ret: 1, reg: 'sylv', rar: 'U', tags: ['arqueira'], n: ['Saeli Virote-Verde', 'Saeli Greenbolt'], s: ['A Atiradora dos Telhados', 'The Rooftop Shooter'],
    ab: ab('Salto de Telhado', 'Rooftop Leap', 'swapA'),
    atk: [A('Virote Venenoso', 'Venom Bolt', 'NN', 20, [], { snipe: true })],
    fl: ['Sua gárgula de estimação avisa quando alguém se aproxima.', 'Her pet gargoyle warns her when someone approaches.'] });
  cr('h4_12', { aff: 'pri', race: 'hero', hp: 100, ret: 1, reg: 'sylv', rar: 'U', tags: ['arqueira'], n: ['Aynara Arco-de-Espinhos', 'Aynara Thornbow'], s: ['A Caçadora da Névoa', 'Huntress of the Mist'],
    atk: [A('Flecha de Espinho', 'Thorn Arrow', 'NN', 20, [{ t: 'cond', c: 'poison' }]), A('Chuva de Espinhos', 'Thorn Rain', 'NNN', 40, [{ t: 'vsCond', v: 30 }])],
    fl: ['Seu arco cresceu de um espinheiro que ela mesma plantou.', 'Her bow grew from a thornbush she planted herself.'] });
  cr('h4_13', { aff: 'pri', race: 'mon', hp: 130, ret: 3, reg: 'sylv', rar: 'R', tags: ['matilha'], n: ['Fenrak', 'Fenrak'], s: ['A Fera das Correntes Partidas', 'Beast of the Broken Chains'],
    atk: [A('Garras Acorrentadas', 'Chained Claws', 'NNN', 40), A('Fúria Desacorrentada', 'Unchained Fury', 'NNNN', 90, [{ t: 'recoil', v: 20 }])],
    fl: ['Prenderam-no com correntes de catedral. Ele levou a catedral junto.', 'They bound him with cathedral chains. He took the cathedral with him.'] });


  // ======================= VERSÕES ALTERNATIVAS (1 por criatura) =======================
  // Cada variante deriva do orçamento de dano da original e aplica um tema: mesmo personagem, outro estilo de jogo.
  const VT = {
    blood: { n: L('Lua Sangrenta', 'Blood Moon'), fl: L('Sob a Lua Sangrenta, até os mansos aprendem a morder.', 'Under the Blood Moon, even the meek learn to bite.') },
    eclipse: { n: L('Eclipse', 'Eclipse'), fl: L('Quando o sol se apaga, outras regras valem no Coliseu.', 'When the sun goes dark, other rules hold in the Coliseum.') },
    ancestral: { n: L('Ancestral', 'Ancestral'), fl: L('Uma lembrança de quem esta alma foi antes da Coroa se partir.', 'A memory of who this soul was before the Crown shattered.') },
    spectral: { n: L('Espectral', 'Spectral'), fl: L('Metade aqui, metade no além. Difícil de acertar, impossível de esquecer.', 'Half here, half beyond. Hard to hit, impossible to forget.') }
  };
  const VN = {
    blood: { ign: [['Mordida de Brasa', 'Ember Bite'], ['Banquete em Chamas', 'Burning Feast']], sac: [['Martírio', 'Martyrdom'], ['Sangue Bendito', 'Hallowed Blood']], occ: [['Presas da Noite', 'Night Fangs'], ['Festim Carmesim', 'Crimson Revel']], ene: [['Choque Sangrento', 'Bloody Shock'], ['Tempestade Rubra', 'Red Storm']], pri: [['Dente Selvagem', 'Wild Fang'], ['Caçada Sangrenta', 'Blood Hunt']] },
    eclipse: { ign: [['Cinza Sufocante', 'Choking Ash'], ['Sol Negro', 'Black Sun']], sac: [['Prece Sombria', 'Dark Prayer'], ['Juízo Eclipsado', 'Eclipsed Judgment']], occ: [['Toque do Vazio', 'Void Touch'], ['Marca do Eclipse', 'Eclipse Mark']], ene: [['Faísca Negra', 'Black Spark'], ['Raio Eclipsado', 'Eclipsed Bolt']], pri: [['Seiva Negra', 'Black Sap'], ['Uivo do Eclipse', 'Eclipse Howl']] },
    ancestral: { ign: [['Brasa Antiga', 'Ancient Ember'], ['Muralha de Fogo', 'Wall of Fire']], sac: [['Bênção Antiga', 'Ancient Blessing'], ['Égide Ancestral', 'Ancestral Aegis']], occ: [['Sussurro Antigo', 'Ancient Whisper'], ['Mortalha Ancestral', 'Ancestral Shroud']], ene: [['Runa Antiga', 'Ancient Rune'], ['Escudo de Trovão', 'Thunder Shield']], pri: [['Canto da Raiz', 'Root Chant'], ['Casca Ancestral', 'Ancestral Bark']] },
    spectral: { ign: [['Chama Fantasma', 'Ghost Flame'], ['Passo de Cinzas', 'Ash Step']], sac: [['Luz Errante', 'Wandering Light'], ['Ascensão Espectral', 'Spectral Rise']], occ: [['Garra Fantasma', 'Phantom Claw'], ['Atravessar o Véu', 'Cross the Veil']], ene: [['Raio Fantasma', 'Phantom Bolt'], ['Salto Estático', 'Static Leap']], pri: [['Flecha Espírito', 'Spirit Arrow'], ['Vento do Além', 'Wind Beyond']] }
  };
  const VCOND = { ign: { t: 'cond', c: 'burn' }, sac: { t: 'cond', c: 'stun', coin: true }, occ: { t: 'cond', c: 'poison' }, ene: { t: 'cond', c: 'stun', coin: true }, pri: { t: 'cond', c: 'poison' } };
  const RUP = { C: 'U', U: 'R', R: 'E', E: 'E', L: 'L' };
  const ev = (a) => Math.round(((a.dmg || 0) + G.sum(a.fx, (f) => (f.t === 'coins' ? f.n * f.v / 2 : f.t === 'coinPlus' ? f.v / 2 : 0))) / 10) * 10;
  ORDER.filter((id) => CARDS[id].kind === 'creature').forEach((id, i) => {
    const b = CARDS[id]; const th = ['blood', 'eclipse', 'ancestral', 'spectral'][i % 4]; const nm = VN[th][b.aff];
    const srt = b.attacks.slice().sort((x, y) => x.cost.length - y.cost.length); const big = srt[srt.length - 1]; const light = srt.length > 1 ? srt[0] : null;
    const lc = light ? light.cost.slice() : [b.aff === 'pri' ? 'neu' : b.aff]; const ld = light ? Math.max(10, ev(light)) : 10; const bc = big.cost.slice(); const bd = Math.max(10, ev(big));
    let A1, A2, hp = b.hp, ret = b.ret;
    const mk = (n, cost, dmg, fx, x) => Object.assign({ name: L(n[0], n[1]), cost, dmg, fx: fx || [] }, x || {});
    if (th === 'blood') { A1 = mk(nm[0], lc, ld + 10, [{ t: 'recoil', v: 10 }]); A2 = mk(nm[1], bc, bd + 10, [{ t: 'healSelf', v: 20 }]); hp -= 10; }
    else if (th === 'eclipse') { A1 = mk(nm[0], lc, Math.max(10, ld - 10), [Object.assign({}, VCOND[b.aff])]); A2 = mk(nm[1], bc, Math.max(10, bd - 10), [{ t: 'expose', v: 20 }]); }
    else if (th === 'ancestral') { A1 = mk(nm[0], lc, Math.max(10, ld - 10), [{ t: 'weaken', v: 20 }]); A2 = mk(nm[1], bc, Math.max(10, bd - 10), [{ t: 'guard', v: 20 }]); hp += 20; }
    else { A1 = mk(nm[0], lc, ld, [], lc.length <= 2 ? { snipe: true } : null); A2 = mk(nm[1], bc, bd, [{ t: 'switchSelf' }]); hp -= 10; ret = Math.max(0, ret - 1); }
    add(Object.assign({}, b, { id: id + 'v', art: id + 'v', variantOf: id, theme: th, rarity: RUP[b.rarity], hp, ret, tags: b.tags.slice(),
      name: L(b.name.pt + ' (' + VT[th].n.pt + ')', b.name.en + ' (' + VT[th].n.en + ')'), sub: L('Variante ' + VT[th].n.pt, VT[th].n.en + ' Variant'),
      attacks: [A1, A2], flavor: VT[th].fl }));
  });
  G.baseId = (id) => (CARDS[id] && CARDS[id].variantOf) || id;

  // ---- Ajuste de equilíbrio por afinidade (aplicado igualmente a todas as criaturas da afinidade, medido em simulação) ----
  const AFF_TUNE = root.ORVALON_TUNE !== undefined ? root.ORVALON_TUNE : { pri: { min: 2, d: -20 }, ene: { min: 2, d: 10 }, ign: { min: 3, d: 10 } };
  ORDER.forEach((id) => { const c = CARDS[id]; const tn = c.kind === 'creature' && AFF_TUNE[c.aff]; if (!tn) return; c.attacks.forEach((a) => { if (a.dmg > 0 && a.cost.length >= tn.min) a.dmg = Math.max(10, a.dmg + tn.d); }); });

  // ======================= EFEITOS =======================
  const ef = (id, rar, pt, en, mode, fx) => add({ id, kind: 'effect', art: id, rarity: rar, name: L(pt, en), mode, fx });
  ef('e1_01', 'C', 'Alquimia Proibida', 'Forbidden Alchemy', 'instant', [{ t: 'discardDraw', n: 3 }]);
  ef('e1_02', 'U', 'Rio Carmesim', 'Crimson River', 'cont', [{ t: 'atkUp', v: 10 }]);
  ef('e1_03', 'C', 'Sangue Consagrado', 'Consecrated Blood', 'instant', [{ t: 'heal', v: 40 }]);
  ef('e1_04', 'U', 'Coração Renascido', 'Reborn Heart', 'instant', [{ t: 'revive' }]);
  ef('e1_05', 'U', 'Eclipse Negro', 'Black Eclipse', 'cont', [{ t: 'affAtkUp', aff: 'occ', v: 10 }]);
  ef('e1_06', 'C', 'Frenesi da Turba', 'Mob Frenzy', 'instant', [{ t: 'tempAtk', v: 20 }]);
  ef('e1_07', 'C', 'Correntes Partidas', 'Broken Chains', 'instant', [{ t: 'cure' }, { t: 'healActive', v: 20 }]);
  ef('e1_08', 'U', 'Hino do Vitral', 'Hymn of the Glass', 'cont', [{ t: 'affAtkUp', aff: 'sac', v: 10 }]);
  ef('e1_09', 'U', 'Cálice Profano', 'Profane Chalice', 'instant', [{ t: 'attachDiscard', n: 1 }]);
  ef('e1_10', 'R', 'Igreja em Chamas', 'Burning Church', 'instant', [{ t: 'spread', v: 10 }]);
  ef('e1_11', 'U', 'Juramento Acorrentado', 'Chained Oath', 'cont', [{ t: 'dmgDown', v: 10 }]);
  ef('e1_12', 'U', 'Caldeirão das Almas', 'Cauldron of Souls', 'instant', [{ t: 'recover', n: 2 }]);
  ef('e1_13', 'C', 'Contrato Rasgado', 'Torn Contract', 'instant', [{ t: 'discardOppRelic' }]);
  ef('e1_14', 'C', 'Mão da Cova', 'Hand from the Grave', 'instant', [{ t: 'searchAsc' }]);
  ef('e1_15', 'C', 'Cruz Acorrentada', 'Chained Cross', 'instant', [{ t: 'sealOpp' }, { t: 'draw', n: 1 }]);
  ef('e1_16', 'U', 'Culto do Altar Verde', 'Cult of the Green Altar', 'cont', [{ t: 'healEnd', v: 10 }]);
  ef('e1_17', 'C', 'Asas Partidas', 'Broken Wings', 'instant', [{ t: 'switchOwn' }]);
  ef('e1_18', 'U', 'Forja Vulcânica', 'Volcanic Forge', 'cont', [{ t: 'affAtkUp', aff: 'ign', v: 10 }]);
  ef('e1_19', 'C', 'Caminho do Eclipse', 'Eclipse Path', 'instant', [{ t: 'searchBasic', to: 'hand' }]);
  ef('e1_20', 'C', 'Escudo de Mil Flechas', 'Shield of a Thousand Arrows', 'instant', [{ t: 'tempShield', v: 30 }]);
  ef('e1_21', 'U', 'Estilhaçar', 'Shatter Armor', 'instant', [{ t: 'stripOpp', coin: true }]);
  ef('e1_22', 'C', 'Incenso Tóxico', 'Toxic Incense', 'instant', [{ t: 'condOpp', c: 'poison' }]);
  ef('e1_23', 'R', 'Demônio Aprisionado', 'Imprisoned Demon', 'instant', [{ t: 'gustOpp' }]);
  ef('e1_24', 'R', 'Vórtice Astral', 'Astral Vortex', 'cont', [{ t: 'drawExtra' }]);
  ef('e1_25', 'E', 'A Coroa Partida', 'The Shattered Crown', 'instant', [{ t: 'shuffleHands', self: 5, opp: 4 }]);
  ef('e2_01', 'U', 'Coração Ofertado', 'Offered Heart', 'instant', [{ t: 'heal', v: 60, cost: 'charge' }]);
  ef('e2_02', 'C', 'Bênção do Sacerdote', 'Priest’s Blessing', 'instant', [{ t: 'heal', v: 30 }]);
  ef('e2_03', 'U', 'Geometria Sagrada', 'Sacred Geometry', 'instant', [{ t: 'topLook', n: 5 }]);
  ef('e2_04', 'C', 'Descida Angelical', 'Angelic Descent', 'instant', [{ t: 'searchCharge', n: 2 }]);
  ef('e2_05', 'U', 'Portal dos Monólitos', 'Monolith Portal', 'instant', [{ t: 'bounceOwn' }]);
  ef('e2_06', 'C', 'Clamor da Congregação', 'Cry of the Congregation', 'instant', [{ t: 'draw', n: 2 }]);
  ef('e2_07', 'U', 'Cálice da Comunhão', 'Chalice of Communion', 'instant', [{ t: 'healAll', v: 20 }]);
  ef('e2_08', 'U', 'Esvoaçar', 'Flutter Away', 'instant', [{ t: 'switchOwn', heal: 20 }]);
  ef('e2_09', 'U', 'Égide Rúnica', 'Runic Aegis', 'cont', [{ t: 'condWard' }]);
  ef('e2_10', 'U', 'Árvore do Mundo', 'World Tree', 'cont', [{ t: 'affAtkUp', aff: 'pri', v: 10 }]);
  ef('e2_11', 'U', 'Grimório Desvelado', 'Unveiled Grimoire', 'instant', [{ t: 'drawDiscard', n: 3 }]);
  ef('e2_12', 'R', 'Olho do Céu', 'Eye of the Sky', 'instant', [{ t: 'revealHand' }]);
  ef('e2_13', 'R', 'Fada do Bosque', 'Grove Fairy', 'instant', [{ t: 'attachHandBench' }]);
  ef('e2_14', 'C', 'Fogueira dos Ancestrais', 'Ancestors’ Bonfire', 'instant', [{ t: 'recoverCharges', n: 3 }]);
  ef('e2_15', 'C', 'Trilha ao Castelo', 'Path to the Castle', 'cont', [{ t: 'retreatDown' }]);
  ef('e2_16', 'C', 'Sopro Vital', 'Breath of Life', 'instant', [{ t: 'cure' }, { t: 'healAll', v: 10 }]);
  ef('e2_17', 'C', 'Passagem Oculta', 'Hidden Passage', 'instant', [{ t: 'searchRelic' }]);
  ef('e2_18', 'U', 'Labirinto', 'Labyrinth', 'instant', [{ t: 'forceSwitchOpp' }]);
  ef('e2_19', 'U', 'Portal Estelar', 'Star Portal', 'instant', [{ t: 'searchBasic', to: 'bench' }]);
  ef('e2_20', 'U', 'Banquete dos Invocadores', 'Summoners’ Feast', 'instant', [{ t: 'drawTo', n: 6 }]);
  ef('e2_21', 'U', 'Meditação Astral', 'Astral Meditation', 'cont', [{ t: 'affAtkUp', aff: 'ene', v: 10 }]);
  ef('e2_22', 'U', 'Asas da Providência', 'Wings of Providence', 'cont', [{ t: 'benchGuard' }]);
  ef('e2_23', 'U', 'Ascensão Coletiva', 'Collective Ascension', 'cont', [{ t: 'koDraw', n: 2 }]);
  ef('e2_24', 'C', 'Chama Partilhada', 'Shared Flame', 'instant', [{ t: 'moveCharge' }]);
  ef('e2_25', 'R', 'Oferendas da Lua', 'Moon Offerings', 'instant', [{ t: 'attachDiscard', n: 2, dmg: 20 }]);
  ef('m_21', 'U', 'Vontade de Ferro', 'Iron Will', 'cont', [{ t: 'activeDmgDown', v: 20 }]);
  ef('m_22', 'R', 'Terra Maldita', 'Cursed Ground', 'cont', [{ t: 'oppPing', v: 10 }]);
  ef('m_23', 'R', 'Ressurreição', 'Resurrection', 'instant', [{ t: 'revive', charge: true }]);
  ef('m_24', 'R', 'Ecos da Alma', 'Echoes of the Soul', 'instant', [{ t: 'tutor' }]);
  ef('m_25', 'C', 'Banimento do Vazio', 'Void Banishment', 'instant', [{ t: 'discardGod' }, { t: 'draw', n: 1 }]);

  // ======================= RELÍQUIAS =======================
  const rl = (id, rar, pt, en, r) => add({ id, kind: 'relic', art: id, rarity: rar, name: L(pt, en), r });
  rl('r1_01', 'C', 'Elixir Violeta', 'Violet Elixir', { elixir: 50 });
  rl('r1_02', 'U', 'Tomo Acorrentado', 'Chained Tome', { koDraw: 3 });
  rl('r1_03', 'U', 'Ossos do Mártir', 'Martyr’s Bones', { curse: 30 });
  rl('r1_04', 'R', 'Cetro das Contas', 'Beaded Scepter', { costDown: 1 });
  rl('r1_05', 'C', 'Medalhão da Fogueira', 'Bonfire Medallion', { hp: 30 });
  rl('r1_06', 'U', 'Fogo-Fátuo', 'Will-o’-Wisp', { atkUp: 20, selfBurn: 10 });
  rl('r1_07', 'C', 'Açoite de Ganchos', 'Hooked Lash', { vsDamaged: 20 });
  rl('r1_08', 'U', 'Turíbulo Violeta', 'Violet Thurible', { poisonOnAttack: true });
  rl('r1_09', 'U', 'Chifre de Caça', 'Hunting Horn', { vsRace: { race: 'mon', v: 20 } });
  rl('r1_10', 'R', 'Relicário do Osso', 'Bone Reliquary', { dr: 20 });
  rl('r1_11', 'C', 'Tambor dos Antigos', 'Drum of the Ancients', { freeRetreat: true });
  rl('r1_12', 'C', 'Pergaminho Apócrifo', 'Apocryphal Scroll', { condImmune: 'all' });
  rl('r1_13', 'C', 'Estante do Boticário', 'Apothecary Rack', { regen: 10 });
  rl('r1_14', 'U', 'Ostensório Solar', 'Solar Monstrance', { vsAff: { aff: 'occ', v: 20 } });
  rl('r1_15', 'U', 'Máscara dos Ancestrais', 'Mask of the Ancestors', { only: 'pri', hp: 40 });
  rl('r1_16', 'C', 'Chicote de Espinhos', 'Thorn Whip', { thorns: 20 });
  rl('r1_17', 'R', 'Coroa de Espinhos', 'Crown of Thorns', { atkUp: 20, takeMore: 10 });
  rl('r1_18', 'U', 'Adaga Ritual', 'Ritual Dagger', { atkUp: 10, killDraw: 2 });
  rl('r1_19', 'U', 'Lanterna de Vitral', 'Stained-Glass Lantern', { onAttach: 'searchChargeAttach' });
  rl('r1_20', 'U', 'Tigela de Oferendas', 'Offering Bowl', { koReturn: true });
  rl('r1_21', 'C', 'Tábua dos Espíritos', 'Spirit Board', { onAttach: 'draw2' });
  rl('r1_22', 'R', 'Chave da Cripta', 'Crypt Key', { perDiscardCreature: { v: 10, max: 40 } });
  rl('r1_23', 'U', 'Cálice Estelar', 'Starlit Chalice', { healOnAttack: 20 });
  rl('r1_24', 'C', 'Amuleto das Velas', 'Candle Amulet', { hp: 20, condImmune: ['poison', 'burn'] });
  rl('r1_25', 'C', 'Grimório Selado', 'Sealed Grimoire', { atkUp: 20, noRetreat: true });
  rl('r2_01', 'U', 'Olho Vigilante', 'Watchful Eye', { drawOnHit: 1 });
  rl('r2_02', 'U', 'Serra Rúnica', 'Runic Saw', { atkUp: 20 });
  rl('r2_03', 'C', 'Mão da Glória', 'Hand of Glory', { tranceCoinOnAttack: true });
  rl('r2_04', 'E', 'Ampulheta Espectral', 'Spectral Hourglass', { legendPrizeReduce: true });
  rl('r2_05', 'U', 'Espelho Assombrado', 'Haunted Mirror', { madnessOnHit: true });
  rl('r2_06', 'R', 'Baú Mímico', 'Mimic Chest', { koHandDisrupt: 2 });
  rl('r2_07', 'U', 'Tinteiro da Gárgula', 'Gargoyle Inkwell', { attachDraw: true });
  rl('r2_08', 'U', 'Máscara da Peste', 'Plague Mask', { condImmune: ['poison'], vsCond: 0, vsPoison: 20 });
  rl('r2_09', 'R', 'Caixa de Música Macabra', 'Macabre Music Box', { tranceOnAttack: true });
  rl('r2_10', 'R', 'Boneco de Pregos', 'Nail Doll', { thorns: 30 });
  rl('r2_11', 'C', 'Garras de Aço', 'Steel Claws', { raceAtk: { race: 'mon', v: 20 } });
  rl('r2_12', 'U', 'Crânio da Fera', 'Beast Skull', { vsRace: { race: 'hero', v: 20 } });
  rl('r2_13', 'U', 'Coração Engarrafado', 'Bottled Heart', { hp: 50, noHeal: true });
  rl('r2_14', 'R', 'Adaga de Obsidiana', 'Obsidian Dagger', { ignoreReduce: true });
  rl('r2_15', 'U', 'Candelabro de Ossos', 'Bone Candelabra', { vsCond: 20 });
  rl('r2_16', 'U', 'Coração de Ferro', 'Iron Heart', { dr: 30, atkDown: 20 });
  rl('r2_17', 'U', 'Presa Dourada', 'Golden Fang', { vsLegend: 30 });
  rl('r2_18', 'U', 'Bússola Rúnica', 'Runic Compass', { swapA: true });
  rl('r2_19', 'E', 'Pacto de Sangue', 'Blood Pact', { atkUp: 30, extraPrize: true });
  rl('r2_20', 'C', 'Seringa Verde', 'Green Syringe', { onAttach: 'cureHeal40' });
  rl('r2_21', 'R', 'Diadema de Presas', 'Fanged Diadem', { killHealFull: true });
  rl('r2_22', 'R', 'Sino Acorrentado', 'Chained Bell', { lockOppRetreat: true });
  rl('r2_23', 'C', 'Mensageiro de Ossos', 'Bone Messenger', { onAttach: 'topLook3' });
  rl('r2_24', 'U', 'Trompa de Guerra', 'War Horn', { benchAura: 10 });
  rl('r2_25', 'C', 'Chave dos Dentes', 'Tooth Key', { retreatDown: 1, retreatHeal: 20 });

  // ======================= DEUSES =======================
  const gd = (id, god, aff, pt, en, spt, sen, fpt, fen) => add({ id, kind: 'god', art: id, rarity: 'E', god, aff, name: L(pt, en), sub: L(spt, sen), flavor: L(fpt, fen) });
  gd('m_11', 'morvath', 'occ', 'Morvath', 'Morvath', 'Senhor do Último Trono', 'Lord of the Last Throne', 'Nada morre em Orvalon sem passar pelo seu trono.', 'Nothing dies in Orvalon without passing his throne.');
  gd('m_12', 'aurelia', 'sac', 'Aurelia', 'Aurelia', 'A Lâmina da Aurora', 'Blade of the Dawn', 'Sua espada é o primeiro raio de cada manhã.', 'Her sword is the first ray of every morning.');
  gd('m_13', 'sylvarok', 'pri', 'Sylvarok', 'Sylvarok', 'O Cervo Ancestral', 'The Ancestral Stag', 'Seus chifres sustentam o céu do norte.', 'His antlers hold up the northern sky.');
  gd('m_14', 'nyxara', 'ene', 'Nyxara', 'Nyxara', 'A Tecelã das Estrelas', 'Weaver of Stars', 'Cada raio é um fio que ela puxa.', 'Every bolt is a thread she pulls.');
  gd('m_15', 'kragmor', 'ign', 'Kragmor', 'Kragmor', 'O Forjador do Abismo', 'Forger of the Abyss', 'Martelou o primeiro vulcão como quem forja uma espada.', 'He hammered the first volcano like forging a sword.');

  // ======================= AÇÕES =======================
  const ac = (id, rar, act, pt, en) => add({ id, kind: 'action', art: id, rarity: rar, act, name: L(pt, en) });
  ac('m_16', 'U', 'swapDraw', 'Troca de Almas', 'Soul Exchange');
  ac('m_17', 'R', 'seal', 'Selamento Rúnico', 'Runic Sealing');
  ac('m_18', 'U', 'sacrifice', 'Sacrifício de Sangue', 'Blood Sacrifice');
  ac('m_19', 'C', 'draw3', 'Pacto dos Espíritos', 'Pact of Spirits');
  ac('m_20', 'U', 'reshuffle6', 'Ampulheta do Destino', 'Hourglass of Fate');

  // ======================= MARCADORES =======================
  const mk = (id, m, pt, en, spt, sen) => add({ id, kind: 'marker', art: id, rarity: 'C', mk: m, name: L(pt, en), sub: L(spt, sen) });
  mk('m_01', 'life', 'Coração de Espinhos', 'Heart of Thorns', 'Marcador de Vida', 'Life Marker');
  mk('m_02', 'mana', 'Gota Astral', 'Astral Drop', 'Marcador de Mana', 'Mana Marker');
  mk('m_03', 'force', 'Punho Acorrentado', 'Chained Fist', 'Marcador de Força', 'Strength Marker');
  mk('m_04', 'luck', 'Dado das Constelações', 'Constellation Die', 'Marcador de Sorte', 'Luck Marker');
  mk('m_05', 'guard', 'Égide Flamejante', 'Flaming Aegis', 'Marcador de Defesa', 'Defense Marker');

  // ======================= CARGAS =======================
  const cg = (id, aff, pt, en) => add({ id, kind: 'charge', art: id, rarity: 'C', aff, basic: true, name: L(pt, en) });
  cg('m_06', 'neu', 'Carga Neutra', 'Neutral Charge');
  cg('m_07', 'ign', 'Carga Ígnea', 'Ember Charge');
  cg('m_08', 'sac', 'Carga Sagrada', 'Sacred Charge');
  cg('m_09', 'occ', 'Carga Oculta', 'Occult Charge');
  cg('m_10', 'ene', 'Carga Energética', 'Storm Charge');
  G.CHARGE_OF = { neu: 'm_06', ign: 'm_07', sac: 'm_08', occ: 'm_09', ene: 'm_10' };

  // ======================= GERADOR DE TEXTO =======================
  const aN = (aff, lang, pl) => { const a = G.AFF[aff]; return lang === 'en' ? a.en : (pl ? a.ptPl : a.pt); };
  const cN = (c, lang) => G.COND[c][lang];
  const plC = (n, lang) => lang === 'en' ? (n === 1 ? 'Charge' : 'Charges') : (n === 1 ? 'Carga' : 'Cargas');
  const plCard = (n, lang) => lang === 'en' ? (n === 1 ? 'card' : 'cards') : (n === 1 ? 'carta' : 'cartas');
  const coinPre = (lang) => lang === 'en' ? 'Flip a coin. If Sun, ' : 'Lance a moeda. Se der Sol, ';

  const FXT = {
    cond: (f, l) => (f.coin ? coinPre(l) : '') + (l === 'en' ? `the opponent’s Active is now ${cN(f.c, l)}.` : `o Ativo do oponente fica ${cN(f.c, l)}.`),
    recoil: (f, l) => l === 'en' ? `This creature takes ${f.v} damage.` : `Esta criatura sofre ${f.v} de dano.`,
    healSelf: (f, l) => l === 'en' ? `Heal ${f.v} damage from this creature.` : `Cure ${f.v} de dano desta criatura.`,
    healTeam: (f, l) => l === 'en' ? `Heal ${f.v} damage from each of your creatures.` : `Cure ${f.v} de dano de cada uma de suas criaturas.`,
    benchHit: (f, l) => f.all ? (l === 'en' ? `Deal ${f.v} damage to each of the opponent’s Reserve creatures.` : `Cause ${f.v} de dano a cada criatura da Reserva do oponente.`)
      : (l === 'en' ? `Deal ${f.v} damage to 1 of the opponent’s Reserve creatures.` : `Cause ${f.v} de dano a 1 criatura da Reserva do oponente.`),
    coinPlus: (f, l) => l === 'en' ? `Flip a coin. If Sun, this attack does ${f.v} more damage.` : `Lance a moeda. Se der Sol, este ataque causa ${f.v} a mais.`,
    coins: (f, l, a) => (a && a.dmg) ? (l === 'en' ? `Flip ${f.n} coins. This attack does ${f.v} more damage for each Sun.` : `Lance ${f.n} moedas. Este ataque causa ${f.v} a mais para cada Sol.`) : (l === 'en' ? `Flip ${f.n} coins. This attack does ${f.v} damage for each Sun.` : `Lance ${f.n} moedas. Este ataque causa ${f.v} de dano para cada Sol.`),
    weaken: (f, l) => l === 'en' ? `During the opponent’s next turn, their Active’s attacks do ${f.v} less damage.` : `Durante o próximo turno do oponente, os ataques do Ativo dele causam ${f.v} a menos.`,
    expose: (f, l) => l === 'en' ? `Until the end of your next turn, the opponent’s Active takes ${f.v} more damage from attacks.` : `Até o fim do seu próximo turno, o Ativo do oponente sofre ${f.v} a mais de dano de ataques.`,
    coinFail: (f, l) => l === 'en' ? 'Flip a coin. If Moon, this attack does nothing.' : 'Lance a moeda. Se der Lua, este ataque não faz nada.',
    perCharge: (f, l) => l === 'en' ? `Does ${f.v} more damage for each Charge attached to ${f.who === 'self' ? 'this creature' : 'the opponent’s Active'}.` : `Causa ${f.v} a mais para cada Carga ligada a ${f.who === 'self' ? 'esta criatura' : 'o Ativo do oponente'}.`,
    perDmg: (f, l) => l === 'en' ? `Does ${f.v} more damage for each 10 damage on this creature.` : `Causa ${f.v} a mais para cada 10 de dano nesta criatura.`,
    perBench: (f, l) => l === 'en' ? `Does ${f.v} more damage for each creature in ${f.who === 'self' ? 'your' : 'the opponent’s'} Reserve.` : `Causa ${f.v} a mais para cada criatura na ${f.who === 'self' ? 'sua Reserva' : 'Reserva do oponente'}.`,
    discardSelf: (f, l) => l === 'en' ? `Discard ${f.n} ${f.aff ? aN(f.aff, l) + ' ' : ''}${plC(f.n, l)} from this creature.` : `Descarte ${f.n} ${plC(f.n, l)}${f.aff ? ' ' + aN(f.aff, l, f.n > 1) : ''} desta criatura.`,
    stripOpp: (f, l) => (f.coin ? coinPre(l) : '') + (l === 'en' ? 'discard 1 Charge from the opponent’s Active.' : 'descarte 1 Carga do Ativo do oponente.'),
    draw: (f, l) => l === 'en' ? `Draw ${f.n} ${plCard(f.n, l)}.` : `Compre ${f.n} ${plCard(f.n, l)}.`,
    seal: (f, l) => l === 'en' ? 'During the opponent’s next turn, their Active can’t retreat.' : 'Durante o próximo turno do oponente, o Ativo dele não pode recuar.',
    guard: (f, l) => l === 'en' ? `During the opponent’s next turn, this creature takes ${f.v} less damage from attacks.` : `Durante o próximo turno do oponente, esta criatura sofre ${f.v} a menos de dano de ataques.`,
    exhaust: (f, l) => l === 'en' ? 'This creature can’t attack during your next turn.' : 'Esta criatura não pode atacar durante o seu próximo turno.',
    vsRace: (f, l) => l === 'en' ? `Does ${f.v} more damage if the opponent’s Active is a ${G.RACE[f.race].en}.` : `Causa ${f.v} a mais se o Ativo do oponente for um ${G.RACE[f.race].pt}.`,
    vsCond: (f, l) => l === 'en' ? `Does ${f.v} more damage if the opponent’s Active has a Condition.` : `Causa ${f.v} a mais se o Ativo do oponente estiver sob uma Condição.`,
    vsDamaged: (f, l) => l === 'en' ? `Does ${f.v} more damage if the opponent’s Active already has damage.` : `Causa ${f.v} a mais se o Ativo do oponente já tiver dano.`,
    handDisrupt: (f, l) => (f.coin ? coinPre(l) : '') + (l === 'en' ? 'the opponent discards 1 random card from their hand.' : 'o oponente descarta 1 carta aleatória da mão.'),
    tag: (f, l) => l === 'en' ? `Does ${f.v} more damage for each other ${G.TAGS[f.tag].en} creature you have in play.` : `Causa ${f.v} a mais para cada outra criatura ${G.TAGS[f.tag].pt} que você tiver em jogo.`,
    switchSelf: (f, l) => l === 'en' ? 'You may switch this creature with 1 of your Reserve creatures.' : 'Você pode trocar esta criatura por 1 criatura da sua Reserva.',
    forceSwitch: (f, l) => l === 'en' ? 'The opponent switches their Active with 1 of their Reserve creatures (their choice).' : 'O oponente troca o Ativo dele por 1 criatura da Reserva dele, à escolha dele.'
  };
  const SNIPE_T = (l) => l === 'en' ? 'Choose 1 of the opponent’s creatures (Active or Reserve) and deal this damage to it. Weakness and Resistance apply only to the Active.'
    : 'Escolha 1 criatura do oponente (Ativo ou Reserva) e cause este dano a ela. Fraqueza e Resistência só valem para o Ativo.';

  G.attackText = function (atk, lang) {
    const parts = [];
    if (atk.snipe) parts.push(SNIPE_T(lang));
    atk.fx.forEach((f) => { const fn = FXT[f.t]; if (fn) { let s = fn(f, lang, atk); s = s.charAt(0).toUpperCase() + s.slice(1); parts.push(s); } });
    return parts.join(' ');
  };

  const ABT = {
    dr: (a, l) => l === 'en' ? `This creature takes ${a.v} less damage from attacks.` : `Esta criatura sofre ${a.v} a menos de dano de ataques.`,
    thorns: (a, l) => l === 'en' ? `If this creature is your Active and takes damage from an attack, deal ${a.v} damage to the attacking creature.` : `Se esta criatura for o seu Ativo e sofrer dano de um ataque, cause ${a.v} de dano à criatura atacante.`,
    benchWard: (a, l) => l === 'en' ? 'Prevent all damage from attacks done to your Reserve creatures.' : 'Previna todo o dano de ataques causado às suas criaturas da Reserva.',
    affBoost: (a, l) => l === 'en' ? `Attacks of your ${aN(a.aff, l, true)} creatures do ${a.v} more damage to the opponent’s Active.` : `Os ataques das suas criaturas ${aN(a.aff, l, true)} causam ${a.v} a mais ao Ativo do oponente.`,
    condImmune: (a, l) => l === 'en' ? 'This creature can’t be affected by Conditions.' : 'Esta criatura não pode ser afetada por Condições.',
    regen: (a, l) => l === 'en' ? `Between Turns, heal ${a.v} damage from this creature.` : `No Entre Turnos, cure ${a.v} de dano desta criatura.`,
    regenTeam: (a, l) => l === 'en' ? `Between Turns, heal ${a.v} damage from each of your creatures.` : `No Entre Turnos, cure ${a.v} de dano de cada uma de suas criaturas.`,
    koDraw: (a, l) => l === 'en' ? `When this creature is defeated, its owner draws ${a.n} cards.` : `Quando esta criatura for derrotada, seu dono compra ${a.n} cartas.`,
    curse: (a, l) => l === 'en' ? `When this creature is defeated by an attack, put ${a.v} damage on the attacking creature.` : `Quando esta criatura for derrotada por um ataque, coloque ${a.v} de dano na criatura atacante.`,
    drawA: (a, l) => l === 'en' ? `Once during your turn${a.needTag ? `, if you have another ${G.TAGS[a.needTag].en} creature in play` : ''}, you may draw 1 card.` : `Uma vez durante o seu turno${a.needTag ? `, se você tiver outra criatura ${G.TAGS[a.needTag].pt} em jogo` : ''}, você pode comprar 1 carta.`,
    healA: (a, l) => l === 'en' ? `Once during your turn, you may heal ${a.v} damage from 1 of your creatures.` : `Uma vez durante o seu turno, você pode curar ${a.v} de dano de 1 de suas criaturas.`,
    accelA: (a, l) => l === 'en' ? `Once during your turn, you may attach 1 ${aN(a.aff, l)} Charge from your discard pile to 1 of your ${aN(a.aff, l, true)} creatures. Put 10 damage on that creature.` : `Uma vez durante o seu turno, você pode ligar 1 Carga ${aN(a.aff, l)} do seu descarte a 1 de suas criaturas ${aN(a.aff, l, true)}. Coloque 10 de dano nessa criatura.`,
    condA: (a, l) => l === 'en' ? `Once during your turn, if this creature is your Active, you may make the opponent’s Active ${cN(a.c, l)}.` : `Uma vez durante o seu turno, se esta criatura for o seu Ativo, você pode deixar o Ativo do oponente ${cN(a.c, l)}.`,
    swapA: (a, l) => l === 'en' ? 'Once during your turn, if this creature is in your Reserve, you may switch it with your Active.' : 'Uma vez durante o seu turno, se esta criatura estiver na Reserva, você pode trocá-la pelo seu Ativo.',
    searchA: (a, l) => l === 'en' ? 'Once during your turn, you may search your deck for 1 basic Charge and put it into your hand. Shuffle your deck.' : 'Uma vez durante o seu turno, você pode procurar no seu deck 1 Carga básica e colocá-la na mão. Embaralhe o deck.',
    moveA: (a, l) => l === 'en' ? 'Once during your turn, you may move 1 Charge from 1 of your creatures to another.' : 'Uma vez durante o seu turno, você pode mover 1 Carga de uma de suas criaturas para outra.',
    enterDraw: (a, l) => l === 'en' ? `When you play this creature from your hand to your Reserve, draw ${a.n} ${plCard(a.n, l)}.` : `Quando você jogar esta criatura da mão para a Reserva, compre ${a.n} ${plCard(a.n, l)}.`,
    enterSearch: (a, l) => l === 'en' ? 'When you play this creature from your hand to your Reserve, you may search your deck for 1 Awakened creature and put it into your hand. Shuffle your deck.' : 'Quando você jogar esta criatura da mão para a Reserva, você pode procurar no seu deck 1 criatura Desperta e colocá-la na mão. Embaralhe o deck.'
  };
  G.abilityText = (a, lang) => ABT[a.k](a, lang);
  G.ACTIVE_ABILITIES = ['drawA', 'healA', 'accelA', 'condA', 'swapA', 'searchA', 'moveA'];

  const EFT = {
    discardDraw: (f, l) => l === 'en' ? `Discard 1 other card from your hand. Then, draw ${f.n} cards.` : `Descarte 1 outra carta da sua mão. Depois, compre ${f.n} cartas.`,
    drawDiscard: (f, l) => l === 'en' ? `Draw ${f.n} cards. Then, discard 1 card from your hand.` : `Compre ${f.n} cartas. Depois, descarte 1 carta da sua mão.`,
    heal: (f, l) => (l === 'en' ? `Heal ${f.v} damage from 1 of your creatures.` : `Cure ${f.v} de dano de 1 de suas criaturas.`) + (f.cost === 'charge' ? (l === 'en' ? ' Then, discard 1 Charge from it.' : ' Depois, descarte 1 Carga dela.') : ''),
    healActive: (f, l) => l === 'en' ? `Heal ${f.v} damage from your Active.` : `Cure ${f.v} de dano do seu Ativo.`,
    healAll: (f, l) => l === 'en' ? `Heal ${f.v} damage from each of your creatures.` : `Cure ${f.v} de dano de cada uma de suas criaturas.`,
    cure: (f, l) => l === 'en' ? 'Remove all Conditions from your Active.' : 'Remova todas as Condições do seu Ativo.',
    revive: (f, l) => (l === 'en' ? 'Put 1 Awakened creature from your discard pile onto your Reserve.' : 'Coloque 1 criatura Desperta do seu descarte na sua Reserva.') + (f.charge ? (l === 'en' ? ' Then, attach 1 basic Charge from your discard pile to it.' : ' Depois, ligue a ela 1 Carga básica do seu descarte.') : ''),
    tempAtk: (f, l) => l === 'en' ? `During this turn, your Active’s attacks do ${f.v} more damage to the opponent’s Active.` : `Durante este turno, os ataques do seu Ativo causam ${f.v} a mais ao Ativo do oponente.`,
    attachDiscard: (f, l) => (l === 'en' ? `Attach up to ${f.n} basic ${plC(f.n, l)} from your discard pile to 1 of your creatures.` : `Ligue até ${f.n} ${plC(f.n, l)} básica${f.n > 1 ? 's' : ''} do seu descarte a 1 de suas criaturas.`) + (f.dmg ? (l === 'en' ? ` Put ${f.dmg} damage on that creature.` : ` Coloque ${f.dmg} de dano nessa criatura.`) : ''),
    spread: (f, l) => l === 'en' ? `Put ${f.v} damage on each of the opponent’s creatures.` : `Coloque ${f.v} de dano em cada criatura do oponente.`,
    recover: (f, l) => l === 'en' ? `Put up to ${f.n} creatures from your discard pile into your hand.` : `Coloque até ${f.n} criaturas do seu descarte na sua mão.`,
    discardOppRelic: (f, l) => l === 'en' ? 'Discard 1 Relic attached to 1 of the opponent’s creatures.' : 'Descarte 1 Relíquia ligada a 1 criatura do oponente.',
    searchAsc: (f, l) => l === 'en' ? 'Search your deck for 1 Ascended creature and put it into your hand. Shuffle your deck.' : 'Procure no seu deck 1 criatura Ascendida e coloque-a na mão. Embaralhe o deck.',
    sealOpp: (f, l) => l === 'en' ? 'During the opponent’s next turn, their Active can’t retreat.' : 'Durante o próximo turno do oponente, o Ativo dele não pode recuar.',
    draw: (f, l) => l === 'en' ? `Draw ${f.n} ${plCard(f.n, l)}.` : `Compre ${f.n} ${plCard(f.n, l)}.`,
    switchOwn: (f, l) => (l === 'en' ? 'Switch your Active with 1 of your Reserve creatures.' : 'Troque o seu Ativo por 1 criatura da sua Reserva.') + (f.heal ? (l === 'en' ? ` Heal ${f.heal} damage from the creature that moved to the Reserve.` : ` Cure ${f.heal} de dano da criatura que foi para a Reserva.`) : ''),
    searchBasic: (f, l) => f.to === 'bench' ? (l === 'en' ? 'Search your deck for 1 Awakened creature and put it onto your Reserve. Shuffle your deck.' : 'Procure no seu deck 1 criatura Desperta e coloque-a na sua Reserva. Embaralhe o deck.')
      : (l === 'en' ? 'Search your deck for 1 Awakened creature and put it into your hand. Shuffle your deck.' : 'Procure no seu deck 1 criatura Desperta e coloque-a na mão. Embaralhe o deck.'),
    tempShield: (f, l) => l === 'en' ? `During the opponent’s next turn, your Active takes ${f.v} less damage from attacks.` : `Durante o próximo turno do oponente, o seu Ativo sofre ${f.v} a menos de dano de ataques.`,
    stripOpp: (f, l) => (f.coin ? coinPre(l) : '') + (l === 'en' ? 'discard 1 Charge from the opponent’s Active.' : 'descarte 1 Carga do Ativo do oponente.'),
    condOpp: (f, l) => l === 'en' ? `The opponent’s Active is now ${cN(f.c, l)}.` : `O Ativo do oponente fica ${cN(f.c, l)}.`,
    gustOpp: (f, l) => l === 'en' ? 'Play only if you have more Souls left than the opponent. Switch the opponent’s Active with 1 of their Reserve creatures (your choice).' : 'Só pode ser jogada se você tiver mais Almas restantes que o oponente. Troque o Ativo do oponente por 1 criatura da Reserva dele, à sua escolha.',
    shuffleHands: (f, l) => l === 'en' ? `Each player shuffles their hand into their deck. You draw ${f.self} cards and the opponent draws ${f.opp}.` : `Cada jogador embaralha a mão no próprio deck. Você compra ${f.self} cartas e o oponente compra ${f.opp}.`,
    topLook: (f, l) => l === 'en' ? `Look at the top ${f.n} cards of your deck. Put 1 of them into your hand and shuffle the rest back.` : `Olhe as ${f.n} cartas do topo do seu deck. Coloque 1 delas na mão e embaralhe o resto de volta.`,
    searchCharge: (f, l) => l === 'en' ? `Search your deck for up to ${f.n} basic Charges and put them into your hand. Shuffle your deck.` : `Procure no seu deck até ${f.n} Cargas básicas e coloque-as na mão. Embaralhe o deck.`,
    bounceOwn: (f, l) => l === 'en' ? 'Return 1 of your Reserve creatures and all cards attached to it to your hand.' : 'Devolva 1 criatura da sua Reserva e todas as cartas ligadas a ela para a sua mão.',
    revealHand: (f, l) => l === 'en' ? 'Look at the opponent’s hand. Choose 1 card that is not a creature; the opponent discards it.' : 'Olhe a mão do oponente. Escolha 1 carta que não seja criatura; o oponente a descarta.',
    attachHandBench: (f, l) => l === 'en' ? 'Attach 1 basic Charge from your hand to 1 of your Reserve creatures.' : 'Ligue 1 Carga básica da sua mão a 1 criatura da sua Reserva.',
    recoverCharges: (f, l) => l === 'en' ? `Put up to ${f.n} basic Charges from your discard pile into your hand.` : `Coloque até ${f.n} Cargas básicas do seu descarte na sua mão.`,
    searchRelic: (f, l) => l === 'en' ? 'Search your deck for 1 Relic and put it into your hand. Shuffle your deck.' : 'Procure no seu deck 1 Relíquia e coloque-a na mão. Embaralhe o deck.',
    forceSwitchOpp: (f, l) => l === 'en' ? 'The opponent switches their Active with 1 of their Reserve creatures (their choice).' : 'O oponente troca o Ativo dele por 1 criatura da Reserva dele, à escolha dele.',
    drawTo: (f, l) => l === 'en' ? `Draw cards until you have ${f.n} cards in your hand.` : `Compre cartas até ter ${f.n} cartas na mão.`,
    moveCharge: (f, l) => l === 'en' ? 'Move 1 Charge from 1 of your creatures to another of your creatures.' : 'Mova 1 Carga de uma de suas criaturas para outra criatura sua.',
    tutor: (f, l) => l === 'en' ? 'Play only if you have at least 2 other cards in hand. Discard 2 cards from your hand. Then, search your deck for any 1 card and put it into your hand. Shuffle your deck.' : 'Só pode ser jogada se você tiver pelo menos 2 outras cartas na mão. Descarte 2 cartas da sua mão. Depois, procure no seu deck qualquer carta e coloque-a na mão. Embaralhe o deck.',
    discardGod: (f, l) => l === 'en' ? 'Discard the God in the Dominion.' : 'Descarte o Deus que está no Domínio.',
    // contínuos
    atkUp: (f, l) => l === 'en' ? `Attacks of your creatures do ${f.v} more damage to the opponent’s Active.` : `Os ataques das suas criaturas causam ${f.v} a mais ao Ativo do oponente.`,
    affAtkUp: (f, l) => l === 'en' ? `Attacks of your ${aN(f.aff, l, true)} creatures do ${f.v} more damage to the opponent’s Active.` : `Os ataques das suas criaturas ${aN(f.aff, l, true)} causam ${f.v} a mais ao Ativo do oponente.`,
    dmgDown: (f, l) => l === 'en' ? `Your creatures take ${f.v} less damage from attacks.` : `Suas criaturas sofrem ${f.v} a menos de dano de ataques.`,
    activeDmgDown: (f, l) => l === 'en' ? `Your Active takes ${f.v} less damage from attacks.` : `O seu Ativo sofre ${f.v} a menos de dano de ataques.`,
    healEnd: (f, l) => l === 'en' ? `At the end of each of your turns, heal ${f.v} damage from each of your creatures.` : `No fim de cada um dos seus turnos, cure ${f.v} de dano de cada uma de suas criaturas.`,
    drawExtra: (f, l) => l === 'en' ? 'At the start of each of your turns, draw 1 extra card.' : 'No início de cada um dos seus turnos, compre 1 carta extra.',
    condWard: (f, l) => l === 'en' ? 'Remove all Conditions from your creatures. Your creatures can’t be affected by Conditions.' : 'Remova as Condições das suas criaturas. Suas criaturas não podem ser afetadas por Condições.',
    retreatDown: (f, l) => l === 'en' ? 'Your Active’s Retreat cost is 1 less.' : 'O custo de Recuo do seu Ativo é 1 a menos.',
    benchGuard: (f, l) => l === 'en' ? 'Prevent all damage from attacks done to your Reserve creatures.' : 'Previna todo o dano de ataques causado às suas criaturas da Reserva.',
    koDraw: (f, l) => l === 'en' ? `Whenever 1 of your creatures is defeated, draw ${f.n} cards.` : `Sempre que uma criatura sua for derrotada, compre ${f.n} cartas.`,
    oppPing: (f, l) => l === 'en' ? `At the end of each of the opponent’s turns, put ${f.v} damage on their Active.` : `No fim de cada turno do oponente, coloque ${f.v} de dano no Ativo dele.`
  };
  G.effectText = function (card, lang) {
    const parts = card.fx.map((f) => { let s = EFT[f.t](f, lang); return s.charAt(0).toUpperCase() + s.slice(1); });
    let s = parts.join(' ');
    if (card.mode === 'cont') s += lang === 'en' ? ' (Lasts until the end of your next turn.)' : ' (Dura até o fim do seu próximo turno.)';
    return s;
  };

  const RLT = [
    ['only', (r, l) => l === 'en' ? `Can only be attached to ${aN(r.only, l)} creatures.` : `Só pode ser ligada a criaturas ${aN(r.only, l, true)}.`],
    ['onAttach', (r, l) => ({
      searchChargeAttach: l === 'en' ? 'When attached, search your deck for 1 basic Charge and attach it to this creature. Shuffle your deck.' : 'Ao ser ligada, procure no seu deck 1 Carga básica e ligue-a a esta criatura. Embaralhe o deck.',
      draw2: l === 'en' ? 'When attached, draw 2 cards.' : 'Ao ser ligada, compre 2 cartas.',
      cureHeal40: l === 'en' ? 'When attached, remove all Conditions from this creature and heal 40 damage from it.' : 'Ao ser ligada, remova as Condições desta criatura e cure 40 de dano dela.',
      topLook3: l === 'en' ? 'When attached, look at the top 3 cards of your deck, put 1 into your hand and shuffle the rest back.' : 'Ao ser ligada, olhe as 3 cartas do topo do seu deck, coloque 1 na mão e embaralhe o resto de volta.'
    })[r.onAttach]],
    ['hp', (r, l) => l === 'en' ? `This creature gets +${r.hp} HP.` : `Esta criatura recebe +${r.hp} PV.`],
    ['atkUp', (r, l) => l === 'en' ? `This creature’s attacks do ${r.atkUp} more damage to the opponent’s Active.` : `Os ataques desta criatura causam ${r.atkUp} a mais ao Ativo do oponente.`],
    ['atkDown', (r, l) => l === 'en' ? `This creature’s attacks do ${r.atkDown} less damage.` : `Os ataques desta criatura causam ${r.atkDown} a menos.`],
    ['raceAtk', (r, l) => l === 'en' ? `If this creature is a ${G.RACE[r.raceAtk.race].en}, its attacks do ${r.raceAtk.v} more damage to the opponent’s Active.` : `Se esta criatura for um ${G.RACE[r.raceAtk.race].pt}, seus ataques causam ${r.raceAtk.v} a mais ao Ativo do oponente.`],
    ['vsRace', (r, l) => l === 'en' ? `This creature’s attacks do ${r.vsRace.v} more damage to ${G.RACE_PL[r.vsRace.race].en}.` : `Os ataques desta criatura causam ${r.vsRace.v} a mais contra ${G.RACE_PL[r.vsRace.race].pt}.`],
    ['vsAff', (r, l) => l === 'en' ? `This creature’s attacks do ${r.vsAff.v} more damage to ${aN(r.vsAff.aff, l)} creatures.` : `Os ataques desta criatura causam ${r.vsAff.v} a mais contra criaturas ${aN(r.vsAff.aff, l, true)}.`],
    ['vsLegend', (r, l) => l === 'en' ? `This creature’s attacks do ${r.vsLegend} more damage to Legends.` : `Os ataques desta criatura causam ${r.vsLegend} a mais contra Lendas.`],
    ['vsDamaged', (r, l) => l === 'en' ? `This creature’s attacks do ${r.vsDamaged} more damage to an Active that already has damage.` : `Os ataques desta criatura causam ${r.vsDamaged} a mais contra um Ativo que já tenha dano.`],
    ['vsCond', (r, l) => r.vsCond ? (l === 'en' ? `This creature’s attacks do ${r.vsCond} more damage to an Active with a Condition.` : `Os ataques desta criatura causam ${r.vsCond} a mais contra um Ativo sob Condição.`) : ''],
    ['vsPoison', (r, l) => l === 'en' ? `This creature’s attacks do ${r.vsPoison} more damage to a Poisoned Active.` : `Os ataques desta criatura causam ${r.vsPoison} a mais contra um Ativo Envenenado.`],
    ['perDiscardCreature', (r, l) => l === 'en' ? `This creature’s attacks do ${r.perDiscardCreature.v} more damage for each creature in your discard pile (max +${r.perDiscardCreature.max}).` : `Os ataques desta criatura causam ${r.perDiscardCreature.v} a mais para cada criatura no seu descarte (máx. +${r.perDiscardCreature.max}).`],
    ['dr', (r, l) => l === 'en' ? `This creature takes ${r.dr} less damage from attacks.` : `Esta criatura sofre ${r.dr} a menos de dano de ataques.`],
    ['takeMore', (r, l) => l === 'en' ? `This creature takes ${r.takeMore} more damage from attacks.` : `Esta criatura sofre ${r.takeMore} a mais de dano de ataques.`],
    ['costDown', (r, l) => l === 'en' ? 'This creature’s attacks cost 1 Neutral Charge less.' : 'Os ataques desta criatura custam 1 Carga Neutra a menos.'],
    ['freeRetreat', (r, l) => l === 'en' ? 'This creature has no Retreat cost.' : 'Esta criatura não tem custo de Recuo.'],
    ['retreatDown', (r, l) => l === 'en' ? `This creature’s Retreat cost is ${r.retreatDown} less.` : `O custo de Recuo desta criatura é ${r.retreatDown} a menos.`],
    ['retreatHeal', (r, l) => l === 'en' ? `When this creature retreats, heal ${r.retreatHeal} damage from it.` : `Quando esta criatura recuar, cure ${r.retreatHeal} de dano dela.`],
    ['noRetreat', (r, l) => l === 'en' ? 'This creature can’t retreat.' : 'Esta criatura não pode recuar.'],
    ['thorns', (r, l) => l === 'en' ? `If this creature is your Active and takes damage from an attack, deal ${r.thorns} damage to the attacking creature.` : `Se esta criatura for o seu Ativo e sofrer dano de um ataque, cause ${r.thorns} de dano à criatura atacante.`],
    ['curse', (r, l) => l === 'en' ? `When this creature is defeated by an attack, put ${r.curse} damage on the attacking creature.` : `Quando esta criatura for derrotada por um ataque, coloque ${r.curse} de dano na criatura atacante.`],
    ['koDraw', (r, l) => l === 'en' ? `When this creature is defeated, its owner draws ${r.koDraw} cards.` : `Quando esta criatura for derrotada, seu dono compra ${r.koDraw} cartas.`],
    ['koReturn', (r, l) => l === 'en' ? 'When this creature is defeated, put the basic Charges attached to it into its owner’s hand.' : 'Quando esta criatura for derrotada, coloque as Cargas básicas ligadas a ela na mão do dono.'],
    ['koHandDisrupt', (r, l) => l === 'en' ? `When this creature is defeated by an attack, the attacker’s owner discards ${r.koHandDisrupt} random cards from their hand.` : `Quando esta criatura for derrotada por um ataque, o dono da criatura atacante descarta ${r.koHandDisrupt} cartas aleatórias da mão.`],
    ['extraPrize', (r, l) => l === 'en' ? 'When this creature is defeated, the opponent claims 1 extra Soul.' : 'Quando esta criatura for derrotada, o oponente pega 1 Alma adicional.'],
    ['legendPrizeReduce', (r, l) => l === 'en' ? 'If this creature is a Legend and is defeated, the opponent claims 1 fewer Soul.' : 'Se esta criatura for uma Lenda e for derrotada, o oponente pega 1 Alma a menos.'],
    ['condImmune', (r, l) => r.condImmune === 'all' ? (l === 'en' ? 'This creature can’t be affected by Conditions.' : 'Esta criatura não pode ser afetada por Condições.')
      : (l === 'en' ? `This creature can’t be ${r.condImmune.map((c) => cN(c, l)).join(' or ')}.` : `Esta criatura não pode ficar ${r.condImmune.map((c) => cN(c, l)).join(' nem ')}.`)],
    ['noHeal', (r, l) => l === 'en' ? 'This creature can’t be healed.' : 'Esta criatura não pode ser curada.'],
    ['regen', (r, l) => l === 'en' ? `Between Turns, heal ${r.regen} damage from this creature.` : `No Entre Turnos, cure ${r.regen} de dano desta criatura.`],
    ['elixir', (r, l) => l === 'en' ? `Between Turns, if this creature has ${r.elixir} or more damage, discard this Relic and heal ${r.elixir} damage from it.` : `No Entre Turnos, se esta criatura tiver ${r.elixir} ou mais de dano, descarte esta Relíquia e cure ${r.elixir} de dano dela.`],
    ['selfBurn', (r, l) => l === 'en' ? `At the end of each of your turns, put ${r.selfBurn} damage on this creature.` : `No fim de cada um dos seus turnos, coloque ${r.selfBurn} de dano nesta criatura.`],
    ['poisonOnAttack', (r, l) => l === 'en' ? 'After this creature attacks, the opponent’s Active is now Poisoned.' : 'Depois que esta criatura atacar, o Ativo do oponente fica Envenenado.'],
    ['tranceOnAttack', (r, l) => l === 'en' ? 'After this creature attacks, the opponent’s Active is now Entranced.' : 'Depois que esta criatura atacar, o Ativo do oponente fica Em Transe.'],
    ['tranceCoinOnAttack', (r, l) => l === 'en' ? 'After this creature attacks, flip a coin. If Sun, the opponent’s Active is now Entranced.' : 'Depois que esta criatura atacar, lance a moeda. Se der Sol, o Ativo do oponente fica Em Transe.'],
    ['healOnAttack', (r, l) => l === 'en' ? `After this creature attacks, heal ${r.healOnAttack} damage from it.` : `Depois que esta criatura atacar, cure ${r.healOnAttack} de dano dela.`],
    ['killDraw', (r, l) => l === 'en' ? `When this creature defeats an opponent’s creature with an attack, draw ${r.killDraw} cards.` : `Quando esta criatura derrotar uma criatura do oponente com um ataque, compre ${r.killDraw} cartas.`],
    ['killHealFull', (r, l) => l === 'en' ? 'When this creature defeats an opponent’s creature with an attack, heal all damage from it.' : 'Quando esta criatura derrotar uma criatura do oponente com um ataque, cure todo o dano dela.'],
    ['attachDraw', (r, l) => l === 'en' ? 'Once during your turn, when you attach a Charge from your hand to this creature, draw 1 card.' : 'Uma vez durante o seu turno, quando você ligar uma Carga da mão a esta criatura, compre 1 carta.'],
    ['drawOnHit', (r, l) => l === 'en' ? `When this creature takes damage from an attack and is not defeated, its owner draws ${r.drawOnHit} card.` : `Quando esta criatura sofrer dano de um ataque e não for derrotada, seu dono compra ${r.drawOnHit} carta.`],
    ['madnessOnHit', (r, l) => l === 'en' ? 'When this creature, as your Active, takes damage from an attack, the attacking creature is now Maddened.' : 'Quando esta criatura, como Ativo, sofrer dano de um ataque, a criatura atacante fica Enlouquecida.'],
    ['ignoreReduce', (r, l) => l === 'en' ? 'This creature’s attacks ignore Resistance and damage reductions on the opponent’s Active.' : 'Os ataques desta criatura ignoram Resistência e reduções de dano do Ativo do oponente.'],
    ['swapA', (r, l) => l === 'en' ? 'Once during your turn, if this creature is in your Reserve, you may switch it with your Active.' : 'Uma vez durante o seu turno, se esta criatura estiver na Reserva, você pode trocá-la pelo seu Ativo.'],
    ['lockOppRetreat', (r, l) => l === 'en' ? 'While this creature is your Active, the opponent’s Active can’t retreat.' : 'Enquanto esta criatura for o seu Ativo, o Ativo do oponente não pode recuar.'],
    ['benchAura', (r, l) => l === 'en' ? `While this creature is in your Reserve, your Active’s attacks do ${r.benchAura} more damage to the opponent’s Active.` : `Enquanto esta criatura estiver na sua Reserva, os ataques do seu Ativo causam ${r.benchAura} a mais ao Ativo do oponente.`]
  ];
  G.relicText = function (card, lang) {
    const r = card.r; const out = [];
    RLT.forEach(([k, fn]) => { if (r[k] !== undefined && r[k] !== false) { const s = fn(r, lang); if (s) out.push(s); } });
    return out.join(' ');
  };

  const GODT = {
    kragmor: (l) => l === 'en' ? 'Attacks of Ember creatures (of both players) do 10 more damage to the opposing Active.' : 'Os ataques de criaturas Ígneas (de ambos os jogadores) causam 10 a mais ao Ativo adversário.',
    aurelia: (l) => l === 'en' ? 'Between Turns, heal 10 damage from each Sacred creature in play (both players).' : 'No Entre Turnos, cure 10 de dano de cada criatura Sagrada em jogo (de ambos os jogadores).',
    morvath: (l) => l === 'en' ? 'Whenever an attack of an Occult creature (of either player) does damage, heal 20 damage from the attacking creature.' : 'Sempre que o ataque de uma criatura Oculta (de qualquer jogador) causar dano, cure 20 de dano da criatura atacante.',
    sylvarok: (l) => l === 'en' ? 'Primal creatures (of both players) take 20 less damage from attacks.' : 'Criaturas Primais (de ambos os jogadores) sofrem 20 a menos de dano de ataques.',
    nyxara: (l) => l === 'en' ? 'Once during each player’s turn, that player may attach 1 extra Storm Charge from their hand to 1 of their Storm creatures.' : 'Uma vez durante o turno de cada jogador, ele pode ligar 1 Carga Energética extra da mão a 1 de suas criaturas Energéticas.'
  };
  G.godText = (card, lang) => GODT[card.god](lang) + (lang === 'en' ? ' Only one God reigns in the Dominion: a new God replaces the old one.' : ' Apenas um Deus reina no Domínio: um novo Deus substitui o anterior.');

  const ACT = {
    swapDraw: (l) => l === 'en' ? 'Switch your Active with 1 of your Reserve creatures. Then, draw 2 cards.' : 'Troque o seu Ativo por 1 criatura da sua Reserva. Depois, compre 2 cartas.',
    seal: (l) => l === 'en' ? 'Switch the opponent’s Active with 1 of their Reserve creatures (your choice). During their next turn, the new Active can’t retreat.' : 'Troque o Ativo do oponente por 1 criatura da Reserva dele, à sua escolha. Durante o próximo turno dele, o novo Ativo não pode recuar.',
    sacrifice: (l) => l === 'en' ? 'Put 1 of your Reserve creatures and the cards attached to it into your discard pile (the opponent claims no Soul). Move up to 2 basic Charges from it to another of your creatures, then draw 3 cards.' : 'Coloque 1 criatura da sua Reserva e as cartas ligadas a ela no descarte (o oponente não pega Alma). Mova até 2 Cargas básicas dela para outra criatura sua e compre 3 cartas.',
    draw3: (l) => l === 'en' ? 'Draw 3 cards.' : 'Compre 3 cartas.',
    reshuffle6: (l) => l === 'en' ? 'Shuffle your hand into your deck. Then, draw 6 cards.' : 'Embaralhe sua mão no deck. Depois, compre 6 cartas.'
  };
  G.actionText = (card, lang) => ACT[card.act](lang) + (lang === 'en' ? ' (Only 1 Action per turn.)' : ' (Apenas 1 Ação por turno.)');

  const MKT = {
    life: (l) => l === 'en' ? 'Heal 30 damage from 1 of your creatures.' : 'Cure 30 de dano de 1 de suas criaturas.',
    mana: (l) => l === 'en' ? 'Attach 1 basic Charge from your discard pile to 1 of your creatures.' : 'Ligue 1 Carga básica do seu descarte a 1 de suas criaturas.',
    force: (l) => l === 'en' ? 'Your Active’s next attack does 20 more damage (until the end of your next turn).' : 'O próximo ataque do seu Ativo causa 20 a mais (até o fim do seu próximo turno).',
    luck: (l) => l === 'en' ? 'Draw 1 additional card.' : 'Compre 1 carta adicional.',
    guard: (l) => l === 'en' ? 'The next time your Active takes damage from an attack, reduce it by 30 (until the end of the opponent’s next turn).' : 'Na próxima vez que o seu Ativo sofrer dano de um ataque, reduza-o em 30 (até o fim do próximo turno do oponente).'
  };
  G.markerText = (card, lang) => (lang === 'en' ? 'When this card enters your hand, it activates: ' : 'Quando esta carta entrar na sua mão, ela é ativada: ') + MKT[card.mk](lang) + (lang === 'en' ? ' Then discard it and draw 1 card.' : ' Depois descarte-a e compre 1 carta.');

  G.chargeText = (card, lang) => card.aff === 'neu'
    ? (lang === 'en' ? 'Pays 1 Neutral cost. When attached to a Primal creature, heal 10 damage from it.' : 'Paga 1 custo Neutro. Quando ligada a uma criatura Primal, cure 10 de dano dela.')
    : (lang === 'en' ? `Pays 1 ${aN(card.aff, lang)} cost or 1 Neutral cost.` : `Paga 1 custo ${aN(card.aff, lang)} ou 1 custo Neutro.`);

  G.cardText = function (c, lang) {
    switch (c.kind) {
      case 'effect': return G.effectText(c, lang);
      case 'relic': return G.relicText(c, lang);
      case 'god': return G.godText(c, lang);
      case 'action': return G.actionText(c, lang);
      case 'marker': return G.markerText(c, lang);
      case 'charge': return G.chargeText(c, lang);
      default: return '';
    }
  };

  // Limites de cópia por carta no deck
  G.copyLimit = function (c) {
    if (c.kind === 'charge') return 99;
    if (c.legend) return 2;
    if (c.kind === 'god') return 2;
    return 3;
  };
  G.isBasicCreature = (c) => c.kind === 'creature' && c.stage === 0;
  G.ascensionsOf = (id) => { const b = (CARDS[id] && CARDS[id].variantOf) || id; return ORDER.filter((k) => CARDS[k].from === b); };

  // Poder estimado (para IA montar decks e para dicas)
  G.cardPower = function (c) {
    if (c.kind === 'creature') {
      let best = 0;
      c.attacks.forEach((a) => {
        let d = a.dmg;
        a.fx.forEach((f) => {
          if (f.t === 'coins') d += f.n * f.v * 0.5; if (f.t === 'coinPlus') d += f.v * 0.5; if (f.t === 'vsCond' || f.t === 'vsDamaged') d += f.v * 0.4;
          if (f.t === 'cond') d += f.coin ? 6 : 12; if (f.t === 'benchHit') d += f.all ? f.v * 1.5 : f.v * 0.8; if (f.t === 'healSelf' || f.t === 'healTeam') d += f.v * 0.5;
          if (f.t === 'recoil') d -= f.v * 0.5; if (f.t === 'exhaust') d -= 25; if (f.t === 'discardSelf') d -= f.n * 12; if (f.t === 'tag') d += f.v * 0.6;
          if (f.t === 'perBench') d += f.v * 1.8; if (f.t === 'perCharge') d += f.v * 3; if (f.t === 'perDmg') d += f.v * 3; if (f.t === 'seal') d += 6;
          if (f.t === 'switchSelf' || f.t === 'forceSwitch') d += 8; if (f.t === 'weaken' || f.t === 'expose') d += f.v * 0.6; if (f.t === 'guard') d += f.v * 0.4; if (f.t === 'handDisrupt') d += 8; if (f.t === 'stripOpp') d += 10;
        });
        if (a.snipe) d += 10;
        const eff = d / Math.max(1, a.cost.length);
        best = Math.max(best, eff + d * 0.15);
      });
      let p = best + c.hp / 6 - c.ret * 3 + (c.ab ? 10 : 0);
      if (c.legend) p += 8; if (c.stage === 1) p += 6;
      return Math.round(p);
    }
    const base = { C: 18, U: 22, R: 27, E: 31, L: 34 }[c.rarity] || 20;
    return base;
  };
})(typeof window !== 'undefined' ? window : globalThis);
