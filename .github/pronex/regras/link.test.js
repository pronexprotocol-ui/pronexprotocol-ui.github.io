/* Pronex_Link · testes das regras do Firestore (bloco «Pronex_Link» de firestore.rules)
   Correr com o emulador (Java 11+), na pasta .github/pronex/regras:
     npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-pronex "npx mocha link.test.js --timeout 20000"
   Cada teste tenta uma ação que tem de passar e outra parecida que tem de ser recusada. */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, where, writeBatch, serverTimestamp } = require('firebase/firestore');

const RULES = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
// O email do administrador é lido das próprias regras, para os testes não ficarem desatualizados.
const ADMIN_EMAIL = (RULES.match(/token\.get\('email', ''\) == '([^']+)'/) || [])[1];
const ANA = 'ana_uid_00000000000001', RUI = 'rui_uid_00000000000002', PROF = 'prof_uid_0000000000003', ZE = 'ze_uid_000000000000004', ADMIN = 'adm_uid_00000000000005', NOVO = 'novo_uid_0000000000006';
const EMAIL = { [ANA]: 'ana@escola.pt', [RUI]: 'rui@escola.pt', [PROF]: 'professora@escola.pt', [ZE]: 'ze@escola.pt', [ADMIN]: ADMIN_EMAIL, [NOVO]: 'novo@escola.pt' };
const DIA = 864e5;
const T0 = Date.now(); // data de criação fixa: as regras não deixam mudar criadoEm

let env;
const db = uid => env.authenticatedContext(uid, { email: EMAIL[uid], email_verified: uid !== NOVO, firebase: { sign_in_provider: 'password' } }).firestore();
async function semRegras(f) { await env.withSecurityRulesDisabled(async c => f(c.firestore())); }

const pessoa = (uid, extra = {}) => Object.assign({ uid, nome: 'Pessoa ' + uid.slice(0, 3), tipo: 'aluno', curso: '11.º', bio: '', oferece: '', areas: ['design'], niveis: { design: 2 }, ferramentas: [], horas: '', foto: '', disponivel: true, experiencias: [], criadoEm: T0 }, extra);
const pedido = (id, uid, extra = {}) => Object.assign({ id, uid, tipo: 'projeto', area: 'design', titulo: 'Logótipo para o clube', precisa: 'Um logótipo com uma nota musical.', objetivo: 'Usar nos cartazes do clube.', finalidade: '', prazo: '', formato: '', img: '', portefolioOk: true, estado: 'aberto', freelancerUid: '', propostaId: '', tarefas: [], entregas: [], oculto: false, criadoEm: T0 }, extra);
const proposta = (id, pid, dono, uid, extra = {}) => Object.assign({ id, pedidoId: pid, dono, uid, texto: 'Faço o logótipo em cinco dias.', dias: 5, origem: 'proposta', estado: 'pendente', criadoEm: T0 }, extra);
const aviso = (id, de, para) => ({ id, para, de, texto: 'Tens uma proposta nova.', alvo: { t: 'pedido', id: 'x' }, em: Date.now(), lido: false });
const P = (c, ...s) => doc(c, ...s);

// Põe um pedido no servidor sem passar pelas regras (para testar um passo a meio do percurso).
async function semear(pid, dono, campos, propostas = []) {
  await semRegras(async f => { await setDoc(P(f, 'link_pedidos', pid), pedido(pid, dono, campos)); for (const p of propostas) await setDoc(P(f, 'link_propostas', p.id), p); });
}
// Escolha de uma proposta, como a app a grava: pedido, proposta, conversa, aviso do sistema e aviso à pessoa.
function escolher(f, pid, dono, faz, prid, quem) {
  const b = writeBatch(f), cid = 'cv_' + pid + '_' + faz, agora = Date.now();
  b.set(P(f, 'link_pedidos', pid), pedido(pid, dono, { estado: 'em_curso', freelancerUid: faz, propostaId: prid, inicioEm: agora }));
  b.set(P(f, 'link_propostas', prid), proposta(prid, pid, dono, faz, quem === 'convite' ? { origem: 'convite', texto: '', dias: 0, estado: 'aceite' } : { estado: 'aceite' }));
  b.set(P(f, 'link_conversas', cid), { id: cid, pedidoId: pid, uids: [dono, faz] });
  b.set(P(f, 'link_conversas', cid, 'msgs', 'm_ini'), { id: 'm_ini', uid: '', por: quem === 'convite' ? faz : dono, texto: 'O trabalho começou.', em: agora });
  return b.commit();
}

describe('Pronex_Link · regras', function () {
  before(async () => {
    if (!ADMIN_EMAIL) throw new Error('Não encontrei o email do administrador nas regras.');
    env = await initializeTestEnvironment({ projectId: 'demo-link', firestore: { rules: RULES, host, port: Number(port) } });
  });
  after(async () => { if (env) await env.cleanup(); });
  beforeEach(async () => {
    await env.clearFirestore();
    await semRegras(async f => {
      for (const u of [ANA, RUI, PROF, ZE, ADMIN, NOVO]) await setDoc(P(f, 'consent', u), { versao: '1', aceitouEm: new Date(), idade13: true, termos: true });
      await setDoc(P(f, 'link_professores', EMAIL[PROF]), { por: ADMIN, em: Date.now() });
      for (const u of [ANA, RUI, ZE]) await setDoc(P(f, 'link_pessoas', u), pessoa(u));
      await setDoc(P(f, 'link_pessoas', PROF), pessoa(PROF, { tipo: 'professor' }));
    });
  });

  describe('perfis e portefólio', () => {
    it('cada pessoa escreve só o seu perfil', async () => {
      await assertSucceeds(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { bio: 'Gosto de design.', criadoEm: (await getDoc(P(db(ANA), 'link_pessoas', ANA))).data().criadoEm })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', RUI), pessoa(RUI)));
    });
    it('só entra como professor quem o administrador confirmou', async () => {
      await assertFails(setDoc(P(db(ZE), 'link_pessoas', ZE), pessoa(ZE, { tipo: 'professor' })));
      await semRegras(f => deleteDoc(P(f, 'link_pessoas', PROF)));
      await assertSucceeds(setDoc(P(db(PROF), 'link_pessoas', PROF), pessoa(PROF, { tipo: 'professor' })));
    });
    it('recusa campos a mais, disponível sem áreas e conta por confirmar', async () => {
      await assertFails(setDoc(P(db(ZE), 'link_pessoas', ZE), Object.assign(pessoa(ZE), { admin: true })));
      await assertFails(setDoc(P(db(ZE), 'link_pessoas', ZE), pessoa(ZE, { areas: [], disponivel: true })));
      await assertFails(setDoc(P(db(NOVO), 'link_pessoas', NOVO), pessoa(NOVO)));
    });
    it('peças do portefólio só da própria pessoa', async () => {
      const peca = { id: 'p_1', uid: ANA, titulo: 'Cartaz', desc: '', area: 'design', img: '', link: 'https://exemplo.pt/x', em: Date.now() };
      await assertSucceeds(setDoc(P(db(ANA), 'link_pecas', 'p_1'), peca));
      await assertFails(setDoc(P(db(RUI), 'link_pecas', 'p_1'), Object.assign({}, peca, { titulo: 'Roubado' })));
      await assertFails(setDoc(P(db(RUI), 'link_pecas', 'p_2'), Object.assign({}, peca, { id: 'p_2' })));
      await assertFails(setDoc(P(db(ANA), 'link_pecas', 'p_3'), Object.assign({}, peca, { id: 'p_3', link: 'javascript:alert(1)' })));
    });
  });

  describe('pedidos e propostas', () => {
    it('publica um pedido aberto, não um já começado', async () => {
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA)));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_2'), pedido('pd_2', ANA, { estado: 'em_curso', freelancerUid: RUI })));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_3'), pedido('pd_3', RUI)));
      await assertFails(setDoc(P(db(NOVO), 'link_pedidos', 'pd_4'), pedido('pd_4', NOVO)));
    });
    it('quem pediu edita o texto; mais ninguém', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, { titulo: 'Logótipo novo para o clube', editadoEm: Date.now() })));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, { titulo: 'Mudado por outra pessoa' })));
    });
    it('proposta: de outra pessoa, para um pedido aberto, com aviso', async () => {
      await semear('pd_1', ANA, {});
      const f = db(RUI), b = writeBatch(f);
      b.set(P(f, 'link_propostas', 'pr_1'), proposta('pr_1', 'pd_1', ANA, RUI));
      b.set(P(f, 'link_avisos', 'av_1'), aviso('av_1', RUI, ANA));
      await assertSucceeds(b.commit());
      await assertFails(setDoc(P(db(ANA), 'link_propostas', 'pr_2'), proposta('pr_2', 'pd_1', ANA, ANA)));
      await assertFails(setDoc(P(db(RUI), 'link_propostas', 'pr_3'), proposta('pr_3', 'pd_1', RUI, RUI)));
    });
    it('escolher: só quem pediu, e só uma proposta pendente desse pedido', async () => {
      await semear('pd_1', ANA, {}, [proposta('pr_1', 'pd_1', ANA, RUI)]);
      await assertFails(escolher(db(RUI), 'pd_1', ANA, RUI, 'pr_1'));
      await assertFails(escolher(db(ANA), 'pd_1', ANA, ZE, 'pr_1'));
      await assertSucceeds(escolher(db(ANA), 'pd_1', ANA, RUI, 'pr_1'));
    });
    it('convite: quem foi convidado aceita e passa a fazer', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(ANA), 'link_propostas', 'pr_c'), proposta('pr_c', 'pd_1', ANA, RUI, { origem: 'convite', texto: '', dias: 0 })));
      await assertFails(escolher(db(ZE), 'pd_1', ANA, ZE, 'pr_c', 'convite'));
      await assertSucceeds(escolher(db(RUI), 'pd_1', ANA, RUI, 'pr_c', 'convite'));
    });
    it('quem bloqueou não recebe propostas nem perguntas dessa pessoa', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(ANA), 'link_privado', ANA), { guardados: { pedidos: [], pessoas: [] }, bloqueios: [ZE], lidas: {} }));
      await assertFails(setDoc(P(db(ZE), 'link_propostas', 'pr_z'), proposta('pr_z', 'pd_1', ANA, ZE)));
      await assertFails(setDoc(P(db(ZE), 'link_perguntas', 'q_z'), { id: 'q_z', pedidoId: 'pd_1', dono: ANA, uid: ZE, texto: 'É para quando?', em: Date.now(), resposta: '', respEm: 0 }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_perguntas', 'q_r'), { id: 'q_r', pedidoId: 'pd_1', dono: ANA, uid: RUI, texto: 'É para quando?', em: Date.now(), resposta: '', respEm: 0 }));
      await assertSucceeds(updateDoc(P(db(ANA), 'link_perguntas', 'q_r'), { resposta: 'Para sexta.', respEm: Date.now() }));
      await assertFails(getDoc(P(db(ZE), 'link_privado', ANA)));
    });
    it('cada pessoa só lê as propostas em que é parte', async () => {
      await semear('pd_1', ANA, {}, [proposta('pr_1', 'pd_1', ANA, RUI)]);
      await assertSucceeds(getDocs(query(collection(db(RUI), 'link_propostas'), where('uid', '==', RUI))));
      await assertSucceeds(getDocs(query(collection(db(ANA), 'link_propostas'), where('dono', '==', ANA))));
      await assertFails(getDoc(P(db(ZE), 'link_propostas', 'pr_1')));
    });
  });

  describe('trabalho em curso', () => {
    const emCurso = { estado: 'em_curso', freelancerUid: RUI, propostaId: 'pr_1', inicioEm: Date.now() };
    async function preparar(campos = {}) {
      await semear('pd_1', ANA, Object.assign({}, emCurso, campos), [proposta('pr_1', 'pd_1', ANA, RUI, { estado: 'aceite' })]);
      await semRegras(f => setDoc(P(f, 'link_conversas', 'cv_pd_1_' + RUI), { id: 'cv_pd_1_' + RUI, pedidoId: 'pd_1', uids: [ANA, RUI] }));
    }
    const entrega = (em = Date.now()) => ({ texto: 'Logótipo em SVG e PNG.', link: 'https://exemplo.pt/pasta', img: '', em, alteracoes: '' });
    it('conversa: só as duas pessoas leem e escrevem', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI;
      await assertSucceeds(setDoc(P(db(RUI), 'link_conversas', c, 'msgs', 'm_1'), { id: 'm_1', uid: RUI, texto: 'Olá!', img: '', em: Date.now() }));
      await assertFails(setDoc(P(db(RUI), 'link_conversas', c, 'msgs', 'm_2'), { id: 'm_2', uid: ANA, texto: 'Fingir ser a Ana', img: '', em: Date.now() }));
      await assertFails(setDoc(P(db(ZE), 'link_conversas', c, 'msgs', 'm_3'), { id: 'm_3', uid: ZE, texto: 'Intruso', img: '', em: Date.now() }));
      await assertFails(getDocs(collection(db(ZE), 'link_conversas', c, 'msgs')));
      await assertSucceeds(getDocs(query(collection(db(ANA), 'link_conversas'), where('uids', 'array-contains', ANA))));
    });
    it('só quem faz entrega; só quem pediu conclui e avalia', async () => {
      await preparar();
      const e = entrega();
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: e, entregas: [e] }))));
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: e, entregas: [e] }))));
      const fim = Object.assign({}, emCurso, { estado: 'concluido', entrega: e, entregas: [e], avaliacao: { estrelas: 5, texto: 'Ótimo.', em: Date.now() }, concluidoEm: Date.now() });
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, fim)));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, fim, { avaliacao: { estrelas: 9, texto: '', em: Date.now() } }))));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, fim)));
      // quem fez avalia quem pediu, uma vez
      const comDono = Object.assign({}, fim, { avalDono: { estrelas: 4, texto: '', em: Date.now() } });
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, comDono)));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, comDono, { avalDono: { estrelas: 1, texto: '', em: Date.now() } }))));
    });
    it('fechar sem resposta: só depois de 7 dias', async () => {
      const recente = entrega(), antiga = entrega(Date.now() - 8 * DIA);
      await preparar({ estado: 'entregue', entrega: recente, entregas: [recente] });
      const fechar = e => pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'concluido', entrega: e, entregas: [e], semResposta: true, concluidoEm: Date.now() }));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), fechar(recente)));
      await semear('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: antiga, entregas: [antiga] }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), fechar(antiga)));
    });
    it('desistir devolve o pedido a aberto; tarefas pelas duas pessoas', async () => {
      await preparar();
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { tarefas: [{ id: 't1', texto: 'Esboço', feito: false }] }))));
      await assertFails(setDoc(P(db(ZE), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { tarefas: [] }))));
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, { inicioEm: emCurso.inicioEm, tarefas: [{ id: 't1', texto: 'Esboço', feito: false }], entrega: null })));
    });
    it('cancelar: só quem pediu', async () => {
      await preparar();
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'cancelado', motivo: 'x' }))));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'cancelado', motivo: 'Já não preciso.' }))));
    });
  });

  describe('comunidade e moderação', () => {
    it('recomendações: só professores confirmados, para alunos', async () => {
      const rec = (de, para) => ({ id: 'rc_' + de + '_' + para, de, para, texto: 'Aluno muito cuidadoso e cumpridor.', em: Date.now() });
      await assertSucceeds(setDoc(P(db(PROF), 'link_recs', 'rc_' + PROF + '_' + RUI), rec(PROF, RUI)));
      await assertFails(setDoc(P(db(ANA), 'link_recs', 'rc_' + ANA + '_' + RUI), rec(ANA, RUI)));
      await assertFails(setDoc(P(db(PROF), 'link_recs', 'rc_x'), rec(PROF, RUI)));
    });
    it('avisos: só quem recebe lê e marca como lido', async () => {
      await assertSucceeds(setDoc(P(db(RUI), 'link_avisos', 'av_1'), aviso('av_1', RUI, ANA)));
      await assertFails(setDoc(P(db(RUI), 'link_avisos', 'av_2'), aviso('av_2', ANA, ZE)));
      await assertSucceeds(getDocs(query(collection(db(ANA), 'link_avisos'), where('para', '==', ANA))));
      await assertFails(getDoc(P(db(ZE), 'link_avisos', 'av_1')));
      await assertSucceeds(updateDoc(P(db(ANA), 'link_avisos', 'av_1'), { lido: true }));
      await assertFails(updateDoc(P(db(ANA), 'link_avisos', 'av_1'), { texto: 'mudado' }));
    });
    it('denúncias e pedidos ocultos: só o administrador', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(RUI), 'link_denuncias', 'dn_1'), { id: 'dn_1', tipo: 'pedido', alvo: 'pd_1', motivo: 'É um trabalho para nota', texto: '', uid: RUI, em: Date.now(), estado: 'aberta' }));
      await assertFails(getDocs(collection(db(ANA), 'link_denuncias')));
      await assertSucceeds(getDocs(collection(db(ADMIN), 'link_denuncias')));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, { oculto: true })));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_pedidos', 'pd_1'), { oculto: true }));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_denuncias', 'dn_1'), { estado: 'resolvida' }));
    });
    it('professores: só o administrador junta e lista', async () => {
      await assertFails(setDoc(P(db(ANA), 'link_professores', 'ana@escola.pt'), { por: ANA, em: Date.now() }));
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_professores', 'novo.prof@escola.pt'), { por: ADMIN, em: Date.now() }));
      await assertFails(getDocs(collection(db(ANA), 'link_professores')));
      await assertSucceeds(getDoc(P(db(PROF), 'link_professores', EMAIL[PROF])));
    });
    it('apagar os meus dados: perfil, pedidos abertos e conversas', async () => {
      await semear('pd_1', ANA, {}, [proposta('pr_1', 'pd_1', ANA, RUI)]);
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_propostas', 'pr_1')));
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_pedidos', 'pd_1')));
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_pessoas', ANA)));
      await assertFails(deleteDoc(P(db(ANA), 'link_pessoas', RUI)));
    });
  });
});
