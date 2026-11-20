// Auditoria da base de dados (só lê, nunca escreve nem apaga).
// Mostra contagens e anomalias, nunca nomes, emails, uids nem textos: o repositório é público e os registos também.
// Sai com código 1 se encontrar um problema que precisa de atenção (para o GitHub avisar por email).
import { Timestamp } from 'firebase-admin/firestore';
import { appendFileSync } from 'node:fs';
import { ligar } from './comum.mjs';

const { db } = ligar();
const AGORA = Date.now(), DIA = 864e5;
const ms = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : +v || 0);
const linhas = [], problemas = [], notas = [];
const conta = async (q) => (await q.count().get()).data().count;
const L = (t) => linhas.push(t);
const P = (t) => problemas.push(t);
const N = (t) => notas.push(t);

// As mesmas contas que as regras fazem (firestore.rules, bloco perfis)
const TX = new Set(['Eleições', 'Partilha', 'Finanças', 'Estatística', 'Filosofia', 'Português', 'Inglês', 'Desenho A', 'Teologia', 'Modelação 3D', 'Python', 'Psicologia', 'História da Cultura e das Artes']);
const nivelOk = (n, xp) => { const m = n - 1; return Number.isInteger(n) && n >= 1 && 100 * m + 30 * m * (m - 1) <= xp && xp < 100 * (m + 1) + 30 * (m + 1) * m; };
const chave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

async function main() {
  // ---------- 1. Quantidades ----------
  const cols = ['utilizadores', 'perfis', 'consent', 'posts', 'grupos', 'duelos', 'salas', 'notifs', 'denuncias', 'sugestoes', 'erros', 'bans', 'bansEmail', 'premios', 'audit'];
  const tot = {};
  for (const c of cols) tot[c] = await conta(db.collection(c));
  tot.mensagens = await conta(db.collectionGroup('msgs'));
  tot.comentarios = await conta(db.collectionGroup('coments'));
  L('| Coleção | Documentos |'); L('|---|---|');
  for (const [k, v] of Object.entries(tot)) L(`| ${k} | ${v} |`);

  // ---------- 2. Contas: registo, perfil e consentimento ligados entre si ----------
  const ids = async (c) => new Set((await db.collection(c).select().get()).docs.map((d) => d.id));
  const [U, C] = [await ids('utilizadores'), await ids('consent')];
  const perfis = (await db.collection('perfis').select('nick', 'xp', 'wxp', 'nivel', 'streak', 'total', 'certos', 'tx', 'banned', 'wk', 'mxp').get()).docs;
  const semRegisto = perfis.filter((d) => !U.has(d.id)).length;
  const semConsent = perfis.filter((d) => !C.has(d.id)).length;
  if (semRegisto) N(`${semRegisto} perfil(is) do ranking sem registo em utilizadores (contas antigas ou apagadas a meio).`);
  if (semConsent) P(`${semConsent} perfil(is) públicos sem consentimento guardado: as regras atuais não deixariam criá-los.`);
  // Perfis que as regras atuais recusariam ao próximo envio (a app ficaria sem conseguir atualizar o ranking)
  const inval = { nivel: 0, wxp: 0, certos: 0, tx: 0, nick: 0 };
  const nomes = new Map();
  for (const d of perfis) {
    const p = d.data(), xp = +p.xp || 0;
    if (!nivelOk(p.nivel, xp)) inval.nivel++;
    if ((+p.wxp || 0) > xp || (+p.mxp || 0) > xp) inval.wxp++;
    if ((+p.certos || 0) > (+p.total || 0)) inval.certos++;
    if (p.tx && (Object.keys(p.tx).some((k) => !TX.has(k)) || Object.keys(p.tx).length > 13)) inval.tx++;
    if (typeof p.nick !== 'string' || p.nick.length < 1 || p.nick.length > 30) inval.nick++;
    const k = chave(p.nick); if (k) nomes.set(k, (nomes.get(k) || 0) + 1);
  }
  for (const [k, v] of Object.entries(inval)) if (v) P(`${v} perfil(is) com «${k}» fora do que as regras aceitam: a app destes alunos não consegue atualizar o ranking.`);
  const repetidos = [...nomes.values()].filter((v) => v > 1).length;
  if (repetidos) N(`${repetidos} nome(s) usados por mais de uma conta (vê «Contas duplicadas» no painel).`);
  const banidos = perfis.filter((d) => d.get('banned') === true).length;
  L(''); L(`Contas: ${U.size} registos, ${perfis.length} perfis, ${C.size} consentimentos, ${banidos} perfis suspensos.`);

  // ---------- 3. Dados privados sem dono ----------
  const pastas = await db.collection('data').doc('users').listCollections();
  const orfas = pastas.filter((c) => !U.has(c.id)).length;
  if (orfas) N(`${orfas} pasta(s) de dados privados (histórico) de contas sem registo: podem ser de contas apagadas antes da 1.8.`);
  L(`Dados privados: ${pastas.length} pastas de histórico.`);
  const ultimo = (await db.collection('utilizadores').select('ultimo').get()).docs.map((d) => ms(d.get('ultimo')));
  const ativos7 = ultimo.filter((t) => t > AGORA - 7 * DIA).length, ativos30 = ultimo.filter((t) => t > AGORA - 30 * DIA).length, parados = ultimo.filter((t) => t && t < AGORA - 365 * DIA).length;
  L(`Atividade: ${ativos7} contas abriram a app nos últimos 7 dias, ${ativos30} nos últimos 30.`);
  if (parados) N(`${parados} conta(s) sem abrir a app há mais de 12 meses.`);

  // ---------- 4. Comunidade ----------
  const posts = (await db.collection('posts').select('oculto', 'revisto', 'ts').get()).docs;
  const escondidos = posts.filter((d) => d.get('oculto') === true && d.get('revisto') !== true).length;
  if (escondidos) N(`${escondidos} publicação(ões) escondidas por denúncias à espera de revisão no painel.`);
  const den = await conta(db.collection('denuncias'));
  if (den) N(`${den} denúncia(s) por ver no painel (Moderação).`);
  const grupos = (await db.collection('grupos').get()).docs;
  const gApagados = grupos.filter((g) => g.get('apagado') === true).length;
  const gSemDono = grupos.filter((g) => g.get('apagado') !== true && !(g.get('membros') || {})[g.get('dono')]).length;
  const gVazios = grupos.filter((g) => g.get('apagado') !== true && Object.keys(g.get('membros') || {}).length === 0).length;
  if (gApagados) N(`${gApagados} grupo(s) marcados como apagados ainda por limpar (a limpeza diária trata deles).`);
  if (gVazios) N(`${gVazios} grupo(s) sem membros.`);
  if (gSemDono) N(`${gSemDono} grupo(s) em que o dono já saiu.`);
  const gIds = new Set(grupos.map((g) => g.id));
  const canais = await db.collection('canais').listDocuments();
  const semGrupo = canais.filter((c) => c.id.startsWith('g_') && !gIds.has(c.id)).length;
  if (semGrupo) N(`${semGrupo} conversa(s) de grupos que já não existem (a limpeza diária apaga-as).`);
  L(`Comunidade: ${posts.length} publicações, ${grupos.length} grupos, ${canais.length} canais de conversa.`);
  const duelos = (await db.collection('duelos').select('estado', 'ts', 'ra', 'rb').get()).docs;
  const dParados = duelos.filter((d) => ms(d.get('ts')) < AGORA - 7 * DIA && (d.get('estado') === 'pendente' || (d.get('estado') === 'aceite' && (d.get('ra') < 0 || d.get('rb') < 0)))).length;
  if (dParados) N(`${dParados} duelo(s) por acabar há mais de 7 dias.`);

  // ---------- 5. Relatórios ----------
  const erros7 = await conta(db.collection('erros').where('ts', '>', AGORA - 7 * DIA));
  L(`Relatórios: ${erros7} erros da app nos últimos 7 dias, ${tot.sugestoes} sugestões guardadas.`);
  if (erros7 > 50) P(`${erros7} erros da app em 7 dias: vale a pena ver o separador Sistema do painel.`);
  const bansAcabados = (await db.collection('bans').where('ate', '<', Timestamp.fromMillis(AGORA)).select().get()).size;
  if (bansAcabados) N(`${bansAcabados} suspensão(ões) já terminadas ainda guardadas (a limpeza apaga-as ao fim de 12 meses).`);

  // ---------- 6. Configuração ----------
  const ai = await db.doc('config/ai').get();
  if (ai.exists && ai.get('key')) P('config/ai ainda guarda uma chave de API antiga (não se mostra aqui). A app já não a usa: o melhor é apagar este documento na consola do Firebase e revogar a chave no Google Cloud.');
  else if (ai.exists) N('config/ai existe, mas sem chave.');
  const app = await db.doc('config/app').get();
  L(`Configuração: config/app ${app.exists ? 'existe' : 'não existe'}${app.exists && app.get('minVersion') ? ', versão mínima ' + app.get('minVersion') : ''}; config/admin ${(await db.doc('config/admin').get()).exists ? 'com PIN definido' : 'sem PIN'}; config/ligas ${(await db.doc('config/ligas').get()).exists ? 'existe' : 'não existe'}.`);

  // ---------- 7. Índices que as consultas da app precisam ----------
  const consultas = [
    ['mensagens de uma pessoa (apagar conta)', db.collectionGroup('msgs').where('uid', '==', '__auditoria__').limit(1)],
    ['comentários de uma pessoa (apagar conta)', db.collectionGroup('coments').where('uid', '==', '__auditoria__').limit(1)],
    ['avisos para todos e para a pessoa', db.collection('notifs').where('alvo', 'in', ['todos', '__auditoria__']).limit(1)],
    ['ranking da semana', db.collection('perfis').orderBy('wxp', 'desc').limit(1)],
    ['ranking de sempre', db.collection('perfis').orderBy('xp', 'desc').limit(1)],
    ['mural', db.collection('posts').orderBy('ts', 'desc').limit(1)],
    ['salas de um grupo', db.collection('salas').where('grupo', '==', '__auditoria__').limit(1)],
    ['conversa geral', db.collection('canais/geral/msgs').orderBy('ts', 'desc').limit(1)],
  ];
  let indOk = 0;
  for (const [nome, q] of consultas) {
    try { await q.get(); indOk++; } catch (e) { if (e.code === 9) P(`Falta um índice para «${nome}». Cria-o na consola do Firebase (Firestore → Índices).`); else P(`A consulta «${nome}» falhou (${e.code || e.message}).`); }
  }
  L(`Índices: ${indOk} de ${consultas.length} consultas da app funcionam.`);

  // ---------- 8. Prazos da política de privacidade (1.38) ----------
  // Só conta o que passou do prazo que a política promete. Não apaga: ligar a eliminação na limpeza diária é decisão do Kaizer.
  const ANO = 365 * DIA;
  const auditVelho = await conta(db.collection('audit').where('em', '<', Timestamp.fromMillis(AGORA - ANO)));
  const denVelhas = await conta(db.collection('denuncias').where('ts', '<', AGORA - ANO));
  const regs = (await db.collection('utilizadores').select('ultimo', 'anon').get()).docs;
  const parada = (d, dias) => { const t = ms(d.get('ultimo')); return t > 0 && t < AGORA - dias * DIA; };
  const anonParadas = regs.filter((d) => d.get('anon') === true && parada(d, 365)).length;
  const comEmailParadas = regs.filter((d) => d.get('anon') !== true && parada(d, 548)).length;
  if (auditVelho) P(`${auditVelho} registo(s) de auditoria com mais de 12 meses: a política de privacidade diz que se guardam 12 meses.`);
  if (denVelhas) P(`${denVelhas} denúncia(s) com mais de 12 meses: a política de privacidade diz 12 meses depois da decisão.`);
  if (anonParadas) P(`${anonParadas} conta(s) automáticas sem email paradas há mais de 12 meses: a política de privacidade diz que são apagadas.`);
  if (comEmailParadas) P(`${comEmailParadas} conta(s) com email paradas há mais de 18 meses: a política de privacidade diz que são apagadas 6 meses depois do aviso.`);
  L(`Prazos da política de privacidade: ${auditVelho + denVelhas + anonParadas + comEmailParadas ? 'há dados fora do prazo (ver «Precisa de atenção»)' : 'nada fora do prazo'}.`);
}

main().then(() => {
  const txt = ['## Auditoria da base de dados', '', ...linhas, '', problemas.length ? '### Precisa de atenção' : '### Sem problemas', ...problemas.map((p) => '- ' + p), '', notas.length ? '### Para saber' : '', ...notas.map((n) => '- ' + n)].join('\n');
  console.log(txt);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, txt + '\n');
  process.exit(problemas.length ? 1 : 0);
}).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
