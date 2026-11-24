/* Almas de Orvalon — IA heurística + gerador de decks */
(function (root) {
  const G = root.G;
  const H = G.AIH = {};
  const GM = () => G.Game;

  H.prizesFor = (g, u) => { const c = g.c(u); const r = g.relic(u); return Math.max(0, 1 + (c.legend ? 1 : 0) + (r && r.extraPrize ? 1 : 0) - (c.legend && r && r.legendPrizeReduce ? 1 : 0)); };
  H.value = (g, u) => { const c = g.c(u); const I = g.I(u); return G.cardPower(c) + (I.att ? I.att.length * 14 : 0) + (c.legend ? 25 : 0) + (I.relic ? 10 : 0); };
  H.need = (g, u, extra) => { const affs = g.attachedAffs(u).concat(extra || []); let m = 99; g.c(u).attacks.forEach((a) => { m = Math.min(m, GM().missing(affs, g.attackCost(u, a))); }); return m; };
  H.progress = (g, u, aff) => {
    const before = g.attachedAffs(u); const after = before.concat([aff]); let s = 0;
    g.c(u).attacks.forEach((a) => { const cost = g.attackCost(u, a); const mb = GM().missing(before, cost), ma = GM().missing(after, cost); if (ma < mb) s += (ma === 0 ? 2 : 1) * (10 + (a.dmg || 25)); });
    return s;
  };
  H.readyAttacks = (g, u) => g.c(u).attacks.map((a, i) => i).filter((i) => GM().canPay(g.attachedAffs(u), g.attackCost(u, g.c(u).attacks[i])));
  H.bestDmg = (g, u, def) => {
    const p = g.I(u).owner; def = def || g.P[1 - p].active; if (!def) return 0; let best = 0;
    g.c(u).attacks.forEach((a, i) => { if (!GM().canPay(g.attachedAffs(u), g.attackCost(u, a))) return; best = Math.max(best, g.previewAttack(u, i, def).dmg); });
    return best;
  };
  H.threat = (g, p) => {
    const oa = g.P[1 - p].active, me = g.P[p].active; if (!oa || !me) return 0; let best = 0;
    g.c(oa).attacks.forEach((a, i) => { if (GM().missing(g.attachedAffs(oa), g.attackCost(oa, a)) > 1) return; best = Math.max(best, g.previewAttack(oa, i, me).dmg); });
    return best;
  };
  H.canStrike = (g, p) => { const a = g.P[p].active; return !!a && g.c(a).attacks.some((_, i) => { const b = g.attackBlocked(p, i); return b === null || b === 'cost'; }) && !(p === g.first && g.turn === 1); };

  H.attackScore = (g, p, i) => {
    const a = g.P[p].active; const atk = g.c(a).attacks[i]; const op = g.P[1 - p];
    let best = { s: -1, target: op.active, dmg: 0, ko: false };
    const targets = atk.snipe ? g.inPlay(1 - p) : [op.active];
    for (const t of targets) {
      const dmg = t === op.active ? g.previewAttack(a, i, t).dmg : (g.benchProtected(1 - p) ? 0 : g.baseDamage(a, t, atk, {}));
      const left = g.hpLeft(t); let s = dmg;
      if (dmg >= left) s += 110 * H.prizesFor(g, t) + 20; else s += Math.min(dmg, left) * 0.2;
      if (s > best.s) best = { s, target: t, dmg, ko: dmg >= left };
    }
    let s = best.s;
    atk.fx.forEach((f) => {
      switch (f.t) {
        case 'cond': if (op.active && !g.hasCond(op.active, f.c) && !g.condImmune(op.active, f.c)) s += (f.coin ? 8 : 16) * (f.c === 'stun' || f.c === 'trance' ? 1.4 : 1); break;
        case 'recoil': s -= f.v * 0.6; if (g.hpLeft(a) <= f.v) s -= 60 * H.prizesFor(g, a); break;
        case 'healSelf': s += Math.min(g.I(a).dmg || 0, f.v) * 0.7; break;
        case 'healTeam': s += G.sum(g.inPlay(p), (x) => Math.min(g.I(x).dmg || 0, f.v)) * 0.6; break;
        case 'benchHit': if (op.bench.length && !g.benchProtected(1 - p)) {
          if (f.all) op.bench.forEach((x) => { s += f.v * 0.8; if (g.hpLeft(x) <= f.v) s += 80 * H.prizesFor(g, x); });
          else s += op.bench.some((x) => g.hpLeft(x) <= f.v) ? 90 : f.v * 0.8;
        } break;
        case 'discardSelf': s -= 12 * f.n; break;
        case 'stripOpp': s += op.active && (g.I(op.active).att || []).length ? (f.coin ? 10 : 20) : 0; break;
        case 'steal': s += op.active && (g.I(op.active).att || []).length ? (f.coin ? 14 : 26) : 0; break;
        case 'draw': s += 8 * f.n; break;
        case 'seal': s += 4; break;
        case 'guard': s += 8; break;
        case 'exhaust': s -= best.ko ? 5 : 25; break;
        case 'handDisrupt': s += op.hand.length ? 8 : 0; break;
        case 'switchSelf': s += 4; break;
        case 'forceSwitch': s += best.ko ? 0 : 10; break;
        case 'weaken': if (!best.ko && op.active) s += H.threat(g, p) > 0 ? f.v * 0.9 : f.v * 0.4; break;
        case 'expose': if (!best.ko) s += f.v * 0.8; break;
      }
    });
    return { i, s, target: best.target, dmg: best.dmg, ko: best.ko };
  };
  H.bestAttack = (g, p) => {
    const a = g.P[p].active; if (!a) return null; let best = null;
    g.c(a).attacks.forEach((_, i) => { if (!g.canAttack(p, i)) return; const r = H.attackScore(g, p, i); if (!best || r.s > best.s) best = r; });
    return best && best.s > 0 ? best : null;
  };
  H.koTargetOnBench = (g, p) => {
    const act = g.P[p].active; if (!act || !H.canStrike(g, p)) return null; let best = null;
    g.P[1 - p].bench.forEach((x) => {
      g.c(act).attacks.forEach((atk, i) => {
        if (!GM().canPay(g.attachedAffs(act), g.attackCost(act, atk))) return;
        const d = g.previewAttack(act, i, x).dmg;
        if (d >= g.hpLeft(x)) { const v = H.prizesFor(g, x) * 100 + H.value(g, x); if (!best || v > best.v) best = { u: x, v }; }
      });
    });
    return best;
  };

  class AI {
    constructor(skill, opts) { opts = opts || {}; this.skill = skill == null ? 0.6 : skill; this.rng = G.rng(opts.seed || ((Math.random() * 1e9) >>> 0)); this.kind = 'ai'; }
    async pause(g, f) { if (g.view && g.view.aiWait) await g.view.aiWait(f || 1); }
    async main(g, p) {
      const noise = 1 - this.skill; let fails = 0;
      for (let k = 0; k < 45; k++) {
        if (g.over || g.turnEnded || g.cur !== p) return;
        const scored = g.legalActions(p).map((a) => ({ a, s: this.score(g, p, a) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s);
        if (!scored.length) break;
        let pick = scored[0];
        if (scored.length > 1 && this.rng() < noise * 0.55) pick = scored[1 + this.rng.int(Math.min(2, scored.length - 1))];
        if (k > 1 && this.rng() < noise * 0.16) break;
        await this.pause(g, 1);
        const ok = await g.perform(p, pick.a);
        if (!ok && ++fails > 4) break;
      }
      if (g.over || g.turnEnded || g.cur !== p) return;
      let best = H.bestAttack(g, p);
      if (best && this.skill < 0.6 && this.rng() < noise * 0.55) {
        const okI = g.c(g.P[p].active).attacks.map((_, i) => i).filter((i) => g.canAttack(p, i));
        best = { i: okI[this.rng.int(okI.length)], target: best.target };
      }
      await this.pause(g, 1.2);
      if (best) { this._snipe = best.target; await g.perform(p, { type: 'attack', i: best.i }); }
      else await g.perform(p, { type: 'end' });
    }
    score(g, p, a) {
      const pl = g.P[p];
      switch (a.type) {
        case 'bench': { const c = g.c(a.u); let s = 38 + G.cardPower(c) / 4; if (pl.hand.some((x) => g.c(x).from === c.id)) s += 20; if (pl.bench.length >= 3 && c.legend) s -= 15; return s; }
        case 'ascend': return 90;
        case 'attach': return this.scoreAttach(g, p, a);
        case 'relic': return this.scoreRelic(g, p, a);
        case 'effect': return this.scoreEffect(g, p, g.c(a.u));
        case 'action': return this.scoreAction(g, p, g.c(a.u));
        case 'god': return this.scoreGod(g, p, g.c(a.u));
        case 'ability': return this.scoreAbility(g, p, a);
        case 'retreat': return this.scoreRetreat(g, p, a);
      }
      return 0;
    }
    scoreAttach(g, p, a) {
      const pl = g.P[p]; const t = a.target; const ch = g.c(a.u); const isAct = pl.active === t;
      const prog = H.progress(g, t, ch.aff); let s;
      const nb = H.need(g, t), na = H.need(g, t, [ch.aff]);
      if (prog > 0) {
        s = 25 + prog * 0.25;
        if (isAct) { s += 20; if (nb > 0 && na === 0) s += 40; } else s += Math.min(20, H.value(g, t) / 6);
        if (isAct && H.threat(g, p) >= g.hpLeft(t) && na > 0) s -= 18;
      } else s = isAct ? (g.retreatCost(t) > (g.I(t).att || []).length ? 9 : 4) : 3;
      if (ch.aff === 'neu' && g.c(t).aff === 'pri' && g.I(t).dmg) s += 3;
      if (this.skill < 0.35) s += this.rng() * 20;
      return s;
    }
    scoreRelic(g, p, a) {
      const pl = g.P[p]; const t = a.target; const r = g.c(a.u).r; const isAct = pl.active === t; const tc = g.c(t);
      const attacker = isAct ? H.readyAttacks(g, t).length > 0 || H.need(g, t) <= 1 : H.value(g, t) > 40;
      if (r.legendPrizeReduce) return tc.legend ? 50 : 0;
      if (r.onAttach === 'draw2' || r.onAttach === 'topLook3') return 34 - (isAct ? 4 : 0);
      if (r.onAttach === 'searchChargeAttach') return H.need(g, t) > 0 ? 42 : 12;
      if (r.onAttach === 'cureHeal40') return (g.I(t).dmg || 0) >= 30 || g.anyCond(t) ? 44 : 4;
      if (r.extraPrize) return !tc.legend && attacker && isAct ? 26 : 0;
      if (r.atkUp || r.vsRace || r.vsAff || r.vsLegend || r.vsDamaged || r.vsCond || r.perDiscardCreature || r.raceAtk || r.ignoreReduce || r.poisonOnAttack || r.tranceOnAttack || r.tranceCoinOnAttack || r.healOnAttack) {
        if (r.raceAtk && tc.race !== r.raceAtk.race) return 0;
        return attacker ? (isAct ? 44 : 26) : 8;
      }
      if (r.costDown) return g.c(t).attacks.some((x) => x.cost.includes('neu')) ? (isAct ? 40 : 28) : 0;
      if (r.freeRetreat || r.retreatDown) return isAct && tc.ret >= 2 ? 34 : 12;
      if (r.swapA) return isAct ? 6 : 22;
      if (r.benchAura) return isAct ? 4 : 26;
      if (r.lockOppRetreat) return isAct ? 28 : 6;
      if (r.attachDraw) return 24;
      return isAct ? 36 : (H.value(g, t) > 45 ? 22 : 12);
    }
    healBest(g, p, v) { return Math.max(0, ...g.inPlay(p).map((x) => g.canBeHealed(x) ? Math.min(g.I(x).dmg || 0, v) : 0)); }
    switchValue(g, p) {
      const pl = g.P[p]; const act = pl.active; if (!act || !pl.bench.length) return 0;
      const actReady = H.readyAttacks(g, act).length && !g.hasEff(act, 'noAtk') && !g.hasCond(act, 'stun') && !g.hasCond(act, 'trance');
      const actD = actReady ? H.bestDmg(g, act) : 0;
      let bestB = 0; pl.bench.forEach((b) => { if (H.readyAttacks(g, b).length) bestB = Math.max(bestB, H.bestDmg(g, b)); });
      let s = 0;
      if (bestB > actD + 20) s = 40 + (bestB - actD) * 0.2;
      if (g.hasCond(act, 'stun') || g.hasCond(act, 'trance')) s = Math.max(s, bestB > 0 ? 55 : 25);
      if (H.threat(g, p) >= g.hpLeft(act) && (g.c(act).legend || (g.I(act).att || []).length >= 2)) s = Math.max(s, 30);
      return s;
    }
    scoreEffect(g, p, c) {
      const pl = g.P[p]; const op = g.P[1 - p]; const hand = pl.hand.length; let s = 0;
      const ba = () => H.bestAttack(g, p); const dk = pl.deck.length < 10 ? 0.15 : 1;
      for (const f of c.fx) {
        switch (f.t) {
          case 'discardDraw': s += dk * (hand <= 4 ? 30 : 12); break;
          case 'drawDiscard': s += dk * (hand <= 5 ? 26 : 10); break;
          case 'heal': { const h = this.healBest(g, p, f.v); s += h >= 20 ? 10 + h * 0.6 - (f.cost ? 10 : 0) : 0; break; }
          case 'healActive': s += pl.active ? Math.min(g.I(pl.active).dmg || 0, f.v) * 0.6 : 0; break;
          case 'healAll': s += G.sum(g.inPlay(p), (x) => Math.min(g.I(x).dmg || 0, f.v)) * 0.45; break;
          case 'cure': s += pl.active && g.anyCond(pl.active) ? (g.hasCond(pl.active, 'stun') || g.hasCond(pl.active, 'trance') ? 40 : 26) : 0; break;
          case 'revive': s += pl.bench.length < 3 ? 30 : 12; break;
          case 'tempAtk': { const b = ba(); if (b && !b.ko && b.target === op.active) { if (b.dmg > 0 && b.dmg + f.v >= g.hpLeft(op.active)) s += 80; } break; }
          case 'attachDiscard': s += g.inPlay(p).some((x) => H.need(g, x) > 0) ? 38 + 8 * f.n - (f.dmg ? 8 : 0) : 6; break;
          case 'spread': s += 15 + g.inPlay(1 - p).filter((x) => g.hpLeft(x) <= f.v).length * 60; break;
          case 'recover': s += pl.hand.filter((x) => g.c(x).kind === 'creature').length < 2 ? 26 : 8; break;
          case 'discardOppRelic': s += op.active && g.I(op.active).relic ? 34 : 16; break;
          case 'searchAsc': s += g.inPlay(p).some((x) => G.ascensionsOf(g.I(x).id).length && !pl.hand.some((h) => g.c(h).from === g.I(x).id)) ? 44 : 4; break;
          case 'searchBasic': s += f.to === 'bench' ? (pl.bench.length < 4 ? 40 : 0) : (pl.bench.length < 4 && !pl.hand.some((x) => G.isBasicCreature(g.c(x))) ? 36 : 12); break;
          case 'searchCharge': s += pl.hand.filter((x) => g.c(x).kind === 'charge').length === 0 ? 36 : 10; break;
          case 'searchRelic': s += 16; break;
          case 'topLook': s += 20; break;
          case 'tutor': s += hand <= 4 ? 22 : 10; break;
          case 'sealOpp': s += 6; break;
          case 'draw': s += dk * (hand < 6 ? 14 * f.n : 4); break;
          case 'drawTo': s += dk * Math.max(0, f.n - (hand - 1)) * 15; break;
          case 'switchOwn': s += this.switchValue(g, p); break;
          case 'tempShield': { const thr = H.threat(g, p); s += pl.active && thr >= g.hpLeft(pl.active) && thr - f.v < g.hpLeft(pl.active) ? 40 : 0; break; }
          case 'stripOpp': s += op.active && (g.I(op.active).att || []).length ? 24 : 0; break;
          case 'condOpp': s += op.active && !g.hasCond(op.active, f.c) ? 24 : 0; break;
          case 'gustOpp': { const k = H.koTargetOnBench(g, p); s += k ? 70 + k.v * 0.3 : 0; break; }
          case 'shuffleHands': s += hand <= 3 && op.hand.length >= 5 ? 50 : 0; break;
          case 'bounceOwn': s += pl.bench.some((x) => (g.I(x).dmg || 0) >= 50 && !g.I(x).att.length) ? 30 : 0; break;
          case 'revealHand': s += op.hand.length >= 4 ? 30 : 10; break;
          case 'attachHandBench': s += pl.hand.filter((x) => g.c(x).kind === 'charge').length >= 1 && pl.bench.some((x) => H.need(g, x) > 0) ? 40 : 0; break;
          case 'recoverCharges': s += pl.hand.filter((x) => g.c(x).kind === 'charge').length === 0 ? 30 : 8; break;
          case 'forceSwitchOpp': s += op.active && H.bestDmg(g, pl.active || op.active) < g.hpLeft(op.active) && (g.I(op.active).att || []).length >= 2 ? 24 : 0; break;
          case 'moveCharge': s += this.moveValue(g, p) ? 45 : 0; break;
          case 'discardGod': { if (!g.domain) break; const da = g.c(g.domain.uid).aff; const dm = g.inPlay(p).filter((x) => g.c(x).aff === da).length, dt = g.inPlay(1 - p).filter((x) => g.c(x).aff === da).length; s += dt > dm ? 34 : 0; break; }
          case 'atkUp': s += H.canStrike(g, p) ? 34 : 18; break;
          case 'affAtkUp': { const n = g.inPlay(p).filter((x) => g.c(x).aff === f.aff).length; s += pl.active && g.c(pl.active).aff === f.aff ? 40 : n ? 18 : 0; break; }
          case 'dmgDown': case 'activeDmgDown': s += 28; break;
          case 'healEnd': s += G.sum(g.inPlay(p), (x) => g.I(x).dmg || 0) >= 30 ? 28 : 8; break;
          case 'drawExtra': s += pl.deck.length > 12 ? 38 : 0; break;
          case 'condWard': s += g.inPlay(p).some((x) => g.anyCond(x)) ? 40 : 8; break;
          case 'retreatDown': s += pl.active && g.retreatCost(pl.active) >= 2 && this.switchValue(g, p) > 0 ? 26 : 4; break;
          case 'benchGuard': s += 14; break;
          case 'koDraw': s += 18; break;
          case 'oppPing': s += 30; break;
        }
      }
      return s;
    }
    moveValue(g, p) {
      const pl = g.P[p]; const act = pl.active; if (!act || H.need(g, act) === 0) return 0;
      for (const b of pl.bench) for (const ch of (g.I(b).att || [])) { const aff = g.c(ch).aff; if (H.need(g, act, [aff]) === 0) return 1; }
      return 0;
    }
    scoreAction(g, p, c) {
      const pl = g.P[p]; const hand = pl.hand.length;
      switch (c.act) {
        case 'draw3': return pl.deck.length > 10 ? (hand <= 4 ? 52 : 22) : (hand <= 1 && pl.deck.length > 4 ? 28 : 0);
        case 'reshuffle6': return hand <= 2 ? 58 : hand <= 3 ? 40 : hand <= 4 ? 18 : 0;
        case 'swapDraw': { const sv = this.switchValue(g, p); return sv > 0 ? 45 + sv * 0.4 : (hand <= 3 ? 22 : 0); }
        case 'seal': { const k = H.koTargetOnBench(g, p); return k ? 95 + k.v * 0.2 : 0; }
        case 'sacrifice': return hand <= 3 && pl.bench.some((x) => H.value(g, x) < 35) ? 26 : 0;
      }
      return 0;
    }
    scoreGod(g, p, c) {
      const pl = g.P[p]; const mine = g.inPlay(p).filter((x) => g.c(x).aff === c.aff).length; const theirs = g.inPlay(1 - p).filter((x) => g.c(x).aff === c.aff).length;
      if (!mine) return 0; let s = 10 + (mine - theirs) * 14;
      if (g.domain) { const da = g.c(g.domain.uid).aff; const dm = g.inPlay(p).filter((x) => g.c(x).aff === da).length, dt = g.inPlay(1 - p).filter((x) => g.c(x).aff === da).length; s += (dt - dm) * 10; }
      if (c.god === 'nyxara' && !pl.hand.some((x) => g.c(x).kind === 'charge' && g.c(x).aff === 'ene')) s -= 10;
      return s;
    }
    scoreAbility(g, p, a) {
      const s0 = g.abilitySource(a.u).find((x) => x.src === (a.src || 'ab')); if (!s0) return 0; const pl = g.P[p];
      switch (s0.a.k) {
        case 'drawA': return pl.deck.length > 8 ? 48 : 0;
        case 'healA': { const m = this.healBest(g, p, s0.a.v); return m >= 20 ? 30 + m * 0.4 : 0; }
        case 'accelA': { const opts = g.inPlay(p).filter((x) => g.c(x).aff === s0.a.aff && g.hpLeft(x) > 20); return Math.max(0, ...opts.map((x) => H.progress(g, x, s0.a.aff))) > 0 ? 45 : 0; }
        case 'condA': return 42;
        case 'swapA': { const act = pl.active; const actD = H.readyAttacks(g, act).length ? H.bestDmg(g, act) : 0; const myD = H.readyAttacks(g, a.u).length ? H.bestDmg(g, a.u) : 0; return myD > actD + 10 ? 50 : 0; }
        case 'searchA': return pl.hand.filter((x) => g.c(x).kind === 'charge').length < 2 ? 34 : 5;
        case 'moveA': return this.moveValue(g, p) ? 40 : 0;
      }
      return 0;
    }
    scoreRetreat(g, p, a) {
      const pl = g.P[p]; const act = pl.active; const t = a.target; const cost = g.retreatCost(act);
      if (p === g.first && g.turn === 1) return 0;
      const actReady = H.readyAttacks(g, act).length > 0 && !g.hasEff(act, 'noAtk');
      const actD = actReady ? H.bestDmg(g, act) : 0; const tD = H.readyAttacks(g, t).length ? H.bestDmg(g, t) : 0;
      let s = 0;
      if (tD > actD + 20) s = 40 + (tD - actD) * 0.3;
      const thr = H.threat(g, p);
      if (thr >= g.hpLeft(act) && (g.c(act).legend || (g.I(act).att || []).length >= 2) && g.hpLeft(t) > thr) s = Math.max(s, 35);
      if ((g.hasCond(act, 'poison') || g.hasCond(act, 'burn') || g.hasCond(act, 'madness')) && !actReady) s = Math.max(s, 25);
      if (s <= 0) return 0;
      s -= cost * 12;
      const b = H.bestAttack(g, p); if (b && b.ko) s -= 50;
      return s;
    }
    // ---------- escolhas ----------
    activeScore(g, u) {
      const c = g.c(u); let s = c.hp / 5 - c.ret * 4;
      if (c.attacks.some((a) => a.cost.length <= 1)) s += 18;
      if (c.ab && ['drawA', 'healA', 'accelA', 'searchA', 'enterSearch', 'enterDraw', 'moveA'].includes(c.ab.k)) s -= 30;
      if (c.legend) s -= 6; if (G.ascensionsOf(c.id).length) s -= 4;
      return s;
    }
    promoteScore(g, u) {
      if (!u) return -999;
      const ready = H.readyAttacks(g, u).length; const c = g.c(u);
      let s = (ready ? 40 + H.bestDmg(g, u) * 0.5 : 0) + (g.I(u).att || []).length * 10 + g.hpLeft(u) / 5 - c.ret * 3;
      if (c.ab && ['drawA', 'healA', 'accelA', 'searchA', 'moveA'].includes(c.ab.k)) s -= 15;
      return s;
    }
    targetScore(g, p, u, purpose, v) {
      const op = 1 - p; const act = g.P[p].active; const left = g.hpLeft(u);
      let dmg = 0;
      if (purpose === 'gust') dmg = act ? H.bestDmg(g, act, u) : 0;
      else if (g.P[op].active === u && purpose === 'snipe') dmg = g.previewAttack(act, g.c(act).attacks.findIndex((x) => x.snipe), u).dmg;
      else dmg = g.benchProtected(op) ? 0 : (v || 0);
      if (dmg >= left) return 200 * H.prizesFor(g, u) + H.value(g, u);
      return H.value(g, u) * 0.4 + Math.min(dmg, left) * 0.6 - left * 0.1 + (g.c(u).ab ? 8 : 0);
    }
    cardWant(g, p, u) {
      const c = g.c(u); const pl = g.P[p]; const mine = g.inPlay(p).map((x) => g.I(x).id);
      switch (c.kind) {
        case 'creature':
          if (c.stage === 1) return mine.includes(c.from) ? 60 : pl.hand.some((x) => g.I(x).id === c.from) ? 35 : 14;
          return (pl.bench.length < 4 ? 30 : 8) + G.cardPower(c) / 3 + (pl.hand.some((x) => g.c(x).from === c.id) ? 15 : 0);
        case 'charge': { const n = pl.hand.filter((x) => g.c(x).kind === 'charge').length; return Math.max(5, 40 - n * 12) + Math.max(0, ...g.inPlay(p).map((x) => H.progress(g, x, c.aff))) * 0.05; }
        case 'action': return c.act === 'seal' ? 34 : 30;
        case 'effect': return 22; case 'relic': return 20; case 'god': return 16; case 'marker': return 10;
      }
      return 10;
    }
    chargeWant(g, p, u, src) {
      const aff = g.c(u).aff; const targets = src && g.isInPlay && g.inst[src] && g.isInPlay(src) ? [src] : g.inPlay(p);
      return Math.max(0, ...targets.map((x) => H.progress(g, x, aff))) + (aff === 'neu' ? -1 : 0);
    }
    ask(g, req) { try { return this.choose(g, req); } catch (e) { return req.options.slice(0, req.min == null ? 1 : req.min); } }
    choose(g, req) {
      const p = req.p; const pl = g.P[p]; const O = req.options; const max = req.max == null ? 1 : req.max; const min = req.min == null ? 1 : req.min;
      const by = (f, n) => O.slice().sort((x, y) => f(y) - f(x)).slice(0, n == null ? max : n);
      if (!O.length) return [];
      switch (req.purpose) {
        case 'setupActive': return by((u) => this.activeScore(g, u), 1);
        case 'setupBench': return O.slice(0, max);
        case 'promote': case 'switchOwn': case 'forcedSwitch': return by((u) => this.promoteScore(g, u), 1);
        case 'switchSelf': { const b = by((u) => this.promoteScore(g, u), 1)[0]; return this.promoteScore(g, b) > this.promoteScore(g, pl.active) + 15 ? [b] : []; }
        case 'heal': return by((u) => Math.min(g.I(u).dmg || 0, req.v || 30) + H.value(g, u) * 0.1 + (g.isActive(u) ? 5 : 0), 1);
        case 'attachTo': { const aff = req.aff || (req.charge ? g.c(req.charge).aff : null); return by((u) => (aff ? H.progress(g, u, aff) : 20 - H.need(g, u)) + (g.isActive(u) ? 10 : 0) - (g.hpLeft(u) <= 10 ? 100 : 0), 1); }
        case 'gust': case 'benchHit': return by((u) => this.targetScore(g, p, u, req.purpose, req.v), 1);
        case 'snipe': { if (this._snipe && O.includes(this._snipe)) return [this._snipe]; return by((u) => this.targetScore(g, p, u, 'snipe', req.v), 1); }
        case 'searchBasic': case 'searchAsc': case 'searchRelic': case 'tutor': case 'topLook': case 'recover': case 'revive':
          return by((u) => this.cardWant(g, p, u), Math.min(max, O.length));
        case 'searchCharge': case 'searchChargeFor': case 'recoverCharges': case 'pickCharges': case 'reviveCharge': case 'pickHandCharge':
          return by((u) => this.chargeWant(g, p, u, req.src), Math.min(max, O.length));
        case 'discardHand': return O.slice().sort((x, y) => this.cardWant(g, p, x) - this.cardWant(g, p, y)).slice(0, Math.max(1, min));
        case 'discardOppRelic': return by((u) => (g.isActive(u) ? 20 : 0) + H.value(g, u) * 0.1, 1);
        case 'revealHand': return by((u) => this.cardWant(g, 1 - p, u), 1);
        case 'viewOnly': return [];
        case 'moveFrom': return by((u) => (g.isActive(u) ? -10 : (g.I(u).att || []).length), 1);
        case 'moveWhich': return [O[0]];
        case 'moveTo': return by((u) => (g.isActive(u) ? 20 : 0) + (req.charge ? H.progress(g, u, g.c(req.charge).aff) : 0), 1);
        case 'sacrifice': return by((u) => -H.value(g, u), 1);
        case 'sacCharges': return O.slice(0, max);
        case 'bounceOwn': return by((u) => (g.I(u).dmg || 0) + (g.c(u).ab && /^enter/.test(g.c(u).ab.k) ? 30 : 0), 1);
        case 'stealWhich': return by((u) => H.progress(g, pl.active, g.c(u).aff) + 1, 1);
        case 'stripWhich': return by((u) => (g.c(u).aff === 'neu' ? 0 : 1), 1);
      }
      return O.slice(0, Math.max(min, Math.min(1, O.length)));
    }
  }
  G.AI = AI;

  // sugestão para o Mentor (Treino Avançado)
  H.suggest = function (g, p) {
    const ai = new AI(1, { seed: 7 });
    const scored = g.legalActions(p).map((a) => ({ a, s: ai.score(g, p, a) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s);
    if (scored.length) return { a: scored[0].a, s: scored[0].s, alt: scored.slice(1, 3) };
    const b = H.bestAttack(g, p);
    if (b) return { a: { type: 'attack', i: b.i }, s: b.s, info: b };
    return { a: { type: 'end' }, s: 0 };
  };

  // ---------- Gerador de decks ----------
  const CONT = { ign: 'e1_18', sac: 'e1_08', occ: 'e1_05', ene: 'e2_21', pri: 'e2_10' };
  const GOD = { ign: 'm_15', sac: 'm_12', occ: 'm_11', ene: 'm_14', pri: 'm_13' };
  G.buildDeck = function (opt) {
    const rng = G.rng(opt.seed || 1); const q = opt.q == null ? 0.7 : opt.q;
    const affs = [opt.aff].concat(opt.aff2 ? [opt.aff2] : []);
    const deck = []; const cnt = {};
    const allowed = (c) => !(opt.noRare && (c.rarity === 'E' || c.rarity === 'L'));
    const have = (id) => (G.CARDS[id].kind === 'charge' ? 99 : opt.pool ? (opt.pool[id] || 0) : 99);
    const capOk = (c) => !(opt.cap && opt.cap[c.rarity] != null && deck.filter((x) => G.CARDS[x].rarity === c.rarity).length >= opt.cap[c.rarity]);
    const addC = (id, n) => { const c = G.CARDS[id]; if (!c || !allowed(c)) return 0; if (c.kind !== 'charge' && !capOk(c)) return 0; const bid = G.baseId(id); const usedB = () => deck.filter((x) => G.baseId(x) === bid).length; let k = 0; while (k < n && usedB() < G.copyLimit(c) && (cnt[id] || 0) < have(id) && deck.length < 40 && (c.kind === 'charge' || capOk(c))) { deck.push(id); cnt[id] = (cnt[id] || 0) + 1; k++; } return k; };
    const nonCharge = () => deck.filter((id) => G.CARDS[id].kind !== 'charge').length;
    const crCount = () => deck.filter((id) => G.CARDS[id].kind === 'creature').length;
    (opt.base || []).forEach((id) => addC(id, 1));
    const noisy = (c) => G.cardPower(c) * (0.6 + 0.4 * q) + rng() * 45 * (1 - q);
    const basics = G.CARD_ORDER.map((id) => G.CARDS[id]).filter((c) => c.kind === 'creature' && c.stage === 0 && affs.includes(c.aff) && allowed(c) && have(c.id) > 0).sort((a, b) => noisy(b) - noisy(a));
    const crTarget = 13 + rng.int(4); let legends = 0;
    for (const b of basics) {
      if (crCount() >= crTarget) break;
      if (b.legend) { if (legends >= (q > 0.6 ? 1 : 2)) continue; legends++; }
      const n = q > 0.5 ? (b.legend ? 1 + (rng() < q ? 1 : 0) : 2 + (rng() < 0.45 ? 1 : 0)) : 1 + rng.int(2);
      const got = addC(b.id, n);
      if (got) G.ascensionsOf(b.id).forEach((a) => { if (rng() < 0.45 + 0.5 * q) addC(a, Math.max(1, got - (rng() < 0.5 ? 1 : 0))); });
    }
    const hasAsc = deck.some((id) => G.CARDS[id].stage === 1);
    if (q > 0.45) {
      [['m_19', 2], ['e2_06', 2], ['e1_19', 2], ['m_20', 1], ['e1_17', 1], ['e2_02', 1], ['e2_04', 1], ['m_17', 1]].forEach(([id, n]) => addC(id, n));
      if (hasAsc) addC('e1_14', 1 + (q > 0.7 ? 1 : 0));
      if (rng() < q) addC(CONT[opt.aff], 1);
      if (rng() < q * 0.8) addC(GOD[opt.aff], 1);
    }
    const trainers = G.CARD_ORDER.map((id) => G.CARDS[id]).filter((c) => ['effect', 'relic', 'action', 'god', 'marker'].includes(c.kind) && allowed(c) && have(c.id) > 0);
    const markersIn = () => deck.filter((id) => G.CARDS[id].kind === 'marker').length;
    const ncTarget = 25 + rng.int(3);
    let guard = 0;
    while (nonCharge() < ncTarget && guard++ < 400) {
      const c = trainers[rng.int(trainers.length)];
      if (c.kind === 'god' && c.aff && !affs.includes(c.aff)) continue;
      if (c.kind === 'effect' && c.fx.some((f) => f.t === 'affAtkUp' && !affs.includes(f.aff))) continue;
      if (c.kind === 'relic' && c.r.only && !affs.includes(c.r.only)) continue;
      if (c.kind === 'marker' && markersIn() >= (q > 0.6 ? 2 : 4)) continue;
      if (q > 0.6 && rng() > 0.5 + G.cardPower(c) / 80) continue;
      addC(c.id, 1);
    }
    // se faltar criatura (coleção pequena), completa com qualquer básico disponível
    if (crCount() < 8) G.CARD_ORDER.forEach((id) => { const c = G.CARDS[id]; if (crCount() < 10 && G.isBasicCreature(c) && allowed(c) && have(id) > 0) addC(id, 1); });
    // cargas proporcionais às exigências
    const need = {}; deck.forEach((id) => { const c = G.CARDS[id]; if (c.kind === 'creature') c.attacks.forEach((a) => a.cost.forEach((k) => { if (k !== 'neu') need[k] = (need[k] || 0) + 1; })); });
    const tot = G.sum(Object.values(need));
    const slots = 40 - deck.length; const plan = [];
    if (!tot) { for (let i = 0; i < slots; i++) plan.push(i % 3 === 2 ? 'neu' : (affs.find((a) => a !== 'pri') || 'neu')); }
    else {
      const keys = Object.keys(need); let left = slots;
      const neuN = affs.includes('pri') ? Math.round(slots * 0.15) : (q > 0.5 ? 0 : 1);
      left -= neuN; for (let i = 0; i < neuN; i++) plan.push('neu');
      keys.forEach((k, i) => { const n = i === keys.length - 1 ? left : Math.round(left * need[k] / tot); for (let j = 0; j < n; j++) plan.push(k); left -= n; });
      while (plan.length < slots) plan.push(keys[0]);
    }
    plan.slice(0, slots).forEach((a) => addC(G.CHARGE_OF[a], 1));
    let g2 = 0; while (deck.length < 40 && g2++ < 80) addC(G.CHARGE_OF[affs.find((a) => a !== 'pri') || 'neu'], 1);
    return deck.slice(0, 40);
  };
  // força estimada de um deck (para montar oponentes com força parecida com a do jogador)
  G.deckScore = function (cards) {
    const cs = cards.map((id) => G.CARDS[id]).filter(Boolean); const cr = cs.filter((c) => c.kind === 'creature'); const tr = cs.filter((c) => !['creature', 'charge'].includes(c.kind));
    const pw = cr.length ? G.sum(cr, (c) => G.cardPower(c)) / cr.length : 0; const tp = tr.length ? G.sum(tr, (c) => G.cardPower(c)) / tr.length : 0;
    const ch = cs.filter((c) => c.kind === 'charge').length; const basics = cr.filter((c) => c.stage === 0).length;
    let s = pw * 0.7 + tp * 0.6 - Math.abs(ch - 13) * 1.2 - Math.max(0, 9 - basics) * 2 - Math.max(0, cr.filter((c) => c.legend).length - 2) * 3;
    return Math.round(s * 10) / 10;
  };
  G.fairDeck = function (opt, target) {
    let best = null;
    for (let k = 0; k < 8; k++) {
      const q = G.clamp((opt.q || 0.7) - 0.25 + k * 0.05, 0.15, 0.95);
      const d = G.buildDeck(Object.assign({}, opt, { q, seed: (opt.seed || 1) + k * 101 }));
      if (G.validateDeck(d).length) continue;
      const diff = Math.abs(G.deckScore(d) - target); if (!best || diff < best.diff) best = { d, diff };
    }
    return best ? best.d : G.buildDeck(opt);
  };
  G.STARTERS = [
    { id: 'brasa', aff: 'ign', aff2: 'pri', seed: 11, name: { pt: 'Fúria de Brasaforja', en: 'Emberforge Fury' }, cover: 'h1_01' },
    { id: 'solen', aff: 'sac', aff2: 'pri', seed: 22, name: { pt: 'Vigília de Solênia', en: 'Solenne Vigil' }, cover: 'h3_11' },
    { id: 'umbra', aff: 'occ', aff2: 'ene', seed: 33, name: { pt: 'Sombras de Umbravel', en: 'Umbravel Shadows' }, cover: 'h1_03' },
    { id: 'vort', aff: 'ene', aff2: 'sac', seed: 44, name: { pt: 'Tempestade de Vórtica', en: 'Vortica Tempest' }, cover: 'h3_01' },
    { id: 'sylv', aff: 'pri', aff2: 'occ', seed: 55, name: { pt: 'Caçada de Sylvanor', en: 'Sylvanor Hunt' }, cover: 'h3_18' }
  ];
  G.starterDeck = (s) => G.buildDeck({ aff: s.aff, aff2: s.aff2, q: 0.62, seed: s.seed, noRare: true, cap: { R: 3 } });
})(typeof window !== 'undefined' ? window : globalThis);
