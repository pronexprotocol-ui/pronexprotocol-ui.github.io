import { chromium } from 'playwright-core';
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'; import { existsSync } from 'node:fs'; import path from 'node:path';
const APP = '/home/claude/pronexprotocol-ui.github.io/pronex_link';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/json' };
const s = createServer(async (q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p === '/') p = '/index.html'; if (p === '/config.js') { r.end(''); return; } const f = path.join(APP, p); if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); r.end(await readFile(f)); });
await new Promise(x => s.listen(8799, x));
const b = await chromium.launch({ channel: 'chrome' }); const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await c.addInitScript(() => localStorage.setItem('pronex-link-modo', 'demo'));
const p = await c.newPage(); await p.goto('http://127.0.0.1:8799/');
await p.fill('#en-nome', 'Kaizer'); await p.fill('#en-curso', '11.º, Multimédia'); await p.check('#en-idade'); await p.check('#en-regras'); await p.click('#f-entrada .btn.pri');
await p.click('.folha .btn.pri'); await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/r-inicio.png', fullPage: true });
for (const [n, h] of [['perfil-rita', '#pessoa/ex_rita'], ['grupo', '#grupo/gr2'], ['post', '#post/ps1']]) { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(350); await p.screenshot({ path: '/tmp/r-' + n + '.png', fullPage: true }); }
await p.evaluate(() => { F.redeSeg = 'ligacoes'; ir('freelancers'); }); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/r-rede.png', fullPage: true });
await p.evaluate(() => { F.pedSeg = 'vagas'; ir('pedidos'); }); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/r-vagas.png', fullPage: true });
await b.close(); s.close(); process.exit(0);
