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
