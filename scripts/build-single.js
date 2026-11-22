/* Gera um único arquivo HTML jogável (todas as imagens, fontes e scripts embutidos). Uso: node scripts/build-single.js [saida.html] */
const fs = require('fs'); const path = require('path');
const W = path.join(__dirname, '..', 'www'); const out = process.argv[2] || path.join(__dirname, '..', 'dist', 'almas-de-orvalon.html');
let html = fs.readFileSync(path.join(W, 'index.html'), 'utf8');
let css = fs.readFileSync(path.join(W, 'css/style.css'), 'utf8');
css = css.replace(/url\(\.\.\/assets\/fonts\/([^)]+)\)/g, (m, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(W, 'assets/fonts', f)).toString('base64')})`);
css = css.replace(/url\(\.\.\/assets\/cards\/([^)]+)\)/g, (m, f) => `url(data:image/webp;base64,${fs.readFileSync(path.join(W, 'assets/cards', f)).toString('base64')})`);
const art = {}; fs.readdirSync(path.join(W, 'assets/cards')).forEach((f) => { art[f.replace('.webp', '')] = 'data:image/webp;base64,' + fs.readFileSync(path.join(W, 'assets/cards', f)).toString('base64'); });
const ui = {}; fs.readdirSync(path.join(W, 'assets/ui')).forEach((f) => { ui[f.replace('.webp', '')] = 'data:image/webp;base64,' + fs.readFileSync(path.join(W, 'assets/ui', f)).toString('base64'); });
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>${css}</style>`).replace(/<link rel="(icon|manifest|apple-touch-icon)"[^>]*>\n?/g, '');
let first = true;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const js = fs.readFileSync(path.join(W, src), 'utf8').replace(/<\/script/gi, '<\\/script'); const pre = first ? `<script>window.G=window.G||{};G.SINGLE=true;G.ART=${JSON.stringify(art)};G.UI=${JSON.stringify(ui)};</script>\n` : ''; first = false; return pre + `<script>${js}</script>`; });
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log('ok', out, (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
