/* Pronex_Link · 09-ecra-mais.js
   O que fica no fim do Perfil (definições, ajuda, conta, demonstração) e o ecrã de entrada. */
'use strict';
function ecraDefinicoes() {
  const blq = Loja.bloqueados();
  return '<div class="two"><div class="col">'
    + '<div class="card"><h2>Aparência</h2><div class="seg" role="group" aria-label="Tema"><button data-a="tema" data-t="escuro" aria-pressed="' + (DB.tema !== 'claro') + '">Tema escuro</button><button data-a="tema" data-t="claro" aria-pressed="' + (DB.tema === 'claro') + '">Tema claro</button></div>'
    + '<div class="seg" role="group" aria-label="Tamanho do texto"><button data-a="texto" data-t="normal" aria-pressed="' + (DB.texto !== 'grande') + '">Texto normal</button><button data-a="texto" data-t="grande" aria-pressed="' + (DB.texto === 'grande') + '">Texto maior</button></div></div>'
    + '<div class="card"><h2>Avisos no dispositivo</h2><p class="muted">Mostra um aviso do sistema quando chega uma mensagem, uma proposta ou um convite e a app está em segundo plano. O número de coisas por ver aparece também no ícone da app.</p>'
    + (AVISOS_SISTEMA.suportado() ? '<button class="btn mini' + (AVISOS_SISTEMA.ligado() ? '' : ' pri') + '" data-a="avisos-sistema" aria-pressed="' + AVISOS_SISTEMA.ligado() + '">' + ico('sino') + (AVISOS_SISTEMA.ligado() ? 'Desligar avisos' : 'Ligar avisos') + '</button>' : '<p class="muted sm">Este browser não mostra avisos. No iPhone, instala primeiro a app no ecrã principal.</p>') + '</div>'
    + '<div class="card"><h2>Alertas de pedidos novos</h2><p class="muted">Escolhe as áreas que te interessam: quando aparece um pedido novo numa delas, és avisado (e recebes um aviso no dispositivo, se o ligaste).</p><div class="marcas" role="group" aria-label="Áreas com alerta">' + AREAS.map(a => '<button data-a="alerta-area" data-area="' + a.id + '" aria-pressed="' + alertasArea().includes(a.id) + '">' + esc(a.nome) + '</button>').join('') + '</div></div>'
    + '<div class="card"><h2>Pessoas bloqueadas</h2>' + (blq.length ? blq.map(p => '<div class="exp">' + quemBtn(p) + '<button class="btn mini" data-a="desbloquear" data-uid="' + esc(p.uid) + '">Desbloquear</button></div>').join('') : '<p class="muted">Não bloqueaste ninguém. Bloqueia no perfil de uma pessoa.</p>') + '</div>'
    + '</div><div class="col">'
    + '<div class="card"><h2>Ajuda</h2><div class="acoes"><button class="btn mini" data-a="como-funciona">' + ico('ajuda') + 'Como funciona</button><button class="btn mini" data-a="regras">Regras</button><button class="btn mini" data-a="instalar">Instalar a app</button><button class="btn mini" data-a="novidades">Novidades</button></div><p class="muted sm">' + APP_NOME + ' ' + APP_VERSION + '</p></div>'
    + '<div class="card"><h2>Precisas de ajuda?</h2><p class="muted">' + esc(AJUDA_DENUNCIA) + '</p></div>'
    + '</div></div>';
}
function ecraConta() {
  const sp = Loja.bloqueadoPorSuspensao();
  return (sp ? '<div class="aviso warn">' + esc(sp) + '</div>' : '') + '<div class="two"><div class="col">'
    + (Nuvem.ativa()
      ? '<div class="card"><h2>A minha conta</h2><p class="muted">Entraste como <b>' + esc(Nuvem.email()) + '</b>. É a mesma conta da Pronex_Study: o nome, a foto e a cor vêm de lá.</p><div class="acoes"><button class="btn mini" data-a="exportar">' + ico('copiar') + 'Copiar os meus dados</button><button class="btn mini" data-a="sair">Sair da conta</button></div></div>'
        + '<div class="card"><h2>Apagar os meus dados</h2><p class="muted">Apaga o perfil, o portefólio e os pedidos por concluir desta app. A conta da Pronex_Study não é apagada.</p><button class="btn mini perigo" data-a="apagar-conta">Apagar os meus dados da ' + APP_NOME + '</button></div>'
      : '<div class="card"><h2>A minha conta</h2><p class="muted">Podes levar uma cópia de tudo o que a app guarda sobre ti, ou apagar a conta.</p><div class="acoes"><button class="btn mini" data-a="exportar">' + ico('copiar') + 'Copiar os meus dados</button><button class="btn mini perigo" data-a="apagar-conta">Apagar a minha conta</button></div></div>')
    + '</div><div class="col">'
    + (Nuvem.ativa() && Nuvem.professor() && Loja.eu().tipo === 'aluno' ? '<div class="card"><h2>Foste confirmado como professor</h2><p class="muted">Passas a poder escrever recomendações a alunos. O teu perfil deixa de aparecer na lista de freelancers.</p><button class="btn mini pri" data-a="passar-professor">Passar a professor</button></div>' : '')
    + (Nuvem.ativa() ? '' : '<div class="card"><h2>Modo de demonstração</h2><p class="muted">Tudo fica guardado só neste dispositivo e as outras pessoas são exemplos. Usa a app como outra pessoa para experimentares os dois lados de um trabalho.</p><div class="acoes"><button class="btn mini" data-a="trocar">Usar como outra pessoa</button><button class="btn mini perigo" data-a="repor">Apagar tudo e recomeçar</button></div>' + (Nuvem.disponivel() ? '<button class="btn mini" data-a="modo-conta">Entrar com a minha conta</button>' : '') + '</div>')
    + '</div></div>';
}

/* ---------- Painel de controlo (administrador) ----------
   Como o da Pronex_Study: protegido por PIN (o mesmo, guardado em config/admin), com separadores.
   Na demonstração abre sem PIN, para se ver como é. */
const PN_SEPS = [['res', 'Resumo'], ['mod', 'Moderação'], ['uti', 'Utilizadores'], ['prof', 'Professores'], ['reg', 'Registo']];
function ecraPainel() {
  if (Nuvem.ativa()) { const g = Nuvem.pinEstado(); if (g !== 'aberto') return painelPin(g); }
  const dn = DB.denuncias.filter(d => d.estado === 'aberta');
  if (!PN_SEPS.some(x => x[0] === F.pnSep)) F.pnSep = 'res';
  let h = (Nuvem.ativa() ? '' : '<div class="aviso">Na versão com conta, só a conta de administrador da PRONEX vê o painel, e é pedido o PIN do painel da Pronex_Study.</div>')
    + '<nav class="pnseps" role="tablist" aria-label="Painel">' + PN_SEPS.map(x => '<button role="tab" data-a="pn-sep" data-s="' + x[0] + '" aria-selected="' + (F.pnSep === x[0]) + '">' + x[1] + (x[0] === 'mod' && dn.length ? '<i>' + dn.length + '</i>' : '') + '</button>').join('') + '</nav>';
  if (F.pnSep === 'res') {
    const ped = DB.pedidos, n = e => ped.filter(p => p.estado === e).length, susp = Object.keys(DB.bans || {}).filter(u => Loja.suspensao(u)).length;
    h += '<div class="nums n6">' + [[Object.keys(DB.pessoas).length, 'pessoas'], [n('aberto'), 'pedidos abertos'], [n('em_curso') + n('entregue'), 'trabalhos a decorrer'], [n('concluido'), 'trabalhos concluídos'], [dn.length, 'denúncias por ver'], [susp, 'suspensões ativas']].map(x => '<div class="num"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>').join('') + '</div>'
      + (dn.length ? '<button class="pnaviso" data-a="pn-sep" data-s="mod"><b>' + (dn.length === 1 ? '1 denúncia por ver' : dn.length + ' denúncias por ver') + '</b><span>Abrir a moderação</span></button>' : '');
  } else if (F.pnSep === 'mod') {
    const nomeDe = u => { const q = Loja.pessoa(u); return q ? q.nome : 'Conta apagada'; };
    const alvo = x => x.tipo === 'pedido' ? 'Pedido: ' + ((Loja.pedido(x.alvo) || {}).titulo || 'apagado') : x.tipo === 'perfil' ? 'Perfil: ' + nomeDe(x.alvo) : x.tipo === 'msg' ? 'Mensagem de ' + nomeDe(x.autor) : 'Conversa';
    const autorDe = x => x.tipo === 'perfil' ? x.alvo : x.tipo === 'msg' ? x.autor : x.tipo === 'pedido' ? (Loja.pedido(x.alvo) || {}).uid : '';
    h += dn.length ? dn.map(x => { const a = autorDe(x); return '<div class="prop"><b class="b15">' + esc(alvo(x)) + '</b><span class="chips"><span class="chip bad">' + esc(MOTIVO(x.motivo)) + '</span><span class="chip">' + esc(nomeDe(x.uid)) + ', ' + quando(x.em) + '</span></span>' + (x.citacao ? '<p class="citacao">' + esc(x.citacao) + '</p>' : '') + (x.texto ? '<p>' + esc(x.texto) + '</p>' : '')
      + '<div class="acoes">' + (x.tipo === 'pedido' ? '<button class="btn mini" data-a="ver-pedido" data-id="' + esc(x.alvo) + '">Ver pedido</button><button class="btn mini perigo" data-a="pn-mod" data-o="ocultar" data-id="' + esc(x.id) + '">Ocultar pedido</button>' : '')
      + (x.tipo === 'msg' ? '<button class="btn mini perigo" data-a="pn-apagar-msg" data-id="' + esc(x.id) + '">Apagar mensagem</button>' : '')
      + (a ? '<button class="btn mini perigo" data-a="pn-suspender" data-uid="' + esc(a) + '">Suspender ' + esc(nomeDe(a).split(' ')[0]) + '</button>' : '')
      + '<button class="btn mini" data-a="pn-mod" data-o="arquivar" data-id="' + esc(x.id) + '">Arquivar</button></div></div>'; }).join('') : vazio('Sem denúncias por ver', 'Quando alguém denunciar um pedido, um perfil ou uma mensagem, aparece aqui.');
    const oc = DB.pedidos.filter(p => p.oculto);
    if (oc.length) h += '<div class="card"><h2>Pedidos ocultos</h2>' + oc.map(p => '<div class="exp"><div><b>' + esc(p.titulo) + '</b></div><button class="btn mini" data-a="pn-mostrar" data-id="' + esc(p.id) + '">Voltar a mostrar</button></div>').join('') + '</div>';
  } else if (F.pnSep === 'uti') {
    const q = norm(F.pnQ.trim());
    let l = Object.values(DB.pessoas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    if (q) l = l.filter(p => norm(p.nome + ' ' + p.curso).includes(q));
    h += '<label class="procura"><span class="sr">Procurar pessoas</span>' + ico('procurar') + '<input type="search" id="pn-q" placeholder="Procurar por nome ou curso" value="' + esc(F.pnQ) + '" autocomplete="off"></label>'
      + '<div class="lista">' + l.map(p => { const b = Loja.suspensao(p.uid); return '<div class="pnrow">' + quemBtn(p, rotuloTipo(p) + ' · ' + Loja.concluidos(p.uid) + ' concluídos') + (b ? '<span class="chip bad">Suspensa' + (b.ate ? ' até ' + esc(new Date(b.ate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })) : '') + '</span><button class="btn mini" data-a="pn-retirar" data-uid="' + esc(p.uid) + '">Retirar suspensão</button>' : (p.uid === DB.eu ? '' : '<button class="btn mini perigo" data-a="pn-suspender" data-uid="' + esc(p.uid) + '">Suspender</button>')) + '</div>'; }).join('') + '</div>';
  } else if (F.pnSep === 'prof') {
    const pp = Nuvem.ativa() ? Nuvem.listaPedidosProf() : [];
    if (pp.length) h += '<div class="card"><h2>Pedidos para entrar como professor</h2>' + pp.map(q => '<div class="pnrow"><div><b>' + esc(q.nome) + '</b><span class="muted sm quebra">' + esc(q.email) + (q.disciplina ? ' · ' + esc(q.disciplina) : '') + '</span></div><div class="acoes"><button class="btn mini pri" data-a="pn-prof" data-uid="' + esc(q.uid) + '" data-ok="1">Confirmar</button><button class="btn mini" data-a="pn-prof" data-uid="' + esc(q.uid) + '" data-ok="0">Recusar</button></div></div>').join('') + '</div>';
    h += Nuvem.ativa() ? '<div class="card"><h2>Professores confirmados</h2><p class="muted">Só estes emails entram como professor e escrevem recomendações.</p><button class="btn mini" data-a="professores">Ver e mudar a lista</button></div>'
      : '<div class="card"><h2>Professores confirmados</h2><p class="muted">Com conta, aqui juntas os emails dos professores. Só esses entram como professor e escrevem recomendações.</p></div>';
  } else {
    const r = Nuvem.ativa() ? Nuvem.registo() : (DB.registo || []);
    h += r === null ? '<p class="muted" role="status">A carregar o registo…</p>' : r.length ? '<div class="card"><h2>Últimas ações</h2>' + r.slice(0, 40).map(x => '<div class="aval"><b class="b15">' + esc(x.acao.replace(/^link_/, '').replace(/_/g, ' ')) + '</b><span class="muted sm">' + esc([x.alvo, x.detalhe].filter(Boolean).join(' · ')) + '</span><span class="muted sm">' + (x.em ? quando(x.em) : '') + '</span></div>').join('') + '</div>'
      : vazio('Registo vazio', 'As ações do administrador (ocultar, suspender, apagar) ficam registadas aqui.');
  }
  return h;
}
function painelPin(g) {
  if (g === 'carregar') return '<div class="pinlock"><p class="muted" role="status">A abrir o painel…</p></div>';
  if (g === 'bloqueado') return '<div class="pinlock">' + ico('cadeado') + '<b>Painel bloqueado</b><p class="muted">Demasiadas tentativas erradas. Tenta outra vez daqui a uns minutos.</p></div>';
  const novo = g === 'sem';
  return '<div class="pinlock">' + ico('cadeado') + '<b>' + (novo ? 'Cria o PIN do painel' : 'PIN do painel') + '</b><p class="muted">' + (novo ? 'Segunda proteção do painel, além da tua conta. Entre 4 e 8 algarismos. É o mesmo PIN do painel da Pronex_Study.' : 'É o mesmo PIN do painel da Pronex_Study. Fica aberto 30 minutos.') + '</p>'
    + '<form class="form" id="f-pin"><div class="campo"><label for="pin1">PIN</label><input type="password" id="pin1" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="' + (novo ? 'new-password' : 'off') + '"></div>' + (novo ? '<div class="campo"><label for="pin2">Repete o PIN</label><input type="password" id="pin2" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></div>' : '') + '<p class="erro" role="alert" hidden></p><button class="btn pri w">' + (novo ? 'Guardar PIN' : 'Abrir painel') + '</button></form></div>';
}
// Entrada. Com o Firebase configurado, mostra o passo em que a conta está; sem ele (ou no modo de demonstração), o formulário local.
let ERRO_NUVEM = '';
const marca = () => '<div class="brand"><img src="icons/logo.png" alt=""><b>Pronex<i>_</i>Link</b></div>';
const frase = '<h1>Pede ajuda a quem sabe. Mostra o que sabes fazer.</h1><p>Para alunos e professores da escola. Quem pede explica o que precisa. Quem faz ganha um trabalho real para o portefólio.</p>';
function chaveEntrada() { return Nuvem.disponivel() && !Nuvem.modoDemo() ? 'n-' + (ERRO_NUVEM ? 'erro' : Nuvem.estado()) : 'demo'; }
function ecraEntrada() {
  if (!Nuvem.disponivel() || Nuvem.modoDemo()) return ecraEntradaDemo();
  const demo = '<button type="button" class="ligacao" data-a="modo-demo">Experimentar sem conta (demonstração)</button>';
  if (ERRO_NUVEM) return '<div class="entrada">' + marca() + '<h1>Sem ligação</h1><p>' + esc(ERRO_NUVEM) + '</p><button class="btn pri w" data-a="recarregar">Tentar outra vez</button>' + demo + '</div>';
  const e = Nuvem.estado();
  if (e === 'carregar') return '<div class="entrada">' + marca() + '<p class="muted" role="status">A abrir a ' + APP_NOME + '…</p></div>';
  if (e === 'confirmar') return '<div class="entrada">' + marca() + '<h1>Confirma o teu email</h1><p>Enviámos um link para <b>' + esc(Nuvem.email()) + '</b>. Abre o email, carrega no link e volta aqui.</p><button class="btn pri w" data-a="ja-confirmei">Já confirmei</button><button class="btn w" data-a="reenviar">Enviar o email outra vez</button><button type="button" class="ligacao" data-a="sair">Entrar com outra conta</button></div>';
  if (e === 'anonimo') return '<div class="entrada">' + marca() + '<h1>Precisas de uma conta</h1><p>Na Pronex_Study estás a usar a app sem conta. Para pedires ou fazeres trabalhos aqui, cria uma conta na Pronex_Study (com Google ou com email) e volta.</p><a class="btn pri w" href="../pronex_study/">Abrir a Pronex_Study</a><button type="button" class="ligacao" data-a="sair">Entrar com outra conta</button>' + demo + '</div>';
  if (e === 'dentro') return '<div class="entrada">' + marca() + '<h1>Cria o teu perfil</h1><p>Entraste como <b>' + esc(Nuvem.email()) + '</b>. Falta só o perfil da ' + APP_NOME + '.</p>'
    + '<form class="form" id="f-perfil" novalidate><div class="campo"><label for="en-nome">Como te chamas?</label><input type="text" id="en-nome" maxlength="40" autocomplete="name" required></div>'
    + '<div class="campo"><span class="lb" id="en-tl">És aluno ou professor?</span><div class="opc" role="radiogroup" aria-labelledby="en-tl"><button type="button" role="radio" aria-checked="true" data-tipo="aluno"><b>Aluno</b></button><button type="button" role="radio" aria-checked="false" data-tipo="professor"><b>Professor</b></button></div><small id="en-prof" hidden>' + (Nuvem.professor() ? 'O teu email está confirmado como professor.' : 'Só entra como professor quem o administrador confirmou. Se não for o teu caso, entra como aluno.') + '</small></div>'
    + '<div class="campo"><label for="en-curso" id="en-cl">Ano e curso</label><input type="text" id="en-curso" maxlength="60" placeholder="11.º, Multimédia"></div>'
    + '<label class="chk"><input type="checkbox" id="en-idade">Tenho 13 anos ou mais.</label>'
    + '<label class="chk"><input type="checkbox" id="en-regras"><span>Li e aceito as regras. <button type="button" class="ligacao" data-a="regras">Ler as regras</button></span></label>'
    + '<p class="erro" id="en-erro" role="alert" hidden></p><button class="btn pri w">Criar perfil</button><button type="button" class="ligacao" data-a="sair">Sair desta conta</button></form></div>';
  // fora: entrar
  return '<div class="entrada">' + marca() + frase
    + '<button class="btn branco w" data-a="entrar-google">Entrar com Google</button>'
    + '<form class="form" id="f-email" novalidate><div class="campo"><label for="en-email">Email</label><input type="email" id="en-email" autocomplete="email" maxlength="120"></div><div class="campo"><label for="en-pass">Palavra-passe</label><input type="password" id="en-pass" autocomplete="current-password" maxlength="100"></div><p class="erro" id="en-erro" role="alert" hidden></p><button class="btn pri w">Entrar com email</button><button type="button" class="ligacao" data-a="recuperar">Esqueci-me da palavra-passe</button></form>'
    + '<p class="muted sm">Usa a mesma conta da Pronex_Study. Ainda não tens? <a href="../pronex_study/">Cria-a na Pronex_Study</a> e volta.</p>' + demo + '</div>';
}
function ecraEntradaDemo() {
  return '<div class="entrada">' + marca() + frase
    + '<form class="form" id="f-entrada" novalidate><div class="campo"><label for="en-nome">Como te chamas?</label><input type="text" id="en-nome" maxlength="40" autocomplete="given-name" required></div>'
    + '<div class="campo"><span class="lb" id="en-tl">És aluno ou professor?</span><div class="opc" role="radiogroup" aria-labelledby="en-tl"><button type="button" role="radio" aria-checked="true" data-tipo="aluno"><b>Aluno</b></button><button type="button" role="radio" aria-checked="false" data-tipo="professor"><b>Professor</b></button></div></div>'
    + '<div class="campo"><label for="en-curso" id="en-cl">Ano e curso</label><input type="text" id="en-curso" maxlength="60" placeholder="11.º, Multimédia"></div>'
    + '<label class="chk"><input type="checkbox" id="en-idade">Tenho 13 anos ou mais.</label>'
    + '<label class="chk"><input type="checkbox" id="en-regras"><span>Li e aceito as regras. <button type="button" class="ligacao" data-a="regras">Ler as regras</button></span></label>'
    + '<p class="erro" id="en-erro" role="alert" hidden></p><button class="btn pri w">Entrar</button><p class="muted sm">Versão de demonstração: o que escreveres fica guardado só neste dispositivo.</p>'
    + (Nuvem.disponivel() ? '<button type="button" class="ligacao" data-a="modo-conta">Entrar com a minha conta</button>' : '') + '</form></div>';
}
