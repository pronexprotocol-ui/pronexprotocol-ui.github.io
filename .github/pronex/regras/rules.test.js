/* Pronex_Study · testes das regras do Firestore v3.2
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
    alice: env.authenticatedContext(ALICE, { firebase: { sign_in_provider: 'anonymous', identities: {} } }).firestore(),
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
  it('histórico: dia_, dia_0000-anteriores, log_ com arrayUnion, tutor, notifs_lidas', async () => {
    const db = ctx.F.alice, base = 'data/users/' + ALICE + '/';
    const it1 = { ts: Date.now(), t: 1, tn: 'Hondt', tema: 'Eleições', q: 'q', esc: 'a', cert: 'a', ok: true, mode: 'tipo' };
    await assertSucceeds(setDoc(doc(db, base + 'dia_' + today()), { date: today(), goal: 15, items: [it1] }));
    await assertSucceeds(setDoc(doc(db, base + 'dia_0000-anteriores'), { date: '0000-anteriores', items: [it1] }));
    await assertSucceeds(setDoc(doc(db, base + 'log_' + today()), { date: today(), ev: arrayUnion({ ts: Date.now(), e: 'abriu', d: 'dabc' }) }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, base + 'tutor'), { msgs: [{ r: 'u', t: 'olá' }], upd: Date.now() }));
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
    await assertSucceeds(setDoc(doc(A, 'config', 'ai'), { key: 'k'.repeat(39), upd: Date.now() }));
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
describe('Pontos (v3.2)', () => {
  beforeEach(async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(1000, { streak: 4, xpIni: 900, xpIniEm: Timestamp.now(), streakEm: Timestamp.now() })));
  });
  const r = () => doc(ctx.F.alice, 'perfis', ALICE);
  it('XP desce quando a sequência se perde', async () => {
    await assertSucceeds(setDoc(r(), perfil(900, { streak: 0, wxp: 900 }), { merge: true }));
  });
  it('XP do mês e por tema dentro dos limites', async () => {
    await assertSucceeds(setDoc(r(), perfil(1200, { streak: 4, mk: '2026-11', mxp: 200, tx: { 'Eleições': 800, 'Finanças': 400 } }), { merge: true }));
    await assertSucceeds(setDoc(r(), perfil(1400, { streak: 4, mk: '2026-11', mxp: 400, tx: { 'Eleições': 900, 'Finanças': 500 } }), { merge: true }));
  });
  it('teto diário passou para 10000', async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(5000, { xpIni: 400, xpIniEm: Timestamp.now() })));
    await assertSucceeds(setDoc(r(), perfil(5250), { merge: true }));
  });
});

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

describe('Ataques (devem falhar)', () => {
  beforeEach(async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(500, { streak: 3, xpIni: 400, xpIniEm: Timestamp.now(), streakEm: Timestamp.now() })));
  });
  const r = () => doc(ctx.F.alice, 'perfis', ALICE);

  it('perfil com campo extra', async () => {
    await assertFails(setDoc(r(), perfil(500, { streak: 3, admin: true }), { merge: true }));
  });
  it('XP semanal maior do que o XP total depois de descer', async () => {
    await assertFails(setDoc(r(), Object.assign(perfil(400, { streak: 3 }), { wxp: 500 }), { merge: true }));
  });
  it('XP do mês maior do que o subido', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, mk: '2026-11', mxp: 400 }), { merge: true }));
  });
  it('XP por tema com campos a mais e mês inválido', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, tx: { a: 1, b: 2, c: 3, d: 4 } }), { merge: true }));
    await assertFails(setDoc(r(), perfil(600, { streak: 3, mk: '2026-11-xx-yy' }), { merge: true }));
  });
  it('XP absurdo (+1000 numa escrita)', async () => {
    await assertFails(setDoc(r(), perfil(1500, { streak: 3 }), { merge: true }));
  });
  it('XP acima do teto diário de 10000 (em várias escritas de +250)', async () => {
    await seed(envF, async a => setDoc(doc(a, 'perfis', ALICE), perfil(10300, { xpIni: 400, xpIniEm: Timestamp.now() })));
    await assertFails(setDoc(r(), perfil(10550), { merge: true }));
  });
  it('xpIni falsificado no mesmo dia', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, xpIni: 600 }), { merge: true }));
  });
  it('nível que não corresponde ao XP', async () => {
    await assertFails(setDoc(r(), perfil(600, { streak: 3, nivel: 9 }), { merge: true }));
  });
  it('XP semanal maior do que o subido', async () => {
    await seed(envF, async a => updateDoc(doc(a, 'perfis', ALICE), { wxp: 100 }));
    await assertFails(setDoc(r(), perfil(600, { streak: 3, wxp: 300 }), { merge: true }));   // +200 semanal com +100 total
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
    await assertSucceeds(setDoc(r, perfil(850, { streak: 5 })));  // desde a v3.2 o XP pode descer (sequência perdida)
  });
  it('denúncia sem motivo e registo sem criadoEm', async () => {
    await assertSucceeds(addDoc(collection(ctx.T.alice, 'denuncias'), { by: ALICE, canal: 'geral', msg: 'msgBob', autor: BOB, text: 'x', ts: Date.now() }));
    await seed(envT, async a => deleteDoc(doc(a, 'utilizadores', ALICE)));
    await assertSucceeds(setDoc(doc(ctx.T.alice, 'utilizadores', ALICE), Object.assign(registo(ALICE), { criado: Date.now() }), { merge: true }));
  });
});
