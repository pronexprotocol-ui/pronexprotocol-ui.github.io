/* Pronex_Link · 09-ecra-mais.js
   O que fica no fim do Perfil (definições, ajuda, conta, demonstração) e o ecrã de entrada. */
'use strict';
function ecraDefinicoes() {
  const blq = Loja.bloqueados(), dn = DB.denuncias.filter(d => d.estado === 'aberta').length;
  return '<div class="two"><div class="col">'
    + '<div class="card"><h2>Definições</h2><div class="seg" role="group" aria-label="Tema"><button data-a="tema" data-t="escuro" aria-pressed="' + (DB.tema !== 'claro') + '">Tema escuro</button><button data-a="tema" data-t="claro" aria-pressed="' + (DB.tema === 'claro') + '">Tema claro</button></div>'
    + '<div class="seg" role="group" aria-label="Tamanho do texto"><button data-a="texto" data-t="normal" aria-pressed="' + (DB.texto !== 'grande') + '">Texto normal</button><button data-a="texto" data-t="grande" aria-pressed="' + (DB.texto === 'grande') + '">Texto maior</button></div>'
    + (blq.length ? '<div><span class="muted sm">Pessoas bloqueadas</span>' + blq.map(p => '<div class="exp">' + quemBtn(p) + '<button class="btn mini" data-a="desbloquear" data-uid="' + esc(p.uid) + '">Desbloquear</button></div>').join('') + '</div>' : '') + '</div>'
    + '<div class="card"><h2>Ajuda</h2><div class="acoes"><button class="btn mini" data-a="como-funciona">' + ico('ajuda') + 'Como funciona</button><button class="btn mini" data-a="regras">Regras</button><button class="btn mini" data-a="instalar">Instalar a app</button><button class="btn mini" data-a="novidades">Novidades</button></div><p class="muted sm">' + APP_NOME + ' ' + APP_VERSION + '</p></div>'
    + '</div><div class="col">'
    + (Nuvem.ativa()
      ? '<div class="card"><h2>A minha conta</h2><p class="muted">Entraste como <b>' + esc(Nuvem.email()) + '</b>. É a mesma conta da Pronex_Study.</p><div class="acoes"><button class="btn mini" data-a="exportar">' + ico('copiar') + 'Copiar os meus dados</button><button class="btn mini" data-a="sair">Sair da conta</button></div><button class="btn mini perigo" data-a="apagar-conta">Apagar os meus dados da ' + APP_NOME + '</button><p class="muted sm">Apaga o perfil, o portefólio e os pedidos por concluir desta app. A conta da Pronex_Study não é apagada.</p></div>'
        + (Nuvem.admin() ? '<div class="card"><h2>Administração</h2><div class="acoes"><button class="btn mini" data-a="moderacao">' + ico('escudo') + 'Painel de moderação' + (dn ? ' (' + dn + ')' : '') + '</button><button class="btn mini" data-a="professores">Professores confirmados</button></div></div>' : '')
      : '<div class="card"><h2>A minha conta</h2><p class="muted">Podes levar uma cópia de tudo o que a app guarda sobre ti, ou apagar a conta.</p><div class="acoes"><button class="btn mini" data-a="exportar">' + ico('copiar') + 'Copiar os meus dados</button><button class="btn mini perigo" data-a="apagar-conta">Apagar a minha conta</button></div></div>'
        + '<div class="card"><h2>Modo de demonstração</h2><p class="muted">Nesta versão, tudo fica guardado só neste dispositivo e as outras pessoas são exemplos. Usa a app como outra pessoa para experimentares os dois lados de um trabalho.</p><div class="acoes"><button class="btn mini" data-a="trocar">Usar como outra pessoa</button><button class="btn mini" data-a="moderacao">' + ico('escudo') + 'Painel de moderação' + (dn ? ' (' + dn + ')' : '') + '</button><button class="btn mini perigo" data-a="repor">Apagar tudo e recomeçar</button></div>' + (Nuvem.disponivel() ? '<button class="btn mini" data-a="modo-conta">Entrar com a minha conta</button>' : '') + '</div>')
    + '</div></div>';
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
