// Limpeza diária: remove o que a app já não deve guardar, mesmo de quem não volta a abri-la.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { ligar } from './comum.mjs';

const { app, db } = ligar();
const DOZE_MESES = 365 * 864e5;
const SEIS_MESES = 183 * 864e5;
const MAX_CONTAS = 25; // contas apagadas por dia, no máximo; as outras ficam para o dia seguinte
const c = { tutor: 0, atividade: 0, dispositivos: 0, msgs: 0, grupos: 0, antigos: 0, duelos: 0, salas: 0, imagens: 0, bans: 0, relatorios: 0 };
const p = { auditoria: 0, denuncias: 0, avisadas: 0, voltaram: 0, apagadas: 0, soEstudo: 0, adiadas: 0 };
const msDe = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : +v || 0);
// A conta do administrador nunca entra: o email vem das regras (isAdmin), para haver um só sítio onde está escrito.
const DONO = ((readFileSync(new URL('./regras/firestore.rules', import.meta.url), 'utf8').match(/token\.get\('email', ''\) == '([^']+)'/) || [])[1] || '').toLowerCase();

// Apaga os dados de uma conta na Pronex_Study, como o botão «Apagar conta» da app (js/06-entrada-definicoes.js).
// Se a mesma conta tiver dados na Pronex_Link, a conta de entrada fica, para a Pronex_Link continuar a funcionar.
async function apagarConta(uid) {
  const apaga = async (q) => { for (const d of (await q.get()).docs) await d.ref.delete(); };
  for (const post of (await db.collection('posts').where('uid', '==', uid).get()).docs) { await apaga(post.ref.collection('coments')); await post.ref.delete(); }
  for (const d of (await db.collectionGroup('msgs').where('uid', '==', uid).get()).docs) if (d.ref.path.startsWith('canais/')) await d.ref.delete();
  for (const d of (await db.collectionGroup('coments').where('uid', '==', uid).get()).docs) if (d.ref.path.startsWith('posts/')) await d.ref.delete();
  for (const r of await db.collection('data').doc('users').collection(uid).listDocuments()) await r.delete();
  for (const g of (await db.collection('grupos').where('membros.' + uid, '==', true).get()).docs) {
    if (g.get('dono') === uid) await g.ref.update({ apagado: true, membros: {} });
    else await g.ref.update({ ['membros.' + uid]: FieldValue.delete() });
  }
  await apaga(db.collection('salas').where('dono', '==', uid));
  for (const s of (await db.collection('salas').get()).docs) if ((s.get('membros') || {})[uid] != null) await s.ref.update({ ['membros.' + uid]: FieldValue.delete() });
  for (const k of ['a', 'b']) await apaga(db.collection('duelos').where(k, '==', uid));
  for (const post of (await db.collection('posts').get()).docs) {
    const tira = {};
    if ((post.get('reac') || {})[uid] != null) tira['reac.' + uid] = FieldValue.delete();
    if ((post.get('likes') || {})[uid] != null) tira['likes.' + uid] = FieldValue.delete();
    if (Object.keys(tira).length) await post.ref.update(tira);
  }
  for (const col of ['sugestoes', 'erros']) await apaga(db.collection(col).where('by', '==', uid));
  await apaga(db.collection('notifs').where('alvo', '==', uid));
  for (const doc of ['perfis/', 'utilizadores/', 'consent/', 'premios/']) await db.doc(doc + uid).delete();
  if ((await db.doc('link_pessoas/' + uid).get()).exists) p.soEstudo++;
  else await getAuth(app).deleteUser(uid).catch((e) => { if (e.code !== 'auth/user-not-found') throw e; });
  await db.doc('inatividade/' + uid).delete();
  p.apagadas++;
}

// 1.38: prazos da secção 7 da política de privacidade. Ligado pelo Kaizer a 20 nov 2026.
// LIMPEZA_SECA=1 só conta, sem apagar nem avisar.
async function prazosDaPolitica() {
  const SECA = process.env.LIMPEZA_SECA === '1', AGORA = Date.now();
  // Registo de auditoria do administrador e denúncias: 12 meses.
  for (const d of (await db.collection('audit').where('em', '<', Timestamp.fromMillis(AGORA - DOZE_MESES)).get()).docs) { if (!SECA) await d.ref.delete(); p.auditoria++; }
  for (const d of (await db.collection('denuncias').where('ts', '<', AGORA - DOZE_MESES).get()).docs) { if (!SECA) await d.ref.delete(); p.denuncias++; }
  // Contas paradas. Sem o emulador de contas, nos testes locais, este passo não corre.
  if (process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) { console.log('Contas paradas: sem emulador de contas, passo saltado.'); return; }
  if (!DONO) throw new Error('Não encontrei o email do administrador nas regras: as contas paradas não foram vistas.');
  // Última atividade: a mais recente entre criar a conta, entrar, renovar a sessão (Pronex_Study ou Pronex_Link) e abrir a Pronex_Study.
  const ultimo = new Map((await db.collection('utilizadores').select('ultimo').get()).docs.map((d) => [d.id, msDe(d.get('ultimo'))]));
  const avisos = new Map((await db.collection('inatividade').get()).docs.map((d) => [d.id, msDe(d.get('avisado'))]));
  const apagar = [], vistos = new Set();
  let total = 0, pagina;
  do {
    const r = await getAuth(app).listUsers(1000, pagina);
    for (const u of r.users) {
      total++; vistos.add(u.uid);
      if (u.email && u.email.toLowerCase() === DONO) continue;
      const anon = !u.email && u.providerData.length === 0;
      // Contas com email só entram se tiverem registo na Pronex_Study (quem só usa a Pronex_Link não é desta política).
      if (!anon && !ultimo.has(u.uid)) continue;
      const m = u.metadata;
      const t = Math.max(Date.parse(m.creationTime) || 0, Date.parse(m.lastSignInTime) || 0, Date.parse(m.lastRefreshTime) || 0, ultimo.get(u.uid) || 0);
      if (!t) continue;
      const av = avisos.get(u.uid) || 0;
      if (anon) { if (t < AGORA - DOZE_MESES) apagar.push(u.uid); continue; }
      if (av && t > av) {
        // Voltou depois do aviso: sai o registo e o aviso, para não ficar a dizer que a conta vai ser apagada.
        if (!SECA) {
          for (const n of (await db.collection('notifs').where('alvo', '==', u.uid).get()).docs) if (n.get('por') === 'limpeza') await n.ref.delete();
          await db.doc('inatividade/' + u.uid).delete();
        }
        p.voltaram++; continue;
      }
      if (av) { if (av < AGORA - SEIS_MESES) apagar.push(u.uid); continue; }
      if (t < AGORA - DOZE_MESES) {
        if (!SECA) {
          await db.collection('notifs').add({ titulo: 'A tua conta vai ser apagada', texto: 'Não usas a Pronex_Study há 12 meses. Se não entrares na app nos próximos 6 meses, a conta e os teus dados são apagados, como diz a política de privacidade. Para a manter, basta entrar.', alvo: u.uid, tipo: 'aviso', criadoEm: Timestamp.now(), por: 'limpeza' });
          await db.doc('inatividade/' + u.uid).set({ avisado: Timestamp.now() });
        }
        p.avisadas++;
      }
    }
    pagina = r.pageToken;
  } while (pagina);
  // Avisos de contas que já não existem.
  for (const uid of avisos.keys()) if (!vistos.has(uid) && !SECA) await db.doc('inatividade/' + uid).delete();
  // Travão: uma corrida que queira apagar mais de metade das contas tem um defeito. Para e avisa.
  if (apagar.length > MAX_CONTAS && apagar.length > total / 2) throw new Error(`A limpeza quis apagar ${apagar.length} de ${total} contas. Parou sem apagar nenhuma conta: confirma o que se passa antes de voltar a correr.`);
  p.adiadas = Math.max(0, apagar.length - MAX_CONTAS);
  if (!SECA) for (const uid of apagar.slice(0, MAX_CONTAS)) await apagarConta(uid);
  else p.apagadas = Math.min(apagar.length, MAX_CONTAS);
}

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
  // Imagens enviadas aos grupos para revisão (desenhos e capturas): apagadas ao fim de 30 dias.
  for (const g of (await db.collection('grupos').get()).docs) {
    const velhas = await db.collection('canais/' + g.id + '/msgs').where('ts', '<', Timestamp.fromMillis(Date.now() - 30 * 864e5)).get();
    for (const m of velhas.docs) { if (m.get('img')) { await m.ref.delete(); c.imagens++; } }
  }
  // Duelos com mais de 30 dias e salas que acabaram há mais de um dia (já não servem e enchiam as listas da app).
  for (const d of (await db.collection('duelos').where('ts', '<', Timestamp.fromMillis(Date.now() - 30 * 864e5)).get()).docs) { await d.ref.delete(); c.duelos++; }
  for (const d of (await db.collection('salas').where('fim', '<', Date.now() - 864e5).get()).docs) { await d.ref.delete(); c.salas++; }
  // Suspensões terminadas há mais de 12 meses.
  const lim = Timestamp.fromMillis(Date.now() - DOZE_MESES);
  for (const nome of ['bans', 'bansEmail']) {
    for (const d of (await db.collection(nome).where('ate', '<', lim).get()).docs) { await d.ref.delete(); c.bans++; }
  }
  // 1.26: relatórios de erros e sugestões com mais de 12 meses, como diz a política de privacidade.
  for (const nome of ['erros', 'sugestoes']) {
    for (const d of (await db.collection(nome).where('ts', '<', Date.now() - DOZE_MESES).get()).docs) { await d.ref.delete(); c.relatorios++; }
  }
  console.log(`Limpeza: tutor ${c.tutor} · atividade ${c.atividade} · dispositivos ${c.dispositivos} · mensagens ${c.msgs} · grupos ${c.grupos} (antigos fechados: ${c.antigos}) · duelos ${c.duelos} · salas ${c.salas} · imagens ${c.imagens} · suspensões ${c.bans} · relatórios antigos ${c.relatorios}`);
}

main()
  .then(prazosDaPolitica)
  .then(() => console.log(`Prazos da política${process.env.LIMPEZA_SECA === '1' ? ' (só contagem)' : ''}: auditoria ${p.auditoria} · denúncias ${p.denuncias} · contas avisadas ${p.avisadas} · voltaram ${p.voltaram} · contas apagadas ${p.apagadas} (só os dados da Pronex_Study: ${p.soEstudo}) · para os dias seguintes ${p.adiadas}`))
  .then(() => process.exit(0))
  .catch((e) => { console.error('Erro:', e.message); process.exit(1); });
