// PRONEX · testes do site (corre no GitHub Actions e no PC).
// Uso: node .github/site/testes.js http://localhost:8000
// 1) Abre as 22 páginas em 3 larguras e 2 temas e falha se houver erros de
//    JavaScript, ficheiros em falta, página mais larga que o ecrã ou violação
//    das regras de segurança (CSP).
// 2) Confirma os preços do calculador de orçamento.
// 3) Corre o axe (acessibilidade) em todas as páginas.
// 4) Segurança e dados (pontos 4, 5, 21, 25 e 84): cada página tem a regra CSP e a política de
//    referência, não há endereços antigos (pronex.pt), os formulários funcionam sem JavaScript
//    (_next) e nenhuma imagem leva metadados escondidos (EXIF/GPS).
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8000';
const pages = ['index.html', 'servicos.html', 'portfolio.html', 'orcamento.html', 'sobre.html', 'contacto.html', 'guias.html', 'privacidade.html', '404.html', 'obrigado.html',
  'en/index.html', 'en/services.html', 'en/portfolio.html', 'en/quote.html', 'en/about.html', 'en/contact.html', 'en/privacy.html', 'en/404.html', 'en/thanks.html', 'estado.html', 'apps.html', 'en/apps.html'];
const precos = [
  ['orcamento.html?tipo=site', '450 €'],
  ['orcamento.html?tipo=pack&setor=turismo&extra=ingles', '770 €'],
  ['orcamento.html?tipo=cartao', '150 €'],
  ['orcamento.html?tipo=landing&extra=galeria', '390 €'],
  ['en/quote.html?tipo=site&extra=ingles', '€570']
];
(async () => {
  const b = await chromium.launch();
  const erros = [];
  for (const pg of pages) for (const w of [390, 768, 1440]) for (const tema of ['dark', 'light']) {
    const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: tema });
    const p = await c.newPage();
    p.on('pageerror', e => erros.push(`${pg} ${w} ${tema}: erro JS ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') erros.push(`${pg} ${w} ${tema}: consola ${m.text().slice(0, 160)}`); });
    p.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400 && !pg.includes('404')) erros.push(`${pg}: ${r.status()} ${r.url()}`); });
    await p.goto(`${base}/${pg}`, { waitUntil: 'networkidle' });
    const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (larg > 1) erros.push(`${pg} ${w}: página ${larg}px mais larga que o ecrã`);
    if (!pg.includes('404') && !(await p.evaluate(() => window.PRONEX_OK))) erros.push(`${pg} ${w}: script.js não terminou`);
    await c.close();
  }
  const p = await b.newPage();
  for (const [url, esperado] of precos) {
    await p.goto(`${base}/${url}`, { waitUntil: 'networkidle' });
    const v = (await p.textContent('#estValue') || '').trim();
    if (v !== esperado) erros.push(`preço ${url}: esperado ${esperado}, obtido ${v}`);
  }
  const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const pg of pages) {
    await p.goto(`${base}/${pg}`, { waitUntil: 'networkidle' });
    await p.evaluate(axe);  // o axe entra por evaluate (não por <script>) para não esbarrar na CSP
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(x => x.id + ' (' + x.nodes.length + ')'));
    v.forEach(x => erros.push(`${pg}: acessibilidade ${x}`));
  }
  // 4) Segurança e dados, lendo os ficheiros diretamente
  const path = require('path');
  for (const pg of pages) {
    const html = fs.readFileSync(pg, 'utf8');
    if (!/http-equiv="Content-Security-Policy"/.test(html)) erros.push(`${pg}: falta a regra CSP`);
    if (!/name="referrer"/.test(html)) erros.push(`${pg}: falta a política de referência`);
    if (/https:\/\/pronex\.pt/.test(html)) erros.push(`${pg}: ainda aponta para pronex.pt`);
    if (/<form[^>]*formsubmit/.test(html) && !/name="_next"/.test(html)) erros.push(`${pg}: formulário sem _next (não funciona bem sem JavaScript)`);
  }
  for (const img of fs.readdirSync('imagens')) {
    if (!/\.(jpe?g)$/i.test(img)) continue;
    const buf = fs.readFileSync(path.join('imagens', img));
    // Os metadados EXIF de um JPEG vêm num bloco APP1 que começa por "Exif"
    if (buf.indexOf(Buffer.from('Exif\0\0')) !== -1) erros.push(`imagens/${img}: tem metadados EXIF`);
  }
  await b.close();
  if (erros.length) { console.log(erros.join('\n')); console.log(`\n${erros.length} problema(s)`); process.exit(1); }
  console.log(`OK: ${pages.length * 6} cargas, ${precos.length} preços e ${pages.length} páginas no axe, sem problemas`);
})();
