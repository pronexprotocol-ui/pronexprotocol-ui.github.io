/* ==========================================================================
   PRONEX · construir.js
   Cria a VERSÃO ONLINE do site a partir da versão comentada.

   Porquê: os ficheiros do site têm muitos comentários a explicar o código
   (pedido para o trabalho). Isso é ótimo para quem lê o código, mas faz o
   site pesar mais. Este script copia o site para a pasta _publicar/ e, pelo
   caminho, tira os comentários e espaços a mais (minificação):
     · HTML  → parse5 lê a página e tiramos só os comentários <!-- ... --> (o resto fica igual)
     · CSS   → csso (tira comentários e espaços, sem reordenar regras)
     · JS    → terser (tira comentários, encurta nomes internos)
   Os ficheiros comentados NÃO são alterados.

   Como usar (precisa do Node.js instalado):
     1. Na pasta _nao-publicar:  npm install terser csso parse5
     2. Na pasta site-pronex:    node _nao-publicar/construir.js
     3. Envia para o servidor só a pasta _publicar/ (hoje: o GitHub faz isto sozinho, ver
        .github/workflows/site-construir.yml no repositório).

   Desde novembro de 2026 faz mais duas coisas na versão publicada:
     · ?v=... (o "carimbo" dos ficheiros CSS/JS nas páginas) passa a ser calculado sozinho a partir
       do conteúdo do style.css, script.js e extras.js. Se um deles muda, o carimbo muda e os
       navegadores descarregam a versão nova em vez de usarem a que tinham guardada.
     · Cada página recebe a regra de segurança CSP (Content-Security-Policy) logo a seguir ao
       <meta charset>. A regra só deixa correr o código do próprio site e os pequenos scripts em
       linha que conhecemos, identificados pela sua "impressão digital" (hash SHA-256).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');
const csso = require('csso');
const { minify: minifyJs } = require('terser');
const crypto = require('crypto');

// Pasta de origem (onde corres o comando) e pasta de destino
const SRC = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || path.join(SRC, '_publicar'));
// O que nunca vai para o servidor: ficheiros internos, a própria saída e pastas de ferramentas
const SKIP = new Set(['_nao-publicar', '_publicar', 'node_modules', '.git', '.vscode', '.gitignore']);

// Copia uma pasta inteira, ficheiro a ficheiro, tratando HTML/CSS/JS pelo caminho
async function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const src = path.join(dir, name);
    const rel = path.relative(SRC, src);
    const dst = path.join(OUT, rel);
    if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, { recursive: true }); await walk(src); continue; }
    const ext = path.extname(name).toLowerCase();
    let data = fs.readFileSync(src);
    if (ext === '.html') {
      data = stripHtmlComments(data.toString('utf8'));
    } else if (ext === '.css') {
      // restructure: false = não junta nem reordena regras (mais seguro)
      data = csso.minify(data.toString('utf8'), { restructure: false }).css;
    } else if (ext === '.js') {
      const r = await minifyJs(data.toString('utf8'), { compress: true, mangle: true, format: { comments: false } });
      data = r.code;
    }
    fs.writeFileSync(dst, data);
    report.push([rel, fs.statSync(src).size, fs.statSync(dst).size]);
  }
}

// stripHtmlComments(html): devolve o HTML sem os comentários. O parse5 lê a página como um
// navegador e diz onde começa e acaba cada comentário; cortamos só esses pedaços do texto
// original, por isso nada mais muda (nem espaços, nem atributos, nem o conteúdo de <script>).
function stripHtmlComments(html) {
  const doc = parse5.parse(html, { sourceCodeLocationInfo: true });
  const cuts = [];
  (function walk(node) {
    for (const child of (node.childNodes || []).concat(node.content ? node.content.childNodes : [])) {
      if (child.nodeName === '#comment' && child.sourceCodeLocation) {
        let { startOffset: a, endOffset: b } = child.sourceCodeLocation;
        // leva também os espaços e a quebra de linha que ficariam numa linha vazia
        while (a > 0 && (html[a - 1] === ' ' || html[a - 1] === '\t')) a--;
        if (html[b] === '\r') b++;
        if (html[b] === '\n' && (a === 0 || html[a - 1] === '\n')) b++;
        cuts.push([a, b]);
      } else walk(child);
    }
  })(doc);
  cuts.sort((x, y) => y[0] - x[0]);                 // corta de trás para a frente: as posições não mudam
  for (const [a, b] of cuts) html = html.slice(0, a) + html.slice(b);
  return html;
}

// sha256(texto): impressão digital em base64, no formato que a CSP pede ('sha256-...')
const sha256 = (t) => "'sha256-" + crypto.createHash('sha256').update(t, 'utf8').digest('base64') + "'";

// Regra CSP de uma página. Só os scripts em linha desta página (e o onerror) ficam autorizados.
// 'unsafe-hashes' é o que permite autorizar um atributo como onerror="..." pela sua impressão digital.
// style-src precisa de 'unsafe-inline' porque as páginas usam style="--d:.1s" (atrasos das animações).
function csp(html) {
  const hashes = new Set();
  const doc = parse5.parse(html);
  (function walk(node) {
    for (const child of node.childNodes || []) {
      if (child.nodeName === 'script') {
        const type = (child.attrs.find((a) => a.name === 'type') || {}).value || '';
        const src = child.attrs.find((a) => a.name === 'src');
        if (!src && type !== 'application/ld+json') hashes.add(sha256(child.childNodes.map((n) => n.value || '').join('')));
      }
      for (const a of child.attrs || []) if (/^on[a-z]+$/.test(a.name)) hashes.add(sha256(a.value));
      walk(child);
    }
  })(doc);
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-hashes' " + [...hashes].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://formsubmit.co",
    "form-action 'self' https://formsubmit.co",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
}

const report = [];
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });   // começa sempre de uma pasta limpa
  fs.mkdirSync(OUT, { recursive: true });
  await walk(SRC);
  // Carimbo dos ficheiros: os primeiros 8 caracteres do MD5 do CSS + JS publicados
  const stamp = crypto.createHash('md5')
    .update(['style.css', 'script.js', 'extras.js'].map((f) => (fs.existsSync(path.join(OUT, f)) ? fs.readFileSync(path.join(OUT, f)) : '')).join(''))
    .digest('hex').slice(0, 8);
  for (const [rel] of report) {
    if (!rel.endsWith('.html')) continue;
    const file = path.join(OUT, rel);
    let html = fs.readFileSync(file, 'utf8').replace(/((?:style|script|extras)\.(?:css|js))\?v=[a-z0-9]+/g, '$1?v=' + stamp);
    html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '');
    html = html.replace(/(<meta charset="utf-8">\s*)/i, '$1<meta http-equiv="Content-Security-Policy" content="' + csp(html) + '">\n  ');
    fs.writeFileSync(file, html);
  }
  console.log('Carimbo dos ficheiros (?v=):', stamp);
  let a = 0, b = 0;
  for (const [, x, y] of report) { a += x; b += y; }
  console.log('Versão online criada em', OUT);
  console.log(report.length + ' ficheiros · ' + Math.round(a / 1024) + ' KB → ' + Math.round(b / 1024) + ' KB');
})().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
