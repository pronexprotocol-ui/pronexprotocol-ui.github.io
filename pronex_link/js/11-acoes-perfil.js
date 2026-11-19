/* Pronex_Link · 11-acoes-perfil.js
   Ações de perfil (editar, experiências, portefólio), comunidade (recomendar, bloquear, denunciar, moderação),
   avisos, ajuda, definições, conta e modo de demonstração. Junta-se a ACOES, criado em 10-acoes-pedidos.js. */
'use strict';
// Registo das ações do administrador (como na Pronex_Study, na coleção audit). Na demonstração fica em DB.registo.
function registar(acao, alvo, detalhe) {
  if (Nuvem.ativa()) return Nuvem.registar(acao, alvo, detalhe);
  if (!DB.registo) DB.registo = []; DB.registo.unshift({ acao, alvo: String(alvo || ''), detalhe: String(detalhe || ''), em: Date.now() }); DB.registo = DB.registo.slice(0, 100);
}
Object.assign(ACOES, {
  // ----- perfil -----
  'editar-perfil': () => {
    const p = Loja.eu();
    // Com conta da Pronex_Study, o nome, a foto e a cor vêm de lá (uma só identidade nas duas apps).
    const daStudy = Nuvem.ativa() && Nuvem.identidadeStudy();
    const cores = [0, 1, 2, 3, 4, 5].concat(p.cor > 5 ? [p.cor] : []);
    folha('Editar perfil', '<form class="form" novalidate>'
      + (daStudy ? '<div class="aviso">' + avatar(p, 'p') + ' O nome, a foto e a cor são os do teu perfil da Pronex_Study. <a href="../pronex_study/">Muda-os lá</a> e voltam iguais aqui.</div>'
        : htmlImagem('ep-foto', 'Fotografia', 'Opcional. Aparece em vez das iniciais do teu nome.')
          + '<div class="campo"><span class="lb" id="ep-cl">Cor do avatar</span><div class="cores" role="radiogroup" aria-labelledby="ep-cl">' + cores.map(c => '<button type="button" role="radio" class="av g' + c + '" data-cor="' + c + '" aria-checked="' + ((p.cor || 0) === c) + '" aria-label="Cor ' + (c + 1) + '"></button>').join('') + '</div></div>')
      + (daStudy ? '<input type="hidden" id="ep-nome" value="' + esc(p.nome) + '">' : campo('ep-nome', 'Nome', '<input type="text" id="ep-nome" maxlength="40" value="' + esc(p.nome) + '">'))
      + campo('ep-curso', p.tipo === 'professor' ? 'Disciplina ou área' : 'Ano e curso', '<input type="text" id="ep-curso" maxlength="60" value="' + esc(p.curso) + '">')
      + campo('ep-bio', 'O que gostas de fazer?', '<textarea id="ep-bio" maxlength="400">' + esc(p.bio) + '</textarea>', 'O que fazes bem e o que te interessa.')
      + '<div class="campo"><span class="lb" id="ep-al">As tuas áreas</span><div class="marcas" id="ep-areas" role="group" aria-labelledby="ep-al">' + AREAS.map(a => '<button type="button" data-area="' + a.id + '" aria-pressed="' + p.areas.includes(a.id) + '">' + esc(a.nome) + '</button>').join('') + '</div><small>Até 6. É por aqui que te encontram.</small></div>'
      + '<div class="campo" id="ep-niveis"></div>'
      + campo('ep-ferr', 'Programas com que trabalhas', '<input type="text" id="ep-ferr" maxlength="200" value="' + esc(p.ferramentas.join(', ')) + '" placeholder="Blender, Premiere, Photoshop">', 'Separa com vírgulas.')
      + campo('ep-of', 'O que te disponibilizas a fazer?', '<textarea id="ep-of" maxlength="400">' + esc(p.oferece) + '</textarea>', 'Os trabalhos que aceitas fazer para os outros.')
      + campo('ep-horas', 'Quanto tempo tens por semana?', '<input type="text" id="ep-horas" maxlength="40" value="' + esc(p.horas) + '" placeholder="3 horas por semana">', 'Opcional.')
      + '<div class="campo"><span class="lb" id="ep-dl">Dias em que costumas poder</span><div class="marcas" id="ep-dias" role="group" aria-labelledby="ep-dl">' + DIAS_SEMANA.map(k => '<button type="button" data-dia="' + k[0] + '" aria-pressed="' + (p.dias || []).includes(k[0]) + '">' + k[1] + '</button>').join('') + '</div><small>Opcional. Ajuda quem pede a combinar.</small></div>'
      + '<label class="chk"><input type="checkbox" id="ep-disp"' + (p.disponivel ? ' checked' : '') + '><span>Estou disponível para fazer trabalhos. Apareço na lista de freelancers.</span></label>'
      + ERRO + '<button class="btn pri w">Guardar perfil</button></form>', f => {
      const m = $('#ep-areas', f), niv = Object.assign({}, p.niveis), foto = daStudy ? () => p.foto : campoImagem(f, 'ep-foto', p.foto, 256);
      const gc = $('.cores', f); if (gc) radios(gc);
      $('#ep-dias', f).addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
      const corSel = () => { const b = gc && $('[aria-checked=true]', gc); return b ? Number(b.dataset.cor) : p.cor; };
      const sel = () => [...m.querySelectorAll('[aria-pressed=true]')].map(b => b.dataset.area);
      // um nível por área escolhida
      const pintarNiveis = () => { const a = sel(); $('#ep-niveis', f).innerHTML = a.length ? '<span class="lb">O teu nível em cada área</span>' + a.map(id => '<label class="nivl"><span>' + esc(AREA(id).nome) + '</span><select data-niv="' + id + '"><option value="0">Não dizer</option>' + [1, 2, 3].map(n => '<option value="' + n + '"' + (niv[id] === n ? ' selected' : '') + '>' + NIVEIS[n] + '</option>').join('') + '</select></label>').join('') : ''; };
      m.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const on = b.getAttribute('aria-pressed') === 'true'; if (!on && sel().length >= 6) return toast('Podes escolher até 6 áreas.'); b.setAttribute('aria-pressed', !on); pintarNiveis(); });
      f.addEventListener('change', e => { if (e.target.dataset.niv) niv[e.target.dataset.niv] = Number(e.target.value); });
      pintarNiveis();
      $('form', f).addEventListener('submit', e => {
        e.preventDefault(); const v = id => $('#' + id, f).value;
        verificarAntes([v('ep-nome'), v('ep-bio'), v('ep-of')], () => resultado(Loja.editarPerfil({ nome: v('ep-nome'), curso: v('ep-curso'), bio: v('ep-bio'), oferece: v('ep-of'), horas: v('ep-horas'), ferramentas: v('ep-ferr'), disponivel: $('#ep-disp', f).checked, dias: [...f.querySelectorAll('#ep-dias [aria-pressed=true]')].map(b => b.dataset.dia), areas: sel(), niveis: niv, foto: foto(), cor: corSel() }), $('.erro', f), 'Perfil guardado'));
      });
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
      $('form', f).addEventListener('submit', e => { e.preventDefault(); verificarAntes([$('#pc-t', f).value, $('#pc-d', f).value], () => resultado(Loja.guardarPeca({ id: d.id, titulo: $('#pc-t', f).value, area: $('#pc-a', f).value, desc: $('#pc-d', f).value, link: $('#pc-l', f).value, img: img() }), $('.erro', f), x0 ? 'Trabalho atualizado' : 'Trabalho no portefólio')); });
    });
  },
  'ver-peca': d => {
    const p = Loja.pessoa(d.uid), x = p && Loja.portefolio(d.uid).find(k => k.id === d.id); if (!x) return;
    const ped = x.pedidoId && Loja.pedido(x.pedidoId), de = x.de && Loja.pessoa(x.de), meu = d.uid === DB.eu;
    folha(x.titulo, '<div class="capa" style="background-image:' + esc(capaDe(x)) + '"></div><span class="chips">' + chipArea(x.area) + (x.origem === 'trabalho' ? '<span class="chip ok">Feito na ' + APP_NOME + '</span>' : '') + '</span>'
      + (x.desc ? '<p class="txt">' + esc(x.desc) + '</p>' : '')
      + (ped && ped.avaliacao ? '<div class="card"><div>' + estrelas(ped.avaliacao.estrelas) + '</div>' + (ped.avaliacao.texto ? '<p>' + esc(ped.avaliacao.texto) + '</p>' : '') + '<span class="muted sm">Avaliação de ' + esc(de ? de.nome : 'quem pediu') + '</span></div>' : '')
      + (x.link ? '<a class="btn" href="' + esc(x.link) + '" target="_blank" rel="noopener noreferrer">' + ico('ligacao') + 'Abrir a ligação</a>' : '')
      + (meu && x.origem !== 'trabalho' ? '<div class="acoes"><button class="btn" data-a="destacar-peca" data-id="' + esc(x.id) + '">' + ico('selo') + (x.destaque ? 'Tirar o destaque' : 'Pôr em destaque') + '</button><button class="btn" data-a="editar-peca" data-id="' + esc(x.id) + '">' + ico('editar') + 'Editar</button><button class="btn perigo" id="pc-apagar">Tirar do portefólio</button></div>' : ''), f => {
      const b = $('#pc-apagar', f); if (b) b.addEventListener('click', () => confirmar('Tirar do portefólio?', 'O trabalho deixa de aparecer no teu perfil.', 'Tirar', () => { Loja.tirarPeca(x.id); toast('Trabalho retirado'); desenhar(); }, true));
    });
  },

  // ----- comunidade -----
  recomendar: d => { const q = Loja.pessoa(d.uid), ex = Loja.recsDe(d.uid).find(r => r.de === DB.eu); folhaTexto('Recomendar ' + q.nome, 'O que destacas neste aluno?', 'Fica visível no perfil, com o teu nome.', 'Publicar recomendação', 400, t => Loja.recomendar(d.uid, t), 'Recomendação publicada', ex ? ex.texto : ''); },
  'tirar-rec': d => confirmar('Apagar esta recomendação?', 'Deixa de aparecer no perfil.', 'Apagar', () => { Loja.tirarRecomendacao(d.id); desenhar(); }, true),
  bloquear: d => { const q = Loja.pessoa(d.uid); confirmar('Bloquear ' + q.nome + '?', 'Deixam de ver os pedidos um do outro e não podem trabalhar juntos. Podes desbloquear nas definições.', 'Bloquear', () => { if (resultado(Loja.bloquear(d.uid), null, q.nome + ' foi bloqueado')) ir('freelancers'); }, true); },
  desbloquear: d => { Loja.desbloquear(d.uid); toast('Desbloqueado'); desenhar(); },
  // Denúncia com os motivos da Pronex_Study. Para uma mensagem, guarda o texto e o autor para o administrador ver.
  denunciar: (d, extra) => {
    folha('Denunciar', '<form class="form" novalidate><div class="campo"><span class="lb" id="dn-l">Porque estás a denunciar?</span><div class="marcas col1" role="radiogroup" aria-labelledby="dn-l">' + MOTIVOS_DENUNCIA.map(m => '<button type="button" role="radio" aria-checked="false" data-mt="' + m[0] + '">' + esc(m[1]) + '</button>').join('') + '</div><small>O administrador vai rever. Quem publicou não fica a saber que foste tu.</small></div>' + campo('dn-t', 'Queres explicar melhor?', '<textarea id="dn-t" maxlength="400"></textarea>', 'Opcional.') + '<div class="aviso"><b>Precisas de ajuda?</b> ' + esc(AJUDA_DENUNCIA) + '</div>' + ERRO + '<button class="btn pri w">Enviar denúncia</button></form>', f => {
      const g = $('[role=radiogroup]', f); radios(g);
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const sel = $('[aria-checked=true]', g); resultado(Loja.denunciar(d.tipo, d.id, sel ? sel.dataset.mt : '', $('#dn-t', f).value, extra), $('.erro', f), 'Denúncia registada. O administrador vai rever.'); });
    });
  },
  'msg-menu': d => {
    const c = Loja.conversa(d.c), m = c && c.msgs.find(x => x.id === d.m); if (!m) return;
    const meu = m.uid === DB.eu;
    folha('Mensagem', '<p class="citacao">' + esc(m.texto || 'Imagem') + '</p><div class="lista">'
      + (!Loja.conversaFechada(c) ? '<button class="conv" id="mm-resp"><div><b>Responder</b><span>A tua mensagem mostra a que estás a responder.</span></div></button>' : '')
      + (m.texto ? '<button class="conv" id="mm-copiar"><div><b>Copiar o texto</b></div></button>' : '')
      + (meu ? '<button class="conv" id="mm-apagar"><div><b>Apagar mensagem</b><span>Deixa de aparecer para as duas pessoas.</span></div></button>' : '<button class="conv" id="mm-den"><div><b>Denunciar mensagem</b><span>O administrador vê o texto da mensagem.</span></div></button>') + '</div>', f => {
      const cp = $('#mm-copiar', f), ap = $('#mm-apagar', f), dn = $('#mm-den', f), rp = $('#mm-resp', f);
      if (rp) rp.addEventListener('click', () => { fecharFolha(); RESPOSTA = { c: d.c, id: m.id, uid: m.uid, texto: (m.texto || 'Imagem').slice(0, 140) }; desenhar(); const t = $('#msg-t'); if (t) t.focus(); });
      if (cp) cp.addEventListener('click', () => { fecharFolha(); copiar(m.texto, 'Texto copiado'); });
      if (ap) ap.addEventListener('click', () => { fecharFolha(); confirmar('Apagar esta mensagem?', 'Deixa de aparecer na conversa. Não dá para voltar atrás.', 'Apagar', () => resultado(Loja.apagarMensagem(d.c, d.m), null, 'Mensagem apagada'), true); });
      if (dn) dn.addEventListener('click', () => { fecharFolha(); ACOES.denunciar({ tipo: 'msg', id: d.c + '/' + d.m }, { autor: m.uid, citacao: m.texto || 'Imagem' }); });
    });
  },
  // O painel vive no separador «Painel» do meu perfil.
  moderacao: () => { F.perfTab = 'painel'; F.pnSep = 'mod'; ir('perfil'); },
  'perf-tab': d => { F.perfTab = d.t; desenhar(); },
  'pn-sep': d => { F.perfTab = 'painel'; F.pnSep = d.s; if (d.s === 'reg' && Nuvem.ativa()) Nuvem.carregarRegisto(); if (d.s === 'uti' && Nuvem.ativa()) Nuvem.carregarSuspensoes(); if (NAV.v !== 'perfil' || NAV.sub) ir('perfil'); else desenhar(); },
  'pn-mod': d => { const x = DB.denuncias.find(k => k.id === d.id); const r = Loja.moderar(d.id, d.o); if (r.erro) return toast(r.erro); registar(d.o === 'ocultar' ? 'link_ocultar_pedido' : 'link_arquivar_denuncia', x ? x.alvo : '', x ? MOTIVO(x.motivo) : ''); toast(d.o === 'ocultar' ? 'Pedido ocultado' : 'Denúncia arquivada'); desenhar(); },
  'pn-mostrar': d => { Loja.mostrarPedido(d.id); registar('link_mostrar_pedido', d.id, ''); toast('Pedido visível outra vez'); desenhar(); },
  'pn-apagar-msg': d => {
    const x = DB.denuncias.find(k => k.id === d.id); if (!x) return;
    confirmar('Apagar a mensagem denunciada?', 'A mensagem deixa de aparecer na conversa e a denúncia fica resolvida.', 'Apagar mensagem', async () => {
      const [cid, mid] = x.alvo.split('/');
      try {
        if (Nuvem.ativa()) await Nuvem.apagarMsgAdmin(cid, mid);
        else { const c = Loja.conversa(cid); if (c) c.msgs = c.msgs.filter(m => m.id !== mid); }
        Loja.moderar(d.id, 'ocultar'); registar('link_apagar_mensagem', x.alvo, MOTIVO(x.motivo)); toast('Mensagem apagada'); desenhar();
      } catch (e) { toast('Não foi possível apagar a mensagem.'); }
    }, true);
  },
  // Suspender: o mesmo que no painel da Pronex_Study (vale nas duas apps).
  'pn-suspender': d => {
    const q = Loja.pessoa(d.uid);
    folha('Suspender ' + (q ? q.nome : 'esta pessoa'), '<form class="form" novalidate><div class="campo"><span class="lb" id="sp-l">Durante quanto tempo?</span><div class="marcas" role="radiogroup" aria-labelledby="sp-l">' + [[1, '1 dia'], [7, '7 dias'], [30, '30 dias'], [0, 'Sem data de fim']].map((x, i) => '<button type="button" role="radio" aria-checked="' + (i === 1) + '" data-dias="' + x[0] + '">' + x[1] + '</button>').join('') + '</div></div>' + campo('sp-m', 'Motivo', '<input type="text" id="sp-m" maxlength="200">', 'Fica no registo. A pessoa vê que a conta está suspensa.') + '<div class="aviso warn">A suspensão vale na ' + APP_NOME + ' e na Pronex_Study: a pessoa pode ver, mas não pode publicar nem enviar mensagens.</div>' + ERRO + '<button class="btn perigo w">Suspender</button></form>', f => {
      const g = $('[role=radiogroup]', f); radios(g);
      $('form', f).addEventListener('submit', async e => {
        e.preventDefault(); const dias = Number($('[aria-checked=true]', g).dataset.dias), mot = $('#sp-m', f).value.trim(), er = $('.erro', f);
        if (mot.length < 3) { er.textContent = 'Escreve o motivo.'; er.hidden = false; return; }
        try { if (Nuvem.ativa()) await Nuvem.suspender(d.uid, dias, mot); else Loja.suspenderDemo(d.uid, dias, mot); registar('link_suspender', q ? q.nome : d.uid, mot + (dias ? ' (' + dias + ' dias)' : ' (sem fim)')); fecharFolha(); toast((q ? q.nome : 'A pessoa') + ' foi suspensa'); desenhar(); }
        catch (x) { er.textContent = 'Não foi possível suspender.'; er.hidden = false; }
      });
    });
  },
  'pn-retirar': async d => { const q = Loja.pessoa(d.uid); try { if (Nuvem.ativa()) await Nuvem.retirarSuspensao(d.uid); else Loja.retirarSuspensaoDemo(d.uid); registar('link_retirar_suspensao', q ? q.nome : d.uid, ''); toast('Suspensão retirada'); desenhar(); } catch (e) { toast('Não foi possível retirar a suspensão.'); } },

  // ----- avisos e ajuda -----
  avisos: () => {
    const l = Loja.avisos();
    folha('Avisos', l.length ? '<div class="lista">' + l.map(a => '<button class="conv' + (a.lido ? '' : ' novo') + '" data-av="' + esc(a.id) + '"><div><b class="wrap">' + esc(a.texto) + '</b><span>' + quando(a.em) + '</span></div></button>').join('') + '</div>' : vazio('Sem avisos', 'Propostas, convites, entregas e avaliações aparecem aqui.'), f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-av]'); if (!b) return; const a = l.find(x => x.id === b.dataset.av); fecharFolha(); if (a) irParaAlvo(a.alvo); });
    });
    Loja.lerAvisos(); pintarBarras();
  },
  regras: () => folha('Regras da ' + APP_NOME, '<ol class="regras">' + REGRAS.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol><button class="btn pri" data-a="fechar-folha">Percebi</button>'),
  'como-funciona': () => folha('Como funciona', '<div class="aviso troca"><b>A troca</b> ' + esc(TROCA) + '</div><ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><h3>Perguntas frequentes</h3>' + PERGUNTAS_FREQUENTES.map(p => '<details><summary>' + esc(p[0]) + '</summary><p>' + esc(p[1]) + '</p></details>').join('')),
  glossario: () => folha('Palavras da app', '<dl class="dl glossario">' + GLOSSARIO.map(g => '<div><dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd></div>').join('') + '</dl>'),
  guia: () => folha('Bem-vindo à ' + APP_NOME, '<div class="aviso troca"><b>A troca</b> ' + esc(TROCA) + '</div><ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><div class="acoes"><button class="btn" data-a="editar-perfil">Preencher o meu perfil</button><button class="btn pri" data-a="fechar-folha">Começar</button></div>'),
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
