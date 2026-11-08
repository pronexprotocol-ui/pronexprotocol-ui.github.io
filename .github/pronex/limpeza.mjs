// Limpeza diária: remove o que a app já não deve guardar, mesmo de quem não volta a abri-la.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ligar } from './comum.mjs';

const { db } = ligar();
const DOZE_MESES = 365 * 864e5;
const c = { tutor: 0, atividade: 0, dispositivos: 0, msgs: 0, grupos: 0, antigos: 0, bans: 0 };

async function apagarColecao(col) {
  for (;;) {
    const s = await col.limit(400).get();
    if (s.empty) return;
    const b = db.batch();
    s.docs.forEach((d) => b.delete(d.ref));
    await b.commit();
    c.msgs += s.size;
  }
}

async function main() {
  // Cópias do tutor e registo de atividade guardados pelas versões antigas.
  for (const col of await db.collection('data').doc('users').listCollections()) {
    for (const ref of await col.listDocuments()) {
      if (ref.id === 'tutor') { await ref.delete(); c.tutor++; }
      else if (ref.id.startsWith('log_')) { await ref.delete(); c.atividade++; }
    }
  }
  // Dados de dispositivos no registo de cada conta.
  for (const d of (await db.collection('utilizadores').get()).docs) {
    if (d.get('dev') !== undefined) { await d.ref.update({ dev: FieldValue.delete() }); c.dispositivos++; }
  }
  // Grupos antigos (antes da 1.17) com código curto, fácil de adivinhar: fecham-se (Kaizer autorizou a 8 nov 2026).
  // Ficam marcados como apagados e o passo seguinte apaga as mensagens e o grupo.
  for (const g of (await db.collection('grupos').get()).docs) {
    if (!/^g_[A-Za-z0-9]{12,30}$/.test(g.id) && g.get('apagado') !== true) { await g.ref.update({ apagado: true, membros: {} }); c.antigos++; }
  }
  // Mensagens de grupos apagados: primeiro as mensagens, depois a marca do grupo.
  for (const canal of await db.collection('canais').listDocuments()) {
    if (!canal.id.startsWith('g_')) continue;
    const g = await db.doc('grupos/' + canal.id).get();
    if (g.exists && g.get('apagado') !== true) continue;
    await apagarColecao(canal.collection('msgs'));
    if (g.exists) { await g.ref.delete(); c.grupos++; }
  }
  for (const g of (await db.collection('grupos').where('apagado', '==', true).get()).docs) { await g.ref.delete(); c.grupos++; }
  // Suspensões terminadas há mais de 12 meses.
  const lim = Timestamp.fromMillis(Date.now() - DOZE_MESES);
  for (const nome of ['bans', 'bansEmail']) {
    for (const d of (await db.collection(nome).where('ate', '<', lim).get()).docs) { await d.ref.delete(); c.bans++; }
  }
  console.log(`Limpeza: tutor ${c.tutor} · atividade ${c.atividade} · dispositivos ${c.dispositivos} · mensagens ${c.msgs} · grupos ${c.grupos} (antigos fechados: ${c.antigos}) · suspensões ${c.bans}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
