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
  // ----- definições, pesquisa, portefólio e painel (0.5–0.8) -----
  'passar-professor': () => { if (resultado(Loja.passarProfessor(), null, 'Agora entras como professor')) desenhar(); },
  'pn-prof': async d => { try { await Nuvem.aprovarProfessor(d.uid, d.ok === '1'); registar(d.ok === '1' ? 'link_aprovar_professor' : 'link_recusar_professor', d.uid, ''); toast(d.ok === '1' ? 'Professor confirmado' : 'Pedido recusado'); desenhar(); } catch (e) { toast('Não foi possível guardar.'); } },
  'ir-alertas': () => { F.perfTab = 'defs'; F.alertasAbertos = true; ir('perfil'); },
  'esconder-passos': () => { try { localStorage.setItem('pl-passos-' + DB.eu, '1'); } catch (e) { /* sem acesso */ } desenhar(); },
  visto: () => { const on = !Loja.eu().visto; Loja.ligarVisto(on); toast(on ? '«Visto» ligado' : '«Visto» desligado'); desenhar(); },
  contraste: d => { try { if (d.t === '1') localStorage.setItem('pl-contraste', '1'); else localStorage.removeItem('pl-contraste'); } catch (e) { /* sem espaço */ } aplicarTema(); desenhar(); },
  'fechar-anuncio': d => { try { localStorage.setItem('pl-anuncio', d.em); } catch (e) { /* sem espaço */ } desenhar(); },
  'pn-anuncio-tirar': async () => { try { if (Nuvem.ativa()) await Nuvem.retirarAnuncio(); else { DB.anuncio = null; Loja.gravarJa && Loja.gravarJa(); } registar('link_retirar_anuncio', 'todos', ''); toast('Anúncio retirado'); desenhar(); } catch (e) { toast('Não foi possível retirar.'); } },
  'pn-arquivar-todas': () => confirmar('Arquivar todas as denúncias?', 'Ficam marcadas como vistas, sem ocultar nada nem suspender ninguém.', 'Arquivar todas', () => { const ab = DB.denuncias.filter(x => x.estado === 'aberta'); ab.forEach(x => Loja.moderar(x.id, 'arquivar')); registar('link_arquivar_todas', ab.length + ' denúncias', ''); toast('Denúncias arquivadas'); desenhar(); }),
  'pn-csv': () => {
    const L = [['tipo', 'chave', 'valor']], sem = 7 * 864e5;
    AREAS.forEach(a => ['aberto', 'em_curso', 'entregue', 'concluido', 'cancelado'].forEach(e => L.push(['area_estado', a.id + '/' + e, DB.pedidos.filter(p => p.area === a.id && p.estado === e).length])));
    for (let i = 11; i >= 0; i--) { const ini = Date.now() - (i + 1) * sem, fim = Date.now() - i * sem, dia = new Date(ini).toISOString().slice(0, 10); L.push(['semana_pedidos', dia, DB.pedidos.filter(p => p.criadoEm >= ini && p.criadoEm < fim).length]); L.push(['semana_concluidos', dia, DB.pedidos.filter(p => p.concluidoEm >= ini && p.concluidoEm < fim).length]); }
    L.push(['total', 'pessoas', Object.keys(DB.pessoas).length], ['total', 'alunos', Object.values(DB.pessoas).filter(p => p.tipo === 'aluno').length], ['total', 'professores', Object.values(DB.pessoas).filter(p => p.tipo === 'professor').length]);
    const csv = L.map(r => r.join(';')).join('\n'), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'pronex_link_numeros_' + hojeISO() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    registar('link_exportar_csv', 'números', ''); toast('CSV descarregado');
  },
  'destacar-peca': d => { const r = Loja.destacarPeca(d.id); if (r.erro) return toast(r.erro); fecharFolha(); toast(r.on ? 'Trabalho em destaque no teu portefólio' : 'Destaque retirado'); desenhar(); },
  'alerta-area': d => { F.alertasAbertos = true; let l = alertasArea(); l = l.includes(d.area) ? l.filter(x => x !== d.area) : l.concat(d.area); try { localStorage.setItem('pl-alertas', JSON.stringify(l)); } catch (e) { /* sem espaço */ } desenhar(); },
  'imprimir-portefolio': d => {
    const p = Loja.pessoa(d.uid || DB.eu); if (!p) return; const pf = Loja.portefolio(p.uid), st = Loja.estatisticas(p.uid), recs = Loja.recsDe ? Loja.recsDe(p.uid) : [];
    imprimirHTML('Portefólio · ' + p.nome, '<h1>' + esc(p.nome) + '</h1><p class="m">' + esc(rotuloTipo(p)) + (p.curso ? ' · ' + esc(p.curso) : '') + '</p>'
      + (p.bio ? '<p>' + esc(p.bio) + '</p>' : '') + (p.areas.length ? '<p><b>Áreas:</b> ' + p.areas.map(a => esc(AREA(a).nome) + (p.niveis[a] ? ' (' + esc(NIVEIS[p.niveis[a]]) + ')' : '')).join(', ') + '</p>' : '')
      + (p.ferramentas.length ? '<p><b>Programas:</b> ' + esc(p.ferramentas.join(', ')) + '</p>' : '') + (p.oferece ? '<p><b>Faço:</b> ' + esc(p.oferece) + '</p>' : '')
      + '<p class="m">' + st.feitos + (st.feitos === 1 ? ' trabalho concluído' : ' trabalhos concluídos') + ' na ' + esc(APP_NOME) + (Loja.media(p.uid) ? ' · avaliação média ' + Loja.media(p.uid).toFixed(1) + ' em 5' : '') + '</p>'
      + (pf.length ? '<h2>Portefólio</h2>' + pf.map(x => '<div class="peca">' + (imgSegura(x.img) ? '<img src="' + imgSegura(x.img) + '" alt="">' : '') + '<div><b>' + esc(x.titulo) + '</b> <span class="m">· ' + esc(AREA(x.area).nome) + (x.origem === 'trabalho' ? ' · feito na ' + esc(APP_NOME) : '') + '</span>' + (x.desc ? '<br>' + esc(x.desc) : '') + (x.link ? '<br><span class="m">' + esc(x.link) + '</span>' : '') + '</div></div>').join('') : '')
      + (recs.length ? '<h2>Recomendações de professores</h2>' + recs.map(r => { const q = Loja.pessoa(r.de); return '<p>«' + esc(r.texto) + '»<br><span class="m">' + esc(q ? q.nome : 'Professor') + '</span></p>'; }).join('') : ''));
  },
  procurar: () => {
    folha('Procurar', '<div class="campo"><label class="sr" for="pg-q">Procurar pedidos, pessoas e conversas</label><input type="search" id="pg-q" maxlength="60" placeholder="Pedidos, pessoas, conversas…" autocomplete="off"></div><div id="pg-r" role="status" aria-live="polite"><p class="muted">Escreve pelo menos 2 letras.</p></div>', f => {
      const q = $('#pg-q', f), r = $('#pg-r', f);
      const linha = (a, attrs, t1, t2) => '<button type="button" class="conv" data-a="' + a + '" ' + attrs + '><div><b>' + esc(t1) + '</b><span>' + esc(t2) + '</span></div></button>';
      const pintar = () => {
        const v = norm(q.value.trim()); if (v.length < 2) { r.innerHTML = '<p class="muted">Escreve pelo menos 2 letras.</p>'; return; }
        const ped = DB.pedidos.filter(p => Loja.visivel(p) && norm(p.titulo + ' ' + p.precisa + ' ' + AREA(p.area).nome).includes(v)).slice(0, 8);
        const pes = Loja.pessoasVisiveis().filter(p => p.uid !== DB.eu && norm(p.nome + ' ' + (cursoVisivel(p) ? p.curso : '') + ' ' + p.areas.map(a => AREA(a).nome).join(' ') + ' ' + (p.ferramentas || []).join(' ')).includes(v)).slice(0, 8);
        const cvs = Loja.minhasConversas().map(c => { const o = Loja.pessoa(c.uids.find(u => u !== DB.eu)), p = Loja.pedido(c.pedidoId), m = (c.msgs || []).slice().reverse().find(x => norm(x.texto || '').includes(v)); return { c, o, p, m, ok: m || norm((o ? o.nome : '') + ' ' + (p ? p.titulo : '')).includes(v) }; }).filter(x => x.ok).slice(0, 8);
        r.innerHTML = (ped.length ? '<h3 class="h3">Pedidos</h3><div class="lista">' + ped.map(p => linha('ver-pedido', 'data-id="' + esc(p.id) + '"', p.titulo, AREA(p.area).nome + ' · ' + ESTADOS[p.estado].nome)).join('') + '</div>' : '')
          + (pes.length ? '<h3 class="h3">Pessoas</h3><div class="lista">' + pes.map(p => linha('ver-pessoa', 'data-uid="' + esc(p.uid) + '"', p.nome, rotuloTipo(p) + (cursoVisivel(p) ? ' · ' + p.curso : ''))).join('') + '</div>' : '')
          + (cvs.length ? '<h3 class="h3">Conversas</h3><div class="lista">' + cvs.map(x => linha('ver-conversa', 'data-id="' + esc(x.c.id) + '"', x.o ? x.o.nome : 'Conversa', x.m ? '«' + x.m.texto.slice(0, 80) + '»' : (x.p ? x.p.titulo : ''))).join('') + '</div>' : '')
          || '<p class="muted">Nada encontrado para «' + esc(q.value.trim()) + '».</p>';
      };
      q.addEventListener('input', pintar); q.focus();
    });
  },
  'avisos-sistema': async () => { if (AVISOS_SISTEMA.ligado()) { AVISOS_SISTEMA.desligar(); toast('Avisos no dispositivo desligados'); } else if (await AVISOS_SISTEMA.ligar()) { toast('Avisos ligados. Vais saber das mensagens e propostas mesmo com a app fechada no fundo.'); } desenhar(); },

  // ----- perfil -----
  'editar-perfil': () => {
    const p = Loja.eu();
    // Com conta da Pronex_Study, o nome, a foto e a cor vêm de lá (uma só identidade nas duas apps).
    const daStudy = Nuvem.ativa() && Nuvem.identidadeStudy();
    const cores = [0, 1, 2, 3, 4, 5].concat(p.cor > 5 ? [p.cor] : []);
    folha('Editar perfil', '<form class="form" novalidate>'
      + (daStudy ? '<div class="aviso">' + avatar(p, 'p') + ' O nome, a foto e a cor são os do teu perfil no Study. <a href="../pronex_study/">Muda-os lá</a> e voltam iguais aqui.</div>'
        : htmlImagem('ep-foto', 'Fotografia', 'Opcional. Aparece em vez das iniciais do teu nome.')
          + '<div class="campo"><span class="lb" id="ep-cl">Cor do avatar</span><div class="cores" role="radiogroup" aria-labelledby="ep-cl">' + cores.map(c => '<button type="button" role="radio" class="av g' + c + '" data-cor="' + c + '" aria-checked="' + ((p.cor || 0) === c) + '" aria-label="Cor ' + (c + 1) + '"></button>').join('') + '</div></div>')
      + (daStudy ? '<input type="hidden" id="ep-nome" value="' + esc(p.nome) + '">' : campo('ep-nome', 'Nome', '<input type="text" id="ep-nome" maxlength="40" autocomplete="name" value="' + esc(p.nome) + '">'))
      + campo('ep-curso', p.tipo === 'professor' ? 'Disciplina ou área' : 'Ano e curso', '<input type="text" id="ep-curso" maxlength="60" value="' + esc(p.curso) + '">')
      + '<label class="chk"><input type="checkbox" id="ep-cpriv"' + (p.cursoPrivado ? ' checked' : '') + '><span>Não mostrar o ano e curso no meu perfil (fica só para mim).</span></label>'
      + campo('ep-escola', 'Escola', '<input type="text" id="ep-escola" maxlength="60" value="' + esc(p.escola || '') + '" placeholder="Escola Profissional da Lousã">', 'Ajuda a encontrar pessoas da tua escola.')
      + campo('ep-links', 'Os teus portefólios noutros sites', '<textarea id="ep-links" rows="2" maxlength="600" placeholder="https://www.behance.net/…">' + esc((p.links || []).join('\n')) + '</textarea>', 'Até 4 ligações (Behance, ArtStation, GitHub, YouTube…), uma por linha, a começar por https://.')
      + campo('ep-bio', 'O que gostas de fazer?', '<textarea id="ep-bio" maxlength="400">' + esc(p.bio) + '</textarea>', 'O que fazes bem e o que te interessa.')
      + '<div class="campo"><span class="lb" id="ep-al">As tuas áreas</span><div class="marcas" id="ep-areas" role="group" aria-labelledby="ep-al">' + AREAS.map(a => '<button type="button" data-area="' + a.id + '" aria-pressed="' + p.areas.includes(a.id) + '">' + esc(a.nome) + '</button>').join('') + '</div><small>Até 6. É por aqui que te encontram.</small></div>'
      + '<div class="campo" id="ep-niveis"></div>'
      + campo('ep-ferr', 'Programas com que trabalhas', '<input type="text" id="ep-ferr" maxlength="200" value="' + esc(p.ferramentas.join(', ')) + '" placeholder="Blender, Premiere, Photoshop">', 'Separa com vírgulas.')
      + campo('ep-of', 'O que te disponibilizas a fazer?', '<textarea id="ep-of" maxlength="400">' + esc(p.oferece) + '</textarea>', 'Os trabalhos que aceitas fazer para os outros.')
      + campo('ep-horas', 'Quanto tempo tens por semana?', '<input type="text" id="ep-horas" maxlength="40" value="' + esc(p.horas) + '" placeholder="3 horas por semana">', 'Opcional.')
      + '<div class="campo"><span class="lb" id="ep-dl">Dias em que costumas poder</span><div class="marcas" id="ep-dias" role="group" aria-labelledby="ep-dl">' + DIAS_SEMANA.map(k => '<button type="button" data-dia="' + k[0] + '" aria-pressed="' + (p.dias || []).includes(k[0]) + '">' + k[1] + '</button>').join('') + '</div><small>Opcional. Ajuda quem pede a combinar.</small></div>'
      + '<label class="chk"><input type="checkbox" id="ep-disp"' + (p.disponivel ? ' checked' : '') + '><span>Estou disponível para fazer trabalhos. Apareço na lista de freelancers.</span></label>'
      + ERRO + '<button type="submit" class="btn pri w">Guardar perfil</button></form>', f => {
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
        verificarAntes([v('ep-nome'), v('ep-bio'), v('ep-of')], () => resultado(Loja.editarPerfil({ nome: v('ep-nome'), curso: v('ep-curso'), bio: v('ep-bio'), oferece: v('ep-of'), horas: v('ep-horas'), ferramentas: v('ep-ferr'), disponivel: $('#ep-disp', f).checked, cursoPrivado: $('#ep-cpriv', f).checked, escola: v('ep-escola'), links: v('ep-links'), dias: [...f.querySelectorAll('#ep-dias [aria-pressed=true]')].map(b => b.dataset.dia), areas: sel(), niveis: niv, foto: foto(), cor: corSel() }), $('.erro', f), 'Perfil guardado'));
      });
    });
  },
  'partilhar-perfil': () => { const p = Loja.eu(), n = Loja.concluidos(p.uid); copiar(p.nome + ' (' + rotuloTipo(p) + ')\n' + (p.bio ? p.bio + '\n' : '') + (p.areas.length ? 'Áreas: ' + p.areas.map(a => AREA(a).nome).join(', ') + '\n' : '') + (p.ferramentas.length ? 'Programas: ' + p.ferramentas.join(', ') + '\n' : '') + (p.oferece ? 'Faço: ' + p.oferece + '\n' : '') + (n ? 'Trabalhos concluídos na ' + APP_NOME + ': ' + n : ''), 'Apresentação copiada'); },
  'editar-exp': d => {
    const e0 = d.id ? Loja.eu().experiencias.find(x => x.id === d.id) : null, v = e0 || { titulo: '', onde: '', ano: '' };
    folha(e0 ? 'Editar experiência' : 'Juntar experiência', '<form class="form" novalidate>' + campo('ex-t', 'O que fizeste?', '<input type="text" id="ex-t" maxlength="80" value="' + esc(v.titulo) + '" placeholder="Vídeo de apresentação do curso">') + campo('ex-o', 'Onde?', '<input type="text" id="ex-o" maxlength="60" value="' + esc(v.onde) + '" placeholder="Escola, estágio, projeto pessoal…">', 'Opcional.') + campo('ex-a', 'Ano', '<input type="text" id="ex-a" maxlength="9" inputmode="numeric" value="' + esc(v.ano) + '" placeholder="2026">', 'Opcional.') + ERRO + '<button type="submit" class="btn pri w">Guardar</button></form>', f => {
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.guardarExperiencia({ id: d.id, titulo: $('#ex-t', f).value, onde: $('#ex-o', f).value, ano: $('#ex-a', f).value }), $('.erro', f), 'Experiência guardada'); });
    });
  },
  'tirar-exp': d => confirmar('Apagar esta experiência?', 'Deixa de aparecer no teu perfil.', 'Apagar', () => { const ap = Loja.tirarExperiencia(d.id); desenhar(); toast('Experiência apagada.', ap ? { t: 'Anular', fn: () => { const r = Loja.reporApagado(ap); toast(r && r.ok ? 'Reposta.' : (r && r.erro) || 'Não foi possível repor.'); desenhar(); } } : null); }, true),
  'editar-peca': d => {
    const p = Loja.eu(), x0 = d.id ? DB.pecas.find(k => k.id === d.id && k.uid === DB.eu) : null, v = x0 || { titulo: '', desc: '', area: p.areas[0] || 'design', img: '', link: '' };
    folha(x0 ? 'Editar trabalho' : 'Juntar trabalho ao portefólio', '<form class="form" novalidate>' + campo('pc-t', 'Título', '<input type="text" id="pc-t" maxlength="80" value="' + esc(v.titulo) + '">') + campo('pc-a', 'Área', '<select id="pc-a">' + opcoesArea(v.area) + '</select>') + campo('pc-d', 'Descrição', '<textarea id="pc-d" maxlength="400">' + esc(v.desc) + '</textarea>', 'O que era pedido e o que fizeste.') + htmlImagem('pc-i', 'Imagem') + campo('pc-l', 'Ligação', '<input type="url" id="pc-l" maxlength="300" value="' + esc(v.link) + '" placeholder="https://">', 'Opcional.') + '<p class="muted sm">Mostra só trabalhos teus e sem dados de outras pessoas.</p>' + ERRO + '<button type="submit" class="btn pri w">' + (x0 ? 'Guardar' : 'Juntar ao portefólio') + '</button></form>', f => {
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
      + (meu && x.origem !== 'trabalho' ? '<div class="acoes"><button type="button" class="btn" data-a="destacar-peca" data-id="' + esc(x.id) + '">' + ico('selo') + (x.destaque ? 'Tirar o destaque' : 'Pôr em destaque') + '</button><button type="button" class="btn" data-a="editar-peca" data-id="' + esc(x.id) + '">' + ico('editar') + 'Editar</button><button type="button" class="btn perigo" id="pc-apagar">Tirar do portefólio</button></div>' : ''), f => {
      const b = $('#pc-apagar', f); if (b) b.addEventListener('click', () => confirmar('Tirar do portefólio?', 'O trabalho deixa de aparecer no teu perfil.', 'Tirar', () => { const ap = Loja.tirarPeca(x.id); desenhar(); toast('Trabalho retirado.', ap ? { t: 'Anular', fn: () => { const r = Loja.reporApagado(ap); toast(r && r.ok ? 'Reposto no portefólio.' : (r && r.erro) || 'Não foi possível repor.'); desenhar(); } } : null); }, true));
    });
  },

  // ----- comunidade -----
  recomendar: d => { const q = Loja.pessoa(d.uid), ex = Loja.recsDe(d.uid).find(r => r.de === DB.eu); folhaTexto('Recomendar ' + q.nome, 'O que destacas neste aluno?', 'Fica visível no perfil, com o teu nome.', 'Publicar recomendação', 400, t => Loja.recomendar(d.uid, t), 'Recomendação publicada', ex ? ex.texto : ''); },
  'tirar-rec': d => confirmar('Apagar esta recomendação?', 'Deixa de aparecer no perfil.', 'Apagar', () => { Loja.tirarRecomendacao(d.id); desenhar(); }, true),
  bloquear: d => { const q = Loja.pessoa(d.uid); confirmar('Bloquear ' + q.nome + '?', 'Deixam de ver os pedidos um do outro e não podem trabalhar juntos. Podes desbloquear nas definições.', 'Bloquear', () => { if (resultado(Loja.bloquear(d.uid), null, q.nome + ' foi bloqueado')) ir('freelancers'); }, true); },
  desbloquear: d => { Loja.desbloquear(d.uid); toast('Desbloqueado'); desenhar(); },
  // Denúncia com os motivos da Pronex_Study. Para uma mensagem, guarda o texto e o autor para o administrador ver.
  denunciar: (d, extra) => {
    folha('Denunciar', '<form class="form" novalidate><div class="campo"><span class="lb" id="dn-l">Porque estás a denunciar?</span><div class="marcas col1" role="radiogroup" aria-labelledby="dn-l">' + MOTIVOS_DENUNCIA.map(m => '<button type="button" role="radio" aria-checked="false" data-mt="' + m[0] + '">' + esc(m[1]) + '</button>').join('') + '</div><small>O administrador vai rever. Quem publicou não fica a saber que foste tu.</small></div>' + campo('dn-t', 'Queres explicar melhor?', '<textarea id="dn-t" maxlength="400"></textarea>', 'Opcional.') + '<div class="aviso"><b>Precisas de ajuda?</b> ' + esc(AJUDA_DENUNCIA) + '</div>' + ERRO + '<button type="submit" class="btn pri w">Enviar denúncia</button></form>', f => {
      const g = $('[role=radiogroup]', f); radios(g);
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const sel = $('[aria-checked=true]', g); resultado(Loja.denunciar(d.tipo, d.id, sel ? sel.dataset.mt : '', $('#dn-t', f).value, extra), $('.erro', f), 'Denúncia registada. O administrador vai rever.'); });
    });
  },
  desafixar: d => resultado(Loja.fixar(d.c, null), null, 'Mensagem desafixada'),
  'marcar-reuniao': d => folha('Marcar uma reunião', '<form class="form" id="f-reuniao" data-c="' + esc(d.c) + '" novalidate>' + campo('ru-d', 'Dia', '<input type="date" id="ru-d" min="' + hojeISO() + '">') + campo('ru-h', 'Hora', '<input type="time" id="ru-h" step="900">') + campo('ru-o', 'Onde', '<input id="ru-o" maxlength="80" placeholder="Ex.: sala 12, biblioteca, videochamada">', 'As duas pessoas veem a reunião no Início na semana em que acontece.') + ERRO + '<button type="submit" class="btn pri w">Marcar</button></form>'),
  'novo-pedido-desafio': () => { const d = Loja.desafio(); if (!d) return; formPedido({ area: d.area || '', titulo: '', precisa: 'Para o desafio do mês «' + d.titulo + '»: ' }); },
  'sus-depois': () => { try { localStorage.setItem('pl-sus-fechado', '1'); } catch (e) { /* sem acesso */ } desenhar(); },
  poupar: () => { try { localStorage.setItem('pl-poupar', poupanca() ? '0' : '1'); } catch (e) { /* sem acesso */ } aplicarTema(); toast(poupanca() ? 'Poupança de dados ligada' : 'Poupança de dados desligada'); desenhar(); },
  sus: () => folha('O que achas da app?', '<form class="form" id="f-sus" novalidate><p class="muted">De 1 (discordo totalmente) a 5 (concordo totalmente).</p>' + SUS.map((q, i) => '<fieldset class="sus"><legend>' + (i + 1) + '. ' + esc(q) + '</legend><div class="sus-o">' + [1, 2, 3, 4, 5].map(n => '<label><input type="radio" name="sus' + i + '" value="' + n + '"><span>' + n + '</span></label>').join('') + '</div></fieldset>').join('') + ERRO + '<button type="submit" class="btn pri w">Enviar as respostas</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const r = SUS.map((_, i) => Number(($('input[name="sus' + i + '"]:checked', f) || {}).value || 0)); const x = Loja.responderSUS(r); if (x.erro) { const er = $('.erro', f); er.textContent = x.erro; er.hidden = false; return; } fecharFolha(); toast('Obrigado! A tua nota para a app: ' + x.nota + ' em 100'); desenhar(); });
  }),
  privacidade: () => folha('Política de privacidade', '<div class="priv">' + PRIVACIDADE.map(s => '<h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p>').join('') + '<p class="muted sm">Versão de ' + esc(PRIVACIDADE_DATA) + '. Dúvidas ou pedidos sobre os teus dados: fala com o administrador da PRONEX na escola ou usa «Denunciar» num perfil ou pedido.</p></div><button type="button" class="btn pri" data-a="fechar-folha">Percebi</button>'),
  'imprimir-cv': d => {
    const p = Loja.pessoa(d.uid || DB.eu); if (!p) return; const conf = Loja.confirmadas(p.uid), lt = Loja.linhaTempo(p.uid).filter(x => x.papel === 'fiz'), nv = Loja.nivel(p.uid);
    imprimirHTML('Currículo · ' + p.nome, '<h1>' + esc(p.nome) + '</h1><p class="m">' + esc(rotuloTipo(p)) + (p.curso ? ' · ' + esc(p.curso) : '') + (p.escola ? ' · ' + esc(p.escola) : '') + ' · ' + esc(nv.nome) + ' na ' + esc(APP_NOME) + '</p>'
      + (p.bio ? '<p>' + esc(p.bio) + '</p>' : '')
      + (p.areas.length ? '<h2>Competências</h2><ul>' + p.areas.map(a => '<li>' + esc(AREA(a).nome) + (p.niveis[a] ? ' · ' + esc(NIVEIS[p.niveis[a]]) : '') + (conf[a] ? ' · confirmada em ' + conf[a] + (conf[a] === 1 ? ' trabalho' : ' trabalhos') + ' avaliados com 4 ou 5 estrelas' : '') + '</li>').join('') + '</ul>' : '')
      + (p.ferramentas.length ? '<p><b>Programas:</b> ' + esc(p.ferramentas.join(', ')) + '</p>' : '')
      + (lt.length ? '<h2>Trabalhos feitos na ' + esc(APP_NOME) + '</h2><ul>' + lt.map(x => '<li><b>' + esc(x.p.titulo) + '</b> · ' + esc(AREA(x.p.area).nome) + ' · ' + esc(dataLonga(x.em)) + (x.p.avaliacao ? ' · ' + x.p.avaliacao.estrelas + ' em 5' : '') + '</li>').join('') + '</ul>' : '')
      + (p.experiencias.length ? '<h2>Experiências</h2><ul>' + p.experiencias.map(e => '<li><b>' + esc(e.titulo) + '</b>' + (e.onde || e.ano ? ' · ' + esc([e.onde, e.ano].filter(Boolean).join(', ')) : '') + '</li>').join('') + '</ul>' : '')
      + ((p.links || []).length ? '<h2>Ligações</h2><ul>' + p.links.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : ''));
  },
  'pn-registo-csv': () => {
    const r = (Nuvem.ativa() ? Nuvem.registo() : DB.registo) || []; if (!r.length) return toast('O registo está vazio.');
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [['data', 'acao', 'alvo', 'detalhe']].concat(r.map(x => [new Date(x.em).toISOString(), x.acao, x.alvo || '', x.detalhe || ''])).map(l => l.map(q).join(';')).join('\n'), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'pronex_link_registo_' + hojeISO() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  },
  'msg-menu': d => {
    const c = Loja.conversa(d.c), m = c && c.msgs.find(x => x.id === d.m); if (!m) return;
    const meu = m.uid === DB.eu;
    folha('Mensagem', '<p class="citacao">' + esc(m.texto || 'Imagem') + '</p><div class="lista">'
      + (!Loja.conversaFechada(c) ? '<button type="button" class="conv" id="mm-resp"><div><b>Responder</b><span>A tua mensagem mostra a que estás a responder.</span></div></button>' : '')
      + (!Loja.conversaFechada(c) ? '<button type="button" class="conv" id="mm-fixar"><div><b>' + (c.fixada && c.fixada.id === m.id ? 'Desafixar' : 'Fixar no topo') + '</b><span>Fica visível no topo da conversa para as duas pessoas.</span></div></button>' : '')
      + (m.texto ? '<button type="button" class="conv" id="mm-copiar"><div><b>Copiar o texto</b></div></button>' : '')
      + (meu ? '<button type="button" class="conv" id="mm-apagar"><div><b>Apagar mensagem</b><span>Deixa de aparecer para as duas pessoas.</span></div></button>' : '<button type="button" class="conv" id="mm-den"><div><b>Denunciar mensagem</b><span>O administrador vê o texto da mensagem.</span></div></button>') + '</div>', f => {
      const cp = $('#mm-copiar', f), ap = $('#mm-apagar', f), dn = $('#mm-den', f), rp = $('#mm-resp', f);
      if (rp) rp.addEventListener('click', () => { fecharFolha(); RESPOSTA = { c: d.c, id: m.id, uid: m.uid, texto: (m.texto || 'Imagem').slice(0, 140) }; desenhar(); const t = $('#msg-t'); if (t) t.focus(); });
      if (cp) cp.addEventListener('click', () => { fecharFolha(); copiar(m.texto, 'Texto copiado'); });
      const fx = $('#mm-fixar', f); if (fx) fx.addEventListener('click', () => resultado(Loja.fixar(d.c, c.fixada && c.fixada.id === m.id ? null : m.id), null, c.fixada && c.fixada.id === m.id ? 'Mensagem desafixada' : 'Mensagem fixada'));
      if (ap) ap.addEventListener('click', () => { fecharFolha(); confirmar('Apagar esta mensagem?', 'Deixa de aparecer na conversa. Não dá para voltar atrás.', 'Apagar', () => resultado(Loja.apagarMensagem(d.c, d.m), null, 'Mensagem apagada'), true); });
      if (dn) dn.addEventListener('click', () => { fecharFolha(); ACOES.denunciar({ tipo: 'msg', id: d.c + '/' + d.m }, { autor: m.uid, citacao: m.texto || 'Imagem' }); });
    });
  },
  // O painel vive no separador «Painel» do meu perfil.
  moderacao: () => { F.perfTab = 'painel'; F.pnSep = 'mod'; ir('perfil'); },
  'perf-tab': d => { F.perfTab = d.t; desenhar(); },
  'pn-sep': d => { F.perfTab = 'painel'; F.pnSep = d.s; if (d.s === 'reg' && Nuvem.ativa()) Nuvem.carregarRegisto(); if (d.s === 'uti' && Nuvem.ativa()) Nuvem.carregarSuspensoes(); if (NAV.v !== 'perfil' || NAV.sub) ir('perfil'); else desenhar(); },
  'pn-mod': d => { const x = DB.denuncias.find(k => k.id === d.id); const r = Loja.moderar(d.id, d.o); if (r.erro) return toast(r.erro); registar(d.o === 'ocultar' ? 'link_ocultar_pedido' : 'link_arquivar_denuncia', x ? x.alvo : '', x ? MOTIVO(x.motivo) : ''); toast(d.o === 'ocultar' ? 'Feito' : 'Denúncia arquivada'); desenhar(); },
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
    folha('Suspender ' + (q ? q.nome : 'esta pessoa'), '<form class="form" novalidate><div class="campo"><span class="lb" id="sp-l">Durante quanto tempo?</span><div class="marcas" role="radiogroup" aria-labelledby="sp-l">' + [[1, '1 dia'], [7, '7 dias'], [30, '30 dias'], [0, 'Sem data de fim']].map((x, i) => '<button type="button" role="radio" aria-checked="' + (i === 1) + '" data-dias="' + x[0] + '">' + x[1] + '</button>').join('') + '</div></div>' + campo('sp-m', 'Motivo', '<input type="text" id="sp-m" maxlength="200">', 'Fica no registo. A pessoa vê que a conta está suspensa.') + '<div class="aviso warn">A suspensão vale no Freelancer e no Study: a pessoa pode ver, mas não pode publicar nem enviar mensagens.</div>' + ERRO + '<button type="submit" class="btn perigo w">Suspender</button></form>', f => {
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
    folha('Avisos', l.length ? '<div class="lista">' + l.map(a => '<button type="button" class="conv' + (a.lido ? '' : ' novo') + '" data-av="' + esc(a.id) + '"><div><b class="wrap">' + esc(a.texto) + '</b><span>' + quando(a.em) + '</span></div></button>').join('') + '</div>' : vazio('Sem avisos', 'Propostas, convites, entregas e avaliações aparecem aqui.'), f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-av]'); if (!b) return; const a = l.find(x => x.id === b.dataset.av); fecharFolha(); if (a) irParaAlvo(a.alvo); });
    });
    Loja.lerAvisos(); pintarBarras();
  },
  regras: () => folha('Regras da ' + APP_NOME, '<ol class="regras">' + REGRAS.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol><button type="button" class="btn pri" data-a="fechar-folha">Percebi</button>'),
  'como-funciona': () => folha('Como funciona', '<div class="aviso troca"><b>A troca</b> ' + esc(TROCA) + '</div><ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><h3>Perguntas frequentes</h3>' + PERGUNTAS_FREQUENTES.map(p => '<details><summary>' + esc(p[0]) + '</summary><p>' + esc(p[1]) + '</p></details>').join('')),
  glossario: () => folha('Palavras da app', '<dl class="dl glossario">' + GLOSSARIO.map(g => '<div><dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd></div>').join('') + '</dl>'),
  guia: () => folha('Bem-vindo à ' + APP_NOME, '<div class="aviso troca"><b>A troca</b> ' + esc(TROCA) + '</div><ol class="passosg">' + COMO_FUNCIONA.map(p => '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>').join('') + '</ol><h3 class="h3">Exemplos de pedidos</h3><div class="lista">' + EXEMPLOS_PEDIDO.map(x => '<div class="exemplo"><b>' + esc(x[0]) + '</b><span class="muted sm">' + esc(x[1]) + '</span><p class="sm">' + esc(x[2]) + '</p></div>').join('') + '</div><div class="acoes"><button type="button" class="btn" data-a="editar-perfil">Preencher o meu perfil</button><button type="button" class="btn pri" data-a="fechar-folha">Começar</button></div>'),
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
    folha('Professores confirmados', '<p class="muted">Só estes emails podem entrar como professor e escrever recomendações.</p>' + (l.length ? l.map(m => '<div class="exp"><div><b class="quebra">' + esc(m) + '</b></div><button type="button" class="btn mini" data-tirar="' + esc(m) + '">Tirar</button></div>').join('') : '<p class="muted">Ainda não há professores confirmados.</p>')
      + '<form class="linhaf" id="f-prof"><label class="sr" for="prof-e">Email do professor</label><input type="email" id="prof-e" maxlength="120" placeholder="email do professor"><button type="submit" class="btn mini">Juntar</button></form>', f => {
      $('#f-prof', f).addEventListener('submit', async e => { e.preventDefault(); const v = $('#prof-e', f).value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('Escreve um email válido.'); try { await Nuvem.juntarProfessor(v); toast('Professor confirmado'); ACOES.professores(); } catch (x) { toast('Não foi possível guardar.'); } });
      f.addEventListener('click', async e => { const b = e.target.closest('[data-tirar]'); if (!b) return; try { await Nuvem.tirarProfessor(b.dataset.tirar); ACOES.professores(); } catch (x) { toast('Não foi possível tirar.'); } });
    });
  },

  // ----- definições, conta e demonstração -----
  tema: d => { Loja.tema(d.t); aplicarTema(); desenhar(); },
  texto: d => { Loja.texto(d.t); aplicarTema(); desenhar(); },
  exportar: () => copiar(Loja.exportar(), 'Os teus dados foram copiados'),
  // 0.25: apagados recentemente (30 dias, só neste aparelho)
  apagados: () => { const l = Loja.apagados(); folha('Apagados recentemente', '<p class="muted">O que apagas fica aqui 30 dias, só neste aparelho, e podes repor.</p>' + (l.length ? '<ul class="lista-ap">' + l.map(a => '<li><div><b>' + esc(a.rotulo || 'Sem título') + '</b><span class="muted sm">' + (a.tipo === 'peca' ? 'Trabalho do portefólio' : 'Experiência') + ' · apagado ' + quando(a.em) + '</span></div><button type="button" class="btn mini" data-a="repor-apagado" data-id="' + esc(a.id) + '">Repor</button></li>').join('') + '</ul>' : '<p class="vazio">Não apagaste nada nos últimos 30 dias.</p>')); },
  'repor-apagado': d => { const r = Loja.reporApagado(d.id); toast(r && r.ok ? 'Reposto.' : (r && r.erro) || 'Não foi possível repor.'); fecharFolha(); desenhar(); },
  'descartar-rascunho': () => confirmar('Descartar o pedido por acabar?', 'O que escreveste neste pedido deixa de estar guardado.', 'Descartar', () => { Loja.guardarRascunho(null); desenhar(); }, true),
  'apagar-conta': () => folha(Nuvem.ativa() ? 'Apagar os teus dados da ' + APP_NOME + '?' : 'Apagar a tua conta?', '<p class="muted">Apaga o perfil, o portefólio, os pedidos por concluir, as conversas e as recomendações.</p><div class="aviso">Recomendado: <b>apagar daqui a 7 dias</b>. Até lá a conta continua a funcionar e podes cancelar. Se mudares de ideias, não perdes nada.</div><div class="acoes"><button type="button" class="btn pri" id="ap-7">Apagar daqui a 7 dias</button><button type="button" class="btn perigo" id="ap-ja">Apagar já</button></div>', f => {
    $('#ap-7', f).addEventListener('click', () => { Loja.agendarApagar(true); fecharFolha(); toast('Os teus dados vão ser apagados daqui a 7 dias. Podes cancelar em Perfil → Conta.'); desenhar(); });
    $('#ap-ja', f).addEventListener('click', () => { fecharFolha(); ACOES['apagar-conta-ja'](); });
  }),
  'cancelar-apagar': () => { Loja.agendarApagar(false); toast('Cancelado: os teus dados ficam.'); desenhar(); },
  'exportar-ficheiro': () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Loja.exportar()], { type: 'application/json' })); a.download = 'pronex_link_os_meus_dados_' + hojeISO() + '.json'; document.body.appendChild(a); a.click(); a.remove(); toast('Ficheiro descarregado'); },
  seguir: d => { const r = Loja.seguir(d.uid); toast(r.on ? 'Passas a ser avisado quando ' + ((Loja.pessoa(d.uid) || {}).nome || 'esta pessoa') + ' ficar disponível ou juntar um trabalho' : 'Deixaste de seguir'); desenhar(); },
  moderadores: async () => {
    let l = []; try { l = await Nuvem.moderadores(); } catch (e) { return toast('Só o administrador vê esta lista.'); }
    folha('Moderadores', '<p class="muted">Emails de professores que podem moderar.</p>' + (l.length ? l.map(m => '<div class="exp"><div><b class="quebra">' + esc(m) + '</b></div><button type="button" class="btn mini" data-tirar="' + esc(m) + '">Tirar</button></div>').join('') : '<p class="muted">Ainda não há moderadores.</p>')
      + '<form class="linhaf" id="f-mod"><label class="sr" for="mod-e">Email do moderador</label><input type="email" id="mod-e" maxlength="120" placeholder="email do professor"><button type="submit" class="btn mini">Juntar</button></form>', f => {
      $('#f-mod', f).addEventListener('submit', async e => { e.preventDefault(); const v = $('#mod-e', f).value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('Escreve um email válido.'); try { await Nuvem.juntarModerador(v); registar('link_juntar_moderador', v, ''); ACOES.moderadores(); } catch (x) { toast('Não foi possível juntar.'); } });
      f.addEventListener('click', async e => { const b = e.target.closest('[data-tirar]'); if (!b) return; try { await Nuvem.tirarModerador(b.dataset.tirar); registar('link_tirar_moderador', b.dataset.tirar, ''); ACOES.moderadores(); } catch (x) { toast('Não foi possível tirar.'); } });
    });
  },
  'pn-advertir': d => { const q = Loja.pessoa(d.uid); folhaTexto('Advertir ' + (q ? q.nome : 'esta pessoa'), 'Motivo da advertência', 'A pessoa recebe um aviso da moderação com este texto. Fica no registo.', 'Enviar advertência', 120, t => { const r = Loja.advertir(d.uid, t); if (r.ok) { registar('link_advertencia', q ? q.nome : d.uid, t); desenhar(); } return r; }, 'Advertência enviada'); },
  'pn-contexto': async d => {
    const x = DB.denuncias.find(k => k.id === d.id); if (!x) return; const [cid, mid] = x.alvo.split('/');
    let l = []; try { l = await Nuvem.ultimasMsgs(cid, mid); } catch (e) { return toast('Não foi possível ler a conversa.'); }
    registar('link_ver_contexto', x.alvo, '');
    folha('Contexto da mensagem', '<p class="muted">As mensagens à volta da denunciada. Ver isto fica registado.</p><div class="chat">' + l.map(m => '<div class="msg' + (m.id === mid ? ' denunciada' : '') + (m.uid ? '' : ' sis') + '"><b>' + esc(m.uid ? ((Loja.pessoa(m.uid) || {}).nome || 'Conta apagada') : 'Aviso') + '</b> ' + esc(m.texto || (m.img ? 'Imagem' : '')) + '</div>').join('') + '</div>');
  },
  'apagar-conta-ja': () => confirmar(Nuvem.ativa() ? 'Apagar os teus dados da ' + APP_NOME + '?' : 'Apagar a tua conta?', 'Apaga o teu perfil, o portefólio, os pedidos por concluir, as conversas e as recomendações. Não dá para voltar atrás.', Nuvem.ativa() ? 'Apagar os meus dados' : 'Apagar a minha conta', () => { const r = Loja.apagarConta(); if (r.erro) return toast(r.erro); PILHA.length = 0; NAV = { v: 'inicio', sub: null }; desenhar(true); toast('Conta apagada'); }, true),
  trocar: () => {
    folha('Usar a app como…', '<p class="muted">Serve para experimentares os dois lados: publica um pedido como tu, responde como outra pessoa e volta a ti para a escolheres.</p><div class="lista">' + Object.values(DB.pessoas).map(p => '<button type="button" class="conv" data-u="' + esc(p.uid) + '">' + avatar(p) + '<div><b>' + esc(p.nome) + (p.uid === DB.minha ? ' (tu)' : '') + '</b><span>' + esc(rotuloTipo(p)) + '</span></div>' + (p.uid === DB.eu ? '<span class="chip pri">A usar</span>' : '') + '</button>').join('') + '</div>', f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; Loja.usarComo(b.dataset.u); Object.assign(F, FILTROS_INICIAIS); fecharFolha(); toast('A usar como ' + Loja.eu().nome); ir('inicio'); });
    });
  },
  repor: () => confirmar('Apagar tudo e recomeçar?', 'Apaga o teu perfil, os pedidos e as conversas deste dispositivo e repõe os exemplos.', 'Apagar tudo', () => { Loja.repor(); Object.assign(F, FILTROS_INICIAIS); aplicarTema(); ir('inicio'); }, true)
});
