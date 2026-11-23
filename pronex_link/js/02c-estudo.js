/* Pronex_Link · 02c-estudo.js
   Estudo (0.14): dúvidas por disciplina e por exame nacional, com respostas, votos e a resposta escolhida;
   sessões de estudo (explicações e estudo em grupo) com inscrições e lugares; conversas de grupo
   (uma por equipa de pedido e uma por grupo da rede).
   Como na rede, cada documento pertence a uma só pessoa: a resposta de cada pessoa a uma dúvida
   ({dúvida}_{uid}), o voto ({resposta}_{uid}), a inscrição ({sessão}_{uid}). */
'use strict';
Object.assign(Loja, (function () {
  const I = Loja._i, { gravar, comEspaco, avisar, novoId, limpa, filtro, ritmo, marcar, bloqueadoPorSuspensao } = I;
  const DIA = 86400000, MIN = 60000;
  const eu = () => Loja.eu(), pessoa = u => Loja.pessoa(u), bloq = u => Loja.bloqueado(u);
  const nuvem = () => typeof Nuvem !== 'undefined' && Nuvem.ativa();
  const moderador = () => nuvem() ? (Nuvem.admin() || Nuvem.moderador()) : true;
  const travao = () => bloqueadoPorSuspensao();
  const professor = u => { const p = pessoa(u); return !!p && p.tipo === 'professor'; };
  const area = a => AREAS.some(x => x.id === a) ? a : 'outra';

  /* ---------- dúvidas ---------- */
  const duvida = id => DB.duvidas.find(d => d.id === id) || null;
  const podeVerDuvida = d => !!d && (!d.oculto || d.uid === DB.eu || moderador()) && !bloq(d.uid);
  // f: { area, exame, estado: 'todas' | 'abertas' | 'resolvidas' | 'minhas' | 'respondi', q }
  function duvidas(f = {}) {
    const q = String(f.q || '').trim().toLowerCase();
    return DB.duvidas.filter(d => podeVerDuvida(d) && pessoa(d.uid)
      && (!f.area || d.area === f.area) && (!f.exame || d.exame === f.exame)
      && (f.estado === 'abertas' ? !d.resolvida : f.estado === 'resolvidas' ? !!d.resolvida : f.estado === 'minhas' ? d.uid === DB.eu : f.estado === 'respondi' ? !!resposta(d.id + '_' + DB.eu) : true)
      && (!q || (d.titulo + ' ' + d.texto).toLowerCase().includes(q)))
      .sort((a, b) => (f.estado === 'abertas' ? respostasDe(a.id).length - respostasDe(b.id).length : 0) || b.em - a.em);
  }
  const resposta = id => DB.respostas.find(r => r.id === id) || null;
  const votosDe = rid => DB.votos.filter(v => v.respostaId === rid && pessoa(v.uid)).length;
  const votei = rid => DB.votos.some(v => v.id === rid + '_' + DB.eu);
  // A escolhida primeiro, depois as mais votadas; em empate, a de um professor e depois a mais antiga.
  function respostasDe(did) {
    const d = duvida(did);
    return DB.respostas.filter(r => r.duvidaId === did && pessoa(r.uid) && !bloq(r.uid) && (!r.oculto || r.uid === DB.eu || moderador()))
      .sort((a, b) => (d && d.resolvida === b.id) - (d && d.resolvida === a.id) || votosDe(b.id) - votosDe(a.id) || professor(b.uid) - professor(a.uid) || a.em - b.em);
  }
  function perguntarDuvida(x) {
    const v = { titulo: limpa(x.titulo, 140), texto: limpa(x.texto, 1500), area: area(x.area), exame: EXAMES.some(e => e[0] === x.exame) ? x.exame : '', img: imgSegura(x.img) || '' };
    if (v.titulo.length < 10) return { erro: 'Escreve a dúvida numa frase com pelo menos 10 letras.' };
    if (DB.duvidas.filter(d => d.uid === DB.eu && !d.resolvida && Date.now() - d.em < DIA).length >= 10) return { erro: 'Já fizeste 10 dúvidas hoje. Marca as que ficaram resolvidas antes de fazeres mais.' };
    const fl = filtro(v.titulo, v.texto) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const d = Object.assign({ id: novoId('dv_'), uid: DB.eu, em: Date.now(), oculto: false, resolvida: '' }, v);
    const r = comEspaco(() => DB.duvidas.push(d)); if (r.ok) { marcar('post'); r.id = d.id; }
    return r;
  }
  function editarDuvida(id, x) {
    const d = duvida(id); if (!d || d.uid !== DB.eu) return { erro: 'Só quem fez a dúvida a pode mudar.' };
    const titulo = limpa(x.titulo, 140), texto = limpa(x.texto, 1500);
    if (titulo.length < 10) return { erro: 'Escreve a dúvida numa frase com pelo menos 10 letras.' };
    const fl = filtro(titulo, texto) || travao(); if (fl) return { erro: fl };
    return comEspaco(() => { d.titulo = titulo; d.texto = texto; d.editadoEm = Date.now(); });
  }
  function apagarDuvida(id) {
    const d = duvida(id); if (!d || (d.uid !== DB.eu && !moderador())) return { erro: 'Só quem fez a dúvida a pode apagar.' };
    // as respostas saem com a dúvida (quem perguntou pode apagá-las); os votos de outras pessoas ficam órfãos e não aparecem
    return comEspaco(() => { DB.duvidas = DB.duvidas.filter(x => x !== d); DB.respostas = DB.respostas.filter(r => r.duvidaId !== id); DB.votos = DB.votos.filter(v => v.duvidaId !== id || (nuvem() && v.uid !== DB.eu)); });
  }
  function ocultarDuvida(id, oculto) { const d = duvida(id); if (!d || !moderador()) return { erro: 'Só a moderação pode ocultar.' }; return comEspaco(() => { d.oculto = !!oculto; }); }
  function responderDuvida(did, texto, img) {
    const d = duvida(did); texto = limpa(texto, 2000); img = imgSegura(img) || '';
    if (!d || d.oculto) return { erro: 'Dúvida indisponível.' };
    if (d.uid === DB.eu) return { erro: 'Não podes responder à tua dúvida. Se a resolveste, junta a explicação ao texto da dúvida.' };
    if (bloq(d.uid) || Loja.bloqueei(d.uid)) return { erro: 'Não podes responder a esta pessoa.' };
    if (texto.length < 10) return { erro: 'Explica a resposta em pelo menos uma frase (10 letras).' };
    const fl = filtro(texto) || travao() || ritmo('msg'); if (fl) return { erro: fl };
    const id = did + '_' + DB.eu, ant = resposta(id);
    const r = comEspaco(() => {
      if (ant) { ant.texto = texto; ant.img = img; ant.editadoEm = Date.now(); }
      else { DB.respostas.push({ id, duvidaId: did, dono: d.uid, uid: DB.eu, texto, img, em: Date.now(), oculto: false }); avisar(d.uid, eu().nome + ' respondeu à tua dúvida «' + d.titulo.slice(0, 50) + '».', { t: 'duvida', id: did }); }
    });
    if (r.ok) marcar('msg');
    return r;
  }
  function apagarResposta(rid) {
    const r = resposta(rid), d = r && duvida(r.duvidaId); if (!r || (r.uid !== DB.eu && !moderador())) return { erro: 'Só quem respondeu a pode apagar.' };
    return comEspaco(() => { DB.respostas = DB.respostas.filter(x => x !== r); DB.votos = DB.votos.filter(v => v.respostaId !== rid || (nuvem() && v.uid !== DB.eu)); if (d && d.resolvida === rid && d.uid === DB.eu) d.resolvida = ''; });
  }
  function ocultarResposta(rid, oculto) { const r = resposta(rid); if (!r || !moderador()) return { erro: 'Só a moderação pode ocultar.' }; return comEspaco(() => { r.oculto = !!oculto; }); }
  function votar(rid) {
    const r = resposta(rid); if (!r || r.oculto) return { erro: 'Resposta indisponível.' };
    if (r.uid === DB.eu) return { erro: 'Não podes votar na tua resposta.' };
    const fl = travao(); if (fl) return { erro: fl };
    const id = rid + '_' + DB.eu;
    return comEspaco(() => { if (votei(rid)) DB.votos = DB.votos.filter(v => v.id !== id); else DB.votos.push({ id, respostaId: rid, duvidaId: r.duvidaId, autor: r.uid, uid: DB.eu, em: Date.now() }); });
  }
  // Quem perguntou escolhe a resposta que resolveu a dúvida (carregar outra vez tira a escolha).
  function escolherResposta(did, rid) {
    const d = duvida(did), r = resposta(rid); if (!d || d.uid !== DB.eu) return { erro: 'Só quem perguntou escolhe a resposta.' };
    if (!r || r.duvidaId !== did) return { erro: 'Resposta indisponível.' };
    const fl = travao(); if (fl) return { erro: fl };
    const tirar = d.resolvida === rid;
    return comEspaco(() => { d.resolvida = tirar ? '' : rid; if (!tirar) avisar(r.uid, eu().nome + ' escolheu a tua resposta como a que resolveu a dúvida.', { t: 'duvida', id: did }); });
  }
  // Números do perfil: respostas dadas, escolhidas e votos recebidos.
  function numerosDuvidas(uid) {
    const rs = DB.respostas.filter(r => r.uid === uid && !r.oculto && duvida(r.duvidaId));
    return { respostas: rs.length, escolhidas: rs.filter(r => duvida(r.duvidaId).resolvida === r.id).length, votos: DB.votos.filter(v => v.autor === uid && resposta(v.respostaId)).length, duvidas: DB.duvidas.filter(d => d.uid === uid && !d.oculto).length };
  }

  /* ---------- sessões de estudo ---------- */
  const sessao = id => DB.sessoes.find(s => s.id === id) || null;
  const inscritos = sid => DB.inscricoes.filter(i => i.sessaoId === sid && pessoa(i.uid)).sort((a, b) => a.em - b.em);
  const inscrito = (sid, uid = DB.eu) => DB.inscricoes.some(i => i.id === sid + '_' + uid);
  const livres = s => Math.max(0, s.lugares - inscritos(s.id).length);
  const fim = s => s.quando + s.duracao * MIN;
  const aDecorrer = s => !s.cancelada && Date.now() >= s.quando && Date.now() < fim(s);
  const podeVerSessao = s => !!s && (!s.oculto || s.uid === DB.eu || moderador()) && !bloq(s.uid);
  // f: { area, minhas }. As que já acabaram só ficam para quem as marcou ou se inscreveu (até um dia depois).
  function sessoes(f = {}) {
    return DB.sessoes.filter(s => podeVerSessao(s) && pessoa(s.uid) && (!f.area || s.area === f.area)
      && (f.minhas ? (s.uid === DB.eu || inscrito(s.id)) && fim(s) > Date.now() - DIA : !s.cancelada && fim(s) > Date.now()))
      .sort((a, b) => a.quando - b.quando);
  }
  function marcarSessao(x) {
    const v = { titulo: limpa(x.titulo, 100), texto: limpa(x.texto, 800), area: area(x.area), quando: Math.round(+x.quando || 0), duracao: Math.round(+x.duracao || 0), formato: FORMATOS_SESSAO.some(f => f[0] === x.formato) ? x.formato : 'escola', onde: limpa(x.onde, 120), lugares: Math.round(+x.lugares || 0) };
    if (v.titulo.length < 5) return { erro: 'Dá um título à sessão (5 letras ou mais).' };
    if (!v.quando || v.quando < Date.now() + 10 * MIN) return { erro: 'Escolhe o dia e a hora da sessão (pelo menos daqui a 10 minutos).' };
    if (v.quando > Date.now() + 90 * DIA) return { erro: 'Só se marcam sessões para os próximos 90 dias.' };
    if (v.duracao < 15 || v.duracao > 240) return { erro: 'A sessão dura entre 15 minutos e 4 horas.' };
    if (v.lugares < 2 || v.lugares > 30) return { erro: 'Escolhe entre 2 e 30 lugares.' };
    if (v.formato === 'escola' && v.onde.length < 2) return { erro: 'Diz onde é (por exemplo, a sala ou a biblioteca).' };
    if (DB.sessoes.filter(s => s.uid === DB.eu && !s.cancelada && fim(s) > Date.now()).length >= 5) return { erro: 'Já tens 5 sessões marcadas. Espera que alguma aconteça antes de marcares mais.' };
    const fl = filtro(v.titulo, v.texto, v.onde) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const s = Object.assign({ id: novoId('se_'), uid: DB.eu, em: Date.now(), cancelada: false, oculto: false }, v);
    const r = comEspaco(() => DB.sessoes.push(s)); if (r.ok) { marcar('post'); r.id = s.id; }
    return r;
  }
  function editarSessao(id, x) {
    const s = sessao(id); if (!s || s.uid !== DB.eu) return { erro: 'Só quem marcou a sessão a pode mudar.' };
    if (s.cancelada) return { erro: 'A sessão foi cancelada.' };
    const onde = limpa(x.onde, 120), texto = limpa(x.texto, 800);
    if (s.formato === 'escola' && onde.length < 2) return { erro: 'Diz onde é.' };
    const fl = filtro(onde, texto) || travao(); if (fl) return { erro: fl };
    return comEspaco(() => { s.onde = onde; s.texto = texto; });
  }
  function cancelarSessao(id) {
    const s = sessao(id); if (!s || (s.uid !== DB.eu && !moderador())) return { erro: 'Só quem marcou a sessão a pode cancelar.' };
    if (s.cancelada) return { ok: true };
    // quem se inscreveu vê «Cancelada» no Início (um aviso a cada pessoa passaria do limite do servidor)
    return comEspaco(() => { s.cancelada = true; });
  }
  function ocultarSessao(id, oculto) { const s = sessao(id); if (!s || !moderador()) return { erro: 'Só a moderação pode ocultar.' }; return comEspaco(() => { s.oculto = !!oculto; }); }
  function inscrever(sid) {
    const s = sessao(sid); if (!s || s.cancelada || s.oculto) return { erro: 'Sessão indisponível.' };
    if (s.uid === DB.eu) return { erro: 'Marcaste esta sessão: já lá estás.' };
    if (inscrito(sid)) return { ok: true };
    if (s.quando <= Date.now()) return { erro: 'A sessão já começou.' };
    if (!livres(s)) return { erro: 'Já não há lugares. Fala com quem marcou: pode abrir outra sessão.' };
    if (bloq(s.uid) || Loja.bloqueei(s.uid)) return { erro: 'Não te podes inscrever nesta sessão.' };
    const fl = travao(); if (fl) return { erro: fl };
    return comEspaco(() => { DB.inscricoes.push({ id: sid + '_' + DB.eu, sessaoId: sid, dono: s.uid, uid: DB.eu, em: Date.now() }); avisar(s.uid, eu().nome + ' inscreveu-se na sessão «' + s.titulo.slice(0, 50) + '».', { t: 'sessao', id: sid }); });
  }
  function desinscrever(sid, uid = DB.eu) {
    const s = sessao(sid), i = DB.inscricoes.find(x => x.id === sid + '_' + uid);
    if (!i) return { ok: true };
    if (uid !== DB.eu && (!s || s.uid !== DB.eu)) return { erro: 'Só quem marcou a sessão pode tirar alguém.' };
    return comEspaco(() => { DB.inscricoes = DB.inscricoes.filter(x => x !== i); });
  }
  // Lembrete no Início: sessões minhas (marcadas ou inscritas) nas próximas 24 horas, a decorrer, ou canceladas e ainda por acontecer.
  const proximasSessoes = () => sessoes({ minhas: true }).filter(s => fim(s) > Date.now() && (s.cancelada ? s.uid !== DB.eu && s.quando > Date.now() : s.quando - Date.now() < DIA));

  /* ---------- conversas de grupo ---------- */
  // Sala de uma equipa ('eq~<pedido>': quem pediu, quem coordena e a equipa) ou de um grupo da rede ('gr~<grupo>': os membros).
  function membrosSala(sid) {
    const [t, ref] = String(sid).split('~');
    if (t === 'eq') { const p = Loja.pedido(ref); if (!p || p.estado === 'cancelado' || !Object.keys(p.equipa || {}).length) return []; return [...new Set([p.uid, p.freelancerUid, ...Object.keys(p.equipa || {})])].filter(u => u && pessoa(u)); }
    if (t === 'gr') return Loja.grupo(ref) ? Loja.membrosDe(ref).map(m => m.uid) : [];
    return [];
  }
  const naSala = sid => membrosSala(sid).includes(DB.eu);
  function sala(sid) {
    const [t, ref] = String(sid).split('~'), ms = membrosSala(sid);
    if (!ms.includes(DB.eu)) return null;
    if (t === 'eq') { const p = Loja.pedido(ref); return { id: sid, tipo: 'eq', ref, nome: p.titulo, sub: 'Equipa do pedido', membros: ms, area: p.area }; }
    const g = Loja.grupo(ref); return { id: sid, tipo: 'gr', ref, nome: g.nome, sub: 'Grupo', membros: ms, area: g.area };
  }
  function salas() {
    const ids = DB.pedidos.filter(p => p.estado !== 'cancelado' && Object.keys(p.equipa || {}).length && (p.uid === DB.eu || I.naEquipa(p, DB.eu))).map(p => 'eq~' + p.id)
      .concat(DB.membros.filter(m => m.uid === DB.eu && Loja.grupo(m.grupoId)).map(m => 'gr~' + m.grupoId));
    return ids.map(sala).filter(Boolean).sort((a, b) => (ultimaSala(b.id).em || 0) - (ultimaSala(a.id).em || 0));
  }
  const msgsSala = sid => DB.salamsgs.filter(m => m.sala === sid && !bloq(m.uid)).sort((a, b) => a.em - b.em);
  // A última mensagem: na demonstração, das que estão aqui; com conta, a que o servidor deu na última leitura (ou uma mais nova que já chegou).
  function ultimaSala(sid) {
    const l = DB.salamsgs.filter(m => m.sala === sid), u = l.reduce((a, m) => (!a || m.em > a.em ? m : a), null);
    const n = nuvem() && Nuvem.ultimaSala ? Nuvem.ultimaSala(sid) : null;
    return n && (!u || n.em > u.em) ? n : u || {};
  }
  const lidaSala = sid => ((DB.lidas[DB.eu] || {})[sid]) || 0;
  const porLerSala = sid => { const u = ultimaSala(sid); return !!u.em && u.uid !== DB.eu && u.em > lidaSala(sid); };
  const salasPorLer = () => salas().filter(s => porLerSala(s.id)).length;
  function marcarLidaSala(sid) {
    const u = ultimaSala(sid); if (!u.em || lidaSala(sid) >= u.em) return;
    if (!DB.lidas[DB.eu]) DB.lidas[DB.eu] = {}; DB.lidas[DB.eu][sid] = u.em; gravar();
  }
  function enviarSala(sid, texto, img) {
    texto = limpa(texto, 1000); img = imgSegura(img) || '';
    if (!naSala(sid)) return { erro: 'Esta conversa é só para quem está no grupo ou na equipa.' };
    if (!texto && !img) return { erro: 'Escreve uma mensagem.' };
    const fl = filtro(texto) || travao() || ritmo('msg'); if (fl) return { erro: fl };
    // id que ordena pelo tempo (há sempre uma mensagem mais nova com um id maior)
    const m = { id: 'sm' + Date.now().toString(36).padStart(9, '0') + Math.random().toString(36).slice(2, 7), sala: sid, uid: DB.eu, texto, img, em: Date.now() };
    const r = comEspaco(() => DB.salamsgs.push(m)); if (r.ok) { marcar('msg'); marcarLidaSala(sid); }
    return r;
  }
  function apagarMsgSala(id) {
    const m = DB.salamsgs.find(x => x.id === id); if (!m || (m.uid !== DB.eu && !moderador())) return { erro: 'Só quem escreveu a pode apagar.' };
    return comEspaco(() => { DB.salamsgs = DB.salamsgs.filter(x => x !== m); });
  }

  // Ao apagar a conta: sai tudo o que era desta pessoa no estudo.
  function limparEstudo(u) {
    const minhas = new Set(DB.duvidas.filter(d => d.uid === u).map(d => d.id));
    DB.duvidas = DB.duvidas.filter(d => d.uid !== u);
    DB.respostas = DB.respostas.filter(r => r.uid !== u && !minhas.has(r.duvidaId));
    DB.votos = DB.votos.filter(v => v.uid !== u && resposta(v.respostaId));
    const ses = new Set(DB.sessoes.filter(s => s.uid === u).map(s => s.id));
    DB.sessoes = DB.sessoes.filter(s => s.uid !== u);
    DB.inscricoes = DB.inscricoes.filter(i => i.uid !== u && !ses.has(i.sessaoId));
    DB.salamsgs = DB.salamsgs.filter(m => m.uid !== u);
  }

  return {
    duvida, duvidas, podeVerDuvida, resposta, respostasDe, votosDe, votei, perguntarDuvida, editarDuvida, apagarDuvida, ocultarDuvida,
    responderDuvida, apagarResposta, ocultarResposta, votar, escolherResposta, numerosDuvidas, eProfessor: professor,
    sessao, sessoes, inscritos, inscrito, livres, aDecorrer, fimSessao: fim, marcarSessao, editarSessao, cancelarSessao, ocultarSessao, inscrever, desinscrever, proximasSessoes,
    sala, salas, membrosSala, naSala, msgsSala, ultimaSala, porLerSala, salasPorLer, marcarLidaSala, enviarSala, apagarMsgSala, limparEstudo
  };
})());
