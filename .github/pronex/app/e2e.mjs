// Pronex_Study · ensaio completo da app no Chrome, ligada ao Firebase simulado (emuladores). Nunca toca nos dados reais.
// Correr em .github/pronex/app:
//   npm ci && npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node e2e.mjs"
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, '../../../pronex_study');
const SAIDA = path.join(AQUI, 'resultados');
const PROJETO = 'demo-pronex';
const AUTH = 'http://127.0.0.1:9099';
const FS = 'http://127.0.0.1:8080';
const PORTA = 8799;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const CONFIG = `window.FIREBASE_CONFIG={apiKey:"fake-api-key",authDomain:"${PROJETO}.firebaseapp.com",projectId:"${PROJETO}",appId:"1:1:web:1"};window.PRONEX_EMULADOR={auth:"${AUTH}",host:"127.0.0.1",porta:8080};`;

// ---------- servidor local: serve a app com a configuração de teste ----------
const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '') p = '/index.html';
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end(CONFIG); return; }
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end('não existe'); return; }
  try { res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); }
  catch { res.writeHead(500); res.end(); }
});

// ---------- ajudas para falar com os emuladores ----------
async function jr(url, op = {}) {
  const r = await fetch(url, { ...op, headers: { 'content-type': 'application/json', authorization: 'Bearer owner', ...(op.headers || {}) } });
  const t = await r.text();
  let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = { t }; }
  if (!r.ok) throw new Error(`${r.status} ${url}: ${t.slice(0, 200)}`);
  return j;
}
const docUrl = p => `${FS}/v1/projects/${PROJETO}/databases/(default)/documents/${p}`;
async function lerDoc(p) { try { return await jr(docUrl(p)); } catch (e) { if (/^404/.test(e.message)) return null; throw e; } }
async function listar(p) { const j = await jr(docUrl(p) + '?pageSize=200'); return (j.documents || []).map(d => d.name.split('/').pop()); }
const fsV = o => { if (typeof o === 'string') return { stringValue: o }; if (typeof o === 'boolean') return { booleanValue: o }; if (typeof o === 'number') return { integerValue: String(o) }; if (o instanceof Date) return { timestampValue: o.toISOString() }; if (Array.isArray(o)) return { arrayValue: { values: o.map(fsV) } }; if (o && typeof o === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fsV(v)])) } }; return { nullValue: null }; };
async function escrever(p, campos) { await jr(docUrl(p), { method: 'PATCH', body: JSON.stringify({ fields: Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, fsV(v)])) }) }); }
async function confirmarEmail(email) {
  const j = await jr(`${AUTH}/emulator/v1/projects/${PROJETO}/oobCodes`);
  const c = (j.oobCodes || []).filter(x => x.email === email && x.requestType === 'VERIFY_EMAIL').pop();
  assert(c, 'a app devia ter pedido o email de confirmação de ' + email);
  await fetch(c.oobLink);
}

// ---------- utilizadores a usar a app ----------
let n = 0;
const passos = [];
const passo = (t) => { passos.push(t); console.log('  ✓', t); };
const erros = [];
async function abrir(browser, tamanho, nome) {
  const ctx = await browser.newContext({ viewport: tamanho, serviceWorkers: 'block', locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erros.push(`[${nome}] ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // A tentar ler a comunidade antes de a conta estar confirmada, as regras recusam e a app trata disso.
    if (/permission-denied|PERMISSION_DENIED|Missing or insufficient permissions|Failed to load resource|ERR_|net::/.test(t)) return;
    erros.push(`[${nome}] ${t.slice(0, 300)}`);
  });
  await page.goto(`http://127.0.0.1:${PORTA}/`);
  return { ctx, page, nome };
}
const noEcra = (page, sel, t = 2500) => page.locator(sel).first().waitFor({ state: 'visible', timeout: t }).then(() => true).catch(() => false);

// Faz a entrada toda como uma pessoa nova.
async function registar(u, { email, nick, confirmar = true }) {
  const { page } = u;
  await page.waitForSelector('#x8onb', { timeout: 20000 });
  for (let i = 0; i < 40; i++) {
    if (!(await page.locator('#x8onb').count())) return;
    if (await noEcra(page, '#x8-skip', 150)) { await page.click('#x8-skip'); await page.waitForTimeout(150); continue; }
    if (await noEcra(page, '#x8-e', 150)) {
      await page.fill('#x8-e', email);
      await page.fill('#x8-p', 'Palavra-passe-1234');
      await page.click('#x8-sub');
      await page.waitForTimeout(700);
      continue;
    }
    if (await noEcra(page, '#x8-f', 150) === false && await noEcra(page, '#x8-have', 100) && !(await noEcra(page, '#x8-go', 100))) { /* ecrã de escolha */ }
    if (await noEcra(page, '#x8-vok', 150)) {
      if (confirmar === 'fora') {
        // Abre o link no email e volta a abrir a app, sem carregar em «Já confirmei».
        await confirmarEmail(email);
        await page.reload();
        await page.waitForSelector('#x8onb', { timeout: 15000 }).catch(() => {});
      } else if (confirmar) {
        await confirmarEmail(email);
        // Ao confirmar, a app recarrega para abrir as ligações com a autorização nova.
        await Promise.all([page.waitForEvent('load', { timeout: 15000 }), page.click('#x8-vok')]);
        await page.waitForSelector('#x8onb', { timeout: 15000 }).catch(() => {});
      } else { await page.click('#x8-vlater'); await page.waitForTimeout(700); }
      continue;
    }
    if (await noEcra(page, '#x8-a1', 150)) {
      u.viuTermos = true;
      await page.check('#x8-a1'); await page.check('#x8-a2'); await page.click('#x8-acc');
      await page.waitForTimeout(500);
      continue;
    }
    if (await noEcra(page, '#x8-nick', 150)) {
      await page.fill('#x8-nick', nick); await page.click('#x8-done');
      await page.waitForTimeout(500);
      continue;
    }
    if (await noEcra(page, '#x8-go', 150)) { await page.click('#x8-go'); await page.waitForTimeout(200); continue; }
    if (await noEcra(page, '#x8onb button.x8p.w', 150)) { await page.locator('#x8onb button.x8p.w').first().click(); await page.waitForTimeout(200); continue; }
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(SAIDA, `entrada-${nick}.png`) });
  throw new Error('A entrada não terminou para ' + nick + ': ' + (await page.locator('#x8onb').innerText()).slice(0, 300));
}
const uidDe = page => page.evaluate(() => uid);
const irPara = (page, v) => page.evaluate(x => { go(x); window.scrollTo(0, 0); }, v);
async function fecharFolhas(page) { await page.evaluate(() => document.querySelectorAll('.x8sheet,.x8sheet-bg,.nsheet,.sheet-bg').forEach(e => e.remove())); }
async function abrirMural(page) { await irPara(page, 'comm'); await page.evaluate(() => { commTab = 'mural'; renderComm(); }); }
async function publicar(page, texto) {
  await abrirMural(page);
  await page.waitForSelector('#p-go', { timeout: 15000 });
  await page.locator('#p-go').evaluate(b => { const f = b.closest('form') || b.parentElement.parentElement; const t = f.querySelector('textarea') || document.querySelector('textarea'); t.value = ''; });
  await page.locator('textarea').first().fill(texto);
  await page.click('#p-go');
}

// =====================================================================
async function principal() {
  await mkdir(SAIDA, { recursive: true });
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    console.log('Entrada na app');
    const alice = await abrir(browser, MOBILE, 'alice');
    await registar(alice, { email: 'alice@exemplo.pt', nick: 'Alice' });
    const uidA = await uidDe(alice.page);
    assert(uidA, 'a Alice devia ter conta');
    passo('uma pessoa nova cria conta, confirma o email, aceita os termos e chega ao Início');
    const consent = await lerDoc('consent/' + uidA);
    assert.equal(consent?.fields?.idade13?.booleanValue, true, 'o consentimento devia estar no servidor');
    passo('a aceitação dos termos fica registada no servidor');

    console.log('Exercícios e pontos');
    await alice.page.evaluate(() => startSess('mix'));
    await alice.page.waitForSelector('article button', { timeout: 8000 });
    const acertou = await alice.page.evaluate(() => {
      const S = window.SESS || (typeof sess !== 'undefined' ? sess : null);
      return !!S;
    }).catch(() => false);
    const opc = alice.page.locator('article .opt, article button.option, article [data-opt], article [data-o]');
    if (await opc.count()) await opc.first().click();
    else await alice.page.evaluate(() => { const b = [...document.querySelectorAll('article button')].find(x => /^[A-D]\s/.test(x.innerText.trim())); b && b.click(); });
    await alice.page.waitForTimeout(600);
    assert(await alice.page.getByText('Resolução passo a passo').first().isVisible(), 'depois de responder devia aparecer a resolução');
    passo('responder a um exercício mostra a resolução');
    await irPara(alice.page, 'home');
    await alice.page.waitForFunction(async () => { const s = await FB.Fs.getDocs(FB.Fs.collection(FB.fs, 'data/users/' + uid)); return s.docs.some(d => d.id.startsWith('dia_')); }, null, { timeout: 15000, polling: 800 });
    passo('o exercício fica guardado na conta');
    const docs = await listar(`data/users/${uidA}`);
    assert(!docs.includes('tutor') && !docs.some(d => d.startsWith('log_')), 'não pode haver registo de atividade nem cópia do tutor: ' + docs);
    const reg = await lerDoc('utilizadores/' + uidA);
    assert(reg && !reg.fields.dev, 'não pode haver dados de dispositivos no registo');
    passo('não fica registo de atividade, cópia do tutor nem dados de dispositivos');

    console.log('Comunidade');
    const bob = await abrir(browser, MOBILE, 'bob');
    await registar(bob, { email: 'bob@exemplo.pt', nick: 'Bob' });
    const uidB = await uidDe(bob.page);
    await publicar(bob.page, 'Alguém percebe o método de Hondt?');
    await bob.page.getByText('Publicado no mural').first().waitFor({ timeout: 8000 });
    passo('uma conta confirmada publica no mural');

    await publicar(bob.page, 'liga-me para o 912 345 678');
    await bob.page.locator('#x17-cont-no').waitFor({ timeout: 5000 });
    await bob.page.click('#x17-cont-no');
    await bob.page.getByText('Não foi publicado').first().waitFor({ timeout: 5000 });
    assert.equal((await jr(docUrl('posts') + '?pageSize=20')).documents.length, 1, 'cancelar não pode publicar');
    passo('um número de telefone pede confirmação e, ao voltar atrás, não é publicado');
    await bob.page.waitForTimeout(10500);   // ritmo de publicação
    await publicar(bob.page, 'Os votos foram 920 340 150, como aplico Hondt? 0,912345678 dá certo?');
    await bob.page.getByText('Publicado no mural').first().waitFor({ timeout: 8000 });
    assert.equal(await bob.page.locator('#x17-cont-no').count(), 0, 'matemática normal não pode parecer um telefone');
    passo('números normais de matemática publicam-se sem perguntas');
    await publicar(bob.page, 'és um cabrão');
    await bob.page.getByText('Reformula sem insultos').first().waitFor({ timeout: 5000 });
    assert.equal((await jr(docUrl('posts') + '?pageSize=20')).documents.length, 2, 'o insulto não pode ser publicado');
    passo('um insulto forte não é publicado');

    await abrirMural(alice.page);
    await alice.page.getByText('Alguém percebe o método de Hondt?').first().waitFor({ timeout: 10000 });
    passo('outra pessoa vê a publicação');
    await alice.page.getByText('Bob').first().waitFor({ timeout: 10000 });
    passo('o nome de quem publicou aparece logo depois de a conta ser confirmada');
    await alice.page.evaluate(() => { commTab = 'chat'; chan = 'geral'; renderComm(); });
    await bob.page.evaluate(() => addRitmo('canais/geral/msgs', { uid, text: 'mensagem do Bob', ts: Date.now() }, 'ultimaMsg'));
    await alice.page.getByText('mensagem do Bob').first().waitFor({ timeout: 8000 });
    await alice.page.evaluate(u => openUser(u), uidB);
    await alice.page.click('#up-block');
    await alice.page.getByText('Pessoa bloqueada').first().waitFor({ timeout: 5000 });
    await alice.page.waitForFunction(() => !document.querySelector('#msgs')?.innerText.includes('mensagem do Bob'), null, { timeout: 6000 });
    await alice.page.evaluate(() => addRitmo('canais/geral/msgs', { uid, text: 'continuo a conversar', ts: Date.now() }, 'ultimaMsg'));
    await alice.page.getByText('continuo a conversar').first().waitFor({ timeout: 8000 });
    passo('bloquear com a conversa aberta esconde a pessoa e a conversa continua a funcionar');
    await abrirMural(alice.page);
    await alice.page.waitForTimeout(1500);
    assert.equal(await alice.page.getByText('Alguém percebe o método de Hondt?').count(), 0, 'o post de quem foi bloqueado devia desaparecer');
    assert(await lerDoc(`data/users/${uidA}/bloqueios`), 'o bloqueio devia ficar guardado na conta');
    passo('bloquear uma pessoa esconde o que ela publica');

    console.log('Grupos com código de convite');
    await alice.page.evaluate(() => { commTab = 'chat'; chan = 'geral'; renderComm(); });
    await alice.page.locator('[data-x12g]').click();
    await alice.page.fill('#x12-gn', 'Estudo de Hondt');
    await alice.page.locator('#x12-gf button[type=submit]').click();
    await alice.page.getByText('Grupo criado').first().waitFor({ timeout: 8000 });
    const idGrupo = await alice.page.evaluate(() => chan);
    assert(/^g_[A-Za-z0-9]{16}$/.test(idGrupo), 'o código devia ter 16 caracteres: ' + idGrupo);
    await alice.page.evaluate(() => addRitmo('canais/' + chan + '/msgs', { uid, text: 'mensagem do grupo', ts: Date.now() }, 'ultimaMsg'));
    const hugo = await abrir(browser, MOBILE, 'hugo');
    await registar(hugo, { email: 'hugo@exemplo.pt', nick: 'Hugo' });
    const antes = await hugo.page.evaluate(async c => { try { const s = await FB.Fs.getDocs(FB.Fs.query(FB.Fs.collection(FB.fs, 'canais/' + c + '/msgs'), FB.Fs.limit(3))); return s.size; } catch (e) { return e.code; } }, idGrupo);
    assert.equal(antes, 'permission-denied', 'sem entrar no grupo não se leem as mensagens');
    await hugo.page.evaluate(() => { go('comm'); commTab = 'chat'; chan = 'geral'; renderComm(); });
    await hugo.page.locator('[data-x12g]').click();
    assert.equal(await hugo.page.getByText('Estudo de Hondt').count(), 0, 'o grupo não pode aparecer a quem não tem o código');
    passo('um grupo não aparece nem se lê sem o código');
    await hugo.page.fill('#x12-gc', 'codigoerrado123');
    await hugo.page.locator('#x12-gjf button[type=submit]').click();
    await hugo.page.getByText('Não encontrei nenhum grupo').first().waitFor({ timeout: 8000 });
    await hugo.page.fill('#x12-gc', idGrupo.replace('g_', ''));
    await hugo.page.locator('#x12-gjf button[type=submit]').click();
    await hugo.page.getByText('Entraste no grupo').first().waitFor({ timeout: 8000 });
    await hugo.page.getByText('mensagem do grupo').first().waitFor({ timeout: 10000 });
    passo('com o código certo, a pessoa entra e lê a conversa do grupo');
    await hugo.ctx.close();
    await fecharFolhas(alice.page);

    console.log('Conta por confirmar');
    const carla = await abrir(browser, MOBILE, 'carla');
    await registar(carla, { email: 'carla@exemplo.pt', nick: 'Carla', confirmar: false });
    await irPara(carla.page, 'comm');
    await carla.page.getByText('Confirma o teu email primeiro').first().waitFor({ timeout: 8000 });
    passo('sem confirmar o email, a Comunidade fica fechada e diz o que fazer');
    const lidos = await carla.page.evaluate(async () => { try { const s = await FB.Fs.getDocs(FB.Fs.query(FB.Fs.collection(FB.fs, 'posts'), FB.Fs.limit(3))); return s.size; } catch (e) { return e.code; } });
    assert.equal(lidos, 'permission-denied', 'o servidor devia recusar a leitura do mural');
    passo('o servidor recusa o mural a uma conta por confirmar, mesmo sem passar pelo ecrã');

    console.log('Suspensão');
    await escrever('bans/' + uidB, { motivo: 'teste', por: 'teste', em: new Date(), ate: new Date(Date.now() + 864e5) });
    await bob.page.reload();
    await bob.page.waitForFunction(() => typeof uid !== 'undefined' && !!uid && typeof SUSPENSA !== 'undefined' && !!SUSPENSA, null, { timeout: 15000 });
    await irPara(bob.page, 'comm');
    await bob.page.getByText('A tua conta está suspensa').first().waitFor({ timeout: 6000 });
    await bob.page.getByText('Motivo: teste').first().waitFor({ timeout: 3000 });
    await bob.page.locator('[data-x17tab="ai"]').click();
    assert.equal(await bob.page.getByText('A tua conta está suspensa').count(), 0, 'quem está suspenso continua a poder usar o tutor');
    await bob.page.evaluate(() => { commTab = 'mural'; renderComm(); });
    passo('quem está suspenso vê o motivo e continua a poder usar o tutor');
    const naoEscreve = await bob.page.evaluate(async () => { try { await addRitmo('posts', { uid, text: 'olá', img: '', ts: Date.now(), likes: {} }, 'ultimoPost'); return 'publicou'; } catch (e) { return e.code; } });
    assert.equal(naoEscreve, 'permission-denied', 'uma conta suspensa não pode publicar');
    passo('uma conta suspensa vê o aviso e o servidor recusa a publicação');

    console.log('Painel do administrador');
    const dono = await abrir(browser, DESKTOP, 'dono');
    await registar(dono, { email: 'pronex.protocol@gmail.com', nick: 'Kaizer' });
    await dono.page.waitForFunction(() => isOwner === true, null, { timeout: 10000 });
    const uidC = await uidDe(carla.page);
    await dono.page.evaluate(() => loadAdmin());
    await dono.page.evaluate(u => openAdminUser(u), uidC);
    await dono.page.getByText('Moderação').first().waitFor({ timeout: 8000 });
    const fichaTxt = await dono.page.locator('.admsheet').innerText();
    assert(!/Conversa com o tutor|Dispositivos \(|Atividade recente/.test(fichaTxt), 'a ficha não pode mostrar tutor, dispositivos nem atividade');
    passo('a ficha de um aluno já não mostra o tutor, os dispositivos nem a atividade');
    await dono.page.fill('#au-mot', 'Insultos no mural');
    const btn = dono.page.locator('[data-sus="7"]');
    await btn.click(); await btn.click();
    await dono.page.getByText('Conta suspensa').first().waitFor({ timeout: 8000 });
    const ban = await lerDoc('bans/' + uidC);
    assert(ban?.fields?.ate?.timestampValue, 'a suspensão de 7 dias devia ter data de fim');
    assert.equal(ban?.fields?.motivo?.stringValue, 'Insultos no mural');
    assert(await lerDoc('bansEmail/carla@exemplo.pt'), 'a suspensão também devia ficar no email');
    passo('o administrador suspende uma conta por 7 dias a partir do painel');
    await dono.page.locator('#au-lev').click();
    await dono.page.getByText('Suspensão levantada').first().waitFor({ timeout: 8000 });
    assert.equal(await lerDoc('bans/' + uidC), null, 'a suspensão devia desaparecer');
    assert.equal(await lerDoc('bansEmail/carla@exemplo.pt'), null, 'a suspensão do email também devia desaparecer');
    assert((await listar('audit')).length >= 2, 'as ações do administrador devem ficar na auditoria');
    passo('levantar a suspensão funciona e as duas ações ficam na auditoria');
    await dono.ctx.close();

    console.log('Confirmar o email fora da app');
    const dana = await abrir(browser, MOBILE, 'dana');
    await registar(dana, { email: 'dana@exemplo.pt', nick: 'Dana', confirmar: 'fora' });
    await dana.page.waitForFunction(() => typeof CONTA_OK !== 'undefined' && CONTA_OK === true, null, { timeout: 15000 });
    const muralDana = await dana.page.evaluate(async () => { try { const s = await FB.Fs.getDocs(FB.Fs.query(FB.Fs.collection(FB.fs, 'posts'), FB.Fs.limit(3))); return s.size; } catch (e) { return e.code; } });
    assert.equal(typeof muralDana, 'number', 'depois de confirmar fora da app o mural devia abrir: ' + muralDana);
    passo('quem confirma o email fora da app e a reabre entra logo na Comunidade');

    console.log('Segunda conta no mesmo dispositivo');
    await dana.page.evaluate(() => logout());
    await dana.page.waitForTimeout(800);
    await dana.page.reload();
    dana.viuTermos = false;
    await registar(dana, { email: 'eva@exemplo.pt', nick: 'Eva' });
    assert.equal(dana.viuTermos, true, 'a segunda pessoa tem de ver os termos');
    const uidE = await uidDe(dana.page);
    assert.equal((await lerDoc('consent/' + uidE))?.fields?.idade13?.booleanValue, true, 'a segunda conta tem de ter a sua aceitação');
    await publicar(dana.page, 'Publicação da Eva');
    await dana.page.getByText('Publicado no mural').first().waitFor({ timeout: 8000 });
    passo('a segunda pessoa no mesmo dispositivo vê os termos e consegue publicar');

    console.log('Apagar a conta');
    await dana.page.evaluate(() => { go('profile'); profTab = 'defs'; renderProfile(); });
    await dana.page.click('#x8-s-del');
    await dana.page.fill('#x8-del-t', 'APAGAR');
    await dana.page.fill('#x8-del-p', 'Palavra-passe-1234');
    await dana.page.click('#x8-del-go');
    await dana.page.getByText('Conta apagada').first().waitFor({ timeout: 30000 });
    assert.equal(await lerDoc('perfis/' + uidE), null, 'o perfil devia desaparecer');
    assert.equal(await lerDoc('consent/' + uidE), null);
    const textoPosts = JSON.stringify(await jr(docUrl('posts') + '?pageSize=50'));
    assert(!textoPosts.includes('Publicação da Eva'), 'a publicação devia desaparecer');
    passo('apagar a conta remove o perfil, a aceitação e as publicações');
    await dana.ctx.close();

    console.log('Perfil muito atrasado');
    const gil = await abrir(browser, MOBILE, 'gil');
    await registar(gil, { email: 'gil@exemplo.pt', nick: 'Gil' });
    const uidG = await uidDe(gil.page);
    await gil.page.waitForTimeout(3000);
    const itens = Array.from({ length: 450 }, (_, i) => ({ ts: Date.parse('2026-11-01T10:00:00Z') + i * 1000, t: 0, tn: 'x', tema: 'Eleições', q: 'q' + i, esc: 'a', cert: 'a', ok: true, mode: 'mix' }));
    await escrever(`data/users/${uidG}/dia_2026-11-01`, { date: '2026-11-01', goal: 15, items: itens });
    await gil.page.waitForTimeout(16000);
    const pGil = await lerDoc('perfis/' + uidG);
    assert(+pGil.fields.total.integerValue >= 400, 'o total devia recuperar: ' + pGil.fields.total.integerValue);
    assert(+pGil.fields.xp.integerValue > 500, 'o XP devia continuar a recuperar sozinho: ' + pGil.fields.xp.integerValue);
    passo('um perfil com 450 exercícios em atraso recupera sozinho, sem ficar preso');
    await gil.ctx.close();

    console.log('Todos os ecrãs, em telemóvel e computador, escuro e claro');
    const ecras = ['home', 'study', 'comm', 'profile'];
    let vistos = 0;
    for (const [nomeT, tam] of [['telemóvel', MOBILE], ['computador', DESKTOP]]) {
      await alice.page.setViewportSize(tam);
      for (const tema of ['dark', 'light']) {
        await alice.page.evaluate(t => { document.documentElement.dataset.theme = t; }, tema);
        for (const e of ecras) {
          await fecharFolhas(alice.page);
          await irPara(alice.page, e);
          await alice.page.waitForTimeout(180);
          const larg = await alice.page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
          assert(larg[0] <= larg[1] + 1, `${e} em ${nomeT}/${tema} passa da largura do ecrã: ${larg}`);
          vistos++;
        }
      }
    }
    passo(`${vistos} combinações de ecrã sem nada a sair da largura`);

    assert.deepEqual(erros, [], 'erros de JavaScript durante o ensaio');
    passo('nenhum erro de JavaScript durante o ensaio');
    console.log(`\nENSAIO COMPLETO: ${passos.length} verificações passaram.`);
    for (const u of [alice, bob, carla]) await u.ctx.close();
  } catch (e) {
    for (const c of browser.contexts()) for (const [i, p] of c.pages().entries()) await p.screenshot({ path: path.join(SAIDA, `falha-${n++}-${i}.png`) }).catch(() => {});
    console.error('\nFALHOU depois de', passos.length, 'verificações:', e.message);
    if (erros.length) console.error('Erros de JavaScript:\n' + erros.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    servidor.close();
  }
}
principal();
