/* Almas de Orvalon — inicialização */
(function () {
  const G = window.G;
  function boot() {
    G.Prog.load(); const d = G.Prog.d;
    G.lang = d.lang || ((navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en');
    document.documentElement.lang = G.lang === 'pt' ? 'pt-BR' : 'en';
    G.fx.init(); G.audio.vol.music = d.settings.music; G.audio.vol.sfx = d.settings.sfx;
    const unlock = () => { G.audio.unlock(); G.audio.setVol(d.settings.music, d.settings.sfx); G.audio.mood = null; G.audio.music(G.App.cur === 'duel' ? (G.audio.arenaMood || 'duel') : 'menu'); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    try {
      const Cap = window.Capacitor;
      if (Cap && Cap.Plugins && Cap.Plugins.App) Cap.Plugins.App.addListener('backButton', () => {
        const v = document.querySelector('#modal-root .veil'); if (v) { v.click(); return; }
        if (G.App.cur === 'duel') return; if (G.App.cur !== 'hub') G.App.go('hub'); else Cap.Plugins.App.exitApp();
      });
    } catch (e) { }
    G.ui.installCursors();
    G.App.bootLoad(() => start(d));
  }
  function start(d) {
    if (!d.onboarded) { G.App.go('onboard', d.lang ? 1 : 0); return; }
    if (d.inMatch) {
      if (d.inMatch.mode === 'ranked') { d.mmr = Math.max(0, d.mmr - 15); d.rep = G.clamp(d.rep - 10, 0, 100); d.stats.losses++; d.stats.matches++; d.streak = 0; }
      d.inMatch = null; G.Prog.save(); setTimeout(() => G.ui.toast(G.t('abandon')), 700);
    }
    G.App.go('hub');
    G.applyGfx(); if (G.Prog.calCanClaim()) setTimeout(() => G.ui.toast(G.t('cal.waiting')), 1400);
  }
  // PWA (GitHub Pages): guarda o jogo para jogar offline. Não roda no app Android, no Linux nem no arquivo único.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor && !G.SINGLE) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
