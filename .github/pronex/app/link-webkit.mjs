// Pronex_Link · ensaio curto no WebKit (o motor do Safari e de todos os navegadores do iPhone), em tamanho de telemóvel.
// Não repete o ensaio completo (link-demo.mjs, no Chrome): confirma que a app arranca, que os ecrãs principais
// desenham sem erros e que os passos mais usados funcionam no motor do iPhone.
// Correr em .github/pronex/app:  npx playwright-core install --with-deps webkit && node link-webkit.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, '../../../pronex_link');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html';
  // A app PRONEX usa o manifesto do site (../site.webmanifest), que no site publicado está na raiz: aqui serve-se o de fonte/.
  if (p === '/site.webmanifest') { res.writeHead(200, { 'content-type': 'application/manifest+json' }); res.end(await readFile(new URL('../../../fonte/site.webmanifest', import.meta.url))); return; }
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end('/* ensaio sem servidor */'); return; }
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});
await new Promise(r => servidor.listen(8797, '127.0.0.1', r));

const b = await (process.env.MOTOR === "chromium" ? (await import("playwright-core")).chromium.launch({ channel: "chrome", headless: true }) : webkit.launch({ headless: true }));
const ctx = await b.newContext({ ...devices['iPhone 13'] });
await ctx.addInitScript(() => { try { localStorage.setItem('pronex-link-modo', 'demo'); } catch (e) { /* sem acesso */ } });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
const ok = (c, msg) => { if (!c) { erros.push('FALHOU: ' + msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const tab = nome => p.click(`#tabbar button:has-text("${nome}")`);
const semDeslize = async onde => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(o <= 0, 'sem deslize horizontal em ' + onde + (o > 0 ? ' (+' + o + 'px)' : '')); };

console.log('== WebKit (iPhone) ==');
await p.goto('http://127.0.0.1:8797/');
// entrada da demonstração: escolhe a primeira pessoa
await p.waitForSelector('#f-entrada', { timeout: 15000 });
await p.fill('#en-nome', 'Kaizer'); await p.fill('#en-curso', '11.º, Multimédia'); await p.check('#en-idade'); await p.check('#en-regras'); await p.click('#f-entrada .btn.pri');
ok(await p.isVisible('.folha .passosg'), 'cria o perfil e mostra as boas-vindas'); await p.click('.folha .btn.pri');
await p.waitForSelector('#vista .hero, #vista .phead, #tabbar', { timeout: 15000 });
ok(await p.isVisible('#tabbar'), 'a app arranca e mostra a barra de baixo');
for (const s of ['Início', 'Pedidos', 'Rede', 'Conversas', 'Perfil']) {
  await tab(s); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelector('#vista').children.length > 0), 'desenha ' + s);
  await semDeslize(s);
}
await tab('Pedidos');
const primeiro = p.locator('.pedb').first();
if (await primeiro.count()) { await primeiro.click(); await p.waitForTimeout(150); ok(await p.isVisible('#vista h1, #vista .card'), 'abre um pedido'); }
await p.evaluate(() => ACOES['novo-pedido']()); await p.waitForTimeout(200);
ok(await p.isVisible('.folha form'), 'abre o formulário de pedido');
ok(await p.evaluate(() => { const i = document.createElement('input'); i.type = 'date'; return i.type === 'date'; }), 'campos de data nativos');
await p.keyboard.press('Escape');
ok(await p.evaluate(() => { const r = Loja.publicarPedido({ tipo: 'projeto', area: 'design', titulo: 'Cartaz para o teste no Safari', precisa: 'Um cartaz simples para ver se publica.', objetivo: 'Confirmar o motor do iPhone.', naoNota: true }); return !!r.ok; }), 'publica um pedido');
ok(await p.evaluate(() => { try { localStorage.setItem('pl-teste', '1'); localStorage.removeItem('pl-teste'); return true; } catch (e) { return false; } }), 'guarda no dispositivo (localStorage)');
ok(await p.evaluate(() => CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')), 'cores com color-mix');
await tab('Perfil'); await p.click('[data-a="perf-tab"][data-t="defs"]').catch(() => {});
await p.click('[data-a="tema"][data-t="claro"]').catch(() => {});
ok(await p.evaluate(() => document.documentElement.classList.contains('claro')), 'muda para o tema claro');
await p.click('[data-a="tema"][data-t="escuro"]').catch(() => {});

const reais = erros.filter(e => !e.startsWith('FALHOU'));
ok(!reais.length, 'sem erros de JavaScript' + (reais.length ? ': ' + reais.slice(0, 3).join(' | ') : ''));
await b.close(); servidor.close();
console.log(erros.length ? '\nPROBLEMAS:\n' + erros.join('\n') : '\nSem erros.');
process.exit(erros.length ? 1 : 0);
