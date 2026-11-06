// Ligas da Pronex_Study: grupos da semana, subidas, descidas e prémios.
// Corre todos os dias à meia-noite (.github/workflows/pronex-ligas.yml).
//  - Na primeira execução de cada semana fecha a semana anterior: ordena cada grupo pelo XP da semana,
//    sobe os primeiros e desce os últimos, dá medalha e moedas ao pódio da turma e +15 moedas a quem sobe.
//  - Depois faz os grupos da semana nova (até 12 alunos da mesma liga).
//  - Nos outros dias só junta os alunos novos a um grupo e tira quem apagou a conta.
// Escreve config/ligas e premios/{uid}. Nunca escreve dados de alunos nos registos (o repositório é público).
import { Timestamp } from 'firebase-admin/firestore';
import { ligar } from './comum.mjs';

const { db } = ligar();
const TIERS = 5, MAXG = 12, POD = [30, 20, 10], MED = ['ouro', 'prata', 'bronze'], SOBE = 15;
const zona = (n) => (n >= 9 ? 3 : n >= 5 ? 2 : 1);
const N = (v) => (Number.isFinite(+v) ? +v : 0);

// Segunda-feira da semana (data de Lisboa), no mesmo formato que a app: AAAA-MM-DD
export function semanaDe(t = Date.now()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = f.format(new Date(t)).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
}
function baralha(arr, seed) {
  let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}
function fazGrupos(porTier, semana) {
  const grupos = {};
  porTier.forEach((uids, t) => {
    if (!uids.length) return;
    const n = Math.ceil(uids.length / MAXG), l = baralha(uids, semana + ':' + t);
    for (let g = 0; g < n; g++) grupos['t' + t + 'g' + (g + 1)] = { tier: t, membros: l.filter((_, i) => i % n === g) };
  });
  return grupos;
}

export async function correr(agora = Date.now()) {
  const semana = semanaDe(agora);
  const [pSnap, lSnap] = await Promise.all([db.collection('perfis').get(), db.doc('config/ligas').get()]);
  const P = {}; pSnap.docs.forEach((d) => { P[d.id] = d.data(); });
  const ativo = (u) => P[u] && P[u].nick && P[u].ranking !== false && P[u].banned !== true;
  const cur = lSnap.exists ? lSnap.data() : null;
  const tierDe = Object.assign({}, (cur && cur.tierDe) || {});
  let anterior = (cur && cur.anterior) || null, grupos;
  const premios = {}; // uid -> [{semana, motivo, texto, moedas, medalha}]
  const dar = (u, x) => { (premios[u] = premios[u] || []).push(x); };

  if (!cur || cur.semana !== semana) {
    // 1) fechar a semana anterior
    if (cur && cur.grupos) {
      const sem = cur.semana, res = {};
      const wx = (u) => (P[u] && P[u].wk === sem ? N(P[u].wxp) : 0);
      Object.values(cur.grupos).forEach((g) => {
        const l = (g.membros || []).filter((u) => P[u]).sort((a, b) => wx(b) - wx(a) || N(P[b].xp) - N(P[a].xp));
        const n = l.length, z = zona(n), t = N(g.tier);
        l.forEach((u, i) => {
          let nt = t, mov = 'fica';
          if (t < TIERS - 1 && i < z && wx(u) > 0) { nt = t + 1; mov = 'sobe'; }
          else if (t > 0 && i >= n - z && n > 1) { nt = t - 1; mov = 'desce'; }
          res[u] = { tier: nt, de: t, pos: i + 1, mov, wxp: wx(u), moedas: 0 };
          tierDe[u] = nt;
          if (mov === 'sobe') { res[u].moedas += SOBE; dar(u, { semana: sem, motivo: 'liga', texto: 'Subiste para a liga seguinte', moedas: SOBE }); }
        });
      });
      // pódio da turma (XP da semana)
      const podio = Object.keys(P).filter((u) => ativo(u) && wx(u) > 0).sort((a, b) => wx(b) - wx(a) || N(P[b].xp) - N(P[a].xp)).slice(0, 3);
      podio.forEach((u, i) => {
        dar(u, { semana: sem, motivo: 'podio', texto: (i + 1) + '.º lugar da semana', moedas: POD[i], medalha: MED[i] });
        if (res[u]) res[u].moedas += POD[i]; else res[u] = { tier: N(tierDe[u]), de: N(tierDe[u]), pos: 0, mov: 'fica', wxp: wx(u), moedas: POD[i] };
      });
      anterior = { semana: sem, resultados: res, podio };
    }
    // 2) grupos da semana nova
    const porTier = Array.from({ length: TIERS }, () => []);
    Object.keys(P).filter(ativo).forEach((u) => porTier[Math.min(TIERS - 1, N(tierDe[u]))].push(u));
    grupos = fazGrupos(porTier, semana);
  } else {
    // mesma semana: tirar quem já não existe e juntar os novos ao grupo mais pequeno da sua liga
    grupos = {};
    const dentro = new Set();
    Object.entries(cur.grupos || {}).forEach(([gid, g]) => { const m = (g.membros || []).filter(ativo); m.forEach((u) => dentro.add(u)); grupos[gid] = { tier: N(g.tier), membros: m }; });
    Object.keys(P).filter((u) => ativo(u) && !dentro.has(u)).forEach((u) => {
      const t = Math.min(TIERS - 1, N(tierDe[u]));
      let alvo = Object.entries(grupos).filter(([, g]) => g.tier === t && g.membros.length < MAXG).sort((a, b) => a[1].membros.length - b[1].membros.length)[0];
      if (!alvo) { let k = 1; while (grupos['t' + t + 'g' + k]) k++; grupos['t' + t + 'g' + k] = { tier: t, membros: [] }; alvo = ['t' + t + 'g' + k, grupos['t' + t + 'g' + k]]; }
      alvo[1].membros.push(u);
    });
  }
  Object.keys(P).filter(ativo).forEach((u) => { if (!(u in tierDe)) tierDe[u] = 0; });
  Object.keys(tierDe).forEach((u) => { if (!P[u]) delete tierDe[u]; });

  // 3) prémios (acumulados em premios/{uid}); cada prémio só se dá uma vez
  let nPrem = 0;
  for (const [u, lista] of Object.entries(premios)) {
    const ref = db.doc('premios/' + u), s = await ref.get(), d = s.exists ? s.data() : { moedas: 0, medalhas: {}, hist: [] };
    const hist = Array.isArray(d.hist) ? d.hist : [], med = Object.assign({ ouro: 0, prata: 0, bronze: 0 }, d.medalhas || {});
    let moedas = N(d.moedas);
    for (const x of lista) {
      if (hist.some((h) => h.semana === x.semana && h.motivo === x.motivo)) continue;
      hist.push(x); moedas += x.moedas; if (x.medalha) med[x.medalha] = N(med[x.medalha]) + 1; nPrem++;
    }
    await ref.set({ moedas, medalhas: med, hist: hist.slice(-60), atualizado: Timestamp.now() });
  }
  await db.doc('config/ligas').set({ semana, grupos, tierDe, anterior, feitoEm: Timestamp.now() });
  const nG = Object.keys(grupos).length, nA = Object.values(grupos).reduce((a, g) => a + g.membros.length, 0);
  console.log(`Ligas da semana ${semana}: ${nG} grupos, ${nA} alunos${cur && cur.semana !== semana ? ' · semana anterior fechada' : ''} · prémios novos: ${nPrem}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  correr(N(process.env.AGORA) || Date.now()).then(() => process.exit(0)).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
}
