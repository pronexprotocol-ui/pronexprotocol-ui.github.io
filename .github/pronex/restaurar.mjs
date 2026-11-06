// Repõe uma cópia feita por copia.mjs (depois de decifrada, ver LEIA-ME.md).
// Por segurança só escreve no emulador. Para a base de dados real é preciso escrever de propósito
// RESTAURAR_CONFIRMO=restaurar-base-real, e isso substitui os documentos com o mesmo caminho.
import { readFileSync } from 'node:fs';
import { Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { ligar } from './comum.mjs';

const origem = process.argv[2];
if (!origem) { console.error('Uso: node restaurar.mjs copia.json'); process.exit(1); }
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.RESTAURAR_CONFIRMO !== 'restaurar-base-real') {
  console.error('Recusado: sem emulador, é preciso RESTAURAR_CONFIRMO=restaurar-base-real.');
  process.exit(1);
}
const { db } = ligar();

function valor(v) {
  if (Array.isArray(v)) return v.map(valor);
  if (v && typeof v === 'object') {
    if (typeof v.__ts === 'number') return Timestamp.fromMillis(v.__ts);
    if (Array.isArray(v.__geo)) return new GeoPoint(v.__geo[0], v.__geo[1]);
    if (typeof v.__ref === 'string') return db.doc(v.__ref);
    if (typeof v.__bytes === 'string') return Buffer.from(v.__bytes, 'base64');
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, valor(x)]));
  }
  return v;
}

let n = 0;
let lote = db.batch();
let noLote = 0;
async function guardar(ref, dados) {
  lote.set(ref, dados);
  n++;
  if (++noLote === 400) { await lote.commit(); lote = db.batch(); noLote = 0; }
}
async function colecao(col, itens) {
  for (const it of itens) {
    const ref = col.doc(it.id);
    if (it.dados) await guardar(ref, valor(it.dados));
    for (const [nome, sub] of Object.entries(it.sub || {})) await colecao(ref.collection(nome), sub);
  }
}

const copia = JSON.parse(readFileSync(origem, 'utf8'));
if (copia.app !== 'Pronex_Study') { console.error('Este ficheiro não é uma cópia da Pronex_Study.'); process.exit(1); }
for (const [nome, itens] of Object.entries(copia.colecoes)) await colecao(db.collection(nome), itens);
if (noLote) await lote.commit();
console.log(`Restaurados ${n} documentos da cópia de ${copia.feitaEm}.`);
process.exit(0);
