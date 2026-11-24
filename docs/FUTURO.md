# Almas de Orvalon — Quintessências, Campeonato e Perícia

**Status: implementado na versão 1.5.0.** As seções abaixo seguem o desenho original, com notas sobre o que mudou na implementação.

---

## 1. Quintessências (árvore de runas)

### Conceito
Inspirada nas runas e quintessências do League of Legends. O jogador encontra **Essências Primordiais** raramente durante as partidas e as usa para gravar **Runas** numa grande árvore circular, a **Roda dos Cinco**. Cada página de runas é ligada a um deck e dá a ele efeitos passivos pequenos, mas que definem identidade.

### Obtenção (rara de propósito)
| Fonte | Chance |
|---|---|
| Vitória ranqueada | 10% (1 essência) |
| Vitória em Duelo | 3% |
| Derrotar uma Lenda inimiga | +5% naquela partida |
| Marco do Calendário (luas 14 e 28) | 1 essência garantida |
| Campeonato (top 8) | 2 a 5 essências |


### A Roda dos Cinco
- Cinco ramos, um por Deus (Kragmor/Ígnea, Aurelia/Sagrada, Morvath/Oculta, Nyxara/Energética, Sylvarok/Primal), e um anel central neutro.
- Cada ramo tem 3 camadas: **Menores** (1 essência), **Maiores** (3 essências) e uma **Quintessência** (6 essências, só uma ativa por página).
- Cada página tem um orçamento de **12 pontos**, para forçar escolhas. O jogador pode ter até 3 páginas.
- Antes do primeiro uso, uma tela de explicação (estilo grimório) apresenta o sistema em 4 quadros.

### Exemplos de runas (o equilíbrio deve ser testado com scripts/sim-all.js)
| Runa | Ramo | Efeito |
|---|---|---|
| Brasa Latente | Ígnea, menor | Queimadura causa +10 na primeira vez em cada partida |
| Vigília | Sagrada, menor | A primeira cura da partida cura +10 |
| Eco Sombrio | Oculta, maior | Ao perder uma Alma, olhe as 2 cartas do topo e reordene |
| Sobrecarga | Energética, maior | A primeira Carga ligada no turno 1 conta em dobro (1x por partida) |
| Raízes Profundas | Primal, maior | Reserva com 4 criaturas: o Ativo recebe −10 de dano |
| **Coroa de Cinzas** | Quintessência | Ao derrotar uma Lenda, compre 2 cartas |

Regra de ouro: nenhuma runa deve mudar mais de cerca de 2% a taxa de vitória de um deck nas simulações.

**Na implementação (1.5.0):** a Roda tem 28 runas (4 por ramo + Quintessência, e o Anel Central com 2 menores + Coroa de Cinzas). A lista completa está em `www/js/data/runes.js`. A medição é feita com `node scripts/sim-runes.js [jogos] [runas]`, que joga o mesmo deck dos dois lados, alternando quem começa, e compara a mesma partida com e sem runas. Como bônus de dano constantes mostraram impacto alto (um +10/−10 muda quantos golpes uma criatura aguenta), as runas foram recalibradas para efeitos condicionais ou de uso único. Com isso, uma página completa da IA fica entre −3% e +3%. *Eco Sombrio* virou "compre 1 carta" (reordenar o topo exigiria uma escolha interativa), e *Sobrecarga* virou "compre 1 carta no 2º turno".

### Dados
```js
profile.essences = 0;
profile.runePages = [{ id, name, deckId, runes: ['ign_m1', 'sac_m2', ...], quint: 'q_coroa' }];
G.RUNES = { ign_m1: { branch: 'ign', tier: 1, cost: 1, name, desc, hook: 'onBurn', fx: {...} } };
```
O motor ganha ganchos (`onStart`, `onAttach`, `onKO`, `onPrizeLost`, `onHeal`, `onBurn`) que leem a página do deck do jogador. A IA recebe páginas pré-montadas por arquétipo.

---

## 2. Modo Campeonato

### Camadas por Elo
Cada Elo (Pedra a Lendário) tem três faixas, visíveis no Ranking:

| Faixa | Quem entra |
|---|---|
| **Pro Tier** | Top 64 daquele Elo no fechamento das inscrições |
| **Mid Tier** | Do 65º ao 128º |
| **Bottom Tier** | Do 129º ao 192º |
| *Não classificado* | Abaixo disso (não participa) |

O Ranking ganha abas por Elo e mostra uma linha divisória entre as camadas.

### Formato
- Chave eliminatória de **64 competidores** (6 rodadas).
- Cada confronto é uma **melhor de 3**, e o jogador pode trocar de deck entre as partidas do confronto.
- **Um embate por dia** (rodada 1 no dia 1, final no dia 6), seguindo o **Calendário** (**já existe**: `G.Prog.events()` lista eventos datados, e o Calendário tem a seção "Eventos do ciclo").
- Um torneio por semana: inscrições no domingo e na segunda, rodadas de segunda a sábado.
- Quem não joga a rodada do dia até a meia-noite perde por W.O. Os adversários são CPUs com o nível do Elo (G.Prog.oppSkill) e nomes do ranking fictício.

### Recompensas
| Resultado | Prêmio |
|---|---|
| Campeão | Troféu do torneio + 2.000 de Essência + 5 Essências Primordiais |
| Finalista | Troféu de prata + 1.000 + 3 |
| Semifinal | 500 + 2 |
| Quartas | 250 + 1 |

### Troféus no perfil
Uma estante de troféus fica abaixo do painel de Elo (**já existe**: painel de Elo detalhado). Cada troféu guarda o nome do torneio, o ciclo, a faixa, o Elo e o deck usado na final.

### Dados
```js
profile.tournaments = { active: { id, tier: 'mid', bracket: [...64], round: 0, matches: [{ opp, games: [w, l, ...], deckIds: [] }] }, history: [] };
profile.trophies = [{ id, cup: 'cup_blood', place: 1, tier: 'mid', rank: 'Ouro', cycle: 3, deck: [...] }];
```

---

## 3. Perícia (maestria por personagem)

### Como cresce
Os pontos vêm de jogar com o personagem e de vencer com ele:

```
pontos = jogos × 2 + vitórias × 5 + nocautes × 4 − quedas × 1   (mínimo 0)
```

A coleta já começou: **já existe**. Desde a 1.4, cada partida registra, por personagem (variantes contam para a versão base), `plays`, `wins`, `kos` (nocautes causados por ele) e `falls` (vezes em que caiu), em `profile.mastery`. Assim, quem joga hoje já terá progresso quando a Perícia chegar.

### Os quatro níveis
| Nível | Pontos | Recompensa |
|---|---|---|
| **I. Iniciado** | 40 | Moldura de bronze no retrato do personagem |
| **II. Veterano** | 150 | Título "Veterano de {nome}" e +50 de Essência |
| **III. Mestre** | 400 | Moldura de prata animada + versão da carta com assinatura dourada |
| **IV. Lenda Viva** | 1.000 | Moldura de chama da afinidade, título lendário e entrada do personagem no versus |

### Onde aparece
- Na coleção, um selo pequeno no canto da carta com o nível.
- No zoom da carta, a barra de progresso com as estatísticas (jogos, vitórias, nocautes, quedas).
- No perfil, uma aba "Perícias" com os 5 personagens de maior pontuação.
- No versus, o personagem com maior Perícia no deck aparece ao lado do avatar.

A Perícia é puramente cosmética e de prestígio: não dá vantagem de jogo.

## 4. Builds de Linux DEB
Devem possuir ícone e uma descrição maior.

**Na implementação (1.5.0):** ícones de 16 a 1024 px em `resources/icons`, descrição longa, categoria Games e entrada de menu com comentário e palavras-chave.
