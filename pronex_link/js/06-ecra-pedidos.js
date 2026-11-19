/* Pronex_Link · 06-ecra-pedidos.js
   Lista de pedidos (com pesquisa, área, ordem e separadores) e o detalhe de um pedido,
   que muda conforme quem está a ver (quem pediu, quem faz, visitante) e o estado do trabalho. */
'use strict';
const SEGMENTOS = [['abertos', 'Abertos'], ['meus', 'Os meus pedidos'], ['fazer', 'A fazer por mim'], ['guardados', 'Guardados'], ['historico', 'Histórico']];

function listaPedidos() {
  const q = norm(F.pedQ.trim()), g = Loja.guardados().pedidos;
  let l = DB.pedidos.filter(p => F.pedSeg === 'abertos' ? p.estado === 'aberto' && Loja.visivel(p)
    : F.pedSeg === 'meus' ? p.uid === DB.eu && !['concluido', 'cancelado'].includes(p.estado)
      : F.pedSeg === 'fazer' ? p.freelancerUid === DB.eu && ['em_curso', 'entregue'].includes(p.estado)
        : F.pedSeg === 'guardados' ? g.includes(p.id) && Loja.visivel(p)
          : (p.uid === DB.eu || p.freelancerUid === DB.eu) && ['concluido', 'cancelado'].includes(p.estado));
  if (F.pedArea) l = l.filter(p => p.area === F.pedArea);
  if (q) l = l.filter(p => norm(p.titulo + ' ' + p.precisa + ' ' + AREA(p.area).nome).includes(q));
  if (F.pedOrd === 'prazo') l = l.slice().sort((a, b) => (a.prazo || '9999') < (b.prazo || '9999') ? -1 : (a.prazo || '9999') > (b.prazo || '9999') ? 1 : b.criadoEm - a.criadoEm);
  return l;
}
function ecraPedidos() {
  if (NAV.sub && NAV.sub.t === 'pedido') return ecraPedido(NAV.sub.id);
  const l = listaPedidos(), filtrado = F.pedQ.trim() || F.pedArea, publicar = '<button class="btn pri" data-a="novo-pedido">Publicar um pedido</button>';
  const vz = filtrado ? vazio('Nenhum pedido com esse filtro', 'Experimenta outra área ou apaga a pesquisa.')
    : F.pedSeg === 'abertos' ? vazio('Não há pedidos abertos', 'Sê a primeira pessoa a publicar um.', publicar)
      : F.pedSeg === 'meus' ? vazio('Não tens pedidos a decorrer', 'Explica o que precisas e o que queres alcançar. Quem souber fazer responde-te.', publicar)
        : F.pedSeg === 'fazer' ? vazio('Não estás a fazer trabalhos', 'Responde a um pedido aberto. Se a tua proposta for escolhida, o trabalho aparece aqui.')
          : F.pedSeg === 'guardados' ? vazio('Ainda não guardaste pedidos', 'Carrega no marcador de um pedido para o encontrares aqui depois.')
            : vazio('Ainda sem histórico', 'Os teus trabalhos concluídos e cancelados ficam aqui.');
  return pagina('Pedidos', '<button class="btn pri mini" data-a="novo-pedido">' + ico('mais') + 'Publicar pedido</button>')
    + '<div class="seg" role="group" aria-label="Que pedidos mostrar">' + SEGMENTOS.map(s => '<button data-a="ped-seg" data-s="' + s[0] + '" aria-pressed="' + (F.pedSeg === s[0]) + '">' + s[1] + '</button>').join('') + '</div>'
    + '<div class="linhaf"><label class="procura"><span class="sr">Procurar pedidos</span>' + ico('procurar') + '<input type="search" id="ped-q" placeholder="Procurar pedidos" value="' + esc(F.pedQ) + '" autocomplete="off"></label>'
    + '<label class="sr" for="ped-ord">Ordenar</label><select id="ped-ord"><option value="recentes"' + (F.pedOrd === 'recentes' ? ' selected' : '') + '>Mais recentes</option><option value="prazo"' + (F.pedOrd === 'prazo' ? ' selected' : '') + '>Prazo mais próximo</option></select></div>'
    + filtrosArea('ped-area', F.pedArea)
    + '<div id="ped-lista" class="grelha">' + (l.length ? l.map(p => cartaoPedido(p, F.pedSeg !== 'abertos' && F.pedSeg !== 'guardados')).join('') : '<div class="tudo">' + vz + '</div>') + '</div>';
}

// ----- blocos do detalhe -----
function blocoEntregas(p, f) {
  if (!p.entregas.length || !['entregue', 'concluido', 'em_curso'].includes(p.estado)) return '';
  const ult = p.entregas[p.entregas.length - 1], ant = p.entregas.slice(0, -1);
  let h = '<div class="card entrega"><h2>' + (p.estado === 'em_curso' ? 'Última entrega de ' : 'Entrega de ') + esc(f ? f.nome : 'quem fez') + '</h2><p class="txt">' + esc(ult.texto) + '</p>'
    + (imgSegura(ult.img) ? '<img src="' + imgSegura(ult.img) + '" alt="Imagem da entrega">' : '')
    + (ult.link ? '<a class="btn mini" href="' + esc(ult.link) + '" target="_blank" rel="noopener noreferrer">' + ico('ligacao') + 'Abrir a ligação</a><span class="muted sm quebra">' + esc(ult.link) + '</span>' : '')
    + '<span class="muted sm">Entregue ' + quando(ult.em) + '</span>'
    + (ult.alteracoes ? '<div class="aviso warn">Alterações pedidas: ' + esc(ult.alteracoes) + '</div>' : '');
  if (ant.length) h += '<details><summary>Entregas anteriores (' + ant.length + ')</summary>' + ant.slice().reverse().map(e => '<div class="aval"><p class="txt">' + esc(e.texto) + '</p>' + (e.alteracoes ? '<span class="muted sm">Alterações pedidas: ' + esc(e.alteracoes) + '</span>' : '') + '<span class="muted sm">' + quando(e.em) + '</span></div>').join('') + '</details>';
  return h + '</div>';
}
function blocoTarefas(p) {
  const feitas = p.tarefas.filter(t => t.feito).length;
  return '<div class="card"><h2>Tarefas' + (p.tarefas.length ? ' <span class="muted sm">' + feitas + ' de ' + p.tarefas.length + '</span>' : '') + '</h2>'
    + (p.tarefas.length ? '<div class="barra" role="img" aria-label="' + feitas + ' de ' + p.tarefas.length + ' tarefas feitas"><i style="width:' + Math.round(feitas / p.tarefas.length * 100) + '%"></i></div><ul class="tarefas">' + p.tarefas.map(t => '<li><label class="chk"><input type="checkbox" data-tarefa="' + esc(t.id) + '" data-pd="' + esc(p.id) + '"' + (t.feito ? ' checked' : '') + '><span' + (t.feito ? ' class="feito"' : '') + '>' + esc(t.texto) + '</span></label><button class="x" data-a="tirar-tarefa" data-pd="' + esc(p.id) + '" data-id="' + esc(t.id) + '" aria-label="Apagar a tarefa ' + esc(t.texto) + '">' + ico('fechar') + '</button></li>').join('') + '</ul>' : '<p class="muted">Dividam o trabalho em passos. Os dois podem juntar e marcar tarefas.</p>')
    + '<form class="linhaf" id="f-tarefa" data-pd="' + esc(p.id) + '"><label class="sr" for="tarefa-t">Nova tarefa</label><input type="text" id="tarefa-t" maxlength="100" placeholder="Nova tarefa"><button class="btn mini">Juntar</button></form></div>';
}
function blocoPerguntas(p, meu) {
  const qs = Loja.perguntasDe(p.id);
  if (!qs.length && (meu || p.estado !== 'aberto')) return '';
  return '<div class="card"><h2>Perguntas</h2>' + (qs.length ? qs.map(q => { const a = Loja.pessoa(q.uid); return '<div class="aval"><p><b>' + esc(a ? a.nome : 'Conta apagada') + ':</b> ' + esc(q.texto) + '</p>' + (q.resposta ? '<p class="resp">' + esc(q.resposta) + '</p>' : (meu ? '<button class="btn mini" data-a="responder" data-id="' + esc(q.id) + '">Responder</button>' : '<span class="muted sm">Ainda sem resposta</span>')) + '</div>'; }).join('') : '<p class="muted">Tens dúvidas antes de responder? Pergunta aqui. A pergunta e a resposta ficam visíveis para todos.</p>')
    + (!meu && p.estado === 'aberto' ? '<form class="linhaf" id="f-pergunta" data-pd="' + esc(p.id) + '"><label class="sr" for="pergunta-t">A tua pergunta</label><input type="text" id="pergunta-t" maxlength="300" placeholder="Faz uma pergunta"><button class="btn mini">Perguntar</button></form>' : '') + '</div>';
}
function blocoAvaliacoes(p, dono, f) {
  let h = '';
  if (p.avaliacao) h += '<div class="card"><h2>Avaliação do trabalho</h2><div>' + estrelas(p.avaliacao.estrelas) + '</div>' + (p.avaliacao.texto ? '<p>' + esc(p.avaliacao.texto) + '</p>' : '') + '<span class="muted sm">' + esc(dono ? dono.nome : 'Quem pediu') + ', ' + quando(p.avaliacao.em) + '</span></div>';
  else if (p.semResposta) h += '<div class="aviso">Trabalho fechado sem avaliação: quem pediu não respondeu durante ' + LIMITES.diasSemResposta + ' dias.</div>';
  if (p.avalDono) h += '<div class="card"><h2>Avaliação de quem pediu</h2><div>' + estrelas(p.avalDono.estrelas) + '</div>' + (p.avalDono.texto ? '<p>' + esc(p.avalDono.texto) + '</p>' : '') + '<span class="muted sm">' + esc(f ? f.nome : 'Quem fez') + ', ' + quando(p.avalDono.em) + '</span></div>';
  return h;
}

function ecraPedido(id) {
  const p = Loja.pedido(id);
  if (!p || !Loja.visivel(p)) return btnVoltar() + vazio('Este pedido não está disponível', 'Pode ter sido apagado ou ocultado.');
  const dono = Loja.pessoa(p.uid), f = Loja.pessoa(p.freelancerUid), meu = p.uid === DB.eu, souF = p.freelancerUid === DB.eu;
  const st = ESTADOS[p.estado], props = Loja.propostasDe(p.id), conv = Loja.conversaAtiva(p.id), bConv = conv ? '<button class="btn" data-a="ver-conversa" data-id="' + esc(conv.id) + '">Abrir conversa</button>' : '';

  let esq = '<span class="chips">' + chipArea(p.area) + chipEstado(p.estado) + '<span class="chip">' + esc(TIPO(p.tipo).nome) + '</span>' + chipPrazo(p) + '</span><h1 class="titulo">' + esc(p.titulo) + '</h1>'
    + '<div class="prop fila">' + quemBtn(dono, rotuloTipo(dono) + ', publicado ' + quando(p.criadoEm) + (p.editadoEm ? ', editado' : '')) + '</div>';
  if (p.oculto) esq += '<div class="aviso warn">Este pedido foi ocultado pela moderação e só tu o vês.</div>';
  if (p.estado === 'cancelado') esq += '<div class="aviso warn">Pedido cancelado.' + (p.motivo ? ' Motivo: ' + esc(p.motivo) : '') + '</div>';
  if (st.passo >= 0) esq += '<ol class="passos" aria-label="Percurso do trabalho">' + PASSOS.map((n, i) => '<li class="' + (i < st.passo || p.estado === 'concluido' ? 'feito' : i === st.passo ? 'agora' : '') + '">' + n + '</li>').join('') + '</ol>';
  esq += '<div class="card"><dl class="dl"><div><dt>O que é preciso</dt><dd>' + esc(p.precisa) + '</dd></div><div><dt>O que quer alcançar</dt><dd>' + esc(p.objetivo) + '</dd></div>'
    + (p.finalidade ? '<div><dt>Para que é</dt><dd>' + esc(p.finalidade) + '</dd></div>' : '')
    + (p.formato ? '<div><dt>Como</dt><dd>' + esc(FORMATOS.find(x => x.id === p.formato).nome) + '</dd></div>' : '')
    + (p.prazo ? '<div><dt>Prazo</dt><dd>' + esc(dataPrazo(p.prazo)) + '</dd></div>' : '')
    + '<div><dt>Portefólio</dt><dd>' + (p.portefolioOk ? 'Quem fizer pode mostrar este trabalho no portefólio.' : 'Este trabalho não pode ser mostrado no portefólio.') + '</dd></div></dl>'
    + (imgSegura(p.img) ? '<img class="ref" src="' + imgSegura(p.img) + '" alt="Imagem de referência do pedido">' : '') + '</div>';
  esq += blocoEntregas(p, f) + blocoAvaliacoes(p, dono, f);

  let dir = '';
  if (p.estado === 'aberto' && meu) {
    const pend = props.filter(x => x.estado === 'pendente'), pr = pend.filter(x => x.origem === 'proposta'), cv = pend.filter(x => x.origem === 'convite'), sug = Loja.sugeridos(p);
    dir += '<div class="col"><h2 class="h2">Propostas</h2>' + (pr.length ? pr.map(x => { const q = Loja.pessoa(x.uid), n = Loja.avaliacoes(x.uid).length; return '<div class="prop">' + quemBtn(q, rotuloTipo(q) + ' · ' + quando(x.criadoEm)) + '<p>' + esc(x.texto) + '</p><span class="chips"><span class="chip">' + (x.dias === 1 ? 'Entrega em 1 dia' : 'Entrega em ' + x.dias + ' dias') + '</span>' + (n ? '<span class="chip">' + Loja.media(x.uid).toFixed(1).replace('.', ',') + ' em ' + n + (n === 1 ? ' avaliação' : ' avaliações') + '</span>' : '<span class="chip">Primeiro trabalho aqui</span>') + '</span><div class="acoes"><button class="btn mini" data-a="recusar" data-id="' + esc(x.id) + '">Recusar</button><button class="btn mini pri" data-a="aceitar" data-id="' + esc(x.id) + '">Escolher ' + esc(q ? q.nome.split(' ')[0] : '') + '</button></div></div>'; }).join('') : vazio('Ainda sem propostas', 'Podes esperar ou convidar diretamente alguém.'))
      + cv.map(x => { const q = Loja.pessoa(x.uid); return '<div class="aviso">Convite enviado a <b>' + esc(q ? q.nome : '') + '</b>, ' + quando(x.criadoEm) + '. Falta a resposta.</div>'; }).join('') + '</div>';
    if (sug.length) dir += '<div class="card"><h2>Pessoas que podem ajudar</h2>' + sug.map(q => '<div class="exp">' + quemBtn(q, rotuloTipo(q)) + '<button class="btn mini" data-a="convidar-direto" data-pd="' + esc(p.id) + '" data-uid="' + esc(q.uid) + '">Convidar</button></div>').join('') + '</div>';
    dir += '<div class="acoes"><button class="btn" data-a="editar-pedido" data-id="' + esc(p.id) + '">' + ico('editar') + 'Editar</button><button class="btn" data-a="ir" data-v="freelancers">Procurar pessoas</button><button class="btn perigo" data-a="cancelar-pedido" data-id="' + esc(p.id) + '">Cancelar pedido</button></div>';
  } else if (p.estado === 'aberto') {
    const minha = props.find(x => x.uid === DB.eu && x.estado === 'pendente');
    if (minha && minha.origem === 'convite') dir += '<div class="aviso">Foste convidado para este pedido.</div><div class="acoes"><button class="btn" data-a="recusar" data-id="' + esc(minha.id) + '">Recusar</button><button class="btn pri" data-a="aceitar" data-id="' + esc(minha.id) + '">Aceitar e começar</button></div>';
    else if (minha) dir += '<div class="aviso">A tua proposta foi enviada ' + quando(minha.criadoEm) + '. Falta a resposta de ' + esc(dono ? dono.nome : 'quem pediu') + '.</div><button class="btn" data-a="recusar" data-id="' + esc(minha.id) + '">Retirar a minha proposta</button>';
    else dir += '<button class="btn pri w" data-a="propor" data-id="' + esc(p.id) + '">Enviar proposta</button>';
  } else if (p.estado === 'em_curso' && (meu || souF)) {
    dir += '<div class="aviso">' + (meu ? esc(f ? f.nome : 'Alguém') + ' está a fazer este trabalho.' : 'Estás a fazer este trabalho. Quando acabares, entrega-o aqui.') + '</div><div class="acoes">' + bConv
      + (souF ? '<button class="btn pri" data-a="entregar" data-id="' + esc(p.id) + '">Entregar trabalho</button>' : '') + '</div>' + blocoTarefas(p)
      + (souF ? '<button class="btn perigo" data-a="desistir" data-id="' + esc(p.id) + '">Desistir do trabalho</button>' : '<button class="btn perigo" data-a="cancelar-pedido" data-id="' + esc(p.id) + '">Cancelar pedido</button>');
  } else if (p.estado === 'entregue' && (meu || souF)) {
    dir += meu ? '<div class="acoes"><button class="btn" data-a="alteracoes" data-id="' + esc(p.id) + '">Pedir alterações</button><button class="btn pri" data-a="concluir" data-id="' + esc(p.id) + '">Confirmar e avaliar</button></div>'
      : Loja.podeFecharSozinho(p) ? '<div class="aviso warn">Entregaste há mais de ' + LIMITES.diasSemResposta + ' dias e não houve resposta. Podes fechar o trabalho.</div><button class="btn pri" data-a="fechar-sozinho" data-id="' + esc(p.id) + '">Fechar o trabalho</button>'
        : '<div class="aviso">Entregaste o trabalho. Falta ' + esc(dono ? dono.nome : 'quem pediu') + ' confirmar e avaliar. Se não houver resposta em ' + LIMITES.diasSemResposta + ' dias, podes fechá-lo tu.</div>';
    dir += bConv + blocoTarefas(p);
  } else if (p.estado === 'concluido' && (meu || souF)) {
    if (souF && !p.avalDono) dir += '<button class="btn pri" data-a="avaliar-dono" data-id="' + esc(p.id) + '">Avaliar quem pediu</button>';
    dir += '<div class="acoes"><button class="btn" data-a="comprovativo" data-id="' + esc(p.id) + '">' + ico('selo') + 'Ver comprovativo</button>' + bConv + '</div>';
  }
  if (meu && ['concluido', 'cancelado'].includes(p.estado)) dir += '<button class="btn" data-a="repetir-pedido" data-id="' + esc(p.id) + '">Publicar um pedido igual</button>';
  dir += blocoPerguntas(p, meu);
  dir += '<div class="acoes ligeiras"><button class="back" data-a="partilhar-pedido" data-id="' + esc(p.id) + '">' + ico('partilhar') + 'Copiar para partilhar</button>' + (meu ? '' : '<button class="back" data-a="denunciar" data-tipo="pedido" data-id="' + esc(p.id) + '">' + ico('bandeira') + 'Denunciar</button>') + '</div>';
  return '<div class="linhaf entre">' + btnVoltar() + btnGuardar('pedidos', p.id, p.titulo).replace('class="guard"', 'class="guard solto"') + '</div><div class="two"><div class="col g18">' + esq + '</div><div class="col g18">' + dir + '</div></div>';
}
