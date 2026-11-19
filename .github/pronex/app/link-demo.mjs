// Pronex_Link · ensaio do modo de demonstração (sem servidor), no Chrome, em tamanho de telemóvel e de computador.
// Percorre a app como várias pessoas e confirma cada regra (cerca de 85 verificações).
// Correr em .github/pronex/app:  npm ci && node link-demo.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, '../../../pronex_link');
const IMG = path.join(APP, 'icons');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html';
  if (p === '/config.js') { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end('/* ensaio sem servidor */'); return; }
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});
await new Promise(r => servidor.listen(8797, '127.0.0.1', r));
const ENDERECO = 'http://127.0.0.1:8797/';
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
p.on('requestfailed', r => erros.push('falhou: ' + r.url()));
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

await p.goto(ENDERECO);
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
ok(await p.isVisible('summary:has-text("Entregas anteriores (1)")'), 'histórico de entregas'); await shot('entregue');
ok(!(await p.isVisible('[data-a="fechar-sozinho"]')), 'não dá para fechar sozinho antes dos 7 dias');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); x.entrega.em -= 8 * 86400000; desenhar(); });
ok(await p.isVisible('[data-a="fechar-sozinho"]'), 'ao fim de 7 dias sem resposta, quem fez pode fechar');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo.includes('clube de música')); x.entrega.em += 8 * 86400000; desenhar(); });
await usarComo('Kaizer'); await p.click(`.pedb:has-text("${T}")`);
await p.click('[data-a="concluir"]'); await enviar(); ok(/estrelas/.test(await erroFolha()), 'avaliação exige estrelas');
await p.click('.folha [data-n="4"]'); await p.fill('#cc-t', 'Bom trabalho e boa comunicação.'); await enviar();
ok(await p.isVisible('.passos li.feito:has-text("Concluído")'), 'pedido concluído');
await p.click('[data-a="comprovativo"]'); ok(await p.isVisible('.comprov:has-text("Tiago S.")'), 'comprovativo do trabalho'); await shot('comprovativo'); await p.keyboard.press('Escape');
await usarComo('Tiago S.');
ok(await p.isVisible('.passo:has-text("Falta avaliares quem pediu")'), 'Início lembra de avaliar quem pediu');
await p.click(`.pedb:has-text("${T}")`); await p.click('[data-a="avaliar-dono"]'); await p.click('.folha [data-n="5"]'); await enviar();
ok(await p.isVisible('.card:has-text("Avaliação de quem pediu")'), 'quem fez avalia quem pediu');
await tab('Perfil'); ok(await p.isVisible('.peca:has-text("clube de música")') && await p.isVisible('.selos:has-text("Primeiro trabalho")'), 'trabalho no portefólio e selo no perfil'); await overflow('perfil'); await shot('perfil-tiago');

// ---------- professor: recomendação ----------
await usarComo('Prof. Helena C.');
await tab('Freelancers'); await overflow('freelancers'); await p.click('.pesb:has-text("Rita M.")');
await p.click('[data-a="recomendar"]'); await p.fill('#ft-t', 'curta'); await enviar(); ok(/frase/.test(await erroFolha()), 'recomendação exige texto');
await p.fill('#ft-t', 'A Rita é muito cuidadosa e cumpre sempre os prazos que combina.'); await enviar();
ok(await p.isVisible('.card:has-text("Recomendações de professores") >> text=cuidadosa') && await p.isVisible('.selos:has-text("Recomendado")'), 'recomendação e selo aparecem no perfil'); await shot('perfil-rita');
await usarComo('Kaizer'); await tab('Freelancers'); await p.click('.pesb:has-text("Rita M.")');
ok(!(await p.isVisible('[data-a="recomendar"]')), 'alunos não podem recomendar');

// ---------- guardar pessoas, bloquear, denunciar, moderação ----------
await p.click('.guard.solto'); await p.click('[data-a="voltar"]'); await p.check('#pes-guard');
ok(await p.locator('#pes-lista .pes').count() === 1, 'filtro de pessoas guardadas'); await p.uncheck('#pes-guard');
await p.click('.pesb:has-text("Inês F.")'); await p.click('[data-a="bloquear"]'); await p.click('#cf-ok');
ok(!(await p.isVisible('.pesb:has-text("Inês F.")')), 'pessoa bloqueada sai da lista');
await tab('Pedidos'); ok(!(await p.isVisible('.pedb:has-text("Dúvidas em funções")')), 'pedidos de quem bloqueei deixam de aparecer');
await tab('Perfil'); await p.click('.card:has-text("Pessoas bloqueadas") [data-a="desbloquear"]');
await tab('Pedidos'); ok(await p.isVisible('.pedb:has-text("Dúvidas em funções")'), 'desbloquear repõe os pedidos');
await abrirPedido('Dúvidas em funções'); await p.click('[data-a="denunciar"]'); await enviar(); ok(/motivo/.test(await erroFolha()), 'denúncia exige motivo');
await p.click('.folha [role=radio] >> nth=0'); await enviar();
await p.click('[data-a="denunciar"]'); await p.click('.folha [role=radio] >> nth=0'); await enviar(); ok(/Já denunciaste/.test(await erroFolha()), 'não dá para denunciar duas vezes o mesmo'); await p.keyboard.press('Escape');
await tab('Perfil'); await p.click('[data-a="moderacao"]'); await shot('moderacao');
await p.click('.folha [data-mod="ocultar"]'); await p.keyboard.press('Escape');
await tab('Pedidos'); ok(!(await p.isVisible('.pedb:has-text("Dúvidas em funções")')), 'pedido ocultado pela moderação sai da lista');

// ---------- perfil ----------
await tab('Perfil'); await p.click('[data-a="editar-perfil"]');
await p.setInputFiles('#ep-foto', path.join(IMG, 'icon-192.png'));
await p.fill('#ep-bio', 'Modelação 3D em Blender e edição de vídeo.'); await p.check('#ep-disp'); await enviar();
ok(/área/.test(await erroFolha()), 'disponível exige pelo menos uma área');
await p.click('.folha [data-area="3d"]'); await p.selectOption('.folha [data-niv="3d"]', '2'); await p.fill('#ep-ferr', 'Blender, Premiere, Blender'); await p.fill('#ep-of', 'Cenas 3D simples para sites.'); await shot('editar-perfil'); await enviar();
ok(await p.isVisible('.perfiltopo .chip.ok') && await p.isVisible('.areasniv:has-text("Com prática")') && await p.locator('.card .chip:has-text("Blender")').count() === 1, 'perfil com área, nível e programas sem repetidos');
ok(await p.evaluate(() => /^url\("data:image\/jpeg/.test(getComputedStyle(document.querySelector('.perfiltopo .av')).backgroundImage)), 'fotografia de perfil');
await p.click('[data-a="editar-exp"][data-id=""]'); await p.fill('#ex-t', 'Luzes de palco'); await enviar();
await p.click('.exp [aria-label^="Editar a experiência"]'); await p.fill('#ex-t', 'Luzes de palco num espetáculo da escola'); await enviar();
ok(await p.isVisible('.exp:has-text("num espetáculo da escola")'), 'experiência editada');
await p.click('.h2 [data-a="editar-peca"]'); await p.fill('#pc-t', 'Cena 3D de um quarto'); await p.setInputFiles('#pc-i', path.join(IMG, 'icon-512.png')); await p.waitForTimeout(300); await enviar();
await p.click('.peca:has-text("Cena 3D")'); await p.click('.folha [data-a="editar-peca"]'); ok(await p.isVisible('#pc-i-pre'), 'editar peça mantém a imagem'); await p.fill('#pc-t', 'Cena 3D de um quarto de estudante'); await enviar();
ok(await p.isVisible('.peca:has-text("quarto de estudante")'), 'peça editada');
const barra = await p.evaluate(() => Loja.completo(DB.eu)); ok(barra.pct === 100, 'perfil 100% completo' + (barra.pct < 100 ? ' (falta: ' + barra.falta.join(', ') + ')' : '')); await overflow('o meu perfil'); await shot('perfil-meu');
ok(await p.isVisible('.nums:has-text("5,0")'), 'nota de quando pede aparece no perfil');

// ---------- definições, limites, dados e conta ----------
await p.click('[data-a="texto"][data-t="grande"]'); ok(await p.evaluate(() => document.documentElement.classList.contains('grande')), 'texto maior'); await overflow('texto maior'); await p.click('[data-a="texto"][data-t="normal"]');
await p.click('[data-a="tema"][data-t="claro"]'); await shot('perfil-claro'); await tab('Início'); await shot('inicio-claro');
await p.reload(); ok(await p.isVisible('.hero') && await p.evaluate(() => document.documentElement.classList.contains('claro')), 'dados e tema ficam guardados');
for (const a of ['como-funciona', 'instalar', 'novidades', 'regras']) { await tab('Perfil'); await p.click(`[data-a="${a}"]`); ok(await p.isVisible('.folha'), 'abre ' + a); await p.keyboard.press('Escape'); }
await p.click('[data-a="exportar"]'); await p.waitForTimeout(300); ok(await p.isVisible('#toast') || await p.isVisible('.folha textarea'), 'copiar os meus dados'); await p.keyboard.press('Escape');
const lim = await p.evaluate(() => { let r; for (let i = 0; i < 6; i++) r = Loja.publicarPedido({ tipo: 'projeto', area: 'video', titulo: 'Pedido de teste ' + i, precisa: 'Texto com mais de quinze letras.', objetivo: 'Um objetivo qualquer.', naoNota: true }); return r.erro || ''; });
ok(/5 pedidos abertos/.test(lim), 'limite de 5 pedidos abertos');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Pedido de teste 0'); Loja.usarComo('ex_rita'); const pr = Loja.enviarProposta(x.id, 'Proposta de teste com texto.', 3); Loja.usarComo(DB.minha); Loja.aceitar(DB.propostas.find(q => q.pedidoId === x.id).id); desenhar(); });
await tab('Perfil'); await p.click('[data-a="apagar-conta"]'); await p.click('#cf-ok');
ok(await p.isVisible('#toast:has-text("trabalhos a decorrer")'), 'não apaga a conta com trabalhos a decorrer');
await p.evaluate(() => { const x = DB.pedidos.find(q => q.titulo === 'Pedido de teste 0'); Loja.cancelarPedido(x.id, 'Fim do ensaio.'); desenhar(); });
await p.click('[data-a="apagar-conta"]'); await p.click('#cf-ok');
ok(await p.isVisible('#f-entrada') && await p.evaluate(() => !Object.values(DB.pessoas).some(x => x.nome === 'Kaizer') && !DB.pedidos.some(x => x.titulo.startsWith('Pedido de teste'))), 'conta apagada com os dados que eram só dela');
ok(await p.evaluate(() => DB.pedidos.some(x => x.titulo.includes('clube de música') && x.estado === 'concluido')), 'trabalho concluído de outra pessoa mantém-se');

// ---------- dados gravados pela versão 0.1 continuam a abrir ----------
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('pronex-link-v1')); d.v = 1; ['avisos', 'perguntas', 'recs', 'guardados', 'bloqueios', 'rascunhos', 'guia', 'texto'].forEach(k => delete d[k]); Object.values(d.pessoas).forEach(x => { delete x.foto; delete x.ferramentas; delete x.niveis; delete x.horas; }); d.pedidos.forEach(x => { delete x.tarefas; delete x.entregas; delete x.formato; delete x.img; }); d.eu = 'ex_rita'; localStorage.setItem('pronex-link-v1', JSON.stringify(d)); });
await p.reload(); ok(await p.isVisible('#vista .perfiltopo, #vista .hero') && await p.evaluate(() => DB.v === 2 && Array.isArray(DB.pedidos[0].tarefas)), 'dados da versão 0.1 são convertidos sem erros');
for (const s of ['Pedidos', 'Freelancers', 'Conversas', 'Perfil']) { await tab(s); await overflow(s + ' (dados antigos)'); }

console.log(erros.length ? '\nPROBLEMAS:\n' + erros.join('\n') : '\nSem erros.');
await b.close(); falhas += erros.length;
}
servidor.close();
process.exit(falhas ? 1 : 0);
