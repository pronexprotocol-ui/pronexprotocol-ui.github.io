// Pronex_Link · ensaio da app no Chrome, ligada ao Firebase simulado (emuladores). Nunca toca nos dados reais.
// Duas pessoas, cada uma no seu browser, fazem o percurso completo de um trabalho em tempo real,
// com um professor a recomendar e o administrador a moderar (painel com PIN, como na Pronex_Study).
// Correr em .github/pronex/app:
//   npm ci && npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node link-e2e.mjs"
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, '../../../pronex_link');
const SAIDA = path.join(AQUI, 'resultados');
const PROJETO = 'demo-pronex', AUTH = 'http://127.0.0.1:9099', FS = 'http://127.0.0.1:8080', PORTA = 8798;
const TEL = { width: 390, height: 844 }, PC = { width: 1280, height: 800 };
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const CONFIG = `window.FIREBASE_CONFIG={apiKey:"fake-api-key",authDomain:"${PROJETO}.firebaseapp.com",projectId:"${PROJETO}",appId:"1:1:web:1"};window.PRONEX_EMULADOR={auth:"${AUTH}",host:"127.0.0.1",porta:8080};`;
// O email do administrador é o das regras (assim o ensaio não fica desatualizado).
const ADMIN_EMAIL = (readFileSync(path.resolve(AQUI, '../regras/firestore.rules'), 'utf8').match(/token\.get\('email', ''\) == '([^']+)'/) || [])[1];
const PASS = 'Palavra-passe-1234';

const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/' || p === '') p = '/index.html';
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end(CONFIG); return; }
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end('não existe'); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});

async function jr(url, op = {}) {
  const r = await fetch(url, { ...op, headers: { 'content-type': 'application/json', authorization: 'Bearer owner', ...(op.headers || {}) } });
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = { t }; }
  if (!r.ok) throw new Error(`${r.status} ${url}: ${t.slice(0, 200)}`);
  return j;
}
// Conta no emulador, já com o email confirmado (ou não).
async function conta(email, confirmado = true) {
  const j = await jr(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, { method: 'POST', body: JSON.stringify({ email, password: PASS, returnSecureToken: true }) });
  if (confirmado) await jr(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJETO}/accounts:update`, { method: 'POST', body: JSON.stringify({ localId: j.localId, emailVerified: true }) });
  return j.localId;
}
const docUrl = p => `${FS}/v1/projects/${PROJETO}/databases/(default)/documents/${p}`;
async function escrever(p, campos) {
  const v = o => (typeof o === 'string' ? { stringValue: o } : typeof o === 'number' ? { integerValue: String(o) } : { booleanValue: !!o });
  await jr(docUrl(p), { method: 'PATCH', body: JSON.stringify({ fields: Object.fromEntries(Object.entries(campos).map(([k, x]) => [k, v(x)])) }) });
}
// Espera até a condição ser verdadeira (as escritas da app são assíncronas).
async function ate(f, ms = 10000) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await f()) return true; await new Promise(r => setTimeout(r, 300)); } return false; }
async function lerDoc(p) { try { return await jr(docUrl(p)); } catch (e) { if (/^404/.test(e.message)) return null; throw e; } }

const erros = [];
const ok = (c, t) => { if (c) console.log('  ✓', t); else { console.log('  ✗', t); erros.push('FALHOU: ' + t); } };
async function abrir(browser, tam, nome) {
  const ctx = await browser.newContext({ viewport: tam, serviceWorkers: 'block', locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erros.push(`[${nome}] ${e.message}`));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(t)) erros.push(`[${nome}] ${t.slice(0, 300)}`); if (/escrita recusada|leitura de/.test(t)) erros.push(`[${nome}] ${t.slice(0, 300)}`); });
  await page.goto(`http://127.0.0.1:${PORTA}/`);
  return { ctx, page, nome };
}
const ve = (page, sel, t = 8000) => page.locator(sel).first().waitFor({ state: 'visible', timeout: t }).then(() => true).catch(() => false);
const nav = (page, nome, pc) => page.click(`${pc ? '#snav' : '#tabbar'} button:has-text("${nome}")`);
async function entrar(page, email, nome, tipo = 'aluno') {
  await page.waitForSelector('#f-email', { timeout: 30000 });
  await page.fill('#en-email', email); await page.fill('#en-pass', PASS); await page.click('#f-email .btn.pri');
  await page.waitForSelector('#f-perfil', { timeout: 20000 });
  await page.fill('#en-nome', nome);
  if (tipo === 'professor') await page.click('#f-perfil [data-tipo="professor"]');
  await page.fill('#en-curso', tipo === 'professor' ? 'Matemática' : '11.º, Multimédia');
  await page.check('#en-idade'); await page.check('#en-regras'); await page.click('#f-perfil .btn.pri');
  await page.waitForSelector('.folha .passosg', { timeout: 20000 }); await page.click('.folha .btn.pri');
  await page.waitForSelector('.hero', { timeout: 20000 });
}
const foto = async (page, nome) => page.screenshot({ path: path.join(SAIDA, `link-${nome}.png`) });

async function principal() {
  await mkdir(SAIDA, { recursive: true });
  if (!ADMIN_EMAIL) throw new Error('Não encontrei o email do administrador nas regras.');
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const ANA = 'ana.link@exemplo.pt', RUI = 'rui.link@exemplo.pt', PROF = 'prof.link@exemplo.pt', NOVO = 'novo.link@exemplo.pt';
  const uRui = await conta(RUI); await conta(ANA); await conta(PROF); await conta(ADMIN_EMAIL); await conta(NOVO, false);
  await escrever('link_professores/' + PROF, { por: 'ensaio', em: Date.now() });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const T = 'Logótipo para o clube de música da escola';
  try {
    // ---------- entrada ----------
    const nv = await abrir(browser, TEL, 'novo');
    await nv.page.waitForSelector('#f-email', { timeout: 30000 });
    await nv.page.fill('#en-email', NOVO); await nv.page.fill('#en-pass', 'errada'); await nv.page.click('#f-email .btn.pri');
    ok(await ve(nv.page, '#en-erro'), 'palavra-passe errada mostra o erro');
    await nv.page.fill('#en-pass', PASS); await nv.page.click('#f-email .btn.pri');
    ok(await ve(nv.page, 'h1:has-text("Confirma o teu email")', 15000), 'conta por confirmar pede a confirmação do email');
    await nv.ctx.close();

    const ana = await abrir(browser, TEL, 'Ana'), rui = await abrir(browser, PC, 'Rui');
    await entrar(ana.page, ANA, 'Ana Costa'); ok(true, 'Ana entra e cria o perfil (telemóvel)');
    await entrar(rui.page, RUI, 'Rui Matos'); ok(true, 'Rui entra e cria o perfil (computador)');
    ok(!!(await lerDoc('consent/' + uRui)), 'a entrada regista a aceitação dos termos');

    // ---------- perfil do Rui ----------
    await nav(rui.page, 'Perfil', true); await rui.page.click('[data-a="editar-perfil"]');
    await rui.page.fill('#ep-bio', 'Faço logótipos e cartazes em Illustrator.');
    await rui.page.click('.folha [data-area="design"]'); await rui.page.check('#ep-disp'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, '.phead .chip.ok'), 'Rui fica disponível');
    ok(await ve(rui.page, '.phead .av'), 'o perfil mostra o avatar ao estilo da Pronex_Study');

    // ---------- Ana publica ----------
    await ana.page.click('.hero [data-a="novo-pedido"]');
    await ana.page.fill('#np-titulo', T);
    await ana.page.fill('#np-precisa', 'Um logótipo com uma nota musical, a cores e a uma cor.');
    await ana.page.fill('#np-objetivo', 'Usar nos cartazes e nas redes sociais do clube.');
    await ana.page.check('#np-nota'); await ana.page.click('.folha form .btn.pri');
    ok(await ve(ana.page, '.passos'), 'Ana publica o pedido'); await foto(ana.page, '01-pedido');

    // ---------- Rui vê em tempo real e propõe ----------
    await nav(rui.page, 'Pedidos', true);
    ok(await ve(rui.page, `.pedb:has-text("${T}")`, 15000), 'o pedido aparece ao Rui sem recarregar');
    await rui.page.click(`.pedb:has-text("${T}")`);
    await rui.page.fill('#pergunta-t', 'É para imprimir ou só para ecrã?'); await rui.page.click('#f-pergunta .btn');
    ok(await ve(rui.page, '#toast:has-text("Pergunta publicada")'), 'Rui publica uma pergunta');
    // ritmo (como a Pronex_Study): entre duas publicações têm de passar 10 segundos
    await rui.page.click('[data-a="propor"]'); await rui.page.fill('#pp-t', 'Faço-te duas propostas e afinamos a melhor.'); await rui.page.fill('#pp-d', '5'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, '.folha .erro:has-text("segundos")'), 'publicar logo a seguir pede para esperar');
    await rui.page.keyboard.press('Escape'); await rui.page.waitForTimeout(11000);
    await rui.page.click('[data-a="propor"]'); await rui.page.fill('#pp-t', 'Faço-te duas propostas e afinamos a melhor.'); await rui.page.fill('#pp-d', '5'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, 'text=A tua proposta foi enviada'), 'Rui envia a proposta');

    // ---------- Ana recebe, responde e escolhe ----------
    ok(await ve(ana.page, '#sino .dot', 15000), 'Ana recebe o aviso em tempo real');
    ok(await ve(ana.page, '.prop:has-text("Entrega em 5 dias")', 15000), 'a proposta aparece no pedido da Ana');
    await ana.page.click('[data-a="responder"]'); await ana.page.fill('#ft-t', 'Para as duas coisas.'); await ana.page.click('.folha form .btn.pri');
    await ana.page.click('.prop [data-a="aceitar"]');
    ok(await ve(ana.page, '#chat', 15000), 'Ana escolhe o Rui e abre a conversa');
    await ana.page.fill('#msg-t', 'Olá Rui! As cores são azul e amarelo.'); await ana.page.keyboard.press('Enter');
    ok(await ve(ana.page, '.msg.eu'), 'Ana envia uma mensagem');

    // ---------- Rui conversa, entrega ----------
    await nav(rui.page, 'Conversas', true);
    ok(await ve(rui.page, '.conv:has-text("Ana Costa")', 15000), 'a conversa aparece ao Rui');
    await rui.page.click('.conv:has-text("Ana Costa")');
    ok(await ve(rui.page, '.msg:has-text("azul e amarelo")', 15000), 'Rui lê a mensagem da Ana');
    await rui.page.fill('#msg-t', 'Combinado, começo hoje.'); await rui.page.keyboard.press('Enter');
    ok(await ve(ana.page, '.msg:has-text("começo hoje")', 15000), 'a resposta chega à Ana em tempo real');
    ok(await ve(ana.page, '.mrow:not(.eu) .who b:has-text("Rui Matos")'), 'cada mensagem mostra o nome e o avatar de quem a escreveu');
    // a Ana apaga uma mensagem sua; denuncia uma do Rui (com o texto citado para o administrador)
    await ana.page.waitForTimeout(3500); // ritmo das mensagens: 3 s
    await ana.page.fill('#msg-t', 'Mensagem enviada por engano'); await ana.page.keyboard.press('Enter');
    if (!(await ve(ana.page, '.mrow.eu .msg:has-text("por engano")', 10000))) throw new Error('mensagem da Ana não apareceu; aviso: ' + (await ana.page.locator('#toast').textContent().catch(() => '')) + ' | caixa: ' + (await ana.page.inputValue('#msg-t').catch(() => '?')));
    await ana.page.click('.mrow.eu:has-text("por engano") [data-a="msg-menu"]'); await ana.page.click('#mm-apagar'); await ana.page.click('.folha .btn.perigo');
    await ana.page.waitForTimeout(800);
    ok(await ana.page.locator('.msg:has-text("por engano")').count() === 0 && !(await ve(rui.page, '.msg:has-text("por engano")', 2500)), 'Ana apaga a sua mensagem (sai das duas conversas)');
    await ana.page.click('.mrow:not(.eu):has-text("começo hoje") [data-a="msg-menu"]'); await ana.page.click('#mm-den');
    await ana.page.click('.folha [data-mt="spam"]'); await ana.page.click('.folha form .btn.pri');
    ok(await ve(ana.page, '#toast:has-text("Denúncia registada")'), 'Ana denuncia uma mensagem');
    await rui.page.click('[data-a="ver-pedido"]');
    await rui.page.fill('#tarefa-t', 'Esboços a lápis'); await rui.page.click('#f-tarefa .btn');
    ok(await ve(rui.page, '.tarefas li:has-text("Esboços")'), 'tarefa guardada');
    await rui.page.click('[data-a="entregar"]'); await rui.page.fill('#et-t', 'Logótipo em SVG e PNG, a cores e a uma cor.'); await rui.page.fill('#et-l', 'https://exemplo.pt/pasta'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, 'text=Entregaste o trabalho'), 'Rui entrega'); await foto(rui.page, '02-entregue');

    // ---------- Ana conclui e avalia; portefólio do Rui ----------
    await ana.page.click('[data-a="ver-pedido"]');
    ok(await ve(ana.page, '[data-a="concluir"]', 15000), 'Ana vê a entrega');
    await ana.page.click('[data-a="concluir"]'); await ana.page.click('.folha [data-n="5"]'); await ana.page.fill('#cc-t', 'Rápido e com boas ideias.'); await ana.page.click('.folha form .btn.pri');
    ok(await ve(ana.page, '.passos li.feito:has-text("Concluído")'), 'Ana conclui e avalia');
    await nav(rui.page, 'Perfil', true);
    ok(await ve(rui.page, `.peca:has-text("${T}")`, 15000), 'o trabalho entra no portefólio do Rui');
    ok(await ve(rui.page, '.selos:has-text("Primeiro trabalho")'), 'Rui ganha o selo do primeiro trabalho');
    await nav(rui.page, 'Início', true); await rui.page.click('.passo:has-text("Falta avaliares quem pediu")');
    await rui.page.click('[data-a="avaliar-dono"]'); await rui.page.click('.folha [data-n="5"]'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, '.card:has-text("Avaliação de quem pediu")'), 'Rui avalia quem pediu'); await foto(rui.page, '03-perfil');

    // ---------- professor recomenda ----------
    const prof = await abrir(browser, TEL, 'Professor');
    await entrar(prof.page, PROF, 'Prof. Helena', 'professor'); ok(true, 'professor confirmado entra como professor');
    await nav(prof.page, 'Freelancers'); await prof.page.click('.pesb:has-text("Rui Matos")');
    await prof.page.click('[data-a="recomendar"]'); await prof.page.fill('#ft-t', 'O Rui é cuidadoso e cumpre os prazos que combina.'); await prof.page.click('.folha form .btn.pri');
    ok(await ve(prof.page, '.card:has-text("Recomendações de professores")'), 'professor publica a recomendação');

    // ---------- denúncia e moderação ----------
    await nav(ana.page, 'Pedidos'); await ana.page.click('[data-a="ped-seg"][data-s="abertos"]');
    await prof.page.click('#tabbar button:has-text("Início")');
    await prof.page.click('.hero [data-a="novo-pedido"]'); await prof.page.fill('#np-titulo', 'Vídeo do clube de Matemática');
    await prof.page.fill('#np-precisa', 'Um vídeo curto com imagens das sessões do clube.'); await prof.page.fill('#np-objetivo', 'Mostrar o clube aos alunos novos.'); await prof.page.check('#np-nota'); await prof.page.click('.folha form .btn.pri');
    ok(await ve(ana.page, '.pedb:has-text("Vídeo do clube")', 15000), 'o pedido do professor aparece à Ana');
    await ana.page.click('.pedb:has-text("Vídeo do clube")');
    // ritmo nas denúncias (10 s, como as publicações): se a anterior foi há pouco, a app pede para esperar
    const denunciarPedido = async () => { await ana.page.click('[data-a="denunciar"]'); await ana.page.click('.folha [data-mt="improprio"]'); await ana.page.click('.folha form .btn.pri'); };
    await denunciarPedido();
    if (await ve(ana.page, '.folha .erro:has-text("segundos")', 2000)) { ok(true, 'denúncias seguidas pedem para esperar'); await ana.page.keyboard.press('Escape'); await ana.page.waitForTimeout(11000); await denunciarPedido(); }
    ok(await ve(ana.page, '#toast:has-text("Denúncia registada")'), 'Ana denuncia o pedido');
    const adm = await abrir(browser, PC, 'Admin');
    await entrar(adm.page, ADMIN_EMAIL, 'Administração');
    await nav(adm.page, 'Perfil', true);
    ok(await ve(adm.page, '[data-a="perf-tab"][data-t="painel"]', 15000), 'o administrador vê o separador Painel');
    await adm.page.click('[data-a="perf-tab"][data-t="painel"]');
    ok(await ve(adm.page, '#f-pin #pin2'), 'o painel pede para criar o PIN (como na Pronex_Study)');
    await adm.page.fill('#pin1', '2468'); await adm.page.fill('#pin2', '1357'); await adm.page.click('#f-pin .btn');
    ok(await ve(adm.page, '#f-pin .erro:has-text("não são iguais")'), 'PIN diferentes são recusados');
    await adm.page.fill('#pin2', '2468'); await adm.page.click('#f-pin .btn');
    ok(await ve(adm.page, '[data-a="pn-sep"][data-s="mod"]', 15000), 'o PIN abre o painel');
    ok(await ate(async () => { const c = await lerDoc('config/admin'); return !!(c && c.fields && c.fields.pinHash && !JSON.stringify(c).includes('2468')); }), 'o PIN fica guardado em config/admin (só o hash)');
    await adm.page.click('[data-a="pn-sep"][data-s="mod"]');
    ok(await ve(adm.page, '.citacao:has-text("começo hoje")', 15000), 'o administrador vê a mensagem denunciada');
    await adm.page.click('[data-a="pn-apagar-msg"]'); await adm.page.click('.folha .btn.perigo');
    ok(await ve(adm.page, '#toast:has-text("Mensagem apagada")', 10000), 'o administrador apaga a mensagem denunciada');
    await adm.page.click('[data-a="pn-mod"][data-o="ocultar"]');
    await adm.page.click('[data-a="pn-sep"][data-s="reg"]');
    ok(await ve(adm.page, '.aval:has-text("ocultar pedido")', 15000) && await ve(adm.page, '.aval:has-text("apagar mensagem")', 3000), 'as ações ficam no registo (audit)');
    await nav(ana.page, 'Início'); await nav(ana.page, 'Pedidos');
    ok(await ana.page.locator('#ped-lista .pedb:has-text("Vídeo do clube")').count() === 0, 'o pedido ocultado sai da lista da Ana');
    await nav(ana.page, 'Perfil');
    ok(await ana.page.locator('[data-a="perf-tab"][data-t="painel"]').count() === 0, 'alunos não veem o painel');

    // ---------- suspensão (como a Pronex_Study: bans/{uid}) ----------
    await adm.page.click('[data-a="pn-sep"][data-s="uti"]'); await adm.page.fill('#pn-q', 'Rui');
    await adm.page.click('.pnrow:has-text("Rui Matos") [data-a="pn-suspender"]');
    await adm.page.click('.folha [data-dias="1"]'); await adm.page.fill('#sp-m', 'Ensaio de suspensão'); await adm.page.click('.folha .btn.perigo');
    ok(await ate(async () => !!(await lerDoc('bans/' + uRui))), 'a suspensão fica em bans/{uid}');
    await rui.page.reload(); await rui.page.waitForSelector('#demo.susp, .hero', { timeout: 20000 });
    ok(await ve(rui.page, '#demo.susp', 10000), 'o Rui vê o aviso de conta suspensa');
    await nav(rui.page, 'Início', true); await rui.page.click('.hero [data-a="novo-pedido"]');
    await rui.page.fill('#np-titulo', 'Cartaz para a festa de Natal'); await rui.page.fill('#np-precisa', 'Um cartaz A3 com as horas e o local da festa.');
    await rui.page.fill('#np-objetivo', 'Afixar nos corredores da escola.'); await rui.page.check('#np-nota'); await rui.page.click('.folha form .btn.pri');
    ok(await ve(rui.page, '.folha .erro:has-text("suspensa")'), 'conta suspensa não publica');
    await rui.page.keyboard.press('Escape');
    await adm.page.click('.pnrow:has-text("Rui Matos") [data-a="pn-retirar"]');
    ok(await ate(async () => !(await lerDoc('bans/' + uRui))), 'o administrador retira a suspensão');

    // ---------- sair e voltar ----------
    await ana.page.click('[data-a="perf-tab"][data-t="conta"]');
    await ana.page.click('[data-a="sair"]');
    ok(await ve(ana.page, '#f-email', 15000), 'sair volta ao ecrã de entrada');
    await ana.page.fill('#en-email', ANA); await ana.page.fill('#en-pass', PASS); await ana.page.click('#f-email .btn.pri');
    ok(await ve(ana.page, '.hero', 20000), 'voltar a entrar abre a app com o perfil guardado');
    await foto(ana.page, '04-inicio');
  } finally { await browser.close(); servidor.close(); }
  console.log(erros.length ? '\nPROBLEMAS:\n' + erros.join('\n') : '\nPronex_Link: ensaio sem erros.');
  process.exit(erros.length ? 1 : 0);
}
principal().catch(e => { console.error(e); process.exit(1); });
