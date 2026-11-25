// PRONEX · ensaio de preservação dos dados (regra fixa de 25-11-2026: nenhuma atualização pode perder registos).
// 1) Abre a versão ATUAL do Study e do Freelancer por cima de dados gravados por uma versão anterior (dados-antigos/*.json)
//    e confirma que nenhum registo desaparece: ao abrir, depois de navegar e depois de recarregar.
// 2) Confirma que a guarda (js/guarda.js) ficou com uma cópia exata do que havia antes de a versão nova correr.
// 3) Verificações ao código: os sítios onde os dados ficam (../dados-congelados.json) continuam a existir, o service
//    worker não toca nos dados e ninguém chama localStorage.clear() nem apaga bases de dados.
// Correr em .github/pronex/app:  npm ci && node preservacao.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../../..');
const CONG = JSON.parse(readFileSync(path.join(AQUI, '../dados-congelados.json'), 'utf8'));
let falhas = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) falhas++; };

/* ---------- 3) verificações ao código ---------- */
console.log('\n== código ==');
const ler = f => readFileSync(path.join(RAIZ, f), 'utf8');
const js = d => readdirSync(path.join(RAIZ, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f);
const codigo = { study: js('pronex_study/js').concat('pronex_study/index.html').map(ler).join('\n'), freelancer: js('pronex_link/js').concat('pronex_link/index.html').map(ler).join('\n') };
for (const s of ['study', 'freelancer']) for (const k of CONG.localStorage[s]) ok(codigo[s].includes("'" + k + "'") || codigo[s].includes('"' + k + '"'), s + ': a chave «' + k + '» continua a ser usada');
const regras = ler('.github/pronex/regras/firestore.rules');
for (const c of CONG.firestore) ok(new RegExp('match /' + c + '/\\{').test(regras), 'regras: a coleção «' + c + '» continua a existir');
for (const f of ['pronex_study/sw.js', 'pronex_link/sw.js', 'fonte/sw.js']) { const t = ler(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''); ok(!/localStorage|indexedDB|sessionStorage/.test(t), f + ' não toca nos dados do utilizador (só na cache dos ficheiros)'); }
{ const tudo = (codigo.study + codigo.freelancer + ler('fonte/script.js')).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  ok(!/localStorage\s*\.\s*clear\s*\(/.test(tudo), 'ninguém chama localStorage.clear()');
  ok(!/deleteDatabase\s*\(/.test(tudo), 'ninguém apaga bases de dados do aparelho'); }
ok(ler('pronex_study/js/guarda.js') === ler('pronex_link/js/guarda.js'), 'js/guarda.js é igual no Study e no Freelancer');
for (const s of ['pronex_study', 'pronex_link']) { const h = ler(s + '/index.html'); ok(h.indexOf('js/guarda.js') > 0 && h.indexOf('js/guarda.js') < h.indexOf('js/marca.js'), s + ': a guarda corre antes do resto do código'); }

/* ---------- servidor: o repositório como no site publicado ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };
const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  if (p === '/site.webmanifest') { res.writeHead(200, { 'content-type': TIPOS['.webmanifest'] }); res.end(await readFile(path.join(RAIZ, 'fonte/site.webmanifest'))); return; }
  if (p.endsWith('/config.js')) { res.writeHead(200, { 'content-type': TIPOS['.js'] }); res.end('/* ensaio sem servidor */'); return; }
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
});
await new Promise(r => servidor.listen(8797, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:8797/';

/* «novo» tem tudo o que «velho» tinha? Objetos: todas as chaves. Listas: nenhuma encolhe; os itens com id continuam lá. */
function falta(novo, velho, onde, out) {
  if (out.length > 12) return out;
  if (Array.isArray(velho)) {
    if (!Array.isArray(novo)) { out.push(onde + ' deixou de ser uma lista'); return out; }
    const comId = velho.filter(x => x && typeof x === 'object' && x.id);
    if (comId.length) comId.forEach(x => { const n = novo.find(y => y && y.id === x.id); if (!n) out.push(onde + ': desapareceu o registo ' + x.id); else falta(n, x, onde + '[' + x.id + ']', out); });
    else if (novo.length < velho.length) out.push(onde + ': a lista encolheu de ' + velho.length + ' para ' + novo.length);
  } else if (velho && typeof velho === 'object') {
    if (!novo || typeof novo !== 'object') { out.push(onde + ' desapareceu'); return out; }
    for (const k of Object.keys(velho)) { if (!(k in novo)) out.push(onde + '.' + k + ' desapareceu'); else falta(novo[k], velho[k], onde + '.' + k, out); }
  } else if (velho !== '' && velho != null && (novo === '' || novo == null)) out.push(onde + ' ficou vazio (era ' + JSON.stringify(velho).slice(0, 40) + ')');
  return out;
}
const guardado = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
function comparar(agora, antes, chaves, quando) {
  for (const k of chaves) {
    if (!(k in antes)) continue;
    if (!(k in agora)) { ok(false, quando + ': a chave «' + k + '» desapareceu'); continue; }
    let a, b; try { a = JSON.parse(antes[k]); b = JSON.parse(agora[k]); } catch (e) { ok(agora[k].length >= antes[k].length, quando + ': «' + k + '» mantém-se'); continue; }
    const f = falta(b, a, k, []);
    ok(!f.length, quando + ': «' + k + '» mantém todos os registos' + (f.length ? '\n      ' + f.join('\n      ') : ''));
  }
}

const b = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE, headless: true } : { channel: 'chrome', headless: true });
const CASOS = [
  { nome: 'Freelancer', pasta: 'pronex_link/', sec: 'freelancer', ficheiros: readdirSync(path.join(AQUI, 'dados-antigos')).filter(f => f.startsWith('freelancer-')),
    passear: async p => { for (const h of ['pedidos', 'conversas', 'perfil', 'inicio']) { await p.evaluate(h => { if (typeof ir === 'function') ir(h); }, h); await p.waitForTimeout(350); } } },
  { nome: 'Study', pasta: 'pronex_study/', sec: 'study', ficheiros: readdirSync(path.join(AQUI, 'dados-antigos')).filter(f => f.startsWith('study-')),
    passear: async p => { for (const v of ['study', 'profile', 'home']) { await p.evaluate(v => { try { if (typeof go === 'function') go(v); } catch (e) { /* sem conta: o ecrã de entrada fica à frente */ } }, v); await p.waitForTimeout(350); } } }
];
for (const caso of CASOS) for (const fich of caso.ficheiros) {
  console.log('\n== ' + caso.nome + ' · dados de ' + fich.replace('.json', '') + ' ==');
  const antes = JSON.parse(readFileSync(path.join(AQUI, 'dados-antigos', fich), 'utf8'));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
  // sem servidor: o Firebase não carrega (como num aparelho sem internet) e os dados do aparelho são os únicos que há
  await ctx.route('https://www.gstatic.com/**', r => r.abort());
  await ctx.route('https://*.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(d => { try { if (!localStorage.getItem('pronex-ensaio-semeado')) { for (const k in d) localStorage.setItem(k, d[k]); localStorage.setItem('pronex-ensaio-semeado', '1'); } sessionStorage.setItem('pronex-splash', '1'); } catch (e) { /* sem armazenamento */ } }, antes);
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  const chaves = CONG.localStorage[caso.sec];
  await p.goto(BASE + caso.pasta); await p.waitForTimeout(2500);
  // PRONEX_SABOTAR=1 apaga um registo de propósito, para provar que o ensaio dá por isso (tem de falhar)
  if (process.env.PRONEX_SABOTAR) await p.evaluate(k => { try { const d = JSON.parse(localStorage.getItem(k)); const l = Array.isArray(d.pedidos) ? d.pedidos : Object.values(d).find(Array.isArray); if (l && l.length) l.pop(); else delete d[Object.keys(d)[0]]; localStorage.setItem(k, JSON.stringify(d)); } catch (e) { localStorage.removeItem(k); } }, chaves[0]);
  comparar(await guardado(p), antes, chaves, 'ao abrir');
  await caso.passear(p); await p.waitForTimeout(600);
  comparar(await guardado(p), antes, chaves, 'depois de navegar');
  await p.reload(); await p.waitForTimeout(2500);
  comparar(await guardado(p), antes, chaves, 'depois de recarregar');
  // a guarda ficou com a fotografia de antes da versão nova
  const copia = await p.evaluate(async () => { try { const t = await window.pxGuarda.listar(); const c = t[t.length - 1]; return c ? { motivo: c.motivo, dados: c.dados, n: t.length } : null; } catch (e) { return { erro: String(e) }; } });
  ok(!!copia && !copia.erro && copia.n >= 1, 'a guarda fez uma cópia no aparelho' + (copia && copia.motivo ? ' («' + copia.motivo + '»)' : ''));
  ok(!!copia && !!copia.dados && chaves.filter(k => k in antes).every(k => copia.dados[k] === antes[k]), 'essa cópia tem os dados exatamente como estavam antes de a versão nova correr');
  ok(!erros.length, 'sem erros de JavaScript' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}
await b.close(); servidor.close();
console.log(falhas ? '\n' + falhas + ' verificação(ões) falharam: NÃO PUBLICAR.' : '\nPreservação dos dados: tudo certo.');
process.exit(falhas ? 1 : 0);
