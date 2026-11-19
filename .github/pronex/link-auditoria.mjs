// Pronex_Link · auditoria da base de dados (só lê; nunca muda nada).
// Verifica se os dados das coleções link_* estão coerentes entre si e mostra só números e códigos de problema:
// o repositório é público, por isso nunca escreve nomes, emails, textos ou identificadores de pessoas nos registos.
// Correr: pela tarefa «Pronex_Link · auditoria» (manual) ou, nos testes, contra o emulador depois do ensaio com contas:
//   node link-auditoria.mjs            → relatório (sai com 0 mesmo com avisos)
//   node link-auditoria.mjs --estrito  → sai com 1 se houver algum problema (usado nos testes)
import { ligar } from './comum.mjs';

const { db } = ligar();
const estrito = process.argv.includes('--estrito');
const DIA = 864e5, agora = Date.now();
const problemas = {}, avisos = {};
const p = (k, n = 1) => { problemas[k] = (problemas[k] || 0) + n; };
const a = (k, n = 1) => { avisos[k] = (avisos[k] || 0) + n; };

async function todos(col) { const s = await db.collection(col).get(); return s.docs.map(d => ({ _id: d.id, ...d.data() })); }
const [pessoas, pedidos, propostas, conversas, perguntas, recs, avisosDocs, denuncias, pecas, vistos, professores] = await Promise.all(
  ['link_pessoas', 'link_pedidos', 'link_propostas', 'link_conversas', 'link_perguntas', 'link_recs', 'link_avisos', 'link_denuncias', 'link_pecas', 'link_vistos', 'link_professores'].map(todos));
const P = new Map(pessoas.map(x => [x._id, x])), PD = new Map(pedidos.map(x => [x._id, x])), PR = new Map(propostas.map(x => [x._id, x])), CV = new Map(conversas.map(x => [x._id, x]));

// Pessoas
pessoas.forEach(x => {
  if (x.uid !== x._id) p('pessoa_uid_diferente_do_documento');
  if (typeof x.nome !== 'string' || x.nome.trim().length < 2) p('pessoa_sem_nome');
  if (x.disponivel && !(x.areas || []).length) p('pessoa_disponivel_sem_areas');
  if (x.foto && x.foto.length > 60000) p('pessoa_foto_grande_de_mais');
});
// Pedidos
pedidos.forEach(x => {
  if (x.id !== x._id) p('pedido_id_diferente_do_documento');
  if (!P.has(x.uid)) a('pedido_de_conta_apagada');
  if (['em_curso', 'entregue', 'concluido'].includes(x.estado)) {
    if (!x.freelancerUid) p('pedido_em_trabalho_sem_quem_faz');
    else if (!P.has(x.freelancerUid)) a('pedido_feito_por_conta_apagada');
    const pr = PR.get(x.propostaId);
    if (!pr) a('pedido_em_trabalho_sem_proposta');
    else if (pr.estado !== 'aceite' || pr.uid !== x.freelancerUid) p('pedido_e_proposta_nao_batem_certo');
    if (x.estado !== 'concluido' && !CV.has('cv_' + x._id + '_' + x.freelancerUid)) p('trabalho_a_decorrer_sem_conversa');
  }
  if (x.estado === 'aberto' && x.freelancerUid) p('pedido_aberto_com_quem_faz');
  // equipas
  const eq = x.equipa || {};
  if (Object.keys(eq).length + (x.freelancerUid ? 1 : 0) > (x.vagas || 1)) p('equipa_acima_das_vagas');
  if ((x.vagas || 1) > 1 && x.tipo !== 'equipa') p('vagas_em_pedido_que_nao_e_de_equipa');
  Object.entries(eq).forEach(([u, prid]) => {
    const pr = PR.get(prid); if (!pr || pr.estado !== 'aceite' || pr.uid !== u) p('membro_sem_proposta_aceite');
    if (u === x.uid || u === x.freelancerUid) p('membro_repetido_na_equipa');
    if (['em_curso', 'entregue'].includes(x.estado) && !CV.has('cv_' + x._id + '_' + u)) p('membro_sem_conversa');
  });
  if (x.estado === 'entregue' && !x.entrega) p('pedido_entregue_sem_entrega');
  if (x.estado === 'concluido' && !x.semResposta && !x.avaliacao) p('pedido_concluido_sem_avaliacao');
  if (x.estado === 'aberto' && agora - (x.editadoEm || x.criadoEm || agora) > 30 * DIA) a('pedido_aberto_parado_30_dias');
  if (x.estado === 'entregue' && x.entrega && agora - x.entrega.em > 14 * DIA) a('entrega_por_ver_ha_14_dias');
  if ((x.entregas || []).length > 5) p('pedido_com_mais_de_5_entregas');
});
// Propostas
propostas.forEach(x => {
  const pd = PD.get(x.pedidoId);
  if (!pd) { a('proposta_de_pedido_apagado'); return; }
  if (x.dono !== pd.uid) p('proposta_com_dono_errado');
  if (x.estado === 'aceite' && pd.propostaId !== x._id && pd.estado !== 'aberto') a('proposta_aceite_que_nao_e_a_do_pedido');
  if (x.estado === 'pendente' && pd.estado !== 'aberto') a('proposta_pendente_em_pedido_fechado');
});
// Conversas e mensagens
let msgs = 0, msgsSemDono = 0, bytesImg = 0;
for (const c of conversas) {
  const pd = PD.get(c.pedidoId);
  if (!pd) a('conversa_de_pedido_apagado');
  else if (c.uids[0] !== pd.uid) p('conversa_com_pessoas_erradas');
  else if (c.uids[1] !== pd.freelancerUid && !(pd.equipa || {})[c.uids[1]] && pd.estado !== 'aberto') a('conversa_de_quem_ja_saiu_do_trabalho');
  if (!Array.isArray(c.uids) || c.uids.length !== 2) p('conversa_sem_duas_pessoas');
  const ms = await db.collection('link_conversas').doc(c._id).collection('msgs').get();
  ms.forEach(d => { const m = d.data(); msgs++; if (m.uid && !(c.uids || []).includes(m.uid)) msgsSemDono++; bytesImg += (m.img || '').length; });
}
if (msgsSemDono) p('mensagem_de_quem_nao_esta_na_conversa', msgsSemDono);
// Perguntas, recomendações, peças, avisos, vistos, denúncias
perguntas.forEach(x => { const pd = PD.get(x.pedidoId); if (!pd) a('pergunta_de_pedido_apagado'); else if (x.dono !== pd.uid) p('pergunta_com_dono_errado'); });
recs.forEach(x => { if (x._id !== 'rc_' + x.de + '_' + x.para) p('recomendacao_id_errado'); const q = P.get(x.para); if (q && q.tipo !== 'aluno') p('recomendacao_para_quem_nao_e_aluno'); if (!P.has(x.de)) a('recomendacao_de_conta_apagada'); });
pecas.forEach(x => { if (!P.has(x.uid)) a('peca_de_conta_apagada'); bytesImg += (x.img || '').length; });
pedidos.forEach(x => { bytesImg += (x.img || '').length + (x.entregas || []).reduce((n, e) => n + (e.img || '').length, 0); });
avisosDocs.forEach(x => { if (!P.has(x.para)) a('aviso_para_conta_apagada'); if (x.lido && agora - x.em > 90 * DIA) a('aviso_lido_com_mais_de_90_dias'); });
vistos.forEach(x => { if (!CV.has(x.cid)) a('visto_de_conversa_apagada'); });
denuncias.forEach(x => { if (x.estado === 'aberta' && agora - x.em > 14 * DIA) a('denuncia_por_ver_ha_14_dias'); });
const professoresSemConfirmacao = pessoas.filter(x => x.tipo === 'professor').length - professores.length;
if (professoresSemConfirmacao > 0) a('mais_professores_do_que_emails_confirmados', professoresSemConfirmacao);

// Relatório (só números)
const linha = (k, n) => console.log('  ' + String(n).padStart(5) + '  ' + k);
console.log('Pronex_Link · auditoria da base de dados');
console.log('Documentos: pessoas ' + pessoas.length + ' · pedidos ' + pedidos.length + ' · propostas ' + propostas.length + ' · conversas ' + conversas.length + ' (mensagens ' + msgs + ') · perguntas ' + perguntas.length + ' · recomendações ' + recs.length + ' · peças ' + pecas.length + ' · avisos ' + avisosDocs.length + ' · vistos ' + vistos.length + ' · denúncias ' + denuncias.length);
console.log('Imagens guardadas nos documentos: cerca de ' + Math.round(bytesImg * 0.75 / 1024) + ' KB');
console.log(Object.keys(problemas).length ? 'PROBLEMAS (dados incoerentes):' : 'Sem problemas: os dados estão coerentes.');
Object.entries(problemas).forEach(([k, n]) => linha(k, n));
if (Object.keys(avisos).length) { console.log('Avisos (normais com o uso, a vigiar):'); Object.entries(avisos).forEach(([k, n]) => linha(k, n)); }
process.exit(estrito && Object.keys(problemas).length ? 1 : 0);
