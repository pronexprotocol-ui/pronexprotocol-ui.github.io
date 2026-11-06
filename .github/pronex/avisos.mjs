// Envia por Firebase Cloud Messaging os avisos novos da coleção notifs.
// Corre de 10 em 10 minutos (.github/workflows/pronex-avisos.yml).
// Estado: config/pushEstado { ate: Timestamp } — só envia avisos criados depois disso.
import { getMessaging } from 'firebase-admin/messaging';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { ligar } from './comum.mjs';

const { app, db } = ligar();
const fcm = process.env.PUSH_SECO ? null : getMessaging(app);
const estadoRef = db.doc('config/pushEstado');

async function tokensPorAluno() {
  const out = new Map(); // uid -> [{dev, tok}]
  const cols = await db.collection('data').doc('users').listCollections();
  const docs = await Promise.all(cols.map((c) => c.doc('push').get()));
  docs.forEach((d, i) => {
    if (!d.exists) return;
    const toks = d.get('toks') || {};
    const l = Object.entries(toks).filter(([, t]) => typeof t === 'string' && t.length > 20).map(([dev, tok]) => ({ dev, tok }));
    if (l.length) out.set(cols[i].id, l);
  });
  return out;
}

const ESTRAGADO = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);

async function main() {
  const est = await estadoRef.get();
  const agora = Timestamp.now();
  if (!est.exists) {
    // Primeira vez: começa agora, para não enviar avisos antigos.
    await estadoRef.set({ ate: agora, atualizado: agora });
    console.log('Primeira execução: a partir de agora os avisos novos são enviados.');
    return;
  }
  const ate = est.get('ate');
  const snap = await db.collection('notifs').where('criadoEm', '>', ate).orderBy('criadoEm').limit(20).get();
  if (snap.empty) { console.log('Sem avisos novos.'); return; }

  const tokens = await tokensPorAluno();
  let enviados = 0, falhados = 0, removidos = 0, ultimo = ate;
  for (const n of snap.docs) {
    const v = n.data();
    const alvos = v.alvo === 'todos' ? [...tokens.keys()] : (tokens.has(v.alvo) ? [v.alvo] : []);
    const lista = alvos.flatMap((uid) => tokens.get(uid).map((x) => ({ uid, ...x })));
    for (let i = 0; i < lista.length; i += 500) {
      const parte = lista.slice(i, i + 500);
      const msgs = parte.map((x) => ({
        token: x.tok,
        data: { titulo: String(v.titulo || 'Pronex_Study').slice(0, 80), texto: String(v.texto || '').slice(0, 300), id: n.id },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } },
      }));
      if (!fcm) { enviados += msgs.length; continue; }
      const r = await fcm.sendEach(msgs);
      for (let k = 0; k < r.responses.length; k++) {
        const res = r.responses[k];
        if (res.success) { enviados++; continue; }
        falhados++;
        if (res.error && ESTRAGADO.has(res.error.code)) {
          const x = parte[k];
          await db.doc('data/users/' + x.uid + '/push').update({ ['toks.' + x.dev]: FieldValue.delete() }).catch(() => {});
          removidos++;
        }
      }
    }
    ultimo = v.criadoEm;
  }
  await estadoRef.set({ ate: ultimo, atualizado: agora });
  console.log(`Avisos: ${snap.size} · enviados: ${enviados} · falhados: ${falhados} · tokens antigos removidos: ${removidos}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
