// Orçamento de desempenho da Pronex_Study (corre no CI, «Pronex_Study · testes»). Sai com código 1 se passar dos limites.
// Mede o que o telemóvel descarrega para abrir a app (index.html, scripts e estilos pela ordem do index.html),
// com compressão gzip como o GitHub Pages serve, e o tamanho do que fica guardado para funcionar sem rede.
// Guia «How to Build an App», secção 19: carregar só o necessário e vigiar o tempo de arranque.
// Se um limite for ultrapassado por boa razão, sobe-o aqui no mesmo commit e explica porquê.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const APP = path.join(path.dirname(new URL(import.meta.url).pathname), '../../pronex_study');
const KB = 1024;
const LIMITE = {
  arranque: 400 * KB, // tudo o que abre a app, comprimido (1.38: cerca de 346 KB)
  ficheiro: 60 * KB, // cada script ou folha de estilos do arranque, comprimido (o maior: js/disciplinas.js, cerca de 43 KB)
  guardado: 2400 * KB, // ficheiros que o service worker guarda na instalação, sem compressão (cerca de 1990 KB)
  disciplina: 300 * KB, // cada disc/*.json, comprimido, descarrega só quando se abre a disciplina (a maior: inglês, cerca de 198 KB)
};

const falhas = [];
const gz = (f) => gzipSync(readFileSync(path.join(APP, f)), { level: 9 }).length;
const k = (n) => (n / KB).toFixed(1) + ' KB';

const html = readFileSync(path.join(APP, 'index.html'), 'utf8');
const arranque = [
  'index.html',
  ...[...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]),
  ...new Set([...html.matchAll(/<link[^>]*href="([^"]+\.css)"/g)].map((m) => m[1])),
].filter((f) => !/^https?:/.test(f)).map((f) => f.replace(/^\.\//, ''));

let total = 0;
for (const f of arranque) {
  if (!existsSync(path.join(APP, f))) { falhas.push(f + ': está no index.html mas não existe'); continue; }
  const n = gz(f);
  total += n;
  if (f !== 'index.html' && n > LIMITE.ficheiro) falhas.push(`${f}: ${k(n)} comprimido (limite ${k(LIMITE.ficheiro)})`);
}
if (total > LIMITE.arranque) falhas.push(`arranque: ${k(total)} comprimido (limite ${k(LIMITE.arranque)})`);

const sw = readFileSync(path.join(APP, 'sw.js'), 'utf8');
const lista = sw.slice(sw.indexOf('const FILES'), sw.indexOf('];', sw.indexOf('const FILES')));
let guardado = 0;
for (const m of lista.matchAll(/'\.\/([^']*)'/g)) {
  const f = m[1] || 'index.html';
  if (!existsSync(path.join(APP, f))) { falhas.push('sw.js: guarda ' + f + ', que não existe'); continue; }
  guardado += statSync(path.join(APP, f)).size;
}
if (guardado > LIMITE.guardado) falhas.push(`service worker: guarda ${k(guardado)} na instalação (limite ${k(LIMITE.guardado)})`);

let maior = ['', 0];
for (const f of readdirSync(path.join(APP, 'disc')).filter((x) => x.endsWith('.json'))) {
  const n = gz('disc/' + f);
  if (n > maior[1]) maior = [f, n];
  if (n > LIMITE.disciplina) falhas.push(`disc/${f}: ${k(n)} comprimido (limite ${k(LIMITE.disciplina)})`);
}

if (falhas.length) { console.log(falhas.join('\n')); console.log(`\nOrçamento de desempenho: ${falhas.length} problema(s).`); process.exit(1); }
console.log(`Orçamento de desempenho: arranque ${k(total)} comprimido em ${arranque.length} ficheiros (limite ${k(LIMITE.arranque)}), `
  + `guardado para usar sem rede ${k(guardado)}, maior disciplina disc/${maior[0]} com ${k(maior[1])}.`);
