/* Pronex_Link · 15-ecra-estudo.js
   Ecrãs e ações do Estudo (0.14): a lista de dúvidas e de sessões, uma dúvida aberta com as respostas,
   uma sessão de estudo aberta e uma conversa de grupo (equipa de um pedido ou grupo da rede). */
'use strict';
const SEG_ESTUDO = [['duvidas', 'Dúvidas'], ['sessoes', 'Sessões de estudo']];
const ESTADOS_DUVIDA = [['todas', 'Todas'], ['abertas', 'Por resolver'], ['resolvidas', 'Resolvidas'], ['minhas', 'As minhas'], ['respondi', 'Que respondi']];
const chipExame = c => c ? '<span class="chip exame">Exame ' + esc(c) + ' · ' + esc(EXAME(c)) + '</span>' : '';
const nRespostas = n => n + (n === 1 ? ' resposta' : ' respostas');
const quandoSessao = s => dataLonga(s.quando) + ', ' + hora(s.quando) + '–' + hora(Loja.fimSessao(s));

/* ---------- peças ---------- */
function cartaoDuvida(d) {
  const q = Loja.pessoa(d.uid), n = Loja.respostasDe(d.id).length;
  return '<button class="card duv-c" data-a="ver-duvida" data-id="' + esc(d.id) + '"><span class="duv-n' + (d.resolvida ? ' ok' : '') + '" aria-hidden="true"><b>' + n + '</b>' + (n === 1 ? 'resposta' : 'respostas') + '</span>'
    + '<span class="duv-t"><b>' + esc(d.titulo) + '</b><span class="chips">' + chipArea(d.area) + chipExame(d.exame) + (d.resolvida ? '<span class="chip ok">' + ico('certo') + 'Resolvida</span>' : '') + (d.oculto ? '<span class="chip bad">Ocultada</span>' : '') + '</span>'
    + '<span class="muted sm">' + esc(nomeCurto(q)) + ' · ' + quando(d.em) + '<span class="sr">, ' + nRespostas(n) + '</span></span></span></button>';
}
function cartaoSessao(s) {
  const q = Loja.pessoa(s.uid), l = Loja.livres(s), eu = Loja.inscrito(s.id), minha = s.uid === DB.eu, dt = new Date(s.quando);
  return '<button class="card ses-c" data-a="ver-sessao" data-id="' + esc(s.id) + '"><span class="ses-d" aria-hidden="true"><b>' + dt.getDate() + '</b>' + esc(dt.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')) + '</span>'
    + '<span class="duv-t"><b>' + esc(s.titulo) + '</b><span class="muted sm">' + esc(quandoSessao(s)) + ' · ' + esc(s.formato === 'online' ? 'Online' : s.onde || 'Na escola') + '</span>'
    + '<span class="chips">' + chipArea(s.area) + (s.cancelada ? '<span class="chip bad">Cancelada</span>' : Loja.aDecorrer(s) ? '<span class="chip ok">A decorrer</span>' : '') + (minha ? '<span class="chip">Marcaste</span>' : eu ? '<span class="chip ok">' + ico('certo') + 'Inscrito</span>' : '') + (!s.cancelada ? '<span class="chip">' + (l ? l + (l === 1 ? ' lugar livre' : ' lugares livres') : 'Sem lugares') + '</span>' : '') + '</span>'
    + '<span class="muted sm">' + (Loja.eProfessor(s.uid) ? 'Com ' : 'Marcada por ') + esc(nomeCurto(q)) + '</span></span></button>';
}
// No perfil: o que a pessoa já ajudou nas dúvidas.
function blocoEstudoPerfil(p, souEu) {
  const n = Loja.numerosDuvidas(p.uid);
  if (!n.respostas && !souEu) return '';
  return '<div class="card"><h2>Dúvidas</h2>' + (n.respostas ? '<div class="nums mini3"><div class="num"><b>' + n.respostas + '</b><span>' + (n.respostas === 1 ? 'resposta dada' : 'respostas dadas') + '</span></div><div class="num"><b>' + n.escolhidas + '</b><span>' + (n.escolhidas === 1 ? 'resolveu a dúvida' : 'resolveram a dúvida') + '</span></div><div class="num"><b>' + n.votos + '</b><span>' + (n.votos === 1 ? 'voto recebido' : 'votos recebidos') + '</span></div></div>'
    : '<p class="muted">Ainda não respondeste a dúvidas. Quem responde bem fica com a resposta no perfil.</p><button class="btn mini" data-a="ir-duvidas">Ver dúvidas por resolver</button>') + '</div>';
}
// Lembrete no Início: as sessões das próximas 24 horas (e as canceladas em que estava inscrito).
function blocoSessoesInicio() {
  const l = Loja.proximasSessoes(); if (!l.length) return '';
  return '<div class="card reunioes"><h2>Sessões de estudo</h2>' + l.slice(0, 3).map(s => '<button class="conv" data-a="ver-sessao" data-id="' + esc(s.id) + '">' + ico('calendario') + '<div><b>' + esc(s.titulo) + '</b><span>' + (s.cancelada ? 'Cancelada por quem a marcou' : Loja.aDecorrer(s) ? 'A decorrer · ' + esc(s.formato === 'online' ? 'Online' : s.onde) : esc(quandoSessao(s)) + ' · ' + esc(s.formato === 'online' ? 'Online' : s.onde)) + '</span></div></button>').join('') + '</div>';
}

/* ---------- ecrãs ---------- */
function ecraEstudo() {
  const sub = NAV.sub;
  if (sub && sub.t === 'duvida') return ecraDuvida(sub.id);
  if (sub && sub.t === 'sessao') return ecraSessao(sub.id);
  if (sub && sub.t === 'pessoa') return ecraPessoa(sub.uid);
  const seg = SEG_ESTUDO.some(s => s[0] === F.estSeg) ? F.estSeg : 'duvidas';
  const topo = pagina('Estudo') + '<div class="seg" role="group" aria-label="O que mostrar">' + SEG_ESTUDO.map(s => '<button data-a="estudo-seg" data-s="' + s[0] + '" aria-pressed="' + (seg === s[0]) + '">' + s[1] + '</button>').join('') + '</div>';
  if (seg === 'sessoes') {
    const minhas = Loja.sessoes({ minhas: true }), outras = Loja.sessoes({ area: F.estArea }).filter(s => !minhas.includes(s));
    return topo + '<div class="acoes"><button class="btn pri" data-a="nova-sessao">' + ico('mais') + 'Marcar uma sessão</button></div>'
      + '<p class="muted">Explicações e estudo em grupo, na escola ou online. Na app não há pagamentos: quem explica ganha experiência e reconhecimento no perfil.</p>'
      + (minhas.length ? '<div class="col"><h2 class="h2">As tuas sessões</h2><div class="lista">' + minhas.map(cartaoSessao).join('') + '</div></div>' : '')
      + '<div class="col"><h2 class="h2">Próximas sessões</h2>' + filtrosArea('est-area', F.estArea) + (outras.length ? '<div class="lista">' + outras.map(cartaoSessao).join('') + '</div>' : vazio('Não há sessões marcadas', 'Marca uma: escolhe a matéria, o dia, onde é e quantos lugares há.')) + '</div>';
  }
  const l = Loja.duvidas({ area: F.estArea, exame: F.estExame, estado: F.estEstado, q: F.estQ });
  return topo + '<div class="acoes"><button class="btn pri" data-a="nova-duvida">' + ico('ajuda') + 'Fazer uma pergunta</button></div>'
    + '<div class="linhaf"><label class="sr" for="dv-q">Procurar nas dúvidas</label><input type="search" id="dv-q" placeholder="Procurar nas dúvidas" value="' + esc(F.estQ) + '" autocomplete="off">'
    + '<label class="chk">Exame <select id="dv-exame"><option value="">Todos</option>' + EXAMES.map(e => '<option value="' + e[0] + '"' + (F.estExame === e[0] ? ' selected' : '') + '>' + e[0] + ' · ' + esc(e[1]) + '</option>').join('') + '</select></label>'
    + '<label class="chk">Mostrar <select id="dv-estado">' + ESTADOS_DUVIDA.map(e => '<option value="' + e[0] + '"' + (F.estEstado === e[0] ? ' selected' : '') + '>' + e[1] + '</option>').join('') + '</select></label></div>'
    + filtrosArea('est-area', F.estArea)
    + '<div class="lista" id="duv-lista">' + (l.length ? l.slice(0, 80).map(cartaoDuvida).join('') : vazio(F.estQ || F.estExame || F.estArea || F.estEstado !== 'todas' ? 'Nenhuma dúvida com estes filtros' : 'Ainda não há dúvidas', 'Pergunta o que não percebeste numa aula ou num exame. Alunos e professores respondem.')) + '</div>';
}
function ecraDuvida(id) {
  const d = Loja.duvida(id);
  if (!d || !Loja.podeVerDuvida(d)) return btnVoltar() + vazio('Dúvida indisponível', 'Pode ter sido apagada ou ocultada.');
  const q = Loja.pessoa(d.uid), minha = d.uid === DB.eu, rs = Loja.respostasDe(id), mod = Loja.eAdmin(), aMinha = Loja.resposta(id + '_' + DB.eu);
  let h = btnVoltar() + '<div class="narrow col"><article class="card duv">' + '<div class="autor">' + quemBtn(q, (Loja.eProfessor(d.uid) ? 'Professor · ' : '') + 'Perguntou ' + quando(d.em) + (d.editadoEm ? ' · editado' : '')) + '<button class="mais" data-a="duvida-menu" data-id="' + esc(id) + '" aria-label="Mais opções da dúvida">' + ico('mais3') + '</button></div>'
    + '<h1>' + esc(d.titulo) + '</h1><span class="chips">' + chipArea(d.area) + chipExame(d.exame) + (d.resolvida ? '<span class="chip ok">' + ico('certo') + 'Resolvida</span>' : '') + (d.oculto ? '<span class="chip bad">Ocultada pela moderação</span>' : '') + '</span>'
    + (d.texto ? '<p class="txt">' + ligacoes(esc(d.texto)) + '</p>' : '') + (imgSegura(d.img) ? '<img loading="lazy" decoding="async" class="zoom post-img" tabindex="0" src="' + imgSegura(d.img) + '" alt="Imagem da dúvida">' : '')
    + (!minha && !d.oculto ? '<div class="acoes"><button class="btn pri" data-a="responder-duvida" data-id="' + esc(id) + '">' + (aMinha ? ico('editar') + 'Mudar a minha resposta' : ico('conversas') + 'Responder') + '</button></div>' : '')
    + (minha && !rs.length ? '<div class="aviso">Quando alguém responder, recebes um aviso. Se resolveres sozinho, junta a explicação ao texto: ajuda quem tiver a mesma dúvida.</div>' : '')
    + (minha && rs.length && !d.resolvida ? '<div class="aviso">Alguma resposta resolveu a tua dúvida? Carrega em «Resolveu a minha dúvida» para a marcar.</div>' : '') + '</article>';
  h += '<h2 class="h2">' + nRespostas(rs.length) + '</h2>';
  h += rs.length ? rs.map(r => {
    const a = Loja.pessoa(r.uid), prof = Loja.eProfessor(r.uid), esc1 = d.resolvida === r.id, v = Loja.votosDe(r.id), votei = Loja.votei(r.id);
    return '<article class="card dresp' + (esc1 ? ' escolhida' : '') + (prof ? ' prof' : '') + '" aria-label="Resposta de ' + esc(nomeCurto(a)) + '">'
      + (esc1 ? '<span class="selo-r">' + ico('certo') + 'Resolveu a dúvida</span>' : '')
      + '<div class="autor">' + quemBtn(a, quando(r.em) + (r.editadoEm ? ' · editada' : '')) + (prof ? '<span class="chip prof">Professor</span>' : '') + '<button class="mais" data-a="resposta-menu" data-id="' + esc(r.id) + '" aria-label="Mais opções da resposta">' + ico('mais3') + '</button></div>'
      + '<p class="txt">' + ligacoes(esc(r.texto)) + '</p>' + (imgSegura(r.img) ? '<img loading="lazy" decoding="async" class="zoom post-img" tabindex="0" src="' + imgSegura(r.img) + '" alt="Imagem da resposta">' : '') + (r.oculto ? '<p class="bad sm">Ocultada pela moderação</p>' : '')
      + '<div class="acoes curtas">' + (r.uid !== DB.eu ? '<button class="btn mini' + (votei ? ' pri' : '') + '" data-a="votar-resposta" data-id="' + esc(r.id) + '" aria-pressed="' + votei + '">' + ico('gosto') + (votei ? 'Ajudou-me' : 'Ajudou') + ' · ' + v + '</button>' : '<span class="muted sm">' + v + (v === 1 ? ' pessoa disse que ajudou' : ' pessoas disseram que ajudou') + '</span>')
      + (minha ? '<button class="btn mini' + (esc1 ? '' : ' ok') + '" data-a="escolher-resposta" data-d="' + esc(id) + '" data-id="' + esc(r.id) + '" aria-pressed="' + esc1 + '">' + ico('certo') + (esc1 ? 'Tirar a escolha' : 'Resolveu a minha dúvida') + '</button>' : '') + '</div></article>';
  }).join('') : vazio('Ainda sem respostas', minha ? 'Partilha a dúvida com quem sabe da matéria.' : 'Sabes a resposta? Explica passo a passo.');
  if (mod && !minha) h += '<div class="acoes ligeiras"><button class="back" data-a="ocultar-duvida" data-id="' + esc(id) + '" data-o="' + (d.oculto ? '0' : '1') + '">' + ico('escudo') + (d.oculto ? 'Mostrar a dúvida' : 'Ocultar a dúvida (moderação)') + '</button></div>';
  return h + '</div>';
}
function ecraSessao(id) {
  const s = Loja.sessao(id);
  if (!s || (s.oculto && s.uid !== DB.eu && !Loja.eAdmin())) return btnVoltar() + vazio('Sessão indisponível', 'Pode ter sido apagada ou ocultada.');
  const q = Loja.pessoa(s.uid), minha = s.uid === DB.eu, ins = Loja.inscritos(id), eu = Loja.inscrito(id), l = Loja.livres(s), passou = Loja.fimSessao(s) <= Date.now();
  let h = btnVoltar() + '<div class="narrow col"><div class="card ses">' + '<h1>' + esc(s.titulo) + '</h1><span class="chips">' + chipArea(s.area) + (s.cancelada ? '<span class="chip bad">Cancelada</span>' : passou ? '<span class="chip">Já aconteceu</span>' : Loja.aDecorrer(s) ? '<span class="chip ok">A decorrer</span>' : '') + (s.oculto ? '<span class="chip bad">Ocultada pela moderação</span>' : '') + '</span>'
    + '<dl class="ficha"><dt>Quando</dt><dd>' + esc(quandoSessao(s)) + '</dd><dt>' + (s.formato === 'online' ? 'Online' : 'Onde') + '</dt><dd>' + (s.onde ? ligacoes(esc(s.onde)) : s.formato === 'online' ? 'A ligação chega pela conversa' : 'Na escola') + '</dd><dt>Lugares</dt><dd>' + ins.length + ' de ' + s.lugares + (l && !s.cancelada ? ' (' + l + (l === 1 ? ' livre' : ' livres') + ')' : '') + '</dd></dl>'
    + (s.texto ? '<p class="txt">' + ligacoes(esc(s.texto)) + '</p>' : '')
    + '<div class="autor">' + quemBtn(q, (Loja.eProfessor(s.uid) ? 'Professor · ' : '') + 'Marcou ' + quando(s.em)) + '</div><div class="acoes">';
  if (minha) h += !s.cancelada && !passou ? '<button class="btn" data-a="editar-sessao" data-id="' + esc(id) + '">' + ico('editar') + 'Mudar o local ou a descrição</button><button class="btn perigo" data-a="cancelar-sessao" data-id="' + esc(id) + '">Cancelar a sessão</button>' : '';
  else if (!s.cancelada && !passou) h += eu ? '<button class="btn" data-a="desinscrever" data-id="' + esc(id) + '">Desistir</button>' : s.quando > Date.now() ? '<button class="btn pri" data-a="inscrever" data-id="' + esc(id) + '"' + (l ? '' : ' disabled') + '>' + (l ? 'Inscrever-me' : 'Sem lugares') + '</button>' : '';
  if ((minha || eu) && !s.cancelada && !passou) h += '<button class="btn" data-a="sessao-ics" data-id="' + esc(id) + '">' + ico('calendario') + 'Juntar ao calendário</button>';
  if (!minha) h += '<button class="btn" data-a="denunciar" data-tipo="sessao" data-id="' + esc(id) + '">' + ico('bandeira') + 'Denunciar</button>';
  if (!minha && Loja.eAdmin()) h += '<button class="btn" data-a="ocultar-sessao" data-id="' + esc(id) + '" data-o="' + (s.oculto ? '0' : '1') + '">' + (s.oculto ? 'Mostrar' : 'Ocultar (moderação)') + '</button>';
  h += '</div>' + (s.cancelada && eu ? '<div class="aviso warn">Esta sessão foi cancelada por quem a marcou.</div>' : '') + '</div>';
  h += '<div class="card"><h2>Inscritos (' + ins.length + ')</h2>' + (ins.length ? '<div class="lista">' + ins.map(i => '<div class="prop fila">' + quemBtn(Loja.pessoa(i.uid), 'Inscreveu-se ' + quando(i.em)) + (minha && !passou ? '<button class="btn mini" data-a="tirar-inscrito" data-id="' + esc(id) + '" data-uid="' + esc(i.uid) + '">Tirar</button>' : '') + '</div>').join('') + '</div>' : '<p class="muted">Ainda ninguém se inscreveu.</p>') + '</div>';
  return h + '</div>';
}
/* ---------- ações ---------- */
function formDuvida(d) {
  return '<form class="form" novalidate>' + campo('dv-t', 'A tua dúvida numa frase', '<input id="dv-t" maxlength="140" placeholder="Ex.: Como calculo a derivada de uma função composta?" value="' + esc(d ? d.titulo : '') + '">')
    + campo('dv-x', 'Explica melhor (opcional)', '<textarea id="dv-x" rows="5" maxlength="1500" placeholder="O que já tentaste, em que exercício, onde ficaste parado.">' + esc(d ? d.texto : '') + '</textarea>', 'Não escrevas o teu nome completo, o telefone ou o email.')
    + (d ? '' : '<div class="linhaf">' + campo('dv-a', 'Disciplina ou área', '<select id="dv-a">' + AREAS.map(a => '<option value="' + a.id + '"' + ((F.estArea || 'mat') === a.id ? ' selected' : '') + '>' + esc(a.nome) + '</option>').join('') + '</select>')
      + campo('dv-e', 'Exame nacional (opcional)', '<select id="dv-e"><option value="">Nenhum</option>' + EXAMES.map(e => '<option value="' + e[0] + '"' + (F.estExame === e[0] ? ' selected' : '') + '>' + e[0] + ' · ' + esc(e[1]) + '</option>').join('') + '</select>') + '</div>'
      + htmlImagem('dv-i', 'Imagem do exercício (opcional)', ''))
    + ERRO + '<button class="btn pri w">' + (d ? 'Guardar' : 'Publicar a dúvida') + '</button></form>';
}
// Ficheiro de calendário (.ics) para a sessão: abre no calendário do telemóvel ou do computador.
function icsSessao(s) {
  const z = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const t = x => String(x || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pronex_Link//PT', 'BEGIN:VEVENT', 'UID:' + s.id + '@pronex-link', 'DTSTAMP:' + z(Date.now()), 'DTSTART:' + z(s.quando), 'DTEND:' + z(Loja.fimSessao(s)), 'SUMMARY:' + t(s.titulo), 'LOCATION:' + t(s.formato === 'online' ? 'Online' : s.onde), 'DESCRIPTION:' + t((s.texto ? s.texto + '\n' : '') + location.origin + location.pathname + '#sessao/' + s.id), 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + t(s.titulo), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
Object.assign(ACOES, {
  'estudo-seg': d => { F.estSeg = d.s; desenhar(true); },
  'est-area': d => { F.estArea = d.area; desenhar(); },
  'ir-duvidas': () => { F.estSeg = 'duvidas'; F.estEstado = 'abertas'; ir('estudo'); },
  'ver-duvida': d => abrir({ t: 'duvida', id: d.id }, 'estudo'),
  'ver-sessao': d => abrir({ t: 'sessao', id: d.id }, 'estudo'),
  'ver-sala': d => abrirNoMensageiro({ t: 'sala', id: d.id }),
  'nova-duvida': () => folha('Fazer uma pergunta', formDuvida(null), f => {
    const img = campoImagem(f, 'dv-i', '', 900);
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#dv-t', f).value, x = $('#dv-x', f).value; verificarAntes([t, x], () => { const r = Loja.perguntarDuvida({ titulo: t, texto: x, area: $('#dv-a', f).value, exame: $('#dv-e', f).value, img: img() }); if (resultado(r, $('.erro', f), 'Dúvida publicada')) abrir({ t: 'duvida', id: r.id }, 'estudo'); }); });
  }),
  'duvida-menu': d => {
    const x = Loja.duvida(d.id); if (!x) return; const minha = x.uid === DB.eu;
    folha('Dúvida', '<div class="lista">' + '<button class="conv" id="dm-ligar"><div><b>Copiar a ligação</b><span>Para enviar a quem sabe da matéria.</span></div></button>'
      + (minha ? '<button class="conv" id="dm-edit"><div><b>Mudar o texto</b></div></button><button class="conv" id="dm-ap"><div><b>Apagar a dúvida</b><span>Saem também as respostas.</span></div></button>' : '<button class="conv" id="dm-den"><div><b>Denunciar a dúvida</b></div></button>') + '</div>', f => {
      $('#dm-ligar', f).addEventListener('click', () => { fecharFolha(); copiar(location.origin + location.pathname + '#duvida/' + x.id, 'Ligação copiada'); });
      const ed = $('#dm-edit', f), ap = $('#dm-ap', f), dn = $('#dm-den', f);
      if (ed) ed.addEventListener('click', () => { fecharFolha(); folha('Mudar a dúvida', formDuvida(x), g => { $('form', g).addEventListener('submit', e => { e.preventDefault(); const t = $('#dv-t', g).value, tx = $('#dv-x', g).value; verificarAntes([t, tx], () => resultado(Loja.editarDuvida(x.id, { titulo: t, texto: tx }), $('.erro', g), 'Dúvida guardada')); }); }); });
      if (ap) ap.addEventListener('click', () => { fecharFolha(); confirmar('Apagar a dúvida?', 'Saem também as respostas. Não dá para voltar atrás.', 'Apagar', () => { if (resultado(Loja.apagarDuvida(x.id), null, 'Dúvida apagada')) voltar(); }, true); });
      if (dn) dn.addEventListener('click', () => { fecharFolha(); ACOES.denunciar({ tipo: 'duvida', id: x.id }, { autor: x.uid, citacao: x.titulo }); });
    });
  },
  'responder-duvida': d => {
    const x = Loja.duvida(d.id), ant = Loja.resposta(d.id + '_' + DB.eu); if (!x) return;
    folha(ant ? 'Mudar a minha resposta' : 'Responder', '<form class="form" novalidate><p class="muted">' + esc(x.titulo) + '</p>' + campo('rd-t', 'A tua resposta', '<textarea id="rd-t" rows="7" maxlength="2000" placeholder="Explica passo a passo. Se puderes, diz onde se aprende isto (página do manual, aula).">' + esc(ant ? ant.texto : '') + '</textarea>', 'Explica, não dês só o resultado: assim a pessoa aprende.')
      + htmlImagem('rd-i', 'Imagem (opcional)', '') + ERRO + '<button class="btn pri w">' + (ant ? 'Guardar' : 'Publicar a resposta') + '</button></form>', f => {
      const img = campoImagem(f, 'rd-i', ant ? ant.img : '', 900);
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#rd-t', f).value; verificarAntes([t], () => resultado(Loja.responderDuvida(d.id, t, img()), $('.erro', f), ant ? 'Resposta guardada' : 'Resposta publicada')); });
    });
  },
  'resposta-menu': d => {
    const r = Loja.resposta(d.id); if (!r) return; const minha = r.uid === DB.eu, mod = Loja.eAdmin();
    folha('Resposta', '<p class="citacao">' + esc(r.texto.slice(0, 240)) + '</p><div class="lista">' + '<button class="conv" id="rm-cp"><div><b>Copiar o texto</b></div></button>'
      + (minha ? '<button class="conv" id="rm-ed"><div><b>Mudar a resposta</b></div></button><button class="conv" id="rm-ap"><div><b>Apagar a resposta</b></div></button>' : '<button class="conv" id="rm-den"><div><b>Denunciar a resposta</b></div></button>')
      + (mod && !minha ? '<button class="conv" id="rm-oc"><div><b>' + (r.oculto ? 'Mostrar a resposta' : 'Ocultar a resposta') + '</b><span>Moderação</span></div></button>' : '') + '</div>', f => {
      $('#rm-cp', f).addEventListener('click', () => { fecharFolha(); copiar(r.texto, 'Texto copiado'); });
      const ed = $('#rm-ed', f), ap = $('#rm-ap', f), dn = $('#rm-den', f), oc = $('#rm-oc', f);
      if (ed) ed.addEventListener('click', () => { fecharFolha(); ACOES['responder-duvida']({ id: r.duvidaId }); });
      if (ap) ap.addEventListener('click', () => { fecharFolha(); confirmar('Apagar a resposta?', 'Saem também os votos que recebeu.', 'Apagar', () => resultado(Loja.apagarResposta(r.id), null, 'Resposta apagada'), true); });
      if (dn) dn.addEventListener('click', () => { fecharFolha(); ACOES.denunciar({ tipo: 'resposta', id: r.id }, { autor: r.uid, citacao: r.texto }); });
      if (oc) oc.addEventListener('click', () => resultado(Loja.ocultarResposta(r.id, !r.oculto), null, r.oculto ? 'Resposta visível' : 'Resposta ocultada'));
    });
  },
  'votar-resposta': d => { const r = Loja.votar(d.id); if (r.erro) toast(r.erro); desenhar(); },
  'escolher-resposta': d => { const tinha = (Loja.duvida(d.d) || {}).resolvida === d.id; resultado(Loja.escolherResposta(d.d, d.id), null, tinha ? 'Escolha tirada' : 'Dúvida marcada como resolvida'); },
  'ocultar-duvida': d => resultado(Loja.ocultarDuvida(d.id, d.o === '1'), null, d.o === '1' ? 'Dúvida ocultada' : 'Dúvida visível'),
  'nova-sessao': () => {
    const am = new Date(Date.now() + 86400000);
    folha('Marcar uma sessão de estudo', '<form class="form" novalidate>' + campo('ss-t', 'Título', '<input id="ss-t" maxlength="100" placeholder="Ex.: Revisões de Física e Química para o exame">')
      + campo('ss-a', 'Disciplina ou área', '<select id="ss-a">' + AREAS.map(a => '<option value="' + a.id + '"' + ((F.estArea || 'mat') === a.id ? ' selected' : '') + '>' + esc(a.nome) + '</option>').join('') + '</select>')
      + '<div class="linhaf">' + campo('ss-d', 'Dia', '<input type="date" id="ss-d" min="' + hojeISO() + '" value="' + isoDe(am) + '">') + campo('ss-h', 'Hora', '<input type="time" id="ss-h" value="16:00" step="300">') + campo('ss-du', 'Duração', '<select id="ss-du">' + [[30, '30 min'], [45, '45 min'], [60, '1 hora'], [90, '1 h 30'], [120, '2 horas'], [180, '3 horas']].map(x => '<option value="' + x[0] + '"' + (x[0] === 60 ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select>') + '</div>'
      + '<div class="linhaf">' + campo('ss-f', 'Formato', '<select id="ss-f">' + FORMATOS_SESSAO.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select>') + campo('ss-l', 'Lugares', '<input type="number" id="ss-l" min="2" max="30" value="8" inputmode="numeric">') + '</div>'
      + campo('ss-o', 'Onde', '<input id="ss-o" maxlength="120" placeholder="Ex.: Biblioteca, sala 12">', 'Online: diz onde vai estar a ligação (por exemplo, «na conversa do grupo»). Não ponhas a ligação aqui se a sessão for só para alguns.')
      + campo('ss-x', 'O que vão fazer (opcional)', '<textarea id="ss-x" rows="3" maxlength="800" placeholder="Matéria, o que levar, para quem é."></textarea>') + ERRO + '<button class="btn pri w">Marcar a sessão</button></form>', f => {
      $('form', f).addEventListener('submit', e => {
        e.preventDefault(); const dt = $('#ss-d', f).value, h = $('#ss-h', f).value, q = dt && h ? new Date(dt + 'T' + h).getTime() : 0, t = $('#ss-t', f).value, o = $('#ss-o', f).value, x = $('#ss-x', f).value;
        verificarAntes([t, o, x], () => { const r = Loja.marcarSessao({ titulo: t, area: $('#ss-a', f).value, quando: q, duracao: $('#ss-du', f).value, formato: $('#ss-f', f).value, lugares: $('#ss-l', f).value, onde: o, texto: x }); if (resultado(r, $('.erro', f), 'Sessão marcada')) abrir({ t: 'sessao', id: r.id }, 'estudo'); });
      });
    });
  },
  'editar-sessao': d => { const s = Loja.sessao(d.id); if (!s) return;
    folha('Mudar a sessão', '<form class="form" novalidate>' + campo('se-o', 'Onde', '<input id="se-o" maxlength="120" value="' + esc(s.onde) + '">') + campo('se-x', 'O que vão fazer', '<textarea id="se-x" rows="4" maxlength="800">' + esc(s.texto) + '</textarea>') + '<p class="muted sm">Para mudar o dia ou a hora, cancela e marca outra: quem se inscreveu pode já não poder.</p>' + ERRO + '<button class="btn pri w">Guardar</button></form>', f => {
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const o = $('#se-o', f).value, x = $('#se-x', f).value; verificarAntes([o, x], () => resultado(Loja.editarSessao(d.id, { onde: o, texto: x }), $('.erro', f), 'Sessão guardada')); });
    }); },
  'cancelar-sessao': d => confirmar('Cancelar a sessão?', 'Quem se inscreveu vê «Cancelada» no Início. Não dá para voltar atrás.', 'Cancelar a sessão', () => resultado(Loja.cancelarSessao(d.id), null, 'Sessão cancelada'), true),
  inscrever: d => resultado(Loja.inscrever(d.id), null, 'Inscrição feita. Vês o lembrete no Início no dia antes.'),
  desinscrever: d => confirmar('Desistir da sessão?', 'O teu lugar fica livre para outra pessoa.', 'Desistir', () => resultado(Loja.desinscrever(d.id), null, 'Desististe da sessão')),
  'tirar-inscrito': d => confirmar('Tirar esta pessoa da sessão?', 'O lugar fica livre.', 'Tirar', () => resultado(Loja.desinscrever(d.id, d.uid), null, 'Pessoa tirada da sessão')),
  'ocultar-sessao': d => resultado(Loja.ocultarSessao(d.id, d.o === '1'), null, d.o === '1' ? 'Sessão ocultada' : 'Sessão visível'),
  'sessao-ics': d => { const s = Loja.sessao(d.id); if (!s) return; try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icsSessao(s)], { type: 'text/calendar' })); a.download = 'sessao-' + s.id + '.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); } catch (e) { toast('Não foi possível criar o ficheiro.'); } },
  'salamsg-menu': d => {
    const m = DB.salamsgs.find(x => x.id === d.m); if (!m) return; const meu = m.uid === DB.eu;
    folha('Mensagem', '<p class="citacao">' + esc(m.texto || 'Imagem') + '</p><div class="lista">' + (m.texto ? '<button class="conv" id="sm-cp"><div><b>Copiar o texto</b></div></button>' : '')
      + (meu ? '<button class="conv" id="sm-ap"><div><b>Apagar mensagem</b><span>Deixa de aparecer para todo o grupo.</span></div></button>' : '<button class="conv" id="sm-den"><div><b>Denunciar mensagem</b><span>A moderação vê o texto da mensagem.</span></div></button>') + '</div>', f => {
      const cp = $('#sm-cp', f), ap = $('#sm-ap', f), dn = $('#sm-den', f);
      if (cp) cp.addEventListener('click', () => { fecharFolha(); copiar(m.texto, 'Texto copiado'); });
      if (ap) ap.addEventListener('click', () => { fecharFolha(); confirmar('Apagar esta mensagem?', 'Deixa de aparecer na conversa do grupo.', 'Apagar', () => resultado(Loja.apagarMsgSala(m.id), null, 'Mensagem apagada'), true); });
      if (dn) dn.addEventListener('click', () => { fecharFolha(); ACOES.denunciar({ tipo: 'salamsg', id: d.s + '/' + m.id }, { autor: m.uid, citacao: m.texto || 'Imagem' }); });
    });
  }
});
