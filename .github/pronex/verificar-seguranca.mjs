// Verificações de segurança da página da app (corre no CI, «Pronex_Study · testes»). Sai com código 1 se falhar.
// 1. A política de segurança (CSP) existe e autoriza, pelo sha256, cada script escrito dentro do index.html.
// 2. Não há atributos onclick/onload/… no HTML gerado pelo código (a CSP bloqueia-os e são um risco).
// 3. Não há ligações a serviços de IA na nuvem (não são permitidos na app).
// 4. Não há endereços «javascript:».
// 5. 1.38: os scripts que vêm de fora (jsDelivr, cdnjs, unpkg) têm a versão fixa no endereço.
// 6. 1.38: a app recusa abrir dentro de uma página de outro site (proteção contra cliques enganadores).
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const APP = path.join(path.dirname(new URL(import.meta.url).pathname), '../../pronex_study');
const falhas = [];
const html = readFileSync(path.join(APP, 'index.html'), 'utf8');

const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
if (!meta) falhas.push('index.html: falta a política de segurança (meta Content-Security-Policy)');
else {
  const csp = meta[1];
  const script = (csp.match(/script-src ([^;]+)/) || [])[1] || '';
  if (/'unsafe-inline'|'unsafe-eval'/.test(script)) falhas.push("CSP: script-src não pode ter 'unsafe-inline' nem 'unsafe-eval'");
  if (!/object-src 'none'/.test(csp)) falhas.push("CSP: falta object-src 'none'");
  if (!/base-uri 'self'/.test(csp)) falhas.push("CSP: falta base-uri 'self'");
  if (html.indexOf(meta[0]) > html.indexOf('<script')) falhas.push('index.html: a CSP tem de vir antes do primeiro <script>');
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const h = "'sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64') + "'";
    if (!script.includes(h)) falhas.push('index.html: um script dentro da página mudou; atualiza a CSP com ' + h);
  }
}
const ficheiros = ['index.html', ...readdirSync(path.join(APP, 'js')).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f)];
let guarda = false;
for (const f of ficheiros) {
  const s = readFileSync(path.join(APP, f), 'utf8');
  if (s.includes("setAttribute('data-emoldurada'")) guarda = true;
  const linhas = s.split('\n');
  linhas.forEach((l, i) => {
    if (/<[a-z][^>]*\son(click|load|error|input|change|submit|mouse\w+|key\w+|focus|blur)\s*=/i.test(l)) falhas.push(f + ':' + (i + 1) + ': atributo on…= no HTML (usa addEventListener ou data-*)');
    if (/generativelanguage\.googleapis|firebase-ai\.js|api\.openai\.com|api\.anthropic\.com/.test(l)) falhas.push(f + ':' + (i + 1) + ': ligação a IA na nuvem');
    if (/href=["']javascript:/i.test(l)) falhas.push(f + ':' + (i + 1) + ': endereço javascript:');
  });
}
// 5. Endereços de CDN só com versão fixa (no código da app e nos workers).
const CDN = /https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)\/[^'"`\s)]+/g;
let nCdn = 0;
for (const f of [...ficheiros, ...readdirSync(APP).filter((x) => x.endsWith('.js'))]) {
  for (const m of readFileSync(path.join(APP, f), 'utf8').matchAll(CDN)) {
    nCdn++;
    if (!/[@/]v?\d+\.\d+\.\d+/.test(m[0])) falhas.push(f + ': script de fora sem versão fixa: ' + m[0]);
  }
}
// 6. Proteção contra a app ser posta dentro de outra página.
if (!guarda) falhas.push('js: falta a proteção contra a app abrir dentro de outra página (data-emoldurada)');
if (falhas.length) { console.log(falhas.join('\n')); console.log(`\nSegurança da página: ${falhas.length} problema(s).`); process.exit(1); }
console.log(`Segurança da página: CSP certa, ${ficheiros.length} ficheiros sem atributos on…=, sem IA na nuvem e sem javascript:, ${nCdn} endereços de CDN com versão fixa e proteção contra iframes.`);
