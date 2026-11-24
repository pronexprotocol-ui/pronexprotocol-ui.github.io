// Pronex_Study · exploração automática com as regras reais do Firestore (emuladores). Nunca toca nos dados reais.
// Cada aluno de teste entra na app, vai a cada ecrã e toca em todos os botões que não apagam nada; depois
// faz os envios principais (sugestão, reporte de exercício, mural, conversa, Nex). Regista todos os avisos de
// falha, erros da página, erros na consola (incluindo recusas das regras) e textos estragados.
// Não falha o CI: escreve o relatório em resultados/exploracao-<motor>.md e no resumo do GitHub.
// Correr em .github/pronex/app:
//   npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node exploracao.mjs"
//   MOTOR=webkit para o motor do Safari (precisa de «npx playwright-core install --with-deps webkit»).
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit, devices } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, '../../../pronex_study');
const SAIDA = path.join(AQUI, 'resultados');
const PROJETO = 'demo-pronex';
const AUTH = 'http://127.0.0.1:9099';
const PORTA = 8798;
const MOTOR = process.env.MOTOR === 'webkit' ? 'webkit' : 'chrome';
const LIMITE_TOQUES = 28; // por ecrã
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const CONFIG = `window.FIREBASE_CONFIG={apiKey:"fake-api-key",authDomain:"${PROJETO}.firebaseapp.com",projectId:"${PROJETO}",appId:"1:1:web:1"};window.PRONEX_EMULADOR={auth:"${AUTH}",host:"127.0.0.1",porta:8080};`;

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

async function confirmarEmail(email) {
  const r = await fetch(`${AUTH}/emulator/v1/projects/${PROJETO}/oobCodes`, { headers: { authorization: 'Bearer owner' } });
  const c = ((await r.json()).oobCodes || []).filter((x) => x.email === email && x.requestType === 'VERIFY_EMAIL').pop();
  if (c) await fetch(c.oobLink);
  return !!c;
}

// ---------- registo do que acontece ----------
const achados = []; // { aluno, ecra, acao, tipo, texto }
const visto = new Set();
function anota(aluno, ecra, acao, tipo, texto) {
  const t = String(texto).replace(/\s+/g, ' ').trim().slice(0, 240);
  const k = aluno + '|' + tipo + '|' + t.replace(/[0-9]+/g, '#');
  if (visto.has(k)) return;
  visto.add(k);
  achados.push({ aluno, ecra, acao, tipo, texto: t });
}
// Avisos que mostram falha, e não só informação.
const FALHA = /não foi possível|não deu|erro|falhou|tenta outra vez|espera uns segundos|ainda não está ativa|sem permiss|verifica a internet|liga a tua conta|algo correu mal/i;
const ESTRAGADO = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|\bInvalid Date\b|\{\{|\}\}/;

async function abrir(browser, nome) {
  const opcoes = MOTOR === 'webkit'
    ? { ...devices['iPhone 13'], serviceWorkers: 'block', locale: 'pt-PT' }
    : { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'pt-PT' };
  const ctx = await browser.newContext(opcoes);
  await ctx.addInitScript(() => {
    window.__T = [];
    const ligar = () => {
      const t = document.getElementById('toast');
      if (!t) { setTimeout(ligar, 150); return; }
      new MutationObserver(() => { if (!t.hidden && t.textContent) window.__T.push(t.textContent); })
        .observe(t, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar); else ligar();
  });
  const page = await ctx.newPage();
  const u = { ctx, page, nome, pend: [] };
  // O Safari queixa-se quando corta uma ligação de escuta ao emulador local (127.0.0.1:8080); não acontece com o servidor real.
  page.on('pageerror', (e) => { if (/127\.0\.0\.1:8080.*access control checks|access control checks.*127\.0\.0\.1:8080/.test(e.message) || /Listen\/channel.*access control checks/.test(e.message)) return; u.pend.push(['erro da página', e.message]); });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::ERR|favicon|Could not reach Cloud Firestore|client is offline|WebChannelConnection/.test(t)) return;
    u.pend.push([/permission|PERMISSION_DENIED|insufficient permissions/i.test(t) ? 'recusa das regras' : 'erro na consola', t]);
  });
  await page.goto(`http://127.0.0.1:${PORTA}/`);
  return u;
}
const noEcra = (page, sel, t = 2500) => page.locator(sel).first().waitFor({ state: 'visible', timeout: t }).then(() => true).catch(() => false);

async function registar(u, { email, nick, confirmar }) {
  const { page } = u;
  await page.waitForSelector('#x8onb', { timeout: 25000 });
  for (let i = 0; i < 45; i++) {
    if (!(await page.locator('#x8onb').count())) return true;
    if (await noEcra(page, '#x8-skip', 150)) { await page.click('#x8-skip'); await page.waitForTimeout(150); continue; }
    if (await noEcra(page, '#x8-e', 150)) {
      await page.fill('#x8-e', email); await page.fill('#x8-p', 'Palavra-passe-1234');
      await page.click('#x8-sub'); await page.waitForTimeout(900); continue;
    }
    if (await noEcra(page, '#x8-vok', 150)) {
      if (confirmar) {
        await confirmarEmail(email);
        await Promise.all([page.waitForEvent('load', { timeout: 15000 }).catch(() => {}), page.click('#x8-vok')]);
        await page.waitForSelector('#x8onb', { timeout: 15000 }).catch(() => {});
      } else { await page.click('#x8-vlater'); await page.waitForTimeout(700); }
      continue;
    }
    if (await noEcra(page, '#x8-a1', 150)) { await page.check('#x8-a1'); await page.check('#x8-a2'); await page.click('#x8-acc'); await page.waitForTimeout(500); continue; }
    if (await noEcra(page, '#x8-nick', 150)) { await page.fill('#x8-nick', nick); await page.click('#x8-done'); await page.waitForTimeout(600); continue; }
    if (await noEcra(page, '#x8-go', 150)) { await page.click('#x8-go'); await page.waitForTimeout(200); continue; }
    if (await noEcra(page, '#x8onb button.x8p.w', 150)) { await page.locator('#x8onb button.x8p.w').first().click(); await page.waitForTimeout(250); continue; }
    await page.waitForTimeout(300);
  }
  anota(u.nome, 'Entrada', '—', 'entrada não terminou', (await page.locator('#x8onb').innerText().catch(() => '')).slice(0, 200));
  return false;
}

// Recolhe avisos, erros e textos estragados desde a última vez.
async function recolher(u, ecra, acao) {
  const { page } = u;
  const [toasts, estragado] = await page.evaluate((src) => {
    const re = new RegExp(src);
    const t = (window.__T || []).splice(0);
    const zonas = [...document.querySelectorAll('[data-view]:not([hidden]), .x11sh, .x8sheet, .nsheet, #x8onb')];
    const linhas = [];
    for (const z of zonas) for (const l of (z.innerText || '').split('\n')) if (re.test(l)) linhas.push(l.trim());
    return [t, linhas.slice(0, 3)];
  }, ESTRAGADO.source).catch(() => [[], []]);
  for (const t of toasts) anota(u.nome, ecra, acao, FALHA.test(t) ? 'aviso de falha' : 'aviso', t);
  for (const l of estragado) anota(u.nome, ecra, acao, 'texto estragado', l);
  for (const [tipo, t] of u.pend.splice(0)) anota(u.nome, ecra, acao, tipo, t);
}

async function fecharFolhas(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll('.x11sh-bg,.x8sheet-bg,.sheet-bg').forEach((b) => b.click());
    document.querySelectorAll('.x11sh,.x8sheet,.nsheet,.x11sh-bg,.x8sheet-bg,.sheet-bg').forEach((e) => e.remove());
  }).catch(() => {});
}

const ECRAS = [
  ['Início', 'go("home")'],
  ['Estudar', 'go("study")'],
  ['Comunidade · Nex', 'commTab="ai";go("comm")'],
  ['Comunidade · Conversas', 'commTab="chat";go("comm")'],
  ['Comunidade · Mural', 'commTab="mural";go("comm")'],
  ['Comunidade · Ranking', 'commTab="rank";go("comm")'],
  ['Perfil · Estatísticas', 'profTab="stats";go("profile")'],
  ['Perfil · Editar', 'profTab="edit";go("profile")'],
  ['Perfil · Definições', 'profTab="defs";go("profile")'],
];
// Não toca no que apaga, sai, denuncia, abre outro site ou recarrega a app.
const PERIGO = /apagar|eliminar|terminar sess|sair|denunciar|suspender|bloquear|google|instalar|atualizar agora|procurar atualiza|descarregar|limpar|repor|sem ligação|esqueci|reenviar|imprimir|partilhar|copiar|exportar|transferir|remover|expulsar|recusar|abandonar|deixar o grupo|fechar o grupo|terminar a sala|desistir|iniciar sessão|entrar com|mudar de conta|recarregar/i;

async function alvos(page) {
  return page.evaluate((src) => {
    const perigo = new RegExp(src, 'i');
    const raiz = document.querySelector('[data-view]:not([hidden])');
    if (!raiz) return [];
    const out = [], vistos = new Set();
    for (const e of raiz.querySelectorAll('button, a[href], [role=button], [role=tab], summary')) {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      if (r.width < 4 || r.height < 4 || s.visibility === 'hidden' || s.display === 'none' || e.disabled || e.closest('[hidden]')) continue;
      // 1.41: ligações que saem da Study na mesma janela (Freelancer, site: href a começar por "../") não se exploram
      if (e.tagName === 'A' && (e.target === '_blank' || /^\.\.\//.test(e.getAttribute('href') || '') || /^https?:/.test(e.getAttribute('href') || '') && !(e.getAttribute('href') || '').startsWith(location.origin))) continue;
      const t = (e.innerText || e.getAttribute('aria-label') || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      if (!t || perigo.test(t)) continue;
      const k = e.tagName + '|' + t + '|' + (e.id || '') + '|' + Object.entries(e.dataset).map(([a, b]) => a + '=' + b).join(',');
      if (vistos.has(k)) continue;
      vistos.add(k);
      out.push(k);
    }
    return out;
  }, PERIGO.source);
}
async function tocar(page, k) {
  const h = await page.evaluateHandle((k) => {
    const raiz = document.querySelector('[data-view]:not([hidden])');
    if (!raiz) return null;
    for (const e of raiz.querySelectorAll('button, a[href], [role=button], [role=tab], summary')) {
      const t = (e.innerText || e.getAttribute('aria-label') || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      const kk = e.tagName + '|' + t + '|' + (e.id || '') + '|' + Object.entries(e.dataset).map(([a, b]) => a + '=' + b).join(',');
      if (kk === k) return e;
    }
    return null;
  }, k);
  const el = h.asElement();
  if (!el) return false;
  try { await el.click({ timeout: 2500 }); } catch { await el.evaluate((e) => e.click()).catch(() => {}); }
  return true;
}

// Se o toque abriu uma janela por cima (folha), toca também nos botões dela, um a seguir ao outro.
async function dentroDaFolha(u, ecra, origem) {
  const { page } = u;
  for (let i = 0; i < 8; i++) {
    const t = await page.evaluate((src) => {
      const perigo = new RegExp(src, 'i');
      const f = [...document.querySelectorAll('.x11sh, .x8sheet, .nsheet')].find((e) => e.getBoundingClientRect().height > 40);
      if (!f) return null;
      f.__feitos = f.__feitos || new Set();
      for (const e of f.querySelectorAll('button, a[href], [role=button], [role=tab]')) {
        const r = e.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || e.disabled) continue;
        const tx = (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50);
        if (!tx || perigo.test(tx) || /^(fechar|cancelar|voltar|×|✕)$/i.test(tx) || f.__feitos.has(tx)) continue;
        if (e.tagName === 'A' && (e.target === '_blank' || /^\.\.\//.test(e.getAttribute('href') || '') || /^https?:/.test(e.getAttribute('href') || ''))) continue;
        f.__feitos.add(tx); e.click(); return tx;
      }
      return null;
    }, PERIGO.source).catch(() => null);
    if (!t) break;
    await page.waitForTimeout(700);
    await recolher(u, ecra, '«' + origem + '» → «' + t + '»');
  }
}

// Uma sessão de exercícios inteira numa disciplina: responde a tudo e confirma que há sempre correção.
async function sessao(u, disc) {
  const { page } = u;
  const ecra = 'Sessão · ' + disc;
  await fecharFolhas(page);
  await page.evaluate((d) => { go('study'); XD.open(d); }, disc).catch((e) => anota(u.nome, ecra, 'abrir', 'erro ao abrir o ecrã', e.message));
  await page.waitForTimeout(1800);
  await recolher(u, ecra, 'abrir a disciplina');
  const comecar = /^(começar|continuar|estudar agora|sessão de hoje|treinar|praticar|começa)/i;
  const clicar = (re) => page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const zonas = [...document.querySelectorAll('.x11sh, .x8sheet, .nsheet')].filter((e) => e.getBoundingClientRect().height > 40);
    const raiz = zonas.pop() || document.querySelector('[data-view]:not([hidden])');
    const b = raiz && [...raiz.querySelectorAll('button, [role=button]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !e.disabled && re.test((e.innerText || '').trim()); });
    if (b) { b.click(); return b.innerText.trim().slice(0, 40); }
    return null;
  }, re.source);
  let comecou = await clicar(comecar);
  await page.waitForTimeout(1200);
  if (await clicar(comecar)) await page.waitForTimeout(1200);
  if (!comecou) { anota(u.nome, ecra, 'começar', 'sessão não começou', (await page.evaluate(() => (document.querySelector('[data-view]:not([hidden])') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 180)))); return; }
  let respostas = 0, tentativas = 0;
  for (let i = 0; i < 60; i++) {
    const s = await page.evaluate(() => {
      const vis = (e) => e && e.getBoundingClientRect().height > 2 && !e.disabled;
      const v = document.querySelector('[data-view]:not([hidden])') || document.body;
      return {
        fim: !!document.querySelector('.xdsum, #xd-end:not([disabled])') && !document.querySelector('.xdopt:not([disabled])'),
        opt: [...v.querySelectorAll('.xdopt')].filter(vis).length,
        ta: vis(document.getElementById('xd-ta')),
        check: vis(document.getElementById('xd-check')),
        code: vis(document.getElementById('xd-run')),
        give: vis(document.getElementById('xd-give')),
        tarefa: vis(document.getElementById('xd-check')) && /Concluir/.test((document.getElementById('xd-check') || {}).innerText || ''),
        fb: !!document.querySelector('.xdfb'),
      };
    }).catch(() => ({}));
    if (s.fim) break;
    let acao = '';
    // Como um aluno: escolhe; escreve e verifica (até 2 tentativas) e depois vê a resposta-modelo; conclui as tarefas; no código, pede a solução.
    if (s.opt && !s.fb) { await page.locator('.xdopt:not([disabled])').first().click({ timeout: 2000 }).catch(() => {}); acao = 'escolher a 1.ª opção'; }
    else if (s.ta && s.check && tentativas < 2) { tentativas++; await page.fill('#xd-ta', 'Resposta de ensaio: explico o conceito com as palavras da matéria e dou um exemplo concreto.').catch(() => {}); await page.click('#xd-check').catch(() => {}); acao = 'resposta escrita'; }
    else if (s.give) { await page.click('#xd-give').catch(() => {}); acao = 'ver a resposta-modelo'; }
    else if (s.tarefa) { await page.click('#xd-check').catch(() => {}); acao = 'concluir a tarefa'; }
    else if (s.code && s.check && tentativas < 2) { tentativas++; await page.click('#xd-check').catch(() => {}); acao = 'código: verificar'; }
    if (acao) {
      respostas++;
      await page.waitForTimeout(acao === 'resposta escrita' ? 2500 : 1100);
      const temFb = await page.evaluate(() => !!document.querySelector('.xdfb')).catch(() => false);
      if (!temFb && !/código|modelo|tarefa/.test(acao)) anota(u.nome, ecra, acao, 'sem correção depois de responder', await page.evaluate(() => (document.querySelector('.xdq, .xdplay h2, [data-view]:not([hidden]) h2') || {}).innerText || '').catch(() => ''));
      await recolher(u, ecra, acao);
    }
    const seg = await clicar(/^(seguinte|continuar|percebi|próximo|avançar|terminar|ver resultado|ver o resumo|concluir)/i);
    if (seg) tentativas = 0;
    if (!seg && !acao) { if (!(await page.click('#xd-skip').then(() => true).catch(() => false))) { anota(u.nome, ecra, 'avançar', 'sessão encravada', await page.evaluate(() => (document.querySelector('[data-view]:not([hidden])') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 200)).catch(() => '')); break; } }
    await page.waitForTimeout(700);
    await recolher(u, ecra, seg ? '«' + seg + '»' : 'avançar');
  }
  await recolher(u, ecra, 'fim da sessão (' + respostas + ' respostas)');
  if (!respostas) anota(u.nome, ecra, 'sessão', 'sessão sem exercícios', 'começou com «' + comecou + '» mas não apareceu nenhum exercício');
}

async function explorar(u) {
  const { page } = u;
  for (const [ecra, entrar] of ECRAS) {
    await fecharFolhas(page);
    await page.evaluate(entrar).catch((e) => anota(u.nome, ecra, 'abrir', 'erro ao abrir o ecrã', e.message));
    await page.waitForTimeout(900);
    await recolher(u, ecra, 'abrir');
    const lista = (await alvos(page)).slice(0, LIMITE_TOQUES);
    for (const k of lista) {
      await fecharFolhas(page);
      await page.evaluate(entrar).catch(() => {});
      await page.waitForTimeout(350);
      const nome = k.split('|')[1];
      if (!(await tocar(page, k))) continue;
      await page.waitForTimeout(650);
      await recolher(u, ecra, '«' + nome + '»');
      await dentroDaFolha(u, ecra, nome);
    }
  }
  // As disciplinas: abre as três primeiras e toca no que houver.
  await fecharFolhas(page);
  await page.evaluate('go("study")'); await page.waitForTimeout(700);
  const discs = await page.evaluate(() => [...document.querySelectorAll('[data-view]:not([hidden]) .xdsubj, [data-view]:not([hidden]) [data-disc]')].slice(0, 3).map((e, i) => i));
  for (const i of discs) {
    await fecharFolhas(page);
    await page.evaluate('go("study")'); await page.waitForTimeout(500);
    const nome = await page.evaluate((i) => { const e = [...document.querySelectorAll('[data-view]:not([hidden]) .xdsubj, [data-view]:not([hidden]) [data-disc]')][i]; if (!e) return ''; const t = e.innerText.split('\n')[0]; e.click(); return t; }, i);
    await page.waitForTimeout(1200);
    await recolher(u, 'Disciplina ' + nome, 'abrir');
    const lista = (await alvos(page)).slice(0, 14);
    for (const k of lista) {
      if (!(await tocar(page, k))) continue;
      await page.waitForTimeout(700);
      await recolher(u, 'Disciplina ' + nome, '«' + k.split('|')[1] + '»');
      await fecharFolhas(page);
    }
  }
}

// Envios a sério: é aqui que as regras do servidor aceitam ou recusam.
async function enviar(u) {
  const { page } = u;
  const passo = async (ecra, acao, fn) => {
    await fecharFolhas(page);
    try { await page.evaluate(fn); } catch (e) { anota(u.nome, ecra, acao, 'erro no ensaio', e.message); }
    await page.waitForTimeout(2200);
    await recolher(u, ecra, acao);
  };
  await passo('Perfil · Definições', 'enviar uma sugestão', `(async()=>{profTab="defs";go("profile");await new Promise(r=>setTimeout(r,700));
    const t=document.getElementById("x12-st"),b=document.getElementById("x12-ss");if(!t||!b){toast("[ensaio] não há caixa de sugestões nas Definições");return;}t.value="Sugestão do ensaio automático";b.click();})()`);
  await passo('Exercício', 'reportar um erro no exercício', `(async()=>{const b=document.createElement("button");b.dataset.xdrep="ensaio-1";document.body.appendChild(b);b.click();
    await new Promise(r=>setTimeout(r,500));const o=document.querySelector("[data-rm=enunciado]");if(o)o.click();await new Promise(r=>setTimeout(r,1500));
    if(b.textContent)toast("[ensaio] botão depois do reporte: "+b.textContent);b.remove();})()`);
  await passo('Comunidade · Mural', 'publicar no mural', `(async()=>{commTab="mural";go("comm");await new Promise(r=>setTimeout(r,900));
    const t=document.querySelector("[data-view]:not([hidden]) textarea"),b=document.getElementById("p-go");if(!t||!b){toast("[ensaio] mural sem caixa para escrever: "+(document.querySelector("[data-view]:not([hidden])").innerText||"").replace(/\\s+/g," ").slice(0,140));return;}t.value="Olá a todos, isto é um ensaio.";t.dispatchEvent(new Event("input",{bubbles:true}));b.click();})()`);
  await passo('Comunidade · Conversas', 'escrever na conversa geral', `(async()=>{commTab="chat";go("comm");await new Promise(r=>setTimeout(r,900));
    const t=document.getElementById("msg-in");if(!t){toast("[ensaio] conversa sem caixa: "+(document.querySelector("[data-view]:not([hidden])").innerText||"").replace(/\\s+/g," ").slice(0,140));return;}t.value="Mensagem do ensaio";t.dispatchEvent(new Event("input",{bubbles:true}));
    const f=t.closest("form");if(f&&f.requestSubmit)f.requestSubmit();else{const b=t.parentElement.querySelector("button[type=submit],button");b&&b.click();}})()`);
  await passo('Comunidade · Nex', 'perguntar ao Nex', `(async()=>{commTab="ai";go("comm");await new Promise(r=>setTimeout(r,900));
    const t=document.querySelector("[data-view]:not([hidden]) textarea, [data-view]:not([hidden]) input[type=text]");if(!t){toast("[ensaio] Nex sem caixa");return;}t.value="o que é a fotossíntese";t.dispatchEvent(new Event("input",{bubbles:true}));
    const f=t.closest("form");if(f&&f.requestSubmit)f.requestSubmit();else{const b=t.parentElement.querySelector("button");b&&b.click();}})()`);
}

async function principal() {
  await mkdir(SAIDA, { recursive: true });
  await new Promise((r) => servidor.listen(PORTA, '127.0.0.1', r));
  const browser = MOTOR === 'webkit' ? await webkit.launch() : await chromium.launch(process.env.PRONEX_CHROME ? { executablePath: process.env.PRONEX_CHROME } : { channel: 'chrome' });
  const alunos = MOTOR === 'webkit'
    ? [{ nome: 'Sara · conta confirmada (iPhone)', email: 'sara.ios@exemplo.pt', nick: 'Sara', confirmar: true }]
    : [{ nome: 'Rui · email por confirmar', email: 'rui@exemplo.pt', nick: 'Rui', confirmar: false },
      { nome: 'Sara · conta confirmada', email: 'sara@exemplo.pt', nick: 'Sara', confirmar: true }];
  const t0 = Date.now();
  try {
    for (const a of alunos) {
      console.log('Aluno:', a.nome);
      const u = await abrir(browser, a.nome);
      if (!(await registar(u, a))) { await u.ctx.close(); continue; }
      await u.page.waitForTimeout(1500);
      await recolher(u, 'Início', 'primeira abertura');
      await explorar(u);
      await enviar(u);
      // Sessões completas só para quem tem a conta confirmada (no Chrome, as nove disciplinas; no Safari, três).
      if (a.confirmar) {
        const discs = await u.page.evaluate(() => (XD.DISC || []).map((d) => d.id)).catch(() => []);
        for (const d of MOTOR === 'webkit' ? discs.slice(0, 3) : discs) await sessao(u, d);
      }
      await u.page.screenshot({ path: path.join(SAIDA, `exploracao-${MOTOR}-${a.nick}.png`) }).catch(() => {});
      await u.ctx.close();
    }
  } finally {
    await browser.close();
    servidor.close();
  }
  // ---------- relatório ----------
  const ordem = ['entrada não terminou', 'erro da página', 'recusa das regras', 'aviso de falha', 'texto estragado', 'erro na consola', 'erro ao abrir o ecrã', 'erro no ensaio', 'aviso'];
  achados.sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo));
  const linhas = [`## Exploração automática · ${MOTOR === 'webkit' ? 'motor do Safari (iPhone 13)' : 'Chrome, telemóvel de 360 px'}`, '',
    `${achados.filter((x) => x.tipo !== 'aviso').length} achados (sem contar avisos normais) em ${Math.round((Date.now() - t0) / 1000)} s.`, '',
    '| Aluno | Ecrã | Ação | Tipo | Texto |', '|---|---|---|---|---|',
    ...achados.map((x) => `| ${x.aluno} | ${x.ecra} | ${x.acao.replace(/\|/g, '/')} | ${x.tipo} | ${x.texto.replace(/\|/g, '/')} |`)];
  const md = linhas.join('\n') + '\n';
  await writeFile(path.join(SAIDA, `exploracao-${MOTOR}.md`), md);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md);
  console.log(md);
}

principal().then(() => process.exit(0)).catch((e) => { console.error('A exploração parou:', e); process.exit(1); });
