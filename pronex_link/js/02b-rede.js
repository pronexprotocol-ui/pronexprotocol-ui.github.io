/* Pronex_Link · 02b-rede.js
   A rede (0.13): publicações com reações, comentários e partilhas; ligações entre pessoas; perfil profissional
   (cabeçalho, formação, competências validadas, recomendações escritas, quem viu o perfil, destaques);
   grupos; vagas com candidaturas; mensagens diretas entre pessoas ligadas.
   Acrescenta-se à Loja: cada documento pertence a uma pessoa (uma reação, uma ligação, um membro de um grupo),
   para que duas pessoas a mexer ao mesmo tempo nunca escrevam no mesmo documento. */
'use strict';
Object.assign(Loja, (function () {
  const I = Loja._i, { comEspaco, avisar, novoId, limpa, filtro, ritmo, marcar, eLink, bloqueadoPorSuspensao } = I;
  const DIA = 86400000;
  const eu = () => Loja.eu(), pessoa = u => Loja.pessoa(u), bloq = u => Loja.bloqueado(u);
  const nuvem = () => typeof Nuvem !== 'undefined' && Nuvem.ativa();
  const moderador = () => nuvem() ? (Nuvem.admin() || Nuvem.moderador()) : true;
  const parId = (a, b) => (a < b ? a + '_' + b : b + '_' + a);
  const travao = () => bloqueadoPorSuspensao();

  /* ---------- ligações ---------- */
  const ligacao = uid => DB.ligacoes.find(l => l.id === parId(DB.eu, uid)) || null;
  function estadoLigacao(uid) {
    if (!uid || uid === DB.eu) return 'eu';
    const l = ligacao(uid); if (!l) return 'nenhuma';
    return l.estado === 'aceite' ? 'ligado' : l.de === DB.eu ? 'enviada' : 'recebida';
  }
  const ligados = (uid = DB.eu) => DB.ligacoes.filter(l => l.estado === 'aceite' && l.uids.includes(uid)).map(l => l.uids.find(u => u !== uid)).filter(u => pessoa(u) && !bloq(u));
  const convitesLigacao = () => DB.ligacoes.filter(l => l.estado === 'pendente' && l.para === DB.eu && pessoa(l.de) && !bloq(l.de)).sort((a, b) => b.em - a.em);
  const enviadas = () => DB.ligacoes.filter(l => l.estado === 'pendente' && l.de === DB.eu);
  function pedirLigacao(uid, nota) {
    const o = pessoa(uid); nota = limpa(nota, 200);
    if (!o || uid === DB.eu) return { erro: 'Pessoa indisponível.' };
    if (bloq(uid)) return { erro: 'Não é possível ligares-te a esta pessoa.' };
    if (ligacao(uid)) return { erro: estadoLigacao(uid) === 'ligado' ? 'Já estão ligados.' : 'Já há um pedido de ligação entre vocês.' };
    if (enviadas().length >= 30) return { erro: 'Tens 30 pedidos de ligação à espera. Espera que te respondam antes de enviares mais.' };
    const fl = filtro(nota) || travao(); if (fl) return { erro: fl };
    const id = parId(DB.eu, uid);
    return comEspaco(() => { DB.ligacoes.push({ id, uids: [DB.eu, uid].sort(), de: DB.eu, para: uid, estado: 'pendente', nota, em: Date.now() }); avisar(uid, eu().nome + ' quer ligar-se a ti' + (nota ? ': «' + nota.slice(0, 60) + '»' : '.'), { t: 'ligacao', id }); });
  }
  function aceitarLigacao(uid) {
    const l = ligacao(uid); if (!l || l.estado !== 'pendente' || l.para !== DB.eu) return { erro: 'Pedido de ligação indisponível.' };
    return comEspaco(() => { l.estado = 'aceite'; l.aceiteEm = Date.now(); avisar(uid, eu().nome + ' aceitou a ligação. Já podem trocar mensagens.', { t: 'ligacao', id: l.id }); });
  }
  function tirarLigacao(uid) {
    const l = ligacao(uid); if (!l) return { erro: 'Não há ligação.' };
    return comEspaco(() => {
      DB.ligacoes = DB.ligacoes.filter(x => x !== l);
      // as validações e recomendações que dei a esta pessoa ficam; a conversa direta fecha-se sozinha
    });
  }
  // Pessoas que talvez conheças: mesma escola, mesmo curso, áreas em comum, trabalhos juntos, ligações em comum.
  function talvezConhecas(n = 6) {
    const me = eu(); if (!me) return [];
    const minhas = new Set(ligados()), comigo = new Set(DB.pedidos.filter(p => p.estado === 'concluido' && (p.uid === DB.eu || I.naEquipa(p, DB.eu))).flatMap(p => [p.uid, p.freelancerUid, ...Object.keys(p.equipa || {})]));
    const norm = s => String(s || '').trim().toLowerCase();
    return Loja.pessoasVisiveis().filter(p => p.uid !== DB.eu && estadoLigacao(p.uid) === 'nenhuma').map(p => {
      let s = 0; const razoes = [];
      if (comigo.has(p.uid)) { s += 5; razoes.push('Trabalharam juntos'); }
      const comuns = ligados(p.uid).filter(u => minhas.has(u)).length; if (comuns) { s += 2 * comuns; razoes.push(comuns === 1 ? '1 ligação em comum' : comuns + ' ligações em comum'); }
      if (me.escola && norm(me.escola) === norm(p.escola)) { s += 2; if (!razoes.length) razoes.push('Da tua escola'); }
      if (me.curso && cursoVisivel(p) && norm(me.curso) === norm(p.curso)) { s += 2; razoes.push('Do teu curso'); }
      const areas = (p.areas || []).filter(a => (me.areas || []).includes(a)).length; if (areas) { s += areas; if (razoes.length < 2) razoes.push(areas === 1 ? '1 área em comum' : areas + ' áreas em comum'); }
      if (((DB.seguidos || {})[DB.eu] || []).includes(p.uid)) s += 1;
      return { p, s, razao: razoes[0] || rotuloTipo(p) };
    }).filter(x => x.s > 0 || n > 6).sort((a, b) => b.s - a.s || a.p.nome.localeCompare(b.p.nome, 'pt')).slice(0, n);
  }

  /* ---------- publicações ---------- */
  const post = id => DB.posts.find(p => p.id === id) || null;
  const podeVerPost = p => !!p && (!p.oculto || p.uid === DB.eu || moderador()) && !bloq(p.uid) && pessoa(p.uid);
  const membro = (gid, uid = DB.eu) => DB.membros.some(m => m.grupoId === gid && m.uid === uid);
  // Feed: as publicações de toda a gente e dos grupos onde estou; primeiro as das minhas ligações e de quem sigo.
  function feed(gid) {
    const perto = new Set(ligados().concat((DB.seguidos || {})[DB.eu] || [], [DB.eu]));
    const l = DB.posts.filter(p => podeVerPost(p) && (gid ? p.grupoId === gid : (!p.grupoId || membro(p.grupoId))));
    const agora = Date.now();
    return l.map(p => ({ p, s: p.em + (perto.has(p.uid) ? 0.5 * DIA : 0) + Math.min(5, reacoesDe(p.id).total + comentariosDe(p.id).length) * 3600000 }))
      .sort((a, b) => (gid ? b.p.em - a.p.em : b.s - a.s)).map(x => x.p).filter(p => gid || agora - p.em < 120 * DIA);
  }
  const postsDe = uid => DB.posts.filter(p => p.uid === uid && podeVerPost(p)).sort((a, b) => b.em - a.em);
  function publicarPost(d) {
    const texto = limpa(d.texto, 1500), img = d.img || '', video = limpa(d.video, 300).replace(/^https?:\/\/[^/?#]+/i, m => m.toLowerCase()), gid = d.grupoId || '', part = d.partilhaDe || '';
    if (!eu()) return { erro: 'Sem perfil.' };
    if (!texto && !img && !part) return { erro: video ? 'Junta uma frase ao vídeo: diz o que é.' : 'Escreve alguma coisa ou junta uma imagem.' };
    if (video && !VIDEO_OK.test(video)) return { erro: 'O vídeo tem de ser uma ligação do YouTube, Vimeo ou Google Drive.' };
    if (gid && !membro(gid)) return { erro: 'Entra no grupo para publicares lá.' };
    if (part) { const o = post(part); if (!podeVerPost(o) || o.oculto) return { erro: 'Esta publicação já não está disponível.' }; if (o.partilhaDe) return { erro: 'Partilha a publicação original.' }; }
    if (DB.posts.filter(p => p.uid === DB.eu && Date.now() - p.em < DIA).length >= 20) return { erro: 'Já publicaste 20 vezes hoje. Volta amanhã.' };
    const fl = filtro(texto) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const p = { id: novoId('ps_'), uid: DB.eu, texto, img, video, grupoId: gid, partilhaDe: part, em: Date.now(), oculto: false };
    const r = comEspaco(() => { DB.posts.push(p); if (part) { const o = post(part); avisar(o.uid, eu().nome + ' partilhou a tua publicação.', { t: 'post', id: p.id }); } });
    if (r.ok) { marcar('post'); r.id = p.id; }
    return r;
  }
  function editarPost(id, texto) {
    const p = post(id); texto = limpa(texto, 1500);
    if (!p || p.uid !== DB.eu) return { erro: 'Só quem publicou pode editar.' };
    if (!texto && !p.img && !p.partilhaDe) return { erro: 'Escreve alguma coisa.' };
    const fl = filtro(texto) || travao(); if (fl) return { erro: fl };
    return comEspaco(() => { p.texto = texto; p.editadoEm = Date.now(); });
  }
  function apagarPost(id) {
    const p = post(id); if (!p || (p.uid !== DB.eu && !moderador())) return { erro: 'Só quem publicou pode apagar.' };
    return comEspaco(() => {
      DB.posts = DB.posts.filter(x => x !== p);
      // os meus comentários e reações nesta publicação saem com ela; os dos outros, a limpeza diária apaga
      DB.comentarios = DB.comentarios.filter(c => !(c.postId === id && (c.uid === DB.eu || !nuvem())));
      DB.reacoes = DB.reacoes.filter(r => !(r.postId === id && (r.uid === DB.eu || !nuvem())));
      Object.values(DB.pessoas).forEach(q => { if (q.uid === DB.eu && q.destaques) q.destaques = q.destaques.filter(x => !(x.t === 'post' && x.id === id)); });
    });
  }
  function ocultarPost(id, oculto) {
    const p = post(id); if (!p || !moderador()) return { erro: 'Só a moderação pode ocultar.' };
    return comEspaco(() => { p.oculto = !!oculto; });
  }
  function reacoesDe(id) {
    const l = DB.reacoes.filter(r => r.postId === id && pessoa(r.uid) && !bloq(r.uid)), por = {};
    l.forEach(r => { por[r.tipo] = (por[r.tipo] || 0) + 1; });
    const minha = l.find(r => r.uid === DB.eu);
    return { total: l.length, por, minha: minha ? minha.tipo : '', quem: l.map(r => r.uid) };
  }
  function reagir(id, tipo) {
    const p = post(id); if (!podeVerPost(p)) return { erro: 'Publicação indisponível.' };
    if (!REACOES.some(r => r[0] === tipo)) tipo = 'gosto';
    const fl = travao(); if (fl) return { erro: fl };
    const rid = id + '_' + DB.eu, r = DB.reacoes.find(x => x.id === rid);
    return comEspaco(() => {
      if (r && r.tipo === tipo) DB.reacoes = DB.reacoes.filter(x => x !== r);
      else if (r) { r.tipo = tipo; r.em = Date.now(); }
      else DB.reacoes.push({ id: rid, postId: id, dono: p.uid, uid: DB.eu, tipo, em: Date.now() });
    });
  }
  const comentariosDe = id => DB.comentarios.filter(c => c.postId === id && pessoa(c.uid) && !bloq(c.uid)).sort((a, b) => a.em - b.em);
  function comentar(id, texto, resp) {
    const p = post(id); texto = limpa(texto, 500);
    if (!podeVerPost(p) || p.oculto) return { erro: 'Publicação indisponível.' };
    if (!texto) return { erro: 'Escreve o comentário.' };
    const fl = filtro(texto) || travao() || ritmo('msg'); if (fl) return { erro: fl };
    const c = { id: novoId('cm_'), postId: id, dono: p.uid, uid: DB.eu, texto, em: Date.now() };
    if (resp && DB.comentarios.some(x => x.id === resp && x.postId === id)) c.resp = resp;
    const r = comEspaco(() => { DB.comentarios.push(c); avisar(p.uid, eu().nome + ' comentou a tua publicação: «' + texto.slice(0, 60) + '»', { t: 'post', id }); });
    if (r.ok) marcar('msg');
    return r;
  }
  function apagarComentario(cid) {
    const c = DB.comentarios.find(x => x.id === cid);
    if (!c || (c.uid !== DB.eu && c.dono !== DB.eu && !moderador())) return { erro: 'Não podes apagar este comentário.' };
    return comEspaco(() => { DB.comentarios = DB.comentarios.filter(x => x !== c); });
  }

  /* ---------- perfil profissional ---------- */
  function editarCabecalho(d) {
    const p = eu(); if (!p) return { erro: 'Sem perfil.' };
    const destaque = limpa(d.destaque, 120), aberto = (d.aberto || []).filter(x => ABERTO_A.some(a => a[0] === x));
    const fl = filtro(destaque) || travao(); if (fl) return { erro: fl };
    return comEspaco(() => { p.destaque = destaque; p.aberto = aberto; if (d.capa !== undefined) p.capa = d.capa || ''; });
  }
  function guardarFormacao(f) {
    const p = eu(); if (!p) return { erro: 'Sem perfil.' };
    const x = { id: f.id || novoId('f'), escola: limpa(f.escola, 80), curso: limpa(f.curso, 80), de: limpa(f.de, 4), ate: limpa(f.ate, 4) };
    if (x.escola.length < 2) return { erro: 'Escreve o nome da escola.' };
    if ((x.de && !/^\d{4}$/.test(x.de)) || (x.ate && !/^\d{4}$/.test(x.ate))) return { erro: 'Os anos escrevem-se com 4 algarismos (ex.: 2025).' };
    if (x.de && x.ate && x.ate < x.de) return { erro: 'O ano de fim vem depois do de início.' };
    const l = (p.formacao || []).filter(y => y.id !== x.id); if (l.length >= 5) return { erro: 'Põe no máximo 5 formações.' };
    const fl = filtro(x.escola, x.curso); if (fl) return { erro: fl };
    return comEspaco(() => { p.formacao = l.concat(x).sort((a, b) => (b.de || '').localeCompare(a.de || '')); });
  }
  const tirarFormacao = id => { const p = eu(); return comEspaco(() => { p.formacao = (p.formacao || []).filter(y => y.id !== id); }); };
  function destacar(t, id) {
    const p = eu(); if (!p) return { erro: 'Sem perfil.' };
    const l = p.destaques || [], tem = l.some(x => x.t === t && x.id === id);
    if (!tem && l.length >= 3) return { erro: 'Podes destacar no máximo 3 coisas. Tira uma primeiro.' };
    if (!tem && t === 'post' && (!post(id) || post(id).uid !== DB.eu)) return { erro: 'Só podes destacar publicações tuas.' };
    if (!tem && t === 'pedido' && !Loja.linhaTempo(DB.eu).some(x => x.p.id === id)) return { erro: 'Só podes destacar trabalhos concluídos.' };
    return comEspaco(() => { p.destaques = tem ? l.filter(x => !(x.t === t && x.id === id)) : l.concat({ t, id }); });
  }
  // Competências validadas por ligações (uma pessoa valida cada área uma vez).
  function validacoesDe(uid) { const r = {}; DB.validacoes.filter(v => v.alvo === uid && pessoa(v.uid) && !bloq(v.uid)).forEach(v => { (r[v.area] = r[v.area] || []).push(v.uid); }); return r; }
  function validar(uid, area) {
    const o = pessoa(uid); if (!o || uid === DB.eu) return { erro: 'Pessoa indisponível.' };
    if (estadoLigacao(uid) !== 'ligado') return { erro: 'Só podes validar competências de quem está ligado a ti.' };
    if (!(o.areas || []).includes(area)) return { erro: 'Esta pessoa não tem esta área no perfil.' };
    const fl = travao(); if (fl) return { erro: fl };
    const id = uid + '_' + DB.eu + '_' + area, v = DB.validacoes.find(x => x.id === id);
    return comEspaco(() => { if (v) DB.validacoes = DB.validacoes.filter(x => x !== v); else { DB.validacoes.push({ id, alvo: uid, uid: DB.eu, area, em: Date.now() }); avisar(uid, eu().nome + ' validou a tua competência em ' + AREA(area).nome + '.', { t: 'ligacao', id: parId(DB.eu, uid) }); } });
  }
  // Recomendações escritas: só de ligações; quem é recomendado escolhe se aparecem no perfil.
  const testemunhosDe = uid => DB.testemunhos.filter(t => t.alvo === uid && pessoa(t.uid) && !bloq(t.uid) && (t.visivel || uid === DB.eu)).sort((a, b) => b.em - a.em);
  function escreverTestemunho(uid, texto, relacao) {
    texto = limpa(texto, 600);
    if (estadoLigacao(uid) !== 'ligado') return { erro: 'Só podes recomendar quem está ligado a ti.' };
    if (texto.length < 20) return { erro: 'Escreve pelo menos uma frase completa (20 letras).' };
    if (!RELACOES.some(r => r[0] === relacao)) return { erro: 'Escolhe como se conhecem.' };
    const fl = filtro(texto) || travao(); if (fl) return { erro: fl };
    const id = uid + '_' + DB.eu, ant = DB.testemunhos.find(t => t.id === id);
    return comEspaco(() => { DB.testemunhos = DB.testemunhos.filter(t => t !== ant); DB.testemunhos.push({ id, alvo: uid, uid: DB.eu, relacao, texto, em: Date.now(), visivel: false }); avisar(uid, eu().nome + ' escreveu-te uma recomendação. Escolhe se aparece no teu perfil.', { t: 'ligacao', id: parId(DB.eu, uid) }); });
  }
  function mostrarTestemunho(id, sim) {
    const t = DB.testemunhos.find(x => x.id === id); if (!t || t.alvo !== DB.eu) return { erro: 'Recomendação indisponível.' };
    return comEspaco(() => { t.visivel = !!sim; });
  }
  function apagarTestemunho(id) {
    const t = DB.testemunhos.find(x => x.id === id); if (!t || (t.uid !== DB.eu && t.alvo !== DB.eu)) return { erro: 'Recomendação indisponível.' };
    return comEspaco(() => { DB.testemunhos = DB.testemunhos.filter(x => x !== t); });
  }
  // Quem viu o perfil: uma visita por pessoa (a mais recente). Quem navega em modo privado não deixa rasto.
  const visitaPrivada = () => { try { return localStorage.getItem('pl-visita-privada') === '1'; } catch (e) { return false; } };
  const ultimaVisita = {};
  function registarVisita(uid) {
    if (!uid || uid === DB.eu || !pessoa(uid) || visitaPrivada() || !eu()) return;
    if (Date.now() - (ultimaVisita[uid] || 0) < 3600000) return; ultimaVisita[uid] = Date.now();
    const id = uid + '_' + DB.eu, v = DB.visitas.find(x => x.id === id);
    if (v && Date.now() - v.em < 3600000) return;
    comEspaco(() => { if (v) v.em = Date.now(); else DB.visitas.push({ id, alvo: uid, uid: DB.eu, em: Date.now() }); });
  }
  const visitas = () => DB.visitas.filter(v => v.alvo === DB.eu && Date.now() - v.em < 90 * DIA && pessoa(v.uid) && !bloq(v.uid)).sort((a, b) => b.em - a.em);

  /* ---------- grupos ---------- */
  const grupo = id => DB.grupos.find(g => g.id === id) || null;
  const membrosDe = id => DB.membros.filter(m => m.grupoId === id && pessoa(m.uid));
  const grupos = () => DB.grupos.slice().sort((a, b) => membro(b.id) - membro(a.id) || membrosDe(b.id).length - membrosDe(a.id).length || b.em - a.em);
  function criarGrupo(d) {
    const nome = limpa(d.nome, 60), descricao = limpa(d.descricao, 300), tipo = TIPOS_GRUPO.some(t => t[0] === d.tipo) ? d.tipo : 'interesse', area = AREAS.some(a => a.id === d.area) ? d.area : '';
    if (nome.length < 3) return { erro: 'Dá um nome ao grupo (3 letras ou mais).' };
    if (DB.grupos.some(g => g.nome.toLowerCase() === nome.toLowerCase())) return { erro: 'Já existe um grupo com este nome. Entra nele.' };
    if (DB.grupos.filter(g => g.uid === DB.eu).length >= 5) return { erro: 'Já criaste 5 grupos.' };
    const fl = filtro(nome, descricao) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const g = { id: novoId('gr_'), nome, descricao, tipo, area, uid: DB.eu, em: Date.now() };
    const r = comEspaco(() => { DB.grupos.push(g); DB.membros.push({ id: g.id + '_' + DB.eu, grupoId: g.id, uid: DB.eu, em: Date.now() }); });
    if (r.ok) { marcar('post'); r.id = g.id; }
    return r;
  }
  function entrarGrupo(id) {
    if (!grupo(id)) return { erro: 'Grupo indisponível.' }; if (membro(id)) return { ok: true };
    const fl = travao(); if (fl) return { erro: fl };
    return comEspaco(() => { DB.membros.push({ id: id + '_' + DB.eu, grupoId: id, uid: DB.eu, em: Date.now() }); });
  }
  function sairGrupo(id) {
    const g = grupo(id); if (!g) return { erro: 'Grupo indisponível.' };
    if (g.uid === DB.eu && membrosDe(id).length > 1) return { erro: 'Criaste este grupo: enquanto houver mais pessoas, não podes sair (podes apagá-lo).' };
    return comEspaco(() => { DB.membros = DB.membros.filter(m => !(m.grupoId === id && m.uid === DB.eu)); if (g.uid === DB.eu) DB.grupos = DB.grupos.filter(x => x !== g); });
  }
  function apagarGrupo(id) {
    const g = grupo(id); if (!g || (g.uid !== DB.eu && !moderador())) return { erro: 'Só quem criou o grupo o pode apagar.' };
    return comEspaco(() => { DB.grupos = DB.grupos.filter(x => x !== g); DB.membros = DB.membros.filter(m => !(m.grupoId === id && (m.uid === DB.eu || !nuvem()))); DB.posts = DB.posts.filter(p => !(p.grupoId === id && (p.uid === DB.eu || !nuvem()))); });
  }

  /* ---------- vagas e candidaturas ---------- */
  const vaga = id => DB.vagas.find(v => v.id === id) || null;
  const podeVagas = () => nuvem() ? (Nuvem.admin() || Nuvem.professor()) : !!eu() && eu().tipo === 'professor';
  const vagaAberta = v => !!v && !v.fechada && !v.oculto && (!v.ate || v.ate >= hojeISO());
  const vagas = (f = {}) => DB.vagas.filter(v => (vagaAberta(v) || v.uid === DB.eu) && !bloq(v.uid) && (!f.tipo || v.tipo === f.tipo) && (!f.area || v.area === f.area)).sort((a, b) => b.em - a.em);
  function publicarVaga(d) {
    if (!podeVagas()) return { erro: 'Só professores e a administração publicam vagas.' };
    const v = { titulo: limpa(d.titulo, 100), entidade: limpa(d.entidade, 80), tipo: TIPOS_VAGA.some(t => t[0] === d.tipo) ? d.tipo : 'projeto', area: AREAS.some(a => a.id === d.area) ? d.area : 'outra', local: limpa(d.local, 60), texto: limpa(d.texto, 1500), ate: d.ate || '', link: limpa(d.link, 300) };
    if (v.titulo.length < 5) return { erro: 'Escreve um título com pelo menos 5 letras.' };
    if (v.entidade.length < 2) return { erro: 'Diz quem oferece (empresa, escola, associação).' };
    if (v.texto.length < 20) return { erro: 'Explica a vaga em pelo menos uma frase (20 letras).' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.ate) || v.ate < hojeISO()) return { erro: 'Escolhe a data-limite das candidaturas (hoje ou depois).' };
    if (v.link && !eLink(v.link)) return { erro: 'A ligação tem de começar por https://' };
    const fl = filtro(v.titulo, v.entidade, v.texto, v.local) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const x = Object.assign({ id: novoId('vg_'), uid: DB.eu, em: Date.now(), oculto: false, fechada: false }, v);
    const r = comEspaco(() => DB.vagas.push(x)); if (r.ok) { marcar('post'); r.id = x.id; }
    return r;
  }
  function fecharVaga(id) { const v = vaga(id); if (!v || (v.uid !== DB.eu && !moderador())) return { erro: 'Só quem publicou pode fechar.' }; return comEspaco(() => { v.fechada = true; }); }
  const candidatura = (vid, uid = DB.eu) => DB.candidaturas.find(c => c.id === vid + '_' + uid) || null;
  const candidaturasDe = vid => DB.candidaturas.filter(c => c.vagaId === vid && pessoa(c.uid)).sort((a, b) => a.em - b.em);
  const minhasCandidaturas = () => DB.candidaturas.filter(c => c.uid === DB.eu).sort((a, b) => b.em - a.em);
  function candidatar(vid, texto) {
    const v = vaga(vid); texto = limpa(texto, 800);
    if (!vagaAberta(v)) return { erro: 'Esta vaga já não aceita candidaturas.' };
    if (v.uid === DB.eu) return { erro: 'Não te podes candidatar à tua vaga.' };
    if (candidatura(vid)) return { erro: 'Já te candidataste.' };
    if (texto.length < 20) return { erro: 'Diz em pelo menos uma frase porque és a pessoa certa (20 letras).' };
    const fl = filtro(texto) || travao() || ritmo('post'); if (fl) return { erro: fl };
    const r = comEspaco(() => { DB.candidaturas.push({ id: vid + '_' + DB.eu, vagaId: vid, dono: v.uid, uid: DB.eu, texto, em: Date.now(), estado: 'enviada' }); avisar(v.uid, eu().nome + ' candidatou-se a «' + v.titulo.slice(0, 50) + '».', { t: 'vaga', id: vid }); });
    if (r.ok) marcar('post');
    return r;
  }
  function responderCandidatura(cid, estado) {
    const c = DB.candidaturas.find(x => x.id === cid), v = c && vaga(c.vagaId);
    if (!c || !v || v.uid !== DB.eu) return { erro: 'Candidatura indisponível.' };
    if (!['vista', 'aceite', 'recusada'].includes(estado)) return { erro: 'Estado inválido.' };
    const txt = { vista: 'viu a tua candidatura a', aceite: 'aceitou a tua candidatura a', recusada: 'não seguiu com a tua candidatura a' }[estado];
    return comEspaco(() => { c.estado = estado; if (estado !== 'vista') avisar(c.uid, eu().nome + ' ' + txt + ' «' + v.titulo.slice(0, 50) + '».', { t: 'vaga', id: v.id }); });
  }
  function retirarCandidatura(vid) { const c = candidatura(vid); if (!c) return { erro: 'Não há candidatura.' }; return comEspaco(() => { DB.candidaturas = DB.candidaturas.filter(x => x !== c); }); }

  /* ---------- mensagens diretas ---------- */
  function conversaDireta(uid) {
    if (estadoLigacao(uid) !== 'ligado') return { erro: 'Para trocarem mensagens, liguem-se primeiro.' };
    const u = [DB.eu, uid].sort(), id = 'cv_dm_' + u[0] + '_' + u[1];
    if (Loja.conversa(id)) return { ok: true, id };
    const r = comEspaco(() => DB.conversas.push({ id, pedidoId: '', uids: u, msgs: [] }));
    if (r.ok) r.id = id;
    return r;
  }

  // Ao apagar a conta: sai tudo o que era desta pessoa na rede.
  function limparRede(u) {
    DB.posts = DB.posts.filter(p => p.uid !== u); const ids = new Set(DB.posts.map(p => p.id));
    DB.comentarios = DB.comentarios.filter(c => c.uid !== u && ids.has(c.postId));
    DB.reacoes = DB.reacoes.filter(r => r.uid !== u && ids.has(r.postId));
    DB.ligacoes = DB.ligacoes.filter(l => !l.uids.includes(u));
    DB.validacoes = DB.validacoes.filter(v => v.uid !== u && v.alvo !== u);
    DB.testemunhos = DB.testemunhos.filter(t => t.uid !== u && t.alvo !== u);
    DB.visitas = DB.visitas.filter(v => v.uid !== u && v.alvo !== u);
    DB.membros = DB.membros.filter(m => m.uid !== u);
    DB.grupos = DB.grupos.filter(g => g.uid !== u || DB.membros.some(m => m.grupoId === g.id));
    DB.candidaturas = DB.candidaturas.filter(c => c.uid !== u);
    DB.vagas = DB.vagas.filter(v => v.uid !== u);
  }

  return {
    estadoLigacao, ligacao, ligados, convitesLigacao, enviadas, pedirLigacao, aceitarLigacao, tirarLigacao, talvezConhecas,
    post, podeVerPost, feed, postsDe, publicarPost, editarPost, apagarPost, ocultarPost, reacoesDe, reagir, comentariosDe, comentar, apagarComentario,
    editarCabecalho, guardarFormacao, tirarFormacao, destacar, validacoesDe, validar, testemunhosDe, escreverTestemunho, mostrarTestemunho, apagarTestemunho,
    registarVisita, visitas, visitaPrivada,
    grupo, grupos, membro, membrosDe, criarGrupo, entrarGrupo, sairGrupo, apagarGrupo,
    vaga, vagas, vagaAberta, podeVagas, publicarVaga, fecharVaga, candidatura, candidaturasDe, minhasCandidaturas, candidatar, responderCandidatura, retirarCandidatura,
    conversaDireta, limparRede
  };
})());
