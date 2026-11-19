// Publica no Firebase as regras do Firestore que estão no repositório (regras/firestore.rules) e confirma o resultado.
// Só lê e publica regras (nada de dados de alunos). Usa a conta de serviço do segredo FIREBASE_SA.
// Corre pela tarefa «Pronex_Study · publicar regras» (manual), depois de a tarefa de testes passar.
import { cert } from 'firebase-admin/app';
import fs from 'node:fs';
import crypto from 'node:crypto';

const sa = JSON.parse(process.env.FIREBASE_SA || '{}');
if (!sa.project_id) { console.log('Falta o segredo FIREBASE_SA.'); process.exit(1); }
const token = (await cert(sa).getAccessToken()).access_token;
const api = 'https://firebaserules.googleapis.com/v1/projects/' + sa.project_id;
const h = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
const regras = fs.readFileSync('regras/firestore.rules', 'utf8');
const n = (t) => t.replace(/\r\n/g, '\n').trim();
const hash = (t) => crypto.createHash('sha256').update(n(t)).digest('hex').slice(0, 12);

// 1. Guarda as regras atuais (para se poder voltar atrás) e mostra o que vai mudar.
const antes = await (await fetch(api + '/releases/cloud.firestore', { headers: h })).json();
console.log('Regras publicadas antes:', antes.rulesetName || '(nenhuma)', antes.updateTime || '');
// 2. Cria um conjunto de regras novo. O Firebase compila-o e recusa-o se tiver erros.
const r1 = await fetch(api + '/rulesets', { method: 'POST', headers: h, body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: regras }] } }) });
const rs = await r1.json();
if (!r1.ok || !rs.name) { console.log('O Firebase recusou as regras:', JSON.stringify(rs).slice(0, 1500)); process.exit(1); }
console.log('Regras compiladas:', rs.name, '· repositório', hash(regras));
// 3. Passa a usá-lo.
const r2 = await fetch(api + '/releases/cloud.firestore', { method: 'PATCH', headers: h, body: JSON.stringify({ release: { name: 'projects/' + sa.project_id + '/releases/cloud.firestore', rulesetName: rs.name } }) });
const rel = await r2.json();
if (!r2.ok) { console.log('Não foi possível publicar:', JSON.stringify(rel).slice(0, 800)); process.exit(1); }
console.log('Publicadas em', rel.updateTime);
// 4. Confirma que as regras publicadas são as do repositório.
const agora = await (await fetch(api + '/releases/cloud.firestore', { headers: h })).json();
const pub = await (await fetch('https://firebaserules.googleapis.com/v1/' + agora.rulesetName, { headers: h })).json();
const texto = (pub.source && pub.source.files && pub.source.files[0] && pub.source.files[0].content) || '';
if (n(texto) !== n(regras)) { console.log('As regras publicadas não ficaram iguais às do repositório.'); process.exit(2); }
console.log('Feito: as regras publicadas são iguais às do repositório (' + hash(texto) + ').');
console.log('Para voltar atrás: publicar outra vez o conjunto', antes.rulesetName);
