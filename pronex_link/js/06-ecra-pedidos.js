/* Pronex_Link · 06-ecra-pedidos.js
   Lista de pedidos (com pesquisa, área, ordem e separadores) e o detalhe de um pedido,
   que muda conforme quem está a ver (quem pediu, quem faz, visitante) e o estado do trabalho. */
'use strict';
const SEGMENTOS = [['abertos', 'Abertos'], ['meus', 'Os meus pedidos'], ['fazer', 'A fazer por mim'], ['vagas', 'Vagas'], ['guardados', 'Guardados'], ['historico', 'Histórico']];

function listaPedidos() {
  const q = norm(F.pedQ.trim()), g = Loja.guardados().pedidos;
  let l = DB.pedidos.filter(p => F.pedSeg === 'abertos' ? (p.estado === 'aberto' || Loja.vagasLivres(p) > 0) && Loja.visivel(p)
    : F.pedSeg === 'meus' ? p.uid === DB.eu && !['concluido', 'cancelado'].includes(p.estado)
      : F.pedSeg === 'fazer' ? p.freelancerUid === DB.eu && ['em_curso', 'entregue'].includes(p.estado)
        : F.pedSeg === 'guardados' ? g.includes(p.id) && Loja.visivel(p)
          : (p.uid === DB.eu || p.freelancerUid === DB.eu) && ['concluido', 'cancelado'].includes(p.estado));
  if (F.pedArea) l = l.filter(p => p.area === F.pedArea);
  if (F.pedFmt) l = l.filter(p => p.formato === F.pedFmt);
  const esc0 = norm((Loja.eu().escola || '').trim()); if (F.pedEscola && esc0) l = l.filter(p => norm((Loja.pessoa(p.uid) || {}).escola || '') === esc0);
  if (q) l = l.filter(p => norm(p.titulo + ' ' + p.precisa + ' ' + AREA(p.area).nome).includes(q));
  if (F.pedOrd === 'prazo') l = l.slice().sort((a, b) => (a.prazo || '9999') < (b.prazo || '9999') ? -1 : (a.prazo || '9999') > (b.prazo || '9999') ? 1 : b.criadoEm - a.criadoEm);
  return l;
}
function ecraPedidos() {
  if (NAV.sub && NAV.sub.t === 'pedido') return ecraPedido(NAV.sub.id);
  if (NAV.sub && NAV.sub.t === 'vaga') return ecraVaga(NAV.sub.id);
  if (F.pedSeg === 'vagas') return pagina('Pedidos e vagas') + '<div class="seg" role="group" aria-label="Que pedidos mostrar">' + SEGMENTOS.map(s => '<button type="button" data-a="ped-seg" data-s="' + s[0] + '" aria-pressed="' + (F.pedSeg === s[0]) + '">' + s[1] + '</button>').join('') + '</div>' + blocoVagas();
  const l = listaPedidos(), filtrado = F.pedQ.trim() || F.pedArea, publicar = '<button type="button" class="btn pri" data-a="novo-pedido">Publicar um pedido</button>';
  const vz = filtrado ? vazio('Nenhum pedido com esse filtro', 'Experimenta outra área ou apaga a pesquisa.')
    : F.pedSeg === 'abertos' ? vazio('Não há pedidos abertos', 'Sê a primeira pessoa a publicar um.', publicar)
      : F.pedSeg === 'meus' ? vazio('Não tens pedidos a decorrer', 'Explica o que precisas e o que queres alcançar. Quem souber fazer responde-te.', publicar)
        : F.pedSeg === 'fazer' ? vazio('Não estás a fazer trabalhos', 'Responde a um pedido aberto. Se a tua proposta for escolhida, o trabalho aparece aqui.')
          : F.pedSeg === 'guardados' ? vazio('Ainda não guardaste pedidos', 'Carrega no marcador de um pedido para o encontrares aqui depois.')
            : vazio('Ainda sem histórico', 'Os teus trabalhos concluídos e cancelados ficam aqui.');
  return pagina('Pedidos', '<button type="button" class="btn pri mini" data-a="novo-pedido">' + ico('mais') + 'Publicar pedido</button>')
    + '<div class="seg" role="group" aria-label="Que pedidos mostrar">' + SEGMENTOS.map(s => '<button type="button" data-a="ped-seg" data-s="' + s[0] + '" aria-pressed="' + (F.pedSeg === s[0]) + '">' + s[1] + '</button>').join('') + '</div>'
    + '<div class="linhaf"><label class="procura"><span class="sr">Procurar pedidos</span>' + ico('procurar') + '<input type="search" id="ped-q" placeholder="Procurar pedidos" value="' + esc(F.pedQ) + '" autocomplete="off"></label>'
    + '<div class="ordenar"><label class="sr" for="ped-ord">Ordenar</label><select id="ped-ord"><option value="recentes"' + (F.pedOrd === 'recentes' ? ' selected' : '') + '>Mais recentes</option><option value="prazo"' + (F.pedOrd === 'prazo' ? ' selected' : '') + '>Prazo mais próximo</option></select>'
    + '<label class="sr" for="ped-fmt">Formato</label><select id="ped-fmt">' + [['', 'Escola e online'], ['escola', 'Na escola'], ['online', 'Online']].map(o => '<option value="' + o[0] + '"' + (F.pedFmt === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' + ((Loja.eu().escola || '').trim() ? '<label class="chk"><input type="checkbox" id="ped-escola"' + (F.pedEscola ? ' checked' : '') + '>Só da minha escola</label>' : '') + '</div></div>'
    + filtrosArea('ped-area', F.pedArea)
    + '<div id="ped-lista" class="grelha">' + (l.length ? l.map(p => cartaoPedido(p, F.pedSeg !== 'abertos' && F.pedSeg !== 'guardados')).join('') : '<div class="tudo">' + vz + '</div>') + '</div>';
}

// ----- blocos do detalhe -----
function blocoEntregas(p, f) {
  if (!p.entregas.length || !['entregue', 'concluido', 'em_curso'].includes(p.estado)) return '';
  const ult = p.entregas[p.entregas.length - 1], ant = p.entregas.slice(0, -1);
  const nv = p.entregas.length;
  let h = '<div class="card entrega"><h2>' + (p.estado === 'em_curso' ? 'Última entrega de ' : 'Entrega de ') + esc(f ? f.nome : 'quem fez') + (nv > 1 ? ' <span class="chip">Versão ' + nv + '</span>' : '') + '</h2><p class="txt">' + esc(ult.texto) + '</p>'
    + ([ult.img].concat(ult.imgs || []).filter(imgSegura).length ? '<div class="galeria">' + [ult.img].concat(ult.imgs || []).filter(imgSegura).map((x, i) => '<img loading="lazy" decoding="async" class="zoom" tabindex="0" src="' + imgSegura(x) + '" alt="Imagem ' + (i + 1) + ' da entrega">').join('') + '</div>' : '')
    + (ult.link ? '<a class="btn mini" href="' + esc(ult.link) + '" target="_blank" rel="noopener noreferrer">' + ico('ligacao') + 'Abrir a ligação</a><span class="muted sm quebra">' + esc(ult.link) + '</span>' : '')
    + '<span class="muted sm">Entregue ' + quando(ult.em) + '</span>'
    + (ult.alteracoes ? '<div class="aviso warn">Alterações pedidas: ' + esc(ult.alteracoes) + '</div>' : '');
  if (ant.length) h += '<details><summary>Versões anteriores (' + ant.length + ')</summary>' + ant.slice().reverse().map((e, i) => '<div class="aval"><b class="b15">Versão ' + (ant.length - i) + '</b><p class="txt">' + esc(e.texto) + '</p>' + (e.alteracoes ? '<span class="muted sm">Alterações pedidas: ' + esc(e.alteracoes) + '</span>' : '') + '<span class="muted sm">' + quando(e.em) + '</span></div>').join('') + '</details>';
  return h + '</div>';
}
function blocoTarefas(p) {
  const feitas = p.tarefas.filter(t => t.feito).length;
  return '<div class="card"><h2>Tarefas' + (p.tarefas.length ? ' <span class="muted sm">' + feitas + ' de ' + p.tarefas.length + '</span>' : '') + '</h2>'
    + (p.tarefas.length ? '<div class="barra" role="img" aria-label="' + feitas + ' de ' + p.tarefas.length + ' tarefas feitas"><i style="width:' + Math.round(feitas / p.tarefas.length * 100) + '%"></i></div><ul class="tarefas">' + p.tarefas.map(t => '<li><label class="chk"><input type="checkbox" data-tarefa="' + esc(t.id) + '" data-pd="' + esc(p.id) + '"' + (t.feito ? ' checked' : '') + '><span' + (t.feito ? ' class="feito"' : '') + '>' + esc(t.texto) + (t.ate ? ' <i class="ate' + (!t.feito && t.ate < hojeISO() ? ' tarde' : '') + '">até ' + diaCurto(t.ate) + '</i>' : '') + '</span></label><button type="button" class="x" data-a="tirar-tarefa" data-pd="' + esc(p.id) + '" data-id="' + esc(t.id) + '" aria-label="Apagar a tarefa ' + esc(t.texto) + '">' + ico('fechar') + '</button></li>').join('') + '</ul>' : '<p class="muted">Dividam o trabalho em passos. Os dois podem juntar e marcar tarefas.</p>')
    + '<form class="linhaf" id="f-tarefa" data-pd="' + esc(p.id) + '"><label class="sr" for="tarefa-t">Nova tarefa</label><input type="text" id="tarefa-t" maxlength="100" placeholder="Nova tarefa"><label class="sr" for="tarefa-d">Data (opcional)</label><input type="date" id="tarefa-d" class="dataf"><button type="submit" class="btn mini">Juntar</button></form></div>';
}
function blocoPerguntas(p, meu) {
  if (Nuvem.ativa()) Nuvem.verPerguntas(p.id);
  const qs = Loja.perguntasDe(p.id);
  if (!qs.length && (meu || p.estado !== 'aberto')) return '';
  return '<div class="card"><h2>Perguntas</h2>' + (qs.length ? qs.map(q => { const a = Loja.pessoa(q.uid); return '<div class="aval"><p><b>' + esc(a ? a.nome : 'Conta apagada') + ':</b> ' + esc(q.texto) + '</p>' + (q.resposta ? '<p class="resp">' + esc(q.resposta) + '</p>' : (meu ? '<button type="button" class="btn mini" data-a="responder" data-id="' + esc(q.id) + '">Responder</button>' : '<span class="muted sm">Ainda sem resposta</span>')) + '</div>'; }).join('') : '<p class="muted">Tens dúvidas antes de responder? Pergunta aqui. A pergunta e a resposta ficam visíveis para todos.</p>')
    + (!meu && p.estado === 'aberto' ? '<form class="linhaf" id="f-pergunta" data-pd="' + esc(p.id) + '"><label class="sr" for="pergunta-t">A tua pergunta</label><input type="text" id="pergunta-t" maxlength="300" placeholder="Faz uma pergunta"><button type="submit" class="btn mini">Perguntar</button></form>' : '') + '</div>';
}
/* 0.25: histórico do pedido, calculado a partir das datas que o pedido já guarda (não acrescenta nada aos dados). */
function blocoHistorico(p) {
  const ev = [];
  if (p.criadoEm) ev.push([p.criadoEm, 'Pedido publicado']);
  if (p.editadoEm && p.editadoEm !== p.criadoEm) ev.push([p.editadoEm, 'Pedido editado pela última vez']);
  if (p.inicioEm) ev.push([p.inicioEm, 'Proposta aceite: o trabalho começou']);
  (p.entregas || []).forEach((e, i) => { if (e && e.em) ev.push([e.em, 'Entrega ' + (i + 1) + (e.alteracoes ? ' (foram pedidas alterações)' : '')]); });
  if (p.concluidoEm) ev.push([p.concluidoEm, p.semResposta ? 'Fechado por falta de resposta' : 'Trabalho concluído']);
  if (p.avaliacao && p.avaliacao.em) ev.push([p.avaliacao.em + 1, 'Avaliado com ' + p.avaliacao.estrelas + (p.avaliacao.estrelas === 1 ? ' estrela' : ' estrelas')]);
  if (p.estado === 'cancelado') ev.push([Infinity, 'Pedido cancelado']);
  if (ev.length < 2) return '';
  ev.sort((a, b) => a[0] - b[0]);
  return '<details class="card hist1"><summary><b>Histórico</b><span class="muted sm">' + ev.length + ' passos</span></summary><ol>' + ev.map(e => '<li><span>' + esc(e[1]) + '</span><span class="muted sm">' + (isFinite(e[0]) ? esc(dataLonga(e[0])) : '') + '</span></li>').join('') + '</ol></details>';
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
  const dono = Loja.pessoa(p.uid), f = Loja.pessoa(p.freelancerUid), meu = p.uid === DB.eu, souF = p.freelancerUid === DB.eu, souM = Loja.membro(p, DB.eu);
  const st = ESTADOS[p.estado], props = Loja.propostasDe(p.id), conv = Loja.conversaAtiva(p.id), bConv = conv ? '<button type="button" class="btn" data-a="ver-conversa" data-id="' + esc(conv.id) + '">Abrir conversa</button>' : '' + (Loja.naSala('eq~' + p.id) ? '<button type="button" class="btn" data-a="ver-sala" data-id="eq~' + esc(p.id) + '">' + ico('pessoas') + 'Conversa da equipa</button>' : '');

  let esq = '<span class="chips">' + chipArea(p.area) + chipEstado(p.estado) + '<span class="chip">' + esc(TIPO(p.tipo).nome) + '</span>' + chipPrazo(p) + '</span><h1 class="titulo">' + esc(p.titulo) + '</h1>'
    + '<div class="prop fila">' + quemBtn(dono, rotuloTipo(dono) + ', publicado ' + quando(p.criadoEm) + (p.editadoEm ? ', editado' : '')) + (p.estado === 'aberto' && !p.oculto ? '<button type="button" class="btn mini" data-a="partilhar" data-id="' + esc(p.id) + '">' + ico('partilhar') + 'Partilhar</button>' : '') + '</div>';
  if (p.oculto) esq += '<div class="aviso warn">Este pedido foi ocultado pela moderação e só tu o vês.</div>';
  if (p.estado === 'cancelado') esq += '<div class="aviso warn">Pedido cancelado.' + (p.motivo ? ' Motivo: ' + esc(p.motivo) : '') + '</div>';
  if (st.passo >= 0) esq += '<ol class="passos" aria-label="Percurso do trabalho">' + PASSOS.map((n, i) => '<li class="' + (i < st.passo || p.estado === 'concluido' ? 'feito' : i === st.passo ? 'agora' : '') + '">' + n + '</li>').join('') + '</ol><button type="button" class="ligacao sm" data-a="glossario">O que quer dizer cada passo?</button>';
  esq += '<div class="card"><dl class="dl"><div><dt>O que é preciso</dt><dd>' + esc(p.precisa) + '</dd></div><div><dt>O que quer alcançar</dt><dd>' + esc(p.objetivo) + '</dd></div>'
    + (p.finalidade ? '<div><dt>Para que é</dt><dd>' + esc(p.finalidade) + '</dd></div>' : '')
    + (p.formato ? '<div><dt>Como</dt><dd>' + esc(FORMATOS.find(x => x.id === p.formato).nome) + '</dd></div>' : '')
    + (p.prazo ? '<div><dt>Prazo</dt><dd>' + esc(dataPrazo(p.prazo)) + '</dd></div>' : '')
    + '<div><dt>Portefólio</dt><dd>' + (p.portefolioOk ? 'Quem fizer pode mostrar este trabalho no portefólio.' : 'Este trabalho não pode ser mostrado no portefólio.') + '</dd></div></dl>'
    + (imgSegura(p.img) ? '<img loading="lazy" decoding="async" class="ref zoom" tabindex="0" src="' + imgSegura(p.img) + '" alt="Imagem de referência do pedido">' : '') + '</div>';
  esq += blocoAcordo(p, meu, souF) + blocoEntregas(p, f) + blocoMentor(p, meu) + blocoAvaliacoes(p, dono, f) + blocoHistorico(p);

  let dir = '';
  if (p.estado === 'aberto' && meu) {
    const pend = props.filter(x => x.estado === 'pendente'), pr = pend.filter(x => x.origem === 'proposta'), cv = pend.filter(x => x.origem === 'convite'), sug = Loja.sugeridos(p);
    dir += '<div class="col"><h2 class="h2">Propostas' + (pr.length > 1 ? '<button type="button" data-a="comparar-propostas" data-id="' + esc(p.id) + '">Comparar</button>' : '') + '</h2>' + (pr.length ? pr.map(x => { const q = Loja.pessoa(x.uid), n = Loja.avaliacoes(x.uid).length; return '<div class="prop">' + quemBtn(q, rotuloTipo(q) + ' · ' + quando(x.criadoEm)) + '<p>' + esc(x.texto) + '</p><span class="chips"><span class="chip">' + (x.dias === 1 ? 'Entrega em 1 dia' : 'Entrega em ' + x.dias + ' dias') + '</span>' + (n ? '<span class="chip">' + Loja.media(x.uid).toFixed(1).replace('.', ',') + ' em ' + n + (n === 1 ? ' avaliação' : ' avaliações') + '</span>' : '<span class="chip">Primeiro trabalho aqui</span>') + '</span><div class="acoes"><button type="button" class="btn mini" data-a="recusar" data-id="' + esc(x.id) + '">Recusar</button><button type="button" class="btn mini pri" data-a="aceitar" data-id="' + esc(x.id) + '">Escolher ' + esc(q ? q.nome.split(' ')[0] : '') + '</button></div></div>'; }).join('') : vazio('Ainda sem propostas', 'Podes esperar ou convidar diretamente alguém.'))
      + cv.map(x => { const q = Loja.pessoa(x.uid); return '<div class="aviso">Convite enviado a <b>' + esc(q ? q.nome : '') + '</b>, ' + quando(x.criadoEm) + '. Falta a resposta.</div>'; }).join('') + '</div>';
    if (sug.length) dir += '<div class="card"><h2>Pessoas que podem ajudar</h2>' + sug.map(q => '<div class="exp">' + quemBtn(q, rotuloTipo(q)) + '<button type="button" class="btn mini" data-a="convidar-direto" data-pd="' + esc(p.id) + '" data-uid="' + esc(q.uid) + '">Convidar</button></div>').join('') + '</div>';
    dir += '<div class="acoes"><button type="button" class="btn" data-a="editar-pedido" data-id="' + esc(p.id) + '">' + ico('editar') + 'Editar</button><button type="button" class="btn" data-a="ir" data-v="freelancers">Procurar pessoas</button><button type="button" class="btn perigo" data-a="cancelar-pedido" data-id="' + esc(p.id) + '">Cancelar pedido</button></div>';
  } else if (p.estado === 'aberto') {
    const minha = props.find(x => x.uid === DB.eu && x.estado === 'pendente');
    if (minha && minha.origem === 'convite') dir += '<div class="aviso">Foste convidado para este pedido.</div><div class="acoes"><button type="button" class="btn" data-a="recusar" data-id="' + esc(minha.id) + '">Recusar</button><button type="button" class="btn pri" data-a="aceitar" data-id="' + esc(minha.id) + '">Aceitar e começar</button></div>';
    else if (minha) dir += '<div class="aviso">A tua proposta foi enviada ' + quando(minha.criadoEm) + '. Falta a resposta de ' + esc(dono ? dono.nome : 'quem pediu') + '.</div><button type="button" class="btn" data-a="recusar" data-id="' + esc(minha.id) + '">Retirar a minha proposta</button>';
    else dir += '<button type="button" class="btn pri w" data-a="propor" data-id="' + esc(p.id) + '">Enviar proposta</button>';
  } else if (p.estado === 'em_curso' && (meu || souF)) {
    dir += '<div class="aviso">' + (meu ? esc(f ? f.nome : 'Alguém') + ' está a fazer este trabalho.' : 'Estás a fazer este trabalho. Quando acabares, entrega-o aqui.') + '</div><div class="acoes">' + bConv
      + (souF ? '<button type="button" class="btn pri" data-a="entregar" data-id="' + esc(p.id) + '">Entregar trabalho</button>' : '') + '</div>' + blocoTarefas(p)
      + (souF ? '<button type="button" class="btn perigo" data-a="desistir" data-id="' + esc(p.id) + '">Desistir do trabalho</button>' : '<button type="button" class="btn perigo" data-a="cancelar-pedido" data-id="' + esc(p.id) + '">Cancelar pedido</button>');
  } else if (['em_curso', 'entregue'].includes(p.estado) && souM) {
    dir += '<div class="aviso">Fazes parte da equipa deste trabalho. ' + esc(f ? f.nome : 'Quem faz') + ' coordena e entrega; combina a tua parte na conversa.</div><div class="acoes">' + bConv + '</div>'
      + (p.estado === 'em_curso' ? '<button type="button" class="btn perigo" data-a="sair-equipa" data-id="' + esc(p.id) + '">Sair da equipa</button>' : '');
  } else if (Loja.vagasLivres(p) > 0 && !meu) {
    const minha = props.find(x => x.uid === DB.eu && x.estado === 'pendente'), n = Loja.vagasLivres(p);
    dir += '<div class="aviso">Este trabalho já começou, mas a equipa ainda procura ' + (n === 1 ? 'mais 1 pessoa' : 'mais ' + n + ' pessoas') + '.</div>'
      + (minha ? '<div class="aviso">A tua proposta foi enviada ' + quando(minha.criadoEm) + '. Falta a resposta de ' + esc(dono ? dono.nome : 'quem pediu') + '.</div>' : '<button type="button" class="btn pri w" data-a="propor" data-id="' + esc(p.id) + '">Enviar proposta para a equipa</button>');
  } else if (p.estado === 'entregue' && (meu || souF)) {
    dir += meu ? '<div class="acoes"><button type="button" class="btn" data-a="alteracoes" data-id="' + esc(p.id) + '">Pedir alterações</button><button type="button" class="btn pri" data-a="concluir" data-id="' + esc(p.id) + '">Confirmar e avaliar</button></div>'
      : Loja.podeFecharSozinho(p) ? '<div class="aviso warn">Entregaste há mais de ' + LIMITES.diasSemResposta + ' dias e não houve resposta. Podes fechar o trabalho.</div><button type="button" class="btn pri" data-a="fechar-sozinho" data-id="' + esc(p.id) + '">Fechar o trabalho</button>'
        : '<div class="aviso">Entregaste o trabalho. Falta ' + esc(dono ? dono.nome : 'quem pediu') + ' confirmar e avaliar. Se não houver resposta em ' + LIMITES.diasSemResposta + ' dias, podes fechá-lo tu.</div>';
    dir += bConv + blocoTarefas(p);
  } else if (p.estado === 'concluido' && (meu || souF)) {
    if (souF && !p.avalDono) dir += '<button type="button" class="btn pri" data-a="avaliar-dono" data-id="' + esc(p.id) + '">Avaliar quem pediu</button>';
    dir += '<div class="acoes"><button type="button" class="btn" data-a="comprovativo" data-id="' + esc(p.id) + '">' + ico('selo') + 'Ver comprovativo</button>' + bConv + '</div>';
  }
  if (meu && (p.vagas || 1) > 1 && ['em_curso', 'entregue', 'concluido'].includes(p.estado)) dir += blocoEquipa(p);
  if (meu && ['concluido', 'cancelado'].includes(p.estado)) dir += '<button type="button" class="btn" data-a="repetir-pedido" data-id="' + esc(p.id) + '">Publicar um pedido igual</button>';
  dir += blocoPerguntas(p, meu);
  if (!meu && p.estado === 'aberto') { const par = Loja.parecidos(p); if (par.length) dir += '<div class="col"><h2 class="h2">Pedidos parecidos</h2><div class="lista">' + par.map(x => cartaoPedido(x)).join('') + '</div></div>'; }
  dir += '<div class="acoes ligeiras">' + (meu ? '' : '<button type="button" class="back" data-a="denunciar" data-tipo="pedido" data-id="' + esc(p.id) + '">' + ico('bandeira') + 'Denunciar</button>') + '</div>';
  return '<div class="linhaf entre">' + btnVoltar() + btnGuardar('pedidos', p.id, p.titulo).replace('class="guard"', 'class="guard solto"') + '</div><div class="two"><div class="col g18">' + esq + '</div><div class="col g18">' + dir + '</div></div>';
}

// Equipa (para quem pediu): quem está, a conversa com cada pessoa e as propostas para as vagas que faltam.
function blocoEquipa(p) {
  const uids = [p.freelancerUid].concat(Object.keys(p.equipa || {})), livres = Loja.vagasLivres(p);
  const pend = Loja.propostasDe(p.id).filter(x => x.estado === 'pendente' && x.origem === 'proposta');
  return '<div class="card"><h2>Equipa · ' + uids.length + ' de ' + (p.vagas || 1) + '</h2>'
    + uids.map((u, i) => { const q = Loja.pessoa(u), c = Loja.conversaDe(p.id, u); return '<div class="exp">' + quemBtn(q, i === 0 ? 'Coordena e entrega' : 'Na equipa') + (c ? '<button type="button" class="btn mini" data-a="ver-conversa" data-id="' + esc(c.id) + '">Conversa</button>' : '') + '</div>'; }).join('')
    + (livres && p.estado === 'em_curso' ? '<h3 class="h3">' + (livres === 1 ? 'Falta 1 pessoa' : 'Faltam ' + livres + ' pessoas') + '</h3>' + (pend.length ? pend.map(x => { const q = Loja.pessoa(x.uid); return '<div class="prop">' + quemBtn(q, rotuloTipo(q) + ' · ' + quando(x.criadoEm)) + '<p>' + esc(x.texto) + '</p><div class="acoes"><button type="button" class="btn mini" data-a="recusar" data-id="' + esc(x.id) + '">Recusar</button><button type="button" class="btn mini pri" data-a="aceitar" data-id="' + esc(x.id) + '">Juntar à equipa</button></div></div>'; }).join('') : '<p class="muted">Ainda sem propostas para as vagas que faltam. O pedido continua na lista de pedidos abertos.</p>') : '')
    + '</div>';
}

// Acordo do trabalho: o que fica combinado (âmbito, o que se entrega, prazo), proposto por uma pessoa e aceite pela outra.
function blocoAcordo(p, meu, souF) {
  if (!ligado('acordo') || !['em_curso', 'entregue', 'concluido'].includes(p.estado) || !(meu || souF || Loja.membro(p, DB.eu))) return '';
  const a = p.acordo, pode = (meu || souF) && p.estado !== 'concluido';
  if (!a) return pode ? '<div class="card acordo"><h2>Acordo do trabalho</h2><p class="muted">Escrevam o que fica combinado: o que vai ser feito, o que se entrega e até quando. Evita mal-entendidos.</p><button type="button" class="btn mini pri" data-a="propor-acordo" data-id="' + esc(p.id) + '">Propor o acordo</button></div>' : '';
  const autor = Loja.pessoa(a.por);
  return '<div class="card acordo' + (a.aceiteEm ? ' ok' : '') + '"><h2>Acordo do trabalho ' + (a.aceiteEm ? '<span class="chip ok">Aceite pelos dois</span>' : '<span class="chip">À espera de aceitação</span>') + '</h2><p class="txt">' + esc(a.texto) + '</p><span class="muted sm">Proposto por ' + esc(a.por === DB.eu ? 'ti' : (autor ? autor.nome : 'outra pessoa')) + ' ' + quando(a.em) + (a.aceiteEm ? ' · aceite ' + quando(a.aceiteEm) : '') + '</span>'
    + (pode && !a.aceiteEm && a.por !== DB.eu ? '<div class="acoes"><button type="button" class="btn mini pri" data-a="aceitar-acordo" data-id="' + esc(p.id) + '">Aceitar o acordo</button><button type="button" class="btn mini" data-a="propor-acordo" data-id="' + esc(p.id) + '">Propor outro</button></div>' : '')
    + (pode && (a.aceiteEm || a.por === DB.eu) ? '<button type="button" class="ligacao sm" data-a="propor-acordo" data-id="' + esc(p.id) + '">Mudar o acordo</button>' : '') + '</div>';
}
// Professor mentor: acompanha o trabalho e deixa notas (não entra na conversa).
function blocoMentor(p, meu) {
  const m = p.mentorUid && Loja.pessoa(p.mentorUid), souMentor = p.mentorUid === DB.eu, notas = p.notasMentor || [];
  if (!m) return ligado('mentor') && meu && ['aberto', 'em_curso', 'entregue'].includes(p.estado) ? '<button type="button" class="ligacao" data-a="convidar-mentor" data-id="' + esc(p.id) + '">Pedir a um professor para acompanhar este trabalho</button>' : '';
  if (!(meu || souMentor || p.freelancerUid === DB.eu || Loja.membro(p, DB.eu))) return '';
  return '<div class="card"><h2>Acompanhado por ' + esc(m.nome) + '</h2>' + (notas.length ? notas.map(n => '<div class="aval"><p>' + esc(n.texto) + '</p><span class="muted sm">' + quando(n.em) + '</span></div>').join('') : '<p class="muted">Ainda sem notas do mentor.</p>')
    + (souMentor && notas.length < 10 ? '<form class="linhaf" id="f-mentor" data-pd="' + esc(p.id) + '"><label class="sr" for="mentor-t">Nota do mentor</label><input type="text" id="mentor-t" maxlength="300" placeholder="Uma nota para quem pediu e quem faz"><button type="submit" class="btn mini">Juntar nota</button></form>' : '') + '</div>';
}
