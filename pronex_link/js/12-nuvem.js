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
  let A, Au, Fs, app, auth, fs, user = null, ativa = false, admin = false, professor = false, moderador = false, estado = 'carregar';
  let cota = { dia: '', n: 0 }, statsGeral = null;
  let susp = null, perfilStudy = null, registoCache = null, pin = { estado: 'carregar', salt: '', hash: '', falhas: 0 }, tentativas = {}, porConfirmar = new Set(), ouvintes = [], ouvMsgs = {}, base = new Map(), dados = {}, primeira = {}, tempoDesenho = 0;
  const COLS = { pessoas: 'link_pessoas', pedidos: 'link_pedidos', propostas: 'link_propostas', conversas: 'link_conversas', perguntas: 'link_perguntas', recs: 'link_recs', avisos: 'link_avisos', denuncias: 'link_denuncias', pecas: 'link_pecas',
    posts: 'link_posts', comentarios: 'link_comentarios', reacoes: 'link_reacoes', ligacoes: 'link_ligacoes', validacoes: 'link_validacoes', testemunhos: 'link_testemunhos', visitas: 'link_visitas', grupos: 'link_grupos', membros: 'link_membros', vagas: 'link_vagas', candidaturas: 'link_candidaturas',
    duvidas: 'link_duvidas', respostas: 'link_respostas', votos: 'link_votos', sessoes: 'link_sessoes', inscricoes: 'link_inscricoes' };
  const disponivel = () => !!window.FIREBASE_CONFIG;
  // 0.20: no site publicado entra-se sempre com a conta PRONEX. A demonstração (dados de exemplo, só neste dispositivo)
  // fica apenas para os ensaios e para quem desenvolve, num servidor local.
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const modoDemo = () => { if (!LOCAL) return false; try { return localStorage.getItem(MODO) === 'demo'; } catch (e) { return false; } };
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
    parar(); user = u || null; admin = professor = moderador = false;
    if (!user) { ativa = false; estado = 'fora'; desenhar(true); return; }
    if (!user.emailVerified && !user.isAnonymous) { ativa = false; estado = 'confirmar'; desenhar(true); return; }
    if (user.isAnonymous) { ativa = false; estado = 'anonimo'; desenhar(true); return; }
    try { professor = (await Fs.getDoc(Fs.doc(fs, 'link_professores', user.email.toLowerCase()))).exists(); } catch (e) { professor = false; }
    // administrador: só ele lê config/admin (os moderadores também leem denúncias, por isso não serve de teste)
    try { await Fs.getDoc(Fs.doc(fs, 'config', 'admin')); admin = true; } catch (e) { admin = false; }
    try { moderador = !admin && (await Fs.getDoc(Fs.doc(fs, 'link_moderadores', user.email.toLowerCase()))).exists(); } catch (e) { moderador = false; }
    await prepararConta();
    DB = { v: 2, eu: user.uid, minha: user.uid, tema: lerLocal('tema') || 'escuro', texto: lerLocal('texto') || 'normal', pessoas: {}, pedidos: [], propostas: [], conversas: [], denuncias: [], avisos: [], perguntas: [], recs: [], pecas: [], posts: [], comentarios: [], reacoes: [], ligacoes: [], validacoes: [], testemunhos: [], visitas: [], grupos: [], membros: [], vagas: [], candidaturas: [], duvidas: [], respostas: [], votos: [], sessoes: [], inscricoes: [], salamsgs: [], lidas: {}, guardados: {}, bloqueios: {}, rascunhos: {}, guia: {} };
    const r = lerLocal('rascunho'); if (r) DB.rascunhos[user.uid] = r;
    if (lerLocal('guia')) DB.guia[user.uid] = true;
    ativa = true; estado = 'carregar'; base = new Map(); dados = {}; primeira = {};
    ouvir();
  }
  // Registo na Pronex_Study (utilizadores/{uid}): as regras usam-no para o ritmo entre mensagens e publicações.
  // Quem só usou a Pronex_Link ainda não o tem: cria-se aqui, como a Pronex_Study faz.
  async function prepararConta() {
    const me = user.uid;
    try { const u = await Fs.getDoc(Fs.doc(fs, 'utilizadores', me)); if (!u.exists()) { const st = Fs.serverTimestamp(); await Fs.setDoc(Fs.doc(fs, 'utilizadores', me), { uid: me, criadoEm: st, ultimoPost: st, ultimaMsg: st }); } } catch (e) { console.warn('Pronex_Link: registo', e && e.code); }
    try { const p = await Fs.getDoc(Fs.doc(fs, 'perfis', me)); perfilStudy = p.exists() ? p.data() : null; } catch (e) { perfilStudy = null; }
    // Suspensão (a mesma da Pronex_Study): por conta e por email
    susp = null;
    const ler = d => { if (!d || !d.exists()) return null; const v = d.data(), ate = v.ate && v.ate.toMillis ? v.ate.toMillis() : 0; return (!ate || ate > Date.now()) ? { motivo: String(v.motivo || ''), ate } : null; };
    try { susp = ler(await Fs.getDoc(Fs.doc(fs, 'bans', me))); } catch (e) { /* sem acesso */ }
    if (!susp && user.email) try { susp = ler(await Fs.getDoc(Fs.doc(fs, 'bansEmail', user.email))); } catch (e) { /* sem acesso */ }
    if (!susp && perfilStudy && perfilStudy.banned === true) susp = { motivo: '', ate: 0 };
  }
  // Traz o nome, a foto, a cor e os números da Pronex_Study para o perfil daqui (uma só identidade).
  function sincronizarIdentidade() {
    const p = DB.pessoas[user.uid], s = perfilStudy; if (!p || !s) return;
    const nome = String(s.nick || '').trim().slice(0, 40), foto = typeof s.foto === 'string' && s.foto.length <= 60000 ? s.foto : '', cor = Number.isInteger(s.cor) && s.cor >= 0 && s.cor < 12 ? s.cor : p.cor;
    const st = { nivel: Math.max(1, parseInt(s.nivel, 10) || 1), streak: Math.max(0, parseInt(s.streak, 10) || 0), xp: Math.max(0, parseInt(s.xp, 10) || 0) };
    const novo = Object.assign({}, p, nome ? { nome } : {}, { foto, cor, study: st });
    if (estavel(novo) !== estavel(p)) { Object.assign(p, novo); enviar(); }
  }
  const chaveLocal = k => 'pronex-link-' + k + '-' + (user ? user.uid : '');
  function lerLocal(k) { try { const v = localStorage.getItem(chaveLocal(k)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function gravarLocal(k, v) { try { if (v == null) localStorage.removeItem(chaveLocal(k)); else localStorage.setItem(chaveLocal(k), JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }

  /* ---------- ler em tempo real ---------- */
  function ouvir() {
    const me = user.uid, C = n => Fs.collection(fs, n), Q = Fs.query, W = Fs.where;
    const fontes = [
      ['pessoas', Q(C('link_pessoas'), Fs.limit(3000))],
      // Os ocultados pela moderação só chegam a quem publicou, a quem faz o trabalho e ao administrador (as regras exigem-no).
      ...(admin ? [['pedidos', Q(C('link_pedidos'), Fs.orderBy('criadoEm', 'desc'), Fs.limit(1500))]]
        : [['pedidos', Q(C('link_pedidos'), W('oculto', '==', false), Fs.limit(1500))], ['pedidos', Q(C('link_pedidos'), W('uid', '==', me))], ['pedidos', Q(C('link_pedidos'), W('freelancerUid', '==', me))]]),
      ['pecas', Q(C('link_pecas'), Fs.limit(2000))],
      // Perguntas: as que fiz e as que me fizeram ficam sempre; as de outro pedido chegam quando o abro (verPerguntas).
      ['perguntas', Q(C('link_perguntas'), W('dono', '==', me))],
      ['perguntas', Q(C('link_perguntas'), W('uid', '==', me))],
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
        dados[k] = m; primeira[k] = true; ultimas[k] = [Date.now(), m.size, s.metadata.fromCache, s.metadata.hasPendingWrites]; montar(col); if (col === 'conversas') ouvirMsgs();
      }, e => { ultimas[k] = ['erro', e && e.code]; erroLeitura(e, col); }));
    });
    ouvintes.push(Fs.onSnapshot(Q(C('link_vistos'), W('para', '==', me)), s => { vistos = {}; s.forEach(d => { const v = d.data(); vistos[v.cid] = v.em; }); if (DB) desenhar(); }, () => { vistos = {}; }));
    // palavras proibidas do administrador, números da comunidade e quantas propostas enviei hoje
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_sus', me), s => { susMeu = s.exists(); }, () => { /* sem questionário */ }));
    if (admin) Fs.getDocs(Fs.collection(fs, 'link_uso')).then(s => { usoLista = s.docs.map(d => ({ id: d.id, n: d.data().n || 0 })); }, () => { usoLista = []; });
    if (admin) Fs.getDocs(Fs.collection(fs, 'link_sus')).then(s => { susLista = s.docs.map(d => d.data()); }, () => { susLista = []; });
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_config', 'desafio'), s => { DB.desafio = s.exists() ? s.data() : null; desenhar(); }, () => { /* sem desafio */ }));
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_config', 'flags'), s => { FLAGS = s.exists() ? s.data() : {}; desenhar(); }, () => { /* tudo ligado */ }));
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_config', 'filtro'), s => { PALAVRAS_EXTRA = s.exists() ? (s.data().palavras || []).map(normPalavra).filter(Boolean) : []; }, () => { /* sem lista extra */ }));
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_stats', 'geral'), s => { statsGeral = s.exists() ? s.data() : null; }, () => { statsGeral = null; }));
    // A cota lê-se por pergunta (uid == eu): ler o documento de hoje pelo nome era recusado enquanto ele não existia, e a leitura morria.
    ouvintes.push(Fs.onSnapshot(Q(C('link_cotas'), W('uid', '==', me)), s => { const dia = diaUTC(); let n = 0; s.forEach(d => { const v = d.data(); if (v.dia === dia) n = v.n || 0; }); cota = { dia, n }; }, () => { /* sem cota */ }));
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_anuncios', 'atual'), s => { anuncioAtual = s.exists() ? s.data() : null; if (DB) desenhar(); }, () => { anuncioAtual = null; }));
    ouvintes.push(Fs.onSnapshot(Fs.doc(fs, 'link_privado', me), s => { dados.privado = s.exists() ? s.data() : {}; primeira.privado = true; montar('privado'); }, e => erroLeitura(e, 'privado')));
  }
  function ouvirMsgs() {
    const ids = new Set(DB.conversas.map(c => c.id));
    Object.keys(ouvMsgs).forEach(id => { if (!ids.has(id)) { ouvMsgs[id](); delete ouvMsgs[id]; delete dados['msgs#' + id]; } });
    ids.forEach(id => {
      // As mensagens desta conversa só contam depois da primeira leitura (até lá ficam as locais).
      // Uma conversa acabada de criar só é lida depois de o servidor a confirmar: antes disso, as regras recusam a leitura.
      if (ouvMsgs[id] || porConfirmar.has(id)) return;
      ouvMsgs[id] = Fs.onSnapshot(Fs.query(Fs.collection(fs, 'link_conversas', id, 'msgs'), Fs.orderBy('em'), Fs.limitToLast(poupanca() ? 60 : 300)), s => { const m = new Map(); s.forEach(d => m.set(d.id, d.data())); dados['msgs#' + id] = m; montar('msgs'); }, e => {
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
      DB.apagarEm = DB.apagarEm || {}; if (p.apagarEm) DB.apagarEm[me] = p.apagarEm; else delete DB.apagarEm[me];
      DB.seguidos = DB.seguidos || {}; DB.seguidos[me] = p.seguidos || [];
      reporCursoPrivado();
      base.set('link_privado/' + me, estavel(privado()));
    } else if (col === 'salamsgs') {
      const m = dados.salamsgs || new Map();
      [...base.keys()].forEach(k => { if (k.startsWith('link_salas/') && !m.has(k.split('/')[3])) base.delete(k); });
      DB.salamsgs = [...m.values()]; DB.salamsgs.forEach(x => base.set('link_salas/' + x.sala + '/msgs/' + x.id, estavel(x)));
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
      if (col === 'pessoas') { DB.pessoas = {}; m.forEach((v, id) => { DB.pessoas[id] = v; }); reporCursoPrivado(); }
      else if (col === 'conversas') {
        const ant = {}; DB.conversas.forEach(c => { ant[c.id] = c.msgs; });
        [...base.keys()].forEach(k => { const p = k.split('/'); if (p[0] === 'link_conversas' && p.length === 4 && !m.has(p[1])) base.delete(k); }); DB.conversas = [...m.values()].map(c => Object.assign({}, c, { msgs: ant[c.id] || [] })); }
      else DB[col] = [...m.values()];
      if (col === 'pedidos') DB.pedidos.sort((a, b) => b.criadoEm - a.criadoEm);
    }
    const pronto = Object.keys(primeira).every(k => primeira[k]);
    if (pronto && estado === 'carregar') { estado = 'dentro'; sincronizarIdentidade(); if (admin) carregarSuspensoes(); carregarRede(true); }
    if (col === 'avisos' && estado === 'dentro' && DB.avisos.some(a => a.alvo && ['post', 'ligacao', 'vaga', 'duvida', 'sessao'].includes(a.alvo.t) && a.em > redeEm)) carregarRede(true);
    if (pronto) { clearTimeout(tempoDesenho); tempoDesenho = setTimeout(() => desenhar(), 60); }
  }
  /* A rede lê-se aos bocados, não em tempo real: ao entrar, ao abrir um ecrã da rede, quando chega um aviso
     da rede (comentário, ligação, candidatura) e de 90 em 90 segundos com a app à vista. Assim cada pessoa
     mantém poucas leituras abertas no servidor (com dezenas, o emulador deixava de entregar as outras). */
  let redeEm = 0, redeACarregar = false, redeRelogio = null, redeOutraVez = false;
  function fontesRede() {
    const me = user.uid, C = c => Fs.collection(fs, c), Q = (...a) => Fs.query(...a), W = Fs.where;
    return [
      ...((admin || moderador) ? [['posts', Q(C('link_posts'), Fs.limit(2000))], ['vagas', Q(C('link_vagas'), Fs.limit(500))]]
        : [['posts', Q(C('link_posts'), W('oculto', '==', false), Fs.limit(2000))], ['posts', Q(C('link_posts'), W('uid', '==', me))], ['vagas', Q(C('link_vagas'), W('oculto', '==', false), Fs.limit(500))], ['vagas', Q(C('link_vagas'), W('uid', '==', me))]]),
      ['comentarios', Q(C('link_comentarios'), Fs.limit(4000))],
      ['reacoes', Q(C('link_reacoes'), Fs.limit(8000))],
      ['ligacoes', Q(C('link_ligacoes'), W('uids', 'array-contains', me))],
      ['ligacoes', Q(C('link_ligacoes'), W('estado', '==', 'aceite'), Fs.limit(5000))],
      ['validacoes', Q(C('link_validacoes'), Fs.limit(5000))],
      ['testemunhos', Q(C('link_testemunhos'), W('visivel', '==', true), Fs.limit(2000))],
      ['testemunhos', Q(C('link_testemunhos'), W('alvo', '==', me))],
      ['testemunhos', Q(C('link_testemunhos'), W('uid', '==', me))],
      ['visitas', Q(C('link_visitas'), W('alvo', '==', me), Fs.limit(300))],
      ['visitas', Q(C('link_visitas'), W('uid', '==', me), Fs.limit(500))],
      ['grupos', Q(C('link_grupos'), Fs.limit(500))],
      ['membros', Q(C('link_membros'), Fs.limit(8000))],
      ['candidaturas', Q(C('link_candidaturas'), W('uid', '==', me))],
      ['candidaturas', Q(C('link_candidaturas'), W('dono', '==', me))],
      // Estudo (0.14). Os ocultados pela moderação só chegam a quem escreveu e à moderação.
      ...((admin || moderador) ? [['duvidas', Q(C('link_duvidas'), Fs.limit(1500))], ['respostas', Q(C('link_respostas'), Fs.limit(5000))], ['sessoes', Q(C('link_sessoes'), Fs.limit(500))]]
        : [['duvidas', Q(C('link_duvidas'), W('oculto', '==', false), Fs.limit(1500))], ['duvidas', Q(C('link_duvidas'), W('uid', '==', me))],
          ['respostas', Q(C('link_respostas'), W('oculto', '==', false), Fs.limit(5000))], ['respostas', Q(C('link_respostas'), W('uid', '==', me))],
          ['sessoes', Q(C('link_sessoes'), W('oculto', '==', false), Fs.limit(500))], ['sessoes', Q(C('link_sessoes'), W('uid', '==', me))]]),
      ['votos', Q(C('link_votos'), Fs.limit(10000))],
      ['inscricoes', Q(C('link_inscricoes'), Fs.limit(5000))]
    ];
  }
  function carregarRede(forcar) {
    if (!ativa || !user || estado !== 'dentro') return;
    if (redeACarregar) { if (forcar) redeOutraVez = true; return; }
    if (!forcar && Date.now() - redeEm < 5000) return;
    redeACarregar = true; redeEm = Date.now();
    const fs2 = fontesRede(), cols = new Set();
    // uma leitura de cada vez: com muitas ao mesmo tempo, o emulador deixava de entregar as leituras em tempo real
    fs2.reduce((ant, [col, q], i) => ant.then(() => Fs.getDocs(q).then(sn => { const m = new Map(); sn.forEach(d => m.set(d.id, d.data())); dados[col + '#r' + i] = m; cols.add(col); ultimas[col + '#r' + i] = [Date.now(), m.size, sn.metadata.fromCache, false]; }, e => { ultimas[col + '#r' + i] = ['erro', e && e.code]; console.warn('Pronex_Link: leitura de', col, e && e.code); })), Promise.resolve())
      .then(() => { cols.forEach(montar); return ultimasSalas(); })
      .then(() => { redeACarregar = false; if (redeOutraVez) { redeOutraVez = false; setTimeout(() => carregarRede(true), 50); } if (cols.size) { clearTimeout(tempoDesenho); tempoDesenho = setTimeout(() => desenhar(), 60); } });
    if (!redeRelogio) { redeRelogio = setInterval(() => { if (document.visibilityState === 'visible') carregarRede(); }, 90000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') carregarRede(); }); }
  }
  // Conversas de grupo: a última mensagem de cada sala (para a lista e o «por ler»), uma leitura de cada vez.
  const ultSala = {};
  function ultimasSalas() {
    return Loja.salas().reduce((ant, s) => ant.then(() => Fs.getDocs(Fs.query(Fs.collection(fs, 'link_salas', s.id, 'msgs'), Fs.orderBy('em'), Fs.limitToLast(1)))
      .then(sn => { sn.forEach(d => { const v = d.data(); ultSala[s.id] = { em: v.em, uid: v.uid, texto: v.texto || (v.img ? 'Imagem' : '') }; }); }, e => console.warn('Pronex_Link: sala', e && e.code))), Promise.resolve());
  }
  // A sala aberta lê-se em tempo real (uma de cada vez, como as perguntas de um pedido).
  let salaAberta = '', salaParar = null;
  function verSala(sid) {
    if (!ativa || sid === salaAberta) return;
    if (salaParar) salaParar(); salaAberta = sid; dados.salamsgs = new Map(); primeira.salamsgs = true;
    salaParar = Fs.onSnapshot(Fs.query(Fs.collection(fs, 'link_salas', sid, 'msgs'), Fs.orderBy('em'), Fs.limitToLast(poupanca() ? 60 : 200)), s => {
      const m = new Map(); s.forEach(d => m.set(d.id, d.data())); dados.salamsgs = m; salaLida[sid] = true;
      const l = [...m.values()].sort((a, b) => b.em - a.em)[0]; if (l) ultSala[sid] = { em: l.em, uid: l.uid, texto: l.texto || (l.img ? 'Imagem' : '') };
      montar('salamsgs');
    }, e => { console.warn('Pronex_Link: sala', e && e.code); salaLida[sid] = true; desenhar(); });
  }
  const salaLida = {};
  function erroLeitura(e, col) { console.warn('Pronex_Link: leitura de', col, e && e.code); if (e && e.code === 'permission-denied' && col !== 'denuncias') toast('A tua conta não tem acesso a esta parte da app. Confirma o email e aceita os termos no Study.'); }
  function parar() { clearInterval(redeRelogio); redeRelogio = null; redeEm = 0; if (pergParar) { pergParar(); pergParar = null; pergPedido = ''; } if (salaParar) { salaParar(); salaParar = null; salaAberta = ''; } vistos = {}; ouvintes.forEach(f => f()); ouvintes = []; Object.values(ouvMsgs).forEach(f => f()); ouvMsgs = {}; tentativas = {}; porConfirmar = new Set(); }

  /* ---------- escrever ---------- */
  function privado() { const me = user.uid, a = (DB.apagarEm || {})[me]; return Object.assign({ guardados: DB.guardados[me] || { pedidos: [], pessoas: [] }, bloqueios: DB.bloqueios[me] || [], lidas: DB.lidas[me] || {}, seguidos: (DB.seguidos || {})[me] || [] }, a ? { apagarEm: a } : {}, cursoPrivadoDe(me) ? { curso: cursoPrivadoDe(me) } : {}); }
  function cursoPrivadoDe(me) { const p = DB.pessoas[me]; return p && p.cursoPrivado && p.curso ? String(p.curso).slice(0, 60) : ''; }
  // repõe no meu perfil (só neste dispositivo) o curso privado guardado em link_privado
  function reporCursoPrivado() { const me = user.uid, p = DB.pessoas[me], c = (dados.privado || {}).curso; if (p && p.cursoPrivado && c && !p.curso) p.curso = c; }
  // Lista o que mudou em DB desde a última leitura do servidor.
  function mudancas() {
    const atual = new Map(), out = [];
    // 0.21: o curso privado não vai para o perfil público; fica em link_privado (só a própria pessoa o lê)
    Object.values(DB.pessoas).forEach(p => atual.set('link_pessoas/' + p.uid, p.uid === user.uid && p.cursoPrivado ? Object.assign({}, p, { curso: '' }) : p));
    ['pedidos', 'propostas', 'perguntas', 'recs', 'avisos', 'denuncias', 'pecas', ...REDE_COLS].forEach(col => DB[col].forEach(x => atual.set(COLS[col] + '/' + x.id, x)));
    (DB.salamsgs || []).forEach(m => atual.set('link_salas/' + m.sala + '/msgs/' + m.id, m));
    DB.conversas.forEach(c => { atual.set('link_conversas/' + c.id, semMsgs(c)); (c.msgs || []).forEach(m => atual.set('link_conversas/' + c.id + '/msgs/' + m.id, m)); });
    atual.set('link_privado/' + user.uid, privado());
    atual.forEach((v, k) => { const j = estavel(v); if (base.get(k) !== j) out.push({ k, v, j }); });
    base.forEach((j, k) => { if (!atual.has(k)) out.push({ k, apagar: true }); });
    return out;
  }
  // Grava as mudanças. Devolve true, ou o texto de um erro que se percebe antes de enviar (documento grande de mais).
  let susMeu = false, susLista = null, usoLista = null;
  const ultimas = {}; // diagnóstico: quando chegou a última leitura de cada fonte
  let ultimoAvisoEm = 0, avisoTempo = 0;
  const retentados = new Set(); // lotes recusados que já voltaram a ser enviados uma vez
  let pendentes = 0; // lotes enviados à espera da confirmação do servidor (sem internet, ficam à espera)
  function enviar() {
    if (!ativa) return 'Sem ligação à conta.';
    // tema, texto, rascunho e guia ficam só neste dispositivo
    gravarLocal('tema', DB.tema); gravarLocal('texto', DB.texto); gravarLocal('rascunho', DB.rascunhos[user.uid] || null); if (DB.guia[user.uid]) gravarLocal('guia', true);
    const ms = mudancas();
    if (!ms.length) return true;
    const grande = ms.find(m => !m.apagar && m.j.length > 900000);
    if (grande) return 'Isto ficou grande de mais para guardar. Usa imagens mais pequenas ou tira algumas.';
    // Carimbos de ritmo (como a Pronex_Study): publicações novas e mensagens próprias levam a hora do servidor
    // em utilizadores/{uid}; as regras só aceitam se a anterior foi há tempo suficiente.
    const carimbos = {};
    ms.forEach(m => { if (m.apagar || base.has(m.k)) return; const p = m.k.split('/');
      if ((p[0] === 'link_pedidos' || p[0] === 'link_perguntas' || p[0] === 'link_denuncias' || (p[0] === 'link_propostas' && m.v.origem === 'proposta')) && p.length === 2) carimbos.ultimoPost = true;
      if (p[0] === 'link_conversas' && p.length === 4 && m.v.uid === user.uid) carimbos.ultimaMsg = true;
      if (p[0] === 'link_avisos' && p.length === 2) carimbos.ultimoAviso = true;
      if (['link_posts', 'link_grupos', 'link_vagas', 'link_candidaturas', 'link_duvidas', 'link_sessoes', 'link_ligacoes'].includes(p[0])) carimbos.ultimoPost = true;   // 0.21: pedidos de ligação também
      if (p[0] === 'link_comentarios' || (p[0] === 'link_respostas' && m.v.uid === user.uid) || (p[0] === 'link_salas' && p.length === 4)) carimbos.ultimaMsg = true; });
    // Avisos têm ritmo de 2 s no servidor: se o anterior foi há menos, espera o que falta e envia (em vez de falhar).
    if (carimbos.ultimoAviso) { const falta = ultimoAvisoEm + 2100 - Date.now(); if (falta > 0) { clearTimeout(avisoTempo); avisoTempo = setTimeout(enviar, falta); pintarGravacao(pendentes + 1); return true; } ultimoAvisoEm = Date.now(); }
    const propostasNovas = ms.filter(m => !m.apagar && !base.has(m.k) && m.k.startsWith('link_propostas/') && m.v.origem === 'proposta' && m.v.uid === user.uid).length;
    const lotes = []; for (let i = 0; i < ms.length; i += 450) lotes.push(ms.slice(i, i + 450));
    pendentes += lotes.length; pintarGravacao(pendentes);
    lotes.forEach((l, i) => {
      const b = Fs.writeBatch(fs);
      if (i === 0 && Object.keys(carimbos).length) { const c = {}; Object.keys(carimbos).forEach(k => { c[k] = Fs.serverTimestamp(); }); b.set(Fs.doc(fs, 'utilizadores', user.uid), c, { merge: true }); }
      // limite diário de propostas: o servidor conta-as em link_cotas/{uid}_{dia}. O número vai escrito (não `increment`):
      // no emulador, ler a cota nas regras no mesmo lote de um `increment` falhava («Service call error») na 2.ª proposta do dia.
      if (i === 0 && propostasNovas) { const dia = diaUTC(); const n = (cota.dia === dia ? cota.n : 0) + propostasNovas; b.set(Fs.doc(fs, 'link_cotas', user.uid + '_' + dia), { uid: user.uid, dia, n, em: Fs.serverTimestamp() }, { merge: true }); cota = { dia, n }; }   // 0.19: `em` prova às regras que a cota subiu neste lote
      l.forEach(m => {
        const ref = Fs.doc(fs, m.k);
        if (m.apagar) { b.delete(ref); base.delete(m.k); return; }
        // 0.21: um documento que já existe grava só os campos que mudaram. Antes ia o documento inteiro: se a outra pessoa
        // tinha mudado o mesmo pedido há segundos (tarefas, acordo...), as regras recusavam e perdia-se, por exemplo, uma entrega.
        const ant = base.get(m.k); let up = null;
        if (ant) try { const o = JSON.parse(ant), n = limpo(m.v); up = {}; new Set([...Object.keys(o), ...Object.keys(n)]).forEach(k => { if (!(k in n)) up[k] = Fs.deleteField(); else if (estavel(n[k]) !== estavel(o[k])) up[k] = n[k]; }); } catch (e) { up = null; }
        if (up && Object.keys(up).length) b.update(ref, up); else b.set(ref, limpo(m.v));
        base.set(m.k, m.j);
      });
      b.commit().then(() => { pendentes = Math.max(0, pendentes - 1); pintarGravacao(pendentes); }, e => { pendentes = Math.max(0, pendentes - 1); pintarGravacao(pendentes, true); throw e; }).catch(e => {
        console.warn('Pronex_Link: escrita recusada', e && e.code, l.map(m => m.k), window.PRONEX_EMULADOR && e && e.message ? e.message.replace(/\s+/g, " ").slice(0, 3000) : '');
        // Recusa por ritmo (o carimbo do servidor ainda não tinha passado, por exemplo com o relógio do servidor adiantado):
        // tenta outra vez uma só vez, passados 11 s, em vez de perder o que a pessoa escreveu.
        const chave = l.map(m => m.k).join('|');
        if (e && e.code === 'permission-denied' && Object.keys(carimbos).length && !susp && !l.some(m => m.apagar) && !retentados.has(chave)) {
          retentados.add(chave); l.forEach(m => base.delete(m.k)); pintarGravacao(pendentes + 1);
          // 0.19: volta a enviar ESTE lote tal como estava. Antes chamava-se enviar(), que só manda o que ainda está em DB:
          // se entretanto o servidor tivesse reposto a lista (sem a proposta recusada), a proposta perdia-se e só seguia o aviso.
          // A cota do dia é lida ao servidor nesse momento, para o número ir certo mesmo depois de uma recusa.
          // Vai sem o carimbo `em`, no formato anterior: é o que as regras publicadas antes da 0.19 aceitam.
          setTimeout(async () => {
            setTimeout(() => retentados.delete(chave), 60000);
            if (!ativa || !user) return;   // entretanto saiu da conta
            try {
              const b2 = Fs.writeBatch(fs);
              if (i === 0) { const c2 = {}; Object.keys(carimbos).forEach(k => { c2[k] = Fs.serverTimestamp(); }); b2.set(Fs.doc(fs, 'utilizadores', user.uid), c2, { merge: true }); }
              if (i === 0 && propostasNovas) {
                const dia = diaUTC(), ref = Fs.doc(fs, 'link_cotas', user.uid + '_' + dia), atual = await Fs.getDoc(ref);
                const n = (atual.exists() ? Number(atual.data().n) || 0 : 0) + propostasNovas;
                b2.set(ref, { uid: user.uid, dia, n }, { merge: true }); cota = { dia, n };
              }
              l.forEach(m => b2.set(Fs.doc(fs, m.k), limpo(m.v)));
              await b2.commit(); pintarGravacao(pendentes);
            } catch (e2) {
              console.warn('Pronex_Link: segunda tentativa recusada', e2 && e2.code, l.map(m => m.k), window.PRONEX_EMULADOR && e2 && e2.message ? e2.message.replace(/\s+/g, " ").slice(0, 3000) : '');
              pintarGravacao(pendentes, true); toast('Não foi possível enviar. Espera uns segundos e tenta outra vez.');
              const cols2 = new Set(l.map(m => { const q = m.k.split('/'); return q[0] === 'link_privado' ? 'privado' : q[0] === 'link_salas' ? 'salamsgs' : q.length === 4 ? 'msgs' : Object.keys(COLS).find(k => COLS[k] === q[0]); }).filter(Boolean));
              cols2.forEach(montar);
            }
          }, 11000); return;
        }
        toast(e && e.code === 'permission-denied' ? (susp ? 'A tua conta está suspensa.' : Object.keys(carimbos).length ? 'Não foi possível enviar. Espera uns segundos e tenta outra vez.' : 'Esta alteração não foi aceite. Atualiza a página e tenta outra vez.') : 'Sem ligação: a alteração não foi guardada. Tenta outra vez.');
        // o servidor volta a mandar o estado verdadeiro; as próximas leituras repõem DB
        l.forEach(m => base.delete(m.k));
        const cols = new Set(l.map(m => { const p = m.k.split('/'); return p[0] === 'link_privado' ? 'privado' : p[0] === 'link_salas' ? 'salamsgs' : p.length === 4 ? 'msgs' : Object.keys(COLS).find(k => COLS[k] === p[0]); }).filter(Boolean));
        cols.forEach(montar);
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
    // 0.15.1: dentro da app PRONEX (app/, esta app numa moldura do mesmo site) a página do Google não abre na moldura;
    // em vez de redirecionar, abre-se a Pronex_Link no ecrã inteiro para entrar aí.
    let moldura = true; try { moldura = window.top !== window.self; } catch (e) {}
    const redirecionar = () => { if (moldura) { window.top.location.href = location.href; return; } return Au.signInWithRedirect(auth, p); };
    try { if (instalada) await redirecionar(); else await Au.signInWithPopup(auth, p); }
    catch (e) { if (e && e.code === 'auth/popup-blocked') return redirecionar(); throw e; }
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
    if (d.tipo === 'professor' && !professor) {
      try { await Fs.setDoc(Fs.doc(fs, 'link_pedidosprof', user.uid), { uid: user.uid, email: String(user.email || '').toLowerCase(), nome: String(d.nome || '').trim().slice(0, 40), disciplina: String(d.curso || '').trim().slice(0, 60), em: Date.now() }); }
      catch (e) { return { erro: 'Para entrares como professor, o administrador tem de confirmar o teu email. Por agora entra como aluno.' }; }
      return { erro: 'Pedimos ao administrador para confirmar que és professor. Por agora entra como aluno; quando for confirmado, passas a professor em Perfil → Conta.' };
    }
    // o nome é o da Pronex_Study quando lá existe (as regras exigem-no)
    if (perfilStudy && typeof perfilStudy.nick === 'string' && /^[^ ].{0,38}[^ ]$/.test(perfilStudy.nick)) d.nome = perfilStudy.nick;
    if (perfilStudy) { if (typeof perfilStudy.foto === 'string' && perfilStudy.foto.length <= 60000) d.foto = perfilStudy.foto; if (Number.isInteger(perfilStudy.cor)) d.cor = perfilStudy.cor; }
    const r = Loja.criarPerfil(d);
    if (r.ok) setTimeout(sincronizarIdentidade, 400);
    if (r.erro) return r;
    await new Promise(ok => setTimeout(ok, 300));
    return r;
  }
  // Nome da Pronex_Study, para propor na criação do perfil.
  async function nomeDaStudy() { return perfilStudy ? String(perfilStudy.nick || '') : ''; }
  // Perguntas do pedido aberto (uma leitura em tempo real de cada vez).
  let pergPedido = '', pergParar = null;
  function verPerguntas(pid) {
    if (!ativa || pid === pergPedido) return;
    if (pergParar) pergParar(); pergPedido = pid; dados['perguntas#ped'] = new Map();
    pergParar = Fs.onSnapshot(Fs.query(Fs.collection(fs, 'link_perguntas'), Fs.where('pedidoId', '==', pid), Fs.limit(100)), s => { const m = new Map(); s.forEach(d => m.set(d.id, d.data())); dados['perguntas#ped'] = m; montar('perguntas'); }, e => console.warn('Pronex_Link: perguntas', e && e.code));
  }
  // «Visto»: link_vistos/{conversa}_{eu} = até onde li (só se liguei a opção). Leio os que me dizem respeito.
  let vistos = {}; const ultimoVisto = {};
  function marcarVisto(cid, para, em) {
    if (!para || (ultimoVisto[cid] || 0) >= em) return; ultimoVisto[cid] = em;
    Fs.setDoc(Fs.doc(fs, 'link_vistos', cid + '_' + user.uid), { cid, uid: user.uid, para, em: Math.min(em, Date.now()) }).catch(() => { ultimoVisto[cid] = 0; });
  }
  // Anúncio do administrador para todos (link_anuncios/atual).
  let anuncioAtual = null;
  const publicarAnuncio = (texto, extra = {}) => Fs.setDoc(Fs.doc(fs, 'link_anuncios', 'atual'), Object.assign({ texto, em: Date.now(), por: user.uid }, extra.ate ? { ate: extra.ate } : {}, extra.para === 'professores' ? { para: 'professores' } : {}));
  const retirarAnuncio = () => Fs.deleteDoc(Fs.doc(fs, 'link_anuncios', 'atual'));
  // Pedidos de confirmação de professor (o administrador vê-os no painel).
  let pedidosProf = null;
  function carregarPedidosProf() { if (!admin) return; Fs.getDocs(Fs.collection(fs, 'link_pedidosprof')).then(s => { pedidosProf = s.docs.map(d => d.data()).sort((a, b) => b.em - a.em); desenhar(); }, () => { pedidosProf = []; }); }
  const listaPedidosProf = () => { if (pedidosProf === null) carregarPedidosProf(); return pedidosProf || []; };
  async function aprovarProfessor(uid, aprovar) {
    const q = (pedidosProf || []).find(x => x.uid === uid); if (!q) return;
    if (aprovar) await Fs.setDoc(Fs.doc(fs, 'link_professores', q.email), { por: user.uid, em: Date.now() });
    await Fs.deleteDoc(Fs.doc(fs, 'link_pedidosprof', uid)); pedidosProf = pedidosProf.filter(x => x.uid !== uid);
  }
  // Administrador: emails de professores confirmados.
  async function professores() { const s = await Fs.getDocs(Fs.collection(fs, 'link_professores')); return s.docs.map(d => d.id).sort(); }
  const juntarProfessor = email => Fs.setDoc(Fs.doc(fs, 'link_professores', String(email).trim().toLowerCase()), { por: user.uid, em: Date.now() });
  const tirarProfessor = email => Fs.deleteDoc(Fs.doc(fs, 'link_professores', email));

  /* ---------- painel do administrador ---------- */
  async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } } };
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } } };
  // Estado do PIN: carregar | sem (ainda não há PIN) | fechado | aberto | bloqueado. O mesmo config/admin da Pronex_Study.
  function pinEstado() {
    if (+(ss.get('x8-pin-until') || 0) > Date.now()) return 'aberto';
    if (+(ls.get('pl-pin-lock') || 0) > Date.now()) return 'bloqueado';
    if (pin.estado === 'carregar' && !pin.aPedir) {
      pin.aPedir = true;
      Fs.getDoc(Fs.doc(fs, 'config', 'admin')).then(s => { const v = s.exists() ? s.data() : null; pin.estado = v && v.pinHash ? 'fechado' : 'sem'; pin.salt = v ? v.salt || '' : ''; pin.hash = v ? v.pinHash || '' : ''; desenhar(); }, () => { pin.estado = 'sem'; desenhar(); });
    }
    return pin.estado;
  }
  const abrir30 = () => ss.set('x8-pin-until', String(Date.now() + 30 * 60000));
  async function abrirPin(v) {
    if (await sha(pin.salt + ':' + v) === pin.hash) { pin.falhas = 0; abrir30(); return true; }
    pin.falhas++;
    if (pin.falhas >= 5) { ls.set('pl-pin-lock', String(Date.now() + 5 * 60000)); pin.falhas = 0; desenhar(); return 'Demasiadas tentativas erradas.'; }
    return 'PIN errado. ' + (5 - pin.falhas) + (5 - pin.falhas === 1 ? ' tentativa' : ' tentativas') + ' até o painel bloquear.';
  }
  async function criarPin(v) {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x => x.toString(16).padStart(2, '0')).join(''), hash = await sha(salt + ':' + v);
    await Fs.setDoc(Fs.doc(fs, 'config', 'admin'), { pinHash: hash, salt, atualizado: Date.now() });
    pin.estado = 'fechado'; pin.salt = salt; pin.hash = hash; abrir30(); return true;
  }
  function registar(acao, alvo, detalhe) {
    if (!admin && !moderador) return;
    Fs.addDoc(Fs.collection(fs, admin ? 'audit' : 'link_moderacao'), { acao: String(acao).slice(0, 60), alvo: String(alvo || '').slice(0, 120), detalhe: String(detalhe || '').slice(0, 300), por: user.uid, em: Fs.serverTimestamp() }).then(() => { registoCache = null; if (typeof F !== 'undefined' && F.perfTab === 'painel' && F.pnSep === 'reg') desenhar(); }, () => { /* fica sem registo */ });
  }
  function carregarRegisto() {
    Fs.getDocs(Fs.query(Fs.collection(fs, 'audit'), Fs.orderBy('em', 'desc'), Fs.limit(200))).then(s => {
      registoCache = s.docs.map(d => d.data()).filter(x => String(x.acao || '').startsWith('link_')).map(x => ({ acao: x.acao, alvo: x.alvo || '', detalhe: x.detalhe || '', em: x.em && x.em.toMillis ? x.em.toMillis() : 0 }));
      desenhar();
    }, () => { registoCache = []; desenhar(); });
  }
  const registo = () => { if (registoCache === null) carregarRegisto(); return registoCache; };
  function carregarSuspensoes() {
    Fs.getDocs(Fs.collection(fs, 'bans')).then(s => { DB.bans = {}; s.forEach(d => { const v = d.data(), ate = v.ate && v.ate.toMillis ? v.ate.toMillis() : 0; if (!ate || ate > Date.now()) DB.bans[d.id] = { motivo: String(v.motivo || ''), ate }; }); desenhar(); }, () => { /* sem acesso */ });
  }
  async function suspender(uid, dias, motivo) {
    const ate = dias ? Fs.Timestamp.fromMillis(Date.now() + dias * 86400000) : null;
    await Fs.setDoc(Fs.doc(fs, 'bans', uid), { motivo: String(motivo).slice(0, 200), por: user.uid, em: Fs.serverTimestamp(), ate });
    DB.bans[uid] = { motivo, ate: ate ? ate.toMillis() : 0 };
  }
  async function retirarSuspensao(uid) { await Fs.deleteDoc(Fs.doc(fs, 'bans', uid)); delete DB.bans[uid]; }
  const apagarMsgAdmin = (cid, mid) => Fs.deleteDoc(Fs.doc(fs, 'link_conversas', cid, 'msgs', mid));
  const apagarMsgSala = (sid, mid) => Fs.deleteDoc(Fs.doc(fs, 'link_salas', sid, 'msgs', mid));

  return { disponivel, modoDemo, escolherDemo, iniciar, ativa: () => ativa, estado: () => estado, uid: () => (user ? user.uid : ''), email: () => (user ? user.email : ''), admin: () => admin, professor: () => professor, suspensao: () => susp, identidadeStudy: () => !!perfilStudy, msgsLidas: id => !!dados['msgs#' + id],
    verPerguntas, marcarVisto, vistoEm: cid => vistos[cid] || 0, anuncio: () => anuncioAtual, moderador: () => moderador, cotaHoje: () => (cota.dia === diaUTC() ? cota.n : 0), stats: () => statsGeral,
    moderadores: async () => (await Fs.getDocs(Fs.collection(fs, 'link_moderadores'))).docs.map(d => d.id).sort(),
    juntarModerador: email => Fs.setDoc(Fs.doc(fs, 'link_moderadores', String(email).trim().toLowerCase()), { por: user.uid, em: Date.now() }),
    tirarModerador: email => Fs.deleteDoc(Fs.doc(fs, 'link_moderadores', email)),
    carregarRede, apagarMsgSala, verSala, ultimaSala: sid => ultSala[sid] || null, salaLida: sid => !!salaLida[sid],
    diag: () => ({ pendentes, ouvintes: ouvintes.length, ultimas: Object.fromEntries(Object.entries(ultimas).map(([k, v]) => [k, typeof v[0] === 'number' ? [Math.round((Date.now() - v[0]) / 1000) + 's', v[1], v[2], v[3]] : v])) }),
    susFeito: () => susMeu, susTodos: () => susLista,
    contar: e => { const id = diaUTCISO() + '_' + e; Fs.setDoc(Fs.doc(fs, 'link_uso', id), { n: Fs.increment(1) }, { merge: true }).catch(() => { /* sem contagem */ }); },
    uso: () => usoLista || [],
    guardarSUS: v => { susMeu = true; return Fs.setDoc(Fs.doc(fs, 'link_sus', user.uid), Object.assign({ uid: user.uid }, v)).catch(() => { susMeu = false; toast('Não foi possível guardar as respostas.'); }); },
    guardarDesafio: d => d ? Fs.setDoc(Fs.doc(fs, 'link_config', 'desafio'), Object.assign({}, d, { por: user.uid, em: Date.now() })) : Fs.deleteDoc(Fs.doc(fs, 'link_config', 'desafio')),
    guardarFlags: f => Fs.setDoc(Fs.doc(fs, 'link_config', 'flags'), f),
    guardarPalavras: l => Fs.setDoc(Fs.doc(fs, 'link_config', 'filtro'), { palavras: l, por: user.uid, em: Date.now() }),
    ultimasMsgs: async (cid, mid) => { const s = await Fs.getDocs(Fs.query(Fs.collection(fs, 'link_conversas', cid, 'msgs'), Fs.orderBy('em'), Fs.limitToLast(40))); const l = s.docs.map(d => d.data()); const i = l.findIndex(m => m.id === mid); return i < 0 ? l.slice(-6) : l.slice(Math.max(0, i - 4), i + 3); }, publicarAnuncio, retirarAnuncio, listaPedidosProf, aprovarProfessor, pinEstado, abrirPin, criarPin, registar, registo, carregarRegisto, carregarSuspensoes, suspender, retirarSuspensao, apagarMsgAdmin,
    enviar, entrarGoogle, entrarEmail, recuperar, enviarConfirmacao, jaConfirmei, sair, criarPerfil, nomeDaStudy, msgErro, professores, juntarProfessor, tirarProfessor, _mudancas: () => mudancas() };
})();
