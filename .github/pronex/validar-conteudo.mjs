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
  // 1.36: pistas involuntárias que um aluno «esperto» usa sem saber a matéria
  const pista = { mc: 0, longa: 0, vfV: 0, vfF: 0 };
  const ver = (it, onde) => {
    total++;
    if (!it.id) { err(f, 'item sem id em ' + onde); return; }
    if (ids.has(it.id)) err(f, 'id repetido: ' + it.id);
    ids.set(it.id, it);
    if (it.tipo === 'mc') {
      if (!Array.isArray(it.opcoes) || it.opcoes.length < 2) err(f, it.id + ': escolha múltipla com menos de 2 opções');
      else if (!Number.isInteger(it.certa) || it.certa < 0 || it.certa >= it.opcoes.length) err(f, it.id + ': «certa» fora das opções');
      if (Array.isArray(it.porque) && Array.isArray(it.opcoes) && it.porque.length !== it.opcoes.length) err(f, it.id + ': «porque» não tem uma explicação por opção');
      // 1.37: todas as escolhas múltiplas explicam cada opção (é o que o aluno lê quando falha)
      if (!Array.isArray(it.porque)) err(f, it.id + ': falta «porque» (uma explicação por opção)');
      else if (Number.isInteger(it.certa) && !/^Certo/.test(String(it.porque[it.certa] || ''))) err(f, it.id + ': a explicação da opção certa tem de começar por «Certo»');
      if (Array.isArray(it.opcoes) && Number.isInteger(it.certa) && it.opcoes[it.certa] != null) {
        const ops = it.opcoes.map((o) => String(o).trim());
        if (new Set(ops).size < ops.length) err(f, it.id + ': opções repetidas');
        const L = ops.map((o) => o.length), k = it.certa, outros = L.filter((_, i) => i !== k);
        pista.mc++;
        if (outros.length && L[k] >= 1.25 * Math.max(...outros)) pista.longa++;
      }
    }
    if (it.tipo === 'vf' && typeof it.certa === 'boolean') pista[it.certa ? 'vfV' : 'vfF']++;
    if (it.tipo === 'vf' && typeof it.certa !== 'boolean') err(f, it.id + ': verdadeiro/falso sem «certa» booleana');
    if (it.tipo === 'escrita' && !(Array.isArray(it.criterios) && it.criterios.length && it.modelo)) err(f, it.id + ': escrita sem critérios ou sem modelo');
    if (it.tipo === 'escrita') (it.criterios || []).forEach((c, k) => { if (!Array.isArray(c.chaves) || !c.chaves.length) err(f, it.id + ': critério ' + (k + 1) + ' sem chaves'); });
    if (it.tipo === 'codigo' && !(it.solucao && (Array.isArray(it.testes) || typeof it.saida === 'string'))) err(f, it.id + ': código sem solução ou sem testes nem saída');
  };
  (j.modulos || []).forEach((m, mi) => (m.itens || []).forEach((it) => {
    ver(it, 'módulo ' + (mi + 1));
    if (it.tipo === 'texto') (it.perguntas || []).forEach((q) => ver(q, it.id || 'texto'));
  }));
  // A opção certa não pode ser quase sempre a mais comprida, nem o V/F quase sempre verdadeiro (ou falso).
  if (pista.mc >= 12 && pista.longa / pista.mc > 0.2) err(f, `a opção certa é a mais comprida em ${pista.longa} de ${pista.mc} perguntas de escolha múltipla (máximo 20%)`);
  const nvf = pista.vfV + pista.vfF;
  if (nvf >= 10 && (pista.vfV / nvf < 0.3 || pista.vfV / nvf > 0.7)) err(f, `verdadeiro/falso desequilibrado: ${pista.vfV} verdadeiras e ${pista.vfF} falsas (cada lado entre 30% e 70%)`);
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
    // «ver»: conceitos do separador do ano mostrados também num tema do extra; têm de existir
    (Array.isArray(ex) ? ex : ex ? [ex] : []).forEach((e) => (e.temas || []).forEach((t) => (t.ver || []).forEach((id) => { if (!vistos.has(id)) err(f, 'tema ' + t.id + ' manda ver um conceito que não existe: ' + id); })));
    (j.mapa.exames || []).forEach((e) => (e.temas || []).forEach((t) => (t.conceitos || []).forEach((c) => conc(c, 'exames'))));
  }
}

if (erros.length) {
  console.log(erros.slice(0, 80).join('\n'));
  console.log(`\nConteúdo: ${erros.length} erro(s) em ${total} itens.`);
  process.exit(1);
}
console.log(`Conteúdo: ${total} itens verificados, sem erros.`);
