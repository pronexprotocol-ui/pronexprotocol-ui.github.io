// Confirma que as regras do Firestore publicadas no Firebase são iguais às do repositório.
// Lê só as regras (nada de dados de alunos). Usa a conta de serviço do segredo FIREBASE_SA.
import { cert } from 'firebase-admin/app';
import fs from 'node:fs';
import crypto from 'node:crypto';

const sa = JSON.parse(process.env.FIREBASE_SA || '{}');
const token = (await cert(sa).getAccessToken()).access_token;
const api = 'https://firebaserules.googleapis.com/v1/projects/' + sa.project_id;
const h = { Authorization: 'Bearer ' + token };
const rel = await (await fetch(api + '/releases/cloud.firestore', { headers: h })).json();
if (!rel.rulesetName) { console.log('Não encontrei regras publicadas:', JSON.stringify(rel).slice(0, 200)); process.exit(1); }
const rs = await (await fetch('https://firebaserules.googleapis.com/v1/' + rel.rulesetName, { headers: h })).json();
const pub = (rs.source && rs.source.files && rs.source.files[0] && rs.source.files[0].content) || '';
const repo = fs.readFileSync('regras/firestore.rules', 'utf8');
const n = (t) => t.replace(/\r\n/g, '\n').trim();
const hash = (t) => crypto.createHash('sha256').update(n(t)).digest('hex').slice(0, 12);
console.log('Publicadas em', rel.updateTime, '· publicadas', hash(pub), '· repositório', hash(repo));
if (n(pub) === n(repo)) { console.log('As regras publicadas são iguais às do repositório.'); }
else {
  const a = n(pub).split('\n'), b = n(repo).split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
  console.log('DIFERENTES a partir da linha', i + 1); process.exit(2);
}
