/* Gera www/sw.js: service worker que guarda o jogo inteiro para jogar offline (PWA). Uso: node scripts/gen-sw.js */
const fs = require('fs'); const path = require('path');
const W = path.join(__dirname, '..', 'www'); const ver = require('../package.json').version;
const files = [];
(function walk(d) { fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f !== 'sw.js' && !f.endsWith('.txt')) files.push('./' + path.relative(W, p).split(path.sep).join('/')); }); })(W);
files.push('./');
const sw = `/* gerado por scripts/gen-sw.js — não editar */
const CACHE = 'orvalon-${ver}-${Date.now().toString(36)}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => { if (res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return res; }).catch(() => caches.match('./index.html'))));
});
`;
fs.writeFileSync(path.join(W, 'sw.js'), sw); console.log('sw.js:', files.length, 'arquivos no cache');
