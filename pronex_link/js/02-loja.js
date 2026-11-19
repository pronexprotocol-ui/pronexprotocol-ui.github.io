/* Pronex_Link · 02-loja.js
   Onde os dados vivem. Os ecrãs só LEEM de `DB` (e das leituras `Loja.…`) e só ESCREVEM através das ações `Loja.…()`.
   Cada ação valida tudo, grava e devolve { ok: true } ou { erro: 'texto para mostrar' }.
   Nesta versão os dados ficam guardados neste dispositivo (modo de demonstração). Para ligar às contas da
   Pronex_Study troca-se o interior das ações por escritas no Firebase: os ecrãs não mudam. Ver ESTRUTURA.md.
   Secções: 1 guardar · 2 leituras · 3 perfil · 4 pedidos · 5 trabalho · 6 conversas e avisos · 7 comunidade · 8 conta */
'use strict';
const CHAVE = 'pronex-link-v1';
let DB = null;

const Loja = (function () {
  const DIA = 86400000;
  const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const limpa = (s, max) => String(s == null ? '' : s).trim().slice(0, max);
  const eLink = l => /^https:\/\/[^\s]+\.[^\s]+$/i.test(l);
  // Insultos: a mesma regra da Pronex_Study. Devolve o erro a mostrar, ou ''.
  const filtro = (...textos) => { for (const t of textos) { const e = filtroPublicacao(t); if (e) return e; } return ''; };
  // Ritmo: com conta, o servidor recusa escritas muito seguidas; aqui avisa-se antes, com uma frase clara.
  const ultimo = { msg: 0, post: 0 };
  function ritmo(tipo) {
    if (typeof Nuvem === 'undefined' || !Nuvem.ativa()) return '';
    const falta = Math.ceil((ultimo[tipo] + RITMO[tipo] * 1000 - Date.now()) / 1000);
    return falta > 0 ? 'Espera ' + falta + (falta === 1 ? ' segundo' : ' segundos') + ' antes de ' + (tipo === 'msg' ? 'enviar outra mensagem.' : 'publicar outra vez.') : '';
  }
  const marcar = tipo => { ultimo[tipo] = Date.now(); };
  // Suspensão: a mesma da Pronex_Study (bans). Com conta vem do servidor; na demonstração fica em DB.bans.
  function suspensao(uid) {
    uid = uid || DB.eu;
    if (typeof Nuvem !== 'undefined' && Nuvem.ativa()) return uid === DB.eu ? Nuvem.suspensao() : (DB.bans || {})[uid] || null;
    const b = (DB.bans || {})[uid]; return b && (!b.ate || b.ate > Date.now()) ? b : null;
  }
  function bloqueadoPorSuspensao() { const b = suspensao(); return b ? 'A tua conta está suspensa' + (b.ate ? ' até ' + new Date(b.ate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }) : '') + '. Podes ver a app, mas não podes publicar.' : ''; }

  /* ---------- 1. Guardar ---------- */
  let memoria = null, semEspaco = false;
  function ler() { try { const raw = localStorage.getItem(CHAVE); if (raw) return JSON.parse(raw); } catch (e) { /* sem armazenamento */ } return memoria; }
  function gravar() {
    if (typeof Nuvem !== 'undefined' && Nuvem.ativa()) return Nuvem.enviar() === true;
    memoria = DB;
    try { localStorage.setItem(CHAVE, JSON.stringify(DB)); semEspaco = false; return true; }
    catch (e) { semEspaco = true; return false; }
  }
  // Faz uma mudança e desfaz tudo se não couber no dispositivo (acontece com imagens grandes).
  function comEspaco(mudar) {
    const antes = JSON.stringify(DB); mudar();
    if (typeof Nuvem !== 'undefined' && Nuvem.ativa()) { const r = Nuvem.enviar(); if (r === true) return { ok: true }; DB = JSON.parse(antes); return { erro: r }; }
    if (gravar()) return { ok: true };
    DB = JSON.parse(antes); memoria = DB;
    return { erro: 'Não há espaço neste dispositivo para guardar isto. Usa uma imagem mais pequena ou apaga imagens antigas.' };
  }
  function vazio() {
    const ex = dadosExemplo(Date.now());
    return Object.assign({ v: 2, eu: '', minha: '', tema: 'escuro', texto: 'normal', denuncias: [], lidas: {}, avisos: [], guardados: {}, bloqueios: {}, rascunhos: {}, guia: {}, bans: {} }, ex);
  }
  function iniciar() {
    const d = ler();
    DB = d && d.pessoas && Array.isArray(d.pedidos) ? d : vazio();
    // dados gravados por versões anteriores: junta o que falta sem apagar nada
    const ex = DB.v === 2 ? null : dadosExemplo(Date.now());
    ['propostas', 'conversas', 'denuncias', 'avisos', 'perguntas', 'recs', 'pecas'].forEach(k => { if (!Array.isArray(DB[k])) DB[k] = ex && ex[k] && k !== 'propostas' && k !== 'conversas' ? ex[k] : []; });
    // 0.3: o portefólio passou para uma lista própria (pecas); os trabalhos feitos aqui calculam-se a partir dos pedidos
    Object.values(DB.pessoas).forEach(p => { (p.portefolio || []).forEach(x => { if (x.origem !== 'trabalho' && !DB.pecas.some(k => k.id === x.id)) DB.pecas.push({ id: x.id, uid: p.uid, titulo: x.titulo, desc: x.desc || '', area: x.area, img: x.img || '', link: x.link || '', em: p.criadoEm || 0 }); }); delete p.portefolio; });
    DB.propostas.forEach(x => { if (!x.dono) x.dono = (pedido(x.pedidoId) || {}).uid || ''; });
    DB.perguntas.forEach(x => { if (!x.dono) x.dono = (pedido(x.pedidoId) || {}).uid || ''; });
    ['lidas', 'guardados', 'bloqueios', 'rascunhos', 'guia', 'bans'].forEach(k => { if (!DB[k] || typeof DB[k] !== 'object') DB[k] = {}; });
    if (!DB.study || typeof DB.study !== 'object') DB.study = (dadosExemplo(Date.now()).study) || {};
    Object.values(DB.pessoas).forEach(p => { if (!(p.cor >= 0 && p.cor < CORES)) p.cor = corInicial(p.uid); });
    Object.values(DB.pessoas).forEach(p => { p.foto = p.foto || ''; p.ferramentas = p.ferramentas || []; p.niveis = p.niveis || {}; p.horas = p.horas || ''; p.experiencias = p.experiencias || []; p.areas = p.areas || []; });
    DB.pedidos.forEach(p => { p.tarefas = p.tarefas || []; p.entregas = p.entregas || (p.entrega ? [p.entrega] : []); p.formato = p.formato || ''; p.img = p.img || ''; });
    if (!DB.texto) DB.texto = 'normal';
    DB.v = 2;
    if (DB.eu && !DB.pessoas[DB.eu]) DB.eu = '';
  }
  function repor() { DB = vazio(); gravar(); }

  /* ---------- 2. Leituras ---------- */
  const eAdmin = () => (typeof Nuvem !== 'undefined' && Nuvem.ativa() ? Nuvem.admin() : true);
  const corInicial = uid => { let h = 0; for (const c of String(uid)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 6; };
  const eu = () => DB.pessoas[DB.eu] || null;
  // Nível, sequência e XP da Pronex_Study (só para mostrar).
  const study = uid => ((DB.pessoas[uid] || {}).study) || (DB.study || {})[uid] || null;
  const pessoa = uid => DB.pessoas[uid] || null;
  const pedido = id => DB.pedidos.find(p => p.id === id) || null;
  const bloqueei = uid => (DB.bloqueios[DB.eu] || []).includes(uid);
  const bloqueado = uid => bloqueei(uid) || (DB.bloqueios[uid] || []).includes(DB.eu); // em qualquer dos sentidos
  // Um pedido aparece nas listas se não foi ocultado pela moderação e se não há bloqueio com quem o publicou.
  const visivel = p => (p.uid === DB.eu || p.freelancerUid === DB.eu) || (!p.oculto && !bloqueado(p.uid));
  const pessoasVisiveis = () => Object.values(DB.pessoas).filter(p => p.uid !== DB.eu && !bloqueado(p.uid));
  const propostasDe = pedidoId => DB.propostas.filter(p => p.pedidoId === pedidoId);
  const conversa = id => DB.conversas.find(c => c.id === id) || null;
  // A conversa de um pedido é a de quem o está a fazer agora (se alguém desistir, a conversa antiga fica fechada).
  const conversaAtiva = pedidoId => { const p = pedido(pedidoId); return p && p.freelancerUid ? DB.conversas.find(c => c.pedidoId === pedidoId && c.uids.includes(p.freelancerUid)) || null : null; };
  const conversaFechada = c => { const p = pedido(c.pedidoId); return !p || p.estado === 'cancelado' || !c.uids.includes(p.freelancerUid) || bloqueado(c.uids.find(u => u !== DB.eu)); };
  const ultima = c => (c.msgs.length ? c.msgs[c.msgs.length - 1].em : 0);
  const minhasConversas = () => DB.conversas.filter(c => c.uids.includes(DB.eu)).sort((a, b) => ultima(b) - ultima(a));
  const naoLidas = c => { const k = (DB.lidas[DB.eu] || {})[c.id] || 0; return c.msgs.filter(m => m.em > k && m.uid !== DB.eu && m.por !== DB.eu).length; };
  const totalNaoLidas = () => minhasConversas().reduce((n, c) => n + naoLidas(c), 0);
  const avaliacoes = uid => DB.pedidos.filter(p => p.freelancerUid === uid && p.estado === 'concluido' && p.avaliacao).sort((a, b) => b.avaliacao.em - a.avaliacao.em);
  const mediaDe = l => (l.length ? l.reduce((s, n) => s + n, 0) / l.length : 0);
  const media = uid => mediaDe(avaliacoes(uid).map(p => p.avaliacao.estrelas));
  const feitos = uid => DB.pedidos.filter(p => p.freelancerUid === uid && p.estado === 'concluido');
  const concluidos = uid => feitos(uid).length;
  // Como a pessoa se porta quando é ela a pedir (avaliada por quem fez o trabalho).
  const comoPede = uid => { const l = DB.pedidos.filter(p => p.uid === uid && p.avalDono).map(p => p.avalDono.estrelas); return { n: l.length, media: mediaDe(l) }; };
  const convites = () => DB.propostas.filter(p => p.uid === DB.eu && p.origem === 'convite' && p.estado === 'pendente' && (pedido(p.pedidoId) || {}).estado === 'aberto');
  const emCurso = () => DB.pedidos.filter(p => (p.uid === DB.eu && ['aberto', 'em_curso', 'entregue'].includes(p.estado)) || (p.freelancerUid === DB.eu && ['em_curso', 'entregue'].includes(p.estado))).sort((a, b) => b.criadoEm - a.criadoEm);
  const avisos = () => DB.avisos.filter(a => a.para === DB.eu).sort((a, b) => b.em - a.em).slice(0, 40);
  const avisosPorLer = () => DB.avisos.filter(a => a.para === DB.eu && !a.lido).length;
  const guardados = () => DB.guardados[DB.eu] || (DB.guardados[DB.eu] = { pedidos: [], pessoas: [] });
  const guardado = (t, id) => guardados()[t].includes(id);
  const perguntasDe = pedidoId => DB.perguntas.filter(q => q.pedidoId === pedidoId).sort((a, b) => a.em - b.em);
  // Portefólio: o que a pessoa juntou (pecas) e os trabalhos concluídos aqui que quem pediu deixou mostrar.
  function portefolio(uid) {
    const proprios = DB.pecas.filter(x => x.uid === uid).sort((a, b) => (b.em || 0) - (a.em || 0)).map(x => Object.assign({ origem: 'proprio' }, x));
    const feitosAqui = DB.pedidos.filter(p => p.freelancerUid === uid && p.estado === 'concluido' && p.portefolioOk && p.entrega).sort((a, b) => (b.concluidoEm || 0) - (a.concluidoEm || 0))
      .map(p => ({ id: 'pt_' + p.id, uid, titulo: p.titulo, desc: p.entrega.texto, area: p.area, img: p.entrega.img, link: p.entrega.link, origem: 'trabalho', pedidoId: p.id, de: p.uid }));
    return feitosAqui.concat(proprios).sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
  }
  const recsDe = uid => DB.recs.filter(r => r.para === uid).sort((a, b) => b.em - a.em);
  // O que falta para o perfil estar completo.
  function completo(uid) {
    const p = pessoa(uid); if (!p) return { pct: 0, falta: [] };
    const itens = [[!!p.curso, p.tipo === 'professor' ? 'Disciplina ou área' : 'Ano e curso'], [p.bio.length >= 20, 'Apresentação'], [p.areas.length > 0, 'Pelo menos uma área'], [p.oferece.length >= 10, 'O que te disponibilizas a fazer'], [p.experiencias.length > 0, 'Uma experiência'], [portefolio(uid).length > 0, 'Um trabalho no portefólio']];
    return { pct: Math.round(itens.filter(i => i[0]).length / itens.length * 100), falta: itens.filter(i => !i[0]).map(i => i[1]) };
  }
  function selos(uid) {
    const f = feitos(uid), av = avaliacoes(uid);
    const n = { concluidos: f.length, avaliacoes: av.length, media: media(uid), areas: new Set(f.map(p => p.area)).size, ajudas: f.filter(p => p.tipo === 'ajuda').length, recs: recsDe(uid).filter(r => (pessoa(r.de) || {}).tipo === 'professor').length, completo: completo(uid).pct };
    return SELOS.filter(s => s.ok(n));
  }
  // Quem concluiu mais trabalhos nos últimos 30 dias.
  function destaques() {
    const desde = Date.now() - 30 * DIA, m = {};
    DB.pedidos.forEach(p => { if (p.estado === 'concluido' && p.freelancerUid && (p.concluidoEm || 0) >= desde) m[p.freelancerUid] = (m[p.freelancerUid] || 0) + 1; });
    return Object.keys(m).filter(u => pessoa(u) && !bloqueado(u)).map(u => ({ p: pessoa(u), n: m[u] })).sort((a, b) => b.n - a.n).slice(0, 3);
  }
  const numeros = () => ({ abertos: DB.pedidos.filter(p => p.estado === 'aberto' && !p.oculto).length, concluidos: DB.pedidos.filter(p => p.estado === 'concluido').length, disponiveis: Object.values(DB.pessoas).filter(p => p.disponivel).length });
  // Pedidos abertos nas minhas áreas a que ainda não respondi.
  const paraTi = () => { const e = eu(); return e && e.areas.length ? DB.pedidos.filter(p => p.estado === 'aberto' && p.uid !== DB.eu && visivel(p) && e.areas.includes(p.area) && !DB.propostas.some(x => x.pedidoId === p.id && x.uid === DB.eu)) : []; };
  // Pessoas disponíveis na área de um pedido meu, que ainda não foram convidadas nem responderam.
  const sugeridos = p => pessoasVisiveis().filter(q => q.disponivel && q.areas.includes(p.area) && !DB.propostas.some(x => x.pedidoId === p.id && x.uid === q.uid)).sort((a, b) => concluidos(b.uid) - concluidos(a.uid)).slice(0, 3);
  // Dias que faltam para o prazo (negativo = atrasado). null se não há prazo ou o trabalho já acabou.
  function prazoInfo(p) {
    if (!p.prazo || ['concluido', 'cancelado'].includes(p.estado)) return null;
    const [a, m, d] = p.prazo.split('-').map(Number), h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.round((new Date(a, m - 1, d) - h) / DIA);
  }
  const podeFecharSozinho = p => p.estado === 'entregue' && p.freelancerUid === DB.eu && p.entrega && Date.now() - p.entrega.em > LIMITES.diasSemResposta * DIA;

  // ----- peças internas -----
  function avisar(para, texto, alvo) { if (para && para !== DB.eu && pessoa(para)) DB.avisos.push({ id: novoId('av_'), para, de: DB.eu, texto: limpa(texto, 160), alvo: alvo || null, em: Date.now(), lido: false }); if (DB.avisos.length > 400) DB.avisos.splice(0, DB.avisos.length - 400); }
  function sistema(c, texto) { if (c) c.msgs.push({ id: novoId('m_'), uid: '', por: DB.eu, texto, em: Date.now() }); }
  const nomeEu = () => (eu() || {}).nome || 'Alguém';
  const alvoPedido = id => ({ t: 'pedido', id });

  /* ---------- 3. Perfil ---------- */
  function criarPerfil(d) {
    const nome = limpa(d.nome, 40);
    if (nome.length < 2) return { erro: 'Escreve o teu nome.' };
    const fl = filtro(nome, d.curso); if (fl) return { erro: fl };
    if (!d.idade || !d.regras) return { erro: 'Para entrar, confirma as duas caixas.' };
    const uid = typeof Nuvem !== 'undefined' && Nuvem.ativa() ? Nuvem.uid() : novoId('u_');
    DB.pessoas[uid] = { uid, nome, tipo: d.tipo === 'professor' ? 'professor' : 'aluno', curso: limpa(d.curso, 60), bio: '', oferece: '', areas: [], niveis: {}, ferramentas: [], horas: '', foto: d.foto || '', cor: d.cor >= 0 && d.cor < CORES ? d.cor : corInicial(uid), disponivel: false, experiencias: [], criadoEm: Date.now() };
    DB.eu = uid; DB.minha = uid; gravar();
    return { ok: true };
  }
  function editarPerfil(d) {
    const dias = (d.dias || []).filter(x => DIAS_SEMANA.some(k => k[0] === x));
    const p = eu(); if (!p) return { erro: 'Sem perfil.' };
    const nome = limpa(d.nome, 40);
    if (nome.length < 2) return { erro: 'Escreve o teu nome.' };
    const areas = (d.areas || []).filter(a => AREAS.some(x => x.id === a)).slice(0, 6);
    if (d.disponivel && !areas.length) return { erro: 'Escolhe pelo menos uma área para apareceres como disponível.' };
    const fl = filtro(nome, d.curso, d.bio, d.oferece, d.horas, d.ferramentas); if (fl) return { erro: fl };
    const cor = Number(d.cor) >= 0 && Number(d.cor) < CORES ? Math.floor(Number(d.cor)) : (p.cor || 0);
    const niveis = {}; areas.forEach(a => { const n = Number((d.niveis || {})[a]); if (n >= 1 && n <= 3) niveis[a] = n; });
    const ferramentas = [...new Set(String(d.ferramentas || '').split(',').map(f => limpa(f, 24)).filter(Boolean))].slice(0, 10);
    return comEspaco(() => Object.assign(p, { nome, curso: limpa(d.curso, 60), bio: limpa(d.bio, 400), oferece: limpa(d.oferece, 400), areas, niveis, ferramentas, horas: limpa(d.horas, 40), foto: d.foto || '', cor, disponivel: !!d.disponivel, dias }));
  }
  function guardarExperiencia(d) {
    const p = eu(), titulo = limpa(d.titulo, 80);
    if (!titulo) return { erro: 'Escreve o que fizeste.' };
    const fl = filtro(d.titulo, d.onde); if (fl) return { erro: fl };
    const e = { titulo, onde: limpa(d.onde, 60), ano: limpa(d.ano, 9) }, ex = d.id && p.experiencias.find(x => x.id === d.id);
    if (!ex && p.experiencias.length >= LIMITES.experiencias) return { erro: 'Já tens ' + LIMITES.experiencias + ' experiências. Apaga uma antes de juntares outra.' };
    if (ex) Object.assign(ex, e); else p.experiencias.unshift(Object.assign({ id: novoId('e_') }, e));
    gravar(); return { ok: true };
  }
  function tirarExperiencia(id) { const p = eu(); p.experiencias = p.experiencias.filter(e => e.id !== id); gravar(); }
  // Uma peça própria em destaque: aparece primeiro no portefólio.
  function destacarPeca(id) { const x = DB.pecas.find(k => k.id === id && k.uid === DB.eu); if (!x) return { erro: 'Só destacas trabalhos teus.' }; const on = !x.destaque; DB.pecas.forEach(k => { if (k.uid === DB.eu && k.destaque) delete k.destaque; }); if (on) x.destaque = true; gravar(); return { ok: true, on }; }
  // Números pessoais para o perfil.
  function estatisticas(uid) {
    const feitos = DB.pedidos.filter(p => p.freelancerUid === uid && p.estado === 'concluido');
    const dias = feitos.filter(p => p.inicioEm && p.entrega && p.entrega.em).map(p => Math.max(0, (p.entrega.em - p.inicioEm) / DIA));
    const conta = {}; feitos.forEach(p => { conta[p.area] = (conta[p.area] || 0) + 1; });
    const top = Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || '';
    return { feitos: feitos.length, pedidos: DB.pedidos.filter(p => p.uid === uid).length, mediaDias: dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length * 10) / 10 : null, area: top };
  }
  // Trabalhos a decorrer com o prazo a 2 dias ou menos (ou passado), e tarefas com data nos próximos 2 dias.
  function prazosPerto() {
    const iso = isoDe(new Date(Date.now() + 2 * DIA));
    const out = [];
    DB.pedidos.filter(p => p.estado === 'em_curso' && (p.freelancerUid === DB.eu || p.uid === DB.eu)).forEach(p => {
      if (p.prazo && p.prazo <= iso) out.push({ p, texto: 'Prazo do trabalho: ' + diaCurto(p.prazo) });
      (p.tarefas || []).filter(t => !t.feito && t.ate && t.ate <= iso).forEach(t => out.push({ p, texto: 'Tarefa «' + t.texto + '» até ' + diaCurto(t.ate) }));
    });
    return out;
  }
  function guardarPeca(d) {
    const titulo = limpa(d.titulo, 80), link = limpa(d.link, 300);
    if (!titulo) return { erro: 'Dá um título ao trabalho.' };
    const fl = filtro(d.titulo, d.desc); if (fl) return { erro: fl };
    if (link && !eLink(link)) return { erro: 'A ligação tem de começar por https://' };
    const ex = d.id && DB.pecas.find(x => x.id === d.id && x.uid === DB.eu);
    if (!ex && DB.pecas.filter(x => x.uid === DB.eu).length >= LIMITES.pecas) return { erro: 'O portefólio já tem ' + LIMITES.pecas + ' trabalhos. Tira um antes de juntares outro.' };
    return comEspaco(() => { const n = { titulo, desc: limpa(d.desc, 400), area: AREA(d.area).id, img: d.img || '', link }; if (ex) Object.assign(ex, n); else DB.pecas.unshift(Object.assign({ id: novoId('p_'), uid: DB.eu, em: Date.now() }, n)); });
  }
  function tirarPeca(id) { DB.pecas = DB.pecas.filter(e => !(e.id === id && e.uid === DB.eu)); gravar(); }

  /* ---------- 4. Pedidos ---------- */
  function validarPedido(d) {
    const titulo = limpa(d.titulo, 90), precisa = limpa(d.precisa, 800), objetivo = limpa(d.objetivo, 500);
    if (titulo.length < 6) return { erro: 'Dá um título mais completo ao pedido.' };
    if (precisa.length < 15) return { erro: 'Explica melhor o que precisas.' };
    if (objetivo.length < 10) return { erro: 'Diz o que queres alcançar.' };
    const fl = filtro(titulo, precisa, objetivo, d.finalidade); if (fl) return { erro: fl };
    if (!d.naoNota) return { erro: 'Confirma que não é um trabalho que conta para nota.' };
    const prazo = /^\d{4}-\d{2}-\d{2}$/.test(d.prazo || '') ? d.prazo : '';
    if (prazo && prazo < hojeISO()) return { erro: 'O prazo já passou. Escolhe uma data a partir de hoje.' };
    return { v: { tipo: TIPO(d.tipo).id, area: AREA(d.area).id, titulo, precisa, objetivo, finalidade: limpa(d.finalidade, 300), prazo, formato: FORMATOS.some(f => f.id === d.formato) ? d.formato : '', img: d.img || '', portefolioOk: !!d.portefolioOk } };
  }
  function publicarPedido(d) {
    const sp = bloqueadoPorSuspensao(); if (sp) return { erro: sp };
    const r = validarPedido(d); if (r.erro) return r;
    const rt = ritmo('post'); if (rt) return { erro: rt };
    if (DB.pedidos.filter(p => p.uid === DB.eu && p.estado === 'aberto').length >= LIMITES.pedidosAbertos) return { erro: 'Já tens ' + LIMITES.pedidosAbertos + ' pedidos abertos. Fecha ou cancela um antes de publicares outro.' };
    const p = Object.assign({ id: novoId('pd_'), uid: DB.eu, estado: 'aberto', freelancerUid: '', tarefas: [], entregas: [], oculto: false, criadoEm: Date.now() }, r.v);
    const g = comEspaco(() => { DB.pedidos.unshift(p); delete DB.rascunhos[DB.eu]; });
    if (!g.erro) marcar('post');
    return g.erro ? g : { ok: true, id: p.id };
  }
  function editarPedido(id, d) {
    const sp = bloqueadoPorSuspensao(); if (sp) return { erro: sp };
    const p = pedido(id); if (!p || p.uid !== DB.eu || p.estado !== 'aberto') return { erro: 'Só dá para editar um pedido enquanto está aberto.' };
    const r = validarPedido(d); if (r.erro) return r;
    const g = comEspaco(() => { Object.assign(p, r.v); p.editadoEm = Date.now(); });
    return g.erro ? g : { ok: true, id };
  }
  // Pedidos abertos há mais de 30 dias sem propostas por ver: quem publicou decide se mantém ou fecha.
  const parados = () => DB.pedidos.filter(p => p.uid === DB.eu && p.estado === 'aberto' && Date.now() - (p.editadoEm || p.criadoEm) > 30 * DIA && !DB.propostas.some(x => x.pedidoId === p.id && x.estado === 'pendente'));
  function renovarPedido(id) { const p = pedido(id); if (!p || p.uid !== DB.eu || p.estado !== 'aberto') return { erro: 'Este pedido já não está aberto.' }; p.editadoEm = Date.now(); gravar(); return { ok: true }; }
  // Professor confirmado pelo administrador depois de ter entrado como aluno.
  function passarProfessor() { const e = eu(); if (!e) return { erro: 'Sem conta.' }; e.tipo = 'professor'; e.disponivel = false; gravar(); return { ok: true }; }
  const anuncio = () => (typeof Nuvem !== 'undefined' && Nuvem.ativa() ? Nuvem.anuncio() : DB.anuncio) || null;
  // Primeiros passos de quem chegou agora: o caminho até ao primeiro trabalho, com o que já está feito.
  function primeirosPassos(areasSeguidas) { // areasSeguidas: quantas áreas a pessoa segue nos alertas (fica no dispositivo)
    const e = eu(); if (!e) return [];
    const prof = e.tipo === 'professor', c = completo(DB.eu);
    return [
      { t: 'Completa o teu perfil', d: 'Uma apresentação e as tuas áreas ajudam os outros a confiar em ti.', feito: c.pct >= 60, a: 'editar-perfil' },
      { t: 'Segue as áreas que te interessam', d: 'És avisado quando aparece um pedido novo nelas.', feito: areasSeguidas > 0, a: 'ir-alertas' },
      prof ? { t: 'Publica um pedido ou recomenda um aluno', d: 'Uma recomendação tua vale muito no portefólio de um aluno.', feito: DB.pedidos.some(p => p.uid === DB.eu) || DB.recs.some(r => r.de === DB.eu), a: 'ir', v: 'freelancers' }
        : { t: 'Publica um pedido ou envia uma proposta', d: 'Pede ajuda a quem sabe, ou oferece-te para um pedido aberto.', feito: DB.pedidos.some(p => p.uid === DB.eu) || DB.propostas.some(x => x.uid === DB.eu), a: 'ir', v: 'pedidos' },
      { t: 'Conclui o teu primeiro trabalho', d: 'A pedir ou a fazer: fica no portefólio com a avaliação.', feito: DB.pedidos.some(p => p.estado === 'concluido' && (p.uid === DB.eu || p.freelancerUid === DB.eu)), a: 'ir', v: 'pedidos' }
    ];
  }
  function cancelarPedido(id, motivo) {
    const p = pedido(id); motivo = limpa(motivo, 200);
    if (!p || p.uid !== DB.eu || !['aberto', 'em_curso'].includes(p.estado)) return { erro: 'Este pedido já não pode ser cancelado.' };
    if (p.estado === 'em_curso' && motivo.length < 5) return { erro: 'Já há alguém a trabalhar nisto. Explica porque cancelas.' };
    const fl = filtro(motivo); if (fl) return { erro: fl };
    sistema(conversaAtiva(id), 'O pedido foi cancelado por quem o publicou.' + (motivo ? ' Motivo: ' + motivo : ''));
    avisar(p.freelancerUid, nomeEu() + ' cancelou o pedido «' + p.titulo + '».', alvoPedido(id));
    p.estado = 'cancelado'; p.motivo = motivo;
    DB.propostas.forEach(x => { if (x.pedidoId === id && x.estado === 'pendente') x.estado = 'recusada'; });
    gravar(); return { ok: true };
  }
  function enviarProposta(pedidoId, texto, dias) {
    const p = pedido(pedidoId); texto = limpa(texto, 600); dias = Math.round(Number(dias));
    if (!p || p.estado !== 'aberto') return { erro: 'Este pedido já não está aberto.' };
    if (p.uid === DB.eu) return { erro: 'Não podes responder ao teu próprio pedido.' };
    if (bloqueado(p.uid)) return { erro: 'Não podes responder a este pedido.' };
    if (texto.length < 15) return { erro: 'Explica como podes ajudar.' };
    const fl = filtro(texto) || bloqueadoPorSuspensao() || ritmo('post'); if (fl) return { erro: fl };
    if (!(dias >= 1 && dias <= 365)) return { erro: 'Diz em quantos dias contas entregar (de 1 a 365).' };
    if (DB.propostas.some(x => x.pedidoId === pedidoId && x.uid === DB.eu && x.estado === 'pendente')) return { erro: 'Já respondeste a este pedido.' };
    if (DB.propostas.filter(x => x.uid === DB.eu && x.estado === 'pendente' && x.origem === 'proposta' && (pedido(x.pedidoId) || {}).estado === 'aberto').length >= LIMITES.propostasPendentes) return { erro: 'Tens ' + LIMITES.propostasPendentes + ' propostas à espera de resposta. Retira uma antes de enviares outra.' };
    DB.propostas.push({ id: novoId('pr_'), pedidoId, dono: p.uid, uid: DB.eu, texto, dias, origem: 'proposta', estado: 'pendente', criadoEm: Date.now() });
    avisar(p.uid, nomeEu() + ' enviou uma proposta para «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); marcar('post'); return { ok: true };
  }
  function convidar(pedidoId, uid) {
    const p = pedido(pedidoId);
    if (!p || p.uid !== DB.eu || p.estado !== 'aberto') return { erro: 'Escolhe um pedido teu que esteja aberto.' };
    if (uid === DB.eu || !pessoa(uid) || bloqueado(uid)) return { erro: 'Não é possível convidar esta pessoa.' };
    if (DB.propostas.some(x => x.pedidoId === pedidoId && x.uid === uid && x.estado === 'pendente')) return { erro: 'Esta pessoa já tem um convite ou uma proposta neste pedido.' };
    DB.propostas.push({ id: novoId('pr_'), pedidoId, dono: p.uid, uid, texto: '', dias: 0, origem: 'convite', estado: 'pendente', criadoEm: Date.now() });
    avisar(uid, nomeEu() + ' convidou-te para «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  // Quem pede aceita uma proposta; quem foi convidado aceita o convite. Nos dois casos o trabalho começa.
  function aceitar(propostaId) {
    const pr = DB.propostas.find(x => x.id === propostaId), p = pr && pedido(pr.pedidoId);
    if (!pr || !p || pr.estado !== 'pendente' || p.estado !== 'aberto') return { erro: 'Esta proposta já não está disponível.' };
    if (!(pr.origem === 'convite' ? pr.uid === DB.eu : p.uid === DB.eu)) return { erro: 'Não és tu que decides esta proposta.' };
    pr.estado = 'aceite';
    DB.propostas.forEach(x => { if (x.pedidoId === p.id && x.id !== pr.id && x.estado === 'pendente') { x.estado = 'recusada'; if (x.origem === 'proposta') avisar(x.uid, 'O pedido «' + p.titulo + '» foi entregue a outra pessoa.', alvoPedido(p.id)); } });
    p.estado = 'em_curso'; p.freelancerUid = pr.uid; p.propostaId = pr.id; p.inicioEm = Date.now();
    const cid = 'cv_' + p.id + '_' + pr.uid;
    let c = conversa(cid); if (!c) { c = { id: cid, pedidoId: p.id, uids: [p.uid, pr.uid], msgs: [] }; DB.conversas.push(c); }
    sistema(c, 'O trabalho começou. Combinem aqui os detalhes.');
    avisar(pr.origem === 'convite' ? p.uid : pr.uid, pr.origem === 'convite' ? nomeEu() + ' aceitou o teu convite para «' + p.titulo + '».' : nomeEu() + ' escolheu-te para «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true, conversaId: c.id };
  }
  function recusar(propostaId) {
    const pr = DB.propostas.find(x => x.id === propostaId), p = pr && pedido(pr.pedidoId);
    if (!pr || !p || pr.estado !== 'pendente') return { erro: 'Esta proposta já foi decidida.' };
    if (!(pr.uid === DB.eu || p.uid === DB.eu)) return { erro: 'Não és tu que decides esta proposta.' };
    pr.estado = 'recusada';
    if (pr.uid !== DB.eu) avisar(pr.uid, 'A tua proposta para «' + p.titulo + '» não foi escolhida.', alvoPedido(p.id));
    else if (pr.origem === 'convite') avisar(p.uid, nomeEu() + ' recusou o convite para «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true };
  }

  /* ---------- 5. Trabalho em curso ---------- */
  // Quem faz desiste: o pedido volta a ficar aberto para outra pessoa.
  function desistir(pedidoId, motivo) {
    const p = pedido(pedidoId); motivo = limpa(motivo, 200);
    if (!p || p.freelancerUid !== DB.eu || p.estado !== 'em_curso') return { erro: 'Só dá para desistir de um trabalho em curso.' };
    if (motivo.length < 5) return { erro: 'Explica porque desistes.' };
    const fl = filtro(motivo); if (fl) return { erro: fl };
    sistema(conversaAtiva(p.id), nomeEu() + ' desistiu do trabalho. Motivo: ' + motivo + ' O pedido voltou a ficar aberto.');
    avisar(p.uid, nomeEu() + ' desistiu de «' + p.titulo + '». O pedido voltou a ficar aberto.', alvoPedido(p.id));
    p.estado = 'aberto'; p.freelancerUid = ''; p.propostaId = ''; p.entrega = null;
    gravar(); return { ok: true };
  }
  function entregar(pedidoId, d) {
    const p = pedido(pedidoId), texto = limpa(d.texto, 800), link = limpa(d.link, 300);
    if (!p || p.freelancerUid !== DB.eu || p.estado !== 'em_curso') return { erro: 'Este trabalho não está à espera de entrega.' };
    if (texto.length < 10) return { erro: 'Descreve o que entregas.' };
    const fl = filtro(texto); if (fl) return { erro: fl };
    if (link && !eLink(link)) return { erro: 'A ligação tem de começar por https://' };
    return comEspaco(() => {
      p.entrega = { texto, link, img: d.img || '', em: Date.now(), alteracoes: '' }; p.entregas = p.entregas.map(e => Object.assign({}, e, { img: '' })).concat([p.entrega]).slice(-5); p.estado = 'entregue';
      sistema(conversaAtiva(p.id), 'O trabalho foi entregue. Falta quem pediu confirmar.');
      avisar(p.uid, nomeEu() + ' entregou «' + p.titulo + '». Confirma e avalia.', alvoPedido(p.id));
    });
  }
  function pedirAlteracoes(pedidoId, texto) {
    const p = pedido(pedidoId); texto = limpa(texto, 600);
    if (!p || p.uid !== DB.eu || p.estado !== 'entregue') return { erro: 'Este trabalho não está entregue.' };
    if (texto.length < 10) return { erro: 'Explica o que falta mudar.' };
    const fl = filtro(texto); if (fl) return { erro: fl };
    p.estado = 'em_curso'; p.entrega = Object.assign({}, p.entrega, { alteracoes: texto }); p.entregas = p.entregas.slice(0, -1).concat([p.entrega]);
    const c = conversaAtiva(p.id); if (c) c.msgs.push({ id: novoId('m_'), uid: DB.eu, texto: 'Pedi alterações: ' + texto, em: Date.now() });
    avisar(p.freelancerUid, nomeEu() + ' pediu alterações em «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  // Quem pediu confirma e avalia. Se autorizou, o trabalho entra no portefólio de quem o fez.
  function concluir(pedidoId, d) {
    const p = pedido(pedidoId), estrelas = Math.round(Number(d.estrelas));
    if (!p || p.uid !== DB.eu || p.estado !== 'entregue') return { erro: 'Este trabalho não está entregue.' };
    if (!(estrelas >= 1 && estrelas <= 5)) return { erro: 'Escolhe de 1 a 5 estrelas.' };
    { const fl = filtro(d.texto); if (fl) return { erro: fl }; }
    p.estado = 'concluido'; p.concluidoEm = Date.now(); p.avaliacao = { estrelas, texto: limpa(d.texto, 400), em: Date.now() };
    sistema(conversaAtiva(p.id), 'Trabalho concluído e avaliado.' + (p.portefolioOk ? ' Já está no portefólio de quem o fez.' : ''));
    avisar(p.freelancerUid, nomeEu() + ' confirmou «' + p.titulo + '» e deu-te ' + estrelas + (estrelas === 1 ? ' estrela.' : ' estrelas.'), alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  // Quem pediu não respondeu dentro do prazo: quem fez fecha o trabalho, sem avaliação.
  function fecharSozinho(pedidoId) {
    const p = pedido(pedidoId);
    if (!p || !podeFecharSozinho(p)) return { erro: 'Ainda não passaram ' + LIMITES.diasSemResposta + ' dias desde a entrega.' };
    p.estado = 'concluido'; p.concluidoEm = Date.now(); p.semResposta = true;
    sistema(conversaAtiva(p.id), 'Trabalho fechado por quem o fez, por falta de resposta durante ' + LIMITES.diasSemResposta + ' dias.');
    avisar(p.uid, '«' + p.titulo + '» foi fechado por falta de resposta.', alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  // Quem fez o trabalho avalia quem o pediu.
  function avaliarDono(pedidoId, d) {
    const p = pedido(pedidoId), estrelas = Math.round(Number(d.estrelas));
    if (!p || p.freelancerUid !== DB.eu || p.estado !== 'concluido' || p.avalDono) return { erro: 'Este trabalho não pode ser avaliado.' };
    if (!(estrelas >= 1 && estrelas <= 5)) return { erro: 'Escolhe de 1 a 5 estrelas.' };
    { const fl = filtro(d.texto); if (fl) return { erro: fl }; }
    p.avalDono = { estrelas, texto: limpa(d.texto, 400), em: Date.now() };
    avisar(p.uid, nomeEu() + ' avaliou a forma como pediste «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  const noTrabalho = p => p && (p.uid === DB.eu || p.freelancerUid === DB.eu) && ['em_curso', 'entregue'].includes(p.estado);
  function juntarTarefa(pedidoId, texto, ate) {
    const p = pedido(pedidoId); texto = limpa(texto, 100);
    if (!noTrabalho(p)) return { erro: 'Só quem está no trabalho mexe nas tarefas.' };
    if (!texto) return { erro: '' };
    { const fl = filtro(texto); if (fl) return { erro: fl }; }
    if (p.tarefas.length >= LIMITES.tarefas) return { erro: 'A lista já tem ' + LIMITES.tarefas + ' tarefas.' };
    const t = { id: novoId('tf_'), texto, feito: false }; if (/^\d{4}-\d{2}-\d{2}$/.test(ate || '')) t.ate = ate;
    p.tarefas.push(t); gravar(); return { ok: true };
  }
  function marcarTarefa(pedidoId, id) { const p = pedido(pedidoId), t = noTrabalho(p) && p.tarefas.find(x => x.id === id); if (!t) return { erro: 'Tarefa indisponível.' }; t.feito = !t.feito; gravar(); return { ok: true }; }
  function tirarTarefa(pedidoId, id) { const p = pedido(pedidoId); if (!noTrabalho(p)) return { erro: 'Tarefa indisponível.' }; p.tarefas = p.tarefas.filter(x => x.id !== id); gravar(); return { ok: true }; }

  /* ---------- 6. Conversas, perguntas e avisos ---------- */
  function enviarMensagem(conversaId, texto, img, resp) {
    const c = conversa(conversaId); texto = limpa(texto, 1000);
    if (!c || !c.uids.includes(DB.eu)) return { erro: 'Não fazes parte desta conversa.' };
    if (conversaFechada(c)) return { erro: 'Esta conversa está fechada.' };
    if (!texto && !img) return { erro: '' };
    const outro = c.uids.find(u => u !== DB.eu);
    if (bloqueei(outro)) return { erro: 'Bloqueaste esta pessoa. Desbloqueia-a em Perfil → Definições para voltares a escrever.' };
    const fl = filtro(texto) || bloqueadoPorSuspensao() || ritmo('msg'); if (fl) return { erro: fl };
    const m = { id: novoId('m_'), uid: DB.eu, texto, img: img || '', em: Date.now() };
    if (resp && c.msgs.some(x => x.id === resp.id)) m.resp = { id: resp.id, uid: resp.uid || '', texto: limpa(resp.texto || 'Imagem', 140) };
    const r = comEspaco(() => c.msgs.push(m));
    if (r.ok) { marcar('msg'); marcarLida(conversaId); }
    return r;
  }
  // Apagar uma mensagem: cada pessoa apaga as suas (o administrador apaga pelo painel).
  function apagarMensagem(conversaId, id) {
    const c = conversa(conversaId), m = c && c.msgs.find(x => x.id === id);
    if (!m || m.uid !== DB.eu) return { erro: 'Só podes apagar as tuas mensagens.' };
    c.msgs = c.msgs.filter(x => x.id !== id); gravar(); return { ok: true };
  }
  // Guarda até onde li. Só grava se houver mensagens novas (cada abertura da conversa não gera uma escrita).
  function marcarLida(conversaId) { const c = conversa(conversaId); if (!c) return; if (!DB.lidas[DB.eu]) DB.lidas[DB.eu] = {}; const t = ultima(c); if ((DB.lidas[DB.eu][conversaId] || 0) >= t) return; DB.lidas[DB.eu][conversaId] = t; gravar();
    // «Visto»: só quem ligou a opção diz às outras pessoas até onde leu
    const e = eu(); if (e && e.visto && typeof Nuvem !== 'undefined' && Nuvem.ativa()) Nuvem.marcarVisto(conversaId, c.uids.find(u => u !== DB.eu), t); }
  // Até quando a outra pessoa leu esta conversa (0 se alguma das duas não ligou o «visto»).
  function vistoPor(c) {
    const o = c.uids.find(u => u !== DB.eu), e = eu(), q = pessoa(o); if (!e || !e.visto || !q || !q.visto) return 0;
    return typeof Nuvem !== 'undefined' && Nuvem.ativa() ? Nuvem.vistoEm(c.id) : ((DB.lidas[o] || {})[c.id] || 0);
  }
  function ligarVisto(on) { const e = eu(); if (!e) return; if (on) e.visto = true; else delete e.visto; gravar(); }
  function perguntar(pedidoId, texto) {
    const p = pedido(pedidoId); texto = limpa(texto, 300);
    if (!p || p.estado !== 'aberto' || p.uid === DB.eu || bloqueado(p.uid)) return { erro: 'Não é possível perguntar neste pedido.' };
    if (texto.length < 8) return { erro: 'Escreve a pergunta completa.' };
    const fl = filtro(texto) || bloqueadoPorSuspensao() || ritmo('post'); if (fl) return { erro: fl };
    if (perguntasDe(pedidoId).length >= LIMITES.perguntasPorPedido) return { erro: 'Este pedido já tem muitas perguntas.' };
    DB.perguntas.push({ id: novoId('q_'), pedidoId, dono: p.uid, uid: DB.eu, texto, em: Date.now(), resposta: '', respEm: 0 });
    avisar(p.uid, nomeEu() + ' fez uma pergunta em «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); marcar('post'); return { ok: true };
  }
  function responder(perguntaId, texto) {
    const q = DB.perguntas.find(x => x.id === perguntaId), p = q && pedido(q.pedidoId); texto = limpa(texto, 400);
    if (!q || !p || p.uid !== DB.eu) return { erro: 'Só quem publicou o pedido responde.' };
    if (texto.length < 2) return { erro: 'Escreve a resposta.' };
    const fl = filtro(texto); if (fl) return { erro: fl };
    q.resposta = texto; q.respEm = Date.now();
    avisar(q.uid, nomeEu() + ' respondeu à tua pergunta em «' + p.titulo + '».', alvoPedido(p.id));
    gravar(); return { ok: true };
  }
  function lerAvisos() { let mudou = false; DB.avisos.forEach(a => { if (a.para === DB.eu && !a.lido) { a.lido = true; mudou = true; } }); if (mudou) gravar(); }

  /* ---------- 7. Comunidade: guardados, bloqueios, recomendações, denúncias ---------- */
  function guardar(t, id) { const g = guardados(), i = g[t].indexOf(id); if (i >= 0) g[t].splice(i, 1); else g[t].unshift(id); gravar(); return i < 0; }
  function bloquear(uid) {
    if (uid === DB.eu || !pessoa(uid)) return { erro: 'Pessoa inválida.' };
    if (DB.pedidos.some(p => ['em_curso', 'entregue'].includes(p.estado) && ((p.uid === DB.eu && p.freelancerUid === uid) || (p.uid === uid && p.freelancerUid === DB.eu)))) return { erro: 'Têm um trabalho a decorrer. Acaba, cancela ou desiste do trabalho antes de bloqueares.' };
    const l = DB.bloqueios[DB.eu] || (DB.bloqueios[DB.eu] = []);
    if (!l.includes(uid)) l.push(uid);
    DB.propostas.forEach(x => { const p = pedido(x.pedidoId); if (x.estado === 'pendente' && p && ((x.uid === uid && p.uid === DB.eu) || (x.uid === DB.eu && p.uid === uid))) x.estado = 'recusada'; });
    gravar(); return { ok: true };
  }
  function desbloquear(uid) { DB.bloqueios[DB.eu] = (DB.bloqueios[DB.eu] || []).filter(u => u !== uid); gravar(); }
  const bloqueados = () => (DB.bloqueios[DB.eu] || []).map(pessoa).filter(Boolean);
  // Só professores recomendam, e só alunos são recomendados. Uma recomendação por professor e por aluno.
  function recomendar(uid, texto) {
    const e = eu(), q = pessoa(uid); texto = limpa(texto, 400);
    if (!e || e.tipo !== 'professor') return { erro: 'Só os professores escrevem recomendações.' };
    if (!q || q.tipo !== 'aluno') return { erro: 'As recomendações são para alunos.' };
    if (texto.length < 20) return { erro: 'Escreve pelo menos uma frase completa.' };
    const fl = filtro(texto); if (fl) return { erro: fl };
    const ex = DB.recs.find(r => r.de === DB.eu && r.para === uid);
    if (ex) { ex.texto = texto; ex.em = Date.now(); } else DB.recs.push({ id: 'rc_' + DB.eu + '_' + uid, de: DB.eu, para: uid, texto, em: Date.now() });
    avisar(uid, nomeEu() + ' escreveu-te uma recomendação.', { t: 'pessoa', id: uid });
    gravar(); return { ok: true };
  }
  function tirarRecomendacao(id) { const r = DB.recs.find(x => x.id === id); if (r && (r.de === DB.eu || r.para === DB.eu)) { DB.recs = DB.recs.filter(x => x.id !== id); gravar(); } }
  // Denúncia. tipo: pedido, perfil, conversa ou msg (alvo «conversa/mensagem», com o texto e o autor para o administrador ver).
  function denunciar(tipo, id, motivo, texto, extra) {
    if (!MOTIVOS_DENUNCIA.some(m => m[0] === motivo)) return { erro: 'Escolhe um motivo.' };
    const rt = ritmo('post'); if (rt) return { erro: rt };
    if (DB.denuncias.some(d => d.uid === DB.eu && d.tipo === tipo && d.alvo === id && d.estado === 'aberta')) return { erro: 'Já denunciaste isto. A denúncia está à espera de ser vista.' };
    const d = { id: novoId('dn_'), tipo, alvo: id, motivo, texto: limpa(texto, 400), uid: DB.eu, em: Date.now(), estado: 'aberta' };
    if (extra && extra.autor) d.autor = extra.autor;
    if (extra && extra.citacao) d.citacao = limpa(extra.citacao, 500);
    DB.denuncias.push(d); marcar('post'); gravar(); return { ok: true };
  }
  // Moderação (no modo de demonstração qualquer pessoa abre o painel; com contas, só o administrador).
  function moderar(denunciaId, acao) {
    const d = DB.denuncias.find(x => x.id === denunciaId); if (!d) return { erro: 'Denúncia inexistente.' };
    if (acao === 'ocultar' && d.tipo === 'pedido') { const p = pedido(d.alvo); if (p) { p.oculto = true; avisar(p.uid, 'O teu pedido «' + p.titulo + '» foi ocultado pela moderação.', alvoPedido(p.id)); } }
    d.estado = acao === 'ocultar' ? 'resolvida' : 'arquivada'; gravar(); return { ok: true };
  }
  // Suspensão na demonstração (com conta, o painel escreve em bans, como a Pronex_Study).
  function suspenderDemo(uid, dias, motivo) { DB.bans[uid] = { motivo: limpa(motivo, 200), em: Date.now(), ate: dias ? Date.now() + dias * DIA : 0 }; gravar(); }
  function retirarSuspensaoDemo(uid) { delete DB.bans[uid]; gravar(); }
  function mostrarPedido(id) { const p = pedido(id); if (p) { p.oculto = false; gravar(); } }

  /* ---------- 8. Conta, preferências e demonstração ---------- */
  function tema(t) { DB.tema = t === 'claro' ? 'claro' : 'escuro'; gravar(); }
  function texto(t) { DB.texto = t === 'grande' ? 'grande' : 'normal'; gravar(); }
  const guiaVisto = () => !!DB.guia[DB.eu];
  function verGuia() { DB.guia[DB.eu] = true; gravar(); }
  const rascunho = () => DB.rascunhos[DB.eu] || null;
  function guardarRascunho(d) { if (d) DB.rascunhos[DB.eu] = d; else delete DB.rascunhos[DB.eu]; gravar(); }
  function usarComo(uid) { if (pessoa(uid)) { DB.eu = uid; gravar(); } }
  // Tudo o que a app guarda sobre mim, para eu levar comigo.
  function exportar() {
    const u = DB.eu;
    return JSON.stringify({ app: APP_NOME, versao: APP_VERSION, exportadoEm: new Date().toISOString(), perfil: eu(), portefolio: DB.pecas.filter(x => x.uid === u),
      pedidos: DB.pedidos.filter(p => p.uid === u || p.freelancerUid === u), propostas: DB.propostas.filter(p => p.uid === u),
      conversas: DB.conversas.filter(c => c.uids.includes(u)), perguntas: DB.perguntas.filter(q => q.uid === u),
      recomendacoes: DB.recs.filter(r => r.de === u || r.para === u), guardados: DB.guardados[u] || {}, bloqueios: DB.bloqueios[u] || [] }, null, 1);
  }
  // Apaga a conta: sai o perfil e tudo o que é só meu. Os trabalhos concluídos de outras pessoas ficam, sem o meu nome.
  function apagarConta() {
    const u = DB.eu; if (!u) return { erro: 'Sem conta.' };
    if (DB.pedidos.some(p => ['em_curso', 'entregue'].includes(p.estado) && (p.uid === u || p.freelancerUid === u))) return { erro: 'Tens trabalhos a decorrer. Acaba, cancela ou desiste deles antes de apagares a conta.' };
    DB.pedidos = DB.pedidos.filter(p => !(p.uid === u && p.estado !== 'concluido'));
    const ids = new Set(DB.pedidos.map(p => p.id));
    DB.propostas = DB.propostas.filter(p => p.uid !== u && ids.has(p.pedidoId));
    DB.perguntas = DB.perguntas.filter(q => q.uid !== u && ids.has(q.pedidoId));
    DB.conversas = DB.conversas.filter(c => !c.uids.includes(u));
    DB.recs = DB.recs.filter(r => r.de !== u && r.para !== u);
    DB.pecas = DB.pecas.filter(x => x.uid !== u);
    DB.avisos = DB.avisos.filter(a => a.para !== u);
    DB.denuncias = DB.denuncias.filter(d => d.uid !== u);
    ['guardados', 'bloqueios', 'rascunhos', 'guia', 'lidas'].forEach(k => delete DB[k][u]);
    Object.values(DB.bloqueios).forEach(l => { const i = l.indexOf(u); if (i >= 0) l.splice(i, 1); });
    delete DB.pessoas[u];
    if (DB.minha === u) DB.minha = '';
    DB.eu = ''; gravar(); return { ok: true };
  }

  return { iniciar, repor, semEspaco: () => semEspaco,
    eu, pessoa, pedido, bloqueei, bloqueado, bloqueados, visivel, pessoasVisiveis, propostasDe, conversa, conversaAtiva, conversaFechada, ultima, minhasConversas, naoLidas, totalNaoLidas,
    avaliacoes, media, concluidos, portefolio, comoPede, convites, emCurso, avisos, avisosPorLer, guardados, guardado, perguntasDe, recsDe, completo, selos, destaques, numeros, paraTi, sugeridos, prazoInfo, podeFecharSozinho,
    criarPerfil, editarPerfil, guardarExperiencia, tirarExperiencia, guardarPeca, tirarPeca,
    publicarPedido, editarPedido, cancelarPedido, enviarProposta, convidar, aceitar, recusar,
    desistir, entregar, pedirAlteracoes, concluir, fecharSozinho, avaliarDono, juntarTarefa, marcarTarefa, tirarTarefa,
    enviarMensagem, apagarMensagem, marcarLida, perguntar, responder, lerAvisos, study, eAdmin, suspensao, bloqueadoPorSuspensao, suspenderDemo, retirarSuspensaoDemo, corInicial,
    gravarJa: () => gravar(), primeirosPassos, vistoPor, ligarVisto, anuncio, parados, renovarPedido, destacarPeca, estatisticas, prazosPerto, passarProfessor, guardar, bloquear, desbloquear, recomendar, tirarRecomendacao, denunciar, moderar, mostrarPedido,
    tema, texto, guiaVisto, verGuia, rascunho, guardarRascunho, usarComo, exportar, apagarConta };
})();
