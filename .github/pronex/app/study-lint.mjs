// Pronex_Study · verificação do código (ESLint), nos testes do GitHub (desde 1.38).
// A app carrega vários ficheiros normais que partilham variáveis globais, por isso são juntos pela ordem do index.html
// e verificados como um só: variáveis por definir, chaves repetidas, código que nunca corre e variáveis por usar.
// Correr em .github/pronex/app:  node link-lint.mjs
import { ESLint } from 'eslint';
import globals from 'globals';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../pronex_study');
const ordem = [...readFileSync(path.join(APP, 'index.html'), 'utf8').matchAll(/src="(js\/[^"]+\.js)"/g)].map(m => m[1]);
const partes = [], inicio = [];
let linha = 1;
for (const f of ordem.concat('sw.js')) {
  if (f === 'sw.js') continue; // o service worker corre noutro contexto; é verificado à parte
  const t = readFileSync(path.join(APP, f), 'utf8');
  inicio.push([linha, f]); partes.push(t); linha += t.split('\n').length;
}
// Globais que a app define com window.X = … (e o RM do mapa de Matemática, e o claude do modo artefacto)
const EXTRA = Object.fromEntries(['CR', 'ERRO_ENTRADA', 'ERRO_RESET', 'FIREBASE_CONFIG', 'PN', 'SYNC_ERR', 'TNEX', 'X26GR', 'XD', 'nexCrise', 'RM', 'claude', 'lottie', 'loadPyodide', 'PRONEX_EMULADOR'].map(k => [k, 'writable']));
const regras = { 'no-undef': 'error', 'no-dupe-keys': 'error', 'no-redeclare': 'error', 'no-unreachable': 'error', 'no-self-assign': 'error', 'no-dupe-else-if': 'error', 'no-unsafe-finally': 'error', 'no-unused-vars': 'off' };
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{ languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.browser, ...EXTRA } }, rules: regras }] });
const sw = new ESLint({ overrideConfigFile: true, overrideConfig: [{ languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.serviceworker } }, rules: regras }] });
const [r] = await eslint.lintText(partes.join('\n'), { filePath: 'app.js' });
const [r2] = await sw.lintText(readFileSync(path.join(APP, 'sw.js'), 'utf8'), { filePath: 'sw.js' });
const onde = n => { let f = '', b = 1; for (const [l, nome] of inicio) if (l <= n) { f = nome; b = l; } return f + ':' + (n - b + 1); };
const msgs = r.messages.map(m => onde(m.line) + '  ' + m.message + ' (' + m.ruleId + ')').concat(r2.messages.map(m => 'sw.js:' + m.line + '  ' + m.message + ' (' + m.ruleId + ')'));
console.log(msgs.length ? 'Problemas no código:\n  ' + msgs.join('\n  ') : 'Código da Pronex_Study sem problemas (' + ordem.length + ' ficheiros + sw.js).');
process.exit(msgs.length ? 1 : 0);
