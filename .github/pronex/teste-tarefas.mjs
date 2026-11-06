// Testa avisos.mjs e copia.mjs contra o emulador do Firestore (sem tocar nos dados reais).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

assert(process.env.FIRESTORE_EMULATOR_HOST, 'Corre isto só com o emulador.');
const db = getFirestore(initializeApp({ projectId: 'demo-pronex' }));
const run = (f, ...a) => execFileSync('node', [f, ...a], { env: { ...process.env, PUSH_SECO: '1' } }).toString();

await db.doc('data/users/alice/push').set({ toks: { dev1: 'x'.repeat(40), dev2: 'y'.repeat(40) } });
await db.doc('data/users/bob/push').set({ toks: { dev1: 'z'.repeat(40) } });
await db.doc('data/users/alice/dia_2026-11-06').set({ date: '2026-11-06', items: [] });

let o = run('avisos.mjs');
assert.match(o, /Primeira execução/);
await new Promise((r) => setTimeout(r, 50));
await db.collection('notifs').add({ titulo: 'Teste', texto: 'Para todos', alvo: 'todos', tipo: 'aviso', criadoEm: Timestamp.now(), por: 'admin' });
await db.collection('notifs').add({ titulo: 'Teste', texto: 'Só para o Bob', alvo: 'bob', tipo: 'aviso', criadoEm: Timestamp.now(), por: 'admin' });
o = run('avisos.mjs');
assert.match(o, /Avisos: 2 · enviados: 4 /, o);
o = run('avisos.mjs');
assert.match(o, /Sem avisos novos/, o);

o = run('copia.mjs', '/tmp/copia-teste.json');
const c = JSON.parse(readFileSync('/tmp/copia-teste.json', 'utf8'));
assert.equal(c.colecoes.notifs.length, 2);
const users = c.colecoes.data.find((d) => d.id === 'users');
assert.ok(users.sub.alice.find((d) => d.id === 'push'));
assert.ok(users.sub.alice.find((d) => d.id === 'dia_2026-11-06'));
assert.equal(typeof c.colecoes.config.find((d) => d.id === 'pushEstado').dados.ate.__ts, 'number');
console.log('Tarefas: tudo certo.', o.trim());

// ---------- ligas ----------
const runL = (agora) => execFileSync('node', ['ligas.mjs'], { env: { ...process.env, AGORA: String(agora) } }).toString();
const sem1 = '2026-11-02', sem2 = '2026-11-09';
const P = (nick, wxp, xp, wk = sem1) => ({ nick, xp, wxp, wk, nivel: 1, streak: 0, ranking: true });
const nomes = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11'];
for (let i = 0; i < nomes.length; i++) await db.doc('perfis/' + nomes[i]).set(P(nomes[i], (11 - i) * 10, 600 - i * 10));
await db.doc('perfis/fora').set({ ...P('fora', 999, 999), ranking: false });
o = runL(Date.parse('2026-11-04T12:00:00Z'));
let lg = (await db.doc('config/ligas').get()).data();
assert.equal(lg.semana, sem1, o);
assert.equal(Object.values(lg.grupos).reduce((a, g) => a + g.membros.length, 0), 11, 'grupos: ' + JSON.stringify(lg.grupos));
assert.ok(!JSON.stringify(lg.grupos).includes('"fora"'));
// aluno novo a meio da semana entra num grupo
await db.doc('perfis/novo').set(P('novo', 0, 0));
runL(Date.parse('2026-11-05T12:00:00Z'));
lg = (await db.doc('config/ligas').get()).data();
assert.ok(JSON.stringify(lg.grupos).includes('"novo"'));
// fecha a semana: 12 no grupo Bronze -> sobem 3 (a1, a2, a3), ninguém desce no Bronze; pódio a1, a2, a3
o = runL(Date.parse('2026-11-09T01:00:00Z'));
lg = (await db.doc('config/ligas').get()).data();
assert.equal(lg.semana, sem2);
assert.equal(lg.anterior.semana, sem1);
assert.deepEqual(lg.anterior.podio, ['a1', 'a2', 'a3']);
assert.equal(lg.anterior.resultados.a1.mov, 'sobe');
assert.equal(lg.anterior.resultados.a4.mov, 'fica');
assert.equal(lg.anterior.resultados.novo.mov, 'fica');
assert.equal(lg.tierDe.a1, 1);
const pr = (await db.doc('premios/a1').get()).data();
assert.equal(pr.moedas, 30 + 15);
assert.equal(pr.medalhas.ouro, 1);
// correr outra vez no mesmo dia não repete prémios
runL(Date.parse('2026-11-09T02:00:00Z'));
assert.equal((await db.doc('premios/a1').get()).data().moedas, 45);
// a semana seguinte: a1 está na Prata
lg = (await db.doc('config/ligas').get()).data();
const gA1 = Object.values(lg.grupos).find((g) => g.membros.includes('a1'));
assert.equal(gA1.tier, 1);
console.log('Ligas: tudo certo.', o.trim());
