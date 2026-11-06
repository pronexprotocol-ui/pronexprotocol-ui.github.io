// Confirma que uma versão anterior da app continua a funcionar com as regras atuais, no Firebase simulado.
// Serve para decidir a ordem de publicação: enquanto houver telemóveis com a versão antiga, ela tem de continuar a funcionar.
//   git worktree add ../../../../versao-antiga <commit>
//   APP_ANTIGA=<caminho>/pronex_study npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node compat.mjs"
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const APP = process.env.APP_ANTIGA;
assert(APP, 'Indica a pasta da versão antiga em APP_ANTIGA.');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROJETO = 'demo-pronex', AUTH = 'http://127.0.0.1:9099', PORTA = 8798;
const CONFIG = `window.FIREBASE_CONFIG={apiKey:"fake-api-key",authDomain:"${PROJETO}.firebaseapp.com",projectId:"${PROJETO}",appId:"1:1:web:1"};`;
const LIGAR = "FB={A,Au,Fs,Ai,app,auth,fs};BACKEND='firebase';";
const GANCHO = `${LIGAR}Au.connectAuthEmulator(auth,"${AUTH}",{disableWarnings:true});Fs.connectFirestoreEmulator(fs,"127.0.0.1",8080);`;

const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  if (p === '/config.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(CONFIG); return; }
  const f = path.join(APP, p);
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  let b = await readFile(f);
  if (p === '/index.html') {
    const t = b.toString('utf8');
    assert(t.includes(LIGAR), 'não encontrei o sítio onde a app liga ao Firebase');
    b = t.replace(LIGAR, GANCHO);
  }
  res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' });
  res.end(b);
});
await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));
const jr = async u => (await fetch(u, { headers: { authorization: 'Bearer owner' } })).json();
const br = await chromium.launch({ channel: 'chrome', headless: true });
const erros = [];
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
page.on('pageerror', e => erros.push(e.message));
let ok = 0;
const v = t => { ok++; console.log('  ✓', t); };
try {
  await page.goto(`http://127.0.0.1:${PORTA}/`);
  await page.waitForSelector('#x8onb', { timeout: 20000 });
  const email = 'antiga@exemplo.pt';
  const vis = (s, t = 150) => page.locator(s).first().waitFor({ state: 'visible', timeout: t }).then(() => true).catch(() => false);
  for (let i = 0; i < 40 && await page.locator('#x8onb').count(); i++) {
    if (await vis('#x8-skip')) { await page.click('#x8-skip'); continue; }
    if (await vis('#x8-e')) { await page.fill('#x8-e', email); await page.fill('#x8-p', 'Palavra-passe-1234'); await page.click('#x8-sub'); await page.waitForTimeout(700); continue; }
    if (await vis('#x8-vok')) {
      const j = await jr(`${AUTH}/emulator/v1/projects/${PROJETO}/oobCodes`);
      await fetch(j.oobCodes.filter(c => c.email === email).pop().oobLink);
      await page.click('#x8-vok'); await page.waitForTimeout(900); continue;
    }
    if (await vis('#x8-a1')) { await page.check('#x8-a1'); await page.check('#x8-a2'); await page.click('#x8-acc'); await page.waitForTimeout(500); continue; }
    if (await vis('#x8-nick')) { await page.fill('#x8-nick', 'Antiga'); await page.click('#x8-done'); await page.waitForTimeout(500); continue; }
    if (await vis('#x8-go')) { await page.click('#x8-go'); continue; }
    if (await vis('#x8onb button.x8p.w')) { await page.locator('#x8onb button.x8p.w').first().click(); continue; }
    await page.waitForTimeout(300);
  }
  assert.equal(await page.locator('#x8onb').count(), 0, 'a entrada devia terminar');
  v('cria conta e chega ao Início');
  await page.reload();
  await page.waitForFunction(() => typeof uid !== 'undefined' && !!uid, null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  for (let k = 0; k < 3; k++) {
    await page.evaluate(() => startSess('mix'));
    await page.waitForTimeout(400);
    await page.evaluate(() => { const b = [...document.querySelectorAll('article button')].find(x => /^[A-D]\s/.test(x.innerText.trim())); b && b.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => go('home'));
  }
  await page.waitForFunction(async () => { const s = await FB.Fs.getDoc(FB.Fs.doc(FB.fs, 'perfis/' + uid)); return s.exists() && (s.data().total | 0) >= 1; }, null, { timeout: 25000, polling: 1000 });
  v('o perfil e os pontos continuam a sincronizar');
  await page.evaluate(() => { go('comm'); commTab = 'mural'; renderComm(); });
  await page.waitForSelector('#p-go', { timeout: 15000 });
  await page.locator('textarea').first().fill('Olá da versão antiga');
  await page.click('#p-go');
  await page.getByText('Publicado no mural').first().waitFor({ timeout: 8000 });
  v('publica no mural');
  await page.evaluate(() => { commTab = 'chat'; renderComm(); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(async () => (await FB.Fs.getDocs(FB.Fs.query(FB.Fs.collection(FB.fs, 'canais/geral/msgs'), FB.Fs.limit(3)))).size);
  assert.equal(typeof r, 'number');
  v('lê a conversa');
  await page.evaluate(() => go('profile'));
  await page.waitForTimeout(600);
  assert.deepEqual(erros, []);
  v('nenhum erro de JavaScript');
  console.log('COMPATIBILIDADE:', ok, 'verificações passaram.');
} catch (e) {
  await mkdir(path.join(AQUI, 'resultados'), { recursive: true });
  await page.screenshot({ path: path.join(AQUI, 'resultados', 'compat.png') }).catch(() => {});
  console.error('FALHOU:', e.message, erros);
  process.exitCode = 1;
}
await br.close();
srv.close();
