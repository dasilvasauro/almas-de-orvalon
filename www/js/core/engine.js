/* Almas de Orvalon — motor de regras
   Independente de interface. A view (opcional) recebe eventos via emit().
   Controladores (humano/IA) recebem main() e ask(). */
(function (root) {
  const G = root.G;
  const CFG = G.CFG = { DECK: 40, HAND: 6, PRIZES: 4, BENCH: 4, TURN_LIMIT: 60, MAX_MARKERS: 4, CONT_SLOTS: 2, MAX_MULLIGAN_BONUS: 3 };
  class Abort extends Error { constructor() { super('abort'); this.abort = true; } }
  G.Abort = Abort;

  // ---------- Validação de deck ----------
  G.validateDeck = function (ids) {
    const errs = [];
    if (ids.length !== CFG.DECK) errs.push({ k: 'deckSize', n: ids.length });
    const cnt = {};
    ids.forEach((id) => { const b = G.baseId ? G.baseId(id) : id; cnt[b] = (cnt[b] || 0) + 1; });
    let markers = 0;
    Object.keys(cnt).forEach((id) => {
      const c = G.CARDS[id]; if (!c) { errs.push({ k: 'unknown', id }); return; }
      if (cnt[id] > G.copyLimit(c)) errs.push({ k: 'copies', id, n: cnt[id], max: G.copyLimit(c) });
      if (c.kind === 'marker') markers += cnt[id];
    });
    if (markers > CFG.MAX_MARKERS) errs.push({ k: 'markers', n: markers });
    if (!ids.some((id) => G.CARDS[id] && G.isBasicCreature(G.CARDS[id]))) errs.push({ k: 'noBasic' });
    return errs;
  };

  class Game {
    constructor(o) {
      this.o = o;
      this.seed = o.seed != null ? o.seed : ((Math.random() * 4294967295) >>> 0);
      this.rng = G.rng(this.seed);
      this.view = o.view || null;
      this.ctrl = o.ctrls;
      this.mode = o.mode || 'quick';
      this.turn = 0; this.cur = 0; this.first = 0;
      this.over = false; this.winner = null; this.endReason = null;
      this.inst = {}; this.uidN = 1; this.domain = null; this.log = [];
      this.turnEnded = false; this.busy = false; this._turnWait = null;
      this.abortP = new Promise((_, rej) => { this._abort = rej; }); this.abortP.catch(() => { });
      this.P = [0, 1].map((i) => this.makePlayer(i, o.players[i]));
    }
    makePlayer(i, p) {
      const pl = {
        i, name: p.name, avatar: p.avatar, title: p.title || '', deck: [], hand: [], discard: [], prizes: [], active: null, bench: [], conts: [], flags: {}, mulligans: 0, pendingMk: [],
        st: { dmg: 0, kos: 0, kosAff: {}, prizes: 0, effects: [], relics: [], creatures: [], gods: [], actions: 0, conds: {}, heals: 0, attacks: 0, ascends: 0, maxHit: 0, turns: 0, charges: 0, retreats: 0, abilities: 0, markers: 0, legendKos: 0, minDiff: 0 }
      };
      p.deck.forEach((id) => pl.deck.push(this.newInst(id, i)));
      return pl;
    }
    newInst(id, owner) { const uid = 'u' + (this.uidN++); this.inst[uid] = { uid, id, owner }; return uid; }

    // ---------- acessores ----------
    c(u) { return G.CARDS[this.inst[u].id]; }
    I(u) { return this.inst[u]; }
    opp(p) { return 1 - p; }
    inPlay(p) { const pl = this.P[p]; return (pl.active ? [pl.active] : []).concat(pl.bench); }
    allInPlay() { return this.inPlay(this.cur).concat(this.inPlay(1 - this.cur)); }
    isActive(u) { const o = this.inst[u].owner; return this.P[o].active === u; }
    isInPlay(u) { const o = this.inst[u].owner; return this.P[o].active === u || this.P[o].bench.includes(u); }
    relic(u) { const r = this.inst[u].relic; return r ? this.c(r).r : null; }
    maxHP(u) { const c = this.c(u); const r = this.relic(u); return c.hp + (r && r.hp && (!r.only || r.only === c.aff) ? r.hp : 0); }
    hpLeft(u) { return this.maxHP(u) - (this.inst[u].dmg || 0); }
    godIs(g) { return this.domain && this.c(this.domain.uid).god === g; }
    isFirstTurn(p) { return (p === this.first && this.turn === 1) || (p !== this.first && this.turn === 2); }
    hasCond(u, k) { const cs = this.inst[u].conds; return !!(cs && cs[k]); }
    anyCond(u) { const cs = this.inst[u].conds; return !!cs && Object.keys(cs).some((k) => cs[k]); }
    contsOf(p, t) { return this.P[p].conts.filter((x) => this.c(x.uid).fx.some((f) => f.t === t)).map((x) => this.c(x.uid).fx.find((f) => f.t === t)); }
    hasEff(u, k) { return (this.inst[u].effs || []).some((e) => e.k === k); }
    effMax(u, k) { return Math.max(0, ...(this.inst[u].effs || []).filter((e) => e.k === k).map((e) => e.v || 0)); }
    effSum(u, k) { return G.sum((this.inst[u].effs || []).filter((e) => e.k === k), (e) => e.v || 0); }
    attachedAffs(u) { return (this.inst[u].att || []).map((x) => this.c(x).aff); }
    discardCount(p, kind) { return this.P[p].discard.filter((u) => this.c(u).kind === kind).length; }

    abilityOf(u) { return this.c(u).ab; }
    // Doms passivos ativos (sem acumular pelo mesmo nome)
    passivesOf(p, k) {
      const seen = {}; const out = [];
      this.inPlay(p).forEach((u) => { const a = this.c(u).ab; if (a && a.k === k) { const key = a.name.pt; if (!seen[key]) { seen[key] = 1; out.push({ u, a }); } } });
      return out;
    }

    condImmune(u, k) {
      const c = this.c(u); if (c.ab && c.ab.k === 'condImmune') return true;
      const r = this.relic(u); if (r && r.condImmune && (r.condImmune === 'all' || r.condImmune.includes(k))) return true;
      if (this.contsOf(this.inst[u].owner, 'condWard').length) return true;
      return false;
    }
    canBeHealed(u) { const r = this.relic(u); return !(r && r.noHeal); }

    retreatCost(u) {
      const c = this.c(u); const r = this.relic(u);
      if (r && r.freeRetreat) return 0;
      let v = c.ret - (r && r.retreatDown ? r.retreatDown : 0);
      if (this.isActive(u) && this.contsOf(this.inst[u].owner, 'retreatDown').length) v -= 1;
      return Math.max(0, v);
    }
    attackCost(u, atk) {
      const cost = atk.cost.slice(); const r = this.relic(u);
      if (r && r.costDown) { const i = cost.lastIndexOf('neu'); if (i >= 0) cost.splice(i, 1); }
      return cost;
    }
    static canPay(affs, cost) {
      const pool = {}; affs.forEach((a) => { pool[a] = (pool[a] || 0) + 1; });
      let neu = 0;
      for (const k of cost) { if (k === 'neu') { neu++; continue; } if (pool[k]) pool[k]--; else return false; }
      return G.sum(Object.values(pool)) >= neu;
    }
    // quantas cargas faltam (mínimo) para pagar
    static missing(affs, cost) {
      const pool = {}; affs.forEach((a) => { pool[a] = (pool[a] || 0) + 1; });
      let miss = 0, neu = 0;
      for (const k of cost) { if (k === 'neu') { neu++; continue; } if (pool[k]) pool[k]--; else miss++; }
      const left = G.sum(Object.values(pool));
      return miss + Math.max(0, neu - left);
    }

    // ---------- infraestrutura ----------
    async emit(type, data) { if (this.view && this.view.ev) { const r = this.view.ev(type, data || {}, this); if (r && r.then) await Promise.race([r, this.abortP]); } }
    async sync() { await this.emit('sync'); }
    addLog(k, a) { const e = { k, t: this.turn, a: a || {} }; this.log.push(e); if (this.view && this.view.onLog) this.view.onLog(e, this); }
    async ask(p, req) {
      req.p = p;
      const r = await Promise.race([Promise.resolve(this.ctrl[p].ask(this, req)), this.abortP]);
      let res = Array.isArray(r) ? r : (r == null ? [] : [r]);
      res = res.filter((x) => req.options.includes(x));
      res = G.uniq(res);
      const max = req.max == null ? 1 : req.max; const min = req.min == null ? 1 : req.min;
      if (res.length > max) res = res.slice(0, max);
      if (res.length < min && !req.cancel) {
        // controlador não respondeu corretamente: completa com as primeiras opções (determinístico)
        for (const o of req.options) { if (res.length >= min) break; if (!res.includes(o)) res.push(o); }
      }
      return res;
    }
    async flip(label) {
      const heads = this.rng() < 0.5;
      this.addLog('coin', { heads, label });
      await this.emit('coin', { heads, label });
      return heads;
    }
    concede(p) {
      if (this.over) return;
      this.over = true; this.winner = 1 - p; this.endReason = 'concede';
      this.addLog('concede', { p });
      this._abort(new Abort());
    }

    // ---------- movimentação ----------
    removeFromZones(u) {
      for (const pl of this.P) {
        for (const z of ['deck', 'hand', 'discard', 'prizes', 'bench']) { const i = pl[z].indexOf(u); if (i >= 0) pl[z].splice(i, 1); }
        if (pl.active === u) pl.active = null;
        pl.conts = pl.conts.filter((x) => x.uid !== u);
      }
      if (this.domain && this.domain.uid === u) this.domain = null;
    }
    toDiscard(u) {
      const o = this.inst[u].owner; this.removeFromZones(u);
      this.clearPlay(u); this.P[o].discard.push(u);
    }
    clearPlay(u) { const I = this.inst[u]; delete I.dmg; delete I.att; delete I.relic; delete I.under; delete I.conds; delete I.effs; delete I.played; delete I.ascT; delete I.abT; delete I.rabT; delete I.inkT; }
    initPlay(u) { const I = this.inst[u]; I.dmg = 0; I.att = []; I.relic = null; I.under = []; I.conds = {}; I.effs = []; I.played = this.turn; I.ascT = -1; I.abT = -1; I.rabT = -1; I.inkT = -1; }
    toHand(p, u, src) {
      this.removeFromZones(u); this.clearPlay(u); this.P[p].hand.push(u);
      if (this.c(u).kind === 'marker' && !this._setup) this.P[p].pendingMk.push(u);
    }
    async draw(p, n, src) {
      const pl = this.P[p]; let got = 0;
      for (let i = 0; i < n; i++) {
        if (!pl.deck.length) break;
        const u = pl.deck[0]; this.toHand(p, u, 'draw'); got++;
      }
      if (got) { this.addLog('draw', { p, n: got }); await this.emit('draw', { p, n: got }); }
      return got;
    }
    shuffle(p) { this.rng.shuffle(this.P[p].deck); }
    clearTurnState(u) { const I = this.inst[u]; I.conds = {}; I.effs = []; }
    switchActive(p, benchU) {
      const pl = this.P[p]; const old = pl.active;
      const i = pl.bench.indexOf(benchU); if (i < 0) return;
      if (old) { this.clearTurnState(old); pl.bench[i] = old; } else pl.bench.splice(i, 1);
      pl.active = benchU; this.clearTurnState(benchU);
    }
    applyCond(u, k, by) {
      if (!this.isActive(u)) return false;
      if (this.condImmune(u, k)) { this.addLog('immune', { u: this.inst[u].id, k }); return false; }
      const I = this.inst[u];
      if (k === 'trance' || k === 'stun' || k === 'madness') { delete I.conds.trance; delete I.conds.stun; delete I.conds.madness; }
      I.conds[k] = true;
      if (by != null) { const st = this.P[by].st; st.conds[k] = (st.conds[k] || 0) + 1; }
      this.addLog('cond', { u: this.inst[u].id, k });
      return true;
    }
    heal(u, v) {
      if (!this.canBeHealed(u)) return 0;
      const I = this.inst[u]; const h = Math.min(I.dmg || 0, v); I.dmg -= h;
      if (h > 0) { this.P[I.owner].st.heals += h; }
      return h;
    }
    placeDamage(u, v) { if (!this.isInPlay(u)) return; this.inst[u].dmg = (this.inst[u].dmg || 0) + v; }

    // ---------- SETUP ----------
    async drawOpening(p) {
      const pl = this.P[p]; const aside = [];
      while (pl.hand.length < CFG.HAND && pl.deck.length) {
        const u = pl.deck.shift();
        if (this.c(u).kind === 'marker') aside.push(u); else pl.hand.push(u);
      }
      aside.forEach((u) => pl.deck.push(u));
      if (aside.length) this.shuffle(p);
    }
    async drawExtraSetup(p, n) {
      const pl = this.P[p]; const aside = []; let k = 0;
      while (k < n && pl.deck.length) { const u = pl.deck.shift(); if (this.c(u).kind === 'marker') aside.push(u); else { pl.hand.push(u); k++; } }
      aside.forEach((u) => pl.deck.push(u)); if (aside.length) this.shuffle(p);
    }
    async setup() {
      this._setup = true;
      for (const p of [0, 1]) { if (!(this.o.noShuffle && this.o.noShuffle[p])) this.shuffle(p); }
      await this.emit('start');
      // moeda decide quem começa
      if (this.o.first != null) this.first = this.o.first;
      else { const h = await this.flip('first'); this.first = h ? 0 : 1; }
      this.addLog('first', { p: this.first });
      // mãos iniciais + mulligan
      for (const p of [0, 1]) {
        const pl = this.P[p];
        let guard = 0;
        while (guard++ < 50) {
          await this.drawOpening(p);
          if (pl.hand.some((u) => G.isBasicCreature(this.c(u)))) break;
          pl.mulligans++; this.addLog('mulligan', { p });
          await this.emit('mulligan', { p, cards: pl.hand.map((u) => this.inst[u].id) });
          pl.hand.forEach((u) => pl.deck.push(u)); pl.hand = []; this.shuffle(p);
        }
      }
      for (const p of [0, 1]) {
        const bonus = Math.min(this.P[1 - p].mulligans, CFG.MAX_MULLIGAN_BONUS);
        if (bonus) { await this.drawExtraSetup(p, bonus); this.addLog('mullBonus', { p, n: bonus }); }
      }
      await this.sync();
      // escolha de Ativo e Reserva
      for (const p of [0, 1]) {
        const pl = this.P[p];
        const basics = pl.hand.filter((u) => G.isBasicCreature(this.c(u)));
        const [act] = await this.ask(p, { purpose: 'setupActive', options: basics, min: 1, max: 1, from: 'hand' });
        this.removeFromZones(act); pl.active = act; this.initPlay(act); this.inst[act].played = 0; pl.st.creatures.push(this.inst[act].id);
        const rest = pl.hand.filter((u) => G.isBasicCreature(this.c(u)));
        if (rest.length) {
          const bench = await this.ask(p, { purpose: 'setupBench', options: rest, min: 0, max: CFG.BENCH, from: 'hand' });
          bench.forEach((u) => { this.removeFromZones(u); pl.bench.push(u); this.initPlay(u); this.inst[u].played = 0; pl.st.creatures.push(this.inst[u].id); });
        }
      }
      for (const p of [0, 1]) { const pl = this.P[p]; for (let i = 0; i < CFG.PRIZES && pl.deck.length; i++) pl.prizes.push(pl.deck.shift()); }
      this._setup = false;
      this.addLog('setupDone', {});
      await this.emit('setupDone');
      await this.sync();
    }

    // ---------- LOOP ----------
    async run() {
      try {
        await this.setup();
        this.cur = this.first; this.turn = 0;
        while (!this.over) {
          this.turn++;
          if (this.turn > CFG.TURN_LIMIT) { this.timeUp(); break; }
          await this.startTurn(); if (this.over) break;
          await Promise.race([Promise.resolve(this.ctrl[this.cur].main(this, this.cur)), this.abortP]);
          if (this.over) break;
          if (!this.turnEnded) this.turnEnded = true;
          await this.checkup(); if (this.over) break;
          this.cur = 1 - this.cur;
        }
      } catch (e) {
        if (!(e && e.abort)) { console.error(e); if (!this.over) { this.over = true; this.winner = null; this.endReason = 'error'; this.error = e; } }
      }
      try { await this.emit('over', { winner: this.winner, reason: this.endReason }); } catch (e) { }
      return { winner: this.winner, reason: this.endReason, turns: this.turn };
    }
    timeUp() {
      const a = this.P[0].prizes.length, b = this.P[1].prizes.length;
      this.over = true; this.endReason = 'timeup';
      this.winner = a < b ? 0 : b < a ? 1 : null;
      this.addLog('timeup', {});
    }
    async startTurn() {
      const p = this.cur, pl = this.P[p];
      pl.flags = {}; this.turnEnded = false; pl.st.turns++;
      this.addLog('turn', { p, n: this.turn });
      await this.emit('turn', { p });
      if (!pl.deck.length) { await this.fatigue(p); if (this.over) return; }
      else await this.draw(p, 1);
      if (this.contsOf(p, 'drawExtra').length) await this.draw(p, 1);
      await this.resolveMarkers();
      await this.sync();
    }
    // Esgotamento: sem carta para comprar, o oponente pega 1 Alma (em vez de derrota imediata)
    async fatigue(p) {
      const q = 1 - p; const P = this.P[q];
      this.addLog('fatigue', { p }); await this.emit('fatigue', { p });
      if (P.prizes.length) { this.toHand(q, P.prizes[0]); P.st.prizes++; this.addLog('prize', { p: q, n: 1 }); await this.emit('prize', { p: q, n: 1 }); }
      this.updateDiff(); this.checkWin();
      if (this.over && this.winner === q && this.endReason === 'prizes') this.endReason = 'deckout';
      if (this.over) this.endTurnSignal();
    }
    waitTurnEnd() { if (this.turnEnded || this.over) return Promise.resolve(); return new Promise((r) => { this._turnWait = r; }); }
    endTurnSignal() { this.turnEnded = true; if (this._turnWait) { const r = this._turnWait; this._turnWait = null; r(); } }
    async lose(p, reason) {
      if (this.over) return;
      this.over = true; this.winner = 1 - p; this.endReason = reason;
      this.addLog('lose', { p, reason });
      this.endTurnSignal();
    }

    // ---------- LEGALIDADE ----------
    canAttach(p, chargeU, target) {
      const pl = this.P[p]; if (!pl.hand.includes(chargeU)) return false;
      const ch = this.c(chargeU); if (ch.kind !== 'charge') return false;
      if (!this.inPlay(p).includes(target)) return false;
      if (!pl.flags.attached) return true;
      return this.godIs('nyxara') && !pl.flags.nyx && ch.aff === 'ene' && this.c(target).aff === 'ene';
    }
    canBench(p, u) { const pl = this.P[p]; return pl.hand.includes(u) && G.isBasicCreature(this.c(u)) && pl.bench.length < CFG.BENCH; }
    canAscend(p, u, target) {
      const pl = this.P[p]; const c = this.c(u);
      if (!pl.hand.includes(u) || c.kind !== 'creature' || c.stage !== 1) return false;
      if (this.isFirstTurn(p)) return false;
      if (!this.inPlay(p).includes(target)) return false;
      const I = this.inst[target];
      return G.baseId(I.id) === c.from && I.played < this.turn && I.ascT !== this.turn;
    }
    canRelic(p, u, target) {
      const pl = this.P[p]; const c = this.c(u);
      if (!pl.hand.includes(u) || c.kind !== 'relic') return false;
      if (!this.inPlay(p).includes(target) || this.inst[target].relic) return false;
      if (c.r.only && this.c(target).aff !== c.r.only) return false;
      return true;
    }
    canGod(p, u) {
      const pl = this.P[p]; const c = this.c(u);
      if (!pl.hand.includes(u) || c.kind !== 'god' || pl.flags.god) return false;
      return !(this.domain && this.inst[this.domain.uid].id === c.id);
    }
    canAction(p, u) {
      const pl = this.P[p]; const c = this.c(u);
      if (!pl.hand.includes(u) || c.kind !== 'action' || pl.flags.action) return false;
      if (p === this.first && this.turn === 1) return false;
      const op = this.P[1 - p];
      switch (c.act) {
        case 'swapDraw': return pl.bench.length > 0;
        case 'seal': return op.bench.length > 0;
        case 'sacrifice': return pl.bench.length > 0;
        case 'draw3': return pl.deck.length > 0;
        case 'reshuffle6': return pl.deck.length + pl.hand.length > 1;
      }
      return false;
    }
    canEffect(p, u) {
      const pl = this.P[p]; const c = this.c(u);
      if (!pl.hand.includes(u) || c.kind !== 'effect') return false;
      if (c.mode === 'cont') {
        if (pl.conts.length >= CFG.CONT_SLOTS) return false;
        if (pl.conts.some((x) => this.inst[x.uid].id === c.id)) return false;
        return true;
      }
      const op = this.P[1 - p]; const mine = this.inPlay(p); const others = pl.hand.filter((x) => x !== u);
      const healable = (v) => mine.some((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x));
      const discCharges = pl.discard.filter((x) => this.c(x).kind === 'charge');
      for (const f of c.fx) {
        let ok = true;
        switch (f.t) {
          case 'discardDraw': ok = others.length >= 1 && pl.deck.length > 0; break;
          case 'drawDiscard': ok = pl.deck.length > 0; break;
          case 'heal': ok = healable(); break;
          case 'healActive': ok = true; break;
          case 'healAll': ok = true; break;
          case 'cure': ok = true; break;
          case 'revive': ok = pl.bench.length < CFG.BENCH && pl.discard.some((x) => G.isBasicCreature(this.c(x))); break;
          case 'tempAtk': ok = !!pl.active; break;
          case 'attachDiscard': ok = discCharges.length > 0; break;
          case 'spread': ok = this.inPlay(1 - p).length > 0; break;
          case 'recover': ok = pl.discard.some((x) => this.c(x).kind === 'creature'); break;
          case 'discardOppRelic': ok = this.inPlay(1 - p).some((x) => this.inst[x].relic); break;
          case 'searchAsc': case 'searchRelic': case 'searchCharge': case 'searchBasic': case 'topLook': ok = pl.deck.length > 0; if (f.t === 'searchBasic' && f.to === 'bench') ok = ok && pl.bench.length < CFG.BENCH; break;
          case 'sealOpp': ok = !!op.active; break;
          case 'draw': ok = true; break;
          case 'switchOwn': ok = pl.bench.length > 0; break;
          case 'tempShield': ok = !!pl.active; break;
          case 'stripOpp': ok = !!op.active && (this.inst[op.active].att || []).length > 0; break;
          case 'condOpp': ok = !!op.active && !this.condImmune(op.active, f.c); break;
          case 'gustOpp': ok = op.bench.length > 0 && pl.prizes.length > op.prizes.length; break;
          case 'shuffleHands': ok = true; break;
          case 'bounceOwn': ok = pl.bench.length > 0; break;
          case 'revealHand': ok = op.hand.length > 0; break;
          case 'attachHandBench': ok = pl.bench.length > 0 && others.some((x) => this.c(x).kind === 'charge'); break;
          case 'recoverCharges': ok = discCharges.length > 0; break;
          case 'forceSwitchOpp': ok = op.bench.length > 0; break;
          case 'drawTo': ok = pl.deck.length > 0 && others.length < f.n; break;
          case 'moveCharge': ok = mine.length > 1 && mine.some((x) => (this.inst[x].att || []).length > 0); break;
          case 'tutor': ok = others.length >= 2 && pl.deck.length > 0; break;
          case 'discardGod': ok = !!this.domain; break;
        }
        if (!ok) {
          // efeitos compostos: basta o efeito principal ser possível
          if (['draw', 'healActive', 'healAll', 'cure'].includes(f.t)) continue;
          return false;
        }
      }
      // cartas puramente de cura/remoção precisam de algo útil
      if (c.fx.every((f) => ['cure', 'healActive', 'healAll'].includes(f.t))) {
        const any = mine.some((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x)) || (pl.active && this.anyCond(pl.active));
        if (!any) return false;
      }
      return true;
    }
    abilitySource(u) {
      // retorna {kind:'ab'|'relic', a} se a criatura tiver habilidade ativa
      const c = this.c(u); const out = [];
      if (c.ab && G.ACTIVE_ABILITIES.includes(c.ab.k)) out.push({ src: 'ab', a: c.ab });
      const r = this.relic(u); if (r && r.swapA) out.push({ src: 'relic', a: { k: 'swapA', name: this.c(this.inst[u].relic).name } });
      return out;
    }
    canAbility(p, u, src) {
      if (!this.inPlay(p).includes(u)) return false;
      const I = this.inst[u]; const pl = this.P[p]; const op = this.P[1 - p];
      const s = this.abilitySource(u).find((x) => x.src === (src || 'ab')); if (!s) return false;
      if (s.src === 'ab' && I.abT === this.turn) return false;
      if (s.src === 'relic' && I.rabT === this.turn) return false;
      const a = s.a; const mine = this.inPlay(p);
      switch (a.k) {
        case 'drawA': return pl.deck.length > 0 && (!a.needTag || mine.some((x) => x !== u && this.c(x).tags.includes(a.needTag)));
        case 'healA': return mine.some((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x));
        case 'accelA': return pl.discard.some((x) => this.c(x).kind === 'charge' && this.c(x).aff === a.aff) && mine.some((x) => this.c(x).aff === a.aff);
        case 'condA': return pl.active === u && !!op.active && !this.condImmune(op.active, a.c) && !this.hasCond(op.active, a.c);
        case 'swapA': return pl.bench.includes(u) && !!pl.active;
        case 'searchA': return pl.deck.some((x) => this.c(x).kind === 'charge');
        case 'moveA': return mine.length > 1 && mine.some((x) => (this.inst[x].att || []).length > 0);
      }
      return false;
    }
    retreatBlocked(p) {
      const pl = this.P[p]; const a = pl.active; if (!a) return 'none';
      if (pl.flags.retreated) return 'once';
      if (this.hasCond(a, 'stun') || this.hasCond(a, 'trance')) return 'cond';
      if (this.hasEff(a, 'noRetreat')) return 'sealed';
      const r = this.relic(a); if (r && r.noRetreat) return 'relic';
      const oa = this.P[1 - p].active; if (oa) { const orl = this.relic(oa); if (orl && orl.lockOppRetreat) return 'bell'; }
      if (!pl.bench.length) return 'nobench';
      if ((this.inst[a].att || []).length < this.retreatCost(a)) return 'cost';
      return null;
    }
    canRetreat(p, target) { return this.retreatBlocked(p) === null && this.P[p].bench.includes(target); }
    attackBlocked(p, i) {
      const pl = this.P[p]; const a = pl.active; if (!a) return 'none';
      if (p === this.first && this.turn === 1) return 'firstTurn';
      if (this.hasCond(a, 'stun')) return 'stun';
      if (this.hasCond(a, 'trance')) return 'trance';
      if (this.hasEff(a, 'noAtk')) return 'exhausted';
      const atk = this.c(a).attacks[i]; if (!atk) return 'none';
      if (!Game.canPay(this.attachedAffs(a), this.attackCost(a, atk))) return 'cost';
      if (!this.P[1 - p].active) return 'none';
      return null;
    }
    canAttack(p, i) { return this.attackBlocked(p, i) === null; }

    isLegal(p, a) {
      switch (a.type) {
        case 'bench': return this.canBench(p, a.u);
        case 'ascend': return this.canAscend(p, a.u, a.target);
        case 'attach': return this.canAttach(p, a.u, a.target);
        case 'relic': return this.canRelic(p, a.u, a.target);
        case 'effect': return this.canEffect(p, a.u);
        case 'action': return this.canAction(p, a.u);
        case 'god': return this.canGod(p, a.u);
        case 'ability': return this.canAbility(p, a.u, a.src);
        case 'retreat': return this.canRetreat(p, a.target);
        case 'attack': return this.canAttack(p, a.i);
        case 'end': return true;
      }
      return false;
    }
    legalActions(p) {
      const out = []; const pl = this.P[p]; const mine = this.inPlay(p);
      const seen = {};
      pl.hand.forEach((u) => {
        const c = this.c(u); const key = c.id;
        if (c.kind === 'creature') {
          if (c.stage === 0 && !seen['b' + key] && this.canBench(p, u)) { seen['b' + key] = 1; out.push({ type: 'bench', u }); }
          if (c.stage === 1) mine.forEach((t) => { if (!seen['a' + key + t] && this.canAscend(p, u, t)) { seen['a' + key + t] = 1; out.push({ type: 'ascend', u, target: t }); } });
        } else if (c.kind === 'charge') {
          mine.forEach((t) => { if (!seen['c' + key + t] && this.canAttach(p, u, t)) { seen['c' + key + t] = 1; out.push({ type: 'attach', u, target: t }); } });
        } else if (c.kind === 'relic') {
          mine.forEach((t) => { if (!seen['r' + key + t] && this.canRelic(p, u, t)) { seen['r' + key + t] = 1; out.push({ type: 'relic', u, target: t }); } });
        } else if (c.kind === 'effect') { if (!seen['e' + key] && this.canEffect(p, u)) { seen['e' + key] = 1; out.push({ type: 'effect', u }); } }
        else if (c.kind === 'action') { if (!seen['x' + key] && this.canAction(p, u)) { seen['x' + key] = 1; out.push({ type: 'action', u }); } }
        else if (c.kind === 'god') { if (!seen['g' + key] && this.canGod(p, u)) { seen['g' + key] = 1; out.push({ type: 'god', u }); } }
      });
      mine.forEach((u) => this.abilitySource(u).forEach((s) => { if (this.canAbility(p, u, s.src)) out.push({ type: 'ability', u, src: s.src }); }));
      if (this.retreatBlocked(p) === null) pl.bench.forEach((t) => out.push({ type: 'retreat', target: t }));
      return out;
    }

    // ---------- EXECUÇÃO ----------
    async perform(p, a) {
      if (this.over || this.busy || p !== this.cur || this.turnEnded) return false;
      if (!this.isLegal(p, a)) return false;
      this.busy = true;
      try {
        switch (a.type) {
          case 'bench': await this.doBench(p, a.u); break;
          case 'ascend': await this.doAscend(p, a.u, a.target); break;
          case 'attach': await this.doAttach(p, a.u, a.target); break;
          case 'relic': await this.doRelic(p, a.u, a.target); break;
          case 'effect': await this.doEffect(p, a.u); break;
          case 'action': await this.doAction(p, a.u); break;
          case 'god': await this.doGod(p, a.u); break;
          case 'ability': await this.doAbility(p, a.u, a.src); break;
          case 'retreat': await this.doRetreat(p, a.target); break;
          case 'attack': await this.doAttack(p, a.i); break;
          case 'end': this.addLog('endTurn', { p }); break;
        }
        if (!this.over) { await this.resolveKOs(null); }
        if (!this.over) await this.resolveMarkers();
        if (!this.over) await this.sync();
      } finally { this.busy = false; }
      if (a.type === 'attack' || a.type === 'end') this.endTurnSignal();
      if (this.over) this.endTurnSignal();
      return true;
    }

    async doBench(p, u) {
      const pl = this.P[p]; this.removeFromZones(u); pl.bench.push(u); this.initPlay(u);
      pl.st.creatures.push(this.inst[u].id);
      this.addLog('bench', { p, id: this.inst[u].id });
      await this.emit('play', { p, u, to: 'bench' }); await this.sync();
      const ab = this.c(u).ab;
      if (ab && ab.k === 'enterDraw') { await this.draw(p, ab.n); }
      if (ab && ab.k === 'enterSearch') {
        const opts = pl.deck.filter((x) => G.isBasicCreature(this.c(x)));
        const pick = await this.ask(p, { purpose: 'searchBasic', options: opts, min: 0, max: 1, from: 'deck', src: u, showAll: true });
        pick.forEach((x) => this.toHand(p, x)); this.shuffle(p); await this.emit('shuffle', { p });
      }
    }
    async doAscend(p, u, target) {
      const pl = this.P[p]; const old = this.inst[target];
      this.removeFromZones(u);
      const I = this.inst[u];
      I.dmg = old.dmg; I.att = old.att; I.relic = old.relic; I.under = (old.under || []).concat([target]);
      I.conds = {}; I.effs = []; I.played = old.played; I.ascT = this.turn; I.abT = -1; I.rabT = -1; I.inkT = old.inkT;
      if (pl.active === target) pl.active = u; else pl.bench[pl.bench.indexOf(target)] = u;
      const keepUnder = I.under;
      old.dmg = undefined; old.att = undefined; old.relic = undefined; old.under = undefined; old.conds = undefined; old.effs = undefined;
      I.under = keepUnder;
      pl.st.ascends++; pl.st.creatures.push(I.id);
      this.addLog('ascend', { p, from: old.id, id: I.id });
      await this.emit('ascend', { p, u, from: target }); await this.sync();
    }
    async doAttach(p, u, target) {
      const pl = this.P[p];
      if (pl.flags.attached) pl.flags.nyx = true; else pl.flags.attached = true;
      this.removeFromZones(u); this.inst[target].att.push(u); pl.st.charges++;
      const ch = this.c(u);
      this.addLog('attach', { p, id: ch.id, to: this.inst[target].id });
      await this.emit('attach', { p, u, target });
      if (ch.aff === 'neu' && this.c(target).aff === 'pri') this.heal(target, 10);
      const r = this.relic(target);
      if (r && r.attachDraw && this.inst[target].inkT !== this.turn) { this.inst[target].inkT = this.turn; await this.draw(p, 1); }
      await this.sync();
    }
    async doRelic(p, u, target) {
      const pl = this.P[p]; this.removeFromZones(u); this.inst[target].relic = u;
      pl.st.relics.push(this.inst[u].id);
      this.addLog('relic', { p, id: this.inst[u].id, to: this.inst[target].id });
      await this.emit('relic', { p, u, target }); await this.sync();
      const r = this.c(u).r;
      switch (r.onAttach) {
        case 'draw2': await this.draw(p, 2); break;
        case 'cureHeal40': this.inst[target].conds = {}; this.heal(target, 40); break;
        case 'searchChargeAttach': {
          const opts = pl.deck.filter((x) => this.c(x).kind === 'charge');
          const pick = await this.ask(p, { purpose: 'searchChargeFor', options: opts, min: 0, max: 1, from: 'deck', src: target, showAll: true });
          pick.forEach((x) => { this.removeFromZones(x); this.inst[target].att.push(x); });
          this.shuffle(p); await this.emit('shuffle', { p }); break;
        }
        case 'topLook3': await this.topLook(p, 3); break;
      }
    }
    async doGod(p, u) {
      const pl = this.P[p]; pl.flags.god = true;
      if (this.domain) { const old = this.domain.uid; this.toDiscard(old); }
      this.removeFromZones(u); this.domain = { uid: u, owner: p };
      pl.st.gods.push(this.inst[u].id);
      this.addLog('god', { p, id: this.inst[u].id });
      await this.emit('god', { p, u }); await this.sync();
    }
    async doRetreat(p, target) {
      const pl = this.P[p]; const a = pl.active; const cost = this.retreatCost(a);
      const disc = this.chooseChargesToDiscard(a, cost);
      disc.forEach((x) => this.toDiscard(x));
      const r = this.relic(a);
      pl.flags.retreated = true; pl.st.retreats++;
      this.switchActive(p, target);
      if (r && r.retreatHeal) this.heal(a, r.retreatHeal);
      this.addLog('retreat', { p, id: this.inst[a].id, to: this.inst[target].id, n: cost });
      await this.emit('retreat', { p, from: a, to: target }); await this.sync();
    }
    async stripOne(p, target) {
      const att = (this.inst[target].att || []).slice(); if (!att.length) return;
      const [d] = await this.ask(p, { purpose: 'stripWhich', options: att, from: 'list', src: target });
      if (d) { this.toDiscard(d); this.addLog('strip', { id: this.inst[d].id, from: this.inst[target].id }); await this.emit('strip', { u: target }); }
    }
    // descarte automático de Cargas: Neutras -> afinidade diferente -> demais
    chooseChargesToDiscard(u, n, aff) {
      const att = (this.inst[u].att || []).slice(); const myAff = this.c(u).aff;
      const pool = aff ? att.filter((x) => this.c(x).aff === aff) : att;
      const rank = (x) => { const a = this.c(x).aff; if (a === 'neu') return 0; if (a !== myAff) return 1; return 2; };
      return pool.sort((x, y) => rank(x) - rank(y)).slice(0, n);
    }

    async doAbility(p, u, src) {
      src = src || 'ab';
      const I = this.inst[u]; const pl = this.P[p]; const op = this.P[1 - p];
      const s = this.abilitySource(u).find((x) => x.src === src); const a = s.a;
      if (src === 'ab') I.abT = this.turn; else I.rabT = this.turn;
      pl.st.abilities++;
      this.addLog('ability', { p, id: I.id, name: a.name });
      await this.emit('ability', { p, u, a });
      const mine = this.inPlay(p);
      switch (a.k) {
        case 'drawA': await this.draw(p, 1); break;
        case 'healA': {
          const opts = mine.filter((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x));
          const [t] = await this.ask(p, { purpose: 'heal', v: a.v, options: opts, from: 'board', src: u });
          const h = this.heal(t, a.v); await this.emit('heal', { u: t, v: h }); break;
        }
        case 'accelA': {
          const charges = pl.discard.filter((x) => this.c(x).kind === 'charge' && this.c(x).aff === a.aff);
          const opts = mine.filter((x) => this.c(x).aff === a.aff);
          const [t] = await this.ask(p, { purpose: 'attachTo', aff: a.aff, options: opts, from: 'board', src: u });
          const ch = charges[0]; this.removeFromZones(ch); this.inst[t].att.push(ch); this.placeDamage(t, 10);
          await this.emit('attach', { p, u: ch, target: t, from: 'discard' }); await this.emit('damage', { u: t, v: 10, placed: true }); break;
        }
        case 'condA': if (this.applyCond(op.active, a.c, p)) await this.emit('cond', { u: op.active, k: a.c }); break;
        case 'swapA': this.switchActive(p, u); await this.emit('switch', { p }); break;
        case 'searchA': {
          const opts = pl.deck.filter((x) => this.c(x).kind === 'charge');
          const pick = await this.ask(p, { purpose: 'searchCharge', options: opts, min: 0, max: 1, from: 'deck', src: u, showAll: true });
          pick.forEach((x) => this.toHand(p, x)); this.shuffle(p); await this.emit('shuffle', { p }); break;
        }
        case 'moveA': await this.moveChargeFlow(p, u); break;
      }
      await this.sync();
    }
    async moveChargeFlow(p, src) {
      const mine = this.inPlay(p);
      const fromOpts = mine.filter((x) => (this.inst[x].att || []).length > 0);
      const [from] = await this.ask(p, { purpose: 'moveFrom', options: fromOpts, from: 'board', src });
      const [ch] = await this.ask(p, { purpose: 'moveWhich', options: this.inst[from].att.slice(), from: 'list', src: from });
      const toOpts = mine.filter((x) => x !== from);
      const [to] = await this.ask(p, { purpose: 'moveTo', options: toOpts, from: 'board', src: from, charge: ch });
      const i = this.inst[from].att.indexOf(ch); if (i >= 0) this.inst[from].att.splice(i, 1);
      this.inst[to].att.push(ch);
      this.addLog('move', { p, id: this.inst[ch].id, from: this.inst[from].id, to: this.inst[to].id });
      await this.emit('attach', { p, u: ch, target: to, from: from });
    }
    async topLook(p, n) {
      const pl = this.P[p]; const top = pl.deck.slice(0, n);
      if (!top.length) return;
      const pick = await this.ask(p, { purpose: 'topLook', options: top, min: 1, max: 1, from: 'deck', showAll: true });
      pick.forEach((x) => this.toHand(p, x)); this.shuffle(p); await this.emit('shuffle', { p });
    }

    // ---------- EFEITOS ----------
    async doEffect(p, u) {
      const pl = this.P[p]; const c = this.c(u); const op = this.P[1 - p];
      pl.st.effects.push(c.id);
      this.removeFromZones(u);
      this.addLog('effect', { p, id: c.id });
      if (c.mode === 'cont') {
        pl.conts.push({ uid: u, exp: this.turn + 2 });
        await this.emit('reveal', { p, u, cont: true });
        if (c.fx.some((f) => f.t === 'condWard')) this.inPlay(p).forEach((x) => { this.inst[x].conds = {}; });
        await this.sync(); return;
      }
      pl.discard.push(u);
      await this.emit('reveal', { p, u });
      for (const f of c.fx) { if (this.over) break; await this.resolveEffectFx(p, f, u); }
      await this.sync();
    }
    async resolveEffectFx(p, f, srcU) {
      const pl = this.P[p]; const op = this.P[1 - p]; const mine = this.inPlay(p);
      switch (f.t) {
        case 'discardDraw': {
          const [d] = await this.ask(p, { purpose: 'discardHand', options: pl.hand.slice(), min: 1, max: 1, from: 'hand' });
          if (d) this.toDiscard(d); await this.draw(p, f.n); break;
        }
        case 'drawDiscard': {
          await this.draw(p, f.n); await this.resolveMarkers();
          if (pl.hand.length) { const [d] = await this.ask(p, { purpose: 'discardHand', options: pl.hand.slice(), min: 1, max: 1, from: 'hand' }); if (d) this.toDiscard(d); }
          break;
        }
        case 'heal': {
          const opts = mine.filter((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x)); if (!opts.length) break;
          const [t] = await this.ask(p, { purpose: 'heal', v: f.v, options: opts, from: 'board' });
          const h = this.heal(t, f.v); await this.emit('heal', { u: t, v: h });
          if (f.cost === 'charge' && this.inst[t].att.length) { const [d] = this.chooseChargesToDiscard(t, 1); this.toDiscard(d); }
          break;
        }
        case 'healActive': if (pl.active) { const h = this.heal(pl.active, f.v); await this.emit('heal', { u: pl.active, v: h }); } break;
        case 'healAll': for (const x of mine) { const h = this.heal(x, f.v); if (h) await this.emit('heal', { u: x, v: h }); } break;
        case 'cure': if (pl.active) this.inst[pl.active].conds = {}; break;
        case 'revive': {
          const opts = pl.discard.filter((x) => G.isBasicCreature(this.c(x))); if (!opts.length || pl.bench.length >= CFG.BENCH) break;
          const [t] = await this.ask(p, { purpose: 'revive', options: opts, from: 'discard' });
          this.removeFromZones(t); pl.bench.push(t); this.initPlay(t);
          await this.emit('play', { p, u: t, to: 'bench', from: 'discard' });
          if (f.charge) {
            const ch = pl.discard.filter((x) => this.c(x).kind === 'charge');
            if (ch.length) { const [cc] = await this.ask(p, { purpose: 'reviveCharge', options: ch, from: 'discard', src: t }); if (cc) { this.removeFromZones(cc); this.inst[t].att.push(cc); } }
          }
          break;
        }
        case 'tempAtk': if (pl.active) this.inst[pl.active].effs.push({ k: 'atk', v: f.v, exp: this.turn }); break;
        case 'attachDiscard': {
          const ch = pl.discard.filter((x) => this.c(x).kind === 'charge'); if (!ch.length) break;
          const [t] = await this.ask(p, { purpose: 'attachTo', options: mine.slice(), from: 'board' });
          const picks = await this.ask(p, { purpose: 'pickCharges', options: ch, min: 1, max: Math.min(f.n, ch.length), from: 'discard', src: t });
          picks.forEach((x) => { this.removeFromZones(x); this.inst[t].att.push(x); });
          await this.emit('attach', { p, u: picks[0], target: t, from: 'discard' });
          if (f.dmg) { this.placeDamage(t, f.dmg); await this.emit('damage', { u: t, v: f.dmg, placed: true }); }
          break;
        }
        case 'spread': for (const x of this.inPlay(1 - p)) { this.placeDamage(x, f.v); await this.emit('damage', { u: x, v: f.v, placed: true }); } break;
        case 'recover': {
          const opts = pl.discard.filter((x) => this.c(x).kind === 'creature');
          const picks = await this.ask(p, { purpose: 'recover', options: opts, min: 1, max: Math.min(f.n, opts.length), from: 'discard' });
          picks.forEach((x) => this.toHand(p, x)); break;
        }
        case 'discardOppRelic': {
          const opts = this.inPlay(1 - p).filter((x) => this.inst[x].relic);
          const [t] = await this.ask(p, { purpose: 'discardOppRelic', options: opts, from: 'board' });
          const r = this.inst[t].relic; this.inst[t].relic = null; this.P[1 - p].discard.push(r);
          await this.emit('discardRelic', { u: t }); break;
        }
        case 'searchAsc': case 'searchRelic': case 'searchCharge': case 'searchBasic': {
          let opts;
          if (f.t === 'searchAsc') opts = pl.deck.filter((x) => this.c(x).kind === 'creature' && this.c(x).stage === 1);
          else if (f.t === 'searchRelic') opts = pl.deck.filter((x) => this.c(x).kind === 'relic');
          else if (f.t === 'searchCharge') opts = pl.deck.filter((x) => this.c(x).kind === 'charge');
          else opts = pl.deck.filter((x) => G.isBasicCreature(this.c(x)));
          const max = f.t === 'searchCharge' ? f.n : 1;
          const picks = await this.ask(p, { purpose: f.t, to: f.to, options: opts, min: 0, max, from: 'deck', showAll: true });
          for (const x of picks) {
            if (f.t === 'searchBasic' && f.to === 'bench') { if (pl.bench.length < CFG.BENCH) { this.removeFromZones(x); pl.bench.push(x); this.initPlay(x); await this.emit('play', { p, u: x, to: 'bench', from: 'deck' }); } }
            else this.toHand(p, x);
          }
          this.shuffle(p); await this.emit('shuffle', { p }); break;
        }
        case 'topLook': await this.topLook(p, f.n); break;
        case 'tutor': {
          const opts = pl.hand.slice();
          const ds = await this.ask(p, { purpose: 'discardHand', options: opts, min: 2, max: 2, from: 'hand', n: 2 });
          ds.forEach((x) => this.toDiscard(x));
          const pick = await this.ask(p, { purpose: 'tutor', options: pl.deck.slice(), min: 0, max: 1, from: 'deck', showAll: true });
          pick.forEach((x) => this.toHand(p, x)); this.shuffle(p); await this.emit('shuffle', { p }); break;
        }
        case 'sealOpp': if (op.active) this.inst[op.active].effs.push({ k: 'noRetreat', exp: this.turn + 1 }); break;
        case 'draw': await this.draw(p, f.n); break;
        case 'drawTo': { const n = f.n - pl.hand.length; if (n > 0) await this.draw(p, n); break; }
        case 'switchOwn': {
          if (!pl.bench.length) break;
          const old = pl.active;
          const [t] = await this.ask(p, { purpose: 'switchOwn', options: pl.bench.slice(), from: 'board' });
          this.switchActive(p, t); if (f.heal && old) this.heal(old, f.heal);
          await this.emit('switch', { p }); break;
        }
        case 'tempShield': if (pl.active) this.inst[pl.active].effs.push({ k: 'guard', v: f.v, exp: this.turn + 1 }); break;
        case 'stripOpp': {
          if (!op.active || !this.inst[op.active].att.length) break;
          if (f.coin && !(await this.flip('strip'))) break;
          await this.stripOne(p, op.active); break;
        }
        case 'condOpp': if (op.active && this.applyCond(op.active, f.c, p)) await this.emit('cond', { u: op.active, k: f.c }); break;
        case 'gustOpp': {
          if (!op.bench.length) break;
          const [t] = await this.ask(p, { purpose: 'gust', options: op.bench.slice(), from: 'board' });
          this.switchActive(1 - p, t); await this.emit('switch', { p: 1 - p }); break;
        }
        case 'forceSwitchOpp': {
          if (!op.bench.length) break;
          const [t] = await this.ask(1 - p, { purpose: 'forcedSwitch', options: op.bench.slice(), from: 'board' });
          this.switchActive(1 - p, t); await this.emit('switch', { p: 1 - p }); break;
        }
        case 'shuffleHands': {
          for (const q of [p, 1 - p]) { const P = this.P[q]; P.hand.slice().forEach((x) => { this.removeFromZones(x); P.deck.push(x); }); P.pendingMk = []; this.shuffle(q); }
          await this.emit('shuffle', { p }); await this.emit('shuffle', { p: 1 - p });
          await this.draw(p, f.self); await this.draw(1 - p, f.opp); break;
        }
        case 'bounceOwn': {
          const [t] = await this.ask(p, { purpose: 'bounceOwn', options: pl.bench.slice(), from: 'board' });
          const I = this.inst[t]; const attached = (I.att || []).concat(I.relic ? [I.relic] : []).concat(I.under || []);
          attached.forEach((x) => this.toHand(p, x)); this.toHand(p, t);
          await this.emit('bounce', { p, u: t }); break;
        }
        case 'revealHand': {
          const opts = op.hand.filter((x) => this.c(x).kind !== 'creature');
          await this.emit('revealHand', { p, target: 1 - p });
          if (!opts.length) { await this.ask(p, { purpose: 'viewOnly', options: op.hand.slice(), min: 0, max: 0, from: 'opphand', showAll: true, cancel: true }); break; }
          const [t] = await this.ask(p, { purpose: 'revealHand', options: opts, from: 'opphand', showAll: true, all: op.hand.slice() });
          if (t) { this.toDiscard(t); this.addLog('discarded', { p: 1 - p, id: this.inst[t].id }); }
          break;
        }
        case 'attachHandBench': {
          const chs = pl.hand.filter((x) => this.c(x).kind === 'charge'); if (!chs.length || !pl.bench.length) break;
          const [ch] = await this.ask(p, { purpose: 'pickHandCharge', options: chs, from: 'hand' });
          const [t] = await this.ask(p, { purpose: 'attachTo', options: pl.bench.slice(), from: 'board', charge: ch });
          this.removeFromZones(ch); this.inst[t].att.push(ch);
          if (this.c(ch).aff === 'neu' && this.c(t).aff === 'pri') this.heal(t, 10);
          await this.emit('attach', { p, u: ch, target: t }); break;
        }
        case 'recoverCharges': {
          const opts = pl.discard.filter((x) => this.c(x).kind === 'charge');
          const picks = await this.ask(p, { purpose: 'recoverCharges', options: opts, min: 1, max: Math.min(f.n, opts.length), from: 'discard' });
          picks.forEach((x) => this.toHand(p, x)); break;
        }
        case 'moveCharge': await this.moveChargeFlow(p, null); break;
        case 'discardGod': if (this.domain) { const g = this.domain.uid; this.toDiscard(g); await this.emit('godGone', {}); } break;
      }
    }

    // ---------- AÇÕES ----------
    async doAction(p, u) {
      const pl = this.P[p]; const op = this.P[1 - p]; const c = this.c(u);
      pl.flags.action = true; pl.st.actions++;
      this.removeFromZones(u); pl.discard.push(u);
      this.addLog('action', { p, id: c.id });
      await this.emit('reveal', { p, u });
      switch (c.act) {
        case 'swapDraw': {
          const [t] = await this.ask(p, { purpose: 'switchOwn', options: pl.bench.slice(), from: 'board' });
          this.switchActive(p, t); await this.emit('switch', { p }); await this.draw(p, 2); break;
        }
        case 'seal': {
          const [t] = await this.ask(p, { purpose: 'gust', options: op.bench.slice(), from: 'board' });
          this.switchActive(1 - p, t); this.inst[t].effs.push({ k: 'noRetreat', exp: this.turn + 1 });
          await this.emit('switch', { p: 1 - p }); break;
        }
        case 'sacrifice': {
          const [t] = await this.ask(p, { purpose: 'sacrifice', options: pl.bench.slice(), from: 'board' });
          const att = (this.inst[t].att || []).slice();
          let moved = [];
          const others = this.inPlay(p).filter((x) => x !== t);
          if (att.length && others.length) {
            moved = await this.ask(p, { purpose: 'sacCharges', options: att, min: 0, max: Math.min(2, att.length), from: 'list', src: t });
            if (moved.length) {
              const [to] = await this.ask(p, { purpose: 'attachTo', options: others, from: 'board', src: t });
              moved.forEach((x) => { const a = this.inst[t].att; a.splice(a.indexOf(x), 1); this.inst[to].att.push(x); });
            }
          }
          await this.emit('sacrifice', { p, u: t });
          this.discardCreature(t);
          await this.sync();
          await this.draw(p, 3); break;
        }
        case 'draw3': await this.draw(p, 3); break;
        case 'reshuffle6': {
          pl.hand.slice().forEach((x) => { this.removeFromZones(x); pl.deck.push(x); }); pl.pendingMk = [];
          this.shuffle(p); await this.emit('shuffle', { p }); await this.draw(p, 6); break;
        }
      }
      await this.sync();
    }
    discardCreature(u) {
      const I = this.inst[u]; const o = I.owner;
      const extra = (I.att || []).concat(I.relic ? [I.relic] : []).concat(I.under || []);
      extra.forEach((x) => { this.removeFromZones(x); this.clearPlay(x); this.P[o].discard.push(x); });
      this.toDiscard(u);
    }

    // ---------- ATAQUE ----------
    baseDamage(att, def, atk, ctx) {
      const p = this.inst[att].owner; const op = 1 - p;
      let d = atk.dmg || 0;
      for (const f of atk.fx) {
        switch (f.t) {
          case 'coins': d += (ctx.heads != null ? ctx.heads : f.n * 0.5) * f.v; break;
          case 'coinPlus': d += ctx.coinPlus == null ? f.v * 0.5 : (ctx.coinPlus ? f.v : 0); break;
          case 'perCharge': d += f.v * (this.inst[f.who === 'self' ? att : def].att || []).length; break;
          case 'perDmg': d += f.v * Math.floor((this.inst[att].dmg || 0) / 10); break;
          case 'perBench': d += f.v * this.P[f.who === 'self' ? p : op].bench.length; break;
          case 'vsRace': if (def && this.c(def).race === f.race) d += f.v; break;
          case 'vsCond': if (def && this.anyCond(def)) d += f.v; break;
          case 'vsDamaged': if (def && (this.inst[def].dmg || 0) > 0) d += f.v; break;
          case 'tag': d += f.v * this.inPlay(p).filter((x) => x !== att && this.c(x).tags.includes(f.tag)).length; break;
        }
      }
      return d;
    }
    // dano final ao Ativo do oponente (pipeline completo)
    finalDamage(att, def, base, ctx) {
      if (base <= 0) return { dmg: 0, weak: false, res: false };
      const p = this.inst[att].owner; const op = 1 - p;
      const ac = this.c(att), dc = this.c(def); const ar = this.relic(att), dr = this.relic(def);
      let d = base;
      if (ar) {
        d += (ar.atkUp || 0) - (ar.atkDown || 0);
        if (ar.raceAtk && ac.race === ar.raceAtk.race) d += ar.raceAtk.v;
        if (ar.vsRace && dc.race === ar.vsRace.race) d += ar.vsRace.v;
        if (ar.vsAff && dc.aff === ar.vsAff.aff) d += ar.vsAff.v;
        if (ar.vsLegend && dc.legend) d += ar.vsLegend;
        if (ar.vsDamaged && (this.inst[def].dmg || 0) > 0) d += ar.vsDamaged;
        if (ar.vsCond && this.anyCond(def)) d += ar.vsCond;
        if (ar.vsPoison && this.hasCond(def, 'poison')) d += ar.vsPoison;
        if (ar.perDiscardCreature) d += Math.min(ar.perDiscardCreature.max, ar.perDiscardCreature.v * this.discardCount(p, 'creature'));
      }
      this.contsOf(p, 'atkUp').forEach((f) => { d += f.v; });
      this.contsOf(p, 'affAtkUp').forEach((f) => { if (f.aff === ac.aff) d += f.v; });
      this.passivesOf(p, 'affBoost').forEach(({ a }) => { if (a.aff === ac.aff) d += a.v; });
      if (this.godIs('kragmor') && ac.aff === 'ign') d += 10;
      d += this.effSum(att, 'atk');
      if (this.hasEff(att, 'force')) { d += 20; if (ctx) ctx.useForce = true; }
      if (this.P[p].bench.some((x) => { const r = this.relic(x); return r && r.benchAura; })) d += 10;
      d -= this.effMax(att, 'feeble');
      let weak = false, res = false;
      if (G.WEAK[dc.aff] === ac.aff) { d += 30; weak = true; }
      const ignore = ar && ar.ignoreReduce;
      if (dc.res && dc.res === ac.aff && !ignore) { d -= 20; res = true; }
      if (!ignore) {
        if (dc.ab && dc.ab.k === 'dr') d -= dc.ab.v;
        if (dr && dr.dr) d -= dr.dr;
        this.contsOf(op, 'dmgDown').forEach((f) => { d -= f.v; });
        this.contsOf(op, 'activeDmgDown').forEach((f) => { d -= f.v; });
        if (this.godIs('sylvarok') && dc.aff === 'pri') d -= 20;
        d -= this.effSum(def, 'guard');
        if (this.hasEff(def, 'aegis')) { d -= 30; if (ctx) ctx.useAegis = true; }
      }
      if (dr && dr.takeMore) d += dr.takeMore;
      d += this.effMax(def, 'expose');
      if (this.hasEff(def, 'ward')) d = 0;
      return { dmg: Math.max(0, d), weak, res };
    }
    benchProtected(p) {
      return this.passivesOf(p, 'benchWard').length > 0 || this.contsOf(p, 'benchGuard').length > 0;
    }
    // prévia (IA/mentor): dano esperado no Ativo
    previewAttack(att, i, def) {
      const atk = this.c(att).attacks[i]; def = def || this.P[1 - this.inst[att].owner].active;
      if (!def) return { dmg: 0 };
      if (atk.snipe) { const b = this.baseDamage(att, def, atk, {}); return this.finalDamage(att, def, b, null); }
      let mult = 1; if (atk.fx.some((f) => f.t === 'coinFail')) mult = 0.5;
      if (this.hasCond(att, 'madness')) mult *= 0.5;
      const b = this.baseDamage(att, def, atk, {});
      const r = this.finalDamage(att, def, b, null); r.dmg = Math.round(r.dmg * mult / 10) * 10; r.base = b;
      return r;
    }

    async doAttack(p, i) {
      const pl = this.P[p]; const op = this.P[1 - p];
      const att = pl.active; const atk = this.c(att).attacks[i];
      pl.st.attacks++;
      this.addLog('attack', { p, id: this.inst[att].id, i });
      await this.emit('attackStart', { p, u: att, i });
      const ctx = { attacker: att };
      // Loucura
      if (this.hasCond(att, 'madness')) {
        const ok = await this.flip('madness');
        if (!ok) {
          this.placeDamage(att, 30); this.addLog('madFail', { id: this.inst[att].id });
          await this.emit('damage', { u: att, v: 30, placed: true }); await this.sync();
          await this.resolveKOs({ attacker: null }); return;
        }
      }
      // moedas pré-dano
      for (const f of atk.fx) {
        if (f.t === 'coinFail') { const ok = await this.flip('atk'); if (!ok) { this.addLog('atkFail', {}); await this.emit('miss', { u: att }); return; } }
        if (f.t === 'coinPlus') ctx.coinPlus = await this.flip('atk');
        if (f.t === 'coins') { let h = 0; for (let k = 0; k < f.n; k++) if (await this.flip('atk')) h++; ctx.heads = h; }
      }
      // alvo
      let target = op.active;
      if (atk.snipe) {
        const opts = this.inPlay(1 - p);
        [target] = await this.ask(p, { purpose: 'snipe', options: opts, from: 'board', src: att, v: atk.dmg });
      }
      const defActive = op.active;
      let dealt = 0;
      if (target) {
        const base = this.baseDamage(att, target, atk, ctx);
        if (target === op.active) {
          const r = this.finalDamage(att, target, base, ctx);
          dealt = r.dmg;
          if (ctx.useForce) this.inst[att].effs = this.inst[att].effs.filter((e) => e.k !== 'force');
          if (ctx.useAegis) this.inst[target].effs = this.inst[target].effs.filter((e) => e.k !== 'aegis');
          await this.emit('hit', { from: att, to: target, v: dealt, weak: r.weak, res: r.res, aff: this.c(att).aff, base });
          if (dealt > 0) this.placeDamage(target, dealt);
          this.addLog('dmg', { id: this.inst[target].id, v: dealt, weak: r.weak, res: r.res });
          pl.st.dmg += dealt; pl.st.maxHit = Math.max(pl.st.maxHit, dealt);
          await this.sync();
          if (dealt > 0) {
            // Doms/Relíquias reativos do defensor
            const dcab = this.c(target).ab; const dr = this.relic(target);
            let thorns = (dcab && dcab.k === 'thorns' ? dcab.v : 0) + (dr && dr.thorns ? dr.thorns : 0);
            if (thorns) { this.placeDamage(att, thorns); await this.emit('damage', { u: att, v: thorns, placed: true }); }
            if (dr && dr.madnessOnHit && this.applyCond(att, 'madness', 1 - p)) await this.emit('cond', { u: att, k: 'madness' });
            if (dr && dr.drawOnHit && this.hpLeft(target) > 0) await this.draw(1 - p, dr.drawOnHit);
            if (this.godIs('morvath') && this.c(att).aff === 'occ') { const h = this.heal(att, 20); if (h) await this.emit('heal', { u: att, v: h }); }
          }
        } else {
          // dano de ataque à Reserva: sem Fraqueza/Resistência/bônus
          dealt = this.benchProtected(1 - p) ? 0 : base;
          await this.emit('hit', { from: att, to: target, v: dealt, aff: this.c(att).aff, bench: true });
          if (dealt > 0) this.placeDamage(target, dealt);
          pl.st.dmg += dealt; pl.st.maxHit = Math.max(pl.st.maxHit, dealt);
          this.addLog('dmg', { id: this.inst[target].id, v: dealt });
          await this.sync();
        }
      }
      // efeitos pós-dano (na ordem impressa)
      let doSwitchSelf = false, doForce = false;
      for (const f of atk.fx) {
        if (this.over) return;
        const oa = op.active;
        switch (f.t) {
          case 'cond':
            if (oa) { if (f.coin && !(await this.flip('cond'))) break; if (this.applyCond(oa, f.c, p)) await this.emit('cond', { u: oa, k: f.c }); }
            break;
          case 'recoil': this.placeDamage(att, f.v); await this.emit('damage', { u: att, v: f.v, placed: true }); break;
          case 'healSelf': { const h = this.heal(att, f.v); if (h) await this.emit('heal', { u: att, v: h }); break; }
          case 'healTeam': for (const x of this.inPlay(p)) { const h = this.heal(x, f.v); if (h) await this.emit('heal', { u: x, v: h }); } break;
          case 'benchHit': {
            if (!op.bench.length) break;
            const prot = this.benchProtected(1 - p);
            let targets = op.bench.slice();
            if (!f.all) targets = await this.ask(p, { purpose: 'benchHit', v: f.v, options: op.bench.slice(), from: 'board', src: att });
            for (const t of targets) { const v = prot ? 0 : f.v; if (v) this.placeDamage(t, v); pl.st.dmg += v; await this.emit('hit', { from: att, to: t, v, aff: this.c(att).aff, bench: true, splash: true }); }
            await this.sync(); break;
          }
          case 'discardSelf': { const ds = this.chooseChargesToDiscard(att, f.n, f.aff); ds.forEach((x) => this.toDiscard(x)); break; }
          case 'stripOpp': {
            if (!oa || !(this.inst[oa].att || []).length) break;
            if (f.coin && !(await this.flip('strip'))) break;
            await this.stripOne(p, oa); break;
          }
          case 'steal': {
            if (!oa || !(this.inst[oa].att || []).length || !this.isInPlay(att)) break;
            if (f.coin && !(await this.flip('strip'))) break;
            const [ch] = await this.ask(p, { purpose: 'stealWhich', options: this.inst[oa].att.slice(), from: 'list', src: oa });
            if (ch) { const a2 = this.inst[oa].att; a2.splice(a2.indexOf(ch), 1); this.inst[att].att.push(ch); this.addLog('steal', { p, id: this.inst[ch].id, from: this.inst[oa].id, to: this.inst[att].id }); await this.emit('attach', { p, u: ch, target: att, from: oa, steal: true }); }
            break;
          }
          case 'draw': await this.draw(p, f.n); break;
          case 'seal': if (oa) this.inst[oa].effs.push({ k: 'noRetreat', exp: this.turn + 1 }); break;
          case 'guard': this.inst[att].effs.push({ k: 'guard', v: f.v, exp: this.turn + 1 }); break;
          case 'exhaust': this.inst[att].effs.push({ k: 'noAtk', exp: this.turn + 2 }); break;
          case 'weaken': if (oa) { this.inst[oa].effs.push({ k: 'feeble', v: f.v, exp: this.turn + 1 }); await this.emit('debuff', { u: oa, k: 'feeble' }); } break;
          case 'expose': if (oa) { this.inst[oa].effs.push({ k: 'expose', v: f.v, exp: this.turn + 2 }); await this.emit('debuff', { u: oa, k: 'expose' }); } break;
          case 'handDisrupt': {
            if (!op.hand.length) break;
            if (f.coin && !(await this.flip('disrupt'))) break;
            const x = op.hand[this.rng.int(op.hand.length)]; this.toDiscard(x);
            this.addLog('discarded', { p: 1 - p, id: this.inst[x].id }); await this.emit('handDiscard', { p: 1 - p, u: x }); break;
          }
          case 'switchSelf': doSwitchSelf = true; break;
          case 'forceSwitch': doForce = true; break;
        }
      }
      // relíquia do atacante
      const ar = this.relic(att);
      if (ar && op.active === defActive && defActive) {
        if (ar.poisonOnAttack && this.applyCond(defActive, 'poison', p)) await this.emit('cond', { u: defActive, k: 'poison' });
        if (ar.tranceOnAttack && this.applyCond(defActive, 'trance', p)) await this.emit('cond', { u: defActive, k: 'trance' });
        if (ar.tranceCoinOnAttack && (await this.flip('cond')) && this.applyCond(defActive, 'trance', p)) await this.emit('cond', { u: defActive, k: 'trance' });
      }
      if (ar && ar.healOnAttack) { const h = this.heal(att, ar.healOnAttack); if (h) await this.emit('heal', { u: att, v: h }); }
      await this.sync();
      const defWasKO = defActive && this.hpLeft(defActive) <= 0;
      await this.resolveKOs({ attacker: att, byAttack: true });
      if (this.over) return;
      if (doSwitchSelf && pl.active === att && pl.bench.length) {
        const pick = await this.ask(p, { purpose: 'switchSelf', options: pl.bench.slice(), min: 0, max: 1, from: 'board', cancel: true });
        if (pick[0]) { this.switchActive(p, pick[0]); await this.emit('switch', { p }); }
      }
      if (doForce && !defWasKO && op.active === defActive && op.bench.length) {
        const [t] = await this.ask(1 - p, { purpose: 'forcedSwitch', options: op.bench.slice(), from: 'board' });
        this.switchActive(1 - p, t); await this.emit('switch', { p: 1 - p });
      }
      await this.sync();
    }

    // ---------- DERROTAS ----------
    async resolveKOs(ctx) {
      ctx = ctx || {};
      let guard = 0;
      while (!this.over && guard++ < 20) {
        const kos = this.allInPlay().filter((u) => this.hpLeft(u) <= 0);
        if (!kos.length) break;
        const claims = [0, 0]; const pending = [];
        for (const u of kos) {
          const I = this.inst[u]; const c = this.c(u); const owner = I.owner; const other = 1 - owner;
          const r = this.relic(u);
          await this.emit('ko', { u });
          this.addLog('ko', { p: owner, id: I.id });
          const byAtk = ctx.byAttack && ctx.attacker && this.inst[ctx.attacker] && this.inst[ctx.attacker].owner === other;
          // gatilhos
          if (c.ab && c.ab.k === 'curse' && byAtk && this.isInPlay(ctx.attacker) && ctx.attacker !== u) pending.push({ t: ctx.attacker, v: c.ab.v });
          if (r && r.curse && byAtk && this.isInPlay(ctx.attacker) && ctx.attacker !== u) pending.push({ t: ctx.attacker, v: r.curse });
          if (byAtk && this.isInPlay(ctx.attacker) && !kos.includes(ctx.attacker)) {
            const ar = this.relic(ctx.attacker);
            if (ar && ar.killDraw) pending.push({ draw: other, n: ar.killDraw });
            if (ar && ar.killHealFull) this.inst[ctx.attacker].dmg = 0;
          }
          let n = 1 + (c.legend ? 1 : 0) + (r && r.extraPrize ? 1 : 0) - (c.legend && r && r.legendPrizeReduce ? 1 : 0);
          claims[other] += Math.max(0, n);
          if (byAtk) { const so = this.P[other].st; so.killsBy = so.killsBy || {}; const aid = this.inst[ctx.attacker].id; so.killsBy[aid] = (so.killsBy[aid] || 0) + 1; }
          { const sw = this.P[owner].st; sw.fallen = sw.fallen || {}; sw.fallen[I.id] = (sw.fallen[I.id] || 0) + 1; }
          const st = this.P[other].st; st.kos++; st.kosAff[c.aff] = (st.kosAff[c.aff] || 0) + 1; if (c.legend) st.legendKos++;
          // ao sair: cargas, relíquia, base
          const att = (I.att || []).slice();
          if (r && r.koReturn) { att.forEach((x) => { const a = I.att; a.splice(a.indexOf(x), 1); this.toHand(owner, x); }); }
          this.discardCreature(u);
          if (r && r.koDraw) pending.push({ draw: owner, n: r.koDraw });
          if (c.ab && c.ab.k === 'koDraw') pending.push({ draw: owner, n: c.ab.n });
          this.contsOf(owner, 'koDraw').forEach((f) => pending.push({ draw: owner, n: f.n }));
          if (r && r.koHandDisrupt && byAtk) pending.push({ disrupt: other, n: r.koHandDisrupt });
        }
        await this.sync();
        // Almas
        for (const q of [this.cur, 1 - this.cur]) {
          const n = Math.min(claims[q], this.P[q].prizes.length);
          for (let k = 0; k < n; k++) {
            const pz = this.P[q].prizes[0]; this.toHand(q, pz); this.P[q].st.prizes++;
          }
          if (n) { this.addLog('prize', { p: q, n }); await this.emit('prize', { p: q, n }); }
        }
        this.updateDiff();
        this.checkWin();
        if (this.over) { this.endTurnSignal(); return; }
        for (const x of pending) {
          if (x.t && this.isInPlay(x.t)) { this.placeDamage(x.t, x.v); await this.emit('damage', { u: x.t, v: x.v, placed: true }); }
          if (x.draw != null) await this.draw(x.draw, x.n);
          if (x.disrupt != null) { const P = this.P[x.disrupt]; for (let k = 0; k < x.n && P.hand.length; k++) { const y = P.hand[this.rng.int(P.hand.length)]; this.toDiscard(y); } }
        }
        await this.sync();
      }
      if (this.over) return;
      // promoções (oponente do jogador da vez primeiro)
      for (const q of [1 - this.cur, this.cur]) {
        const pl = this.P[q];
        if (!pl.active && pl.bench.length) {
          const [t] = await this.ask(q, { purpose: 'promote', options: pl.bench.slice(), from: 'board' });
          this.removeFromZones(t); pl.active = t; this.clearTurnState(t);
          this.addLog('promote', { p: q, id: this.inst[t].id });
          await this.emit('promote', { p: q, u: t }); await this.sync();
        }
      }
    }
    updateDiff() { for (const q of [0, 1]) { const behind = this.P[q].prizes.length - this.P[1 - q].prizes.length; this.P[q].st.maxBehind = Math.max(this.P[q].st.maxBehind || 0, behind); } }
    checkWin() {
      if (this.over) return;
      const w = [false, false];
      for (const q of [0, 1]) {
        if (this.P[q].prizes.length === 0) w[q] = true;
        if (this.inPlay(1 - q).length === 0) w[q] = true;
      }
      if (w[0] && w[1]) {
        // Morte Súbita: vence quem pegou mais Almas; empate = empate
        const a = this.P[0].st.prizes, b = this.P[1].st.prizes;
        this.over = true; this.endReason = 'sudden'; this.winner = a > b ? 0 : b > a ? 1 : null;
      } else if (w[0] || w[1]) {
        const q = w[0] ? 0 : 1; this.over = true; this.winner = q;
        this.endReason = this.P[q].prizes.length === 0 ? 'prizes' : 'wipe';
      }
      if (this.over) this.addLog('win', { p: this.winner, reason: this.endReason });
    }

    // ---------- MARCADORES ----------
    async resolveMarkers() {
      let guard = 0;
      for (const q of [this.cur, 1 - this.cur]) {
        const pl = this.P[q];
        while (pl.pendingMk.length && guard++ < 30 && !this.over) {
          const u = pl.pendingMk.shift();
          if (!pl.hand.includes(u)) continue;
          const c = this.c(u); pl.st.markers++;
          this.addLog('marker', { p: q, id: c.id });
          await this.emit('reveal', { p: q, u, marker: true });
          const mine = this.inPlay(q);
          switch (c.mk) {
            case 'life': {
              const opts = mine.filter((x) => (this.inst[x].dmg || 0) > 0 && this.canBeHealed(x));
              if (opts.length) { const [t] = await this.ask(q, { purpose: 'heal', v: 30, options: opts, from: 'board', src: u }); const h = this.heal(t, 30); await this.emit('heal', { u: t, v: h }); }
              break;
            }
            case 'mana': {
              const ch = pl.discard.filter((x) => this.c(x).kind === 'charge');
              if (ch.length && mine.length) {
                const [t] = await this.ask(q, { purpose: 'attachTo', options: mine, from: 'board', src: u });
                const [cc] = await this.ask(q, { purpose: 'pickCharges', options: ch, min: 1, max: 1, from: 'discard', src: t });
                this.removeFromZones(cc); this.inst[t].att.push(cc); await this.emit('attach', { p: q, u: cc, target: t, from: 'discard' });
              }
              break;
            }
            case 'force': if (pl.active) this.inst[pl.active].effs.push({ k: 'force', exp: (q === this.cur ? this.turn + 2 : this.turn + 1) }); break;
            case 'guard': if (pl.active) this.inst[pl.active].effs.push({ k: 'aegis', exp: q === this.cur ? this.turn + 1 : this.turn + 2 }); break;
            case 'luck': break;
          }
          this.toDiscard(u);
          await this.draw(q, c.mk === 'luck' ? 2 : 1);
          await this.sync();
        }
      }
    }

    // ---------- ENTRE TURNOS ----------
    async checkup() {
      const ended = this.cur;
      await this.emit('checkup', {});
      for (const q of [ended, 1 - ended]) {
        const a = this.P[q].active; if (!a) continue;
        const I = this.inst[a];
        if (I.conds.poison) { this.placeDamage(a, 20); this.addLog('poisonTick', { id: I.id }); await this.emit('damage', { u: a, v: 20, placed: true, cond: 'poison' }); }
        if (I.conds.burn) {
          this.placeDamage(a, 20); this.addLog('burnTick', { id: I.id }); await this.emit('damage', { u: a, v: 20, placed: true, cond: 'burn' });
          if (await this.flip('burnCure')) { delete I.conds.burn; this.addLog('condEnd', { id: I.id, k: 'burn' }); }
        }
        if (I.conds.trance) { if (await this.flip('trance')) { delete I.conds.trance; this.addLog('condEnd', { id: I.id, k: 'trance' }); } }
        if (I.conds.stun && q === ended) { delete I.conds.stun; this.addLog('condEnd', { id: I.id, k: 'stun' }); }
      }
      // curas e danos contínuos
      for (const q of [ended, 1 - ended]) {
        const mine = this.inPlay(q);
        for (const u of mine) {
          const c = this.c(u); const r = this.relic(u); const I = this.inst[u];
          let h = 0;
          if (this.godIs('aurelia') && c.aff === 'sac') h += 10;
          if (c.ab && c.ab.k === 'regen') h += c.ab.v;
          if (r && r.regen) h += r.regen;
          if (h) { const hh = this.heal(u, h); if (hh) await this.emit('heal', { u, v: hh }); }
          if (r && r.elixir && (I.dmg || 0) >= r.elixir) { const rel = I.relic; I.relic = null; this.P[q].discard.push(rel); const hh = this.heal(u, r.elixir); await this.emit('heal', { u, v: hh }); }
          if (r && r.selfBurn && q === ended) { this.placeDamage(u, r.selfBurn); await this.emit('damage', { u, v: r.selfBurn, placed: true }); }
        }
        this.passivesOf(q, 'regenTeam').forEach(({ a }) => { mine.forEach((u) => this.heal(u, a.v)); });
        if (q === ended) this.contsOf(q, 'healEnd').forEach((f) => mine.forEach((u) => this.heal(u, f.v)));
        if (q !== ended) this.contsOf(q, 'oppPing').forEach((f) => { const oa = this.P[ended].active; if (oa) this.placeDamage(oa, f.v); });
      }
      // expirações
      for (const q of [0, 1]) {
        this.inPlay(q).forEach((u) => { const I = this.inst[u]; I.effs = (I.effs || []).filter((e) => e.exp > this.turn); });
        const keep = []; this.P[q].conts.forEach((x) => { if (x.exp > this.turn) keep.push(x); else { this.P[q].discard.push(x.uid); this.addLog('contEnd', { id: this.inst[x.uid].id }); } });
        this.P[q].conts = keep;
      }
      await this.sync();
      await this.resolveKOs({});
      if (!this.over) await this.resolveMarkers();
    }

    // ---------- visão pública (para IA justa) ----------
    snapshotFor(p) { return this; }
  }
  G.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
