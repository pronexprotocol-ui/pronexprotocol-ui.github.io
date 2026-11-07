// Pronex_Study · entrada no iPhone com a app instalada (onde o Google não funciona), no Firebase simulado.
// Caso real de 2026-11-07: conta criada com o Google, palavra-passe criada pela reposição, entrada por «Já tenho conta».
// Correr em .github/pronex/app:
//   npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node entrada-iphone.mjs"
// APP_DIR=<pasta pronex_study> para testar outra cópia da app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(process.env.APP_DIR || path.join(AQUI, '../../../pronex_study'));
const P = 'demo-pronex', AUTH = 'http://127.0.0.1:9099', FS = 'http://127.0.0.1:8080', K = 'fake-api-key', PORTA = 8797;
const EMAIL = 'aluno.google@gmail.com', SENHA = 'Nova-palavra-1234';
const CONFIG = `window.FIREBASE_CONFIG={apiKey:"${K}",authDomain:"${P}.firebaseapp.com",projectId:"${P}",appId:"1:1:web:1"};window.PRONEX_EMULADOR={auth:"${AUTH}",host:"127.0.0.1",porta:8080};`;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html';
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end(CONFIG); return; }
  const f = path.join(APP, p); if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});
await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));
const post = async (u, b) => { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); return j; };
const fsV = o => typeof o === 'string' ? { stringValue: o } : typeof o === 'boolean' ? { booleanValue: o } : typeof o === 'number' ? { integerValue: String(o) } : { timestampValue: o.toISOString() };
const escrever = (p, c) => fetch(`${FS}/v1/projects/${P}/databases/(default)/documents/${p}`, { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer owner' }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, fsV(v)])) }) }).then(r => assert(r.ok, 'escrever ' + p));
const codigos = async tipo => (await (await fetch(`${AUTH}/emulator/v1/projects/${P}/oobCodes`)).json()).oobCodes.filter(c => c.email === EMAIL && c.requestType === tipo);

// conta criada com o Google, com progresso e termos antigos
const idToken = JSON.stringify({ sub: 'google-aluno', email: EMAIL, email_verified: true, name: 'Aluno Google' });
const g = await post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${K}`, { postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`, requestUri: 'http://localhost', returnSecureToken: true });
await escrever('consent/' + g.localId, { versao: '1.3', idade13: true, aceitouEm: new Date(Date.now() - 86400e3) });
await escrever('perfis/' + g.localId, { nick: 'Aluno Google', xp: 48, total: 8 });

const br = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1' });
await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', e => erros.push(e.message));
let ok = 0; const v = t => { ok++; console.log('  ✓', t); };
// a mensagem flutuante está visível e por cima de tudo no sítio onde aparece
// (a mensagem deixa passar os toques; liga-se só durante a medição para o teste de sobreposição a encontrar)
const toastPorCima = () => page.evaluate(() => { const t = document.getElementById('toast'); if (!t || t.hidden) return false; const r = t.getBoundingClientRect(); const pe = t.style.pointerEvents; t.style.pointerEvents = 'auto'; const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); t.style.pointerEvents = pe; return !!el && (el === t || t.contains(el)); });
try {
  await page.goto(`http://127.0.0.1:${PORTA}/`);
  await page.waitForSelector('#x8-have', { timeout: 20000 });
  await page.click('#x8-have');
  await page.waitForSelector('#x8-e', { timeout: 8000 });
  assert.equal(await page.locator('#x8-g').count(), 0, 'o botão do Google não deve aparecer na app instalada no iPhone');
  assert.match(await page.locator('.x8fine').innerText(), /Criaste a conta com o Google\?/);
  v('iPhone com a app instalada: sem botão do Google e com ajuda para contas Google');

  await page.fill('#x8-e', EMAIL); await page.fill('#x8-p', 'palavra-errada-1');
  await page.click('#x8-sub');
  // o Firebase real responde «invalid-credential» (proteção contra enumeração de emails); o simulado responde «wrong-password»
  await page.locator('.x8err', { hasText: /^(Email ou palavra-passe errados|Palavra-passe errada)\.$/ }).waitFor({ timeout: 8000 });
  assert.equal(await page.locator('#x8-sub').innerText(), 'Entrar');
  assert(await toastPorCima(), 'a mensagem flutuante tem de ficar por cima do ecrã de entrada');
  v('palavra-passe errada: a mensagem aparece no ecrã e por cima de tudo');

  await page.click('#x8-forgot');
  await page.locator('.x8err.ok', { hasText: 'enviámos um link' }).waitFor({ timeout: 8000 });
  const oob = (await codigos('PASSWORD_RESET')).pop();
  assert(oob, 'a app devia ter pedido o email de reposição');
  await post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${K}`, { oobCode: oob.oobCode, newPassword: SENHA });
  v('«Esqueci-me da palavra-passe» confirma no ecrã e a conta Google passa a ter palavra-passe');

  await page.fill('#x8-p', SENHA);
  await page.click('#x8-ver');
  assert.equal(await page.getAttribute('#x8-p', 'type'), 'text');
  await page.click('#x8-ver');
  assert.equal(await page.getAttribute('#x8-p', 'type'), 'password');
  v('mostrar e esconder a palavra-passe');

  await page.click('#x8-sub');
  await page.waitForFunction(() => !document.getElementById('x8-f'), null, { timeout: 10000 });
  const u = await page.evaluate(() => ({ email: FB.auth.currentUser.email, uid: FB.auth.currentUser.uid, verificado: FB.auth.currentUser.emailVerified }));
  assert.equal(u.uid, g.localId, 'tem de entrar na mesma conta criada com o Google');
  assert.equal(u.verificado, true);
  v('entra na mesma conta (mesmo uid, email confirmado) e segue para o passo seguinte');
  assert.deepEqual(erros, []);
  v('nenhum erro de JavaScript');
  console.log('ENTRADA NO IPHONE:', ok, 'verificações passaram.');
} catch (e) {
  await mkdir(path.join(AQUI, 'resultados'), { recursive: true });
  await page.screenshot({ path: path.join(AQUI, 'resultados', 'entrada-iphone.png') }).catch(() => {});
  console.error('FALHOU:', e.message, erros);
  process.exitCode = 1;
}
await br.close(); srv.close();
