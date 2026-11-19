/* Pronex_Link · testes das regras do Firestore (bloco «Pronex_Link» de firestore.rules)
   Correr com o emulador (Java 11+), na pasta .github/pronex/regras:
     npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-pronex "npx mocha link.test.js --timeout 20000"
   Cada teste tenta uma ação que tem de passar e outra parecida que tem de ser recusada. */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, where, writeBatch, serverTimestamp, Timestamp } = require('firebase/firestore');

// O período de transição (legado) fica desligado nos testes: o ritmo é sempre verificado, como depois dessa data.
const RULES = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8').replace('timestamp.date(2026, 11, 25)', 'timestamp.date(2000, 1, 1)');
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
const aviso = (id, de, para) => ({ id, para, de, texto: 'Tens uma proposta nova.', alvo: { t: 'pedido', id: 'pd_1' }, em: Date.now(), lido: false });
const P = (c, ...s) => doc(c, ...s);
const pergunta = (id, uid, dono = ANA) => ({ id, pedidoId: 'pd_1', dono, uid, texto: 'É para quando?', em: Date.now(), resposta: '', respEm: 0 });
const msg = (id, uid, texto = 'Olá!') => ({ id, uid, texto, img: '', em: Date.now() });

// Grava como a app: o conteúdo novo e, no mesmo lote, o carimbo de ritmo em utilizadores/{uid} (hora do servidor).
function comCarimbo(f, uid, campo, escritas) {
  const b = writeBatch(f);
  b.set(P(f, 'utilizadores', uid), { [campo]: serverTimestamp() }, { merge: true });
  escritas.forEach(([ref, v]) => b.set(doc(f, ref.path), v)); // a referência pode vir de outra instância
  return b.commit();
}
const publicar = (uid, ref, v) => comCarimbo(db(uid), uid, 'ultimoPost', [[ref, v]]);
const escrever = (uid, ref, v) => comCarimbo(db(uid), uid, 'ultimaMsg', [[ref, v]]);

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
      for (const u of [ANA, RUI, PROF, ZE, ADMIN]) await setDoc(P(f, 'utilizadores', u), { uid: u, criadoEm: Timestamp.fromMillis(Date.now() - 3600e3) });
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
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA)));
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA)));
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
      const f = db(RUI);
      await assertSucceeds(comCarimbo(f, RUI, 'ultimoPost', [[P(f, 'link_propostas', 'pr_1'), proposta('pr_1', 'pd_1', ANA, RUI)], [P(f, 'link_avisos', 'av_1'), aviso('av_1', RUI, ANA)]]));
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
      await assertFails(publicar(ZE, P(db(ZE), 'link_propostas', 'pr_z'), proposta('pr_z', 'pd_1', ANA, ZE)));
      await assertFails(publicar(ZE, P(db(ZE), 'link_perguntas', 'q_z'), pergunta('q_z', ZE)));
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_perguntas', 'q_r'), pergunta('q_r', RUI)));
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
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_conversas', c, 'msgs', 'm_1'), msg('m_1', RUI)));
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
    it('mensagens: ritmo de 3 s; cada pessoa apaga só as suas', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI, M = (f, m) => P(f, 'link_conversas', c, 'msgs', m);
      await assertSucceeds(escrever(RUI, M(db(RUI), 'm_1'), msg('m_1', RUI)));
      await assertFails(escrever(RUI, M(db(RUI), 'm_2'), msg('m_2', RUI, 'Logo a seguir')));
      await assertSucceeds(escrever(ANA, M(db(ANA), 'm_3'), msg('m_3', ANA, 'Recebido.')));
      await assertFails(deleteDoc(M(db(ANA), 'm_1')));
      await assertSucceeds(deleteDoc(M(db(RUI), 'm_1')));
      await assertSucceeds(deleteDoc(M(db(ADMIN), 'm_3')));
    });
    it('resposta a uma mensagem: só com id e texto curto', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI;
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_conversas', c, 'msgs', 'm_r1'), Object.assign(msg('m_r1', RUI, 'Sim!'), { resp: { id: 'm_ini', uid: ANA, texto: 'Podes amanhã?' } })));
      await assertFails(escrever(ANA, P(db(ANA), 'link_conversas', c, 'msgs', 'm_r2'), Object.assign(msg('m_r2', ANA, 'Ok'), { resp: { id: 'm_r1', texto: 'x'.repeat(141) } })));
    });
    it('«visto»: só quem está na conversa marca e só a outra pessoa lê', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI, v = (uid, para) => ({ cid: c, uid, para, em: Date.now() });
      await assertSucceeds(setDoc(P(db(ANA), 'link_vistos', c + '_' + ANA), v(ANA, RUI)));
      await assertFails(setDoc(P(db(ZE), 'link_vistos', c + '_' + ZE), v(ZE, ANA)));
      await assertFails(setDoc(P(db(ANA), 'link_vistos', c + '_' + RUI), v(RUI, ANA)));
      await assertFails(setDoc(P(db(ANA), 'link_vistos', c + '_' + ANA), v(ANA, ZE)));
      await assertSucceeds(getDocs(query(collection(db(RUI), 'link_vistos'), where('para', '==', RUI))));
      await assertFails(getDoc(P(db(ZE), 'link_vistos', c + '_' + ANA)));
    });
    it('quem foi bloqueado não escreve na conversa', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI;
      await semRegras(f => setDoc(P(f, 'link_privado', ANA), { guardados: {}, bloqueios: [RUI], lidas: {} }));
      await assertFails(escrever(RUI, P(db(RUI), 'link_conversas', c, 'msgs', 'm_b'), msg('m_b', RUI)));
      await semRegras(f => setDoc(P(f, 'link_privado', ANA), { guardados: {}, bloqueios: [], lidas: {} }));
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_conversas', c, 'msgs', 'm_c'), msg('m_c', RUI)));
    });
    it('apagar a conversa inteira leva as mensagens das duas pessoas', async () => {
      await preparar();
      const c = 'cv_pd_1_' + RUI;
      await semRegras(f => setDoc(P(f, 'link_conversas', c, 'msgs', 'm_r'), msg('m_r', RUI)));
      const f = db(ANA), b = writeBatch(f);
      b.delete(P(f, 'link_conversas', c, 'msgs', 'm_r')); b.delete(P(f, 'link_conversas', c));
      await assertSucceeds(b.commit());
    });
    it('cancelar: só quem pediu', async () => {
      await preparar();
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'cancelado', motivo: 'x' }))));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'cancelado', motivo: 'Já não preciso.' }))));
    });
  });

  describe('ritmo e identidade (como a Pronex_Study)', () => {
    it('publicações: uma de cada vez, com 10 s entre elas', async () => {
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA)));
      await assertFails(publicar(ANA, P(db(ANA), 'link_pedidos', 'pd_2'), pedido('pd_2', ANA)));
      // a pergunta logo a seguir também conta como publicação
      await semear('pd_r', RUI, {});
      const q = id => Object.assign(pergunta(id, ANA, RUI), { pedidoId: 'pd_r' });
      await assertFails(publicar(ANA, P(db(ANA), 'link_perguntas', 'q_1'), q('q_1')));
      await assertSucceeds(publicar(ZE, P(db(ZE), 'link_perguntas', 'q_2'), Object.assign(q('q_2'), { uid: ZE })));
      // o carimbo não pode ir para trás nem ser inventado
      await assertFails(setDoc(P(db(ANA), 'utilizadores', ANA), { uid: ANA, ultimoPost: Timestamp.fromMillis(Date.now() - 3600e3) }, { merge: true }));
    });
    it('convites não contam para o ritmo', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(ANA), 'link_propostas', 'pr_c'), proposta('pr_c', 'pd_1', ANA, RUI, { origem: 'convite', texto: '', dias: 0 })));
    });
    it('0.6: dias no perfil, destaque no portefólio, resposta a uma mensagem', async () => {
      await assertSucceeds(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { dias: ['seg', 'qua'] })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { dias: ['feriado'] })));
      const peca = { id: 'p_d', uid: ANA, titulo: 'Cartaz', desc: '', area: 'design', img: '', link: '', em: Date.now(), destaque: true };
      await assertSucceeds(setDoc(P(db(ANA), 'link_pecas', 'p_d'), peca));
      await assertFails(setDoc(P(db(ANA), 'link_pecas', 'p_e'), Object.assign({}, peca, { id: 'p_e', destaque: 'sim' })));
    });
    it('com perfil na Pronex_Study, o nome é o nick de lá', async () => {
      await semRegras(f => setDoc(P(f, 'perfis', ANA), { nick: 'Ana Costa' }));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { nome: 'Outro Nome' })));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { nome: 'Ana Costa', visto: true })));
      // nick que não cabe aqui (ou com espaços nas pontas): o nome fica livre
      await semRegras(f => setDoc(P(f, 'perfis', RUI), { nick: ' rui ' }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_pessoas', RUI), pessoa(RUI, { nome: 'Rui Matos' })));
    });
    it('perfil com a cor do avatar e o nível da Pronex_Study', async () => {
      const ok = pessoa(ANA, { cor: 7, study: { nivel: 9, streak: 12, xp: 2310 } });
      await assertSucceeds(setDoc(P(db(ANA), 'link_pessoas', ANA), ok));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { cor: 12 })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { study: { nivel: 9, admin: true } })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { study: { nivel: 0 } })));
    });
  });

  describe('comunidade e moderação', () => {
    it('recomendações: só professores confirmados, para alunos', async () => {
      const rec = (de, para) => ({ id: 'rc_' + de + '_' + para, de, para, texto: 'Aluno muito cuidadoso e cumpridor.', em: Date.now() });
      await assertSucceeds(setDoc(P(db(PROF), 'link_recs', 'rc_' + PROF + '_' + RUI), rec(PROF, RUI)));
      await assertFails(setDoc(P(db(ANA), 'link_recs', 'rc_' + ANA + '_' + RUI), rec(ANA, RUI)));
      await assertFails(setDoc(P(db(PROF), 'link_recs', 'rc_x'), rec(PROF, RUI)));
    });
    it('avisos: só entre pessoas ligadas a um pedido ou a uma recomendação', async () => {
      await semear('pd_x', ANA, {});
      const av = (id, de, para, alvo) => Object.assign(aviso(id, de, para), { alvo });
      await assertSucceeds(setDoc(P(db(RUI), 'link_avisos', 'av_a'), av('av_a', RUI, ANA, { t: 'pedido', id: 'pd_x' })));
      await assertSucceeds(setDoc(P(db(ANA), 'link_avisos', 'av_b'), av('av_b', ANA, RUI, { t: 'pedido', id: 'pd_x' })));
      // o Rui não pode avisar o Zé por causa de um pedido da Ana, nem sem pedido, nem de um pedido que não existe
      await assertFails(setDoc(P(db(RUI), 'link_avisos', 'av_c'), av('av_c', RUI, ZE, { t: 'pedido', id: 'pd_x' })));
      await assertFails(setDoc(P(db(RUI), 'link_avisos', 'av_d'), av('av_d', RUI, ZE, null)));
      await assertFails(setDoc(P(db(RUI), 'link_avisos', 'av_e'), av('av_e', RUI, ANA, { t: 'pedido', id: 'nao_existe' })));
      // recomendação: o aviso vai no mesmo lote que a recomendação
      await assertFails(setDoc(P(db(PROF), 'link_avisos', 'av_f'), av('av_f', PROF, RUI, { t: 'pessoa', id: RUI })));
      const f = db(PROF), b = writeBatch(f);
      b.set(P(f, 'link_recs', 'rc_' + PROF + '_' + RUI), { id: 'rc_' + PROF + '_' + RUI, de: PROF, para: RUI, texto: 'Aluno muito cuidadoso e cumpridor.', em: Date.now() });
      b.set(P(f, 'link_avisos', 'av_g'), av('av_g', PROF, RUI, { t: 'pessoa', id: RUI }));
      await assertSucceeds(b.commit());
    });
    it('avisos: só quem recebe lê e marca como lido', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(setDoc(P(db(RUI), 'link_avisos', 'av_1'), aviso('av_1', RUI, ANA)));
      await assertFails(setDoc(P(db(RUI), 'link_avisos', 'av_2'), aviso('av_2', ANA, ZE)));
      await assertSucceeds(getDocs(query(collection(db(ANA), 'link_avisos'), where('para', '==', ANA))));
      await assertFails(getDoc(P(db(ZE), 'link_avisos', 'av_1')));
      await assertSucceeds(updateDoc(P(db(ANA), 'link_avisos', 'av_1'), { lido: true }));
      await assertFails(updateDoc(P(db(ANA), 'link_avisos', 'av_1'), { texto: 'mudado' }));
    });
    it('denúncias e pedidos ocultos: só o administrador', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_denuncias', 'dn_1'), { id: 'dn_1', tipo: 'pedido', alvo: 'pd_1', motivo: 'nota', texto: '', uid: RUI, em: Date.now(), estado: 'aberta' }));
      await assertFails(getDocs(collection(db(ANA), 'link_denuncias')));
      await assertSucceeds(getDocs(collection(db(ADMIN), 'link_denuncias')));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, { oculto: true })));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_pedidos', 'pd_1'), { oculto: true }));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_denuncias', 'dn_1'), { estado: 'resolvida' }));
    });
    it('denúncia de uma mensagem: com autor e texto citado, motivo da lista', async () => {
      const dn = (id, extra) => Object.assign({ id, tipo: 'msg', alvo: 'cv_pd_1_' + RUI + '/m_1', motivo: 'assedio', texto: '', uid: ANA, em: Date.now(), estado: 'aberta', autor: RUI, citacao: 'Texto da mensagem' }, extra);
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_denuncias', 'dn_m'), dn('dn_m')));
      await assertFails(publicar(ZE, P(db(ZE), 'link_denuncias', 'dn_x'), dn('dn_x', { uid: ZE, motivo: 'não gosto' })));
      await assertFails(publicar(ZE, P(db(ZE), 'link_denuncias', 'dn_y'), dn('dn_y', { uid: ZE, citacao: 'x'.repeat(501) })));
      // ritmo: a segunda denúncia logo a seguir é recusada
      await assertFails(publicar(ANA, P(db(ANA), 'link_denuncias', 'dn_z'), dn('dn_z')));
      await assertFails(updateDoc(P(db(ANA), 'link_denuncias', 'dn_m'), { estado: 'resolvida' }));
    });
    it('pedido para entrar como professor: a própria pessoa pede, o administrador vê', async () => {
      const pp = uid => ({ uid, email: EMAIL[uid], nome: 'Zé Professor', disciplina: 'Física', em: Date.now() });
      await assertSucceeds(setDoc(P(db(ZE), 'link_pedidosprof', ZE), pp(ZE)));
      await assertFails(setDoc(P(db(ZE), 'link_pedidosprof', ANA), pp(ANA)));
      await assertFails(setDoc(P(db(ANA), 'link_pedidosprof', ANA), Object.assign(pp(ANA), { email: 'outro@escola.pt' })));
      await assertFails(getDocs(collection(db(ANA), 'link_pedidosprof')));
      await assertSucceeds(getDocs(collection(db(ADMIN), 'link_pedidosprof')));
      await assertSucceeds(deleteDoc(P(db(ADMIN), 'link_pedidosprof', ZE)));
    });
    it('pedidos ocultados: só quem publicou, quem faz e o administrador os leem', async () => {
      await semear('pd_o', ANA, { oculto: true, estado: 'em_curso', freelancerUid: RUI, propostaId: 'pr_o', inicioEm: Date.now() });
      await semear('pd_v', ANA, {});
      await assertFails(getDoc(P(db(ZE), 'link_pedidos', 'pd_o')));
      await assertSucceeds(getDoc(P(db(ZE), 'link_pedidos', 'pd_v')));
      await assertSucceeds(getDoc(P(db(ANA), 'link_pedidos', 'pd_o')));
      await assertSucceeds(getDoc(P(db(RUI), 'link_pedidos', 'pd_o')));
      await assertSucceeds(getDoc(P(db(ADMIN), 'link_pedidos', 'pd_o')));
      // a lista toda só com o filtro (como a app lê)
      await assertFails(getDocs(collection(db(ZE), 'link_pedidos')));
      await assertSucceeds(getDocs(query(collection(db(ZE), 'link_pedidos'), where('oculto', '==', false))));
      await assertSucceeds(getDocs(query(collection(db(ZE), 'link_pedidos'), where('uid', '==', ZE))));
      await assertSucceeds(getDocs(query(collection(db(RUI), 'link_pedidos'), where('freelancerUid', '==', RUI))));
    });
    it('anúncio para todos: só o administrador publica; todas as contas leem', async () => {
      const an = uid => ({ texto: 'Semana da escola: há pedidos de vídeo.', em: Date.now(), por: uid });
      await assertFails(setDoc(P(db(ANA), 'link_anuncios', 'atual'), an(ANA)));
      await assertFails(setDoc(P(db(ADMIN), 'link_anuncios', 'outro'), an(ADMIN)));
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_anuncios', 'atual'), an(ADMIN)));
      await assertSucceeds(getDoc(P(db(ANA), 'link_anuncios', 'atual')));
      await assertFails(deleteDoc(P(db(ANA), 'link_anuncios', 'atual')));
      await assertSucceeds(deleteDoc(P(db(ADMIN), 'link_anuncios', 'atual')));
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
