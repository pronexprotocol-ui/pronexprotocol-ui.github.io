/* Pronex_Link · 11-acoes-perfil.js
   Ações de perfil (editar, experiências, portefólio), comunidade (recomendar, bloquear, denunciar, moderação),
   avisos, ajuda, definições, conta e modo de demonstração. Junta-se a ACOES, criado em 10-acoes-pedidos.js. */
'use strict';
Object.assign(ACOES, {
  // ----- perfil -----
  'editar-perfil': () => {
    const p = Loja.eu();
    folha('Editar perfil', '<form class="form" novalidate>' + htmlImagem('ep-foto', 'Fotografia', 'Opcional. Aparece em vez da inicial do teu nome.')
      + campo('ep-nome', 'Nome', '<input type="text" id="ep-nome" maxlength="40" value="' + esc(p.nome) + '">')
      + campo('ep-curso', p.tipo === 'professor' ? 'Disciplina ou área' : 'Ano e curso', '<input type="text" id="ep-curso" maxlength="60" value="' + esc(p.curso) + '">')
      + campo('ep-bio', 'O que gostas de fazer?', '<textarea id="ep-bio" maxlength="400">' + esc(p.bio) + '</textarea>', 'O que fazes bem e o que te interessa.')
      + '<div class="campo"><span class="lb" id="ep-al">As tuas áreas</span><div class="marcas" id="ep-areas" role="group" aria-labelledby="ep-al">' + AREAS.map(a => '<button type="button" data-area="' + a.id + '" aria-pressed="' + p.areas.includes(a.id) + '">' + esc(a.nome) + '</button>').join('') + '</div><small>Até 6. É por aqui que te encontram.</small></div>'
      + '<div class="campo" id="ep-niveis"></div>'
      + campo('ep-ferr', 'Programas com que trabalhas', '<input type="text" id="ep-ferr" maxlength="200" value="' + esc(p.ferramentas.join(', ')) + '" placeholder="Blender, Premiere, Photoshop">', 'Separa com vírgulas.')
      + campo('ep-of', 'O que te disponibilizas a fazer?', '<textarea id="ep-of" maxlength="400">' + esc(p.oferece) + '</textarea>', 'Os trabalhos que aceitas fazer para os outros.')
      + campo('ep-horas', 'Quanto tempo tens por semana?', '<input type="text" id="ep-horas" maxlength="40" value="' + esc(p.horas) + '" placeholder="3 horas por semana">', 'Opcional.')
      + '<label class="chk"><input type="checkbox" id="ep-disp"' + (p.disponivel ? ' checked' : '') + '><span>Estou disponível para fazer trabalhos. Apareço na lista de freelancers.</span></label>'
      + ERRO + '<button class="btn pri w">Guardar perfil</button></form>', f => {
      const m = $('#ep-areas', f), niv = Object.assign({}, p.niveis), foto = campoImagem(f, 'ep-foto', p.foto, 256);
      const sel = () => [...m.querySelectorAll('[aria-pressed=true]')].map(b => b.dataset.area);
      // um nível por área escolhida
      const pintarNiveis = () => { const a = sel(); $('#ep-niveis', f).innerHTML = a.length ? '<span class="lb">O teu nível em cada área</span>' + a.map(id => '<label class="nivl"><span>' + esc(AREA(id).nome) + '</span><select data-niv="' + id + '"><option value="0">Não dizer</option>' + [1, 2, 3].map(n => '<option value="' + n + '"' + (niv[id] === n ? ' selected' : '') + '>' + NIVEIS[n] + '</option>').join('') + '</select></label>').join('') : ''; };
      m.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const on = b.getAttribute('aria-pressed') === 'true'; if (!on && sel().length >= 6) return toast('Podes escolher até 6 áreas.'); b.setAttribute('aria-pressed', !on); pintarNiveis(); });
      f.addEventListener('change', e => { if (e.target.dataset.niv) niv[e.target.dataset.niv] = Number(e.target.value); });
      pintarNiveis();
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.editarPerfil({ nome: $('#ep-nome', f).value, curso: $('#ep-curso', f).value, bio: $('#ep-bio', f).value, oferece: $('#ep-of', f).value, horas: $('#ep-horas', f).value, ferramentas: $('#ep-ferr', f).value, disponivel: $('#ep-disp', f).checked, areas: sel(), niveis: niv, foto: foto() }), $('.erro', f), 'Perfil guardado'); });
    });
  },
  'partilhar-perfil': () => { const p = Loja.eu(), n = Loja.concluidos(p.uid); copiar(p.nome + ' (' + rotuloTipo(p) + ')\n' + (p.bio ? p.bio + '\n' : '') + (p.areas.length ? 'Áreas: ' + p.areas.map(a => AREA(a).nome).join(', ') + '\n' : '') + (p.ferramentas.length ? 'Programas: ' + p.ferramentas.join(', ') + '\n' : '') + (p.oferece ? 'Faço: ' + p.oferece + '\n' : '') + (n ? 'Trabalhos concluídos na ' + APP_NOME + ': ' + n : ''), 'Apresentação copiada'); },
  'editar-exp': d => {
    const e0 = d.id ? Loja.eu().experiencias.find(x => x.id === d.id) : null, v = e0 || { titulo: '', onde: '', ano: '' };
    folha(e0 ? 'Editar experiência' : 'Juntar experiência', '<form class="form" novalidate>' + campo('ex-t', 'O que fizeste?', '<input type="text" id="ex-t" maxlength="80" value="' + esc(v.titulo) + '" placeholder="Vídeo de apresentação do curso">') + campo('ex-o', 'Onde?', '<input type="text" id="ex-o" maxlength="60" value="' + esc(v.onde) + '" placeholder="Escola, estágio, projeto pessoal…">', 'Opcional.') + campo('ex-a', 'Ano', '<input type="text" id="ex-a" maxlength="9" inputmode="numeric" value="' + esc(v.ano) + '" placeholder="2026">', 'Opcional.') + ERRO + '<button class="btn pri w">Guardar</button></form>', f => {
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.guardarExperiencia({ id: d.id, titulo: $('#ex-t', f).value, onde: $('#ex-o', f).value, ano: $('#ex-a', f).value }), $('.erro', f), 'Experiência guardada'); });
    });
  },
  'tirar-exp': d => confirmar('Apagar esta experiência?', 'Deixa de aparecer no teu perfil.', 'Apagar', () => { Loja.tirarExperiencia(d.id); desenhar(); }, true),
  'editar-peca': d => {
    const p = Loja.eu(), x0 = d.id ? DB.pecas.find(k => k.id === d.id && k.uid === DB.eu) : null, v = x0 || { titulo: '', desc: '', area: p.areas[0] || 'design', img: '', link: '' };
    folha(x0 ? 'Editar trabalho' : 'Juntar trabalho ao portefólio', '<form class="form" novalidate>' + campo('pc-t', 'Título', '<input type="text" id="pc-t" maxlength="80" value="' + esc(v.titulo) + '">') + campo('pc-a', 'Área', '<select id="pc-a">' + opcoesArea(v.area) + '</select>') + campo('pc-d', 'Descrição', '<textarea id="pc-d" maxlength="400">' + esc(v.desc) + '</textarea>', 'O que era pedido e o que fizeste.') + htmlImagem('pc-i', 'Imagem') + campo('pc-l', 'Ligação', '<input type="url" id="pc-l" maxlength="300" value="' + esc(v.link) + '" placeholder="https://">', 'Opcional.') + '<p class="muted sm">Mostra só trabalhos teus e sem dados de outras pessoas.</p>' + ERRO + '<button class="btn pri w">' + (x0 ? 'Guardar' : 'Juntar ao portefólio') + '</button></form>', f => {
      const img = campoImagem(f, 'pc-i', v.img);
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.guardarPeca({ id: d.id, titulo: $('#pc-t', f).value, area: $('#pc-a', f).value, desc: $('#pc-d', f).value, link: $('#pc-l', f).value, img: img() }), $('.erro', f), x0 ? 'Trabalho atualizado' : 'Trabalho no portefólio'); });
    });
  },
  'ver-peca': d => {
    const p = Loja.pessoa(d.uid), x = p && Loja.portefolio(d.uid).find(k => k.id === d.id); if (!x) return;
    const ped = x.pedidoId && Loja.pedido(x.pedidoId), de = x.de && Loja.pessoa(x.de), meu = d.uid === DB.eu;
    folha(x.titulo, '<div class="capa" style="background-image:' + esc(capaDe(x)) + '"></div><span class="chips">' + chipArea(x.area) + (x.origem === 'trabalho' ? '<span class="chip ok">Feito na ' + APP_NOME + '</span>' : '') + '</span>'
      + (x.desc ? '<p class="txt">' + esc(x.desc) + '</p>' : '')
      + (ped && ped.avaliacao ? '<div class="card"><div>' + estrelas(ped.avaliacao.estrelas) + '</div>' + (ped.avaliacao.texto ? '<p>' + esc(ped.avaliacao.texto) + '</p>' : '') + '<span class="muted sm">Avaliação de ' + esc(de ? de.nome : 'quem pediu') + '</span></div>' : '')
      + (x.link ? '<a class="btn" href="' + esc(x.link) + '" target="_blank" rel="noopener noreferrer">' + ico('ligacao') + 'Abrir a ligação</a>' : '')
      + (meu && x.origem !== 'trabalho' ? '<div class="acoes"><button class="btn" data-a="editar-peca" data-id="' + esc(x.id) + '">' + ico('editar') + 'Editar</button><button class="btn perigo" id="pc-apagar">Tirar do portefólio</button></div>' : ''), f => {
      const b = $('#pc-apagar', f); if (b) b.addEventListener('click', () => confirmar('Tirar do portefólio?', 'O trabalho deixa de aparecer no teu perfil.', 'Tirar', () => { Loja.tirarPeca(x.id); toast('Trabalho retirado'); desenhar(); }, true));
    });
  },

  // ----- comunidade -----
  recomendar: d => { const q = Loja.pessoa(d.uid), ex = Loja.recsDe(d.uid).find(r => r.de === DB.eu); folhaTexto('Recomendar ' + q.nome, 'O que destacas neste aluno?', 'Fica visível no perfil, com o teu nome.', 'Publicar recomendação', 400, t => Loja.recomendar(d.uid, t), 'Recomendação publicada', ex ? ex.texto : ''); },
  'tirar-rec': d => confirmar('Apagar esta recomendação?', 'Deixa de aparecer no perfil.', 'Apagar', () => { Loja.tirarRecomendacao(d.id); desenhar(); }, true),
  bloquear: d => { const q = Loja.pessoa(d.uid); confirmar('Bloquear ' + q.nome + '?', 'Deixam de ver os pedidos um do outro e não podem trabalhar juntos. Podes desbloquear nas definições.', 'Bloquear', () => { if (resultado(Loja.bloquear(d.uid), null, q.nome + ' foi bloqueado')) ir('freelancers'); }, true); },
  desbloquear: d => { Loja.desbloquear(d.uid); toast('Desbloqueado'); desenhar(); },
  denunciar: d => {
    folha('Denunciar', '<form class="form" novalidate><div class="campo"><span class="lb" id="dn-l">Qual é o problema?</span><div class="marcas" role="radiogroup" aria-labelledby="dn-l">' + MOTIVOS_DENUNCIA.map(m => '<button type="button" role="radio" aria-checked="false">' + esc(m) + '</button>').join('') + '</div></div>' + campo('dn-t', 'Queres explicar melhor?', '<textarea id="dn-t" maxlength="400"></textarea>', 'Opcional.') + ERRO + '<button class="btn pri w">Enviar denúncia</button><p class="muted sm">Quem denuncia não é identificado junto da pessoa denunciada.</p></form>', f => {
      const g = $('[role=radiogroup]', f); radios(g);
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const s = $('[aria-checked=true]', g); resultado(Loja.denunciar(d.tipo, d.id, s ? s.textContent : '', $('#dn-t', f).value), $('.erro', f), 'Denúncia registada'); });
    });
  },
  moderacao: () => {
    const ab = DB.denuncias.filter(x => x.estado === 'aberta'), oc = DB.pedidos.filter(p => p.oculto);
    const alvo = x => { if (x.tipo === 'pedido') { const p = Loja.pedido(x.alvo); return 'Pedido: ' + (p ? p.titulo : 'apagado'); } if (x.tipo === 'perfil') { const q = Loja.pessoa(x.alvo); return 'Perfil: ' + (q ? q.nome : 'apagado'); } return 'Conversa'; };
    folha('Painel de moderação', '<p class="muted">Com contas verdadeiras, só o administrador vê este painel. As denúncias chegam aqui para serem decididas.</p>'
      + (ab.length ? ab.map(x => { const q = Loja.pessoa(x.uid); return '<div class="prop"><b class="b15">' + esc(alvo(x)) + '</b><span class="chips"><span class="chip bad">' + esc(x.motivo) + '</span><span class="chip">' + esc(q ? q.nome : 'Conta apagada') + ', ' + quando(x.em) + '</span></span>' + (x.texto ? '<p>' + esc(x.texto) + '</p>' : '') + '<div class="acoes">' + (x.tipo === 'pedido' ? '<button class="btn mini perigo" data-mod="ocultar" data-id="' + esc(x.id) + '">Ocultar pedido</button>' : '') + '<button class="btn mini" data-mod="arquivar" data-id="' + esc(x.id) + '">Arquivar</button></div></div>'; }).join('') : vazio('Sem denúncias por ver', 'Quando alguém denunciar um pedido, um perfil ou uma conversa, aparece aqui.'))
      + (oc.length ? '<h3>Pedidos ocultos</h3>' + oc.map(p => '<div class="exp"><div><b>' + esc(p.titulo) + '</b></div><button class="btn mini" data-mostrar="' + esc(p.id) + '">Voltar a mostrar</button></div>').join('') : ''), f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-mod]'), m = e.target.closest('[data-mostrar]'); if (b) { Loja.moderar(b.dataset.id, b.dataset.mod); toast(b.dataset.mod === 'ocultar' ? 'Pedido ocultado' : 'Denúncia arquivada'); desenhar(); ACOES.moderacao(); } else if (m) { Loja.mostrarPedido(m.dataset.mostrar); toast('Pedido visível outra vez'); desenhar(); ACOES.moderacao(); } });
    });
  },

  // ----- avisos e ajuda -----
  avisos: () => {
    const l = Loja.avisos();
    folha('Avisos', l.length ? '<div class="lista">' + l.map(a => '<button class="conv' + (a.lido ? '' : ' novo') + '" data-av="' + esc(a.id) + '"><div><b class="wrap">' + esc(a.texto) + '</b><span>' + quando(a.em) + '</span></div></button>').join('') + '</div>' : vazio('Sem avisos', 'Propostas, convites, entregas e avaliações aparecem aqui.'), f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-av]'); if (!b) return; const a = l.find(x => x.id === b.dataset.av); fecharFolha(); if (a) irParaAlvo(a.alvo); });
    });
    Loja.lerAvisos(); pintarBarras();
  },
  regras: () => folha('Regras da ' + APP_NOME, '<ol class="regras">' + REGRAS.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol><button class="btn pri" data-a="fechar-folha">Percebi</button>'),
  'como-funciona': () => folha('Como funciona', '<ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><h3>Perguntas frequentes</h3>' + PERGUNTAS_FREQUENTES.map(p => '<details><summary>' + esc(p[0]) + '</summary><p>' + esc(p[1]) + '</p></details>').join('')),
  guia: () => folha('Bem-vindo à ' + APP_NOME, '<ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><div class="acoes"><button class="btn" data-a="editar-perfil">Preencher o meu perfil</button><button class="btn pri" data-a="fechar-folha">Começar</button></div>'),
  instalar: () => folha('Instalar a app', '<p class="muted">Quando a app estiver publicada no seu endereço, instala-se assim:</p><h3>Android (Chrome)</h3><ol class="regras"><li>Abre o endereço da app no Chrome.</li><li>Carrega nos três pontos, no canto superior direito.</li><li>Escolhe «Instalar app» ou «Adicionar ao ecrã principal».</li></ol><h3>iPhone (Safari)</h3><ol class="regras"><li>Abre o endereço da app no Safari.</li><li>Carrega no botão Partilhar.</li><li>Escolhe «Adicionar ao ecrã principal».</li></ol>'),
  novidades: () => folha('Novidades', NOVIDADES.map(n => '<div class="aval"><b class="b15">Versão ' + n.v + '</b><span class="muted sm">' + n.d + '</span><ul class="regras">' + n.itens.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('')),

  // ----- conta (Firebase) -----
  'entrar-google': async () => { try { await Nuvem.entrarGoogle(); } catch (e) { toast(Nuvem.msgErro(e)); } },
  recuperar: () => { const v = ($('#en-email') || {}).value || ''; folhaTexto('Recuperar a palavra-passe', 'O teu email', 'Enviamos um link para escolheres uma palavra-passe nova.', 'Enviar link', 120, t => { Nuvem.recuperar(t).then(() => toast('Se o email tiver conta, o link chega em poucos minutos.'), e => toast(Nuvem.msgErro(e))); return { ok: true }; }, '', v); },
  reenviar: () => Nuvem.enviarConfirmacao().then(() => toast('Email enviado. Vê também a pasta de spam.'), e => toast(Nuvem.msgErro(e))),
  'ja-confirmei': () => Nuvem.jaConfirmei().then(ok => { if (!ok) toast('O email ainda não está confirmado. Abre o link que enviámos.'); }),
  sair: () => Nuvem.sair().then(() => { PILHA.length = 0; NAV = { v: 'inicio', sub: null }; Object.assign(F, FILTROS_INICIAIS); }),
  recarregar: () => location.reload(),
  'modo-demo': () => { Nuvem.escolherDemo(true); location.reload(); },
  'modo-conta': () => { Nuvem.escolherDemo(false); location.reload(); },
  professores: async () => {
    let l = []; try { l = await Nuvem.professores(); } catch (e) { return toast('Só o administrador vê esta lista.'); }
    folha('Professores confirmados', '<p class="muted">Só estes emails podem entrar como professor e escrever recomendações.</p>' + (l.length ? l.map(m => '<div class="exp"><div><b class="quebra">' + esc(m) + '</b></div><button class="btn mini" data-tirar="' + esc(m) + '">Tirar</button></div>').join('') : '<p class="muted">Ainda não há professores confirmados.</p>')
      + '<form class="linhaf" id="f-prof"><label class="sr" for="prof-e">Email do professor</label><input type="email" id="prof-e" maxlength="120" placeholder="email do professor"><button class="btn mini">Juntar</button></form>', f => {
      $('#f-prof', f).addEventListener('submit', async e => { e.preventDefault(); const v = $('#prof-e', f).value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('Escreve um email válido.'); try { await Nuvem.juntarProfessor(v); toast('Professor confirmado'); ACOES.professores(); } catch (x) { toast('Não foi possível guardar.'); } });
      f.addEventListener('click', async e => { const b = e.target.closest('[data-tirar]'); if (!b) return; try { await Nuvem.tirarProfessor(b.dataset.tirar); ACOES.professores(); } catch (x) { toast('Não foi possível tirar.'); } });
    });
  },

  // ----- definições, conta e demonstração -----
  tema: d => { Loja.tema(d.t); aplicarTema(); desenhar(); },
  texto: d => { Loja.texto(d.t); aplicarTema(); desenhar(); },
  exportar: () => copiar(Loja.exportar(), 'Os teus dados foram copiados'),
  'apagar-conta': () => confirmar(Nuvem.ativa() ? 'Apagar os teus dados da ' + APP_NOME + '?' : 'Apagar a tua conta?', 'Apaga o teu perfil, o portefólio, os pedidos por concluir, as conversas e as recomendações. Não dá para voltar atrás.', Nuvem.ativa() ? 'Apagar os meus dados' : 'Apagar a minha conta', () => { const r = Loja.apagarConta(); if (r.erro) return toast(r.erro); PILHA.length = 0; NAV = { v: 'inicio', sub: null }; desenhar(true); toast('Conta apagada'); }, true),
  trocar: () => {
    folha('Usar a app como…', '<p class="muted">Serve para experimentares os dois lados: publica um pedido como tu, responde como outra pessoa e volta a ti para a escolheres.</p><div class="lista">' + Object.values(DB.pessoas).map(p => '<button class="conv" data-u="' + esc(p.uid) + '">' + avatar(p) + '<div><b>' + esc(p.nome) + (p.uid === DB.minha ? ' (tu)' : '') + '</b><span>' + esc(rotuloTipo(p)) + '</span></div>' + (p.uid === DB.eu ? '<span class="chip pri">A usar</span>' : '') + '</button>').join('') + '</div>', f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; Loja.usarComo(b.dataset.u); Object.assign(F, FILTROS_INICIAIS); fecharFolha(); toast('A usar como ' + Loja.eu().nome); ir('inicio'); });
    });
  },
  repor: () => confirmar('Apagar tudo e recomeçar?', 'Apaga o teu perfil, os pedidos e as conversas deste dispositivo e repõe os exemplos.', 'Apagar tudo', () => { Loja.repor(); Object.assign(F, FILTROS_INICIAIS); aplicarTema(); ir('inicio'); }, true)
});
