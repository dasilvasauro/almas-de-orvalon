# Almas de Orvalon

Jogo de cartas colecionáveis offline, com a jogabilidade central do Pokémon TCG (Ativo + Reserva, Cargas, Almas como prêmios, Fraquezas, Condições, Ascensão) e temática de fantasia sombria. Disponível em **português (Brasil)** e **inglês**. Roda no Android (Capacitor), no Linux/Windows/macOS (Electron) e em qualquer navegador.



## Novidades da 1.5.0
- **Quintessências (Roda dos Cinco):** 28 runas em 5 ramos e um anel central, 3 páginas de 12 pontos ligadas a decks, grimório explicativo e Essências Primordiais raras. A IA usa páginas do arquétipo dela quando você usa runas. O equilíbrio foi medido com `scripts/sim-runes.js`.
- **Campeonato:** um torneio por semana, com chave de 64 por faixa do Elo (Pro, Mid e Bottom Tier), melhor de 3 com troca de deck, um embate por dia, W.O. e troféus no perfil. O Ranking ganhou abas por Elo com as faixas.
- **Perícia:** quatro níveis por personagem (Iniciado, Veterano, Mestre e Lenda Viva), com selo e moldura nas cartas, assinatura dourada, títulos, painel no perfil e destaque no versus.
- **Calendário:** as oferendas não dão mais selos, apenas Essência, fragmentos e Essências Primordiais.
- **Correção:** a mão não "abre e fecha" mais. As cartas agora são reaproveitadas, em vez de recriadas a cada atualização.
- **Linux:** o .deb tem ícones em todos os tamanhos e descrição completa.

## Novidades da 1.4.0
- **Desempenho no Android:** zoom de texto travado em 100% (corrige a escala quebrada), aceleração por hardware, modo gráfico "Equilibrado" por padrão no APK e artes pré-carregadas e mantidas em memória durante o duelo.
- **Áudio:** trilhas pré-renderizadas em loop (sem síntese em tempo real) e pausa automática ao bloquear a tela.
- **Correções:** Desistir, Deletar deck e Apagar progresso (o diálogo de confirmação sempre respondia "não"); Furtar agora move a Carga de verdade; a mão não "abre e fecha" mais ao comprar.
- **Conteúdo:** 18 facções nas cartas, nomes revisados, Crônicas da Ruptura, Calendário do Ciclo das Luas e eventos datados.
- **Visual:** molduras ornamentadas, título animado, gradiente no lugar de partículas, versus vertical no celular, boosters com vinheta e abertura realista, carregamento lento com zoom e 4 níveis gráficos (Leve, Equilibrado, Alto, Ultra).
- **Duelo:** animações por estilo de personagem (flechas, tiros, orbes nas cores da arte, golpes com onda de choque, garras e cortes por afinidade), seleção de alvo no tabuleiro e pulverização ao destruir.
- **Atualizar o APK sem desinstalar:** a partir desta versão, o APK de teste usa uma chave fixa (`resources/android/debug.keystore`, só para testes) e a versão segue o `package.json`. Na primeira vez, desinstale o APK antigo; depois as atualizações instalam por cima.
- **Cópia de segurança:** Opções → Exportar/Importar progresso (código `ORV1:`).
- **Trilhas salvas no aparelho:** cada música é renderizada uma única vez (em segundo plano, nos menus) e fica guardada; depois carrega na hora.
- **Próximas features:** veja [docs/FUTURO.md](docs/FUTURO.md) (Quintessências, Campeonatos e Perícia).

## O que tem no jogo

- **315 cartas** com artes próprias, todas com nome, subtítulo e texto originais: 95 criaturas + 95 versões alternativas, 55 Efeitos, 50 Relíquias, 5 Deuses, 5 Ações, 5 Marcadores e 5 Cargas. Cada tipo de carta tem uma cor de moldura diferente.
- **Lore**: o reino de Orvalon e suas 7 regiões. Cada criatura pertence a uma delas.
- **Modos**: Coliseu das Almas (ranqueado), Duelo (partida rápida), Treino (os dois lados no mesmo aparelho), Treino Avançado (com Mentor que sugere e explica cada jogada) e Espectador (IA contra IA, com velocidade ajustável, pausa e análise dos decks).
- **Tutorial** com 14 capítulos e jogadas de exemplo, mais o livro de regras completo em `docs/`.
- **Construtor de decks** que analisa o estilo do deck (ofensivo, arcano, resiliente, controle, ágil ou equilibrado) e dá dicas.
- **Boosters** com animação de abertura e uma Lendária garantida a cada 20 boosters. O jogador começa com 1 deck inicial e 3 boosters.
- **Progressão**: níveis, Elos (de Pedra a Lendário), reputação, estilo de jogo, 357 conquistas e ranking diário com 420 Invocadores fictícios.
- **IA** que acompanha o seu nível na maioria das partidas e, de vez em quando, joga um pouco melhor ou pior que você.
- **Áudio** procedural: cartas, cortes, sangue, gritos, coro, sinos e tambores. A trilha usa pads etéreos.
- **Ambientação**: 6 arenas que mudam o tema do tabuleiro e partículas nos menus.

## Publicar no GitHub (APK automático + PWA no Pages)

O projeto já vem com o repositório Git iniciado e três workflows em `.github/workflows/`:

- **Android APK**: a cada push na `main`, gera o APK de teste (aba **Actions** → execução → artefato `almas-de-orvalon-apk`).
- **PWA (GitHub Pages)**: publica a pasta `www` como app instalável e jogável offline.
- **Linux**: gera AppImage e .deb (manual ou ao criar uma tag).

Passo a passo:

1. Crie um repositório **vazio** no GitHub (sem README), por exemplo `almas-de-orvalon`.
2. Dentro da pasta do projeto:
   ```
   git remote add origin https://github.com/SEU_USUARIO/almas-de-orvalon.git
   git push -u origin main
   ```
3. Em **Settings → Pages**, escolha **Source: GitHub Actions**. O jogo fica em `https://SEU_USUARIO.github.io/almas-de-orvalon/`. No celular, abra o link e use "Adicionar à tela inicial" para instalar o PWA.
4. O APK aparece em **Actions → Android APK → Artifacts** (é um .zip com o `.apk` dentro; no celular, permita instalar de fontes desconhecidas).
5. Para lançar uma versão: `git tag v1.3.0 && git push --tags`. Os workflows criam uma **Release** com APK, AppImage e .deb.

APK assinado para distribuição (opcional): crie uma chave e cadastre os secrets em **Settings → Secrets and variables → Actions**:
```
keytool -genkey -v -keystore release.jks -alias orvalon -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks   # conteúdo do secret ANDROID_KEYSTORE_BASE64
```
Outros secrets: `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (ex.: `orvalon`), `ANDROID_KEY_PASSWORD`. Guarde o `release.jks`: ele é necessário para todas as atualizações futuras do app.

## Jogar agora (navegador)

Abra `dist/almas-de-orvalon.html` (arquivo único, tudo embutido) ou rode:

```
npm start        # serve a pasta www em http://localhost:8080
```

O progresso fica salvo no `localStorage` do navegador ou do aplicativo.

## Android (APK)

Requisitos: Node 20+, Android Studio e JDK 21.

```
npm install
npm run android:setup     # cria o projeto Android, trava em retrato e sincroniza
npm run android:icons     # opcional: gera ícone e splash a partir de resources/
npm run android:open      # abre no Android Studio (Build > Build APK)
# ou, direto no terminal:
npm run android:apk       # APK em android/app/build/outputs/apk/debug/
```

Para liberar a rotação em tablets, rode o setup com `ORVALON_FREE_ORIENTATION=1`. Depois de editar arquivos em `www/`, rode `npm run android:sync`.

## Linux (desktop)

```
npm install
npm run desktop           # roda em janela (F11 = tela cheia)
npm run linux:build       # gera AppImage e .deb em dist/
```

### Sobre a sandbox no Linux

Ubuntu 23.10+, 24.04 e Mint 22 restringem user namespaces pelo AppArmor, e um AppImage não consegue usar a sandbox SUID do Chromium. O lançador do jogo detecta isso e abre com `--no-sandbox` automaticamente; o jogo só carrega arquivos locais e bloqueia janelas novas e navegação externa. O `.deb` (`sudo apt install ./almas-de-orvalon_1.3.0_amd64.deb`) instala em `/opt`, cria atalho no menu e configura a sandbox SUID em sistemas sem user namespaces; nos sistemas com a restrição do AppArmor, o mesmo lançador cai para `--no-sandbox`. Para sandbox completa nesses sistemas, crie um perfil AppArmor liberando `userns` para `/opt/Almas de Orvalon/almas-de-orvalon.bin`. Para forçar o modo sem sandbox: `ORVALON_NO_SANDBOX=1`.

## Estrutura

```
www/                 o jogo (HTML/CSS/JS puro, sem build)
  js/core/           util, motor de regras, IA, áudio, partículas, progressão
  js/data/           cartas + lore, textos pt/en, tutorial
  js/ui/             renderização de cartas, telas, tabuleiro de duelo
  assets/cards/      195 artes recortadas (WebP)
  assets/audio/      sons personalizados opcionais (veja LEIA-ME.txt)
electron/            janela desktop
scripts/             build de arquivo único, docs, setup Android, simulador
docs/                REGRAS.md, RULES.md, CARTAS.md (gerados dos dados)
resources/           ícone e splash
```

## Personalizar

- **Sons reais**: coloque arquivos em `www/assets/audio/` e liste-os em `manifest.json`. Cada som listado substitui o sintetizado.
- **Cartas**: edite `www/js/data/cards.js`. O texto de regras é gerado a partir das mesmas primitivas que o motor executa, então o texto da carta nunca diverge do comportamento. Depois rode `npm run docs` e `npm run test:sim`.

## Equilíbrio

`npm run test:sim` simula 900 partidas entre IAs, com decks sorteados entre as 5 afinidades puras e as 20 duplas (como os oponentes do jogo). Versão 1.2.0: Ígnea 55.2%, Sagrada 49.7%, Oculta 46.5%, Energética 47.2%, Primal 51.4%; 16.5% dos KOs em um único golpe (era 42,7% na 1.0); quem começa vence 53.1%; média de 22.2 turnos; nenhum erro de regra.

## Novidades da 1.3.0

- Mão em arco que sempre cabe na tela; deslize o dedo (ou o mouse) sobre a mão para erguer a carta desejada, solte para abrir e arraste para cima para jogar. A mão não invade mais o registro.
- Coleção e construtor de decks: ordenar por número, nome, poder, raridade, quantidade, PV ou custo; tamanhos P/M/G e modo lista.
- Santuário refeito: 29 boosters em 7 faixas (de 150 a 4.000 de Essência), arte ocupando todo o pacote, chances detalhadas, compra de 5 com desconto e bloqueio por nível. Lendária garantida a cada 40 selos.
- Fragmentos de carta (criaturas, ações, relíquias, variantes) e a Forja para criar cartas a partir deles.
- A moeda do jogo passou a se chamar Essência; preços maiores e cartas raras mais difíceis.
- Carregamentos sem spinner (logo com ornamentos pulsando) e transições suaves entre telas e janelas.
- Publicação no GitHub: workflows de APK Android, PWA no GitHub Pages e Linux.

## Novidades da 1.2.0

- 95 versões alternativas (uma por criatura), em 4 temas com arte e ataques próprios: Lua Sangrenta (agressiva), Eclipse (controle), Ancestral (defensiva) e Espectral (evasiva). Contam como o mesmo personagem no limite de 3 cópias.
- Novos efeitos Enfraquecer (o oponente causa menos dano no próximo turno) e Expor (o oponente sofre mais dano), dados às criaturas de perfil místico.
- Menos sorte: ataques de moeda com dano base garantido e variação menor; a CPU monta o deck com força parecida com a do seu.
- Visual: cartas com fundo bege e faixa de cor da classe no topo, preenchimento próprio por tipo, tratamento especial para Épicas, Lendárias e Variantes; moeda 3D com a arte nova; mais sangue, golpes à distância, círculos mágicos e tremor de tela; transições com desfoque no início e no fim da partida; partículas otimizadas.
- Carregamentos: tela de abertura com as imagens de loading e logo pulsante com dicas antes de cada duelo.
- Cursores estilo RPG no PC (espada, mira, ataque, ampulheta, bloqueado).
- Celular: botões de registro e menu à esquerda, ação à direita; a mão vira leque e todas as cartas ficam alcançáveis.
- Música própria e macabra para cada arena, com cânticos de culto, tambores e texturas (fogo, sussurros, tempestade, vento).

## Novidades da 1.1.0

- 25 novos heróis (5 por afinidade, no mesmo molde de equilíbrio).
- Menos derrotas em um golpe: vida das criaturas +35%, Fraqueza passa a somar +30 (antes dobrava), bônus acumuláveis reduzidos, Lendas com golpe máximo menor.
- Nova regra de Esgotamento: sem carta para comprar, o oponente pega 1 Alma (antes era derrota imediata). A tela de resultado explica o motivo exato da vitória ou derrota, e o jogo avisa quando o deck está acabando.
- Raridade: boosters com Lendária 3% e Épica 12% (eram 7% e 22%), Lendária garantida a cada 30. Os decks da CPU têm teto de cartas raras ligado ao nível do jogador.
- Veneno passa a causar 20; a cura da deusa Aurelia, 10.
- Arenas com cor sólida e textura; nome das criaturas fora da barra de vida; controle do espectador na faixa central; tamanhos do tabuleiro que cabem na altura da tela.
- Corrigido: travamento ao tocar em "Completar" no construtor de decks.

## Limitações conhecidas

- O APK e o pacote Linux precisam ser compilados na sua máquina, com os comandos acima.
- Os sons são sintetizados em tempo real. Para sons gravados, use `assets/audio/`.
- As artes vêm de recortes das imagens originais. Uma leve granulação disfarça a resolução.
