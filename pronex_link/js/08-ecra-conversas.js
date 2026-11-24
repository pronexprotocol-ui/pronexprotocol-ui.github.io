/* Pronex_Link · 08-ecra-conversas.js
   O mensageiro: a lista de todas as conversas (de trabalho, diretas e de grupo) e a conversa aberta.
   No computador as duas ficam lado a lado; no telemóvel vê-se uma de cada vez. A conversa ocupa a altura
   do ecrã: as mensagens deslizam dentro dela e a caixa de escrever fica sempre em baixo. */
'use strict';
// Uma linha da lista, igual para os três tipos de conversa.
function itensConversas() {
  const cs = Loja.minhasConversas().map(c => { const o = Loja.pessoa(c.uids.find(u => u !== DB.eu)), p = Loja.pedido(c.pedidoId), u = c.msgs[c.msgs.length - 1];
    return { t: 'conversa', id: c.id, nome: o ? o.nome : 'Conta apagada', sub: p ? p.titulo : !c.pedidoId ? 'Mensagem direta' : 'Pedido apagado', av: avatar(o), em: u ? u.em : 0, ult: u ? (u.uid === DB.eu ? 'Tu: ' : '') + (u.texto || 'Imagem') : '', n: Loja.naoLidas(c) }; });
  const ss = Loja.salas().map(s => { const u = Loja.ultimaSala(s.id), q = u.uid && Loja.pessoa(u.uid);
    return { t: 'sala', id: s.id, nome: s.nome, sub: s.sub + ' · ' + s.membros.length + ' pessoas', av: '<span class="grupo-i" style="--ac:' + esc(AREA(s.area || 'outra').cor) + '">' + ico(s.tipo === 'eq' ? 'pedidos' : 'pessoas') + '</span>', em: u.em || 0, ult: u.em ? (u.uid === DB.eu ? 'Tu: ' : q ? q.nome.split(' ')[0] + ': ' : '') + (u.texto || 'Imagem') : 'Ainda sem mensagens', n: Loja.porLerSala(s.id) ? 1 : 0, ponto: true }; });
  return cs.concat(ss).sort((a, b) => b.em - a.em);
}
function listaConversas(ativa) {
  const todos = itensConversas(), q = norm(F.cvQ || ''), l = q ? todos.filter(x => norm(x.nome + ' ' + x.sub).includes(q)) : todos;
  return '<aside class="mlista" aria-label="As tuas conversas"><div class="mlista-h"><h1>Conversas</h1>' + (todos.length > 4 || q ? '<label class="sr" for="cv-q">Procurar uma conversa</label><input type="search" id="cv-q" placeholder="Procurar uma conversa" value="' + esc(F.cvQ || '') + '" autocomplete="off">' : '') + '</div>'
    + '<div class="mlista-l" id="cv-lista">' + (l.length ? l.map(x => '<button type="button" class="conv' + (x.n ? ' novo' : '') + '" data-a="' + (x.t === 'sala' ? 'ver-sala' : 'ver-conversa') + '" data-id="' + esc(x.id) + '"' + (ativa === x.id ? ' aria-current="true"' : '') + '>' + x.av
      + '<div><b>' + esc(x.nome) + '</b><span>' + esc(x.sub) + '</span><span class="ult">' + esc(x.ult) + '</span></div>'
      + '<span class="conv-m">' + (x.em ? '<span class="muted sm">' + quandoCurto(x.em) + '</span>' : '') + (x.n ? '<span class="dot"' + (x.ponto ? ' aria-label="Por ler"' : '') + '>' + (x.ponto ? '' : x.n) + '</span>' : '') + '</span></button>').join('')
      : q ? '<p class="muted mvazio">Nenhuma conversa com esse nome.</p>'
        : vazio('Ainda não tens conversas', 'Uma conversa abre-se quando um trabalho começa, quando te ligas a alguém ou quando entras num grupo.', '<button type="button" class="btn pri" data-a="ir" data-v="pedidos">Ver pedidos abertos</button>')) + '</div></aside>';
}
// Hora curta para a lista: a hora se foi hoje, «ontem», o dia da semana ou a data.
function quandoCurto(ms) {
  const d = new Date(ms), h = new Date(), dias = Math.round((new Date(h.getFullYear(), h.getMonth(), h.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  return dias <= 0 ? hora(ms) : dias === 1 ? 'ontem' : dias < 7 ? d.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '') : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}
// As mensagens de uma conversa: separador por dia, e mensagens seguidas da mesma pessoa (até 5 minutos) juntas sob um só nome.
function linhasMsgs(msgs, o) {
  let dia = '', ant = null, h = '';
  msgs.forEach(m => {
    const d = new Date(m.em).toDateString();
    if (d !== dia) { dia = d; ant = null; h += '<div class="msg dia"><span>' + (d === new Date().toDateString() ? 'Hoje' : dataLonga(m.em)) + '</span></div>'; }
    if (!m.uid) { ant = null; h += '<div class="msg sis">' + esc(m.texto) + '</div>'; return; }
    const q = Loja.pessoa(m.uid), meu = m.uid === DB.eu, seg = !!ant && ant.uid === m.uid && m.em - ant.em < 300000 && !m.resp;
    h += '<div class="mrow' + (meu ? ' eu' : '') + (seg ? ' seg' : '') + '">'
      + (seg ? '<span class="mhora" aria-hidden="true">' + hora(m.em) + '</span>' : '<button type="button" class="pu" data-a="ver-pessoa" data-uid="' + esc(m.uid) + '" aria-label="Ver o perfil de ' + esc(q ? q.nome : 'quem escreveu') + '">' + avatar(q, 'p') + '</button>')
      + '<div class="mcorpo">' + (seg ? '' : '<div class="who"><b>' + esc(meu ? 'Tu' : (q ? q.nome : 'Conta apagada')) + '</b>' + (q && q.tipo === 'professor' && !meu ? '<span class="chip prof">Professor</span>' : '') + '<span>' + hora(m.em) + '</span></div>')
      + '<div class="msg' + (meu ? ' eu' : '') + '">' + (m.resp ? '<span class="cit"><b>' + esc(m.resp.uid === DB.eu ? 'Tu' : ((Loja.pessoa(m.resp.uid) || {}).nome || 'Mensagem')) + '</b>' + esc(m.resp.texto) + '</span>' : '')
      + (imgSegura(m.img) ? '<img loading="lazy" decoding="async" class="zoom" tabindex="0" src="' + imgSegura(m.img) + '" alt="Imagem enviada">' : '')
      + (m.reuniao ? '<span class="reuniao">' + ico('calendario') + '<b>' + esc(dataLonga(m.reuniao.quando)) + ' às ' + hora(m.reuniao.quando) + '</b>' + (m.reuniao.onde ? '<span>' + esc(m.reuniao.onde) + '</span>' : '') + '</span>' : ligacoes(esc(m.texto)))
      + (o.fixada === m.id ? '<span class="chip">Fixada</span>' : '') + '</div>' + (o.visto && o.visto.id === m.id ? '<span class="visto">' + o.visto.txt + '</span>' : '') + '</div>'
      + '<button type="button" class="mais" ' + o.menu(m) + ' aria-label="Mais opções da mensagem">' + ico('mais3') + '</button></div>';
    ant = m;
  });
  return h;
}
const ESQUELETO = '<div class="skel"></div><div class="skel eu"></div><div class="skel"></div>';
const caixaEscrever = (idForm, id, rotulo, dica) => '<form class="escrever" id="' + idForm + '" data-id="' + esc(id) + '"><label class="icobtn" aria-label="Enviar uma imagem">' + ico('imagem') + '<input type="file" id="msg-img" class="sr" accept="image/jpeg,image/png,image/webp"></label><label class="sr" for="msg-t">' + rotulo + '</label><textarea id="msg-t" rows="1" maxlength="1000" placeholder="' + esc(dica) + '"></textarea><button type="submit" class="btn pri enviar" aria-label="Enviar">' + ico('enviar') + '<span>Enviar</span></button></form>';
const topoPainel = (quem, botoes) => '<header class="mtopo"><button type="button" class="icobtn mvoltar" data-a="voltar" aria-label="Voltar às conversas">' + ico('voltar') + '</button>' + quem + '<div class="mtopo-a">' + botoes + '</div></header>';

function painelConversa(id) {
  const c = Loja.conversa(id);
  if (!c || !c.uids.includes(DB.eu)) return '<section class="mpainel">' + topoPainel('<div class="mquem"></div>', '') + vazio('Conversa indisponível', 'Só quem faz parte do trabalho a pode ver.') + '</section>';
  const ou = c.uids.find(u => u !== DB.eu), o = Loja.pessoa(ou), p = Loja.pedido(c.pedidoId), fechada = Loja.conversaFechada(c);
  const vist = Loja.vistoPor(c), minhas = c.msgs.filter(m => m.uid === DB.eu), ult = minhas.length ? minhas[minhas.length - 1] : null;
  const msgs = !c.msgs.length && Nuvem.ativa() && !Nuvem.msgsLidas(c.id) ? ESQUELETO
    : linhasMsgs(c.msgs, { fixada: c.fixada && c.fixada.id, menu: m => 'data-a="msg-menu" data-c="' + esc(c.id) + '" data-m="' + esc(m.id) + '"', visto: ult && vist >= ult.em ? { id: ult.id, txt: 'Visto ' + (new Date(vist).toDateString() === new Date().toDateString() ? 'às ' + hora(vist) : dataLonga(vist)) } : null });
  return '<section class="mpainel" aria-label="Conversa com ' + esc(o ? o.nome : 'conta apagada') + '">'
    + topoPainel('<button type="button" class="mquem" data-a="ver-pessoa" data-uid="' + esc(ou) + '">' + avatar(o) + '<span><b>' + esc(o ? o.nome : 'Conta apagada') + tagExemplo(o) + '</b><span class="convh">' + esc(p ? p.titulo : !c.pedidoId ? 'Mensagem direta' : '') + '</span></span></button>',
      (p ? '<button type="button" class="btn mini" data-a="ver-pedido" data-id="' + esc(p.id) + '">Ver pedido</button>' : '')
      + (!fechada && ligado('reunioes') ? '<button type="button" class="icobtn" data-a="marcar-reuniao" data-c="' + esc(c.id) + '" aria-label="Marcar uma reunião" title="Marcar uma reunião">' + ico('calendario') + '</button>' : '')
      + '<button type="button" class="icobtn" data-a="denunciar" data-tipo="conversa" data-id="' + esc(c.id) + '" aria-label="Denunciar esta conversa" title="Denunciar esta conversa">' + ico('bandeira') + '</button>')
    + (c.fixada ? '<div class="fixada" role="note">' + ico('pino') + '<span><b>Mensagem fixada</b> ' + esc(c.fixada.texto) + '</span>' + (!fechada ? '<button type="button" class="x" data-a="desafixar" data-c="' + esc(c.id) + '" aria-label="Desafixar a mensagem">' + ico('fechar') + '</button>' : '') + '</div>' : '')
    + '<div class="chat" id="chat" aria-live="polite" tabindex="0" aria-label="Mensagens">' + msgs + '</div><div class="mfundo">'
    + (fechada ? '<div class="aviso warn">' + (!c.pedidoId ? 'Esta conversa está fechada: já não estão ligados.' : 'Esta conversa está fechada: o trabalho já não está a decorrer entre vocês.') + '</div>'
      : '<div class="filtros rapidas" role="group" aria-label="Respostas rápidas">' + respostasRapidas().map(r => '<button type="button" data-a="resposta-rapida" data-id="' + esc(c.id) + '" data-t="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div>'
      + (RESPOSTA && RESPOSTA.c === c.id ? '<div class="respondendo"><span><b>A responder</b> ' + esc(RESPOSTA.texto) + '</span><button type="button" class="x" data-a="sem-resposta" aria-label="Não responder a esta mensagem">' + ico('fechar') + '</button></div>' : '')
      + caixaEscrever('escrever', c.id, 'Mensagem', 'Mensagem para ' + (o ? o.nome.split(' ')[0] : ''))) + '</div></section>';
}
// Conversa de grupo: a equipa de um pedido ou um grupo da rede.
function painelSala(sid) {
  const s = Loja.sala(sid);
  if (!s) return '<section class="mpainel">' + topoPainel('<div class="mquem"></div>', '') + vazio('Conversa indisponível', 'Só quem está no grupo ou na equipa a pode ver.') + '</section>';
  if (Nuvem.ativa()) Nuvem.verSala(sid);
  const ms = Loja.msgsSala(sid);
  const msgs = !ms.length && Nuvem.ativa() && !Nuvem.salaLida(sid) ? ESQUELETO
    : !ms.length ? '<div class="msg sis">Ainda sem mensagens. Escreve a primeira: todo o grupo a vê.</div>'
      : linhasMsgs(ms, { menu: m => 'data-a="salamsg-menu" data-s="' + esc(sid) + '" data-m="' + esc(m.id) + '"' });
  const nomes = s.membros.map(u => u === DB.eu ? 'tu' : nomeCurto(Loja.pessoa(u))).slice(0, 4).join(', ') + (s.membros.length > 4 ? ' e mais ' + (s.membros.length - 4) : '');
  return '<section class="mpainel" aria-label="Conversa de grupo ' + esc(s.nome) + '">'
    + topoPainel('<button type="button" class="mquem" data-a="' + (s.tipo === 'eq' ? 'ver-pedido' : 'ver-grupo') + '" data-id="' + esc(s.ref) + '"><span class="grupo-i" style="--ac:' + esc(AREA(s.area || 'outra').cor) + '">' + ico(s.tipo === 'eq' ? 'pedidos' : 'pessoas') + '</span><span><b>' + esc(s.nome) + '</b><span class="convh">' + esc(s.sub) + ' · ' + esc(nomes) + '</span></span></button>',
      '<button type="button" class="btn mini" data-a="' + (s.tipo === 'eq' ? 'ver-pedido' : 'ver-grupo') + '" data-id="' + esc(s.ref) + '">' + (s.tipo === 'eq' ? 'Ver pedido' : 'Ver grupo') + '</button>')
    + '<div class="chat" id="chat" aria-live="polite" tabindex="0" aria-label="Mensagens">' + msgs + '</div><div class="mfundo">' + caixaEscrever('escrever-sala', sid, 'Mensagem para o grupo', 'Mensagem para o grupo') + '</div></section>';
}
function ecraConversas() {
  const sub = NAV.sub, aberta = sub && (sub.t === 'conversa' || sub.t === 'sala') ? sub.id : '';
  if (sub && sub.t === 'pessoa') return ecraPessoa(sub.uid);
  return '<div class="mensageiro' + (aberta ? ' aberta' : '') + '">' + listaConversas(aberta)
    + (aberta ? (sub.t === 'sala' ? painelSala(aberta) : painelConversa(aberta)) : '<section class="mpainel mnada"><div>' + ico('conversas') + '<b>Escolhe uma conversa</b><p class="muted">As mensagens aparecem aqui.</p></div></section>') + '</div>';
}
