/* Pronex_Link · 14-ecra-rede.js
   Ecrãs e ações da rede (0.13): publicações no Início, a Rede (freelancers, ligações, grupos), um grupo,
   uma publicação aberta, as vagas (no separador Pedidos) e uma vaga aberta. */
'use strict';
const COMENTARIOS_ABERTOS = new Set();
const SEG_REDE = [['pessoas', 'Freelancers'], ['ligacoes', 'Ligações'], ['grupos', 'Grupos']];

/* ---------- peças ---------- */
function nomeCurto(p) { return p ? p.nome : 'Conta apagada'; }
function subtituloPessoa(p) { return p ? (p.destaque || rotuloTipo(p)) : ''; }
function videoCartao(url) {
  const host = /vimeo/.test(url) ? 'Vimeo' : /drive\.google/.test(url) ? 'Google Drive' : 'YouTube';
  return '<a class="video-c" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer nofollow ugc">' + ico('video') + '<span><b>Ver o vídeo</b><span class="muted sm">Abre no ' + host + '</span></span></a>';
}
function textoPost(t, id) {
  if (!t) return '';
  const longo = t.length > 280 || (t.match(/\n/g) || []).length > 4;
  return '<p class="post-t' + (longo ? ' corta' : '') + '" id="pt-' + esc(id) + '">' + ligacoes(esc(t)) + '</p>' + (longo ? '<button class="ligacao sm" data-a="post-mais" data-id="' + esc(id) + '">ver mais</button>' : '');
}
function cabecaPost(p, q) {
  const g = p.grupoId && Loja.grupo(p.grupoId);
  return '<div class="post-h">' + '<button class="pu" data-a="ver-pessoa" data-uid="' + esc(p.uid) + '" aria-label="Ver o perfil de ' + esc(nomeCurto(q)) + '">' + avatar(q) + '</button>'
    + '<div class="post-q"><button class="ligacao" data-a="ver-pessoa" data-uid="' + esc(p.uid) + '"><b>' + esc(nomeCurto(q)) + '</b></button>'
    + (q && q.uid !== DB.eu && Loja.estadoLigacao(q.uid) === 'ligado' ? '<span class="muted sm"> · ligação</span>' : '')
    + '<span class="muted sm sub1">' + esc(subtituloPessoa(q)) + '</span>'
    + '<span class="muted sm">' + quando(p.em) + (p.editadoEm ? ' · editado' : '') + (g ? ' · em <button class="ligacao sm" data-a="ver-grupo" data-id="' + esc(g.id) + '">' + esc(g.nome) + '</button>' : '') + (p.oculto ? ' · <b class="bad">ocultado pela moderação</b>' : '') + '</span></div>'
    + '<button class="mais" data-a="post-menu" data-id="' + esc(p.id) + '" aria-label="Mais opções da publicação">' + ico('mais3') + '</button></div>';
}
function cartaoPost(p, abrirComentarios) {
  const q = Loja.pessoa(p.uid), orig = p.partilhaDe ? Loja.post(p.partilhaDe) : null, r = Loja.reacoesDe(p.id), cs = Loja.comentariosDe(p.id);
  const aberto = abrirComentarios || COMENTARIOS_ABERTOS.has(p.id), minha = r.minha ? REACAO(r.minha) : null;
  const topo = Object.entries(r.por).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => '<span aria-hidden="true">' + REACAO(x[0])[2] + '</span>').join('');
  let h = '<article class="card post" id="post-' + esc(p.id) + '" aria-label="Publicação de ' + esc(nomeCurto(q)) + '">' + cabecaPost(p, q) + textoPost(p.texto, p.id)
    + (imgSegura(p.img) ? '<img loading="lazy" decoding="async" class="zoom post-img" tabindex="0" src="' + imgSegura(p.img) + '" alt="Imagem da publicação">' : '')
    + (p.video ? videoCartao(p.video) : '');
  if (p.partilhaDe) h += orig && Loja.podeVerPost(orig) ? '<div class="post-orig">' + cabecaPost(orig, Loja.pessoa(orig.uid)).replace('class="mais"', 'class="mais" hidden') + textoPost(orig.texto, orig.id + '-o') + (imgSegura(orig.img) ? '<img loading="lazy" decoding="async" class="zoom post-img" tabindex="0" src="' + imgSegura(orig.img) + '" alt="Imagem da publicação partilhada">' : '') + (orig.video ? videoCartao(orig.video) : '') + '<button class="ligacao sm" data-a="ver-post" data-id="' + esc(orig.id) + '">Abrir a publicação original</button></div>' : '<div class="post-orig muted">A publicação partilhada já não está disponível.</div>';
  h += '<div class="post-n">' + (r.total ? '<button class="ligacao sm" data-a="ver-reacoes" data-id="' + esc(p.id) + '">' + topo + ' ' + r.total + '</button>' : '<span></span>')
    + (cs.length ? '<button class="ligacao sm" data-a="abrir-comentarios" data-id="' + esc(p.id) + '">' + cs.length + (cs.length === 1 ? ' comentário' : ' comentários') + '</button>' : '') + '</div>';
  if (!p.oculto) h += '<div class="post-a" role="group" aria-label="Ações da publicação">'
    + '<button data-a="reagir" data-id="' + esc(p.id) + '" data-r="' + (minha ? minha[0] : 'gosto') + '" aria-pressed="' + !!minha + '">' + (minha ? '<span aria-hidden="true">' + minha[2] + '</span>' + minha[1] : ico('gosto') + 'Gosto') + '</button>'
    + '<button class="post-r" data-a="escolher-reacao" data-id="' + esc(p.id) + '" aria-label="Escolher outra reação">' + ico('mais') + '</button>'
    + '<button data-a="abrir-comentarios" data-id="' + esc(p.id) + '" aria-expanded="' + aberto + '">' + ico('conversas') + 'Comentar</button>'
    + (!p.grupoId ? '<button data-a="partilhar-post" data-id="' + esc(p.partilhaDe || p.id) + '">' + ico('repetir') + 'Partilhar</button>' : '')
    + '<button data-a="enviar-post" data-id="' + esc(p.id) + '">' + ico('partilhar') + 'Enviar</button></div>';
  if (aberto) h += '<div class="coms">' + cs.map(c => { const a = Loja.pessoa(c.uid), resp = c.resp && cs.find(x => x.id === c.resp); return '<div class="com">' + '<button class="pu" data-a="ver-pessoa" data-uid="' + esc(c.uid) + '" aria-label="Ver o perfil de ' + esc(nomeCurto(a)) + '">' + avatar(a, 'p') + '</button><div class="com-c"><div class="who"><b>' + esc(nomeCurto(a)) + '</b><span>' + quando(c.em) + '</span></div>' + (resp ? '<span class="muted sm">em resposta a ' + esc(nomeCurto(Loja.pessoa(resp.uid))) + '</span>' : '') + '<p>' + ligacoes(esc(c.texto)) + '</p><div class="com-a"><button class="ligacao sm" data-a="responder-com" data-id="' + esc(p.id) + '" data-c="' + esc(c.id) + '" data-n="' + esc(nomeCurto(a)) + '">Responder</button>' + (c.uid === DB.eu || p.uid === DB.eu || Loja.eAdmin() ? '<button class="ligacao sm" data-a="apagar-com" data-c="' + esc(c.id) + '">Apagar</button>' : '<button class="ligacao sm" data-a="denunciar" data-tipo="comentario" data-id="' + esc(c.id) + '">Denunciar</button>') + '</div></div></div>'; }).join('')
    + (!p.oculto ? '<form class="linhaf com-f" id="f-com" data-id="' + esc(p.id) + '">' + avatar(Loja.eu(), 'p') + '<label class="sr" for="com-' + esc(p.id) + '">Escrever um comentário</label><input type="text" id="com-' + esc(p.id) + '" maxlength="500" placeholder="Escreve um comentário" autocomplete="off"><button class="btn mini pri">Comentar</button></form>' : '') + '</div>';
  return h + '</article>';
}
function compositor(gid) {
  const eu = Loja.eu();
  return '<div class="card compor">' + avatar(eu) + '<button class="compor-b" data-a="nova-publicacao"' + (gid ? ' data-g="' + esc(gid) + '"' : '') + '>Começar uma publicação</button>'
    + '<div class="compor-a"><button data-a="nova-publicacao" data-m="img"' + (gid ? ' data-g="' + esc(gid) + '"' : '') + '>' + ico('imagem') + 'Imagem</button><button data-a="nova-publicacao" data-m="video"' + (gid ? ' data-g="' + esc(gid) + '"' : '') + '>' + ico('video') + 'Vídeo</button>' + (!gid ? '<button data-a="novo-pedido">' + ico('pedidos') + 'Pedido</button>' : '') + '</div></div>';
}
function blocoFeed() {
  const l = Loja.feed().slice(0, 40);
  return '<div class="col feed"><h2 class="h2">Publicações</h2>' + compositor('') + (l.length ? l.map(p => cartaoPost(p)).join('') : vazio('Ainda não há publicações', 'Conta o que estás a fazer: um trabalho acabado, uma dica, uma dúvida. Quem te segue e as tuas ligações veem primeiro.')) + '</div>';
}
function cartaoMini() {
  const eu = Loja.eu(), n = Loja.ligados().length, v = Loja.visitas().length;
  return '<div class="card mini-perfil">' + (imgSegura(eu.capa) ? '<img class="capa-m" src="' + imgSegura(eu.capa) + '" alt="">' : '<div class="capa-m" style="--ac:' + esc(AREA((eu.areas || [])[0] || 'outra').cor) + '"></div>') + avatar(eu, 'g')
    + '<button class="ligacao" data-a="ir" data-v="perfil"><b>' + esc(eu.nome) + '</b></button><span class="muted sm">' + esc(eu.destaque || rotuloTipo(eu)) + '</span>'
    + '<div class="mini-n"><button data-a="rede-seg" data-s="ligacoes"><span>Ligações</span><b>' + n + '</b></button><button data-a="ver-visitas"><span>Viram o teu perfil</span><b>' + v + '</b></button></div></div>';
}
function cartaoSugestao(x) {
  const p = x.p;
  return '<div class="card sug">' + '<button class="pu" data-a="ver-pessoa" data-uid="' + esc(p.uid) + '" aria-label="Ver o perfil de ' + esc(p.nome) + '">' + avatar(p, 'g') + '</button><b>' + esc(p.nome) + '</b><span class="muted sm sub2">' + esc(p.destaque || rotuloTipo(p)) + '</span><span class="muted sm">' + esc(x.razao) + '</span>'
    + '<button class="btn mini" data-a="ligar" data-uid="' + esc(p.uid) + '">' + ico('mais') + 'Ligar</button></div>';
}
function blocoConvites() {
  const c = Loja.convitesLigacao(); if (!c.length) return '';
  return '<div class="card"><h2>Convites para ligar (' + c.length + ')</h2>' + c.map(l => { const p = Loja.pessoa(l.de); return '<div class="convite">' + quemBtn(p, p.destaque || rotuloTipo(p)) + (l.nota ? '<p class="citacao sm">' + esc(l.nota) + '</p>' : '') + '<div class="acoes"><button class="btn mini" data-a="tirar-ligacao" data-uid="' + esc(p.uid) + '">Ignorar</button><button class="btn mini pri" data-a="aceitar-ligacao" data-uid="' + esc(p.uid) + '">Aceitar</button></div></div>'; }).join('') + '</div>';
}
function botaoLigacao(uid, grande) {
  const e = Loja.estadoLigacao(uid), c = 'btn' + (grande ? '' : ' mini');
  if (e === 'eu') return '';
  if (e === 'ligado') return '<button class="' + c + ' pri" data-a="mensagem-direta" data-uid="' + esc(uid) + '">' + ico('conversas') + 'Mensagem</button>';
  if (e === 'enviada') return '<button class="' + c + '" data-a="tirar-ligacao" data-uid="' + esc(uid) + '" aria-label="Pedido enviado. Carrega para cancelar">Pedido enviado</button>';
  if (e === 'recebida') return '<button class="' + c + ' pri" data-a="aceitar-ligacao" data-uid="' + esc(uid) + '">Aceitar ligação</button>';
  return '<button class="' + c + ' pri" data-a="ligar" data-uid="' + esc(uid) + '">' + ico('mais') + 'Ligar</button>';
}

/* ---------- Rede (separador) ---------- */
function ecraRede() {
  if (NAV.sub && NAV.sub.t === 'grupo') return ecraGrupo(NAV.sub.id);
  if (NAV.sub && NAV.sub.t === 'pessoa') return ecraPessoa(NAV.sub.uid);
  const seg = SEG_REDE.some(s => s[0] === F.redeSeg) ? F.redeSeg : 'pessoas', nL = Loja.ligados().length, nC = Loja.convitesLigacao().length;
  const topo = pagina('A tua rede') + '<div class="seg" role="group" aria-label="O que mostrar">' + SEG_REDE.map(s => '<button data-a="rede-seg" data-s="' + s[0] + '" aria-pressed="' + (seg === s[0]) + '">' + s[1] + (s[0] === 'ligacoes' ? ' (' + nL + ')' + (nC ? ' <span class="bolha">' + nC + '</span>' : '') : '') + '</button>').join('') + '</div>';
  if (seg === 'ligacoes') {
    const l = Loja.ligados().map(Loja.pessoa).sort((a, b) => a.nome.localeCompare(b.nome, 'pt')), sug = Loja.talvezConhecas(8);
    return topo + blocoConvites()
      + (sug.length ? '<div class="col"><h2 class="h2">Pessoas que talvez conheças</h2><div class="grelha sugs">' + sug.map(cartaoSugestao).join('') + '</div></div>' : '')
      + '<div class="col"><h2 class="h2">As tuas ligações (' + l.length + ')</h2>' + (l.length ? '<div class="lista">' + l.map(p => '<div class="prop fila">' + quemBtn(p, p.destaque || rotuloTipo(p)) + botaoLigacao(p.uid) + '</div>').join('') + '</div>' : vazio('Ainda não tens ligações', 'Liga-te a colegas e professores: vês primeiro o que publicam e podem trocar mensagens.')) + '</div>'
      + (Loja.enviadas().length ? '<details class="recolher"><summary>Pedidos que enviaste (' + Loja.enviadas().length + ')</summary><div class="lista">' + Loja.enviadas().map(x => { const p = Loja.pessoa(x.para); return p ? '<div class="prop fila">' + quemBtn(p, 'Enviado ' + quando(x.em)) + '<button class="btn mini" data-a="tirar-ligacao" data-uid="' + esc(p.uid) + '">Cancelar</button></div>' : ''; }).join('') + '</div></details>' : '');
  }
  if (seg === 'grupos') {
    const g = Loja.grupos(), meus = g.filter(x => Loja.membro(x.id)), outros = g.filter(x => !Loja.membro(x.id));
    const cg = x => '<button class="card grupo-c" data-a="ver-grupo" data-id="' + esc(x.id) + '"><span class="grupo-i" style="--ac:' + esc(AREA(x.area || 'outra').cor) + '">' + ico(ICO_AREA[x.area] || 'pessoas') + '</span><span><b>' + esc(x.nome) + '</b><span class="muted sm">' + esc((TIPOS_GRUPO.find(t => t[0] === x.tipo) || ['', 'Grupo'])[1]) + ' · ' + Loja.membrosDe(x.id).length + (Loja.membrosDe(x.id).length === 1 ? ' membro' : ' membros') + '</span></span></button>';
    return topo + '<div class="acoes"><button class="btn pri" data-a="novo-grupo">' + ico('mais') + 'Criar um grupo</button></div>'
      + '<div class="col"><h2 class="h2">Os teus grupos</h2>' + (meus.length ? '<div class="grelha">' + meus.map(cg).join('') + '</div>' : vazio('Ainda não estás em grupos', 'Entra no grupo do teu curso, da tua turma ou de um clube para veres o que lá se publica.')) + '</div>'
      + (outros.length ? '<div class="col"><h2 class="h2">Descobrir grupos</h2><div class="grelha">' + outros.map(cg).join('') + '</div></div>' : '');
  }
  return topo + blocoConvites() + ecraFreelancers().replace(pagina('Freelancers'), '');
}
function ecraGrupo(id) {
  const g = Loja.grupo(id); if (!g) return btnVoltar() + vazio('Grupo indisponível', 'Pode ter sido apagado.');
  const sou = Loja.membro(id), ms = Loja.membrosDe(id), posts = Loja.feed(id), criador = Loja.pessoa(g.uid);
  return btnVoltar() + '<div class="card grupo-h" style="--ac:' + esc(AREA(g.area || 'outra').cor) + '"><span class="grupo-i g">' + ico(ICO_AREA[g.area] || 'pessoas') + '</span><div><h1>' + esc(g.nome) + '</h1><span class="muted">' + esc((TIPOS_GRUPO.find(t => t[0] === g.tipo) || ['', 'Grupo'])[1]) + ' · ' + ms.length + (ms.length === 1 ? ' membro' : ' membros') + (criador ? ' · criado por ' + esc(criador.nome) : '') + '</span>' + (g.descricao ? '<p>' + ligacoes(esc(g.descricao)) + '</p>' : '') + '</div>'
    + '<div class="acoes">' + (sou ? '<button class="btn" data-a="sair-grupo" data-id="' + esc(id) + '">Sair do grupo</button>' : '<button class="btn pri" data-a="entrar-grupo" data-id="' + esc(id) + '">Entrar no grupo</button>') + (g.uid === DB.eu || Loja.eAdmin() ? '<button class="btn" data-a="apagar-grupo" data-id="' + esc(id) + '">Apagar</button>' : '<button class="btn" data-a="denunciar" data-tipo="grupo" data-id="' + esc(id) + '">' + ico('bandeira') + 'Denunciar</button>') + '</div></div>'
    + '<div class="two"><div class="col g22">' + (sou ? compositor(id) : '<div class="aviso">Entra no grupo para publicares e comentares aqui.</div>') + (posts.length ? posts.map(p => cartaoPost(p)).join('') : vazio('Ainda sem publicações', sou ? 'Sê a primeira pessoa a publicar no grupo.' : 'Quando alguém publicar, aparece aqui.')) + '</div>'
    + '<div class="col g22"><div class="card"><h2>Membros</h2><div class="lista">' + ms.slice(0, 30).map(m => quemBtn(Loja.pessoa(m.uid), m.uid === g.uid ? 'Criou o grupo' : 'Entrou ' + quando(m.em))).join('') + '</div></div></div></div>';
}
function ecraPost(id) {
  const p = Loja.post(id);
  if (!p || !Loja.podeVerPost(p)) return btnVoltar() + vazio('Publicação indisponível', 'Pode ter sido apagada ou ocultada.');
  return btnVoltar() + '<div class="narrow col">' + cartaoPost(p, true) + '</div>';
}

/* ---------- Vagas (dentro de Pedidos) ---------- */
function cartaoVaga(v) {
  const c = Loja.candidatura(v.id), n = v.uid === DB.eu ? Loja.candidaturasDe(v.id).length : 0, tipo = (TIPOS_VAGA.find(t => t[0] === v.tipo) || ['', 'Vaga'])[1];
  return '<button class="card vaga-c" data-a="ver-vaga" data-id="' + esc(v.id) + '"><span class="grupo-i" style="--ac:' + esc(AREA(v.area).cor) + '">' + ico(ICO_AREA[v.area] || 'selo') + '</span><span class="vaga-t"><b>' + esc(v.titulo) + '</b><span>' + esc(v.entidade) + (v.local ? ' · ' + esc(v.local) : '') + '</span><span class="chips">' + '<span class="chip">' + esc(tipo) + '</span>' + chipArea(v.area)
    + (!Loja.vagaAberta(v) ? '<span class="chip">Fechada</span>' : '<span class="chip">Até ' + esc(diaCurto(v.ate)) + '</span>') + (c ? '<span class="chip ok">' + esc(ESTADO_CAND[c.estado]) + '</span>' : '') + (v.uid === DB.eu ? '<span class="chip">' + n + (n === 1 ? ' candidatura' : ' candidaturas') + '</span>' : '') + '</span></span></button>';
}
const ESTADO_CAND = { enviada: 'Candidatura enviada', vista: 'Candidatura vista', aceite: 'Candidatura aceite', recusada: 'Não seguiu' };
function blocoVagas() {
  const l = Loja.vagas({ tipo: F.vagaTipo, area: F.pedArea }), minhas = Loja.minhasCandidaturas();
  return '<div class="linhaf"><label class="chk">Tipo <select id="vaga-tipo"><option value="">Todos</option>' + TIPOS_VAGA.map(t => '<option value="' + t[0] + '"' + (F.vagaTipo === t[0] ? ' selected' : '') + '>' + t[1] + '</option>').join('') + '</select></label>' + (Loja.podeVagas() ? '<button class="btn pri mini" data-a="nova-vaga">' + ico('mais') + 'Publicar uma vaga</button>' : '') + '</div>'
    + filtrosArea('ped-area', F.pedArea)
    + (minhas.length ? '<details class="recolher"><summary>As tuas candidaturas (' + minhas.length + ')</summary><div class="lista">' + minhas.map(c => { const v = Loja.vaga(c.vagaId); return v ? cartaoVaga(v) : ''; }).join('') + '</div></details>' : '')
    + '<div id="vaga-lista" class="grelha">' + (l.length ? l.map(cartaoVaga).join('') : '<div class="tudo">' + vazio('Não há vagas abertas', 'Os professores e a escola publicam aqui estágios, projetos e voluntariado. Não há pagamentos na app.') + '</div>') + '</div>';
}
function ecraVaga(id) {
  const v = Loja.vaga(id); if (!v) return btnVoltar() + vazio('Vaga indisponível', 'Pode ter sido apagada.');
  const q = Loja.pessoa(v.uid), minha = v.uid === DB.eu, c = Loja.candidatura(id), tipo = (TIPOS_VAGA.find(t => t[0] === v.tipo) || ['', 'Vaga'])[1];
  let h = btnVoltar() + '<div class="narrow col"><div class="card"><h1>' + esc(v.titulo) + '</h1><p class="muted">' + esc(v.entidade) + (v.local ? ' · ' + esc(v.local) : '') + '</p><span class="chips"><span class="chip">' + esc(tipo) + '</span>' + chipArea(v.area) + '<span class="chip">' + (Loja.vagaAberta(v) ? 'Candidaturas até ' + esc(diaCurto(v.ate)) : 'Fechada') + '</span></span>'
    + '<p class="txt">' + ligacoes(esc(v.texto)) + '</p>' + (v.link && /^https:\/\//.test(v.link) ? '<a class="ligacao" href="' + esc(v.link) + '" target="_blank" rel="noopener noreferrer nofollow">Mais informação</a>' : '')
    + '<div class="prop fila">' + quemBtn(q, 'Publicou ' + quando(v.em)) + '</div>'
    + (minha ? '<div class="acoes">' + (Loja.vagaAberta(v) ? '<button class="btn" data-a="fechar-vaga" data-id="' + esc(id) + '">Fechar candidaturas</button>' : '') + '</div>'
      : c ? '<div class="aviso ok"><b>' + esc(ESTADO_CAND[c.estado]) + '.</b> Enviaste ' + quando(c.em) + '.</div>' + (c.estado === 'enviada' ? '<button class="btn mini" data-a="retirar-candidatura" data-id="' + esc(id) + '">Retirar a candidatura</button>' : '')
        : Loja.vagaAberta(v) ? '<button class="btn pri" data-a="candidatar" data-id="' + esc(id) + '">Candidatar-me</button>' : '')
    + (!minha ? '<button class="ligacao sm" data-a="denunciar" data-tipo="vaga" data-id="' + esc(id) + '">Denunciar esta vaga</button>' : '') + '</div>';
  if (minha) { const l = Loja.candidaturasDe(id); h += '<div class="col"><h2 class="h2">Candidaturas (' + l.length + ')</h2>' + (l.length ? l.map(x => { const p = Loja.pessoa(x.uid); return '<div class="card prop">' + quemBtn(p, p.destaque || rotuloTipo(p)) + '<p class="txt">' + esc(x.texto) + '</p><span class="chip">' + esc(ESTADO_CAND[x.estado]) + '</span><div class="acoes">' + (x.estado === 'enviada' ? '<button class="btn mini" data-a="cand-estado" data-id="' + esc(x.id) + '" data-e="vista">Marcar como vista</button>' : '') + (x.estado !== 'aceite' ? '<button class="btn mini pri" data-a="cand-estado" data-id="' + esc(x.id) + '" data-e="aceite">Aceitar</button>' : '') + (x.estado !== 'recusada' ? '<button class="btn mini" data-a="cand-estado" data-id="' + esc(x.id) + '" data-e="recusada">Não seguir</button>' : '') + '</div></div>'; }).join('') : vazio('Ainda sem candidaturas', 'Partilha a vaga com os teus alunos.')) + '</div>'; }
  return h + '</div>';
}

/* ---------- Perfil: blocos da rede ---------- */
function blocoCabecalhoRede(p, souEu) {
  const n = Loja.ligados(p.uid).length, ab = (p.aberto || []).map(a => (ABERTO_A.find(x => x[0] === a) || [])[1]).filter(Boolean);
  return '<div class="rede-cab">' + (p.destaque ? '<p class="destaque">' + esc(p.destaque) + '</p>' : souEu ? '<button class="ligacao sm" data-a="editar-cabecalho">Escreve uma frase sobre ti (o que fazes e o que procuras)</button>' : '')
    + '<span class="muted sm">' + (p.escola ? esc(p.escola) + ' · ' : '') + '<button class="ligacao sm" data-a="' + (souEu ? 'rede-seg' : 'ver-ligacoes') + '" data-s="ligacoes" data-uid="' + esc(p.uid) + '">' + n + (n === 1 ? ' ligação' : ' ligações') + '</button></span>'
    + (ab.length ? '<div class="aberto">' + ico('selo') + '<span><b>Aberto a</b> ' + esc(ab.join(', ')) + '</span>' + (souEu ? '<button class="ligacao sm" data-a="editar-cabecalho">Mudar</button>' : '') + '</div>' : souEu ? '<button class="ligacao sm" data-a="editar-cabecalho">Diz ao que estás aberto (estágios, projetos…)</button>' : '')
    + (!souEu ? '<div class="acoes">' + botaoLigacao(p.uid, true) + '</div>' : '') + '</div>';
}
function blocosPerfilRede(p, souEu) {
  let h = '';
  // destaques
  const ds = (p.destaques || []).map(x => x.t === 'post' ? (Loja.post(x.id) && Loja.podeVerPost(Loja.post(x.id)) ? { x, p: Loja.post(x.id) } : null) : (Loja.pedido(x.id) ? { x, ped: Loja.pedido(x.id) } : null)).filter(Boolean);
  if (ds.length) h += '<div class="card"><h2>Destaques</h2><div class="destaques">' + ds.map(d => d.p ? '<button class="dest" data-a="ver-post" data-id="' + esc(d.p.id) + '">' + (imgSegura(d.p.img) ? '<img loading="lazy" src="' + imgSegura(d.p.img) + '" alt="">' : '') + '<span class="muted sm">Publicação</span><span>' + esc(d.p.texto.slice(0, 90)) + '</span></button>' : '<button class="dest" data-a="ver-pedido" data-id="' + esc(d.ped.id) + '"><span class="muted sm">Trabalho</span><span>' + esc(d.ped.titulo) + '</span></button>').join('') + '</div></div>';
  // atividade
  const ps = Loja.postsDe(p.uid);
  h += '<div class="card"><h2>Atividade</h2>' + (ps.length ? ps.slice(0, 2).map(x => '<button class="ativ" data-a="ver-post" data-id="' + esc(x.id) + '"><span class="muted sm">' + (x.partilhaDe ? 'Partilhou' : 'Publicou') + ' ' + quando(x.em) + '</span><span>' + esc((x.texto || 'Imagem').slice(0, 140)) + '</span></button>').join('') + (ps.length > 2 ? '<button class="ligacao sm" data-a="ver-atividade" data-uid="' + esc(p.uid) + '">Ver as ' + ps.length + ' publicações</button>' : '') : '<p class="muted">' + (souEu ? 'Ainda não publicaste. Conta um trabalho que acabaste ou uma dica.' : 'Ainda sem publicações.') + '</p>') + '</div>';
  // formação
  const fo = p.formacao || [];
  if (fo.length || souEu) h += '<div class="card"><h2 class="h2l">Formação' + (souEu ? '<button class="btn mini" data-a="nova-formacao">' + ico('mais') + 'Juntar</button>' : '') + '</h2>' + (fo.length ? fo.map(f => '<div class="exp"><span class="grupo-i">' + ico('selo') + '</span><div><b>' + esc(f.escola) + '</b>' + (f.curso ? '<span>' + esc(f.curso) + '</span>' : '') + (f.de || f.ate ? '<span class="muted sm">' + esc([f.de, f.ate || 'agora'].filter(Boolean).join(' – ')) + '</span>' : '') + '</div>' + (souEu ? '<button class="ligacao sm" data-a="tirar-formacao" data-id="' + esc(f.id) + '">Tirar</button>' : '') + '</div>').join('') : '<p class="muted">Junta a tua escola e o teu curso.</p>') + '</div>';
  // competências validadas
  const va = Loja.validacoesDe(p.uid), lig = Loja.estadoLigacao(p.uid) === 'ligado';
  if ((p.areas || []).length) h += '<div class="card"><h2>Competências</h2>' + p.areas.map(a => { const l = va[a] || [], minha = l.includes(DB.eu); return '<div class="comp">' + chipArea(a) + '<span class="muted sm">' + (l.length ? 'Validada por ' + l.length + (l.length === 1 ? ' pessoa' : ' pessoas') : 'Ainda sem validações') + '</span>' + (lig ? '<button class="btn mini' + (minha ? '' : ' pri') + '" data-a="validar" data-uid="' + esc(p.uid) + '" data-area="' + a + '" aria-pressed="' + minha + '">' + (minha ? 'Validada' : 'Validar') + '</button>' : '') + '</div>'; }).join('') + (!souEu && !lig ? '<p class="muted sm">Liga-te a ' + esc(p.nome.split(' ')[0]) + ' para validares as competências.</p>' : '') + '</div>';
  // recomendações escritas
  const ts = Loja.testemunhosDe(p.uid);
  h += '<div class="card"><h2 class="h2l">Recomendações' + (lig && !souEu ? '<button class="btn mini" data-a="escrever-testemunho" data-uid="' + esc(p.uid) + '">Recomendar</button>' : '') + '</h2>' + (ts.length ? ts.map(t => { const a = Loja.pessoa(t.uid); return '<div class="aval">' + quemBtn(a, (RELACOES.find(r => r[0] === t.relacao) || ['', ''])[1]) + '<p>' + esc(t.texto) + '</p>' + (souEu ? '<div class="acoes"><button class="btn mini' + (t.visivel ? '' : ' pri') + '" data-a="mostrar-testemunho" data-id="' + esc(t.id) + '" data-v="' + (t.visivel ? '0' : '1') + '">' + (t.visivel ? 'Esconder do perfil' : 'Mostrar no perfil') + '</button><button class="btn mini" data-a="apagar-testemunho" data-id="' + esc(t.id) + '">Apagar</button></div>' : '') + '</div>'; }).join('') : '<p class="muted">' + (souEu ? 'As tuas ligações podem escrever-te recomendações. Tu escolhes quais aparecem.' : 'Ainda sem recomendações.') + '</p>') + '</div>';
  // quem viu (só no meu)
  if (souEu) { const v = Loja.visitas(); h += '<div class="card"><h2 class="h2l">Quem viu o teu perfil<button class="btn mini" data-a="ver-visitas">Ver</button></h2><p class="muted">' + (v.length ? v.length + (v.length === 1 ? ' pessoa viu' : ' pessoas viram') + ' o teu perfil nos últimos 90 dias.' : 'Ninguém viu o teu perfil nos últimos 90 dias.') + '</p></div>'; }
  return h;
}

/* ---------- ações ---------- */
function formPost(d) {
  const meus = Loja.grupos().filter(g => Loja.membro(g.id)), edit = d.editar ? Loja.post(d.editar) : null;
  folha(edit ? 'Editar publicação' : d.partilha ? 'Partilhar' : 'Nova publicação', '<form class="form" id="f-post" novalidate>'
    + campo('po-t', d.partilha ? 'Diz alguma coisa sobre isto (opcional)' : 'O que queres partilhar?', '<textarea id="po-t" rows="5" maxlength="1500" placeholder="Um trabalho que acabaste, uma dica, uma pergunta para a comunidade">' + esc(edit ? edit.texto : '') + '</textarea>', 'Não partilhes moradas, telefones nem dados de outras pessoas.')
    + (edit || d.partilha ? '' : htmlImagem('po-i', 'Imagem (opcional)') + campo('po-v', 'Ligação para um vídeo (opcional)', '<input type="url" id="po-v" maxlength="300" placeholder="https://www.youtube.com/watch?v=…">', 'YouTube, Vimeo ou Google Drive. O vídeo não fica guardado na app.')
      + (meus.length ? campo('po-g', 'Onde publicar', '<select id="po-g"><option value="">Para toda a gente</option>' + meus.map(g => '<option value="' + esc(g.id) + '"' + (d.g === g.id ? ' selected' : '') + '>No grupo «' + esc(g.nome) + '»</option>').join('') + '</select>') : ''))
    + (d.partilha ? '<div class="post-orig sm">' + esc((Loja.post(d.partilha) || {}).texto || '').slice(0, 200) + '</div>' : '')
    + ERRO + '<button class="btn pri w">' + (edit ? 'Guardar' : d.partilha ? 'Partilhar' : 'Publicar') + '</button></form>', f => {
    const img = edit || d.partilha ? () => '' : campoImagem(f, 'po-i');
    if (d.m === 'video') setTimeout(() => { const v = $('#po-v', f); if (v) v.focus(); }, 50);
    if (d.m === 'img') setTimeout(() => { const i = $('#po-i', f); if (i) i.click(); }, 50);
    $('form', f).addEventListener('submit', e => {
      e.preventDefault(); const t = $('#po-t', f).value;
      verificarAntes([t], () => {
        const r = edit ? Loja.editarPost(edit.id, t) : Loja.publicarPost({ texto: t, img: img(), video: ($('#po-v', f) || {}).value || '', grupoId: ($('#po-g', f) || {}).value || d.g || '', partilhaDe: d.partilha || '' });
        if (resultado(r, $('.erro', f), edit ? 'Publicação guardada' : d.partilha ? 'Partilhado' : 'Publicado')) desenhar();
      });
    });
  });
}
Object.assign(ACOES, {
  'rede-seg': d => { F.redeSeg = d.s; if (NAV.v !== 'freelancers' || NAV.sub) ir('freelancers'); else desenhar(); },
  'nova-publicacao': d => formPost({ g: d.g || '', m: d.m || '' }),
  'post-mais': d => { const p = document.getElementById('pt-' + d.id); if (p) p.classList.remove('corta'); const b = document.querySelector('[data-a="post-mais"][data-id="' + CSS.escape(d.id) + '"]'); if (b) b.remove(); },
  'ver-post': d => { fecharFolha(); abrir({ t: 'post', id: d.id }, 'inicio'); },
  'ver-grupo': d => { fecharFolha(); abrir({ t: 'grupo', id: d.id }, 'freelancers'); },
  'ver-vaga': d => { fecharFolha(); abrir({ t: 'vaga', id: d.id }, 'pedidos'); },
  reagir: d => { const r = Loja.reagir(d.id, d.r); if (r.erro) toast(r.erro); else desenhar(); },
  'escolher-reacao': d => folha('Reagir', '<div class="reacoes-esc">' + REACOES.map(r => '<button data-r="' + r[0] + '" aria-pressed="' + (Loja.reacoesDe(d.id).minha === r[0]) + '"><span aria-hidden="true">' + r[2] + '</span>' + r[1] + '</button>').join('') + '</div>', f => {
    f.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; const r = Loja.reagir(d.id, b.dataset.r); fecharFolha(); if (r.erro) toast(r.erro); else desenhar(); });
  }),
  'ver-reacoes': d => { const r = DB.reacoes.filter(x => x.postId === d.id && Loja.pessoa(x.uid)); folha('Reações (' + r.length + ')', '<div class="lista">' + r.map(x => '<div class="prop fila">' + quemBtn(Loja.pessoa(x.uid), REACAO(x.tipo)[1]) + '<span aria-hidden="true" class="reac-g">' + REACAO(x.tipo)[2] + '</span></div>').join('') + '</div>'); },
  'abrir-comentarios': d => { if (COMENTARIOS_ABERTOS.has(d.id)) COMENTARIOS_ABERTOS.delete(d.id); else COMENTARIOS_ABERTOS.add(d.id); desenhar(); setTimeout(() => { const i = document.getElementById('com-' + d.id); if (i && COMENTARIOS_ABERTOS.has(d.id)) i.focus({ preventScroll: false }); }, 30); },
  'responder-com': d => { COMENTARIOS_ABERTOS.add(d.id); desenhar(); const i = document.getElementById('com-' + d.id); if (i) { i.dataset.resp = d.c; i.placeholder = 'Responder a ' + d.n; i.focus(); } },
  'apagar-com': d => confirmar('Apagar o comentário?', 'Não dá para desfazer.', 'Apagar', () => { if (resultado(Loja.apagarComentario(d.c), null, 'Comentário apagado')) desenhar(); }),
  'partilhar-post': d => formPost({ partilha: d.id }),
  'enviar-post': d => copiar(location.origin + location.pathname + '#post/' + d.id, 'Ligação da publicação copiada'),
  'post-menu': d => {
    const p = Loja.post(d.id); if (!p) return; const meu = p.uid === DB.eu, mod = Loja.eAdmin() && Nuvem.ativa() ? true : false, dest = meu && (Loja.eu().destaques || []).some(x => x.t === 'post' && x.id === p.id);
    const op = (id, t, s) => '<button class="conv" id="' + id + '"><div><b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div></button>';
    folha('Publicação', '<div class="lista">' + op('pm-ab', 'Abrir a publicação') + op('pm-cp', 'Copiar a ligação')
      + (meu ? op('pm-ed', 'Editar') + op('pm-de', dest ? 'Tirar dos destaques do perfil' : 'Destacar no meu perfil', 'Até 3 destaques') + op('pm-ap', 'Apagar') : op('pm-dn', 'Denunciar', 'A moderação vê e decide.'))
      + (!meu && (mod || !Nuvem.ativa()) ? op('pm-oc', p.oculto ? 'Mostrar outra vez' : 'Ocultar (moderação)') : '') + '</div>', f => {
      const on = (id, fn) => { const b = $('#' + id, f); if (b) b.addEventListener('click', fn); };
      on('pm-ab', () => ACOES['ver-post']({ id: p.id }));
      on('pm-cp', () => { fecharFolha(); ACOES['enviar-post']({ id: p.id }); });
      on('pm-ed', () => formPost({ editar: p.id }));
      on('pm-de', () => { if (resultado(Loja.destacar('post', p.id), null, dest ? 'Tirado dos destaques' : 'Destacado no perfil')) desenhar(); });
      on('pm-ap', () => confirmar('Apagar a publicação?', 'Saem também as reações e os comentários.', 'Apagar', () => { if (resultado(Loja.apagarPost(p.id), null, 'Publicação apagada')) { if (NAV.sub && NAV.sub.t === 'post') voltar(); else desenhar(); } }));
      on('pm-dn', () => ACOES.denunciar({ tipo: 'post', id: p.id }, { autor: p.uid, citacao: p.texto }));
      on('pm-oc', () => { if (resultado(Loja.ocultarPost(p.id, !p.oculto), null, p.oculto ? 'Publicação visível' : 'Publicação ocultada')) desenhar(); });
    });
  },
  ligar: d => { const o = Loja.pessoa(d.uid); if (!o) return; folha('Ligar-te a ' + o.nome, '<form class="form" novalidate>' + campo('lg-n', 'Uma nota (opcional)', '<textarea id="lg-n" maxlength="200" rows="3" placeholder="Ex.: Somos da mesma turma de Multimédia."></textarea>', 'Ajuda a pessoa a saber quem és.') + ERRO + '<button class="btn pri w">Enviar pedido de ligação</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); if (resultado(Loja.pedirLigacao(d.uid, $('#lg-n', f).value), $('.erro', f), 'Pedido de ligação enviado')) desenhar(); });
  }); },
  'aceitar-ligacao': d => { if (resultado(Loja.aceitarLigacao(d.uid), null, 'Ligação aceite')) desenhar(); },
  'tirar-ligacao': d => { const e = Loja.estadoLigacao(d.uid), o = Loja.pessoa(d.uid);
    const fazer = () => { if (resultado(Loja.tirarLigacao(d.uid), null, e === 'ligado' ? 'Ligação removida' : e === 'recebida' ? 'Convite ignorado' : 'Pedido cancelado')) desenhar(); };
    if (e === 'ligado') confirmar('Remover a ligação a ' + (o ? o.nome : 'esta pessoa') + '?', 'Deixam de trocar mensagens diretas. A pessoa não é avisada.', 'Remover', fazer); else fazer(); },
  'mensagem-direta': d => { const r = Loja.conversaDireta(d.uid); if (r.erro) return toast(r.erro); ACOES['ver-conversa']({ id: r.id }); },
  'ver-ligacoes': d => { const l = Loja.ligados(d.uid).map(Loja.pessoa); folha('Ligações (' + l.length + ')', l.length ? '<div class="lista">' + l.map(p => '<div class="prop fila">' + quemBtn(p, p.destaque || rotuloTipo(p)) + botaoLigacao(p.uid) + '</div>').join('') + '</div>' : '<p class="muted">Ainda sem ligações.</p>'); },
  'ver-atividade': d => { const l = Loja.postsDe(d.uid); folha('Publicações', l.map(p => cartaoPost(p)).join('')); },
  'ver-visitas': () => { const v = Loja.visitas(); folha('Quem viu o teu perfil', '<p class="muted">Últimos 90 dias. Quem ligou o modo privado não aparece.</p>' + (v.length ? '<div class="lista">' + v.map(x => quemBtn(Loja.pessoa(x.uid), quando(x.em))).join('') + '</div>' : '<p class="muted">Ninguém, por agora.</p>') + '<label class="chk"><input type="checkbox" id="vis-priv"' + (Loja.visitaPrivada() ? ' checked' : '') + '>Ver perfis em modo privado (não apareço nas visitas dos outros)</label>', f => {
    $('#vis-priv', f).addEventListener('change', e => { try { localStorage.setItem('pl-visita-privada', e.target.checked ? '1' : '0'); } catch (x) { /* sem acesso */ } toast(e.target.checked ? 'Modo privado ligado' : 'Modo privado desligado'); });
  }); },
  'editar-cabecalho': () => { const p = Loja.eu(); folha('Cabeçalho do perfil', '<form class="form" novalidate>' + campo('cb-d', 'Frase de destaque', '<input id="cb-d" maxlength="120" value="' + esc(p.destaque || '') + '" placeholder="Ex.: Estudante de Multimédia · Vídeo e motion design">', 'Aparece debaixo do teu nome em todo o lado.')
    + '<fieldset class="campo"><legend class="lb">Estou aberto a</legend>' + ABERTO_A.map(a => '<label class="chk"><input type="checkbox" name="cb-a" value="' + a[0] + '"' + ((p.aberto || []).includes(a[0]) ? ' checked' : '') + '>' + a[1] + '</label>').join('') + '</fieldset>'
    + htmlImagem('cb-c', 'Imagem de capa (opcional)') + (p.capa ? '<label class="chk"><input type="checkbox" id="cb-tc">Tirar a capa atual</label>' : '') + ERRO + '<button class="btn pri w">Guardar</button></form>', f => {
    const capa = campoImagem(f, 'cb-c');
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const c = capa(), tirar = $('#cb-tc', f) && $('#cb-tc', f).checked; if (resultado(Loja.editarCabecalho({ destaque: $('#cb-d', f).value, aberto: [...f.querySelectorAll('[name=cb-a]:checked')].map(x => x.value), capa: c ? c : tirar ? '' : undefined }), $('.erro', f), 'Perfil atualizado')) desenhar(); });
  }); },
  'nova-formacao': () => folha('Formação', '<form class="form" novalidate>' + campo('fo-e', 'Escola', '<input id="fo-e" maxlength="80" value="' + esc(Loja.eu().escola || '') + '">') + campo('fo-c', 'Curso', '<input id="fo-c" maxlength="80" placeholder="Ex.: Curso Profissional de Multimédia">') + '<div class="linhaf">' + campo('fo-d', 'Início', '<input id="fo-d" inputmode="numeric" maxlength="4" placeholder="2024">') + campo('fo-a', 'Fim', '<input id="fo-a" inputmode="numeric" maxlength="4" placeholder="2027">') + '</div>' + ERRO + '<button class="btn pri w">Guardar</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); if (resultado(Loja.guardarFormacao({ escola: $('#fo-e', f).value, curso: $('#fo-c', f).value, de: $('#fo-d', f).value, ate: $('#fo-a', f).value }), $('.erro', f), 'Formação guardada')) desenhar(); });
  }),
  'tirar-formacao': d => { if (resultado(Loja.tirarFormacao(d.id), null, 'Formação tirada')) desenhar(); },
  validar: d => { const r = Loja.validar(d.uid, d.area); if (r.erro) toast(r.erro); else desenhar(); },
  'escrever-testemunho': d => { const o = Loja.pessoa(d.uid); folha('Recomendar ' + (o ? o.nome : ''), '<form class="form" novalidate>' + campo('ts-r', 'Como se conhecem?', '<select id="ts-r">' + RELACOES.map(r => '<option value="' + r[0] + '">' + r[1] + '</option>').join('') + '</select>') + campo('ts-t', 'A tua recomendação', '<textarea id="ts-t" rows="5" maxlength="600" placeholder="O que fizeram juntos e o que esta pessoa faz bem."></textarea>', 'A pessoa escolhe se aparece no perfil dela.') + ERRO + '<button class="btn pri w">Enviar</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#ts-t', f).value; verificarAntes([t], () => { if (resultado(Loja.escreverTestemunho(d.uid, t, $('#ts-r', f).value), $('.erro', f), 'Recomendação enviada')) desenhar(); }); });
  }); },
  'mostrar-testemunho': d => { if (resultado(Loja.mostrarTestemunho(d.id, d.v === '1'), null, d.v === '1' ? 'Aparece no teu perfil' : 'Escondida do perfil')) desenhar(); },
  'apagar-testemunho': d => confirmar('Apagar a recomendação?', 'Não dá para desfazer.', 'Apagar', () => { if (resultado(Loja.apagarTestemunho(d.id), null, 'Recomendação apagada')) desenhar(); }),
  'novo-grupo': () => folha('Criar um grupo', '<form class="form" novalidate>' + campo('gr-n', 'Nome', '<input id="gr-n" maxlength="60" placeholder="Ex.: 11.º Multimédia">') + campo('gr-t', 'Tipo', '<select id="gr-t">' + TIPOS_GRUPO.map(t => '<option value="' + t[0] + '">' + t[1] + '</option>').join('') + '</select>') + campo('gr-a', 'Área', '<select id="gr-a"><option value="">Várias</option>' + AREAS.map(a => '<option value="' + a.id + '">' + esc(a.nome) + '</option>').join('') + '</select>') + campo('gr-d', 'Para que serve', '<textarea id="gr-d" maxlength="300" rows="3"></textarea>') + ERRO + '<button class="btn pri w">Criar</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const r = Loja.criarGrupo({ nome: $('#gr-n', f).value, tipo: $('#gr-t', f).value, area: $('#gr-a', f).value, descricao: $('#gr-d', f).value }); if (resultado(r, $('.erro', f), 'Grupo criado')) ACOES['ver-grupo']({ id: r.id }); });
  }),
  'entrar-grupo': d => { if (resultado(Loja.entrarGrupo(d.id), null, 'Entraste no grupo')) desenhar(); },
  'sair-grupo': d => confirmar('Sair do grupo?', 'Deixas de ver as publicações do grupo no Início.', 'Sair', () => { if (resultado(Loja.sairGrupo(d.id), null, 'Saíste do grupo')) { if (!Loja.grupo(d.id)) voltar(); else desenhar(); } }),
  'apagar-grupo': d => confirmar('Apagar o grupo?', 'O grupo deixa de existir para toda a gente.', 'Apagar', () => { if (resultado(Loja.apagarGrupo(d.id), null, 'Grupo apagado')) voltar(); }),
  'ir-vagas': () => { F.pedSeg = 'vagas'; ir('pedidos'); },
  'nova-vaga': () => folha('Publicar uma vaga', '<form class="form" novalidate>' + campo('vg-t', 'Título', '<input id="vg-t" maxlength="100" placeholder="Ex.: Estágio em fotografia (FCT)">') + campo('vg-e', 'Quem oferece', '<input id="vg-e" maxlength="80" placeholder="Empresa, escola ou associação">') + '<div class="linhaf">' + campo('vg-ti', 'Tipo', '<select id="vg-ti">' + TIPOS_VAGA.map(t => '<option value="' + t[0] + '">' + t[1] + '</option>').join('') + '</select>') + campo('vg-a', 'Área', '<select id="vg-a">' + AREAS.map(a => '<option value="' + a.id + '">' + esc(a.nome) + '</option>').join('') + '</select>') + '</div>'
    + campo('vg-l', 'Local', '<input id="vg-l" maxlength="60" placeholder="Ex.: Lousã, na escola, online">') + campo('vg-x', 'Descrição', '<textarea id="vg-x" rows="5" maxlength="1500" placeholder="O que se faz, durante quanto tempo, o que é preciso saber."></textarea>', 'Na app não há pagamentos.') + campo('vg-d', 'Candidaturas até', '<input type="date" id="vg-d" min="' + hojeISO() + '">') + campo('vg-k', 'Ligação com mais informação (opcional)', '<input type="url" id="vg-k" maxlength="300" placeholder="https://">') + ERRO + '<button class="btn pri w">Publicar a vaga</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const r = Loja.publicarVaga({ titulo: $('#vg-t', f).value, entidade: $('#vg-e', f).value, tipo: $('#vg-ti', f).value, area: $('#vg-a', f).value, local: $('#vg-l', f).value, texto: $('#vg-x', f).value, ate: $('#vg-d', f).value, link: $('#vg-k', f).value }); if (resultado(r, $('.erro', f), 'Vaga publicada')) desenhar(); });
  }),
  candidatar: d => { const v = Loja.vaga(d.id); folha('Candidatar-me', '<form class="form" novalidate><p class="muted">' + esc(v ? v.titulo : '') + '</p>' + campo('cd-t', 'Porque és a pessoa certa?', '<textarea id="cd-t" rows="5" maxlength="800" placeholder="O que já fizeste parecido, o que sabes usar e quando estás disponível."></textarea>', 'Quem publicou a vaga vê também o teu perfil e portefólio.') + ERRO + '<button class="btn pri w">Enviar a candidatura</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#cd-t', f).value; verificarAntes([t], () => { if (resultado(Loja.candidatar(d.id, t), $('.erro', f), 'Candidatura enviada')) desenhar(); }); });
  }); },
  'retirar-candidatura': d => confirmar('Retirar a candidatura?', 'Podes voltar a candidatar-te enquanto a vaga estiver aberta.', 'Retirar', () => { if (resultado(Loja.retirarCandidatura(d.id), null, 'Candidatura retirada')) desenhar(); }),
  'cand-estado': d => { if (resultado(Loja.responderCandidatura(d.id, d.e), null, 'Candidatura atualizada')) desenhar(); },
  'fechar-vaga': d => confirmar('Fechar as candidaturas?', 'A vaga deixa de aparecer nas vagas abertas.', 'Fechar', () => { if (resultado(Loja.fecharVaga(d.id), null, 'Vaga fechada')) desenhar(); })
});
