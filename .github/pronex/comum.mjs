// Ligação ao Firebase com a conta de serviço guardada no segredo FIREBASE_SA do GitHub.
// Nunca escrever dados de alunos nos registos (logs): o repositório é público.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function ligar() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-pronex' });
    return { app, db: getFirestore(app) };
  }
  const raw = process.env.FIREBASE_SA;
  if (!raw) throw new Error('Falta o segredo FIREBASE_SA no GitHub.');
  let sa;
  try { sa = JSON.parse(raw); } catch (e) { throw new Error('O segredo FIREBASE_SA não é um JSON válido.'); }
  const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
  return { app, db: getFirestore(app) };
}
