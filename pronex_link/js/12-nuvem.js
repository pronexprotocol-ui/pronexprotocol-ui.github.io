/* Pronex_Link · 12-nuvem.js
   Ligação às contas e à base de dados da Pronex_Study (projeto Firebase pronex-study).
   - Entrar: a mesma conta da Pronex_Study (Google ou email). No mesmo site, quem já entrou lá entra aqui sozinho.
   - Ler: escuta em tempo real as coleções link_* e monta `DB` com a mesma forma do modo de demonstração.
   - Escrever: depois de cada ação, `enviar()` compara `DB` com o que veio do servidor e grava, num só lote,
     só os documentos que mudaram. As regras do Firestore (bloco «Pronex_Link») decidem o que cada pessoa pode escrever.
   Coleções: link_pessoas, link_pedidos, link_propostas, link_conversas (+ msgs), link_perguntas, link_recs,
   link_avisos, link_denuncias, link_pecas, link_privado/{uid} e link_professores/{email} (só o administrador escreve). */
'use strict';
const Nuvem = (function () {
  const VER = '12.19.0'; // a mesma versão do Firebase que a Pronex_Study usa
  const MODO = 'pronex-link-modo';
  let A, Au, Fs, app, auth, fs, user = null, ativa = false, admin = false, professor = false, estado = 'carregar';
  let tentativas = {}, porConfirmar = new Set(), ouvintes = [], ouvMsgs = {}, base = new Map(), dados = {}, primeira = {}, tempoDesenho = 0;
  const COLS = { pessoas: 'link_pessoas', pedidos: 'link_pedidos', propostas: 'link_propostas', conversas: 'link_conversas', perguntas: 'link_perguntas', recs: 'link_recs', avisos: 'link_avisos', denuncias: 'link_denuncias', pecas: 'link_pecas' };
  const disponivel = () => !!window.FIREBASE_CONFIG;
  const modoDemo = () => { try { return localStorage.getItem(MODO) === 'demo'; } catch (e) { return false; } };
  function escolherDemo(sim) { try { if (sim) localStorage.setItem(MODO, 'demo'); else localStorage.removeItem(MODO); } catch (e) { /* sem armazenamento */ } }

  // JSON com as chaves ordenadas: o mesmo documento dá sempre o mesmo texto, venha do servidor ou da app.
  function estavel(v) {
    if (Array.isArray(v)) return '[' + v.map(estavel).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + estavel(v[k])).join(',') + '}';
    return v === undefined ? 'null' : JSON.stringify(v);
  }
  const semMsgs = c => { const o = Object.assign({}, c); delete o.msgs; return o; };
  const limpo = o => JSON.parse(JSON.stringify(o)); // tira os undefined antes de gravar

  /* ---------- arranque e contas ---------- */
  async function iniciar() {
    const b = 'https://www.gstatic.com/firebasejs/' + VER + '/';
    [A, Au, Fs] = await Promise.all([import(b + 'firebase-app.js'), import(b + 'firebase-auth.js'), import(b + 'firebase-firestore.js')]);
    // A mesma app «[DEFAULT]» e o mesmo site da Pronex_Study: quem já entrou lá fica com a sessão aberta aqui.
    app = A.getApps().length ? A.getApp() : A.initializeApp(window.FIREBASE_CONFIG);
    auth = Au.getAuth(app); try { auth.languageCode = 'pt'; } catch (e) { /* idioma por omissão */ }
    // Sem cache no disco: a Pronex_Study usa a do mesmo site e as duas apps não a podem partilhar ao mesmo tempo.
    fs = Fs.initializeFirestore(app, { ignoreUndefinedProperties: true });
    if (window.PRONEX_EMULADOR) { const em = window.PRONEX_EMULADOR; Au.connectAuthEmulator(auth, em.auth, { disableWarnings: true }); Fs.connectFirestoreEmulator(fs, em.host, em.porta); }
    Au.getRedirectResult(auth).catch(e => { if (e && e.code) setTimeout(() => toast(msgErro(e)), 600); });
    Au.onAuthStateChanged(auth, u => entrou(u));
  }
  async function entrou(u) {
    parar(); user = u || null; admin = professor = false;
    if (!user) { ativa = false; estado = 'fora'; desenhar(true); return; }
    if (!user.emailVerified && !user.isAnonymous) { ativa = false; estado = 'confirmar'; desenhar(true); return; }
    if (user.isAnonymous) { ativa = false; estado = 'anonimo'; desenhar(true); return; }
    try { professor = (await Fs.getDoc(Fs.doc(fs, 'link_professores', user.email.toLowerCase()))).exists(); } catch (e) { professor = false; }
    try { await Fs.getDocs(Fs.query(Fs.collection(fs, 'link_denuncias'), Fs.limit(1))); admin = true; } catch (e) { admin = false; }
    DB = { v: 2, eu: user.uid, minha: user.uid, tema: lerLocal('tema') || 'escuro', texto: lerLocal('texto') || 'normal', pessoas: {}, pedidos: [], propostas: [], conversas: [], denuncias: [], avisos: [], perguntas: [], recs: [], pecas: [], lidas: {}, guardados: {}, bloqueios: {}, rascunhos: {}, guia: {} };
    const r = lerLocal('rascunho'); if (r) DB.rascunhos[user.uid] = r;
    if (lerLocal('guia')) DB.guia[user.uid] = true;
    ativa = true; estado = 'carregar'; base = new Map(); dados = {}; primeira = {};
    ouvir();
  }
  const chaveLocal = k => 'pronex-link-' + k + '-' + (user ? user.uid : '');
  function lerLocal(k) { try { const v = localStorage.getItem(chaveLocal(k)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function gravarLocal(k, v) { try { if (v == null) localStorage.removeItem(chaveLocal(k)); else localStorage.setItem(chaveLocal(k), JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }

  /* ---------- ler em tempo real ---------- */
  function ouvir() {
    const me = user.uid, C = n => Fs.collection(fs, n), Q = Fs.query, W = Fs.where;
    const fontes = [
      ['pessoas', Q(C('link_pessoas'), Fs.limit(1000))],
      ['pedidos', Q(C('link_pedidos'), Fs.orderBy('criadoEm', 'desc'), Fs.limit(400))],
      ['pecas', Q(C('link_pecas'), Fs.limit(2000))],
      ['perguntas', Q(C('link_perguntas'), Fs.limit(2000))],
      ['recs', Q(C('link_recs'), Fs.limit(1000))],
      ['propostas', Q(C('link_propostas'), W('uid', '==', me))],
      ['propostas', Q(C('link_propostas'), W('dono', '==', me))],
      ['conversas', Q(C('link_conversas'), W('uids', 'array-contains', me))],
      ['avisos', Q(C('link_avisos'), W('para', '==', me), Fs.limit(200))],
      ['denuncias', admin ? Q(C('link_denuncias'), Fs.limit(500)) : Q(C('link_denuncias'), W('uid', '==', me))]
    ];
    fontes.forEach(([col, q], i) => {
      const k = col + '#' + i; dados[k] = new Map(); primeira[k] = false;
      // Nas conversas também interessam as mudanças de estado (gravada localmente → confirmada pelo servidor).
      const opcoes = col === 'conversas' ? { includeMetadataChanges: true } : {};
      ouvintes.push(Fs.onSnapshot(q, opcoes, s => {
        const m = new Map(); s.forEach(d => { m.set(d.id, d.data()); if (col === 'conversas') { if (d.metadata.hasPendingWrites) porConfirmar.add(d.id); else porConfirmar.delete(d.id); } });
        dados[k] = m; primeira[k] = true; montar(col); if (col === 'conversas') ouvirMsgs();
      }, e => erroLeitura(e, col)));
    });
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_privado', me), s => { dados.privado = s.exists() ? s.data() : {}; primeira.privado = true; montar('privado'); }, e => erroLeitura(e, 'privado')));
  }
  function ouvirMsgs() {
    const ids = new Set(DB.conversas.map(c => c.id));
    Object.keys(ouvMsgs).forEach(id => { if (!ids.has(id)) { ouvMsgs[id](); delete ouvMsgs[id]; delete dados['msgs#' + id]; } });
    ids.forEach(id => {
      // As mensagens desta conversa só contam depois da primeira leitura (até lá ficam as locais).
      // Uma conversa acabada de criar só é lida depois de o servidor a confirmar: antes disso, as regras recusam a leitura.
      if (ouvMsgs[id] || porConfirmar.has(id)) return;
      ouvMsgs[id] = Fs.onSnapshot(Fs.query(Fs.collection(fs, 'link_conversas', id, 'msgs'), Fs.orderBy('em'), Fs.limitToLast(300)), s => { const m = new Map(); s.forEach(d => m.set(d.id, d.data())); dados['msgs#' + id] = m; montar('msgs'); }, e => {
        // se a leitura falhar, tenta outra vez daqui a uns segundos (até 5 vezes por conversa)
        delete ouvMsgs[id]; tentativas[id] = (tentativas[id] || 0) + 1;
        if (tentativas[id] <= 5 && ativa) setTimeout(ouvirMsgs, 1500 * tentativas[id]); else erroLeitura(e, 'msgs');
      });
    });
  }
  // Volta a montar uma parte de DB a partir do que veio do servidor e atualiza a base de comparação.
  function montar(col) {
    if (!ativa || !DB) return;
    if (col === 'privado') {
      const p = dados.privado || {}, me = user.uid;
      DB.guardados[me] = { pedidos: (p.guardados && p.guardados.pedidos) || [], pessoas: (p.guardados && p.guardados.pessoas) || [] };
      DB.bloqueios[me] = p.bloqueios || []; DB.lidas[me] = p.lidas || {};
      base.set('link_privado/' + me, estavel(privado()));
    } else if (col === 'msgs') {
      DB.conversas.forEach(c => {
        const m = dados['msgs#' + c.id]; if (!m) return;
        [...base.keys()].forEach(k => { if (k.startsWith('link_conversas/' + c.id + '/msgs/') && !m.has(k.split('/')[3])) base.delete(k); });
        c.msgs = [...m.values()].sort((a, b) => a.em - b.em); c.msgs.forEach(x => base.set('link_conversas/' + c.id + '/msgs/' + x.id, estavel(x)));
      });
    } else {
      const m = new Map(); Object.keys(dados).forEach(k => { if (k.startsWith(col + '#')) dados[k].forEach((v, id) => m.set(id, v)); });
      [...base.keys()].forEach(k => { if (k.startsWith(COLS[col] + '/') && k.split('/').length === 2 && !m.has(k.split('/')[1])) base.delete(k); });
      m.forEach((v, id) => base.set(COLS[col] + '/' + id, estavel(v)));
      if (col === 'pessoas') { DB.pessoas = {}; m.forEach((v, id) => { DB.pessoas[id] = v; }); }
      else if (col === 'conversas') {
        const ant = {}; DB.conversas.forEach(c => { ant[c.id] = c.msgs; });
        [...base.keys()].forEach(k => { const p = k.split('/'); if (p[0] === 'link_conversas' && p.length === 4 && !m.has(p[1])) base.delete(k); }); DB.conversas = [...m.values()].map(c => Object.assign({}, c, { msgs: ant[c.id] || [] })); }
      else DB[col] = [...m.values()];
      if (col === 'pedidos') DB.pedidos.sort((a, b) => b.criadoEm - a.criadoEm);
    }
    const pronto = Object.keys(primeira).every(k => primeira[k]);
    if (pronto && estado === 'carregar') estado = 'dentro';
    if (pronto) { clearTimeout(tempoDesenho); tempoDesenho = setTimeout(() => desenhar(), 60); }
  }
  function erroLeitura(e, col) { console.warn('Pronex_Link: leitura de', col, e && e.code); if (e && e.code === 'permission-denied' && col !== 'denuncias') toast('A tua conta não tem acesso a esta parte da app. Confirma o email e aceita os termos na Pronex_Study.'); }
  function parar() { ouvintes.forEach(f => f()); ouvintes = []; Object.values(ouvMsgs).forEach(f => f()); ouvMsgs = {}; tentativas = {}; porConfirmar = new Set(); }

  /* ---------- escrever ---------- */
  function privado() { const me = user.uid; return { guardados: DB.guardados[me] || { pedidos: [], pessoas: [] }, bloqueios: DB.bloqueios[me] || [], lidas: DB.lidas[me] || {} }; }
  // Lista o que mudou em DB desde a última leitura do servidor.
  function mudancas() {
    const atual = new Map(), out = [];
    Object.values(DB.pessoas).forEach(p => atual.set('link_pessoas/' + p.uid, p));
    ['pedidos', 'propostas', 'perguntas', 'recs', 'avisos', 'denuncias', 'pecas'].forEach(col => DB[col].forEach(x => atual.set(COLS[col] + '/' + x.id, x)));
    DB.conversas.forEach(c => { atual.set('link_conversas/' + c.id, semMsgs(c)); (c.msgs || []).forEach(m => atual.set('link_conversas/' + c.id + '/msgs/' + m.id, m)); });
    atual.set('link_privado/' + user.uid, privado());
    atual.forEach((v, k) => { const j = estavel(v); if (base.get(k) !== j) out.push({ k, v, j }); });
    base.forEach((j, k) => { if (!atual.has(k)) out.push({ k, apagar: true }); });
    return out;
  }
  // Grava as mudanças. Devolve true, ou o texto de um erro que se percebe antes de enviar (documento grande de mais).
  function enviar() {
    if (!ativa) return 'Sem ligação à conta.';
    // tema, texto, rascunho e guia ficam só neste dispositivo
    gravarLocal('tema', DB.tema); gravarLocal('texto', DB.texto); gravarLocal('rascunho', DB.rascunhos[user.uid] || null); if (DB.guia[user.uid]) gravarLocal('guia', true);
    const ms = mudancas();
    if (!ms.length) return true;
    const grande = ms.find(m => !m.apagar && m.j.length > 900000);
    if (grande) return 'Isto ficou grande de mais para guardar. Usa imagens mais pequenas ou tira algumas.';
    const lotes = []; for (let i = 0; i < ms.length; i += 450) lotes.push(ms.slice(i, i + 450));
    lotes.forEach(l => {
      const b = Fs.writeBatch(fs);
      l.forEach(m => { const ref = Fs.doc(fs, m.k); if (m.apagar) { b.delete(ref); base.delete(m.k); } else { b.set(ref, limpo(m.v)); base.set(m.k, m.j); } });
      b.commit().catch(e => {
        console.warn('Pronex_Link: escrita recusada', e && e.code, l.map(m => m.k));
        toast(e && e.code === 'permission-denied' ? 'Esta alteração não foi aceite. Atualiza a página e tenta outra vez.' : 'Sem ligação: a alteração não foi guardada. Tenta outra vez.');
        // o servidor volta a mandar o estado verdadeiro; as próximas leituras repõem DB
        l.forEach(m => base.delete(m.k)); Object.keys(COLS).forEach(montar); montar('privado'); montar('msgs');
      });
    });
    return true;
  }

  /* ---------- ações próprias da conta ---------- */
  function msgErro(e) {
    const c = (e && e.code) || '';
    if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Fechaste a janela do Google antes de entrar.';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'O email ou a palavra-passe não estão certos.';
    if (c.includes('too-many-requests')) return 'Demasiadas tentativas. Espera uns minutos e tenta outra vez.';
    if (c.includes('network')) return 'Sem ligação à internet.';
    return 'Não foi possível entrar (' + (c || 'erro') + ').';
  }
  async function entrarGoogle() {
    const p = new Au.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    const instalada = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    try { if (instalada) await Au.signInWithRedirect(auth, p); else await Au.signInWithPopup(auth, p); }
    catch (e) { if (e && e.code === 'auth/popup-blocked') return Au.signInWithRedirect(auth, p); throw e; }
  }
  const entrarEmail = (email, pass) => Au.signInWithEmailAndPassword(auth, String(email).trim(), pass);
  const recuperar = email => Au.sendPasswordResetEmail(auth, String(email).trim());
  const enviarConfirmacao = () => Au.sendEmailVerification(auth.currentUser);
  async function jaConfirmei() { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); await entrou(auth.currentUser); return auth.currentUser.emailVerified; }
  async function sair() { parar(); ativa = false; DB = null; await Au.signOut(auth); }
  // Primeira entrada: aceita os termos (se ainda não aceitou na Pronex_Study) e cria o perfil.
  async function criarPerfil(d) {
    const cref = Fs.doc(fs, 'consent', user.uid);
    let c = null; try { const s = await Fs.getDoc(cref); c = s.exists() ? s.data() : null; } catch (e) { c = null; }
    if (!c || c.idade13 !== true) await Fs.setDoc(cref, { versao: 'link-1', aceitouEm: Fs.serverTimestamp(), idade13: true, termos: true });
    if (d.tipo === 'professor' && !professor) return { erro: 'Para entrares como professor, o administrador tem de confirmar o teu email. Por agora entra como aluno.' };
    const r = Loja.criarPerfil(d);
    if (r.erro) return r;
    await new Promise(ok => setTimeout(ok, 300));
    return r;
  }
  // Nome da Pronex_Study, para propor na criação do perfil.
  async function nomeDaStudy() { try { const s = await Fs.getDoc(Fs.doc(fs, 'perfis', user.uid)); return s.exists() ? String(s.data().nick || '') : ''; } catch (e) { return ''; } }
  // Administrador: emails de professores confirmados.
  async function professores() { const s = await Fs.getDocs(Fs.collection(fs, 'link_professores')); return s.docs.map(d => d.id).sort(); }
  const juntarProfessor = email => Fs.setDoc(Fs.doc(fs, 'link_professores', String(email).trim().toLowerCase()), { por: user.uid, em: Date.now() });
  const tirarProfessor = email => Fs.deleteDoc(Fs.doc(fs, 'link_professores', email));

  return { disponivel, modoDemo, escolherDemo, iniciar, ativa: () => ativa, estado: () => estado, uid: () => (user ? user.uid : ''), email: () => (user ? user.email : ''), admin: () => admin, professor: () => professor,
    enviar, entrarGoogle, entrarEmail, recuperar, enviarConfirmacao, jaConfirmei, sair, criarPerfil, nomeDaStudy, msgErro, professores, juntarProfessor, tirarProfessor, _mudancas: () => mudancas() };
})();
