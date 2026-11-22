/* Almas de Orvalon — utilitários */
(function (root) {
  const G = root.G = root.G || {};

  // RNG determinístico (mulberry32)
  G.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (n) => Math.floor(r() * n);
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    r.range = (a, b) => a + r() * (b - a);
    return r;
  };
  G.hash = function (str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  G.sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
  G.uniq = (arr) => Array.from(new Set(arr));
  G.todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  G.dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

  // Construtor de DOM compacto: el('div.cls#id', {attrs}, children...)
  G.el = function (sel, attrs, ...kids) {
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
    const node = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) {
      m[2].replace(/([.#])([\w-]+)/g, (_, t, n) => { if (t === '.') node.classList.add(n); else node.id = n; });
    }
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.startsWith('--')) node.style.setProperty(sk, v[sk]); else node.style[sk] = v[sk]; } }
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else if (c instanceof Node) node.appendChild(c);
      else node.appendChild(document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return node;
  };
  G.fill = (n, ...k) => { n.replaceChildren(...k.flat(9).filter((x) => x != null && x !== false && x !== '')); return n; };
  G.$ = (s, r) => (r || document).querySelector(s);
  G.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // Armazenamento seguro
  G.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  G.fmt = (n) => Number(n).toLocaleString(G.lang === 'en' ? 'en-US' : 'pt-BR');
})(typeof window !== 'undefined' ? window : globalThis);
