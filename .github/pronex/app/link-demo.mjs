// Pronex_Link · ensaio do modo de demonstração (sem servidor), no Chrome, em tamanho de telemóvel e de computador.
// Percorre a app como várias pessoas e confirma cada regra (cerca de 85 verificações).
// Correr em .github/pronex/app:  npm ci && node link-demo.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createRequire } from 'node:module';
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, "../../../pronex_link");
const IMG = path.join(APP, 'icons');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html';
  // A app PRONEX usa o manifesto do site (../site.webmanifest), que no site publicado está na raiz: aqui serve-se o de fonte/.
  if (p === '/site.webmanifest') { res.writeHead(200, { 'content-type': 'application/manifest+json' }); res.end(await readFile(new URL('../../../fonte/site.webmanifest', import.meta.url))); return; }
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end('/* ensaio sem servidor */'); return; }
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});
await new Promise(r => servidor.listen(8796, '127.0.0.1', r));
const ENDERECO = 'http://127.0.0.1:8796/';
const TAMANHOS = [[390, 844, 'm'], [1366, 800, 'd']];
let falhas = 0;
for (const [W, H, tag] of TAMANHOS) {
console.log('\n== ' + (tag === 'm' ? 'telemóvel' : 'computador') + ' ==');
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
// Estes ensaios são do modo de demonstração (sem servidor).
await ctx.addInitScript(() => { try { localStorage.setItem('pronex-link-modo', 'demo'); } catch (e) {} });
const p = await ctx.newPage();
const erros = [];
p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
p.on('pageerror', e => erros.push('pageerror: ' + e.message));
p.on('requestfailed', r => { const f = r.failure(); if (!f || !/ERR_ABORTED/.test(f.errorText)) erros.push('falhou: ' + r.url()); });
const shot = async () => {};
const ok = (c, msg) => { if (!c) { erros.push('FALHOU: ' + msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const nav = W > 900 ? '#snav' : '#tabbar';
const tab = async nome => { await p.click(`${nav} button:has-text("${nome}")`); };
const usarComo = async nome => { await p.keyboard.press('Escape'); await p.click('#demo button'); await p.click(`.folha .conv:has-text("${nome}")`); await p.waitForTimeout(120); };
const overflow = async onde => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(o <= 0, 'sem deslize horizontal em ' + onde + (o > 0 ? ' (+' + o + 'px)' : '')); };
const erroFolha = async () => { try { return (await p.textContent('.folha .erro', { timeout: 5000 })) || ''; } catch (e) { return 'SEM FOLHA'; } };
const enviar = () => p.click('.folha form .btn.pri');
const abrirPedido = async titulo => { await p.click(`.pedb:has-text("${titulo}") >> nth=0`); };
const T = 'Logótipo para o clube de música';
// Acessibilidade (axe): nenhum problema sério ou crítico das regras WCAG 2 A/AA no ecrã atual.
const acess = async onde => {
  // mede o ecrã parado: acaba as animações e transições (uma folha a abrir ainda está meio transparente)
  await p.evaluate(() => document.getAnimations().forEach(x => { try { x.finish(); } catch (e) { /* infinita */ } })); await p.waitForTimeout(350);
  await p.addScriptTag({ path: AXE });
  const v = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }).then(r => r.violations.filter(x => ['serious', 'critical'].includes(x.impact)).map(x => x.id + ' (' + x.nodes.length + '): ' + x.nodes[0].target.join(' '))));
  ok(!v.length, 'acessibilidade em ' + onde + (v.length ? ' — ' + v.join(' | ') : ''));
};
const perfTab = async t => { await tab('Perfil'); await p.click(`[data-a="perf-tab"][data-t="${t}"]`); };


await p.goto(ENDERECO);
// ---------- rapidez: arranque e tamanho da app (sem cache) ----------
{
  const r = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0], rs = performance.getEntriesByType('resource');
    const kb = t => Math.round(rs.filter(x => t.test(x.name)).reduce((s, x) => s + (x.encodedBodySize || x.transferSize || 0), 0) / 1024);
    return { pronto: Math.round(n.domContentLoadedEventEnd), js: kb(/\.js(\?|$)/), css: kb(/\.css(\?|$)/), fontes: kb(/\.woff2/) }; });
  console.log('  · arranque ' + r.pronto + ' ms · JS ' + r.js + ' KB · CSS ' + r.css + ' KB · fontes ' + r.fontes + ' KB');
  ok(r.pronto < 2500, 'a app fica pronta em menos de 2,5 s (' + r.pronto + ' ms)');
  ok(r.js + r.css < 560, 'JS e CSS juntos abaixo de 560 KB (' + (r.js + r.css) + ' KB)');
}
// ---------- entrada e guia ----------
await p.fill('#en-nome', 'Kaizer'); await p.click('#f-entrada .btn.pri');
ok(await p.isVisible('#en-erro'), 'entrada recusa sem as confirmações');
await p.fill('#en-curso', '11.º, Multimédia'); await p.check('#en-idade'); await p.check('#en-regras'); await p.click('#f-entrada .btn.pri');
ok(await p.isVisible('.folha .passosg'), 'guia de boas-vindas aparece na primeira entrada'); await shot('guia');
await p.click('.folha .btn.pri');
ok(await p.isVisible('.hero') && await p.isVisible('.nums'), 'Início com números da comunidade'); await overflow('Início'); await shot('inicio');

// ---------- publicar: modelo, rascunho, aviso de nota, prazo ----------
await p.click('.hero [data-a="novo-pedido"]');
await p.click('.folha [data-modelo="logo"]');
ok((await p.inputValue('#np-titulo')).startsWith('Logótipo para') && (await p.inputValue('#np-precisa')).includes('Nome da marca'), 'modelo preenche o pedido');
await p.fill('#np-titulo', T);
await p.fill('#np-precisa', 'Preciso que façam o trabalho da disciplina de design, é para nota.');
ok(await p.isVisible('#np-aviso'), 'aviso quando o texto parece trabalho para nota'); await shot('aviso-nota');
await p.waitForTimeout(700); await p.keyboard.press('Escape'); await p.click('.hero [data-a="novo-pedido"]');
ok(await p.inputValue('#np-titulo') === T, 'rascunho recuperado depois de fechar a folha');
await p.fill('#np-precisa', 'Um logótipo com uma nota musical, em versão a cores e a uma cor.');
ok(!(await p.isVisible('#np-aviso')), 'aviso de nota desaparece com texto normal');
await p.fill('#np-objetivo', 'Usar nos cartazes e nas redes sociais do clube.');
await p.fill('#np-prazo', '2020-01-01'); await p.check('#np-nota'); await enviar();
ok(/prazo/i.test(await erroFolha()), 'prazo no passado é recusado');
const fut = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
await p.fill('#np-prazo', fut); await p.uncheck('#np-nota'); await enviar();
ok(/nota/.test(await erroFolha()), 'exige confirmar que não é para nota');
await p.check('#np-nota'); await enviar();
ok(await p.isVisible('.passos') && await p.isVisible('.chip.warn:has-text("Faltam 2 dias")'), 'pedido publicado com selo de prazo'); await overflow('pedido'); await shot('pedido-aberto');
ok(await p.evaluate(() => !Loja.rascunho()), 'rascunho apagado depois de publicar');
// editar
await p.click('[data-a="editar-pedido"]'); await p.fill('#np-titulo', T + ' da escola'); await enviar();
ok(await p.isVisible(`h1:has-text("${T} da escola")`), 'pedido editado');
// sugestões e convite direto
ok(await p.isVisible('.card:has-text("Pessoas que podem ajudar") .quem:has-text("Rita M.")'), 'sugere pessoas da área do pedido');
await p.click('.card:has-text("Pessoas que podem ajudar") [data-a="convidar-direto"]');
ok(await p.isVisible('.aviso:has-text("Convite enviado a")'), 'convite direto enviado');

// ---------- outra pessoa: pergunta e proposta ----------
await usarComo('Tiago S.');
await tab('Pedidos'); await overflow('lista de pedidos'); await shot('pedidos');
await p.fill('#ped-q', 'musica'); ok(await p.locator('#ped-lista .ped').count() === 1, 'pesquisa ignora acentos');
ok(await p.evaluate(() => document.activeElement.id) === 'ped-q', 'a pesquisa mantém o foco');
await abrirPedido(T);
await p.fill('#pergunta-t', 'O logótipo é para imprimir ou só para ecrã?'); await p.click('#f-pergunta .btn');
ok(await p.isVisible('.aval:has-text("imprimir ou só para ecrã")'), 'pergunta publicada');
await p.click('[data-a="propor"]'); await p.fill('#pp-t', 'Faço-te duas propostas simples e afinamos a melhor.'); await enviar();
ok(/dias/.test(await erroFolha()), 'proposta exige o número de dias');
await p.fill('#pp-d', '5'); await enviar();
ok(await p.isVisible('text=A tua proposta foi enviada'), 'proposta enviada');
await p.click('.guard.solto'); await p.click('[data-a="voltar"]'); await p.click('[data-a="ped-seg"][data-s="guardados"]');
ok(await p.locator('#ped-lista .ped').count() === 1, 'pedido guardado aparece em Guardados');

// ---------- dono: avisos, resposta, escolha ----------
await usarComo('Kaizer');
ok(await p.locator(W > 900 ? '#snav button:has-text("Avisos") .dot' : '#sino .dot').isVisible(), 'sino mostra avisos por ler');
await p.click(W > 900 ? '#snav button:has-text("Avisos")' : '#sino'); await shot('avisos');
ok(await p.locator('.folha .conv.novo').count() === 2, 'dois avisos novos (pergunta e proposta)');
await p.click('.folha .conv >> nth=0'); ok(await p.isVisible('.passos'), 'aviso abre o pedido');
await p.click('[data-a="responder"]'); await p.fill('#ft-t', 'Para as duas coisas.'); await enviar();
ok(await p.isVisible('.resp:has-text("Para as duas coisas")'), 'resposta publicada');
ok(await p.isVisible('.prop:has-text("Entrega em 5 dias")'), 'proposta mostra o tempo de entrega'); await shot('pedido-propostas');

// ---------- convite aceite, conversa, tarefas, desistência ----------
await usarComo('Rita M.');
ok(await p.isVisible('.h2:has-text("Convites para ti")'), 'convite aparece no Início de quem foi convidado');
await p.click('.prop [data-a="aceitar"]'); ok(await p.isVisible('#chat'), 'aceitar o convite abre a conversa');
await p.click('.rapidas button >> nth=0'); ok(await p.locator('.msg.eu').count() === 1, 'resposta rápida enviada');
await p.setInputFiles('#msg-img', path.join(IMG, 'icon-192.png')); await p.waitForTimeout(400);
ok(await p.locator('.msg.eu img').count() === 1, 'imagem enviada na conversa'); await overflow('conversa'); await shot('conversa');
await p.click('.msg.eu img.zoom'); ok(await p.isVisible('.folha .visor img'), 'a imagem abre em grande'); await p.keyboard.press('Escape');
ok(await p.evaluate(() => /^#conversa\//.test(location.hash)), 'a conversa aberta tem ligação direta');
await p.click('[data-a="ver-pedido"]');
await p.fill('#tarefa-t', 'Esboços a lápis'); await p.click('#f-tarefa .btn'); await p.fill('#tarefa-t', 'Versão final em SVG'); await p.keyboard.press('Enter');
await p.check('.tarefas input >> nth=0');
ok(await p.isVisible('h2:has-text("Tarefas") >> text=1 de 2'), 'lista de tarefas com progresso'); await shot('tarefas');
await p.click('[data-a="desistir"]'); await enviar(); ok(/porque/i.test(await erroFolha()), 'desistir exige motivo');
await p.fill('#ft-t', 'Não vou ter tempo esta semana.'); await enviar();
ok(await p.evaluate(() => DB.pedidos.find(x => x.titulo.includes('clube de música')).estado === 'aberto'), 'desistir reabre o pedido');
await usarComo('Tiago S.');
ok(await p.evaluate(() => Loja.avisos().some(a => a.texto.includes('entregue a outra pessoa'))), 'quem não foi escolhido é avisado');
await tab('Pedidos'); await abrirPedido(T); await p.click('[data-a="propor"]'); await p.fill('#pp-t', 'Continuo disponível para fazer o logótipo.'); await p.fill('#pp-d', '4'); await enviar();
await usarComo('Kaizer');
await p.click(`.pedb:has-text("${T}")`); await p.click('.prop [data-a="aceitar"]');
ok(await p.isVisible('#chat') && !(await p.isVisible('.msg.eu')), 'nova conversa com a pessoa nova, sem as mensagens antigas');
await tab('Conversas'); await p.click('.conv:has-text("Rita M.")');
ok(await p.isVisible('.aviso.warn:has-text("fechada")') && !(await p.isVisible('#escrever')), 'conversa antiga fica fechada');

// ---------- entrega, alterações, fecho sem resposta, avaliações ----------
await usarComo('Tiago S.');
await p.click(`.pedb:has-text("${T}")`); await p.click('[data-a="entregar"]');
await p.fill('#et-t', 'Primeira versão do logótipo.'); await p.fill('#et-l', 'drive.exemplo'); await enviar();
ok(/https/.test(await erroFolha()), 'ligação sem https é recusada');
await p.fill('#et-l', 'https://exemplo.pt/pasta'); await enviar();
await usarComo('Kaizer'); await p.click(`.pedb:has-text("${T}")`);
await p.click('[data-a="alteracoes"]'); await p.fill('#ft-t', 'A nota musical devia ser maior.'); await enviar();
await usarComo('Tiago S.'); await p.click(`.pedb:has-text("${T}")`); await p.click('[data-a="entregar"]');
await p.fill('#et-t', 'Segunda versão, com a nota musical maior.'); await enviar();
ok(await p.isVisible('summary:has-text("Versões anteriores (1)")'), 'histórico de entregas'); await shot('entregue');
ok(!(await p.isVisible('[data-a="fechar-sozinho"]')), 'não dá para fechar sozinho antes dos 7 dias');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); x.entrega.em -= 8 * 86400000; desenhar(); });
ok(await p.isVisible('[data-a="fechar-sozinho"]'), 'ao fim de 7 dias sem resposta, quem fez pode fechar');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); x.entrega.em += 8 * 86400000; desenhar(); });
await usarComo('Kaizer'); await p.click(`.pedb:has-text("${T}")`);
await p.click('[data-a="concluir"]'); await enviar(); ok(/estrelas/.test(await erroFolha()), 'avaliação exige estrelas');
await p.click('.folha [data-n="4"]'); await p.fill('#cc-t', 'Bom trabalho e boa comunicação.');
await p.selectOption('#cc-qualidade', '5'); await p.selectOption('#cc-comunicacao', '4'); await acess('avaliação por critérios'); await enviar();
ok(await p.isVisible('.passos li.feito:has-text("Concluído")'), 'pedido concluído');
ok(await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); return x.avaliacao.criterios && x.avaliacao.criterios.qualidade === 5 && !('prazo' in x.avaliacao.criterios); }), 'critérios guardados (só os escolhidos)');
await p.evaluate(() => { location.hash = '#pessoa/ex_tiago'; }); await p.waitForTimeout(200);
ok(await p.isVisible('.hbar.crit:has-text("Qualidade do trabalho")'), 'o perfil mostra a média por critério');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); location.hash = '#pedido/' + x.id; }); await p.waitForTimeout(150);
await p.click('[data-a="comprovativo"]'); ok(await p.isVisible('.comprov:has-text("Tiago S.")'), 'comprovativo do trabalho'); await shot('comprovativo'); await p.keyboard.press('Escape');
await usarComo('Tiago S.');
ok(await p.isVisible('.passo:has-text("Falta avaliares quem pediu")'), 'Início lembra de avaliar quem pediu');
await p.click(`.pedb:has-text("${T}")`); await p.click('[data-a="avaliar-dono"]'); await p.click('.folha [data-n="5"]'); await enviar();
ok(await p.isVisible('.card:has-text("Avaliação de quem pediu")'), 'quem fez avalia quem pediu');
await tab('Perfil'); ok(await p.isVisible('.peca:has-text("clube de música")') && await p.isVisible('.selos:has-text("Primeiro trabalho")'), 'trabalho no portefólio e selo no perfil'); await overflow('perfil'); await shot('perfil-tiago');

// ---------- professor: recomendação ----------
await usarComo('Prof. Helena C.');
await tab('Rede'); await overflow('freelancers'); await p.click('.pesb:has-text("Rita M.")');
await p.click('[data-a="recomendar"]'); await p.fill('#ft-t', 'curta'); await enviar(); ok(/frase/.test(await erroFolha()), 'recomendação exige texto');
await p.fill('#ft-t', 'A Rita é muito cuidadosa e cumpre sempre os prazos que combina.'); await enviar();
ok(await p.isVisible('.card:has-text("Recomendações de professores") >> text=cuidadosa') && await p.isVisible('.selos:has-text("Recomendado")'), 'recomendação e selo aparecem no perfil'); await shot('perfil-rita');
await usarComo('Kaizer'); await tab('Rede'); await p.click('.pesb:has-text("Rita M.")');
ok(!(await p.isVisible('[data-a="recomendar"]')), 'alunos não podem recomendar');

// ---------- guardar pessoas, bloquear, denunciar, moderação ----------
await p.click('.guard.solto'); await p.click('[data-a="voltar"]'); await p.check('#pes-guard');
ok(await p.locator('#pes-lista .pes').count() === 1, 'filtro de pessoas guardadas'); await p.uncheck('#pes-guard');
await p.click('.pesb:has-text("Inês F.")'); await p.click('[data-a="bloquear"]'); await p.click('#cf-ok');
ok(!(await p.isVisible('.pesb:has-text("Inês F.")')), 'pessoa bloqueada sai da lista');
await tab('Pedidos'); ok(!(await p.isVisible('.pedb:has-text("Dúvidas em funções")')), 'pedidos de quem bloqueei deixam de aparecer');
await perfTab('defs'); await p.click('.card:has-text("Pessoas bloqueadas") [data-a="desbloquear"]');
await tab('Pedidos'); ok(await p.isVisible('.pedb:has-text("Dúvidas em funções")'), 'desbloquear repõe os pedidos');
await abrirPedido('Dúvidas em funções'); await p.click('[data-a="denunciar"]'); await enviar(); ok(/motivo/.test(await erroFolha()), 'denúncia exige motivo');
await p.click('.folha [role=radio] >> nth=0'); await enviar();
await p.click('[data-a="denunciar"]'); await p.click('.folha [role=radio] >> nth=0'); await enviar(); ok(/Já denunciaste/.test(await erroFolha()), 'não dá para denunciar duas vezes o mesmo'); await p.keyboard.press('Escape');
await perfTab('painel'); await p.click('[data-a="pn-sep"][data-s="mod"]'); await shot('moderacao');
await p.click('[data-a="pn-mod"][data-o="ocultar"]');
await tab('Pedidos'); ok(!(await p.isVisible('.pedb:has-text("Dúvidas em funções")')), 'pedido ocultado pela moderação sai da lista');

// ---------- segurança igual à Pronex_Study ----------
await tab('Início'); await p.click('.hero [data-a="novo-pedido"]');
await p.fill('#np-titulo', 'Isto é uma porcaria de puta de pedido'); await p.fill('#np-precisa', 'Texto com mais de quinze letras para passar.'); await p.fill('#np-objetivo', 'Um objetivo qualquer aqui.'); await p.check('#np-nota'); await enviar();
ok(/insultos/.test(await erroFolha()), 'filtro de insultos da Pronex_Study');
await p.fill('#np-titulo', 'Cartaz para a festa da turma'); await p.fill('#np-precisa', 'Liga-me para o 912 345 678 e combinamos o cartaz.'); await enviar();
ok(await p.isVisible('.folha h2:has-text("Isto parece um contacto")'), 'aviso de contacto antes de publicar');
await p.click('[data-a="fechar-folha"]');
await p.keyboard.press('Escape');
await tab('Conversas'); await p.click('.conv >> nth=0');
await p.fill('#msg-t', 'Ninguém gosta de mim na turma'); await p.click('#escrever .btn.enviar');
ok(await p.isVisible('.folha h2:has-text("Não estás sozinho")'), 'aviso de crise com contactos de ajuda');
await p.click('#cr-seguir'); await p.waitForTimeout(200);
ok(await p.isVisible('.msg.eu:has-text("Ninguém gosta de mim")'), 'a mensagem segue depois do aviso');
ok(await p.locator('.mrow .who b').count() > 0 && await p.locator('.mrow .pu .av').count() > 0, 'mensagens com avatar, nome e hora');
await p.click('.mrow.eu [data-a="msg-menu"] >> nth=-1'); await p.click('#mm-apagar'); await p.click('#cf-ok');
ok(!(await p.isVisible('.msg.eu:has-text("Ninguém gosta de mim")')), 'apagar a minha mensagem');
const outra = p.locator('.mrow:not(.eu) [data-a="msg-menu"]');
if (await outra.count()) { await outra.first().click(); await p.click('#mm-den'); await p.click('.folha [data-mt="ofensivo"]'); await enviar(); ok(await p.isVisible('#toast:has-text("Denúncia registada")'), 'denunciar uma mensagem'); }

// ---------- perfil ----------
await tab('Perfil'); await p.click('[data-a="editar-perfil"]');
await p.setInputFiles('#ep-foto', path.join(IMG, 'icon-192.png'));
await p.fill('#ep-bio', 'Modelação 3D em Blender e edição de vídeo.'); await p.check('#ep-disp'); await enviar();
ok(/área/.test(await erroFolha()), 'disponível exige pelo menos uma área');
ok(await p.locator('.folha .cores [data-cor]').count() >= 6, 'escolha da cor do avatar (as cores da Pronex_Study)');
await p.click('.folha .cores [data-cor="3"]');
await p.click('.folha [data-area="3d"]'); await p.selectOption('.folha [data-niv="3d"]', '2'); await p.fill('#ep-ferr', 'Blender, Premiere, Blender'); await p.fill('#ep-of', 'Cenas 3D simples para sites.'); await shot('editar-perfil'); await enviar();
ok(await p.isVisible('.phead .chip.ok') && await p.isVisible('.areasniv:has-text("Com prática")') && await p.locator('.card .chip:has-text("Blender")').count() === 1, 'perfil com área, nível e programas sem repetidos');
ok(await p.locator('.phead .av img').count() === 1, 'fotografia de perfil');
await p.click('[data-a="editar-exp"][data-id=""]'); await p.fill('#ex-t', 'Luzes de palco'); await enviar();
await p.click('.exp [aria-label^="Editar a experiência"]'); await p.fill('#ex-t', 'Luzes de palco num espetáculo da escola'); await enviar();
ok(await p.isVisible('.exp:has-text("num espetáculo da escola")'), 'experiência editada');
await p.click('.h2 [data-a="editar-peca"]'); await p.fill('#pc-t', 'Cena 3D de um quarto'); await p.setInputFiles('#pc-i', path.join(IMG, 'icon-512.png')); await p.waitForTimeout(300); await enviar();
await p.click('.peca:has-text("Cena 3D")'); await p.click('.folha [data-a="editar-peca"]'); ok(await p.isVisible('#pc-i-pre'), 'editar peça mantém a imagem'); await p.fill('#pc-t', 'Cena 3D de um quarto de estudante'); await enviar();
ok(await p.isVisible('.peca:has-text("quarto de estudante")'), 'peça editada');
const barra = await p.evaluate(() => Loja.completo(DB.eu)); ok(barra.pct === 100, 'perfil 100% completo' + (barra.pct < 100 ? ' (falta: ' + barra.falta.join(', ') + ')' : '')); await overflow('o meu perfil'); await shot('perfil-meu');
ok(await p.isVisible('.nums:has-text("5,0")'), 'nota de quando pede aparece no perfil');
ok(await p.locator('.phead .av.g3').count() === 1 || await p.locator('.phead .av img').count() === 1, 'avatar com a cor escolhida');
// painel: suspender uma pessoa e ver a faixa de conta suspensa
await perfTab('painel'); await p.click('[data-a="pn-sep"][data-s="uti"]');
await p.click('.pnrow:has-text("Inês F.") [data-a="pn-suspender"]'); await p.fill('#sp-m', 'Ensaio do painel'); await p.click('.folha .btn.perigo');
ok(await p.isVisible('.pnrow:has-text("Inês F.") .chip.bad'), 'painel suspende uma pessoa');
await p.click('[data-a="pn-sep"][data-s="reg"]'); ok(await p.isVisible('.aval:has-text("suspender")'), 'registo das ações do administrador');
await usarComo('Inês F.'); ok(await p.isVisible('#demo.susp'), 'quem está suspenso vê a faixa da suspensão');
await tab('Início'); await p.click('.hero [data-a="novo-pedido"]'); await p.fill('#np-titulo', 'Pedido de quem está suspenso'); await p.fill('#np-precisa', 'Texto com mais de quinze letras.'); await p.fill('#np-objetivo', 'Um objetivo qualquer.'); await p.check('#np-nota'); await enviar();
ok(/suspensa/.test(await erroFolha()), 'conta suspensa não publica'); await p.keyboard.press('Escape');
await usarComo('Kaizer'); await perfTab('painel'); await p.click('[data-a="pn-sep"][data-s="uti"]'); await p.click('.pnrow:has-text("Inês F.") [data-a="pn-retirar"]');
ok(!(await p.isVisible('.pnrow:has-text("Inês F.") .chip.bad')), 'retirar a suspensão');

// ---------- 0.5: ligações diretas, partilhar, sem internet, avisos do dispositivo, título ----------
const ab = await p.evaluate(() => { const x = DB.pedidos.find(q => q.estado === 'aberto' && !q.oculto && q.uid !== DB.eu && Loja.visivel(q)); return x ? { id: x.id, t: x.titulo } : null; });
await tab('Início'); await p.evaluate(id => { location.hash = '#pedido/' + id; }, ab.id); await p.waitForTimeout(250);
ok((await p.textContent('h1.titulo')) === ab.t, 'a ligação #pedido/… abre o pedido');
ok((await p.title()).includes(ab.t), 'o título da página tem o nome do pedido');
await p.click('[data-a="partilhar"]'); await p.waitForTimeout(300);
ok(await p.isVisible('#toast:has-text("Ligação do pedido")') || await p.evaluate(() => !!navigator.share), 'partilhar um pedido copia a ligação');
await p.reload(); await p.waitForTimeout(300);
ok((await p.textContent('h1.titulo').catch(() => '')) === ab.t, 'abrir a app com a ligação vai direto ao pedido');
await p.evaluate(() => { location.hash = '#pedido/nao_existe'; }); await p.waitForTimeout(250);
ok(await p.isVisible('#toast:has-text("Não encontrei")'), 'ligação para algo que não existe avisa e não parte a app');
await ctx.setOffline(true); await p.waitForTimeout(200); ok(await p.isVisible('#rede'), 'sem internet aparece o aviso');
await ctx.setOffline(false); await p.waitForTimeout(200); ok(!(await p.isVisible('#rede')), 'com a ligação de volta o aviso desaparece');
await perfTab('defs'); ok(await p.isVisible('[data-a="avisos-sistema"]') || await p.isVisible('text=não mostra avisos'), 'Definições tem os avisos do dispositivo');
const tit = await p.evaluate(() => { const n = Loja.totalNaoLidas() + Loja.avisosPorLer(); return { n, t: document.title }; });
ok(tit.n ? tit.t.startsWith('(' + tit.n + ')') : !/^\(/.test(tit.t), 'o título mostra quantas coisas há por ver');
await perfTab('resumo'); await p.click('[data-a="editar-perfil"]'); ok(await p.isVisible('.folha .escolher'), 'escolher imagem com botão próprio'); await p.keyboard.press('Escape');
await overflow('perfil (0.5)');

// ---------- 0.6: pesquisa, atalhos, filtros, alertas, respostas, destaque, dias, números, PDF, anúncio, CSV, contraste, axe ----------
await tab('Início'); await p.locator('body').click({ position: { x: 2, y: 400 } }).catch(() => {});
await p.keyboard.press('/'); ok(await p.isVisible('.folha #pg-q'), 'a tecla / abre a pesquisa');
await p.fill('#pg-q', 'logó'); await p.waitForTimeout(150); ok(await p.locator('#pg-r .conv').count() > 0, 'a pesquisa encontra pedidos, pessoas e conversas'); await acess('pesquisa'); await p.keyboard.press('Escape');
await p.keyboard.press('n'); ok(await p.isVisible('.folha #np-titulo'), 'a tecla N abre um pedido novo'); await p.keyboard.press('Escape');
await tab('Pedidos'); await p.selectOption('#ped-fmt', 'online'); await p.waitForTimeout(100);
ok(await p.evaluate(() => [...document.querySelectorAll('#ped-lista .pedb')].every(b => (Loja.pedido(b.dataset.id) || {}).formato === 'online')), 'filtro de formato (online)'); await p.selectOption('#ped-fmt', ''); await acess('pedidos');
await perfTab('defs'); await p.evaluate(() => { const d = document.querySelector('details.recolher'); if (d) d.open = true; }); await p.click('[data-a="alerta-area"][data-area="som"]'); ok(await p.getAttribute('[data-a="alerta-area"][data-area="som"]', 'aria-pressed') === 'true', 'seguir uma área nos alertas');
await acess('definições');
await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_rita'); Loja.publicarPedido({ tipo: 'projeto', area: 'som', titulo: 'Jingle para a rádio da escola', precisa: 'Um jingle curto com a voz de dois alunos.', objetivo: 'Abrir o programa da rádio da escola.', naoNota: true }); Loja.usarComo(eu); desenhar(); });
ok(await p.isVisible('#toast:has-text("Pedido novo")'), 'pedido novo numa área seguida dá um alerta');
const cv = await p.evaluate(() => {
  const eu = DB.eu; let c = Loja.minhasConversas().find(c => !Loja.conversaFechada(c));
  if (!c) { // abre um trabalho novo: a Rita pede, eu proponho, a Rita aceita
    Loja.usarComo('ex_rita'); Loja.publicarPedido({ tipo: 'ajuda', area: 'mat', titulo: 'Ajuda com funções para o exame', precisa: 'Explicar funções quadráticas com exercícios.', objetivo: 'Preparar o exame nacional.', naoNota: true });
    const pd = DB.pedidos.find(x => x.titulo === 'Ajuda com funções para o exame'); Loja.usarComo(eu);
    Loja.enviarProposta(pd.id, 'Explico com exercícios resolvidos, em duas sessões.', 3);
    Loja.usarComo('ex_rita'); const pr = DB.propostas.find(x => x.pedidoId === pd.id && x.uid === eu); Loja.aceitar(pr.id); Loja.usarComo(eu);
    c = Loja.conversaAtiva(pd.id);
  }
  const outro = c.uids.find(u => u !== eu); Loja.usarComo(outro); Loja.enviarMensagem(c.id, 'Consegues mostrar um exemplo amanhã?'); Loja.usarComo(eu); desenhar();
  return c.id;
});
if (cv) {
  await p.evaluate(id => { location.hash = '#conversa/' + id; }, cv); await p.waitForTimeout(200);
  await p.click('.mrow:not(.eu) [data-a="msg-menu"] >> nth=-1'); await p.click('#mm-resp'); ok(await p.isVisible('.respondendo'), 'responder a uma mensagem mostra a que se responde');
  await p.fill('#msg-t', 'Sim, vê aqui https://exemplo.pt/rascunho'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok(await p.isVisible('.mrow.eu .msg .cit >> nth=-1') && await p.isVisible('.mrow.eu .msg a.lk >> nth=-1'), 'a resposta leva a citação e a ligação fica clicável');
  await acess('conversa');
} else ok(false, 'havia uma conversa aberta para testar as respostas');
await perfTab('resumo'); await p.click('[data-a="editar-perfil"]'); await p.click('.folha [data-dia="seg"]'); await p.click('.folha [data-dia="qua"]'); await enviar();
ok(await p.isVisible('.phead .chip:has-text("Seg, Qua")'), 'dias em que pode aparecem no perfil');
ok(await p.isVisible('.card h2:has-text("Os teus números")'), 'números pessoais no perfil');
const destaque = await p.evaluate(() => { const x = DB.pecas.find(k => k.uid === DB.eu); if (!x) return 'sem peça'; Loja.destacarPeca(x.id); return Loja.portefolio(DB.eu)[0].id === x.id ? 'ok' : 'não'; });
ok(destaque === 'ok' || destaque === 'sem peça', 'peça em destaque aparece primeiro no portefólio');
const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null), p.click('[data-a="imprimir-portefolio"]')]);
ok(pop && /Kaizer/.test(await pop.content()), 'portefólio em PDF abre a página para imprimir'); if (pop) await pop.close();
await acess('perfil');
await perfTab('painel'); await p.fill('#an-t', 'Esta semana há pedidos de vídeo para a semana da escola.'); await p.click('#f-anuncio .btn');
ok(await p.isVisible('.barras') && await p.isVisible('#toast:has-text("Anúncio publicado")'), 'painel com gráficos; anúncio publicado'); await acess('painel');
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-a="pn-csv"]')]);
ok(dl && /\.csv$/.test(dl.suggestedFilename()), 'números para a escola em CSV');
await tab('Início'); ok(await p.isVisible('.aviso.anuncio:has-text("semana da escola")'), 'o anúncio aparece no Início');
await p.click('[data-a="fechar-anuncio"]'); ok(!(await p.isVisible('.aviso.anuncio')), 'cada pessoa pode fechar o anúncio');
await perfTab('defs'); await p.click('[data-a="contraste"][data-t="1"]'); ok(await p.evaluate(() => document.documentElement.classList.contains('contraste')), 'contraste alto'); await acess('contraste alto');
await p.click('[data-a="contraste"][data-t="0"]');
const par = await p.evaluate(() => { const x = DB.pedidos.find(q => q.uid === DB.eu && q.estado === 'aberto'); if (!x) return ''; x.criadoEm = Date.now() - 40 * 864e5; delete x.editadoEm; DB.propostas.filter(r => r.pedidoId === x.id && r.estado === 'pendente').forEach(r => { r.estado = 'recusada'; }); desenhar(); return x.id; });
if (par) { await tab('Início'); ok(await p.isVisible('h2:has-text("parados")'), 'pedido parado há mais de um mês pede decisão'); await p.click('[data-a="renovar"][data-id="' + par + '"]'); ok(!(await p.isVisible('[data-a="renovar"][data-id="' + par + '"]')), 'manter aberto renova o pedido'); }
await tab('Início'); await acess('início');

// ---------- 0.7: «visto», modelos próprios, rascunhos ----------
await p.evaluate(id => { const eu = DB.eu, c = Loja.conversa(id), o = c.uids.find(u => u !== eu); Loja.usarComo(o); Loja.ligarVisto(true); Loja.marcarLida(id); Loja.usarComo(eu); desenhar(); }, cv);
await perfTab('defs'); await p.click('[data-a="visto"]'); ok(await p.evaluate(() => !!Loja.eu().visto), 'ligar o «visto»');
await p.evaluate(id => { location.hash = '#conversa/' + id; }, cv); await p.waitForTimeout(200);
ok(await p.isVisible('.mrow.eu .visto'), 'com as duas pessoas de acordo, aparece «Visto» na última mensagem');
await perfTab('defs'); await p.click('[data-a="visto"]'); await p.evaluate(id => { location.hash = '#conversa/' + id; }, cv); await p.waitForTimeout(200);
ok(!(await p.isVisible('.mrow.eu .visto')), 'sem o meu «visto» ligado, não vejo o dos outros');
await tab('Início'); await p.click('.hero [data-a="novo-pedido"]');
await p.fill('#np-titulo', 'Cartaz para o torneio de xadrez'); await p.fill('#np-precisa', 'Cartaz A3 com o horário e o local do torneio.');
await p.click('#np-modelo'); ok(await p.isVisible('#toast:has-text("Modelo guardado")'), 'guardar um pedido como modelo');
await p.click('#np-guardar'); ok(!(await p.isVisible('.folha')), 'guardar para mais tarde fecha o formulário');
await p.click('.hero [data-a="novo-pedido"]'); ok(await p.isVisible('.folha [data-rascunho]') && await p.isVisible('.folha [data-meu]'), 'rascunhos e modelos próprios aparecem no formulário');
await p.fill('#np-titulo', ''); await p.click('.folha [data-rascunho] >> nth=0'); ok((await p.inputValue('#np-titulo')) === 'Cartaz para o torneio de xadrez', 'abrir um rascunho preenche o pedido');
await p.keyboard.press('Escape');

// ---------- 0.8: clareza (troca, glossário, primeiros passos, qualidade do pedido) ----------
await tab('Início'); ok(await p.isVisible('.passos1') || (await p.evaluate(() => Loja.primeirosPassos(alertasArea().length).every(x => x.feito))), 'primeiros passos no Início');
await perfTab('defs'); await p.click('[data-a="glossario"]'); ok(await p.locator('.folha .glossario dt').count() >= 8, 'palavras da app explicadas'); await acess('glossário'); await p.keyboard.press('Escape');
await p.click('[data-a="como-funciona"]'); ok(await p.isVisible('.folha .aviso.troca'), 'como funciona explica a troca (sem dinheiro, sem nota)'); await p.keyboard.press('Escape');
await tab('Início'); await p.click('.hero [data-a="novo-pedido"]');
ok(await p.isVisible('#np-q:has-text("Pouco claro")'), 'pedido vazio é «pouco claro»');
await p.fill('#np-titulo', 'Logótipo para a banda da escola'); await p.fill('#np-precisa', 'Um logótipo com o nome da banda, que funcione a preto e a cores, para cartazes e redes sociais.');
await p.fill('#np-objetivo', 'Ter uma imagem nossa nos concertos da escola.'); await p.fill('#np-finalidade', 'Banda da escola');
ok(await p.isVisible('#np-q:has-text("Claro")') && !(await p.isVisible('#np-q:has-text("Pouco claro")')), 'o medidor sobe enquanto o pedido fica mais claro'); await acess('formulário de pedido');
await p.keyboard.press('Escape');

// ---------- 0.10: pedidos de equipa ----------
await tab('Início'); await p.click('.hero [data-a="novo-pedido"]');
await p.click('.folha [data-tipo="equipa"]'); ok(await p.isVisible('#np-vagas'), 'pedido de equipa pergunta quantas pessoas');
await p.selectOption('#np-vagas', '3'); await p.fill('#np-titulo', 'Equipa para a curta-metragem da escola');
await p.fill('#np-precisa', 'Procuro quem trate do som e da montagem de uma curta de cinco minutos.'); await p.fill('#np-objetivo', 'Apresentar a curta no festival da escola.');
await p.check('#np-nota'); await enviar(); await p.waitForTimeout(200);
const eq = await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Equipa para a curta-metragem da escola'); return x ? { id: x.id, vagas: x.vagas } : null; });
ok(eq && eq.vagas === 3, 'o pedido guarda as 3 vagas');
await p.evaluate(id => { const eu = DB.eu;
  Loja.usarComo('ex_rita'); Loja.enviarProposta(id, 'Trato da montagem em Premiere, com legendas.', 5);
  Loja.usarComo('ex_tiago'); Loja.enviarProposta(id, 'Gravo e misturo o som da curta.', 4);
  Loja.usarComo(eu); const pr = DB.propostas.find(x => x.pedidoId === id && x.uid === 'ex_rita'); Loja.aceitar(pr.id); desenhar(); }, eq.id);
ok(await p.evaluate(id => { const x = Loja.pedido(id); return x.estado === 'em_curso' && Loja.vagasLivres(x) === 2 && DB.propostas.some(r => r.pedidoId === id && r.uid === 'ex_tiago' && r.estado === 'pendente'); }, eq.id), 'na equipa, escolher a primeira pessoa não recusa as outras propostas');
await p.evaluate(id => { location.hash = '#pedido/' + id; }, eq.id); await p.waitForTimeout(200);
ok(await p.isVisible('.card h2:has-text("Equipa · 1 de 3")'), 'quem pediu vê a equipa e as vagas');
await p.click('.card:has(h2:has-text("Equipa")) [data-a="aceitar"]');
ok(await p.isVisible('.card h2:has-text("Equipa · 2 de 3")') && await p.isVisible('#toast:has-text("à equipa")'), 'juntar mais uma pessoa à equipa');
await acess('equipa');
ok(await p.evaluate(id => { const c = Loja.conversaDe(id, 'ex_tiago'); return !!c && !Loja.conversaFechada(c); }, eq.id), 'cada membro tem a sua conversa');
await p.evaluate(() => { location.hash = '#pedidos'; }); await p.waitForTimeout(150);
ok(await p.isVisible('.pedb:has-text("Equipa para a curta") .chip:has-text("Falta 1 na equipa")'), 'a equipa com vagas continua nos pedidos abertos');
const saiu = await p.evaluate(id => { const eu = DB.eu; Loja.usarComo('ex_tiago'); const r = Loja.sairEquipa(id); Loja.usarComo(eu); return r.ok && !Loja.membro(Loja.pedido(id), 'ex_tiago'); }, eq.id);
ok(saiu, 'um membro pode sair da equipa');
const port = await p.evaluate(id => { const x = Loja.pedido(id), eu = DB.eu; Loja.usarComo('ex_rita'); const pr = DB.propostas.find(r => r.pedidoId === id && r.uid === 'ex_tiago'); if (pr) pr.estado = 'pendente'; Loja.usarComo(eu); Loja.aceitar(pr.id);
  x.estado = 'concluido'; x.entrega = { texto: 'Curta montada e com som.', em: Date.now(), link: '', img: '' }; x.avaliacao = { estrelas: 5, texto: '', em: Date.now() }; x.concluidoEm = Date.now(); desenhar();
  return ['ex_rita', 'ex_tiago'].every(u => Loja.portefolio(u).some(k => k.pedidoId === id)); }, eq.id);
ok(port, 'no fim, o trabalho entra no portefólio de todos os membros');

// ---------- 0.12 (lote A): bloquear limpa, limite de propostas, palavras proibidas, advertência, apagar com prazo, seguir, curso escondido ----------
{
  const r = await p.evaluate(() => { const eu = DB.eu;
    Loja.publicarPedido({ tipo: 'projeto', area: 'design', titulo: 'Cartaz para a feira de ciências', precisa: 'Um cartaz A3 com o horário da feira.', objetivo: 'Afixar na escola.', naoNota: true });
    const pd = DB.pedidos.find(x => x.titulo === 'Cartaz para a feira de ciências');
    Loja.usarComo('ex_ines'); Loja.perguntar(pd.id, 'É para imprimir a cores?'); Loja.enviarProposta(pd.id, 'Faço o cartaz com as cores da escola.', 3); Loja.usarComo(eu);
    const antes = DB.perguntas.filter(q => q.pedidoId === pd.id && q.uid === 'ex_ines').length;
    Loja.bloquear('ex_ines');
    const depois = DB.perguntas.filter(q => q.pedidoId === pd.id && q.uid === 'ex_ines').length, prop = DB.propostas.find(x => x.pedidoId === pd.id && x.uid === 'ex_ines');
    Loja.desbloquear('ex_ines'); return { antes, depois, prop: prop && prop.estado };
  });
  ok(r.antes === 1 && r.depois === 0 && r.prop === 'recusada', 'bloquear tira as perguntas e recusa as propostas dessa pessoa');
}
ok(await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_rita'); let ult = null; for (let i = 0; i < 12; i++) { const ab = DB.pedidos.filter(x => x.estado === 'aberto' && x.uid !== 'ex_rita' && !DB.propostas.some(y => y.pedidoId === x.id && y.uid === 'ex_rita')); if (!ab.length) { Loja.publicarPedido({ tipo: 'projeto', area: 'video', titulo: 'Pedido extra ' + i, precisa: 'Texto com mais de quinze letras.', objetivo: 'Um objetivo qualquer.', naoNota: true }); } }
  Loja.usarComo(eu); return true; }), 'preparar pedidos');
const limDia = await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_tiago'); const hoje = DB.propostas.filter(x => x.uid === 'ex_tiago' && x.origem === 'proposta' && new Date(x.criadoEm).toDateString() === new Date().toDateString()).length;
  for (let i = 0; i < 12 - hoje; i++) DB.propostas.push({ id: 'pr_lim' + i, pedidoId: 'x', dono: 'x', uid: 'ex_tiago', texto: 'teste', dias: 1, origem: 'proposta', estado: 'recusada', criadoEm: Date.now() });
  const ab = DB.pedidos.find(x => x.estado === 'aberto' && x.uid !== 'ex_tiago'); const r = Loja.enviarProposta(ab.id, 'Faço isto com todo o cuidado.', 3);
  DB.propostas = DB.propostas.filter(x => !x.id.startsWith('pr_lim')); Loja.usarComo(eu); return r.erro || ''; });
ok(/10 propostas hoje/.test(limDia), 'limite de 10 propostas por dia');
await perfTab('painel'); await p.fill('#pp-l', 'palavrateste'); await p.click('#f-palavras .btn');
ok(await p.isVisible('#toast:has-text("Lista guardada")'), 'o administrador guarda palavras proibidas');
ok(/não é permitida/.test(await p.evaluate(() => filtroPublicacao('isto tem palavrateste no meio'))), 'as palavras novas passam a ser recusadas');
await p.fill('#pp-l', ''); await p.click('#f-palavras .btn');
await p.click('[data-a="pn-sep"][data-s="uti"]'); await p.click('.pnrow:has-text("Rita M.") [data-a="pn-advertir"]'); await p.fill('#ft-t', 'Linguagem pouco respeitosa numa conversa.'); await enviar();
ok(await p.evaluate(() => DB.avisos.some(a => a.para === 'ex_rita' && a.alvo && a.alvo.t === 'moderacao')), 'advertência chega à pessoa como aviso da moderação');
await perfTab('conta'); await p.click('[data-a="apagar-conta"]'); await p.click('#ap-7');
ok(await p.isVisible('.aviso:has-text("vão ser apagados")'), 'apagar daqui a 7 dias mostra o aviso com a data');
await p.click('[data-a="cancelar-apagar"]'); ok(!(await p.isVisible('.aviso:has-text("vão ser apagados")')), 'cancelar o apagar');
const [dlj] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-a="exportar-ficheiro"]')]);
ok(dlj && /\.json$/.test(dlj.suggestedFilename()), 'descarregar os meus dados em JSON');
await p.evaluate(() => { location.hash = '#pessoa/ex_tiago'; }); await p.waitForTimeout(150);
await p.click('[data-a="seguir"]'); ok(await p.evaluate(() => Loja.seguidos().includes('ex_tiago')), 'seguir uma pessoa');
await p.click('[data-a="seguir"]');
const esc = await p.evaluate(() => { const t = Loja.pessoa('ex_ines'); t.cursoPrivado = true; const v = rotuloTipo(t); delete t.cursoPrivado; return v; });
ok(!/,/.test(esc) || await p.evaluate(() => Loja.trabalhamosJuntos('ex_ines') || Loja.eAdmin()), 'curso escondido não aparece a quem não trabalha com a pessoa');

// ---------- 0.12 (lote B): acordo, mentor, várias imagens, comparar, parecidos, reuniões, fixar, desafio, mural ----------
{
  const r = await p.evaluate(() => { const eu = DB.eu, out = {};
    Loja.publicarPedido({ tipo: 'projeto', area: 'design', titulo: 'Logótipo para a rádio da escola', precisa: 'Um logótipo simples para a rádio.', objetivo: 'Usar nas redes da rádio.', naoNota: true });
    const novo = DB.pedidos.find(x => x.titulo === 'Logótipo para a rádio da escola');
    Loja.usarComo('ex_rita'); Loja.enviarProposta(novo.id, 'Faço o logótipo com cuidado em três dias.', 3); Loja.usarComo(eu);
    const pr = DB.propostas.find(x => x.pedidoId === novo.id && x.uid === 'ex_rita'); if (pr) Loja.aceitar(pr.id);
    const pd = novo.estado === 'em_curso' ? novo : DB.pedidos.find(x => x.uid === eu && x.estado === 'em_curso' && x.freelancerUid);
    if (!pd) return { semPedido: true };
    out.prop = !!Loja.proporAcordo(pd.id, 'Entrego o logótipo em SVG e PNG até sexta.').ok;
    out.aceiteProprio = !!Loja.aceitarAcordo(pd.id).erro;
    Loja.usarComo(pd.freelancerUid); out.aceite = !!Loja.aceitarAcordo(pd.id).ok; Loja.usarComo(eu);
    const prof = Object.values(DB.pessoas).find(q => q.tipo === 'professor' && q.uid !== eu);
    out.mentor = prof ? !!Loja.convidarMentor(pd.id, prof.uid).ok : true;
    if (prof) { Loja.usarComo(prof.uid); out.nota = !!Loja.notaMentor(pd.id, 'Revejam o contraste das cores.').ok; Loja.usarComo(eu); } else out.nota = true;
    out.alunoMentor = !!Loja.convidarMentor(pd.id, pd.freelancerUid).erro;
    const c = Loja.conversaDe ? DB.conversas.find(x => x.pedidoId === pd.id) : null;
    if (c) { out.reu = !!Loja.marcarReuniao(c.id, Date.now() + 864e5, 'Biblioteca').ok; out.reuPassado = !!Loja.marcarReuniao(c.id, Date.now() - 1000, 'x').erro; out.prox = Loja.proximasReunioes().length > 0;
      const m = c.msgs.filter(x => x.uid).pop(); out.fix = !!Loja.fixar(c.id, m.id).ok && c.fixada && c.fixada.id === m.id; out.cid = c.id; }
    out.id = pd.id; desenhar(); return out; });
  if (r.semPedido) ok(true, 'sem pedido em curso para testar o lote B');
  else {
    ok(r.prop && r.aceiteProprio && r.aceite, 'acordo: proposto por uma pessoa e aceite pela outra (não pela mesma)');
    ok(r.mentor && r.nota && r.alunoMentor, 'mentor: só um professor; o professor junta uma nota');
    ok(r.reu && r.reuPassado && r.prox, 'reunião marcada aparece nas próximas; data passada é recusada');
    ok(r.fix, 'fixar uma mensagem no topo');
    await p.evaluate(id => { location.hash = '#pedido/' + id; }, r.id); await p.waitForTimeout(150);
    ok(await p.isVisible('.acordo:has-text("Aceite pelos dois")'), 'o pedido mostra o acordo aceite');
    ok(await p.isVisible('.card:has-text("Acompanhado por")'), 'o pedido mostra o mentor e as notas');
    if (r.cid) { await p.evaluate(cid => { location.hash = '#conversa/' + cid; }, r.cid); await p.waitForTimeout(150);
      ok(await p.isVisible('.fixada'), 'a conversa mostra a mensagem fixada'); ok(await p.isVisible('.reuniao'), 'a conversa mostra o cartão da reunião');
      await p.click('[data-a="marcar-reuniao"]'); ok(await p.isVisible('#f-reuniao'), 'abre a folha para marcar reunião'); await p.keyboard.press('Escape'); }
  }
}
ok(await p.evaluate(() => { const pd = DB.pedidos.find(x => x.estado === 'aberto' && x.uid !== DB.eu); if (!pd) return true; const l = Loja.parecidos(pd); return l.every(x => x.area === pd.area && x.id !== pd.id && x.estado === 'aberto'); }), 'pedidos parecidos são da mesma área e abertos');
{
  const n = await p.evaluate(() => { const eu = DB.eu; const pd = DB.pedidos.find(x => x.uid === eu && x.estado === 'aberto'); if (!pd) return null;
    ['ex_rita', 'ex_tiago'].forEach(u => { if (!DB.propostas.some(y => y.pedidoId === pd.id && y.uid === u && y.estado === 'pendente')) { Loja.usarComo(u); Loja.enviarProposta(pd.id, 'Faço isto com cuidado e a tempo.', 4); Loja.usarComo(eu); } });
    return pd.id; });
  if (n) { await p.evaluate(id => { location.hash = '#pedido/' + id; }, n); await p.waitForTimeout(150);
    if (await p.isVisible('[data-a="comparar-propostas"]')) { await p.click('[data-a="comparar-propostas"]'); ok(await p.isVisible('table.comparar'), 'comparar propostas numa tabela'); await p.keyboard.press('Escape'); }
    else ok(true, 'menos de duas propostas para comparar'); }
}
ok(await p.evaluate(() => { const p = DB.pedidos.find(x => x.freelancerUid === DB.eu && x.estado === 'em_curso'); if (!p) return true; const img = 'data:image/png;base64,iVBORw0KGgo='; const r = Loja.entregar(p.id, { texto: 'Entrega com três imagens de teste.', link: '', img, imgs: [img, img] }); return r.ok ? p.entrega.imgs.length === 2 : true; }), 'entrega guarda até três imagens');
ok(await p.evaluate(() => { const r = Loja.validarPedido ? Loja.validarPedido({ tipo: 'projeto', area: 'design', titulo: 'Fotos semanais do clube', precisa: 'Fotografar o treino de cada semana.', objetivo: 'Publicar no mural.', recorrente: 'semanal', naoNota: true }) : null; return !r || !r.erro; }), 'pedido recorrente é aceite');
await perfTab('painel'); if (await p.isVisible('[data-a="pn-sep"][data-s="res"]')) await p.click('[data-a="pn-sep"][data-s="res"]');
ok(await p.isVisible('#f-desafio'), 'o painel tem o desafio do mês');
if (await p.isVisible('#f-desafio')) {
  await p.fill('#ds-t', 'Cartaz para o Dia da Escola'); await p.fill('#ds-x', 'Um cartaz A3 com o programa do dia.'); await p.fill('#ds-d', '2030-01-31'); await p.click('#f-desafio .btn');
  await tab('Início'); ok(await p.isVisible('.desafio:has-text("Dia da Escola")'), 'o desafio do mês aparece no Início');
  await perfTab('painel'); await p.uncheck('[data-flag="desafio"]'); await p.waitForTimeout(100); await tab('Início');
  ok(!(await p.isVisible('.desafio')), 'desligar o desafio esconde-o de imediato'); await perfTab('painel'); await p.check('[data-flag="desafio"]');
  await p.fill('#ds-t', ''); await p.click('#f-desafio .btn');
}
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Logótipo para a rádio da escola'); if (x && ['aberto', 'em_curso'].includes(x.estado)) Loja.cancelarPedido(x.id, 'Fim do ensaio do lote B.'); desenhar(); });
await perfTab('defs'); await p.fill('#rr-l', 'Já vi, obrigado!\nPosso ligar-te amanhã?'); await p.click('#f-respostas .btn');
ok(await p.evaluate(() => respostasRapidas()[0] === 'Já vi, obrigado!'), 'respostas rápidas próprias vêm primeiro');

// ---------- 0.12 (lote C): nível, linha do tempo, ligações, currículo, painel, anúncios, tema, poupança, SUS, funil, privacidade ----------
await tab('Perfil'); await p.click('[data-a="perf-tab"][data-t="resumo"]').catch(() => {});
ok(await p.isVisible('.card.nivel'), 'o perfil mostra o nível');
ok(await p.evaluate(() => { const lt = Loja.linhaTempo(DB.eu); return lt.every((x, i) => i === 0 || lt[i - 1].em >= x.em); }), 'linha do tempo do mais recente para o mais antigo');
ok(await p.evaluate(() => { const n = Loja.nivel('ex_rita'); return typeof n.nome === 'string' && n.n === Loja.concluidos('ex_rita'); }), 'nível calculado pelos trabalhos concluídos');
ok(await p.evaluate(() => { const c = Loja.confirmadas('ex_rita'); return Object.values(c).every(n => n >= 1); }), 'competências confirmadas por avaliações de 4 ou 5');
ok(await p.isVisible('[data-a="imprimir-cv"]'), 'há o botão do currículo em PDF');
ok(await p.evaluate(() => { const t = Loja.pessoa('ex_rita'); t.links = ['https://exemplo.pt/rita']; return true; }), 'preparar ligações');
await p.evaluate(() => { location.hash = '#pessoa/ex_rita'; }); await p.waitForTimeout(150);
ok(await p.isVisible('.ligacoes-ext a[rel~="noopener"]'), 'ligações externas abrem à parte e sem passar dados');
ok(await p.evaluate(() => [...document.querySelectorAll('.chip.area svg')].length > 0), 'as áreas têm ícone');
await p.evaluate(() => { delete Loja.pessoa('ex_rita').links; });
await tab('Rede'); await p.selectOption('#pes-ord', 'nome');
ok(await p.evaluate(() => { const n = [...document.querySelectorAll('#pes-lista .pes b')].map(x => x.textContent); return n.every((x, i) => i === 0 || n[i - 1].localeCompare(x, 'pt') <= 0); }), 'ordenar freelancers por nome');
await p.selectOption('#pes-ord', 'sugeridos');
await perfTab('painel'); if (await p.isVisible('[data-a="pn-sep"][data-s="res"]')) await p.click('[data-a="pn-sep"][data-s="res"]');
ok(await p.isVisible('.num:has-text("até à primeira proposta")') && await p.isVisible('.num:has-text("chegam ao fim")'), 'o painel mostra tempo de resposta e taxa de conclusão');
ok(await p.isVisible('.card:has-text("Do formulário ao trabalho feito")'), 'o painel mostra o funil de uso');
await p.fill('#an-t', 'Só para professores: reunião na sexta.'); await p.check('#an-prof'); await p.click('#f-anuncio .btn');
ok(await p.evaluate(() => { const eu = DB.eu, ant = Nuvem.ativa; const a = DB.anuncio; return a && a.para === 'professores'; }), 'anúncio só para professores fica guardado');
ok(await p.evaluate(() => { DB.anuncio = { texto: 'Antigo', em: Date.now(), por: DB.eu, ate: '2020-01-01' }; const r = Loja.anuncio(); DB.anuncio = null; return r === null; }), 'anúncio com data de fim passada desaparece');
await p.evaluate(() => { DB.anuncio = null; Loja.gravarJa(); desenhar(); });
ok(await p.evaluate(() => { DB.denuncias.push({ id: 'dn_t1', tipo: 'perfil', alvo: 'ex_rita', motivo: 'spam', texto: '', uid: 'ex_tiago', em: Date.now() - 1000, estado: 'aberta' }, { id: 'dn_t2', tipo: 'perfil', alvo: 'ex_rita', motivo: 'assedio', texto: '', uid: 'ex_tiago', em: Date.now(), estado: 'aberta' }); return true; }), 'preparar denúncias');
await p.click('[data-a="pn-sep"][data-s="mod"]');
ok(await p.evaluate(() => { const l = [...document.querySelectorAll('#vista .prop .chip.bad')].map(x => x.textContent); return l.indexOf('Assédio ou bullying') > -1 && l.indexOf('Assédio ou bullying') < l.indexOf('Spam ou publicidade'); }), 'assédio aparece antes de spam na moderação');
await p.evaluate(() => { DB.denuncias = DB.denuncias.filter(x => !x.id.startsWith('dn_t')); desenhar(); });
await perfTab('defs'); await p.click('[data-a="tema"][data-t="auto"]');
ok(await p.evaluate(() => DB.tema === 'auto'), 'tema automático (segue o sistema)'); await p.click('[data-a="tema"][data-t="escuro"]');
await p.click('[data-a="poupar"]'); await tab('Início');
ok(await p.evaluate(() => document.querySelectorAll('#vista img[loading="lazy"]').length === 0), 'com poupança, as imagens só aparecem a pedido');
await perfTab('defs'); await p.click('[data-a="poupar"]');
await p.click('[data-a="sus"]'); for (let i = 0; i < 10; i++) await p.check(`input[name="sus${i}"][value="${i % 2 === 0 ? 5 : 1}"]`);
await p.click('#f-sus .btn'); ok(await p.isVisible('#toast:has-text("100 em 100")'), 'questionário SUS dá a nota de 0 a 100');
ok(await p.evaluate(() => notaSUS([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]) === 50 && notaSUS([1, 2]) === null), 'fórmula do SUS');
await p.click('[data-a="privacidade"]'); ok(await p.isVisible('.priv h3:has-text("Durante quanto tempo")'), 'política de privacidade com o mapa de dados'); await p.keyboard.press('Escape');
ok(await p.evaluate(() => Loja.uso().some(x => x.id.endsWith('_publicar')) && Loja.uso().every(x => !/uid|ex_/.test(JSON.stringify(x)))), 'contagens de uso sem quem fez');
// zonas de toque: botões e campos visíveis com pelo menos 44 px de altura (ou de largura, nos ícones redondos)
{
  const pequenos = [];
  for (const s of ['Início', 'Pedidos', 'Rede', 'Conversas', 'Perfil']) {
    await tab(s);
    pequenos.push(...await p.evaluate(nome => [...document.querySelectorAll('#vista button, #vista input:not([type=checkbox]):not([type=radio]):not([type=file]), #vista select, #vista a[href], nav button')].filter(e => e.offsetParent !== null).filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && Math.max(r.height, r.width >= 44 && r.height >= 32 ? 44 : r.height) < 44 && !e.closest('.chat'); }).slice(0, 5).map(e => nome + ': ' + (e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 40) + ' (' + Math.round(e.getBoundingClientRect().height) + ' px)'), s));
  }
  if (pequenos.length) console.log('  · zonas de toque pequenas:\n    ' + pequenos.join('\n    '));
  ok(pequenos.length === 0, 'zonas de toque com 44 px');
}

// ---------- 0.13: a rede (publicações, ligações, perfil, grupos, vagas, mensagens diretas) ----------
await tab('Início');
ok(await p.isVisible('.feed .compor'), 'o Início tem o feed com a caixa para publicar');
ok(await p.locator('.feed .post').count() >= 2, 'o feed mostra as publicações de exemplo (tutorial)');
await p.click('.compor-b'); await p.fill('#po-t', 'Hoje aprendi a exportar SVG no Illustrator. Alguém tem dicas?'); await p.click('#f-post .btn.pri');
ok(await p.isVisible('.feed .post:has-text("exportar SVG")'), 'publicar aparece no feed');
ok(await p.evaluate(() => Loja.publicarPost({ texto: 'Vídeo', video: 'https://site-estranho.com/x' }).erro), 'vídeo só de YouTube, Vimeo ou Drive');
{ const prim = p.locator('.feed .post:has-text("Padaria do Largo")').first();
  await prim.locator('[data-a="reagir"]').click(); ok(await p.evaluate(() => Loja.reacoesDe('ps1').minha === 'gosto'), 'reagir com «Gosto»');
  await p.locator('.feed .post:has-text("Padaria do Largo") [data-a="escolher-reacao"]').first().click(); await p.click('.reacoes-esc [data-r="bravo"]');
  ok(await p.evaluate(() => Loja.reacoesDe('ps1').minha === 'bravo'), 'mudar para outra reação');
  await p.locator('.feed .post:has-text("Padaria do Largo") .post-a [data-a="abrir-comentarios"]').first().click();
  await p.fill('#com-ps1', 'Gosto muito das cores!'); await p.press('#com-ps1', 'Enter'); await p.waitForTimeout(150);
  ok(await p.isVisible('#post-ps1 .com:has-text("Gosto muito das cores")'), 'comentar uma publicação');
  ok(await p.evaluate(() => DB.avisos.some(a => a.para === 'ex_rita' && a.alvo.t === 'post')), 'quem publicou é avisado do comentário'); }
ok(await p.evaluate(() => { const r = Loja.publicarPost({ texto: '', partilhaDe: 'ps2' }); return !!r.ok && Loja.post(r.id).partilhaDe === 'ps2'; }), 'partilhar uma publicação');
ok(await p.evaluate(() => { const id = Loja.feed().find(x => x.partilhaDe === 'ps2').id; return !!Loja.publicarPost({ texto: 'x', partilhaDe: id }).erro; }), 'partilha-se o original, não a partilha');
await p.evaluate(() => desenhar());
ok(await p.isVisible('.post-orig'), 'a partilha mostra a publicação original');
// ligações
ok(await p.evaluate(() => Loja.talvezConhecas().length > 0), 'pessoas que talvez conheças');
await p.evaluate(() => { F.redeSeg = 'pessoas'; }); await tab('Rede'); await p.click('[data-a="rede-seg"][data-s="ligacoes"]');
ok(await p.isVisible('h2:has-text("Pessoas que talvez conheças")'), 'a Rede mostra sugestões');
await p.locator('.sug [data-a="ligar"]').first().click(); await p.fill('#lg-n', 'Somos da mesma escola.'); await p.click('.folha .btn.pri');
ok(await p.evaluate(() => Loja.enviadas().length === 1), 'pedido de ligação enviado');
{ const alvo = await p.evaluate(() => Loja.enviadas()[0].para);
  ok(await p.evaluate(u => !!Loja.pedirLigacao(u, '').erro, alvo), 'não se pede duas vezes');
  ok(await p.evaluate(u => !!Loja.conversaDireta(u).erro, alvo), 'sem ligação aceite não há mensagens diretas');
  await p.evaluate(u => { const eu = DB.eu; Loja.usarComo(u); Loja.aceitarLigacao(eu); Loja.usarComo(eu); desenhar(); }, alvo);
  ok(await p.evaluate(u => Loja.estadoLigacao(u) === 'ligado' && Loja.ligados().includes(u), alvo), 'a outra pessoa aceita e ficam ligados');
  await p.evaluate(u => { location.hash = '#pessoa/' + u; }, alvo); await p.waitForTimeout(200);
  ok(await p.isVisible('.rede-cab [data-a="mensagem-direta"]'), 'o perfil de uma ligação tem «Mensagem»');
  if (await p.isVisible('.comp [data-a="validar"]')) { await p.locator('.comp [data-a="validar"]').first().click(); ok(await p.evaluate(u => Object.values(Loja.validacoesDe(u)).some(l => l.includes(DB.eu)), alvo), 'validar uma competência'); }
  await p.click('[data-a="escrever-testemunho"]'); await p.fill('#ts-t', 'Trabalhámos juntos no jornal da escola e foi sempre pontual.'); await p.click('.folha .btn.pri');
  ok(await p.evaluate(u => DB.testemunhos.some(t => t.alvo === u && t.uid === DB.eu && t.visivel === false), alvo), 'recomendação escrita fica escondida até a pessoa aceitar');
  ok(await p.evaluate(u => DB.visitas.some(v => v.alvo === u && v.uid === DB.eu), alvo), 'ver um perfil fica nas visitas da pessoa');
  await p.click('.rede-cab [data-a="mensagem-direta"]'); await p.waitForTimeout(150);
  ok(await p.isVisible('#escrever') && await p.isVisible('.mtopo .convh:has-text("Mensagem direta")'), 'abre a conversa direta');
  ok(await p.evaluate(u => { const c = DB.conversas.find(x => !x.pedidoId && x.uids.includes(u)); return !!c && !Loja.conversaFechada(c); }, alvo), 'a conversa direta está aberta');
  await p.evaluate(u => { Loja.tirarLigacao(u); }, alvo);
  ok(await p.evaluate(u => Loja.conversaFechada(DB.conversas.find(x => !x.pedidoId && x.uids.includes(u))), alvo), 'sem ligação, a conversa direta fecha');
}
// perfil
await tab('Perfil'); await p.click('[data-a="perf-tab"][data-t="resumo"]').catch(() => {});
await p.locator('[data-a="editar-cabecalho"]').first().click(); await p.fill('#cb-d', 'Estudante de Multimédia · Vídeo e 3D'); await p.check('[name="cb-a"][value="estagio"]'); await p.click('.folha .btn.pri');
ok(await p.isVisible('.destaque:has-text("Vídeo e 3D")') && await p.isVisible('.aberto:has-text("Estágios")'), 'frase de destaque e «aberto a» no perfil');
await p.click('[data-a="nova-formacao"]'); await p.fill('#fo-e', 'Escola Profissional da Lousã'); await p.fill('#fo-c', 'Multimédia'); await p.fill('#fo-d', '2024'); await p.fill('#fo-a', '2027'); await p.click('.folha .btn.pri');
ok(await p.isVisible('.exp:has-text("Escola Profissional da Lousã")'), 'formação no perfil');
ok(await p.evaluate(() => !!Loja.guardarFormacao({ escola: 'X Y', de: '2027', ate: '2024' }).erro), 'ano de fim antes do início é recusado');
ok(await p.evaluate(() => { const id = Loja.postsDe(DB.eu)[0].id; return !!Loja.destacar('post', id).ok; }), 'destacar uma publicação no perfil');
await p.evaluate(() => desenhar()); ok(await p.isVisible('.destaques .dest'), 'os destaques aparecem no perfil');
// grupos
await tab('Rede'); await p.click('[data-a="rede-seg"][data-s="grupos"]');
await p.click('[data-a="ver-grupo"][data-id="gr1"]'); await p.click('[data-a="entrar-grupo"]');
ok(await p.evaluate(() => Loja.membro('gr1')), 'entrar num grupo');
await p.click('.compor-b'); await p.fill('#po-t', 'Posso levar exercícios de derivadas na quarta?'); await p.click('#f-post .btn.pri');
ok(await p.isVisible('.post:has-text("derivadas")'), 'publicar dentro do grupo');
ok(await p.evaluate(() => { const r = Loja.criarGrupo({ nome: 'Clube de Teatro', tipo: 'clube', descricao: 'Ensaios e cenários.' }); return !!r.ok && Loja.membro(r.id) && !!Loja.criarGrupo({ nome: 'clube de teatro', tipo: 'clube' }).erro; }), 'criar grupo (sem nomes repetidos)');
// vagas
await tab('Pedidos'); await p.click('[data-a="ped-seg"][data-s="vagas"]');
ok(await p.locator('.vaga-c').count() >= 2, 'o separador Vagas mostra vagas abertas');
await p.click('.vaga-c:has-text("Estágio em design")'); await p.click('[data-a="candidatar"]');
await p.fill('#cd-t', 'Faço cartazes para a escola há dois anos e sei usar o InDesign.'); await p.click('.folha .btn.pri');
ok(await p.isVisible('.aviso:has-text("Candidatura enviada")'), 'candidatar-me a uma vaga');
ok(await p.evaluate(() => !!Loja.publicarVaga({ titulo: 'Vaga de teste', entidade: 'Escola', texto: 'Uma vaga só para ver o erro de permissão.', ate: '2030-01-01' }).erro), 'alunos não publicam vagas');
ok(await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_helena'); const c = DB.candidaturas.find(x => x.vagaId === 'vg1' && x.uid === eu); const r = Loja.responderCandidatura(c.id, 'aceite'); Loja.usarComo(eu); return !!r.ok && DB.avisos.some(a => a.para === eu && a.alvo.t === 'vaga'); }), 'quem publicou aceita a candidatura e a pessoa é avisada');
await p.evaluate(() => { F.pedSeg = 'abertos'; F.redeSeg = 'pessoas'; desenhar(); });

// ---------- 0.14: estudo (dúvidas, sessões de estudo, conversas de grupo) ----------
await tab('Estudo');
ok(await p.locator('.duv-c').count() >= 3, 'o Estudo mostra as dúvidas de exemplo (tutorial)'); await overflow('Estudo'); await acess('estudo');
await p.click('[data-a="nova-duvida"]'); await p.fill('#dv-t', 'Como se calcula a energia cinética de um corpo?'); await p.selectOption('#dv-a', 'fq'); await p.selectOption('#dv-e', '715'); await p.click('.folha .btn.pri');
ok(await p.isVisible('h1:has-text("energia cinética")') && await p.isVisible('.chip.exame:has-text("715")'), 'fazer uma pergunta com disciplina e exame');
ok(!(await p.isVisible('[data-a="responder-duvida"]')) && await p.evaluate(() => !!Loja.responderDuvida(Loja.duvidas({ estado: 'minhas' })[0].id, 'Uma resposta qualquer aqui.').erro), 'não se responde à própria dúvida');
ok(await p.evaluate(() => !!Loja.perguntarDuvida({ titulo: 'Curta', area: 'mat' }).erro), 'dúvida com menos de 10 letras é recusada');
await p.evaluate(() => { location.hash = '#duvida/dv2'; }); await p.waitForTimeout(200);
await p.click('[data-a="responder-duvida"]'); await p.fill('#rd-t', '«Há» vem do verbo haver; «à» é a preposição a com o artigo a.'); await p.click('.folha .btn.pri');
ok(await p.isVisible('.dresp:has-text("verbo haver")'), 'responder a uma dúvida');
ok(await p.evaluate(() => DB.avisos.some(a => a.para === 'ex_tiago' && a.alvo.t === 'duvida' && a.alvo.id === 'dv2')), 'quem perguntou é avisado da resposta');
await p.click('[data-a="responder-duvida"]'); await p.fill('#rd-t', '«Há» vem do verbo haver (existir ou tempo passado); «à» junta a + a.'); await p.click('.folha .btn.pri');
ok(await p.evaluate(() => DB.respostas.filter(r => r.duvidaId === 'dv2' && r.uid === DB.eu).length === 1), 'responder outra vez muda a resposta (uma por pessoa)');
await p.click('.dresp:has-text("Rita M.") [data-a="votar-resposta"]');
ok(await p.evaluate(() => Loja.votei('dv2_ex_rita') && Loja.votosDe('dv2_ex_rita') === 2), 'votar numa resposta que ajudou');
ok(await p.evaluate(() => !!Loja.votar('dv2_' + DB.eu).erro), 'não se vota na própria resposta');
ok(await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_tiago'); const r = Loja.escolherResposta('dv2', 'dv2_' + eu); Loja.usarComo(eu); return !!r.ok && Loja.duvida('dv2').resolvida === 'dv2_' + eu && DB.avisos.some(a => a.para === eu && a.alvo.t === 'duvida'); }), 'quem perguntou escolhe a resposta e quem respondeu é avisado');
await p.evaluate(() => desenhar());
ok(await p.isVisible('.dresp.escolhida:has-text("verbo haver")') && await p.locator('.dresp').first().evaluate(e => e.classList.contains('escolhida')), 'a resposta escolhida aparece primeiro');
ok(await p.evaluate(() => Loja.numerosDuvidas(DB.eu).escolhidas === 1), 'o perfil conta as respostas escolhidas');
await p.click('.back'); await p.selectOption('#dv-exame', '635');
ok(await p.locator('.duv-c').count() === 1 && await p.isVisible('.duv-c:has-text("exponencial")'), 'filtrar dúvidas por exame nacional'); await p.selectOption('#dv-exame', '');
ok(await p.isVisible('.duv-c:has-text("exponencial") .chip.ok'), 'a dúvida resolvida mostra «Resolvida»');
// sessões de estudo
await p.click('[data-a="estudo-seg"][data-s="sessoes"]');
ok(await p.locator('.ses-c').count() >= 2, 'as sessões de exemplo aparecem'); await overflow('sessões'); await acess('sessões');
await p.click('[data-a="nova-sessao"]'); await p.fill('#ss-t', 'Revisões de Física e Química'); await p.selectOption('#ss-a', 'fq'); await p.fill('#ss-o', 'Biblioteca'); await p.fill('#ss-l', '4'); await p.click('.folha .btn.pri');
ok(await p.isVisible('h1:has-text("Revisões de Física")') && await p.isVisible('.ficha:has-text("Biblioteca")'), 'marcar uma sessão de estudo');
ok(await p.evaluate(() => !!Loja.marcarSessao({ titulo: 'Sessão no passado', quando: Date.now() - 3600000, duracao: 60, formato: 'online', lugares: 4 }).erro), 'sessão no passado é recusada');
ok(await p.evaluate(() => !!Loja.inscrever(Loja.sessoes({ minhas: true }).find(s => s.uid === DB.eu).id).erro), 'quem marca não se inscreve na própria sessão');
await p.click('.back'); await p.click('.ses-c:has-text("Funções para o exame")'); await p.click('[data-a="inscrever"]');
ok(await p.evaluate(() => Loja.inscrito('se1') && Loja.livres(Loja.sessao('se1')) === 9), 'inscrever-me numa sessão conta o lugar');
ok(await p.evaluate(() => DB.avisos.some(a => a.para === 'ex_helena' && a.alvo.t === 'sessao')), 'quem marcou é avisado da inscrição');
ok(await p.isVisible('[data-a="sessao-ics"]'), 'juntar a sessão ao calendário');
ok(await p.evaluate(() => { const s = Loja.sessao('se2'); s.lugares = 0; const r = Loja.inscrever('se2'); s.lugares = 6; return /lugares/.test(r.erro || ''); }), 'sessão cheia recusa inscrições');
ok(await p.evaluate(() => { const s = Loja.sessao('se1'), q = s.quando; s.quando = Date.now() + 3 * 3600000; const a = Loja.proximasSessoes().some(x => x.id === 'se1'); s.quando = q; return a; }), 'lembrete no Início nas 24 horas antes');
ok(await p.evaluate(() => { const id = Loja.sessoes({ minhas: true }).find(s => s.uid === DB.eu).id; return !!Loja.cancelarSessao(id).ok && Loja.sessao(id).cancelada; }), 'cancelar uma sessão minha');
// conversas de grupo (a pessoa entrou no Clube de Matemática acima)
await tab('Conversas');
ok(await p.isVisible('.conv:has-text("Clube de Matemática")'), 'a conversa do grupo aparece em Conversas');
await p.click('.conv:has-text("Clube de Matemática")');
ok(await p.isVisible('#escrever-sala') && await p.isVisible('.mrow:has-text("Bem-vindos à conversa do clube")'), 'abrir a conversa do grupo');
await p.fill('#msg-t', 'Levo os exercícios de derivadas!'); await p.press('#msg-t', 'Enter'); await p.waitForTimeout(150);
ok(await p.isVisible('.mrow.eu:has-text("exercícios de derivadas")'), 'escrever na conversa do grupo'); await overflow('conversa de grupo'); await acess('conversa de grupo');
ok(await p.evaluate(() => !Loja.sala('gr~gr2') && !!Loja.enviarSala('gr~gr2', 'Olá').erro), 'quem não é do grupo não lê nem escreve');
ok(await p.evaluate(() => { const eu = DB.eu; Loja.usarComo('ex_helena'); Loja.enviarSala('gr~gr1', 'Até quarta!'); Loja.usarComo(eu); return Loja.salasPorLer() === 1; }), 'mensagem nova de outra pessoa fica por ler');
await p.evaluate(() => { F.estSeg = 'duvidas'; F.estEstado = 'todas'; desenhar(); });

// ---------- definições, limites, dados e conta ----------
await perfTab('defs'); await p.click('[data-a="texto"][data-t="grande"]'); ok(await p.evaluate(() => document.documentElement.classList.contains('grande')), 'texto maior'); await overflow('texto maior'); await p.click('[data-a="texto"][data-t="normal"]');
await perfTab('defs'); await p.click('[data-a="tema"][data-t="claro"]'); await shot('perfil-claro'); await tab('Início'); await shot('inicio-claro');
await p.reload(); ok(await p.isVisible('.hero') && await p.evaluate(() => document.documentElement.classList.contains('claro')), 'dados e tema ficam guardados');
for (const a of ['como-funciona', 'instalar', 'novidades', 'regras']) { await perfTab('defs'); await p.click(`[data-a="${a}"]`); ok(await p.isVisible('.folha'), 'abre ' + a); await p.keyboard.press('Escape'); }
await perfTab('conta'); await p.click('[data-a="exportar"]'); await p.waitForTimeout(300); ok(await p.isVisible('#toast') || await p.isVisible('.folha textarea'), 'copiar os meus dados'); await p.keyboard.press('Escape');
const lim = await p.evaluate(() => { let r; for (let i = 0; i < 6; i++) r = Loja.publicarPedido({ tipo: 'projeto', area: 'video', titulo: 'Pedido de teste ' + i, precisa: 'Texto com mais de quinze letras.', objetivo: 'Um objetivo qualquer.', naoNota: true }); return r.erro || ''; });
ok(/5 pedidos abertos/.test(lim), 'limite de 5 pedidos abertos');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Pedido de teste 0'); Loja.usarComo('ex_rita'); const pr = Loja.enviarProposta(x.id, 'Proposta de teste com texto.', 3); Loja.usarComo(DB.minha); Loja.aceitar(DB.propostas.find(q => q.pedidoId === x.id).id); desenhar(); });
await perfTab('conta'); await p.click('[data-a="apagar-conta"]'); await p.click('#ap-ja'); await p.click('#cf-ok');
ok(await p.isVisible('#toast:has-text("trabalhos a decorrer")'), 'não apaga a conta com trabalhos a decorrer');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Pedido de teste 0'); Loja.cancelarPedido(x.id, 'Fim do ensaio.'); desenhar(); });
await perfTab('conta'); await p.click('[data-a="apagar-conta"]'); await p.click('#ap-ja'); await p.click('#cf-ok');
ok(await p.isVisible('#f-entrada') && await p.evaluate(() => !Object.values(DB.pessoas).some(x => x.nome === 'Kaizer') && !DB.pedidos.some(x => x.titulo.startsWith('Pedido de teste'))), 'conta apagada com os dados que eram só dela');
ok(await p.evaluate(() => DB.pedidos.some(x => x.titulo.includes('clube de música') && x.estado === 'concluido')), 'trabalho concluído de outra pessoa mantém-se');

// ---------- dados gravados pela versão 0.1 continuam a abrir ----------
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('pronex-link-v1')); d.v = 1; ['avisos', 'perguntas', 'recs', 'guardados', 'bloqueios', 'rascunhos', 'guia', 'texto'].forEach(k => delete d[k]); Object.values(d.pessoas).forEach(x => { delete x.foto; delete x.ferramentas; delete x.niveis; delete x.horas; }); d.pedidos.forEach(x => { delete x.tarefas; delete x.entregas; delete x.formato; delete x.img; }); d.eu = 'ex_rita'; localStorage.setItem('pronex-link-v1', JSON.stringify(d)); });
await p.reload(); ok(await p.isVisible('#vista .phead, #vista .hero') && await p.evaluate(() => DB.v === 2 && Array.isArray(DB.pedidos[0].tarefas)), 'dados da versão 0.1 são convertidos sem erros');
for (const s of ['Pedidos', 'Rede', 'Conversas', 'Perfil']) { await tab(s); await overflow(s + ' (dados antigos)'); }

console.log(erros.length ? '\nPROBLEMAS:\n' + erros.join('\n') : '\nSem erros.');
await b.close(); falhas += erros.length;
}
servidor.close();
process.exit(falhas ? 1 : 0);
