// Valida o conteúdo das disciplinas (pronex_study/disc/*.json) antes de publicar.
// Corre no CI (pronex-testes). Sai com código 1 se encontrar erros.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../pronex_study/disc');
const erros = [];
const err = (f, m) => erros.push(f + ': ' + m);
let total = 0;

for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
  const p = path.join(DIR, f);
  if (statSync(p).size > 900 * 1024) err(f, 'ficheiro com mais de 900 KB');
  let j;
  try { j = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { err(f, 'JSON inválido: ' + e.message); continue; }
  if (f.startsWith('ferr_')) continue;
  const ids = new Map();
  const ver = (it, onde) => {
    total++;
    if (!it.id) { err(f, 'item sem id em ' + onde); return; }
    if (ids.has(it.id)) err(f, 'id repetido: ' + it.id);
    ids.set(it.id, it);
    if (it.tipo === 'mc') {
      if (!Array.isArray(it.opcoes) || it.opcoes.length < 2) err(f, it.id + ': escolha múltipla com menos de 2 opções');
      else if (!Number.isInteger(it.certa) || it.certa < 0 || it.certa >= it.opcoes.length) err(f, it.id + ': «certa» fora das opções');
      if (Array.isArray(it.porque) && Array.isArray(it.opcoes) && it.porque.length !== it.opcoes.length) err(f, it.id + ': «porque» não tem uma explicação por opção');
    }
    if (it.tipo === 'vf' && typeof it.certa !== 'boolean') err(f, it.id + ': verdadeiro/falso sem «certa» booleana');
    if (it.tipo === 'escrita' && !(Array.isArray(it.criterios) && it.criterios.length && it.modelo)) err(f, it.id + ': escrita sem critérios ou sem modelo');
    if (it.tipo === 'escrita') (it.criterios || []).forEach((c, k) => { if (!Array.isArray(c.chaves) || !c.chaves.length) err(f, it.id + ': critério ' + (k + 1) + ' sem chaves'); });
    if (it.tipo === 'codigo' && !(it.solucao && (Array.isArray(it.testes) || typeof it.saida === 'string'))) err(f, it.id + ': código sem solução ou sem testes nem saída');
  };
  (j.modulos || []).forEach((m, mi) => (m.itens || []).forEach((it) => {
    ver(it, 'módulo ' + (mi + 1));
    if (it.tipo === 'texto') (it.perguntas || []).forEach((q) => ver(q, it.id || 'texto'));
  }));
  if (j.mapa) {
    const vistos = new Set();
    const conc = (c, onde) => {
      if (!c.id || !c.nome) err(f, 'conceito sem id ou nome em ' + onde);
      if (vistos.has(c.id)) err(f, 'conceito repetido: ' + c.id);
      vistos.add(c.id);
      (c.itens || []).forEach((i) => { if (!ids.has(i)) err(f, 'conceito ' + c.id + ' aponta para um item que não existe: ' + i); });
    };
    (j.mapa.anos || []).forEach((a) => (a.temas || []).forEach((t) => (t.conceitos || []).forEach((c) => conc(c, 'ano ' + a.ano))));
    const ex = j.mapa.extra; (Array.isArray(ex) ? ex : ex ? [ex] : []).forEach((e) => (e.temas || []).forEach((t) => (t.conceitos || []).forEach((c) => conc(c, 'extra'))));
    (j.mapa.exames || []).forEach((e) => (e.temas || []).forEach((t) => (t.conceitos || []).forEach((c) => conc(c, 'exames'))));
  }
}

if (erros.length) {
  console.log(erros.slice(0, 80).join('\n'));
  console.log(`\nConteúdo: ${erros.length} erro(s) em ${total} itens.`);
  process.exit(1);
}
console.log(`Conteúdo: ${total} itens verificados, sem erros.`);
