/* Almas de Orvalon — Quintessências: a Roda dos Cinco (runas passivas por deck) */
(function (root) {
  const G = root.G; const L = (pt, en) => ({ pt, en });
  // tier: 1 = Menor (1), 2 = Maior (3), 3 = Quintessência (6). k = efeito lido pelo motor.
  const R = (id, branch, tier, k, n, d) => ({ id, branch, tier, k, cost: [0, 1, 3, 6][tier], name: L(n[0], n[1]), desc: L(d[0], d[1]) });
  const LIST = [
    R('ign_m1', 'ign', 1, 'burnFirst', ['Brasa Latente', 'Smoldering Ember'], ['A primeira Queimadura no oponente causa +10.', 'The first Burn on the opponent deals +10.']),
    R('ign_m2', 'ign', 1, 'firstStrike', ['Fagulha de Guerra', 'Spark of War'], ['O primeiro ataque da partida causa +10.', 'The first attack of the match deals +10.']),
    R('ign_M1', 'ign', 2, 'vsBurn', ['Fúria da Forja', 'Forge Fury'], ['Ataques contra criaturas Queimadas causam +10.', 'Attacks against Burned creatures deal +10.']),
    R('ign_M2', 'ign', 2, 'veng', ['Cinzas Vingativas', 'Vengeful Ashes'], ['Quando uma criatura sua cai pela primeira vez, seu próximo ataque causa +20.', 'The first time one of your creatures falls, your next attack deals +20.']),
    R('ign_Q', 'ign', 3, 'burnAll', ['Coração do Vulcão', 'Heart of the Volcano'], ['Toda Queimadura no oponente causa +10.', 'Every Burn on the opponent deals +10.']),
    R('sac_m1', 'sac', 1, 'healFirst', ['Vigília', 'Vigil'], ['A primeira cura da partida cura +10.', 'The first heal of the match heals +10.']),
    R('sac_m2', 'sac', 1, 'prayer', ['Prece da Aurora', 'Dawn Prayer'], ['No seu segundo turno, cure 10 do seu Ativo.', 'On your second turn, heal 10 from your Active.']),
    R('sac_M1', 'sac', 2, 'shieldFirst', ['Escudo Juramentado', 'Sworn Shield'], ['O primeiro ataque que suas criaturas sofrem causa −10.', 'The first attack your creatures take deals −10.']),
    R('sac_M2', 'sac', 2, 'grace', ['Graça', 'Grace'], ['Na primeira vez que o oponente pega uma Alma sua, cure 20 do seu Ativo.', 'The first time the opponent takes one of your Souls, heal 20 from your Active.']),
    R('sac_Q', 'sac', 3, 'dawn', ['Aurora Eterna', 'Eternal Dawn'], ['No início do seu turno, cure 10 do seu Ativo se ele tiver 50 ou mais de dano (até 2 vezes por partida).', 'At the start of your turn, heal 10 from your Active if it has 50 or more damage (up to 2 times per match).']),
    R('occ_m1', 'occ', 1, 'poisonFirst', ['Sussurro Peçonhento', 'Venomous Whisper'], ['O primeiro Veneno no oponente causa +10.', 'The first Poison on the opponent deals +10.']),
    R('occ_m2', 'occ', 1, 'veil', ['Véu', 'Veil'], ['Enquanto seu Ativo estiver sem dano, ele recebe −10.', 'While your Active is undamaged, it takes −10.']),
    R('occ_M1', 'occ', 2, 'lossDraw', ['Eco Sombrio', 'Shadow Echo'], ['Na primeira vez que o oponente pega uma Alma sua, compre 1 carta.', 'The first time the opponent takes one of your Souls, draw 1 card.']),
    R('occ_M2', 'occ', 2, 'pact', ['Pacto de Sangue', 'Blood Pact'], ['Quando seu atacante derrota uma criatura, cure 20 dele.', 'When your attacker defeats a creature, heal 20 from it.']),
    R('occ_Q', 'occ', 3, 'reap', ['Ceifa', 'Reaping'], ['Cada criatura que você derrota com um ataque te dá 1 carta.', 'Each creature you defeat with an attack draws you 1 card.']),
    R('ene_m1', 'ene', 1, 'spark', ['Faísca', 'Spark'], ['No seu primeiro turno, compre 1 carta extra.', 'On your first turn, draw 1 extra card.']),
    R('ene_m2', 'ene', 1, 'freeRetreat', ['Condutor', 'Conductor'], ['O primeiro Recuo da partida não custa Cargas.', 'Your first Retreat of the match costs no Charges.']),
    R('ene_M1', 'ene', 2, 'surge', ['Sobrecarga', 'Overload'], ['No seu segundo turno, compre 1 carta extra.', 'On your second turn, draw 1 extra card.']),
    R('ene_M2', 'ene', 2, 'charged', ['Para-raios', 'Lightning Rod'], ['O primeiro ataque da partida com 4 ou mais Cargas no atacante causa +20.', 'The first attack of the match with 4 or more Charges on the attacker deals +20.']),
    R('ene_Q', 'ene', 3, 'storm', ['Tempestade Viva', 'Living Storm'], ['Ataques causam +10 quando o atacante tem 5 ou mais Cargas.', 'Attacks deal +10 when the attacker has 5 or more Charges.']),
    R('pri_m1', 'pri', 1, 'sap', ['Seiva', 'Sap'], ['No primeiro Entre Turnos em que seu Ativo tiver dano, cure 10 dele.', 'On the first Between Turns your Active is damaged, heal 10 from it.']),
    R('pri_m2', 'pri', 1, 'instinct', ['Instinto', 'Instinct'], ['Na primeira vez que você coloca uma criatura na Reserva, compre 1 carta.', 'The first time you put a creature in the Reserve, draw 1 card.']),
    R('pri_M1', 'pri', 2, 'roots', ['Raízes Profundas', 'Deep Roots'], ['Com a Reserva cheia (4), Veneno e Queimadura no seu Ativo causam −10.', 'With a full Reserve (4), Poison and Burn on your Active deal −10.']),
    R('pri_M2', 'pri', 2, 'pack', ['Matilha', 'Pack'], ['Ataques causam +10 se você tem mais criaturas em jogo que o oponente.', 'Attacks deal +10 if you have more creatures in play than the opponent.']),
    R('pri_Q', 'pri', 3, 'packKing', ['Rei da Matilha', 'Pack King'], ['Na primeira vez que sua Reserva fica cheia (4), compre 2 cartas.', 'The first time your Reserve becomes full (4), draw 2 cards.']),
    R('neu_m1', 'neu', 1, 'harvest', ['Colheita de Almas', 'Soul Harvest'], ['Ao pegar sua primeira Alma, compre 1 carta.', 'When you take your first Soul, draw 1 card.']),
    R('neu_m2', 'neu', 1, 'cleanse', ['Reflexo', 'Reflex'], ['A primeira Condição no seu Ativo termina no Entre Turnos.', 'The first Condition on your Active ends at Between Turns.']),
    R('neu_Q', 'neu', 3, 'crown', ['Coroa de Cinzas', 'Crown of Ashes'], ['Ao derrotar uma Lenda, compre 2 cartas.', 'When you defeat a Legend, draw 2 cards.'])
  ];
  G.RUNES = {}; LIST.forEach((r) => { G.RUNES[r.id] = r; });
  G.RUNE_LIST = LIST;
  G.RUNE_BRANCH = { ign: { god: L('Kragmor', 'Kragmor') }, sac: { god: L('Aurelia', 'Aurelia') }, occ: { god: L('Morvath', 'Morvath') }, ene: { god: L('Nyxara', 'Nyxara') }, pri: { god: L('Sylvarok', 'Sylvarok') }, neu: { god: L('Anel Central', 'Central Ring') } };
  G.RUNE_BUDGET = 12;
  G.runeKeys = (ids) => { const o = {}; (ids || []).forEach((id) => { const r = G.RUNES[id]; if (r) o[r.k] = 1; }); return o; };
  // páginas prontas da IA por arquétipo (12 pontos cada)
  G.AI_RUNES = {}; ['ign', 'sac', 'occ', 'ene', 'pri'].forEach((a) => { G.AI_RUNES[a] = [a + '_Q', a + '_M1', a + '_m1', a + '_m2']; });
})(typeof window !== 'undefined' ? window : globalThis);
