/* Pronex_Link · testes das regras do Firestore (bloco «Pronex_Link» de firestore.rules)
   Correr com o emulador (Java 11+), na pasta .github/pronex/regras:
     npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-pronex "npx mocha link.test.js --timeout 20000"
   Cada teste tenta uma ação que tem de passar e outra parecida que tem de ser recusada. */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, where, writeBatch, serverTimestamp, Timestamp, increment } = require('firebase/firestore');
const diaUTC = () => { const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };

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
  const b = writeBatch(f), c = { [campo]: serverTimestamp() };
  if (escritas.some(([ref]) => ref.path.startsWith('link_avisos/'))) c.ultimoAviso = serverTimestamp(); // os avisos têm ritmo próprio
  b.set(P(f, 'utilizadores', uid), c, { merge: true });
  // propostas contam para o limite diário (link_cotas/{uid}_{dia}), como a app faz
  const np = escritas.filter(([ref, v]) => ref.path.startsWith('link_propostas/') && v && v.origem === 'proposta').length;
  if (np) b.set(P(f, 'link_cotas', uid + '_' + diaUTC()), { uid, dia: diaUTC(), n: increment(np), em: serverTimestamp() }, { merge: true });
  escritas.forEach(([ref, v]) => b.set(doc(f, ref.path), v)); // a referência pode vir de outra instância
  return b.commit();
}
const publicar = (uid, ref, v) => comCarimbo(db(uid), uid, 'ultimoPost', [[ref, v]]);
const escrever = (uid, ref, v) => comCarimbo(db(uid), uid, 'ultimaMsg', [[ref, v]]);
const avisar = (uid, ref, v) => comCarimbo(db(uid), uid, 'ultimoAviso', [[ref, v]]);

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
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, fim, { avaliacao: Object.assign({}, fim.avaliacao, { criterios: { qualidade: 9 } }) }))));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, fim, { avaliacao: Object.assign({}, fim.avaliacao, { criterios: { simpatia: 5 } }) }))));
      fim.avaliacao = Object.assign({}, fim.avaliacao, { criterios: { qualidade: 5, prazo: 4 } });
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

  describe('equipas (vários membros no mesmo pedido)', () => {
    const INICIO = Date.now(); // fixo: as regras não deixam mudar a data de início
    const emCursoEq = (extra = {}) => Object.assign({ tipo: 'equipa', vagas: 3, estado: 'em_curso', freelancerUid: RUI, propostaId: 'pr_r', inicioEm: INICIO }, extra);
    async function prepararEquipa(extra = {}) {
      await semear('pd_e', ANA, emCursoEq(extra), [proposta('pr_r', 'pd_e', ANA, RUI, { estado: 'aceite' }), proposta('pr_z', 'pd_e', ANA, ZE)]);
    }
    // como a app grava: pedido com o novo membro, proposta aceite, conversa e aviso do sistema
    function juntar(f, uid, prid, equipa) {
      const b = writeBatch(f), cid = 'cv_pd_e_' + uid;
      b.set(P(f, 'link_pedidos', 'pd_e'), pedido('pd_e', ANA, emCursoEq({ equipa, novoMembro: uid })));
      b.set(P(f, 'link_propostas', prid), proposta(prid, 'pd_e', ANA, uid, { estado: 'aceite' }));
      b.set(P(f, 'link_conversas', cid), { id: cid, pedidoId: 'pd_e', uids: [ANA, uid] });
      b.set(P(f, 'link_conversas', cid, 'msgs', 'm_e'), { id: 'm_e', uid: '', por: ANA, texto: 'Entraste na equipa.', em: Date.now() });
      return b.commit();
    }
    it('vagas: só em pedidos de equipa, de 1 a 5', async () => {
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_pedidos', 'pd_v'), pedido('pd_v', ANA, { tipo: 'equipa', vagas: 3 })));
      await semRegras(f => setDoc(P(f, 'utilizadores', ZE), { uid: ZE, criadoEm: Timestamp.fromMillis(Date.now() - 3600e3) }));
      await assertFails(publicar(ZE, P(db(ZE), 'link_pedidos', 'pd_w'), pedido('pd_w', ZE, { tipo: 'projeto', vagas: 3 })));
      await assertFails(publicar(ZE, P(db(ZE), 'link_pedidos', 'pd_x'), pedido('pd_x', ZE, { tipo: 'equipa', vagas: 9 })));
    });
    it('quem pediu junta um membro com a proposta dele aceite no mesmo lote', async () => {
      await prepararEquipa();
      await assertFails(juntar(db(RUI), ZE, 'pr_z', { [ZE]: 'pr_z' }));
      const f = db(ANA), b = writeBatch(f); // sem aceitar a proposta não entra
      b.set(P(f, 'link_pedidos', 'pd_e'), pedido('pd_e', ANA, emCursoEq({ equipa: { [ZE]: 'pr_z' }, novoMembro: ZE }))); await assertFails(b.commit());
      await assertSucceeds(juntar(db(ANA), ZE, 'pr_z', { [ZE]: 'pr_z' }));
      // o membro escreve na sua conversa; quem não está na equipa não
      await assertSucceeds(escrever(ZE, P(db(ZE), 'link_conversas', 'cv_pd_e_' + ZE, 'msgs', 'm_z'), msg('m_z', ZE, 'Fico com a parte do som.')));
      await assertFails(escrever(PROF, P(db(PROF), 'link_conversas', 'cv_pd_e_' + ZE, 'msgs', 'm_p'), msg('m_p', PROF, 'Intruso')));
    });
    it('não passa das vagas; propostas novas só enquanto há vagas', async () => {
      await prepararEquipa({ vagas: 2, equipa: { [PROF]: 'pr_p' } });
      await semRegras(f => setDoc(P(f, 'link_propostas', 'pr_p'), proposta('pr_p', 'pd_e', ANA, PROF, { estado: 'aceite' })));
      await assertFails(juntar(db(ANA), ZE, 'pr_z', { [PROF]: 'pr_p', [ZE]: 'pr_z' }));
      await semRegras(f => setDoc(P(f, 'utilizadores', ZE), { uid: ZE, criadoEm: Timestamp.fromMillis(Date.now() - 3600e3) }));
      await assertFails(publicar(ZE, P(db(ZE), 'link_propostas', 'pr_z2'), proposta('pr_z2', 'pd_e', ANA, ZE)));
      await prepararEquipa({ vagas: 3, equipa: {} });
      await assertSucceeds(publicar(ZE, P(db(ZE), 'link_propostas', 'pr_z2'), proposta('pr_z2', 'pd_e', ANA, ZE)));
    });
    it('um membro sai sozinho; não tira os outros', async () => {
      await prepararEquipa({ equipa: { [ZE]: 'pr_z', [PROF]: 'pr_p' } });
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_e'), pedido('pd_e', ANA, emCursoEq({ equipa: { [PROF]: 'pr_p' } }))));
      await assertFails(setDoc(P(db(ZE), 'link_pedidos', 'pd_e'), pedido('pd_e', ANA, emCursoEq({ equipa: {} }))));
      await assertSucceeds(setDoc(P(db(ZE), 'link_pedidos', 'pd_e'), pedido('pd_e', ANA, emCursoEq({ equipa: { [PROF]: 'pr_p' } }))));
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
      await assertSucceeds(avisar(RUI, P(db(RUI), 'link_avisos', 'av_a'), av('av_a', RUI, ANA, { t: 'pedido', id: 'pd_x' })));
      await assertSucceeds(avisar(ANA, P(db(ANA), 'link_avisos', 'av_b'), av('av_b', ANA, RUI, { t: 'pedido', id: 'pd_x' })));
      // o Rui não pode avisar o Zé por causa de um pedido da Ana, nem sem pedido, nem de um pedido que não existe
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_c'), av('av_c', RUI, ZE, { t: 'pedido', id: 'pd_x' })));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_d'), av('av_d', RUI, ZE, null)));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_e'), av('av_e', RUI, ANA, { t: 'pedido', id: 'nao_existe' })));
      // recomendação: o aviso vai no mesmo lote que a recomendação
      await assertFails(avisar(PROF, P(db(PROF), 'link_avisos', 'av_f'), av('av_f', PROF, RUI, { t: 'pessoa', id: RUI })));
      const f = db(PROF), b = writeBatch(f);
      b.set(P(f, 'utilizadores', PROF), { ultimoAviso: serverTimestamp() }, { merge: true });
      b.set(P(f, 'link_recs', 'rc_' + PROF + '_' + RUI), { id: 'rc_' + PROF + '_' + RUI, de: PROF, para: RUI, texto: 'Aluno muito cuidadoso e cumpridor.', em: Date.now() });
      b.set(P(f, 'link_avisos', 'av_g'), av('av_g', PROF, RUI, { t: 'pessoa', id: RUI }));
      await assertSucceeds(b.commit());
    });
    it('avisos: ritmo próprio de 2 s (sem travar as mensagens)', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(avisar(RUI, P(db(RUI), 'link_avisos', 'av_r1'), aviso('av_r1', RUI, ANA)));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_r2'), aviso('av_r2', RUI, ANA)));
      // sem carimbo nenhum também não passa
      await assertFails(setDoc(P(db(ZE), 'link_avisos', 'av_r3'), aviso('av_r3', ZE, ANA)));
    });
    it('avisos: só quem recebe lê e marca como lido', async () => {
      await semear('pd_1', ANA, {});
      await assertSucceeds(avisar(RUI, P(db(RUI), 'link_avisos', 'av_1'), aviso('av_1', RUI, ANA)));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_2'), aviso('av_2', ANA, ZE)));
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
    it('limite diário de propostas: 10 por dia, contadas no servidor', async () => {
      await semear('pd_1', ANA, {});
      await semRegras(f => setDoc(P(f, 'link_cotas', RUI + '_' + diaUTC()), { uid: RUI, dia: diaUTC(), n: 10 }));
      await assertFails(publicar(RUI, P(db(RUI), 'link_propostas', 'pr_x'), proposta('pr_x', 'pd_1', ANA, RUI)));
      await semRegras(f => setDoc(P(f, 'link_cotas', RUI + '_' + diaUTC()), { uid: RUI, dia: diaUTC(), n: 9 }));
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_propostas', 'pr_y'), proposta('pr_y', 'pd_1', ANA, RUI)));
      // versões anteriores da app (sem `em`) continuam a passar
      await semRegras(f => setDoc(P(f, 'link_cotas', ZE + '_' + diaUTC()), { uid: ZE, dia: diaUTC(), n: 3 }));
      await assertSucceeds((() => { const f = db(ZE), b = writeBatch(f); b.set(P(f, 'utilizadores', ZE), { ultimoPost: serverTimestamp() }, { merge: true }); b.set(P(f, 'link_cotas', ZE + '_' + diaUTC()), { uid: ZE, dia: diaUTC(), n: 4 }, { merge: true }); b.set(P(f, 'link_propostas', 'pr_v'), proposta('pr_v', 'pd_1', ANA, ZE)); return b.commit(); })());
      // 2.ª proposta do dia a quem tem documento privado (o caso que passava do limite de leituras das regras)
      await semRegras(f => setDoc(P(f, 'link_privado', ANA), { guardados: { pedidos: [], pessoas: [] }, bloqueios: [], lidas: {} }));
      await semRegras(f => setDoc(P(f, 'link_cotas', PROF + '_' + diaUTC()), { uid: PROF, dia: diaUTC(), n: 1 }));
      await assertSucceeds(publicar(PROF, P(db(PROF), 'link_propostas', 'pr_w'), proposta('pr_w', 'pd_1', ANA, PROF)));
      // `em` tem de ser a hora do servidor
      await assertFails(setDoc(P(db(ANA), 'link_cotas', ANA + '_' + diaUTC()), { uid: ANA, dia: diaUTC(), n: 1, em: Timestamp.fromMillis(Date.now() - 86400000) }));
      // sem subir a cota, não passa; a cota não desce nem se inventa noutro dia
      await assertFails(setDoc(P(db(ZE), 'link_propostas', 'pr_z'), proposta('pr_z', 'pd_1', ANA, ZE)));
      await assertFails(setDoc(P(db(RUI), 'link_cotas', RUI + '_' + diaUTC()), { uid: RUI, dia: diaUTC(), n: 1 }));
      await assertFails(setDoc(P(db(ZE), 'link_cotas', ZE + '_2000-1-1'), { uid: ZE, dia: '2000-1-1', n: 1 }));
    });
    it('moderadores: tratam denúncias, ocultam e advertem; não suspendem', async () => {
      await semear('pd_1', RUI, {});
      await semRegras(async f => { await setDoc(P(f, 'link_moderadores', EMAIL[PROF]), { por: ADMIN, em: Date.now() }); await setDoc(P(f, 'link_denuncias', 'dn_1'), { id: 'dn_1', tipo: 'pedido', alvo: 'pd_1', motivo: 'spam', texto: '', uid: ANA, em: Date.now(), estado: 'aberta' }); });
      await assertSucceeds(getDocs(collection(db(PROF), 'link_denuncias')));
      await assertFails(getDocs(collection(db(ZE), 'link_denuncias')));
      await assertSucceeds(updateDoc(P(db(PROF), 'link_denuncias', 'dn_1'), { estado: 'arquivada' }));
      await assertSucceeds(updateDoc(P(db(PROF), 'link_pedidos', 'pd_1'), { oculto: true }));
      await assertFails(updateDoc(P(db(ZE), 'link_pedidos', 'pd_1'), { oculto: false }));
      const adv = (id, de, para) => ({ id, para, de, texto: 'Advertência da moderação: linguagem ofensiva.', alvo: { t: 'moderacao', id: para }, em: Date.now(), lido: false });
      await assertSucceeds(avisar(PROF, P(db(PROF), 'link_avisos', 'av_m'), adv('av_m', PROF, RUI)));
      await assertFails(avisar(ZE, P(db(ZE), 'link_avisos', 'av_z'), adv('av_z', ZE, RUI)));
      await assertFails(setDoc(P(db(PROF), 'bans', RUI), { motivo: 'x', por: PROF, em: serverTimestamp(), ate: null }));
      await assertFails(getDocs(collection(db(PROF), 'link_moderadores')));
      await assertSucceeds(getDoc(P(db(PROF), 'link_moderadores', EMAIL[PROF])));
    });
    it('configuração (palavras proibidas), números e apagar agendado', async () => {
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_config', 'filtro'), { palavras: ['palavrao'], por: ADMIN, em: Date.now() }));
      await assertFails(setDoc(P(db(ANA), 'link_config', 'filtro'), { palavras: [], por: ANA, em: Date.now() }));
      await assertSucceeds(getDoc(P(db(ANA), 'link_config', 'filtro')));
      await assertFails(setDoc(P(db(ADMIN), 'link_stats', 'geral'), { abertos: 1 }));
      await assertSucceeds(setDoc(P(db(ANA), 'link_privado', ANA), { guardados: {}, bloqueios: [], lidas: {}, seguidos: [RUI], apagarEm: Date.now() + 7 * DIA }));
      await assertFails(setDoc(P(db(ANA), 'link_privado', ANA), { guardados: {}, bloqueios: [], lidas: {}, apagarEm: 'amanhã' }));
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

  describe('0.12: acordo, mentor, várias imagens, fixar, reuniões, desafio', () => {
    const INI = Date.now() - 3600e3;
    const emCurso = { estado: 'em_curso', freelancerUid: RUI, propostaId: 'pr_1', inicioEm: INI };
    const cid = 'cv_pd_1_' + RUI;
    async function preparar(campos = {}) {
      await semear('pd_1', ANA, Object.assign({}, emCurso, campos), [proposta('pr_1', 'pd_1', ANA, RUI, { estado: 'aceite' })]);
      await semRegras(f => setDoc(P(f, 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, RUI] }));
    }
    const PNG = 'data:image/png;base64,iVBORw0KGgo=';
    it('acordo: uma pessoa propõe, a outra aceita sem mudar o texto', async () => {
      await preparar();
      const a = { texto: 'Logótipo em SVG e PNG até sexta.', por: RUI, em: Date.now() };
      await assertFails(setDoc(P(db(ZE), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: Object.assign({}, a, { por: ZE }) }))));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: Object.assign({}, a, { por: ANA }) }))));
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: a }))));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: Object.assign({}, a, { aceiteEm: Date.now() }) }))));
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: Object.assign({}, a, { texto: 'Outro texto qualquer aqui.', aceiteEm: Date.now() }) }))));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { acordo: Object.assign({}, a, { aceiteEm: Date.now() }) }))));
    });
    it('mentor: quem pediu escolhe um professor; só ele junta notas, uma de cada vez', async () => {
      await preparar();
      await assertFails(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: ZE }))));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF }))));
      await assertSucceeds(setDoc(P(db(ANA), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF }))));
      const n1 = { texto: 'Bom começo, revejam as cores.', em: Date.now() };
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF, notasMentor: [n1] }))));
      await assertSucceeds(setDoc(P(db(PROF), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF, notasMentor: [n1] }))));
      const n2 = { texto: 'Falta o PNG.', em: Date.now() };
      await assertFails(setDoc(P(db(PROF), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF, notasMentor: [{ texto: 'Mudei a primeira.', em: Date.now() }, n2] }))));
      await assertSucceeds(setDoc(P(db(PROF), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { mentorUid: PROF, notasMentor: [n1, n2] }))));
    });
    it('entrega com até três imagens', async () => {
      await preparar();
      const e = { texto: 'Logótipo em SVG e PNG.', link: '', img: PNG, em: Date.now(), alteracoes: '' };
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: Object.assign({}, e, { imgs: [PNG, PNG, PNG] }), entregas: [e] }))));
      await assertFails(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: Object.assign({}, e, { imgs: ['javascript:1'] }), entregas: [e] }))));
      const ok = Object.assign({}, e, { imgs: [PNG, PNG] });
      await assertSucceeds(setDoc(P(db(RUI), 'link_pedidos', 'pd_1'), pedido('pd_1', ANA, Object.assign({}, emCurso, { estado: 'entregue', entrega: ok, entregas: [ok] }))));
    });
    it('fixar uma mensagem: só as duas pessoas, só o campo fixada', async () => {
      await preparar();
      await assertSucceeds(setDoc(P(db(ANA), 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, RUI], fixada: { id: 'm_1', texto: 'Entrega na sexta', por: ANA } }));
      await assertFails(setDoc(P(db(ZE), 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, RUI] }));
      await assertFails(setDoc(P(db(RUI), 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, ZE], fixada: { id: 'm_1', texto: 'x', por: RUI } }));
      await assertFails(setDoc(P(db(RUI), 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, RUI], fixada: { id: 'm_1', texto: 'x', por: ANA } }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_conversas', cid), { id: cid, pedidoId: 'pd_1', uids: [ANA, RUI] }));
    });
    it('reunião: mensagem com data futura e local curto', async () => {
      await preparar();
      const r = (id, quando, onde = 'Biblioteca') => Object.assign(msg(id, RUI, 'Reunião marcada'), { reuniao: { quando, onde } });
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_conversas', cid, 'msgs', 'm_r1'), r('m_r1', Date.now() + DIA)));
      await assertFails(setDoc(P(db(ANA), 'link_conversas', cid, 'msgs', 'm_r2'), Object.assign(msg('m_r2', ANA, 'Reunião marcada'), { reuniao: { quando: Date.now() - DIA, onde: '' } })));
      await assertFails(setDoc(P(db(ANA), 'link_conversas', cid, 'msgs', 'm_r3'), Object.assign(msg('m_r3', ANA, 'Reunião marcada'), { reuniao: { quando: Date.now() + DIA, onde: 'x'.repeat(81) } })));
    });
    it('recorrente só com valores conhecidos; acordo e mentor não nascem com o pedido', async () => {
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_pedidos', 'pd_9'), pedido('pd_9', ANA, { recorrente: 'semanal' })));
      await assertFails(publicar(RUI, P(db(RUI), 'link_pedidos', 'pd_8'), pedido('pd_8', RUI, { recorrente: 'diario' })));
      await assertFails(publicar(ZE, P(db(ZE), 'link_pedidos', 'pd_7'), pedido('pd_7', ZE, { mentorUid: PROF })));
    });
    it('desafio do mês e interruptores: só o admin escreve', async () => {
      const d = { titulo: 'Cartaz para o Dia da Escola', texto: 'Um cartaz A3.', area: '', ate: '2030-01-31', por: ADMIN, em: Date.now() };
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_config', 'desafio'), d));
      await assertFails(setDoc(P(db(ANA), 'link_config', 'desafio'), Object.assign({}, d, { por: ANA })));
      await assertFails(setDoc(P(db(ADMIN), 'link_config', 'desafio'), Object.assign({}, d, { ate: 123 })));
      await assertSucceeds(deleteDoc(P(db(ADMIN), 'link_config', 'desafio')));
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_config', 'flags'), { mural: false }));
      await assertFails(setDoc(P(db(ADMIN), 'link_config', 'flags'), { mural: 'nao' }));
      await assertFails(setDoc(P(db(ANA), 'link_config', 'flags'), { mural: true }));
    });
  });

  describe('0.12: anúncios, questionário e contagens de uso', () => {
    const hojeISO = () => new Date().toISOString().slice(0, 10);
    it('anúncio com data de fim e só para professores', async () => {
      await assertSucceeds(setDoc(P(db(ADMIN), 'link_anuncios', 'atual'), { texto: 'Reunião de professores', em: Date.now(), por: ADMIN, ate: '2030-01-01', para: 'professores' }));
      await assertFails(setDoc(P(db(ADMIN), 'link_anuncios', 'atual'), { texto: 'Olá a todos', em: Date.now(), por: ADMIN, para: 'pais' }));
      await assertFails(setDoc(P(db(ADMIN), 'link_anuncios', 'atual'), { texto: 'Olá a todos', em: Date.now(), por: ADMIN, ate: 20300101 }));
    });
    it('questionário SUS: cada um o seu; só o admin lê todos', async () => {
      const v = u => ({ uid: u, r: [4, 2, 4, 1, 4, 2, 5, 1, 4, 2], nota: 83, em: Date.now(), versao: '0.12.0' });
      await assertSucceeds(setDoc(P(db(ANA), 'link_sus', ANA), v(ANA)));
      await assertFails(setDoc(P(db(RUI), 'link_sus', ANA), v(ANA)));
      await assertFails(setDoc(P(db(RUI), 'link_sus', RUI), Object.assign(v(RUI), { r: [1, 2, 3] })));
      await assertFails(getDoc(P(db(RUI), 'link_sus', ANA)));
      await assertFails(getDocs(collection(db(ANA), 'link_sus')));
      await assertSucceeds(getDocs(collection(db(ADMIN), 'link_sus')));
    });
    it('contagens de uso: só de hoje, só eventos conhecidos, de 1 em 1, sem leitura para alunos', async () => {
      const id = hojeISO() + '_publicar';
      await assertSucceeds(setDoc(P(db(ANA), 'link_uso', id), { n: increment(1) }, { merge: true }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_uso', id), { n: increment(1) }, { merge: true }));
      await assertFails(setDoc(P(db(RUI), 'link_uso', id), { n: 99 }));
      await assertFails(setDoc(P(db(ANA), 'link_uso', '2020-01-01_publicar'), { n: 1 }));
      await assertFails(setDoc(P(db(ANA), 'link_uso', hojeISO() + '_quem'), { n: 1 }));
      await assertFails(setDoc(P(db(ANA), 'link_uso', hojeISO() + '_abrir'), { n: 1, uid: ANA }));
      await assertFails(getDoc(P(db(ANA), 'link_uso', id)));
      await assertSucceeds(getDoc(P(db(ADMIN), 'link_uso', id)));
    });
  });

  describe('0.13: a rede', () => {
    const par = (a, b) => (a < b ? a + '_' + b : b + '_' + a);
    const lig = (de, para, estado = 'pendente') => Object.assign({ id: par(de, para), uids: [de, para].sort(), de, para, estado, nota: '', em: Date.now() }, estado === 'aceite' ? { aceiteEm: Date.now() } : {});
    const post = (id, uid, extra = {}) => Object.assign({ id, uid, texto: 'Acabei o logótipo do clube.', img: '', video: '', grupoId: '', partilhaDe: '', em: Date.now(), oculto: false }, extra);
    const hoje = () => new Date().toISOString().slice(0, 10);
    const vaga = (id, uid, extra = {}) => Object.assign({ id, uid, titulo: 'Estágio em fotografia', entidade: 'Estúdio da vila', tipo: 'estagio', area: 'foto', local: 'Lousã', texto: 'Três meses a fotografar eventos e produtos.', ate: '2030-01-31', link: '', em: Date.now(), oculto: false, fechada: false }, extra);
    const semear2 = (col, id, v) => semRegras(f => setDoc(P(f, col, id), v));

    it('publicações: cada um publica em seu nome, com vídeo só de serviços conhecidos', async () => {
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_posts', 'ps_a1'), post('ps_a1', ANA)));
      await assertFails(publicar(RUI, P(db(RUI), 'link_posts', 'ps_r1'), post('ps_r1', ANA)));
      await assertFails(publicar(RUI, P(db(RUI), 'link_posts', 'ps_r2'), post('ps_r2', RUI, { video: 'https://site-estranho.com/v' })));
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_posts', 'ps_r3'), post('ps_r3', RUI, { video: 'https://www.youtube.com/watch?v=abc123' })));
      await assertFails(publicar(ZE, P(db(ZE), 'link_posts', 'ps_z1'), post('ps_z1', ZE, { texto: '' })));
      await assertFails(setDoc(P(db(ZE), 'link_posts', 'ps_z2'), post('ps_z2', ZE))); // sem carimbo de ritmo
    });
    it('publicações: só quem publicou edita; a moderação oculta; ocultas não se leem', async () => {
      await semear2('link_posts', 'ps_1', post('ps_1', ANA));
      await assertFails(updateDoc(P(db(RUI), 'link_posts', 'ps_1'), { texto: 'mudei', editadoEm: Date.now() }));
      await assertSucceeds(updateDoc(P(db(ANA), 'link_posts', 'ps_1'), { texto: 'Logótipo final.', editadoEm: Date.now() }));
      await assertFails(updateDoc(P(db(ANA), 'link_posts', 'ps_1'), { oculto: true }));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_posts', 'ps_1'), { oculto: true }));
      await assertFails(getDoc(P(db(RUI), 'link_posts', 'ps_1')));
      await assertSucceeds(getDoc(P(db(ANA), 'link_posts', 'ps_1')));
      await assertSucceeds(getDocs(query(collection(db(RUI), 'link_posts'), where('oculto', '==', false))));
      await assertFails(getDocs(collection(db(RUI), 'link_posts')));
    });
    it('partilhar: só o original e só se estiver visível', async () => {
      await semear2('link_posts', 'ps_1', post('ps_1', ANA));
      await semear2('link_posts', 'ps_2', post('ps_2', ANA, { partilhaDe: 'ps_1' }));
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_posts', 'ps_r1'), post('ps_r1', RUI, { texto: '', partilhaDe: 'ps_1' })));
      await assertFails(publicar(ZE, P(db(ZE), 'link_posts', 'ps_z1'), post('ps_z1', ZE, { partilhaDe: 'ps_2' })));
    });
    it('reações: uma por pessoa e por publicação, só a minha', async () => {
      await semear2('link_posts', 'ps_1', post('ps_1', ANA));
      const r = (uid, tipo = 'gosto') => ({ id: 'ps_1_' + uid, postId: 'ps_1', dono: ANA, uid, tipo, em: Date.now() });
      await assertSucceeds(setDoc(P(db(RUI), 'link_reacoes', 'ps_1_' + RUI), r(RUI)));
      await assertSucceeds(setDoc(P(db(RUI), 'link_reacoes', 'ps_1_' + RUI), r(RUI, 'bravo')));
      await assertFails(setDoc(P(db(RUI), 'link_reacoes', 'ps_1_' + ZE), r(ZE)));
      await assertFails(setDoc(P(db(ZE), 'link_reacoes', 'ps_1_' + ZE), r(ZE, 'odio')));
      await assertFails(setDoc(P(db(ZE), 'link_reacoes', 'ps_1_' + ZE), Object.assign(r(ZE), { dono: RUI })));
      await assertFails(deleteDoc(P(db(ZE), 'link_reacoes', 'ps_1_' + RUI)));
      await assertSucceeds(deleteDoc(P(db(RUI), 'link_reacoes', 'ps_1_' + RUI)));
    });
    it('comentários: com ritmo; apaga quem escreveu ou quem publicou', async () => {
      await semear2('link_posts', 'ps_1', post('ps_1', ANA));
      const c = (id, uid) => ({ id, postId: 'ps_1', dono: ANA, uid, texto: 'Ficou ótimo!', em: Date.now() });
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_comentarios', 'cm_1'), c('cm_1', RUI)));
      await assertFails(escrever(ZE, P(db(ZE), 'link_comentarios', 'cm_2'), Object.assign(c('cm_2', ZE), { dono: ZE })));
      await assertFails(escrever(ZE, P(db(ZE), 'link_comentarios', 'cm_3'), c('cm_3', RUI)));
      await assertFails(deleteDoc(P(db(ZE), 'link_comentarios', 'cm_1')));
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_comentarios', 'cm_1')));
    });
    it('ligações: pedir, só o outro aceita, qualquer um desfaz', async () => {
      await assertSucceeds(setDoc(P(db(ANA), 'link_ligacoes', par(ANA, RUI)), lig(ANA, RUI)));
      await assertFails(setDoc(P(db(ANA), 'link_ligacoes', par(ANA, ZE)), Object.assign(lig(ANA, ZE), { estado: 'aceite' })));
      await assertFails(setDoc(P(db(ZE), 'link_ligacoes', par(ANA, RUI) + 'x'), lig(ZE, RUI)));
      await assertFails(updateDoc(P(db(ANA), 'link_ligacoes', par(ANA, RUI)), { estado: 'aceite', aceiteEm: Date.now() }));
      await assertFails(getDoc(P(db(ZE), 'link_ligacoes', par(ANA, RUI))));
      await assertSucceeds(updateDoc(P(db(RUI), 'link_ligacoes', par(ANA, RUI)), { estado: 'aceite', aceiteEm: Date.now() }));
      await assertSucceeds(getDoc(P(db(ZE), 'link_ligacoes', par(ANA, RUI))));
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_ligacoes', par(ANA, RUI))));
    });
    it('ligações: quem me bloqueou não recebe pedidos meus', async () => {
      await semear2('link_privado', RUI, { uid: RUI, bloqueios: [ZE] });
      await assertFails(setDoc(P(db(ZE), 'link_ligacoes', par(ZE, RUI)), lig(ZE, RUI)));
    });
    it('validar competências e recomendar: só entre ligações; a pessoa escolhe se a recomendação aparece', async () => {
      const v = { id: ANA + '_' + RUI + '_design', alvo: ANA, uid: RUI, area: 'design', em: Date.now() };
      await assertFails(setDoc(P(db(RUI), 'link_validacoes', v.id), v));
      await semear2('link_ligacoes', par(ANA, RUI), lig(ANA, RUI, 'aceite'));
      await assertSucceeds(setDoc(P(db(RUI), 'link_validacoes', v.id), v));
      await assertFails(setDoc(P(db(RUI), 'link_validacoes', ANA + '_' + RUI + '_som'), Object.assign({}, v, { id: ANA + '_' + RUI + '_som', area: 'som' })));
      const t = { id: ANA + '_' + RUI, alvo: ANA, uid: RUI, relacao: 'trabalho', texto: 'A Ana é organizada e cumpre os prazos.', em: Date.now(), visivel: false };
      await assertFails(setDoc(P(db(RUI), 'link_testemunhos', t.id), Object.assign({}, t, { visivel: true })));
      await assertSucceeds(setDoc(P(db(RUI), 'link_testemunhos', t.id), t));
      await assertFails(getDoc(P(db(ZE), 'link_testemunhos', t.id)));
      await assertFails(updateDoc(P(db(RUI), 'link_testemunhos', t.id), { visivel: true }));
      await assertSucceeds(updateDoc(P(db(ANA), 'link_testemunhos', t.id), { visivel: true }));
      await assertSucceeds(getDoc(P(db(ZE), 'link_testemunhos', t.id)));
      await assertFails(setDoc(P(db(ZE), 'link_testemunhos', ANA + '_' + ZE), Object.assign({}, t, { id: ANA + '_' + ZE, uid: ZE })));
    });
    it('visitas ao perfil: só quem foi visitado e quem visitou as leem', async () => {
      const v = { id: ANA + '_' + RUI, alvo: ANA, uid: RUI, em: Date.now() };
      await assertSucceeds(setDoc(P(db(RUI), 'link_visitas', v.id), v));
      await assertFails(setDoc(P(db(RUI), 'link_visitas', ANA + '_' + ZE), Object.assign({}, v, { id: ANA + '_' + ZE, uid: ZE })));
      await assertFails(getDoc(P(db(ZE), 'link_visitas', v.id)));
      await assertSucceeds(getDoc(P(db(ANA), 'link_visitas', v.id)));
      await assertSucceeds(getDocs(query(collection(db(ANA), 'link_visitas'), where('alvo', '==', ANA))));
    });
    it('grupos: quem cria entra no mesmo lote; publicar no grupo só sendo membro', async () => {
      const g = { id: 'gr_1', nome: 'Multimédia', descricao: 'Para o curso.', tipo: 'curso', area: 'design', uid: ANA, em: Date.now() };
      await assertFails(publicar(ANA, P(db(ANA), 'link_grupos', 'gr_1'), g));
      await assertSucceeds(comCarimbo(db(ANA), ANA, 'ultimoPost', [[P(db(ANA), 'link_grupos', 'gr_1'), g], [P(db(ANA), 'link_membros', 'gr_1_' + ANA), { id: 'gr_1_' + ANA, grupoId: 'gr_1', uid: ANA, em: Date.now() }]]));
      await assertFails(publicar(RUI, P(db(RUI), 'link_posts', 'ps_g1'), post('ps_g1', RUI, { grupoId: 'gr_1' })));
      await assertFails(setDoc(P(db(RUI), 'link_membros', 'gr_1_' + ZE), { id: 'gr_1_' + ZE, grupoId: 'gr_1', uid: ZE, em: Date.now() }));
      await assertSucceeds(setDoc(P(db(RUI), 'link_membros', 'gr_1_' + RUI), { id: 'gr_1_' + RUI, grupoId: 'gr_1', uid: RUI, em: Date.now() }));
      await assertSucceeds(publicar(RUI, P(db(RUI), 'link_posts', 'ps_g2'), post('ps_g2', RUI, { grupoId: 'gr_1' })));
      await assertFails(deleteDoc(P(db(RUI), 'link_grupos', 'gr_1')));
      await assertSucceeds(deleteDoc(P(db(ANA), 'link_membros', 'gr_1_' + RUI)));
    });
    it('vagas: só professores publicam; candidaturas só em vagas abertas; quem publicou responde', async () => {
      await assertFails(publicar(ANA, P(db(ANA), 'link_vagas', 'vg_a'), vaga('vg_a', ANA)));
      await assertFails(publicar(PROF, P(db(PROF), 'link_vagas', 'vg_b'), vaga('vg_b', PROF, { ate: '2020-01-01' })));
      await assertSucceeds(publicar(PROF, P(db(PROF), 'link_vagas', 'vg_1'), vaga('vg_1', PROF)));
      const c = { id: 'vg_1_' + ANA, vagaId: 'vg_1', dono: PROF, uid: ANA, texto: 'Fotografo eventos da escola há dois anos.', em: Date.now(), estado: 'enviada' };
      await assertFails(publicar(ANA, P(db(ANA), 'link_candidaturas', c.id), Object.assign({}, c, { estado: 'aceite' })));
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_candidaturas', c.id), c));
      await assertFails(getDoc(P(db(RUI), 'link_candidaturas', c.id)));
      await assertFails(updateDoc(P(db(ANA), 'link_candidaturas', c.id), { estado: 'aceite' }));
      await assertSucceeds(updateDoc(P(db(PROF), 'link_candidaturas', c.id), { estado: 'aceite' }));
      await assertSucceeds(updateDoc(P(db(PROF), 'link_vagas', 'vg_1'), { fechada: true }));
      await assertFails(publicar(RUI, P(db(RUI), 'link_candidaturas', 'vg_1_' + RUI), Object.assign({}, c, { id: 'vg_1_' + RUI, uid: RUI })));
      await assertFails(updateDoc(P(db(PROF), 'link_vagas', 'vg_1'), { fechada: false }));
    });
    it('mensagens diretas: só entre pessoas ligadas', async () => {
      const u = [ANA, RUI].sort(), cid = 'cv_dm_' + u[0] + '_' + u[1];
      await assertFails(setDoc(P(db(ANA), 'link_conversas', cid), { id: cid, pedidoId: '', uids: u }));
      await semear2('link_ligacoes', par(ANA, RUI), lig(ANA, RUI, 'aceite'));
      await assertFails(setDoc(P(db(ANA), 'link_conversas', cid + 'x'), { id: cid + 'x', pedidoId: '', uids: u }));
      await assertSucceeds(setDoc(P(db(ANA), 'link_conversas', cid), { id: cid, pedidoId: '', uids: u }));
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_conversas', cid, 'msgs', 'm_1'), msg('m_1', RUI)));
      await semRegras(f => deleteDoc(P(f, 'link_ligacoes', par(ANA, RUI))));
      await assertFails(escrever(ANA, P(db(ANA), 'link_conversas', cid, 'msgs', 'm_2'), msg('m_2', ANA)));
    });
    it('avisos da rede: só para quem está do outro lado', async () => {
      await semear2('link_posts', 'ps_1', post('ps_1', ANA));
      const a = (id, de, para, alvo) => ({ id, para, de, texto: 'Comentou a tua publicação.', alvo, em: Date.now(), lido: false });
      await assertSucceeds(avisar(RUI, P(db(RUI), 'link_avisos', 'av_1'), a('av_1', RUI, ANA, { t: 'post', id: 'ps_1' })));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_2'), a('av_2', RUI, ZE, { t: 'post', id: 'ps_1' })));
      await assertSucceeds(comCarimbo(db(ZE), ZE, 'ultimoAviso', [[P(db(ZE), 'link_ligacoes', par(ZE, ANA)), lig(ZE, ANA)], [P(db(ZE), 'link_avisos', 'av_3'), a('av_3', ZE, ANA, { t: 'ligacao', id: par(ZE, ANA) })]]));
      await assertFails(avisar(ZE, P(db(ZE), 'link_avisos', 'av_4'), a('av_4', ZE, RUI, { t: 'ligacao', id: par(ZE, ANA) })));
    });
    it('perfil: frase de destaque, aberto a, formação e capa', async () => {
      await assertSucceeds(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { destaque: 'Designer em formação', aberto: ['estagio'], formacao: [{ id: 'f1', escola: 'EPL', curso: 'Multimédia', de: '2024', ate: '2027' }], destaques: [{ t: 'post', id: 'ps_1' }] })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { aberto: ['emprego_pago'] })));
      await assertFails(setDoc(P(db(ANA), 'link_pessoas', ANA), pessoa(ANA, { destaque: 'x'.repeat(121) })));
    });
  });

  describe('0.14: estudo', () => {
    const semear2 = (col, id, v) => semRegras(f => setDoc(P(f, col, id), v));
    const duv = (id, uid, extra = {}) => Object.assign({ id, uid, titulo: 'Como resolvo esta equação exponencial?', texto: '', area: 'mat', exame: '635', img: '', em: Date.now(), oculto: false, resolvida: '' }, extra);
    const resp = (did, dono, uid, extra = {}) => Object.assign({ id: did + '_' + uid, duvidaId: did, dono, uid, texto: 'Aplica o logaritmo aos dois lados.', img: '', em: Date.now(), oculto: false }, extra);
    const ses = (id, uid, extra = {}) => Object.assign({ id, uid, titulo: 'Revisões de Matemática', texto: '', area: 'mat', quando: Date.now() + 2 * DIA, duracao: 60, formato: 'escola', onde: 'Sala 12', lugares: 8, em: Date.now(), cancelada: false, oculto: false }, extra);
    const a = (id, de, para, alvo) => ({ id, para, de, texto: 'Respondeu à tua dúvida.', alvo, em: Date.now(), lido: false });

    it('dúvidas: em nome próprio, com exame válido e ritmo', async () => {
      await assertSucceeds(publicar(ANA, P(db(ANA), 'link_duvidas', 'dv_1'), duv('dv_1', ANA)));
      await assertFails(publicar(RUI, P(db(RUI), 'link_duvidas', 'dv_2'), duv('dv_2', ANA)));
      await assertFails(publicar(RUI, P(db(RUI), 'link_duvidas', 'dv_3'), duv('dv_3', RUI, { exame: '999' })));
      await assertFails(publicar(RUI, P(db(RUI), 'link_duvidas', 'dv_4'), duv('dv_4', RUI, { titulo: 'Curta' })));
      await assertFails(publicar(RUI, P(db(RUI), 'link_duvidas', 'dv_5'), duv('dv_5', RUI, { resolvida: 'x_y' })));
      await assertFails(setDoc(P(db(ZE), 'link_duvidas', 'dv_6'), duv('dv_6', ZE)));
    });
    it('respostas: uma por pessoa, nunca à própria dúvida, e a moderação oculta', async () => {
      await semear2('link_duvidas', 'dv_1', duv('dv_1', ANA));
      await assertSucceeds(escrever(RUI, P(db(RUI), 'link_respostas', 'dv_1_' + RUI), resp('dv_1', ANA, RUI)));
      await assertFails(escrever(ZE, P(db(ZE), 'link_respostas', 'dv_1_x'), resp('dv_1', ANA, ZE, { id: 'dv_1_x' })));
      await assertFails(escrever(ANA, P(db(ANA), 'link_respostas', 'dv_1_' + ANA), resp('dv_1', ANA, ANA)));
      await assertFails(escrever(ZE, P(db(ZE), 'link_respostas', 'dv_1_' + ZE), resp('dv_1', RUI, ZE)));
      await assertSucceeds(updateDoc(P(db(RUI), 'link_respostas', 'dv_1_' + RUI), { texto: 'Aplica ln aos dois lados e isola x.', editadoEm: Date.now() }));
      await assertFails(updateDoc(P(db(RUI), 'link_respostas', 'dv_1_' + RUI), { oculto: true }));
      await assertSucceeds(updateDoc(P(db(ADMIN), 'link_respostas', 'dv_1_' + RUI), { oculto: true }));
      await assertFails(getDoc(P(db(ZE), 'link_respostas', 'dv_1_' + RUI)));
      await assertFails(getDocs(collection(db(ZE), 'link_respostas')));
      await assertSucceeds(getDocs(query(collection(db(ZE), 'link_respostas'), where('oculto', '==', false))));
    });
    it('votos e resposta escolhida: só quem perguntou escolhe, e só uma resposta desta dúvida', async () => {
      await semear2('link_duvidas', 'dv_1', duv('dv_1', ANA)); await semear2('link_duvidas', 'dv_2', duv('dv_2', ZE));
      await semear2('link_respostas', 'dv_1_' + RUI, resp('dv_1', ANA, RUI)); await semear2('link_respostas', 'dv_2_' + RUI, resp('dv_2', ZE, RUI));
      const v = (rid, uid, autor = RUI, did = 'dv_1') => ({ id: rid + '_' + uid, respostaId: rid, duvidaId: did, autor, uid, em: Date.now() });
      await assertSucceeds(setDoc(P(db(ZE), 'link_votos', 'dv_1_' + RUI + '_' + ZE), v('dv_1_' + RUI, ZE)));
      await assertFails(setDoc(P(db(RUI), 'link_votos', 'dv_1_' + RUI + '_' + RUI), v('dv_1_' + RUI, RUI)));
      await assertFails(setDoc(P(db(ANA), 'link_votos', 'dv_1_' + RUI + '_' + ANA), v('dv_1_' + RUI, ANA, ZE)));
      await assertFails(updateDoc(P(db(ZE), 'link_duvidas', 'dv_1'), { resolvida: 'dv_1_' + RUI }));
      await assertFails(updateDoc(P(db(ANA), 'link_duvidas', 'dv_1'), { resolvida: 'dv_2_' + RUI }));
      await assertSucceeds(comCarimbo(db(ANA), ANA, 'ultimoAviso', [[P(db(ANA), 'link_duvidas', 'dv_1'), duv('dv_1', ANA, { resolvida: 'dv_1_' + RUI, em: (await getDoc(P(db(ANA), 'link_duvidas', 'dv_1'))).data().em })], [P(db(ANA), 'link_avisos', 'av_e'), a('av_e', ANA, RUI, { t: 'duvida', id: 'dv_1' })]]));
      await assertFails(avisar(ANA, P(db(ANA), 'link_avisos', 'av_f'), a('av_f', ANA, ZE, { t: 'duvida', id: 'dv_1' })));
    });
    it('avisos de dúvidas: quem respondeu avisa quem perguntou', async () => {
      await semear2('link_duvidas', 'dv_1', duv('dv_1', ANA));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_1'), a('av_1', RUI, ANA, { t: 'duvida', id: 'dv_1' })));
      await semear2('link_respostas', 'dv_1_' + RUI, resp('dv_1', ANA, RUI));
      await assertSucceeds(avisar(RUI, P(db(RUI), 'link_avisos', 'av_2'), a('av_2', RUI, ANA, { t: 'duvida', id: 'dv_1' })));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_3'), a('av_3', RUI, ZE, { t: 'duvida', id: 'dv_1' })));
    });
    it('sessões: no futuro, com lugares; inscrição só em sessões abertas de outra pessoa', async () => {
      await assertSucceeds(publicar(PROF, P(db(PROF), 'link_sessoes', 'se_1'), ses('se_1', PROF)));
      await assertFails(publicar(ANA, P(db(ANA), 'link_sessoes', 'se_2'), ses('se_2', ANA, { quando: Date.now() - DIA })));
      await assertFails(publicar(ANA, P(db(ANA), 'link_sessoes', 'se_3'), ses('se_3', ANA, { lugares: 50 })));
      await assertFails(publicar(ANA, P(db(ANA), 'link_sessoes', 'se_4'), ses('se_4', ANA, { formato: 'casa' })));
      const ins = (sid, dono, uid) => ({ id: sid + '_' + uid, sessaoId: sid, dono, uid, em: Date.now() });
      await assertSucceeds(setDoc(P(db(ANA), 'link_inscricoes', 'se_1_' + ANA), ins('se_1', PROF, ANA)));
      await assertFails(setDoc(P(db(PROF), 'link_inscricoes', 'se_1_' + PROF), ins('se_1', PROF, PROF)));
      await assertFails(setDoc(P(db(RUI), 'link_inscricoes', 'se_1_' + RUI), ins('se_1', ANA, RUI)));
      await assertSucceeds(avisar(ANA, P(db(ANA), 'link_avisos', 'av_s'), a('av_s', ANA, PROF, { t: 'sessao', id: 'se_1' })));
      await assertFails(avisar(RUI, P(db(RUI), 'link_avisos', 'av_t'), a('av_t', RUI, PROF, { t: 'sessao', id: 'se_1' })));
      await assertFails(updateDoc(P(db(ANA), 'link_sessoes', 'se_1'), { cancelada: true }));
      await assertSucceeds(updateDoc(P(db(PROF), 'link_sessoes', 'se_1'), { cancelada: true }));
      await assertFails(updateDoc(P(db(PROF), 'link_sessoes', 'se_1'), { cancelada: false }));
      await assertFails(setDoc(P(db(RUI), 'link_inscricoes', 'se_1_' + RUI), ins('se_1', PROF, RUI)));
      await assertSucceeds(deleteDoc(P(db(PROF), 'link_inscricoes', 'se_1_' + ANA)));
    });
    it('conversas de grupo: só membros do grupo ou da equipa', async () => {
      await semear2('link_grupos', 'gr_1', { id: 'gr_1', nome: 'Clube', descricao: '', tipo: 'clube', area: 'mat', uid: ANA, em: Date.now() });
      await semear2('link_membros', 'gr_1_' + ANA, { id: 'gr_1_' + ANA, grupoId: 'gr_1', uid: ANA, em: Date.now() });
      const m = (id, uid, sala, extra = {}) => Object.assign({ id, sala, uid, texto: 'Olá a todos!', img: '', em: Date.now() }, extra);
      await assertSucceeds(escrever(ANA, P(db(ANA), 'link_salas', 'gr~gr_1', 'msgs', 'sm_1'), m('sm_1', ANA, 'gr~gr_1')));
      await assertFails(escrever(RUI, P(db(RUI), 'link_salas', 'gr~gr_1', 'msgs', 'sm_2'), m('sm_2', RUI, 'gr~gr_1')));
      await assertFails(getDocs(collection(db(RUI), 'link_salas', 'gr~gr_1', 'msgs')));
      await assertSucceeds(getDocs(collection(db(ANA), 'link_salas', 'gr~gr_1', 'msgs')));
      await assertFails(escrever(ANA, P(db(ANA), 'link_salas', 'gr~gr_1', 'msgs', 'sm_3'), m('sm_3', ANA, 'gr~gr_9')));
      await assertFails(setDoc(P(db(ANA), 'link_salas', 'gr~gr_1', 'msgs', 'sm_4'), m('sm_4', ANA, 'gr~gr_1'))); // sem ritmo
      // equipa de um pedido: quem pediu, quem coordena e a equipa; o pedido cancelado fecha a sala
      await semear('pd_1', ANA, { estado: 'em_curso', freelancerUid: RUI, equipa: { [ZE]: { em: Date.now() } } });
      await assertSucceeds(escrever(ZE, P(db(ZE), 'link_salas', 'eq~pd_1', 'msgs', 'sm_5'), m('sm_5', ZE, 'eq~pd_1')));
      await assertSucceeds(getDocs(collection(db(RUI), 'link_salas', 'eq~pd_1', 'msgs')));
      await assertFails(getDocs(collection(db(PROF), 'link_salas', 'eq~pd_1', 'msgs')));
      await assertSucceeds(getDocs(collection(db(ADMIN), 'link_salas', 'eq~pd_1', 'msgs')));
      await assertFails(deleteDoc(P(db(RUI), 'link_salas', 'eq~pd_1', 'msgs', 'sm_5')));
      await semear('pd_1', ANA, { estado: 'cancelado', freelancerUid: RUI, equipa: { [ZE]: { em: Date.now() } } });
      await assertFails(escrever(ANA, P(db(ANA), 'link_salas', 'eq~pd_1', 'msgs', 'sm_6'), m('sm_6', ANA, 'eq~pd_1')));
    });
  });
});
