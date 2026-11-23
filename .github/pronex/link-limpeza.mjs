// Pronex_Link · limpeza diária e números da comunidade (corre na tarefa «Pronex_Link · tarefas diárias»).
// Apaga o que já não faz falta guardar e escreve link_stats/geral (números do Início, sem dados pessoais).
// O registo mostra só contagens: o repositório é público.
import { ligar } from './comum.mjs';

const { db } = ligar();
const DIA = 864e5, agora = Date.now();
const c = { avisosAntigos: 0, conversasCanceladas: 0, mensagens: 0, vistosSoltos: 0, cotasAntigas: 0 };

async function apagarDocs(refs) {
  for (let i = 0; i < refs.length; i += 400) { const b = db.batch(); refs.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); }
}

// 1. Avisos já lidos com mais de 90 dias.
{ const s = await db.collection('link_avisos').where('lido', '==', true).get();
  const velhos = s.docs.filter(d => (d.data().em || 0) < agora - 90 * DIA).map(d => d.ref);
  c.avisosAntigos = velhos.length; await apagarDocs(velhos); }

// 2. Conversas de pedidos cancelados há mais de 6 meses (com as mensagens).
const pedidos = (await db.collection('link_pedidos').get()).docs.map(d => ({ id: d.id, ...d.data() }));
const cancelados = new Set(pedidos.filter(p => p.estado === 'cancelado' && (p.editadoEm || p.inicioEm || p.criadoEm || agora) < agora - 180 * DIA).map(p => p.id));
const conversas = (await db.collection('link_conversas').get()).docs;
for (const cv of conversas) {
  if (!cancelados.has(cv.data().pedidoId)) continue;
  const ms = await cv.ref.collection('msgs').get();
  c.mensagens += ms.size; await apagarDocs(ms.docs.map(d => d.ref)); await cv.ref.delete(); c.conversasCanceladas++;
}

// 3. «Vistos» de conversas que já não existem.
{ const ids = new Set(conversas.map(d => d.id)); cancelados.size && conversas.filter(d => cancelados.has(d.data().pedidoId)).forEach(d => ids.delete(d.id));
  const s = await db.collection('link_vistos').get();
  const soltos = s.docs.filter(d => !ids.has(d.data().cid)).map(d => d.ref); c.vistosSoltos = soltos.length; await apagarDocs(soltos); }

// 4. Cotas de propostas de outros dias (só a de hoje conta).
{ const s = await db.collection('link_cotas').get(); const d0 = new Date(); const hoje = d0.getUTCFullYear() + '-' + (d0.getUTCMonth() + 1) + '-' + d0.getUTCDate();
  const velhas = s.docs.filter(d => d.data().dia !== hoje).map(d => d.ref); c.cotasAntigas = velhas.length; await apagarDocs(velhas); }

// 4b. Contagens de uso com mais de 400 dias (as recentes chegam para ver tendências).
{ const s = await db.collection('link_uso').get(); const lim = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const velhas = s.docs.filter(d => d.id.slice(0, 10) < lim).map(d => d.ref); c.usoAntigo = velhas.length; await apagarDocs(velhas); }

// 4c. Rede: reações e comentários de publicações apagadas, membros de grupos apagados, candidaturas de vagas apagadas, visitas com mais de 90 dias.
{ const ids = async col => new Set((await db.collection(col).select().get()).docs.map(d => d.id));
  const posts = await ids('link_posts'), grupos = await ids('link_grupos'), vagas = await ids('link_vagas'), lim = Date.now() - 90 * 864e5;
  const orfaos = async (col, campo, vivos) => { const s = await db.collection(col).get(); const l = s.docs.filter(d => !vivos.has(d.get(campo))).map(d => d.ref); await apagarDocs(l); return l.length; };
  c.redeReacoes = await orfaos('link_reacoes', 'postId', posts); c.redeComentarios = await orfaos('link_comentarios', 'postId', posts);
  c.redeMembros = await orfaos('link_membros', 'grupoId', grupos); c.redeCandidaturas = await orfaos('link_candidaturas', 'vagaId', vagas);
  const vs = await db.collection('link_visitas').where('em', '<', lim).get(); c.visitasAntigas = vs.size; await apagarDocs(vs.docs.map(d => d.ref)); }

// 4d. Estudo (0.14): respostas e votos de dúvidas ou respostas apagadas, inscrições de sessões apagadas,
// sessões que acabaram há mais de 30 dias (e as suas inscrições) e mensagens de grupo de grupos ou pedidos apagados.
{ const ids = async col => new Set((await db.collection(col).select().get()).docs.map(d => d.id));
  const orfaos = async (col, campo, vivos) => { const s = await db.collection(col).get(); const l = s.docs.filter(d => !vivos.has(d.get(campo))).map(d => d.ref); await apagarDocs(l); return l.length; };
  c.estudoRespostas = await orfaos('link_respostas', 'duvidaId', await ids('link_duvidas'));
  c.estudoVotos = await orfaos('link_votos', 'respostaId', await ids('link_respostas'));
  const lim = Date.now() - 30 * 864e5, ss = await db.collection('link_sessoes').get();
  const velhas = ss.docs.filter(d => (d.get('quando') || 0) + (d.get('duracao') || 0) * 60000 < lim).map(d => d.ref); c.sessoesAntigas = velhas.length; await apagarDocs(velhas);
  c.estudoInscricoes = await orfaos('link_inscricoes', 'sessaoId', await ids('link_sessoes'));
  const grupos = await ids('link_grupos'), peds = new Map((await db.collection('link_pedidos').select('estado').get()).docs.map(d => [d.id, d.get('estado')]));
  let n = 0; for (const g of await db.collection('link_salas').listDocuments()) { const [t, ref] = g.id.split('~'); const viva = t === 'gr' ? grupos.has(ref) : peds.has(ref) && peds.get(ref) !== 'cancelado';
    if (!viva) { const ms = await g.collection('msgs').listDocuments(); n += ms.length; await apagarDocs(ms); } }
  c.salasSoltas = n; }

// 5. Números da comunidade (link_stats/geral).
const pessoas = (await db.collection('link_pessoas').get()).docs.map(d => d.data());
const porArea = {};
pedidos.filter(p => p.estado === 'aberto' && !p.oculto).forEach(p => { porArea[p.area] = (porArea[p.area] || 0) + 1; });
const stats = {
  pessoas: pessoas.length, disponiveis: pessoas.filter(p => p.disponivel).length,
  abertos: pedidos.filter(p => p.estado === 'aberto' && !p.oculto).length, concluidos: pedidos.filter(p => p.estado === 'concluido').length,
  aDecorrer: pedidos.filter(p => ['em_curso', 'entregue'].includes(p.estado)).length, porArea, em: agora
};
await db.collection('link_stats').doc('geral').set(stats);

console.log('Pronex_Link · limpeza:', Object.entries(c).map(([k, n]) => k + ' ' + n).join(' · '));
console.log('Números: pessoas ' + stats.pessoas + ' · disponíveis ' + stats.disponiveis + ' · abertos ' + stats.abertos + ' · a decorrer ' + stats.aDecorrer + ' · concluídos ' + stats.concluidos);
