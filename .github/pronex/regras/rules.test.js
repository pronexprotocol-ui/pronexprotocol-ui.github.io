/* Pronex_Study · testes das regras do Firestore v4
   Correr (precisa de Java 11+ e do emulador do Firestore):
     cd sec/tests && npm i && npx firebase emulators:exec --only firestore --project demo-pronex "npx mocha rules.test.js --timeout 20000"
   As regras são lidas de ../firestore.rules e carregadas em dois projetos:
     - demo-final:    legado() desligado (só o formato da app 1.8 passa)
     - demo-transicao: legado() ligado (a app 1.7 continua a funcionar)
*/
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {
  initializeTestEnvironment, assertSucceeds, assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc, collection, collectionGroup, setDoc, updateDoc, addDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, writeBatch, serverTimestamp, arrayUnion, deleteField, Timestamp,
} = require('firebase/firestore');

const RULES = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
const DATA_RE = /timestamp\.date\(2026, 11, 25\)/;
assert(DATA_RE.test(RULES), 'Não encontrei a data de fim da transição nas regras.');
const RULES_FINAL = RULES.replace(DATA_RE, 'timestamp.date(2000, 1, 1)');
const RULES_TRANS = RULES.replace(DATA_RE, 'timestamp.date(2999, 1, 1)');

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
const ADMIN_EMAIL = 'pronex.protocol@gmail.com';
const ALICE = 'alice_uid_000000000001', BOB = 'bob_uid_00000000000002', ADMIN = 'admin_uid_0000000000003';
const ANON = 'anon_uid_0000000000006', SEM_EMAIL = 'novo_uid_0000000000007', SEM_TERMOS = 'semt_uid_0000000000008';

// ---------- utilitários ----------
const DAY = 864e5;
const tsAgo = ms => Timestamp.fromMillis(Date.now() - ms);
function levelOf(xp) { let n = 1, need = 100, acc = 0; while (xp >= acc + need) { acc += need; n++; need += 60; } return n; }
function mondayUTC(t = Date.now()) {
  const d = new Date(t); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function today() { return new Date().toISOString().slice(0, 10); }
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

// Corpo de perfil como o syncProfile escreve (todas as chaves da 1.7)
function perfil(xp, extra = {}) {
  return Object.assign({
    nick: 'Alice', curso: 'Multimédia', escola: 'EPL', bio: 'Olá', foto: '', cor: 2, goal: 15,
    ranking: true, ai: 0, sent: false, xp, wxp: Math.min(xp, extra.wxp ?? xp), wk: mondayUTC(),
    nivel: levelOf(xp), streak: 0, total: Math.floor(xp / 10), certos: Math.floor(xp / 10), badges: 1,
    upd: Date.now(),
  }, extra);
}
function registo(uid, extra = {}) {
  return Object.assign({
    uid, nick: 'Alice', email: '', anon: true, ultimo: Date.now(), versao: '1.8.0',
    dev: { dabc123: { tipo: 'Telemóvel', so: 'Android', nav: 'Chrome', ecra: '412x915', instalada: true, lingua: 'pt-PT', versao: '1.8.0', ultimo: Date.now() } },
  }, extra);
}

let envF, envT;
const ctx = {};
function users(env) {
  return {
    alice: env.authenticatedContext(ALICE, { email: 'alice@exemplo.pt', email_verified: true, firebase: { sign_in_provider: 'password', identities: {} } }).firestore(),
    anon: env.authenticatedContext(ANON, { firebase: { sign_in_provider: 'anonymous', identities: {} } }).firestore(),
    semEmail: env.authenticatedContext(SEM_EMAIL, { email: 'novo@exemplo.pt', email_verified: false, firebase: { sign_in_provider: 'password', identities: {} } }).firestore(),
    semTermos: env.authenticatedContext(SEM_TERMOS, { email: 'semtermos@exemplo.pt', email_verified: true, firebase: { sign_in_provider: 'google.com', identities: {} } }).firestore(),
    bob: env.authenticatedContext(BOB, { email: 'bob@exemplo.pt', email_verified: true, firebase: { sign_in_provider: 'password', identities: {} } }).firestore(),
    admin: env.authenticatedContext(ADMIN, { email: ADMIN_EMAIL, email_verified: true, firebase: { sign_in_provider: 'google.com', identities: {} } }).firestore(),
    fakeAdmin: env.authenticatedContext('fake_admin_uid_0000004', { email: ADMIN_EMAIL, email_verified: false, firebase: { sign_in_provider: 'password', identities: {} } }).firestore(),
    anonAdminEmail: env.authenticatedContext('anon_admin_uid_000005', { email: ADMIN_EMAIL, email_verified: true, firebase: { sign_in_provider: 'anonymous', identities: {} } }).firestore(),
    nobody: env.unauthenticatedContext().firestore(),
  };
}
async function seed(env, fn) { await env.withSecurityRulesDisabled(async c => fn(c.firestore())); }

before(async () => {
  envF = await initializeTestEnvironment({ projectId: 'demo-final', firestore: { rules: RULES_FINAL, host, port: +port } });
  envT = await initializeTestEnvironment({ projectId: 'demo-transicao', firestore: { rules: RULES_TRANS, host, port: +port } });
});
after(async () => { if (envF) await envF.cleanup(); if (envT) await envT.cleanup(); });
beforeEach(async () => {
  await envF.clearFirestore(); await envT.clearFirestore();
  ctx.F = users(envF); ctx.T = users(envT);
  // Estado de base: Alice e Bob registados há 1 minuto, com um post e uma mensagem do Bob
  for (const env of [envF, envT]) {
    await seed(env, async db => {
      for (const u of [ALICE, BOB, ADMIN, SEM_EMAIL]) await setDoc(doc(db, 'consent', u), { versao: '1.4', aceitouEm: tsAgo(60000), idade13: true, termos: true });
      for (const u of [ANON, SEM_EMAIL, SEM_TERMOS]) await setDoc(doc(db, 'utilizadores', u), registo(u, { criadoEm: tsAgo(60000) }));
      await setDoc(doc(db, 'utilizadores', ALICE), registo(ALICE, { criadoEm: tsAgo(60000) }));
      await setDoc(doc(db, 'utilizadores', BOB), registo(BOB, { nick: 'Bob', email: 'bob@exemplo.pt', anon: false, criadoEm: tsAgo(60000) }));
      await setDoc(doc(db, 'posts', 'postBob'), { uid: BOB, text: 'olá', img: '', ts: Date.now() - 5000, likes: {} });
      await setDoc(doc(db, 'canais', 'geral', 'msgs', 'msgBob'), { uid: BOB, text: 'olá turma', ts: Date.now() - 5000 });
    });
  }
});

// Publicar como a 1.8 faz: conteúdo + carimbo de ritmo no mesmo lote
function batchPost(db, uid, data, campo = 'ultimoPost', ref = doc(collection(db, 'posts'))) {
  const b = writeBatch(db);
  b.set(ref, data);
  b.set(doc(db, 'utilizadores', uid), { [campo]: serverTimestamp() }, { merge: true });
  return b.commit();
}

// =====================================================================
describe('Fluxos reais da app (devem passar)', () => {
  it('registo do utilizador: criação com criadoEm e batimento com merge', async () => {
    const db = ctx.F.alice;
    await seed(envF, async a => deleteDoc(doc(a, 'utilizadores', ALICE)));
    await assertSucceeds(setDoc(doc(db, 'utilizadores', ALICE), Object.assign(registo(ALICE), { criado: Date.now(), criadoEm: serverTimestamp() }), { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'utilizadores', ALICE), registo(ALICE, { turma: true, consent: { v: '1.0', em: Date.now() } }), { merge: true }));
    await assertSucceeds(getDoc(doc(db, 'utilizadores', ALICE)));
  });
  it('perfil: criar, subir XP no mesmo dia, sequência +1 noutro dia, descer sequência', async () => {
    const db = ctx.F.alice, r = doc(db, 'perfis', ALICE);
    await assertSucceeds(setDoc(r, perfil(120, { streak: 1, xpIni: 0, xpIniEm: serverTimestamp(), streakEm: serverTimestamp() })));
    await assertSucceeds(setDoc(r, perfil(240, { streak: 1 }), { merge: true }));          // +120, mesmo dia
    // Sequência: simula que o último aumento foi há 2 dias
    await seed(envF, async a => updateDoc(doc(a, 'perfis', ALICE), { streakEm: tsAgo(2 * DAY) }));
    await assertSucceeds(setDoc(r, perfil(250, { streak: 2, streakEm: serverTimestamp() }), { merge: true }));
    await assertSucceeds(setDoc(r, perfil(260, { streak: 0 }), { merge: true }));           // falhou um dia
  });
  it('perfil: primeiro envio de um dia novo recomeça o teto diário (xpIni = xp anterior)', async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(2900, { xpIni: 0, xpIniEm: tsAgo(2 * DAY) })));
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'perfis', ALICE), perfil(3100, { xpIni: 2900, xpIniEm: serverTimestamp() }), { merge: true }));
  });
  it('perfil: foto JPEG em base64 é aceite', async () => {
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'perfis', ALICE), perfil(0, { foto: JPEG, xpIni: 0, xpIniEm: serverTimestamp() })));
  });
  it('histórico: dia_, dia_0000-anteriores, notifs_lidas', async () => {
    const db = ctx.F.alice, base = 'data/users/' + ALICE + '/';
    const it1 = { ts: Date.now(), t: 1, tn: 'Hondt', tema: 'Eleições', q: 'q', esc: 'a', cert: 'a', ok: true, mode: 'tipo' };
    await assertSucceeds(setDoc(doc(db, base + 'dia_' + today()), { date: today(), goal: 15, items: [it1] }));
    await assertSucceeds(setDoc(doc(db, base + 'dia_0000-anteriores'), { date: '0000-anteriores', items: [it1] }));
    await assertSucceeds(setDoc(doc(db, base + 'notifs_lidas'), { ids: ['n1'], upd: serverTimestamp() }));
    await assertSucceeds(getDocs(collection(db, 'data/users/' + ALICE)));
    await assertSucceeds(getDocs(collection(ctx.F.admin, 'data/users/' + ALICE)));
  });
  it('mural: publicar (lote com ultimoPost), gostar, tirar gosto, comentar, apagar o seu', async () => {
    const db = ctx.F.alice, ref = doc(db, 'posts', 'postAlice');
    await assertSucceeds(batchPost(db, ALICE, { uid: ALICE, text: 'dica', img: JPEG, ts: Date.now(), likes: {} }, 'ultimoPost', ref));
    await assertSucceeds(updateDoc(doc(db, 'posts', 'postBob'), { ['likes.' + ALICE]: true }));
    await assertSucceeds(updateDoc(doc(db, 'posts', 'postBob'), { ['likes.' + ALICE]: deleteField() }));
    await assertSucceeds(batchPost(db, ALICE, { uid: ALICE, text: 'boa', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'posts/postBob/coments'))));
    await assertSucceeds(getDocs(query(collection(db, 'posts'), orderBy('ts', 'desc'), limit(40))));
    await assertSucceeds(deleteDoc(ref));
  });
  it('conversa: enviar mensagem (lote com ultimaMsg) e ler o canal', async () => {
    const db = ctx.F.alice;
    await assertSucceeds(batchPost(db, ALICE, { uid: ALICE, text: 'olá', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'canais/geral/msgs'))));
    await assertSucceeds(getDocs(query(collection(db, 'canais/geral/msgs'), orderBy('ts', 'desc'), limit(80))));
  });
  it('denúncias: mensagem e publicação, com motivo da lista', async () => {
    const db = ctx.F.alice;
    await assertSucceeds(addDoc(collection(db, 'denuncias'), { by: ALICE, tipo: 'msg', canal: 'geral', msg: 'msgBob', autor: BOB, text: 'olá turma', ts: Date.now(), motivo: 'ofensivo' }));
    await assertSucceeds(addDoc(collection(db, 'denuncias'), { by: ALICE, tipo: 'post', post: 'postBob', autor: BOB, text: 'olá', ts: Date.now(), motivo: 'spam' }));
    await assertSucceeds(getDocs(query(collection(ctx.F.admin, 'denuncias'), orderBy('ts', 'desc'), limit(60))));
  });
  it('consentimento: o próprio cria e atualiza; o admin lê', async () => {
    const r = doc(ctx.F.alice, 'consent', ALICE);
    await assertSucceeds(setDoc(r, { versao: '1.0', aceitouEm: serverTimestamp(), idade13: true, termos: true }));
    await assertSucceeds(setDoc(r, { versao: '1.1', aceitouEm: serverTimestamp(), idade13: true, termos: true }));
    await assertSucceeds(getDoc(r));
    await assertSucceeds(getDoc(doc(ctx.F.admin, 'consent', ALICE)));
  });
  it('administrador: avisos, auditoria, config/admin, config/app, banir', async () => {
    const A = ctx.F.admin;
    await assertSucceeds(setDoc(doc(A, 'notifs', 'n1'), { titulo: 'Teste amanhã', texto: 'Revê o Hondt.', alvo: 'todos', tipo: 'aviso', criadoEm: serverTimestamp(), por: ADMIN }));
    await assertSucceeds(setDoc(doc(A, 'notifs', 'n2'), { titulo: 'Para ti', texto: 'Olá', alvo: ALICE, tipo: 'turma', criadoEm: serverTimestamp(), por: ADMIN }));
    await assertSucceeds(addDoc(collection(A, 'audit'), { acao: 'banir', alvo: BOB, detalhe: 'spam', por: ADMIN, em: serverTimestamp() }));
    await assertSucceeds(getDocs(collection(A, 'audit')));
    await assertSucceeds(setDoc(doc(A, 'config', 'admin'), { pinHash: 'a'.repeat(64), salt: 'b'.repeat(32), atualizado: Date.now() }));
    await assertSucceeds(getDoc(doc(A, 'config', 'admin')));
    await assertSucceeds(setDoc(doc(A, 'config', 'app'), { reset: Date.now(), users: {}, por: ADMIN_EMAIL, em: new Date().toISOString() }));
    await assertSucceeds(setDoc(doc(A, 'config', 'app'), { users: { [BOB]: Date.now() } }, { merge: true }));
    await assertSucceeds(setDoc(doc(A, 'config', 'app'), { minVersion: '1.8.0', turmaHash: 'ab'.repeat(32) }, { merge: true }));
    await assertSucceeds(setDoc(doc(A, 'bans', BOB), { motivo: 'spam', por: ADMIN, em: serverTimestamp() }));
    await seed(envF, async a => setDoc(doc(a, 'perfis', BOB), perfil(100, { nick: 'Bob' })));
    await assertSucceeds(updateDoc(doc(A, 'perfis', BOB), { banned: true }));
    await assertSucceeds(deleteDoc(doc(A, 'posts', 'postBob')));
    await assertSucceeds(getDocs(collection(A, 'utilizadores')));
  });
  it('avisos: o utilizador lê os seus e os de todos com a consulta where(alvo in)', async () => {
    await seed(envF, async a => {
      await setDoc(doc(a, 'notifs', 'n1'), { titulo: 't', texto: 'x', alvo: 'todos', tipo: 'aviso', criadoEm: Timestamp.now(), por: ADMIN });
      await setDoc(doc(a, 'notifs', 'n2'), { titulo: 't', texto: 'x', alvo: ALICE, tipo: 'aviso', criadoEm: Timestamp.now(), por: ADMIN });
    });
    await assertSucceeds(getDocs(query(collection(ctx.F.alice, 'notifs'), where('alvo', 'in', ['todos', ALICE]))));
    await assertSucceeds(getDoc(doc(ctx.F.alice, 'notifs', 'n2')));
    await assertSucceeds(getDoc(doc(ctx.F.alice, 'config', 'app')));
  });
  it('apagar a própria conta: perfis, utilizadores, consent, data/users/*, posts, comentários e mensagens', async () => {
    await seed(envF, async a => {
      await setDoc(doc(a, 'perfis', ALICE), perfil(10));
      await setDoc(doc(a, 'consent', ALICE), { versao: '1.0', aceitouEm: Timestamp.now(), idade13: true, termos: true });
      await setDoc(doc(a, 'data/users/' + ALICE + '/dia_' + today()), { date: today(), items: [] });
      await setDoc(doc(a, 'posts', 'pA'), { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} });
      await setDoc(doc(a, 'posts/postBob/coments', 'cA'), { uid: ALICE, text: 'x', ts: Date.now() });
      await setDoc(doc(a, 'canais/geral/msgs', 'mA'), { uid: ALICE, text: 'x', ts: Date.now() });
    });
    const db = ctx.F.alice;
    const cs = await assertSucceeds(getDocs(query(collectionGroup(db, 'coments'), where('uid', '==', ALICE))));
    const ms = await assertSucceeds(getDocs(query(collectionGroup(db, 'msgs'), where('uid', '==', ALICE))));
    const ps = await assertSucceeds(getDocs(query(collection(db, 'posts'), where('uid', '==', ALICE))));
    // Como deleteMine() da 1.8: primeiro os comentários (também de outros) das minhas publicações
    await seed(envF, async a => setDoc(doc(a, 'posts/pA/coments', 'cB'), { uid: BOB, text: 'y', ts: Date.now() }));
    for (const d of (await getDocs(collection(db, 'posts/pA/coments'))).docs) await assertSucceeds(deleteDoc(d.ref));
    for (const d of [...cs.docs, ...ms.docs, ...ps.docs]) await assertSucceeds(deleteDoc(d.ref));
    await assertSucceeds(deleteDoc(doc(db, 'data/users/' + ALICE + '/dia_' + today())));
    await assertSucceeds(deleteDoc(doc(db, 'consent', ALICE)));
    await assertSucceeds(deleteDoc(doc(db, 'perfis', ALICE)));
    await assertSucceeds(deleteDoc(doc(db, 'utilizadores', ALICE)));
  });
});

// =====================================================================
describe('Avisos com a app fechada (v3.1)', () => {
  it('o próprio guarda, junta e tira o token do dispositivo', async () => {
    const r = doc(ctx.F.alice, 'data/users/' + ALICE + '/push');
    await assertSucceeds(setDoc(r, { toks: { dev000000001: 'tokA' }, upd: serverTimestamp() }, { merge: true }));
    await assertSucceeds(setDoc(r, { toks: { dev000000002: 'tokB' }, upd: serverTimestamp() }, { merge: true }));
    await assertSucceeds(updateDoc(r, { 'toks.dev000000001': deleteField(), upd: serverTimestamp() }));
    await assertSucceeds(getDoc(r));
  });
  it('ataques: outro utilizador, campo extra, sem carimbo, demasiados tokens', async () => {
    await assertFails(setDoc(doc(ctx.F.bob, 'data/users/' + ALICE + '/push'), { toks: { d: 't' }, upd: serverTimestamp() }));
    await assertFails(getDoc(doc(ctx.F.bob, 'data/users/' + ALICE + '/push')));
    const r = doc(ctx.F.alice, 'data/users/' + ALICE + '/push');
    await assertFails(setDoc(r, { toks: { d: 't' }, upd: serverTimestamp(), admin: true }));
    await assertFails(setDoc(r, { toks: { d: 't' }, upd: Date.now() }));
    const many = {}; for (let i = 0; i < 7; i++) many['dev' + i] = 't' + i;
    await assertFails(setDoc(r, { toks: many, upd: serverTimestamp() }));
  });
});

describe('Pontos, ligas e prémios (v3.2)', () => {
  beforeEach(async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(500, { streak: 3, wxp: 50, xpIni: 400, xpIniEm: Timestamp.now(), streakEm: Timestamp.now() })));
  });
  it('XP da semana corrigido em parcelas sem o total mudar (dispositivo atrasado)', async () => {
    await seed(envF, d => updateDoc(doc(d, 'perfis', ALICE), { wxp: 300 }));
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'perfis', ALICE), perfil(500, { streak: 3, wxp: 480 }), { merge: true }));
  });
  it('XP do mês e por tema', async () => {
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'perfis', ALICE), perfil(600, { streak: 3, wxp: 150, mxp: 200, mk: '2026-11', tx: { 'Eleições': 300, 'Partilha': 100, 'Finanças': 200 } }), { merge: true }));
  });
  it('semana nova: copia a semana anterior tal como estava (pwk/pwxp) e a semana não anda para trás', async () => {
    const prev = mondayUTC(Date.now() - 7 * 864e5);
    await seed(envF, d => updateDoc(doc(d, 'perfis', ALICE), { wk: prev, wxp: 120 }));
    const r = doc(ctx.F.alice, 'perfis', ALICE);
    // copiar com outro valor falha; copiar certo passa
    await assertFails(setDoc(r, perfil(520, { streak: 3, wxp: 20, pwk: prev, pwxp: 999 }), { merge: true }));
    await assertSucceeds(setDoc(r, perfil(520, { streak: 3, wxp: 20, pwk: prev, pwxp: 120 }), { merge: true }));
    // depois já não se mexe na cópia, e a semana não volta atrás
    await assertFails(setDoc(r, perfil(530, { streak: 3, wxp: 30, pwxp: 500 }), { merge: true }));
    await assertFails(setDoc(r, perfil(530, { streak: 3, wxp: 30, wk: prev }), { merge: true }));
    await assertSucceeds(setDoc(r, perfil(530, { streak: 3, wxp: 30 }), { merge: true }));
  });
  it('ligas e prémios: todos leem; o próprio apaga os seus prémios', async () => {
    await seed(envF, async a => { await setDoc(doc(a, 'config/ligas'), { semana: '2026-11-02', grupos: {} }); await setDoc(doc(a, 'premios/' + ALICE), { moedas: 30 }); });
    await assertSucceeds(getDoc(doc(ctx.F.bob, 'config/ligas')));
    await assertSucceeds(getDoc(doc(ctx.F.bob, 'premios/' + ALICE)));
    await assertFails(deleteDoc(doc(ctx.F.bob, 'premios/' + ALICE)));
    await assertSucceeds(deleteDoc(doc(ctx.F.alice, 'premios/' + ALICE)));
  });
});

describe('Ataques (devem falhar)', () => {
  beforeEach(async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(500, { streak: 3, xpIni: 400, xpIniEm: Timestamp.now(), streakEm: Timestamp.now() })));
  });
  const r = () => doc(ctx.F.alice, 'perfis', ALICE);

  it('perfil com campo extra', async () => {
    await assertFails(setDoc(r(), perfil(500, { streak: 3, admin: true }), { merge: true }));
  });
  it('XP a descer', async () => {
    await assertFails(setDoc(r(), perfil(400, { streak: 3 }), { merge: true }));
  });
  it('XP absurdo (+1000 numa escrita)', async () => {
    await assertFails(setDoc(r(), perfil(1500, { streak: 3 }), { merge: true }));
  });
  it('XP acima do teto diário de 5000 (em várias escritas de +250)', async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(5300, { xpIni: 400, xpIniEm: Timestamp.now() })));
    await assertFails(setDoc(r(), perfil(5550), { merge: true }));
  });
  it('xpIni falsificado no mesmo dia', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, xpIni: 600 }), { merge: true }));
  });
  it('nível que não corresponde ao XP', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, nivel: 9 }), { merge: true }));
  });
  it('XP semanal ou do mês acima do XP total', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, wxp: 700 }), { merge: true }));
    await assertFails(setDoc(r(), perfil(600, { streak: 3, mxp: 700, mk: '2026-11' }), { merge: true }));
  });
  it('mês mal escrito e tema desconhecido', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, mxp: 10, mk: 'nov' }), { merge: true }));
    await assertFails(setDoc(r(), perfil(600, { streak: 3, tx: { Hacks: 5 } }), { merge: true }));
  });
  it('ligas e prémios: o aluno não escreve', async () => {
    await assertFails(setDoc(doc(ctx.F.alice, 'config/ligas'), { semana: 'x' }));
    await assertFails(setDoc(doc(ctx.F.alice, 'premios/' + ALICE), { moedas: 999 }));
    await assertFails(setDoc(doc(ctx.F.admin, 'premios/' + ALICE), { moedas: 999 }));
  });
  it('sequência +1 no mesmo dia e +2 de uma vez', async () => {
    await assertFails(setDoc(r(), perfil(510, { streak: 4, streakEm: serverTimestamp() }), { merge: true }));
    await seed(envF, async a => updateDoc(doc(a, 'perfis', ALICE), { streakEm: tsAgo(2 * DAY) }));
    await assertFails(setDoc(r(), perfil(510, { streak: 5, streakEm: serverTimestamp() }), { merge: true }));
  });
  it('tipos errados no perfil (nick número, cor 99, foto SVG, foto javascript:)', async () => {
    await assertFails(setDoc(r(), perfil(500, { streak: 3, nick: 123 }), { merge: true }));
    await assertFails(setDoc(r(), perfil(500, { streak: 3, cor: 99 }), { merge: true }));
    await assertFails(setDoc(r(), perfil(500, { streak: 3, nivel: '<img src=x onerror=alert(1)>' }), { merge: true }));
    await assertFails(setDoc(r(), perfil(500, { streak: 3, foto: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }), { merge: true }));
    await assertFails(setDoc(r(), perfil(500, { streak: 3, foto: 'javascript:alert(1)' }), { merge: true }));
  });
  it('criar perfil com XP inicial absurdo', async () => {
    await seed(envF, async a => deleteDoc(doc(a, 'perfis', ALICE)));
    await assertFails(setDoc(r(), perfil(5000, { xpIni: 0, xpIniEm: serverTimestamp() })));
  });
  it('escrever o perfil de outro utilizador', async () => {
    await assertFails(setDoc(doc(ctx.F.bob, 'perfis', ALICE), perfil(0, { xpIni: 0, xpIniEm: serverTimestamp() })));
  });
  it('banido: não publica, não comenta, não envia mensagens, não denuncia', async () => {
    await seed(envF, async a => setDoc(doc(a, 'bans', ALICE), { motivo: 'spam', por: ADMIN, em: Timestamp.now() }));
    const db = ctx.F.alice;
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'posts/postBob/coments'))));
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'canais/geral/msgs'))));
    await assertFails(addDoc(collection(db, 'denuncias'), { by: ALICE, tipo: 'post', post: 'postBob', autor: BOB, text: 'x', ts: Date.now(), motivo: 'spam' }));
  });
  it('banido por perfis.banned: não publica e não pode tirar o banimento', async () => {
    await seed(envF, async a => updateDoc(doc(a, 'perfis', ALICE), { banned: true }));
    const db = ctx.F.alice;
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await assertFails(updateDoc(r(), { banned: false }));
    await assertFails(setDoc(r(), perfil(500, { streak: 3 })));   // set sem merge apagaria 'banned'
  });
  it('anónimo e utilizador comum a ler config/admin; admin falso', async () => {
    await seed(envF, async a => setDoc(doc(a, 'config', 'admin'), { pinHash: 'x', salt: 'y', atualizado: 1 }));
    await assertFails(getDoc(doc(ctx.F.alice, 'config', 'admin')));
    await assertFails(getDoc(doc(ctx.F.bob, 'config', 'admin')));
    await assertFails(getDoc(doc(ctx.F.nobody, 'config', 'admin')));
    await assertFails(getDoc(doc(ctx.F.fakeAdmin, 'config', 'admin')));
    await assertFails(getDoc(doc(ctx.F.anonAdminEmail, 'config', 'admin')));
    await assertFails(setDoc(doc(ctx.F.alice, 'config', 'app'), { minVersion: '0.0.1' }, { merge: true }));
    await assertFails(getDoc(doc(ctx.F.nobody, 'config', 'app')));
  });
  it('auditoria: utilizador não cria nem lê; ninguém edita nem apaga', async () => {
    await seed(envF, async a => setDoc(doc(a, 'audit', 'a1'), { acao: 'x', por: ADMIN, em: Timestamp.now() }));
    await assertFails(addDoc(collection(ctx.F.alice, 'audit'), { acao: 'x', por: ALICE, em: serverTimestamp() }));
    await assertFails(getDoc(doc(ctx.F.alice, 'audit', 'a1')));
    await assertFails(updateDoc(doc(ctx.F.alice, 'audit', 'a1'), { acao: 'y' }));
    await assertFails(updateDoc(doc(ctx.F.admin, 'audit', 'a1'), { acao: 'y' }));
    await assertFails(deleteDoc(doc(ctx.F.admin, 'audit', 'a1')));
  });
  it('datas falsas: post no futuro, consentimento e aviso com data do cliente', async () => {
    const db = ctx.F.alice;
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'fixo no topo', img: '', ts: Date.now() + 365 * DAY, likes: {} }));
    await assertFails(setDoc(doc(db, 'consent', ALICE), { versao: '1.0', aceitouEm: Timestamp.fromMillis(Date.UTC(2020, 0, 1)), idade13: true, termos: true }));
    await assertFails(setDoc(doc(ctx.F.admin, 'notifs', 'n9'), { titulo: 't', texto: 'x', alvo: 'todos', tipo: 'aviso', criadoEm: Timestamp.fromMillis(Date.UTC(2030, 0, 1)), por: ADMIN }));
    await assertFails(addDoc(collection(ctx.F.admin, 'audit'), { acao: 'x', por: ADMIN, em: tsAgo(DAY) }));
  });
  it('ritmo: post sem lote, e segundo post 0 s depois do anterior', async () => {
    const db = ctx.F.alice;
    await assertFails(addDoc(collection(db, 'posts'), { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await seed(envF, async a => updateDoc(doc(a, 'utilizadores', ALICE), { ultimoPost: Timestamp.now() }));
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await assertFails(setDoc(doc(db, 'utilizadores', ALICE), { ultimoPost: tsAgo(DAY) }, { merge: true }));   // recuar o carimbo
    await assertFails(updateDoc(doc(db, 'utilizadores', ALICE), { ultimoPost: deleteField() }));            // apagar o carimbo
  });
  it('mural: campos extra, post em nome de outro, gosto em nome de outro, imagem SVG', async () => {
    const db = ctx.F.alice;
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {}, pinned: true }));
    await assertFails(batchPost(db, ALICE, { uid: BOB, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: '', img: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', ts: Date.now(), likes: {} }));
    await assertFails(updateDoc(doc(db, 'posts', 'postBob'), { ['likes.' + BOB]: true }));
    await assertFails(updateDoc(doc(db, 'posts', 'postBob'), { text: 'editado' }));
    await assertFails(deleteDoc(doc(db, 'posts', 'postBob')));
    await seed(envF, async a => setDoc(doc(a, 'posts/postBob/coments', 'cB'), { uid: BOB, text: 'y', ts: Date.now() }));
    await assertFails(deleteDoc(doc(db, 'posts/postBob/coments', 'cB')));   // nem autora nem dona da publicação
    await assertFails(deleteDoc(doc(db, 'canais/geral/msgs', 'msgBob')));
  });
  it('conversa: canal inexistente e texto vazio', async () => {
    const db = ctx.F.alice;
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: 'x', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'canais/secreto/msgs'))));
    await assertFails(batchPost(db, ALICE, { uid: ALICE, text: '', ts: Date.now() }, 'ultimaMsg', doc(collection(db, 'canais/geral/msgs'))));
  });
  it('denúncias: motivo fora da lista, autor falso, em nome de outro, sem motivo (fora da transição)', async () => {
    const db = ctx.F.alice, c = collection(db, 'denuncias');
    await assertFails(addDoc(c, { by: ALICE, tipo: 'post', post: 'postBob', autor: BOB, text: 'x', ts: Date.now(), motivo: 'nao gosto' }));
    await assertFails(addDoc(c, { by: ALICE, tipo: 'post', post: 'postBob', autor: ADMIN, text: 'x', ts: Date.now(), motivo: 'spam' }));
    await assertFails(addDoc(c, { by: BOB, tipo: 'post', post: 'postBob', autor: BOB, text: 'x', ts: Date.now(), motivo: 'spam' }));
    await assertFails(addDoc(c, { by: ALICE, canal: 'geral', msg: 'msgBob', autor: BOB, text: 'x', ts: Date.now() }));
    await assertFails(getDocs(c));
  });
  it('registo: email falso e campo extra', async () => {
    await assertFails(setDoc(doc(ctx.F.alice, 'utilizadores', ALICE), registo(ALICE, { email: ADMIN_EMAIL }), { merge: true }));
    await assertFails(setDoc(doc(ctx.F.alice, 'utilizadores', ALICE), registo(ALICE, { role: 'admin' }), { merge: true }));
    await assertFails(getDocs(collection(ctx.F.alice, 'utilizadores')));
  });
  it('histórico: id de documento inventado, mais de 400 itens, ler o de outro', async () => {
    const db = ctx.F.alice, base = 'data/users/' + ALICE + '/';
    await assertFails(setDoc(doc(db, base + 'qualquer'), { a: 1 }));
    await assertFails(setDoc(doc(db, base + 'dia_' + today()), { date: today(), items: new Array(401).fill(0) }));
    await assertFails(setDoc(doc(db, base + 'dia_' + today()), { date: '1999-01-01', items: [] }));
    await assertFails(getDocs(collection(ctx.F.bob, 'data/users/' + ALICE)));
  });
  it('avisos: utilizador não cria; não lê os de outro uid', async () => {
    await seed(envF, async a => setDoc(doc(a, 'notifs', 'nb'), { titulo: 't', texto: 'x', alvo: BOB, tipo: 'aviso', criadoEm: Timestamp.now(), por: ADMIN }));
    await assertFails(setDoc(doc(ctx.F.alice, 'notifs', 'n1'), { titulo: 't', texto: 'x', alvo: 'todos', tipo: 'aviso', criadoEm: serverTimestamp(), por: ALICE }));
    await assertFails(getDoc(doc(ctx.F.alice, 'notifs', 'nb')));
    await assertFails(getDocs(collection(ctx.F.alice, 'notifs')));   // consulta sem filtro de alvo
    await assertFails(setDoc(doc(ctx.F.admin, 'notifs', 'n3'), { titulo: 'x'.repeat(81), texto: 'x', alvo: 'todos', tipo: 'aviso', criadoEm: serverTimestamp(), por: ADMIN }));
  });
  it('consentimento de outro e campo extra', async () => {
    await assertFails(setDoc(doc(ctx.F.bob, 'consent', ALICE), { versao: '1.0', aceitouEm: serverTimestamp(), idade13: true, termos: true }));
    await assertFails(setDoc(doc(ctx.F.alice, 'consent', ALICE), { versao: '1.0', aceitouEm: serverTimestamp(), idade13: true, termos: true, extra: 1 }));
    await assertFails(getDoc(doc(ctx.F.bob, 'consent', ALICE)));
  });
  it('não autenticado não lê nada', async () => {
    await assertFails(getDoc(doc(ctx.F.nobody, 'posts', 'postBob')));
    await assertFails(getDocs(collection(ctx.F.nobody, 'perfis')));
  });
});


// =====================================================================
describe('Privacidade e contas (v4)', () => {
  const publico = [['perfis', ALICE], ['posts', 'postBob'], ['grupos', 'g_abcdef'], ['salas', 'sala1'], ['premios', BOB]];
  beforeEach(async () => {
    await seed(envF, async db => {
      await setDoc(doc(db, 'perfis', ALICE), perfil(100, { nick: 'Alice' }));
      await setDoc(doc(db, 'perfis', BOB), perfil(100, { nick: 'Bob' }));
      await setDoc(doc(db, 'grupos', 'g_abcdef'), { nome: 'Estudo', dono: BOB, membros: { [BOB]: true }, ts: Timestamp.now() });
      await setDoc(doc(db, 'canais', 'g_abcdef', 'msgs', 'segredo'), { uid: BOB, text: 'só para o grupo', ts: Date.now() - 1000 });
      await setDoc(doc(db, 'salas', 'sala1'), { nome: 'Sala', dono: BOB, membros: { [BOB]: 1 }, fim: Date.now(), min: 25, ts: Timestamp.now() });
      await setDoc(doc(db, 'premios', BOB), { moedas: 10 });
    });
  });

  it('conta anónima não lê perfis, mural, canais, grupos, salas nem prémios', async () => {
    const db = ctx.F.anon;
    for (const [c, id] of publico) await assertFails(getDoc(doc(db, c, id)));
    await assertFails(getDocs(query(collection(db, 'perfis'), limit(5))));
    await assertFails(getDocs(query(collection(db, 'posts'), limit(5))));
    await assertFails(getDocs(query(collection(db, 'canais', 'geral', 'msgs'), limit(5))));
  });

  it('sem sessão não se lê nada da comunidade', async () => {
    const db = ctx.F.nobody;
    for (const [c, id] of publico) await assertFails(getDoc(doc(db, c, id)));
  });

  it('conta com email por confirmar não lê a comunidade, mas lê o próprio perfil', async () => {
    const db = ctx.F.semEmail;
    await assertFails(getDoc(doc(db, 'posts', 'postBob')));
    await assertFails(getDoc(doc(db, 'perfis', BOB)));
    await seed(envF, d => setDoc(doc(d, 'perfis', SEM_EMAIL), perfil(10, { nick: 'Novo' })));
    await assertSucceeds(getDoc(doc(db, 'perfis', SEM_EMAIL)));
  });

  it('conta confirmada lê o mural, os canais públicos e os perfis', async () => {
    const db = ctx.F.alice;
    await assertSucceeds(getDoc(doc(db, 'posts', 'postBob')));
    await assertSucceeds(getDocs(query(collection(db, 'perfis'), limit(5))));
    await assertSucceeds(getDocs(query(collection(db, 'canais', 'geral', 'msgs'), limit(5))));
  });

  it('o grupo só é lido pelos membros', async () => {
    await assertFails(getDocs(query(collection(ctx.F.alice, 'canais', 'g_abcdef', 'msgs'), limit(5))));
    await assertSucceeds(getDocs(query(collection(ctx.F.bob, 'canais', 'g_abcdef', 'msgs'), limit(5))));
  });

  it('os grupos não se listam: só quem tem o código abre o grupo e entra', async () => {
    await assertFails(getDocs(query(collection(ctx.F.alice, 'grupos'), limit(5))));
    assert.equal((await assertSucceeds(getDocs(query(collection(ctx.F.alice, 'grupos'), where(`membros.${ALICE}`, '==', true))))).size, 0);
    assert.equal((await assertSucceeds(getDocs(query(collection(ctx.F.bob, 'grupos'), where(`membros.${BOB}`, '==', true))))).size, 1);
    await assertSucceeds(getDoc(doc(ctx.F.alice, 'grupos', 'g_abcdef')));
    await assertFails(getDoc(doc(ctx.F.anon, 'grupos', 'g_abcdef')));
    await assertSucceeds(updateDoc(doc(ctx.F.alice, 'grupos', 'g_abcdef'), { [`membros.${ALICE}`]: true }));
    await assertSucceeds(getDocs(query(collection(ctx.F.alice, 'canais', 'g_abcdef', 'msgs'), limit(5))));
  });

  it('o dono tira alguém do grupo; os outros não, e o dono não acrescenta ninguém', async () => {
    await seed(envF, d => setDoc(doc(d, 'grupos', 'g_tres0000'), { nome: 'Três', dono: BOB, membros: { [BOB]: true, [ALICE]: true, [ADMIN]: true }, ts: Timestamp.now() }));
    await assertFails(updateDoc(doc(ctx.F.alice, 'grupos', 'g_tres0000'), { [`membros.${ADMIN}`]: deleteField() }));
    await assertFails(updateDoc(doc(ctx.F.bob, 'grupos', 'g_abcdef'), { [`membros.${ALICE}`]: true }));
    await assertSucceeds(updateDoc(doc(ctx.F.bob, 'grupos', 'g_tres0000'), { [`membros.${ALICE}`]: deleteField() }));
  });

  it('quem é tirado do grupo não volta a entrar com o código, até o dono o deixar voltar', async () => {
    await seed(envF, d => setDoc(doc(d, 'grupos', 'g_expulsao0000'), { nome: 'Expulsão', dono: BOB, membros: { [BOB]: true, [ALICE]: true }, ts: Timestamp.now() }));
    const g = (db) => doc(db, 'grupos', 'g_expulsao0000');
    // só o dono põe alguém na lista de expulsos
    await assertFails(updateDoc(g(ctx.F.alice), { [`expulsos.${ADMIN}`]: true }));
    await assertSucceeds(updateDoc(g(ctx.F.bob), { [`membros.${ALICE}`]: deleteField(), [`expulsos.${ALICE}`]: true }));
    // a Alice já não entra com o código nem mexe na lista
    await assertFails(updateDoc(g(ctx.F.alice), { [`membros.${ALICE}`]: true }));
    await assertFails(updateDoc(g(ctx.F.alice), { [`expulsos.${ALICE}`]: deleteField() }));
    await assertFails(updateDoc(g(ctx.F.alice), { [`membros.${ALICE}`]: true, [`expulsos.${ALICE}`]: deleteField() }));
    // o dono não se expulsa a si próprio nem acrescenta membros
    await assertFails(updateDoc(g(ctx.F.bob), { [`expulsos.${BOB}`]: true }));
    await assertFails(updateDoc(g(ctx.F.bob), { [`membros.${ALICE}`]: true }));
    // o dono deixa-a voltar
    await assertSucceeds(updateDoc(g(ctx.F.bob), { [`expulsos.${ALICE}`]: deleteField() }));
    await assertSucceeds(updateDoc(g(ctx.F.alice), { [`membros.${ALICE}`]: true }));
  });

  it('os grupos novos têm um código comprido', async () => {
    const g = id => batchPost(ctx.F.alice, ALICE, { nome: 'Grupo', dono: ALICE, membros: { [ALICE]: true }, ts: serverTimestamp() }, 'ultimoPost', doc(ctx.F.alice, 'grupos', id));
    await assertFails(g('g_curto'));
    await assertSucceeds(g('g_abcdefghjkmnpqrs'));
  });

  it('uma consulta geral às mensagens só devolve as da própria pessoa', async () => {
    await assertFails(getDocs(query(collectionGroup(ctx.F.alice, 'msgs'), limit(5))));
    await assertFails(getDocs(query(collectionGroup(ctx.F.alice, 'msgs'), where('uid', '==', BOB))));
    await assertSucceeds(getDocs(query(collectionGroup(ctx.F.alice, 'msgs'), where('uid', '==', ALICE))));
  });

  it('não se publica sem conta confirmada nem sem aceitar os termos', async () => {
    const post = uid => ({ uid, text: 'olá', img: '', ts: Date.now(), likes: {} });
    await assertFails(batchPost(ctx.F.anon, ANON, post(ANON)));
    await assertFails(batchPost(ctx.F.semEmail, SEM_EMAIL, post(SEM_EMAIL)));
    await assertFails(batchPost(ctx.F.semTermos, SEM_TERMOS, post(SEM_TERMOS)));
    await assertFails(setDoc(doc(ctx.F.anon, 'perfis', ANON), perfil(10, { nick: 'Anon', xpIni: 0, xpIniEm: serverTimestamp() })));
  });

  it('uma suspensão impede publicar e acaba na data marcada', async () => {
    const post = () => ({ uid: ALICE, text: 'olá', img: '', ts: Date.now(), likes: {} });
    await seed(envF, d => setDoc(doc(d, 'bans', ALICE), { motivo: 'x', por: ADMIN, em: Timestamp.now(), ate: Timestamp.fromMillis(Date.now() + DAY) }));
    await assertFails(batchPost(ctx.F.alice, ALICE, post()));
    await seed(envF, d => setDoc(doc(d, 'bans', ALICE), { motivo: 'x', por: ADMIN, em: tsAgo(2 * DAY), ate: tsAgo(DAY) }));
    await assertSucceeds(batchPost(ctx.F.alice, ALICE, post()));
  });

  it('a suspensão definitiva por email vale para outra conta com o mesmo email', async () => {
    await seed(envF, d => setDoc(doc(d, 'bansEmail', 'alice@exemplo.pt'), { por: ADMIN, em: Timestamp.now() }));
    await assertFails(batchPost(ctx.F.alice, ALICE, { uid: ALICE, text: 'olá', img: '', ts: Date.now(), likes: {} }));
  });

  it('só o administrador suspende', async () => {
    const corpo = uid => ({ motivo: 'x', por: uid, em: serverTimestamp(), ate: Timestamp.fromMillis(Date.now() + DAY) });
    await assertFails(setDoc(doc(ctx.F.bob, 'bans', ALICE), corpo(BOB)));
    await assertFails(setDoc(doc(ctx.F.bob, 'bansEmail', 'alice@exemplo.pt'), { por: BOB, em: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(ctx.F.admin, 'bans', ALICE), corpo(ADMIN)));
    await assertSucceeds(setDoc(doc(ctx.F.admin, 'bansEmail', 'alice@exemplo.pt'), { por: ADMIN, em: serverTimestamp() }));
  });

  it('a conversa com o tutor e o registo de atividade já não se guardam, mas apagam-se', async () => {
    const db = ctx.F.alice;
    await assertFails(setDoc(doc(db, 'data', 'users', ALICE, 'tutor'), { msgs: [{ r: 'u', t: 'olá' }], upd: Date.now() }));
    await assertFails(setDoc(doc(db, 'data', 'users', ALICE, 'log_' + today()), { date: today(), ev: [] }));
    await seed(envF, d => setDoc(doc(d, 'data', 'users', ALICE, 'tutor'), { msgs: [], upd: 1 }));
    await assertSucceeds(deleteDoc(doc(db, 'data', 'users', ALICE, 'tutor')));
  });

  it('a lista de bloqueios é só da própria pessoa', async () => {
    const corpo = { ids: [BOB], upd: serverTimestamp() };
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'data', 'users', ALICE, 'bloqueios'), corpo));
    await assertFails(getDoc(doc(ctx.F.bob, 'data', 'users', ALICE, 'bloqueios')));
    await assertFails(setDoc(doc(ctx.F.bob, 'data', 'users', ALICE, 'bloqueios'), corpo));
  });

  it('os erros têm id próprio e no máximo 10 por dia', async () => {
    const e = { by: ALICE, msg: 'erro', ts: Date.now() };
    const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await assertSucceeds(setDoc(doc(ctx.F.alice, 'erros', ALICE + '_' + hoje + '_0'), e));
    await assertFails(setDoc(doc(ctx.F.alice, 'erros', ALICE + '_' + hoje + '_10'), e));
    await assertFails(setDoc(doc(ctx.F.alice, 'erros', BOB + '_' + hoje + '_0'), e));
    await assertFails(addDoc(collection(ctx.F.alice, 'erros'), e));
    await assertFails(setDoc(doc(ctx.F.anon, 'erros', ANON + '_' + hoje + '_0'), { by: ANON, msg: 'erro', ts: Date.now() }));
  });

  it('apagar a conta: uma conta por confirmar encontra e apaga o que é seu e sai de grupos e salas', async () => {
    const db = ctx.F.semEmail;
    await seed(envF, async d => {
      await setDoc(doc(d, 'posts', 'dela'), { uid: SEM_EMAIL, text: 'x', img: '', ts: Date.now(), likes: { [SEM_EMAIL]: true } });
      await setDoc(doc(d, 'posts', 'dela', 'coments', 'c1'), { uid: BOB, text: 'y', ts: Date.now() });
      await setDoc(doc(d, 'grupos', 'g_comela'), { nome: 'Com ela', dono: BOB, membros: { [BOB]: true, [SEM_EMAIL]: true }, ts: Timestamp.now() });
      await setDoc(doc(d, 'grupos', 'g_delaaa'), { nome: 'Dela', dono: SEM_EMAIL, membros: { [SEM_EMAIL]: true }, ts: Timestamp.now() });
      await setDoc(doc(d, 'salas', 'salaDela'), { nome: 'Dela', dono: SEM_EMAIL, membros: { [SEM_EMAIL]: 1 }, fim: Date.now(), min: 25, ts: Timestamp.now() });
    });
    const meus = await assertSucceeds(getDocs(query(collection(db, 'posts'), where('uid', '==', SEM_EMAIL))));
    assert.equal(meus.size, 1);
    await assertSucceeds(getDocs(collection(db, 'posts', 'dela', 'coments')));
    await assertSucceeds(updateDoc(doc(db, 'posts', 'dela'), { [`likes.${SEM_EMAIL}`]: deleteField() }));
    await assertSucceeds(deleteDoc(doc(db, 'posts', 'dela', 'coments', 'c1')));
    await assertSucceeds(deleteDoc(doc(db, 'posts', 'dela')));
    assert.equal((await assertSucceeds(getDocs(query(collection(db, 'grupos'), where(`membros.${SEM_EMAIL}`, '==', true))))).size, 2);
    await assertSucceeds(updateDoc(doc(db, 'grupos', 'g_comela'), { [`membros.${SEM_EMAIL}`]: deleteField() }));
    await assertSucceeds(updateDoc(doc(db, 'grupos', 'g_delaaa'), { apagado: true, membros: {} }));
    await assertSucceeds(deleteDoc(doc(db, 'salas', 'salaDela')));
    await assertFails(getDocs(query(collection(db, 'posts'), limit(5))));
  });

  it('uma conta suspensa consegue retirar-se de grupos, salas, gostos e reações, mas não entrar', async () => {
    await seed(envF, async d => {
      await setDoc(doc(d, 'bans', ALICE), { motivo: 'x', por: ADMIN, em: Timestamp.now() });
      await setDoc(doc(d, 'grupos', 'g_comalice'), { nome: 'Com Alice', dono: BOB, membros: { [BOB]: true, [ALICE]: true }, ts: Timestamp.now() });
      await setDoc(doc(d, 'salas', 'salaA'), { nome: 'Sala', dono: BOB, membros: { [BOB]: 1, [ALICE]: 1 }, fim: Date.now(), min: 25, ts: Timestamp.now() });
      await setDoc(doc(d, 'posts', 'comA'), { uid: BOB, text: 'x', img: '', ts: Date.now(), likes: { [ALICE]: true }, reac: { [ALICE]: 'gosto' } });
    });
    const db = ctx.F.alice;
    await assertSucceeds(updateDoc(doc(db, 'grupos', 'g_comalice'), { [`membros.${ALICE}`]: deleteField() }));
    await assertFails(updateDoc(doc(db, 'grupos', 'g_abcdef'), { [`membros.${ALICE}`]: true }));
    await assertSucceeds(updateDoc(doc(db, 'salas', 'salaA'), { [`membros.${ALICE}`]: deleteField() }));
    await assertFails(updateDoc(doc(db, 'salas', 'sala1'), { [`membros.${ALICE}`]: 1 }));
    await assertSucceeds(updateDoc(doc(db, 'posts', 'comA'), { [`likes.${ALICE}`]: deleteField() }));
    await assertFails(updateDoc(doc(db, 'posts', 'comA'), { [`likes.${ALICE}`]: true }));
    await assertSucceeds(updateDoc(doc(db, 'posts', 'comA'), { [`reac.${ALICE}`]: deleteField() }));
  });

  it('por confirmar, sem termos ou suspenso não muda o nome, a foto nem a bio, mas continua a somar XP', async () => {
    await seed(envF, async d => {
      await setDoc(doc(d, 'perfis', SEM_EMAIL), perfil(100, { nick: 'Novo', xpIni: 100, xpIniEm: Timestamp.now() }));
      await setDoc(doc(d, 'perfis', SEM_TERMOS), perfil(100, { nick: 'Sem', xpIni: 100, xpIniEm: Timestamp.now() }));
      await setDoc(doc(d, 'bans', BOB), { motivo: 'x', por: ADMIN, em: Timestamp.now() });
      await setDoc(doc(d, 'perfis', ALICE), perfil(100, { nick: 'Alice', xpIni: 100, xpIniEm: Timestamp.now() }));
    });
    const r = (db, u) => doc(db, 'perfis', u);
    await assertFails(setDoc(r(ctx.F.semEmail, SEM_EMAIL), { nick: 'INSULTO' }, { merge: true }));
    await assertFails(setDoc(r(ctx.F.semEmail, SEM_EMAIL), { bio: 'liga 912345678' }, { merge: true }));
    await assertFails(setDoc(r(ctx.F.semTermos, SEM_TERMOS), { nick: 'INSULTO' }, { merge: true }));
    await assertFails(setDoc(r(ctx.F.bob, BOB), { nick: 'INSULTO' }, { merge: true }));
    await assertSucceeds(setDoc(r(ctx.F.semEmail, SEM_EMAIL), { xp: 110, wxp: 110, upd: Date.now() }, { merge: true }));
    await assertSucceeds(setDoc(r(ctx.F.alice, ALICE), { nick: 'Alice Nova' }, { merge: true }));
    await seed(envF, d => deleteDoc(doc(d, 'perfis', SEM_TERMOS)));
    await assertFails(setDoc(r(ctx.F.semTermos, SEM_TERMOS), perfil(10, { nick: 'Sem', xpIni: 0, xpIniEm: serverTimestamp() })));
  });

  it('o perfil recusa tipos errados nos textos', async () => {
    const r = doc(ctx.F.alice, 'perfis', ALICE);
    await assertFails(setDoc(r, { bio: ['lista'] }, { merge: true }));
    await assertFails(setDoc(r, { curso: { a: 1 } }, { merge: true }));
    await assertFails(setDoc(r, { sent: 'x'.repeat(5000) }, { merge: true }));
  });

  it('um grupo apagado não se recria para ler as mensagens antigas, e nem o administrador lê grupos alheios', async () => {
    await assertSucceeds(updateDoc(doc(ctx.F.bob, 'grupos', 'g_abcdef'), { apagado: true, membros: {} }));
    await assertFails(setDoc(doc(ctx.F.alice, 'grupos', 'g_abcdef'), { nome: 'Outro', dono: ALICE, membros: { [ALICE]: true }, ts: serverTimestamp() }));
    await assertFails(updateDoc(doc(ctx.F.alice, 'grupos', 'g_abcdef'), { [`membros.${ALICE}`]: true }));
    await assertFails(getDocs(query(collection(ctx.F.alice, 'canais', 'g_abcdef', 'msgs'), limit(5))));
    await assertFails(deleteDoc(doc(ctx.F.bob, 'grupos', 'g_abcdef')));
    await assertFails(getDocs(query(collection(ctx.F.admin, 'canais', 'g_abcdef', 'msgs'), limit(5))));
    await assertSucceeds(getDocs(query(collection(ctx.F.admin, 'canais', 'geral', 'msgs'), limit(5))));
  });

  it('uma conta suspensa recusa um duelo, mas não aceita nem joga', async () => {
    const duelo = estado => ({ a: ALICE, b: BOB, nA: 'A', nB: 'B', seed: 1, estado, ra: -1, rb: -1, ts: Timestamp.now() });
    await seed(envF, async d => {
      await setDoc(doc(d, 'bans', BOB), { motivo: 'x', por: ADMIN, em: Timestamp.now() });
      await setDoc(doc(d, 'duelos', 'd1'), duelo('pendente'));
      await setDoc(doc(d, 'duelos', 'd2'), duelo('pendente'));
      await setDoc(doc(d, 'duelos', 'd3'), duelo('aceite'));
    });
    await assertFails(updateDoc(doc(ctx.F.bob, 'duelos', 'd1'), { estado: 'aceite' }));
    await assertSucceeds(updateDoc(doc(ctx.F.bob, 'duelos', 'd2'), { estado: 'recusado' }));
    await assertFails(updateDoc(doc(ctx.F.bob, 'duelos', 'd3'), { rb: 3 }));
  });

  it('a suspensão temporária também fica no email e acaba na data marcada; a própria pessoa pode lê-la', async () => {
    const post = { uid: ALICE, text: 'olá', img: '', ts: Date.now(), likes: {} };
    await seed(envF, d => setDoc(doc(d, 'bansEmail', 'alice@exemplo.pt'), { motivo: 'x', por: ADMIN, em: Timestamp.now(), ate: Timestamp.fromMillis(Date.now() + DAY) }));
    await assertFails(batchPost(ctx.F.alice, ALICE, post));
    await assertSucceeds(getDoc(doc(ctx.F.alice, 'bansEmail', 'alice@exemplo.pt')));
    await assertFails(getDoc(doc(ctx.F.bob, 'bansEmail', 'alice@exemplo.pt')));
    await seed(envF, d => setDoc(doc(d, 'bansEmail', 'alice@exemplo.pt'), { motivo: 'x', por: ADMIN, em: tsAgo(2 * DAY), ate: tsAgo(DAY) }));
    await assertSucceeds(batchPost(ctx.F.alice, ALICE, post));
  });

  it('o id dos erros tem de ter a data de hoje', async () => {
    const e = { by: ALICE, msg: 'erro', ts: Date.now() };
    await assertFails(setDoc(doc(ctx.F.alice, 'erros', ALICE + '_00000000_0'), e));
    await assertFails(setDoc(doc(ctx.F.alice, 'erros', ALICE + '_99999999_9'), e));
  });

  describe('Pontos', () => {
    const inicio = { xpIni: 100, xpIniEm: tsAgo(1000) };
    beforeEach(() => seed(envF, d => setDoc(doc(d, 'perfis', ALICE), perfil(100, { nick: 'Alice', wxp: 100, mk: '2026-11', mxp: 100, ...inicio }))));
    const sobe = (extra) => setDoc(doc(ctx.F.alice, 'perfis', ALICE), extra, { merge: true });

    it('uma sessão normal soma XP à semana e ao mês', () => assertSucceeds(sobe({ xp: 150, nivel: levelOf(150), wxp: 150, mxp: 150, upd: Date.now() })));
    it('o XP da semana não salta de uma vez para o total', async () => {
      await seed(envF, d => setDoc(doc(d, 'perfis', ALICE), perfil(1000, { nick: 'Alice', wxp: 0, xpIni: 1000, xpIniEm: tsAgo(1000) })));
      await assertFails(sobe({ xp: 1000, wxp: 1000, upd: Date.now() }));
      await assertSucceeds(sobe({ xp: 1000, wxp: 250, upd: Date.now() }));
    });
    it('o XP do mês também sobe aos poucos', () => assertFails(sobe({ xp: 150, nivel: levelOf(150), wxp: 150, mxp: 500, upd: Date.now() })));
    it('os pontos por tema não passam do XP total', () => assertFails(sobe({ tx: { 'Eleições': 5000 }, upd: Date.now() })));
    it('as contagens de exercícios não saltam', () => assertFails(sobe({ total: 100000, certos: 100000, upd: Date.now() })));
  });
});

// =====================================================================
describe('Transição: a app 1.7 continua a funcionar', () => {
  it('post com addDoc simples, comentário e mensagem sem lote', async () => {
    const db = ctx.T.alice;
    await assertSucceeds(addDoc(collection(db, 'posts'), { uid: ALICE, text: 'x', img: '', ts: Date.now(), likes: {} }));
    await assertSucceeds(addDoc(collection(db, 'posts/postBob/coments'), { uid: ALICE, text: 'x', ts: Date.now() }));
    await assertSucceeds(addDoc(collection(db, 'canais/geral/msgs'), { uid: ALICE, text: 'x', ts: Date.now() }));
  });
  it('perfil com set() sem xpIni nem streakEm', async () => {
    const r = doc(ctx.T.alice, 'perfis', ALICE);
    await assertSucceeds(setDoc(r, perfil(800, { streak: 4 })));
    await assertSucceeds(setDoc(r, perfil(900, { streak: 5 })));
    await assertFails(setDoc(r, perfil(850, { streak: 5 })));    // descer continua proibido
  });
  it('denúncia sem motivo e registo sem criadoEm', async () => {
    await assertSucceeds(addDoc(collection(ctx.T.alice, 'denuncias'), { by: ALICE, canal: 'geral', msg: 'msgBob', autor: BOB, text: 'x', ts: Date.now() }));
    await seed(envT, async a => deleteDoc(doc(a, 'utilizadores', ALICE)));
    await assertSucceeds(setDoc(doc(ctx.T.alice, 'utilizadores', ALICE), Object.assign(registo(ALICE), { criado: Date.now() }), { merge: true }));
  });
});
