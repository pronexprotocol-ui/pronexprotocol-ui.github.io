// Cópia de segurança de toda a base de dados (Firestore) para um ficheiro JSON.
// O workflow cifra o ficheiro com o segredo BACKUP_PASS antes de o guardar:
// o repositório é público, por isso a cópia NUNCA fica guardada sem cifra.
import { writeFileSync } from 'node:fs';
import { Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { ligar } from './comum.mjs';

const { db } = ligar();
const destino = process.argv[2] || 'copia.json';

function valor(v) {
  if (v instanceof Timestamp) return { __ts: v.toMillis() };
  if (v instanceof GeoPoint) return { __geo: [v.latitude, v.longitude] };
  if (v instanceof DocumentReference) return { __ref: v.path };
  if (Buffer.isBuffer(v)) return { __bytes: v.toString('base64') };
  if (Array.isArray(v)) return v.map(valor);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, valor(x)]));
  return v;
}

let nDocs = 0;
async function colecao(ref, out) {
  const refs = await ref.listDocuments();
  for (const d of refs) {
    const s = await d.get();
    const subs = await d.listCollections();
    if (!s.exists && !subs.length) continue;
    const item = { id: d.id };
    if (s.exists) { item.dados = valor(s.data()); nDocs++; }
    if (subs.length) {
      item.sub = {};
      for (const c of subs) { item.sub[c.id] = []; await colecao(c, item.sub[c.id]); }
    }
    out.push(item);
  }
}

async function main() {
  const tudo = { app: 'Pronex_Study', feitaEm: new Date().toISOString(), formato: 1, colecoes: {} };
  for (const c of await db.listCollections()) { tudo.colecoes[c.id] = []; await colecao(c, tudo.colecoes[c.id]); }
  writeFileSync(destino, JSON.stringify(tudo));
  console.log(`Cópia feita: ${Object.keys(tudo.colecoes).length} coleções, ${nDocs} documentos.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
