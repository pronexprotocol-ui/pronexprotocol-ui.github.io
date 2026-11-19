/* Pronex_Link · 08-ecra-conversas.js
   Lista de conversas e uma conversa aberta. Cada conversa pertence a um trabalho e só existe entre quem pediu e quem faz. */
'use strict';
function ecraConversas() {
  if (NAV.sub && NAV.sub.t === 'conversa') return ecraConversa(NAV.sub.id);
  const l = Loja.minhasConversas();
  return pagina('Conversas') + (l.length ? '<div class="lista narrow">' + l.map(c => { const o = Loja.pessoa(c.uids.find(u => u !== DB.eu)), p = Loja.pedido(c.pedidoId), u = c.msgs[c.msgs.length - 1], n = Loja.naoLidas(c); return '<button class="conv" data-a="ver-conversa" data-id="' + esc(c.id) + '">' + avatar(o) + '<div><b>' + esc(o ? o.nome : 'Conta apagada') + '</b><span>' + esc(p ? p.titulo : 'Pedido apagado') + '</span><span>' + esc(u ? (u.uid === DB.eu ? 'Tu: ' : '') + (u.texto || 'Imagem') : '') + '</span></div>' + (n ? '<span class="dot">' + n + '</span>' : '<span class="muted sm">' + (u ? quando(u.em) : '') + '</span>') + '</button>'; }).join('') + '</div>'
    : vazio('Ainda não tens conversas', 'Uma conversa abre-se quando um trabalho começa: depois de uma proposta ou de um convite ser aceite.'));
}
function ecraConversa(id) {
  const c = Loja.conversa(id);
  if (!c || !c.uids.includes(DB.eu)) return btnVoltar() + vazio('Conversa indisponível', 'Só quem faz parte do trabalho a pode ver.');
  const o = Loja.pessoa(c.uids.find(u => u !== DB.eu)), p = Loja.pedido(c.pedidoId), fechada = Loja.conversaFechada(c);
  let dia = '', msgs = '';
  c.msgs.forEach(m => {
    const d = new Date(m.em).toDateString();
    if (d !== dia) { dia = d; msgs += '<div class="msg dia">' + (d === new Date().toDateString() ? 'Hoje' : dataLonga(m.em)) + '</div>'; }
    msgs += m.uid ? '<div class="msg' + (m.uid === DB.eu ? ' eu' : '') + '">' + (imgSegura(m.img) ? '<img src="' + imgSegura(m.img) + '" alt="Imagem enviada">' : '') + esc(m.texto) + '<time>' + hora(m.em) + '</time></div>' : '<div class="msg sis">' + esc(m.texto) + '</div>';
  });
  return btnVoltar() + '<div class="narrow col"><div class="prop fila">' + quemBtn(o, p ? p.titulo : '') + (p ? '<button class="btn mini" data-a="ver-pedido" data-id="' + esc(p.id) + '">Ver pedido</button>' : '') + '</div>'
    + '<div class="chat" id="chat" aria-live="polite">' + msgs + '</div>'
    + (fechada ? '<div class="aviso warn">Esta conversa está fechada: o trabalho já não está a decorrer entre vocês.</div>'
      : '<div class="filtros rapidas" role="group" aria-label="Respostas rápidas">' + RESPOSTAS_RAPIDAS.map(r => '<button data-a="resposta-rapida" data-id="' + esc(c.id) + '" data-t="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div>'
      + '<form class="escrever" id="escrever" data-id="' + esc(c.id) + '"><label class="icobtn" aria-label="Enviar uma imagem">' + ico('imagem') + '<input type="file" id="msg-img" class="sr" accept="image/jpeg,image/png,image/webp"></label><label class="sr" for="msg-t">Mensagem</label><textarea id="msg-t" rows="1" maxlength="1000" placeholder="Escreve uma mensagem"></textarea><button class="btn pri" aria-label="Enviar mensagem">' + ico('enviar') + '</button></form>')
    + '<div class="acoes ligeiras"><button class="back" data-a="denunciar" data-tipo="conversa" data-id="' + esc(c.id) + '">' + ico('bandeira') + 'Denunciar esta conversa</button></div></div>';
}
