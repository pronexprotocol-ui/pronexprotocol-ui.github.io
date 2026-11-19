/* Pronex_Link · 10-acoes-pedidos.js
   O que acontece quando se carrega num botão. Cada botão tem `data-a="nome"` e a ação está em ACOES.
   Este ficheiro tem as peças dos formulários e as ações de navegação, pedidos, propostas e trabalho em curso.
   As ações de perfil, conta e ajuda estão em 11-acoes-perfil.js. */
'use strict';
// Mostra o erro no formulário (ou num aviso) ou fecha a folha, avisa e volta a pintar.
function resultado(r, erroEl, msgOk) {
  if (r && r.erro != null) { if (erroEl) { erroEl.textContent = r.erro; erroEl.hidden = !r.erro; } else toast(r.erro); return false; }
  fecharFolha(); if (msgOk) toast(msgOk); desenhar(); return true;
}
const campo = (id, rotulo, html, ajuda) => '<div class="campo"><label for="' + id + '">' + rotulo + '</label>' + html + (ajuda ? '<small>' + ajuda + '</small>' : '') + '</div>';
const opcoesArea = (sel, grupo) => AREAS.filter(a => !grupo || a.grupo === grupo || a.id === 'outra' || a.id === sel).map(a => '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.nome) + '</option>').join('');
const ERRO = '<p class="erro" role="alert" hidden></p>';
function radios(el) { // grupo de botões que se comporta como botões de opção
  el.addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (!b) return; el.querySelectorAll('[role=radio]').forEach(x => x.setAttribute('aria-checked', x === b)); el.dispatchEvent(new CustomEvent('mudou', { detail: b })); });
}
const htmlImagem = (id, rotulo, ajuda) => '<div class="campo"><span class="lb">' + rotulo + '</span><label class="escolher" for="' + id + '">' + ico('imagem') + '<span id="' + id + '-nome">Escolher imagem</span></label><input type="file" class="sr ficheiro" id="' + id + '" accept="image/jpeg,image/png,image/webp"><div class="capa" id="' + id + '-pre" hidden></div><button type="button" class="ligacao" id="' + id + '-x" hidden>Tirar a imagem</button><small>' + (ajuda || 'Opcional. A imagem é reduzida antes de ser guardada.') + '</small></div>';
function campoImagem(f, id, inicial, max) { // devolve uma função que dá a imagem escolhida (ou '')
  let img = imgSegura(inicial);
  const inp = $('#' + id, f), pre = $('#' + id + '-pre', f), x = $('#' + id + '-x', f);
  const nome = $('#' + id + '-nome', f);
  const pintar = () => { pre.hidden = x.hidden = !img; pre.style.backgroundImage = img ? 'url(' + img + ')' : ''; if (nome) nome.textContent = img ? 'Trocar a imagem' : 'Escolher imagem'; };
  // Enquanto a imagem é preparada, o botão de enviar fica desligado: assim a imagem nunca se perde.
  const botao = $('form .btn.pri', f);
  inp.addEventListener('change', async () => {
    if (!inp.files[0]) return;
    if (botao) { botao.disabled = true; botao.dataset.txt = botao.dataset.txt || botao.textContent; botao.textContent = 'A preparar a imagem…'; }
    try { img = await lerImagem(inp.files[0], max); } catch (e) { img = ''; inp.value = ''; toast(e.message); }
    if (botao) { botao.disabled = false; botao.textContent = botao.dataset.txt; }
    pintar();
  });
  x.addEventListener('click', () => { img = ''; inp.value = ''; pintar(); });
  pintar(); return () => img;
}
const htmlEstrelas = (id, rotulo) => '<div class="campo"><span class="lb" id="' + id + '">' + rotulo + '</span><div class="marcas" role="radiogroup" aria-labelledby="' + id + '">' + [1, 2, 3, 4, 5].map(n => '<button type="button" role="radio" aria-checked="false" data-n="' + n + '">' + n + (n === 1 ? ' estrela' : ' estrelas') + '</button>').join('') + '</div></div>';
const lerEstrelas = f => { const s = $('[role=radiogroup] [aria-checked=true]', f); return s ? s.dataset.n : 0; };
function folhaTexto(titulo, rotulo, ajuda, botao, max, acao, msgOk, inicial) { // folha com uma só caixa de texto
  folha(titulo, '<form class="form" novalidate>' + campo('ft-t', rotulo, '<textarea id="ft-t" maxlength="' + max + '">' + esc(inicial || '') + '</textarea>', ajuda) + ERRO + '<button class="btn pri w">' + botao + '</button></form>', f => {
    $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#ft-t', f).value; verificarAntes([t], () => resultado(acao(t), $('.erro', f), msgOk)); });
  });
}

/* Formulário de pedido: serve para publicar, editar e repetir. `d` = valores iniciais; `editarId` = pedido a editar. */
function formPedido(d, editarId) {
  d = Object.assign({ tipo: 'projeto', area: 'design', titulo: '', precisa: '', objetivo: '', finalidade: '', prazo: '', formato: '', img: '', portefolioOk: true }, d || {});
  const grupoDe = t => (t === 'ajuda' ? 'materia' : 'projeto');
  folha(editarId ? 'Editar pedido' : 'Publicar um pedido', '<form class="form" novalidate>'
    + (editarId ? '' : (LISTA_LOCAL.ler('pl-rascunhos').length ? '<div class="campo"><span class="lb">Os teus rascunhos</span><div class="marcas">' + LISTA_LOCAL.ler('pl-rascunhos').map(r => '<button type="button" data-rascunho="' + esc(r.id) + '">' + esc(r.titulo || 'Sem título') + '</button>').join('') + '</div></div>' : '')
      + '<div class="campo"><span class="lb">Começar com um modelo</span><div class="marcas">' + MODELOS.map(m => '<button type="button" data-modelo="' + m.id + '">' + m.nome + '</button>').join('') + LISTA_LOCAL.ler('pl-modelos').map(m => '<button type="button" class="meu" data-meu="' + esc(m.id) + '">' + esc(m.titulo || 'O meu modelo') + '</button>').join('') + '</div><small>Opcional. Preenche o pedido com as perguntas certas. Os teus modelos estão marcados.</small></div>')
    + '<div class="campo"><span class="lb" id="np-tl">De que precisas?</span><div class="opc" role="radiogroup" aria-labelledby="np-tl">' + TIPOS_PEDIDO.map(t => '<button type="button" role="radio" aria-checked="' + (t.id === d.tipo) + '" data-tipo="' + t.id + '"><b>' + t.nome + '</b><small>' + t.desc + '</small></button>').join('') + '</div></div>'
    + campo('np-area', 'Área', '<select id="np-area">' + opcoesArea(d.area, grupoDe(d.tipo)) + '</select>')
    + campo('np-titulo', 'Título', '<input type="text" id="np-titulo" maxlength="90" value="' + esc(d.titulo) + '" placeholder="Logótipo para a minha marca de roupa">')
    + campo('np-precisa', 'O que precisas?', '<textarea id="np-precisa" maxlength="800" rows="5">' + esc(d.precisa) + '</textarea>', 'Descreve o trabalho: o que tem de ser feito e o que já tens.')
    + campo('np-objetivo', 'O que queres alcançar com isto?', '<textarea id="np-objetivo" maxlength="500">' + esc(d.objetivo) + '</textarea>')
    + campo('np-finalidade', 'Para que é?', '<input type="text" id="np-finalidade" maxlength="300" value="' + esc(d.finalidade) + '" placeholder="Projeto pessoal, clube, exame nacional…">', 'Opcional.')
    + '<div class="duas">' + campo('np-prazo', 'Prazo', '<input type="date" id="np-prazo" value="' + esc(d.prazo) + '">', 'Opcional.') + campo('np-formato', 'Como preferes?', '<select id="np-formato">' + FORMATOS.map(x => '<option value="' + x.id + '"' + (x.id === d.formato ? ' selected' : '') + '>' + x.nome + '</option>').join('') + '</select>', 'Na escola ou à distância.') + '</div>'
    + htmlImagem('np-img', 'Imagem de referência', 'Opcional. Um exemplo do que tens em mente.')
    + '<div class="aviso warn" id="np-aviso" hidden>Isto parece um trabalho que conta para nota. Aqui só se pode pedir que te expliquem a matéria, não que façam o trabalho por ti.</div>'
    + '<label class="chk"><input type="checkbox" id="np-nota"' + (editarId ? ' checked' : '') + '><span>Este pedido <b>não</b> é um trabalho que conta para nota.</span></label>'
    + '<label class="chk"><input type="checkbox" id="np-porte"' + (d.portefolioOk ? ' checked' : '') + '><span>Quem fizer pode mostrar este trabalho no portefólio. É a forma de lhe agradeceres.</span></label>'
    + ERRO + '<button class="btn pri w">' + (editarId ? 'Guardar alterações' : 'Publicar pedido') + '</button>'
    + (editarId ? '' : '<div class="acoes"><button type="button" class="btn mini" id="np-guardar">Guardar para mais tarde</button><button type="button" class="btn mini" id="np-modelo">Guardar como modelo</button></div>') + '</form>', f => {
    const grupo = $('[role=radiogroup]', f), img = campoImagem(f, 'np-img', d.img), v = id => $('#' + id, f).value;
    const tipo = () => $('[aria-checked=true]', grupo).dataset.tipo;
    const ler = () => ({ tipo: tipo(), area: v('np-area'), titulo: v('np-titulo'), precisa: v('np-precisa'), objetivo: v('np-objetivo'), finalidade: v('np-finalidade'), prazo: v('np-prazo'), formato: v('np-formato'), naoNota: $('#np-nota', f).checked, portefolioOk: $('#np-porte', f).checked, img: img() });
    radios(grupo);
    grupo.addEventListener('mudou', e => { const t = e.detail.dataset.tipo; $('#np-area', f).innerHTML = opcoesArea(t === 'ajuda' ? 'mat' : 'design', grupoDe(t)); });
    // modelo: preenche o tipo, a área e as perguntas, sem apagar o que já foi escrito
    f.addEventListener('click', e => { const b = e.target.closest('[data-modelo]'); if (!b) return; const m = MODELOS.find(x => x.id === b.dataset.modelo); grupo.querySelectorAll('[role=radio]').forEach(x => x.setAttribute('aria-checked', x.dataset.tipo === m.tipo)); $('#np-area', f).innerHTML = opcoesArea(m.area, grupoDe(m.tipo)); if (!v('np-titulo')) $('#np-titulo', f).value = m.titulo; if (!v('np-precisa')) $('#np-precisa', f).value = m.precisa; $('#np-titulo', f).focus(); });
    // rascunhos e modelos próprios
    let tempo = 0;
    const campos = r => { grupo.querySelectorAll('[role=radio]').forEach(x => x.setAttribute('aria-checked', x.dataset.tipo === r.tipo)); $('#np-area', f).innerHTML = opcoesArea(r.area, grupoDe(r.tipo)); ['titulo', 'precisa', 'objetivo', 'finalidade', 'formato'].forEach(k => { const el = $('#np-' + k, f); if (el && r[k] != null) el.value = r[k]; }); };
    f.addEventListener('click', e => {
      const rb = e.target.closest('[data-rascunho]'), mb = e.target.closest('[data-meu]');
      if (rb) { const l = LISTA_LOCAL.ler('pl-rascunhos'), r = l.find(x => x.id === rb.dataset.rascunho); if (r) { campos(r); LISTA_LOCAL.gravar('pl-rascunhos', l.filter(x => x.id !== r.id)); rb.remove(); toast('Rascunho aberto'); } }
      if (mb) { const m = LISTA_LOCAL.ler('pl-modelos').find(x => x.id === mb.dataset.meu); if (m) { campos(m); toast('Modelo aplicado'); } }
    });
    const guardarEm = (k, max, msg) => { const r = ler(); delete r.img; delete r.naoNota; delete r.prazo; if (!(r.titulo || r.precisa).trim()) return toast('Escreve pelo menos o título.'); const l = LISTA_LOCAL.ler(k).filter(x => x.titulo !== r.titulo); l.unshift(Object.assign({ id: 'l' + Date.now().toString(36) }, r)); if (LISTA_LOCAL.gravar(k, l.slice(0, max))) toast(msg); return true; };
    const bg = $('#np-guardar', f), bm = $('#np-modelo', f);
    if (bg) bg.addEventListener('click', () => { if (guardarEm('pl-rascunhos', 5, 'Guardado para mais tarde. Está em «Os teus rascunhos».')) { clearTimeout(tempo); Loja.guardarRascunho(null); fecharFolha(); } });
    if (bm) bm.addEventListener('click', () => guardarEm('pl-modelos', 8, 'Modelo guardado. Aparece nos modelos da próxima vez.'));
    // aviso de trabalho para nota e rascunho guardado enquanto se escreve
    $('form', f).addEventListener('input', () => {
      $('#np-aviso', f).hidden = !PARECE_NOTA.test(v('np-titulo') + ' ' + v('np-precisa') + ' ' + v('np-objetivo'));
      if (!editarId) { clearTimeout(tempo); tempo = setTimeout(() => { const r = ler(); delete r.img; delete r.naoNota; Loja.guardarRascunho(r); }, 500); }
    });
    $('form', f).addEventListener('submit', e => {
      e.preventDefault(); clearTimeout(tempo);
      const d0 = ler();
      verificarAntes([d0.titulo, d0.precisa, d0.objetivo, d0.finalidade], () => {
        const r = editarId ? Loja.editarPedido(editarId, d0) : Loja.publicarPedido(d0);
        if (resultado(r, $('.erro', f), editarId ? 'Pedido atualizado' : 'Pedido publicado') && !editarId) { F.pedSeg = 'meus'; abrir({ t: 'pedido', id: r.id }, 'pedidos'); }
      });
    });
  });
}

const ACOES = {
  // ----- navegação e filtros -----
  'fechar-folha': () => fecharFolha(),
  ir: d => { if (d.v === 'perfil' && (NAV.v !== 'perfil' || NAV.sub)) F.perfTab = 'resumo'; ir(d.v); },
  voltar: () => voltar(),
  renovar: d => { if (resultado(Loja.renovarPedido(d.id), null, 'O pedido fica aberto mais 30 dias')) desenhar(); },
  'fechar-parado': d => { if (resultado(Loja.cancelarPedido(d.id, 'Já não é preciso.'), null, 'Pedido fechado')) desenhar(); },
  'passar-professor': () => { if (resultado(Loja.passarProfessor(), null, 'Agora entras como professor')) desenhar(); },
  'pn-prof': async d => { try { await Nuvem.aprovarProfessor(d.uid, d.ok === '1'); registar(d.ok === '1' ? 'link_aprovar_professor' : 'link_recusar_professor', d.uid, ''); toast(d.ok === '1' ? 'Professor confirmado' : 'Pedido recusado'); desenhar(); } catch (e) { toast('Não foi possível guardar.'); } },
  'sem-resposta': () => { RESPOSTA = null; desenhar(); },
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
  'alerta-area': d => { let l = alertasArea(); l = l.includes(d.area) ? l.filter(x => x !== d.area) : l.concat(d.area); try { localStorage.setItem('pl-alertas', JSON.stringify(l)); } catch (e) { /* sem espaço */ } desenhar(); },
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
      const linha = (a, attrs, t1, t2) => '<button class="conv" data-a="' + a + '" ' + attrs + '><div><b>' + esc(t1) + '</b><span>' + esc(t2) + '</span></div></button>';
      const pintar = () => {
        const v = norm(q.value.trim()); if (v.length < 2) { r.innerHTML = '<p class="muted">Escreve pelo menos 2 letras.</p>'; return; }
        const ped = DB.pedidos.filter(p => Loja.visivel(p) && norm(p.titulo + ' ' + p.precisa + ' ' + AREA(p.area).nome).includes(v)).slice(0, 8);
        const pes = Loja.pessoasVisiveis().filter(p => p.uid !== DB.eu && norm(p.nome + ' ' + (p.curso || '') + ' ' + p.areas.map(a => AREA(a).nome).join(' ') + ' ' + (p.ferramentas || []).join(' ')).includes(v)).slice(0, 8);
        const cvs = Loja.minhasConversas().map(c => { const o = Loja.pessoa(c.uids.find(u => u !== DB.eu)), p = Loja.pedido(c.pedidoId), m = (c.msgs || []).slice().reverse().find(x => norm(x.texto || '').includes(v)); return { c, o, p, m, ok: m || norm((o ? o.nome : '') + ' ' + (p ? p.titulo : '')).includes(v) }; }).filter(x => x.ok).slice(0, 8);
        r.innerHTML = (ped.length ? '<h3 class="h3">Pedidos</h3><div class="lista">' + ped.map(p => linha('ver-pedido', 'data-id="' + esc(p.id) + '"', p.titulo, AREA(p.area).nome + ' · ' + ESTADOS[p.estado].nome)).join('') + '</div>' : '')
          + (pes.length ? '<h3 class="h3">Pessoas</h3><div class="lista">' + pes.map(p => linha('ver-pessoa', 'data-uid="' + esc(p.uid) + '"', p.nome, rotuloTipo(p) + (p.curso ? ' · ' + p.curso : ''))).join('') + '</div>' : '')
          + (cvs.length ? '<h3 class="h3">Conversas</h3><div class="lista">' + cvs.map(x => linha('ver-conversa', 'data-id="' + esc(x.c.id) + '"', x.o ? x.o.nome : 'Conversa', x.m ? '«' + x.m.texto.slice(0, 80) + '»' : (x.p ? x.p.titulo : ''))).join('') + '</div>' : '')
          || '<p class="muted">Nada encontrado para «' + esc(q.value.trim()) + '».</p>';
      };
      q.addEventListener('input', pintar); q.focus();
    });
  },
  partilhar: d => {
    const p = Loja.pedido(d.id); if (!p) return;
    const url = location.origin + location.pathname + '#pedido/' + p.id, txt = 'Pedido na ' + APP_NOME + ': ' + p.titulo;
    if (navigator.share) navigator.share({ title: p.titulo, text: txt, url }).catch(() => { /* cancelado */ });
    else copiar(url, 'Ligação do pedido copiada. Cola-a onde quiseres.');
  },
  'avisos-sistema': async () => { if (AVISOS_SISTEMA.ligado()) { AVISOS_SISTEMA.desligar(); toast('Avisos no dispositivo desligados'); } else if (await AVISOS_SISTEMA.ligar()) { toast('Avisos ligados. Vais saber das mensagens e propostas mesmo com a app fechada no fundo.'); } desenhar(); },
  'ver-pedido': d => { fecharFolha(); abrir({ t: 'pedido', id: d.id }, 'pedidos'); },
  'ver-pessoa': d => { if (!d.uid) return; fecharFolha(); if (d.uid === DB.eu) ir('perfil'); else abrir({ t: 'pessoa', uid: d.uid }, 'freelancers'); },
  'ver-conversa': d => { fecharFolha(); Loja.marcarLida(d.id); abrir({ t: 'conversa', id: d.id }, 'conversas'); },
  'ped-seg': d => { F.pedSeg = d.s; desenhar(); },
  'ped-area': d => { F.pedArea = d.area; desenhar(); },
  'pes-area': d => { F.pesArea = d.area; desenhar(); },
  guardar: d => { toast(Loja.guardar(d.t, d.id) ? 'Guardado' : 'Tirado dos guardados'); desenhar(); },

  // ----- pedidos -----
  'novo-pedido': () => { const r = Loja.rascunho(); formPedido(r); if (r && (r.titulo || r.precisa)) toast('Recuperado o pedido que estavas a escrever'); },
  'editar-pedido': d => formPedido(Loja.pedido(d.id), d.id),
  'repetir-pedido': d => { const p = Loja.pedido(d.id); formPedido({ tipo: p.tipo, area: p.area, titulo: p.titulo, precisa: p.precisa, objetivo: p.objetivo, finalidade: p.finalidade, formato: p.formato, portefolioOk: p.portefolioOk }); },
  'cancelar-pedido': d => {
    const p = Loja.pedido(d.id);
    if (p.estado === 'em_curso') folhaTexto('Cancelar este pedido?', 'Porque cancelas?', 'Já há alguém a trabalhar nisto. O motivo fica na conversa.', 'Cancelar pedido', 200, t => Loja.cancelarPedido(d.id, t), 'Pedido cancelado');
    else confirmar('Cancelar este pedido?', 'O pedido deixa de aparecer na lista e as propostas ficam sem efeito. Não dá para voltar atrás.', 'Cancelar pedido', () => resultado(Loja.cancelarPedido(d.id, ''), null, 'Pedido cancelado'), true);
  },
  'partilhar-pedido': d => { const p = Loja.pedido(d.id); copiar('Pedido na ' + APP_NOME + ': «' + p.titulo + '» (' + AREA(p.area).nome + ')\n' + p.precisa + '\nObjetivo: ' + p.objetivo + (p.prazo ? '\nPrazo: ' + dataPrazo(p.prazo) : ''), 'Pedido copiado para partilhares'); },
  propor: d => {
    folha('Enviar proposta', '<form class="form" novalidate>' + campo('pp-t', 'Como podes ajudar?', '<textarea id="pp-t" maxlength="600"></textarea>', 'Diz o que fazes e como pensas fazer.') + campo('pp-d', 'Em quantos dias entregas?', '<input type="text" id="pp-d" inputmode="numeric" maxlength="3" placeholder="7">') + ERRO + '<button class="btn pri w">Enviar proposta</button></form>', f => {
      $('form', f).addEventListener('submit', e => { e.preventDefault(); const t = $('#pp-t', f).value, dd = $('#pp-d', f).value; verificarAntes([t], () => resultado(Loja.enviarProposta(d.id, t, dd), $('.erro', f), 'Proposta enviada')); });
    });
  },
  aceitar: d => { const r = Loja.aceitar(d.id); if (resultado(r, null, 'O trabalho começou')) abrir({ t: 'conversa', id: r.conversaId }, 'conversas'); },
  recusar: d => resultado(Loja.recusar(d.id), null, 'Feito'),
  convidar: d => {
    const meus = DB.pedidos.filter(p => p.uid === DB.eu && p.estado === 'aberto'), q = Loja.pessoa(d.uid);
    if (!meus.length) return folha('Convidar ' + q.nome, '<p class="muted">Para convidar alguém, precisas de um pedido aberto. Publica primeiro o pedido e depois volta a este perfil.</p><button class="btn pri" data-a="novo-pedido">Publicar um pedido</button>');
    folha('Convidar ' + q.nome, '<p class="muted">Escolhe o pedido para o qual queres convidar.</p><div class="lista">' + meus.map(p => '<button class="conv" data-pd="' + esc(p.id) + '"><div><b>' + esc(p.titulo) + '</b><span>' + esc(AREA(p.area).nome) + '</span></div></button>').join('') + '</div>', f => {
      f.addEventListener('click', e => { const b = e.target.closest('[data-pd]'); if (b) resultado(Loja.convidar(b.dataset.pd, d.uid), null, 'Convite enviado a ' + q.nome); });
    });
  },
  'convidar-direto': d => resultado(Loja.convidar(d.pd, d.uid), null, 'Convite enviado'),
  responder: d => folhaTexto('Responder à pergunta', 'A tua resposta', 'Fica visível para todos os que virem o pedido.', 'Responder', 400, t => Loja.responder(d.id, t), 'Resposta publicada'),

  // ----- trabalho em curso -----
  entregar: d => {
    folha('Entregar trabalho', '<form class="form" novalidate>' + campo('et-t', 'O que entregas?', '<textarea id="et-t" maxlength="800"></textarea>', 'Explica o que fizeste e como usar.') + campo('et-l', 'Ligação para os ficheiros', '<input type="url" id="et-l" maxlength="300" placeholder="https://">', 'Opcional. Uma pasta partilhada ou o endereço do site.') + htmlImagem('et-i', 'Imagem do trabalho') + ERRO + '<button class="btn pri w">Entregar</button></form>', f => {
      const img = campoImagem(f, 'et-i');
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.entregar(d.id, { texto: $('#et-t', f).value, link: $('#et-l', f).value, img: img() }), $('.erro', f), 'Trabalho entregue'); });
    });
  },
  desistir: d => folhaTexto('Desistir do trabalho?', 'Porque desistes?', 'O pedido volta a ficar aberto para outra pessoa e o motivo fica na conversa.', 'Desistir do trabalho', 200, t => Loja.desistir(d.id, t), 'Desististe do trabalho'),
  alteracoes: d => folhaTexto('Pedir alterações', 'O que falta mudar?', 'O trabalho volta a ficar em curso e a mensagem segue para a conversa.', 'Pedir alterações', 600, t => Loja.pedirAlteracoes(d.id, t), 'Pedido de alterações enviado'),
  concluir: d => {
    const p = Loja.pedido(d.id), q = Loja.pessoa(p.freelancerUid);
    folha('Confirmar e avaliar', '<form class="form" novalidate>' + htmlEstrelas('cc-l', 'Como correu o trabalho com ' + esc(q ? q.nome : 'esta pessoa') + '?') + campo('cc-t', 'O que dizes sobre o trabalho?', '<textarea id="cc-t" maxlength="400"></textarea>', 'Opcional. Fica visível no perfil de quem fez.')
      + '<div class="aviso">' + (p.portefolioOk ? 'Ao confirmar, o trabalho entra no portefólio de ' + esc(q ? q.nome : 'quem fez') + ', com a tua avaliação.' : 'Escolheste não mostrar este trabalho no portefólio. Só a avaliação fica visível.') + '</div>' + ERRO + '<button class="btn pri w">Confirmar e concluir</button></form>', f => {
      radios($('[role=radiogroup]', f));
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.concluir(d.id, { estrelas: lerEstrelas(f), texto: $('#cc-t', f).value }), $('.erro', f), 'Trabalho concluído'); });
    });
  },
  'fechar-sozinho': d => confirmar('Fechar o trabalho?', 'Quem pediu não respondeu. O trabalho fica concluído sem avaliação' + (Loja.pedido(d.id).portefolioOk ? ' e entra no teu portefólio.' : '.'), 'Fechar o trabalho', () => resultado(Loja.fecharSozinho(d.id), null, 'Trabalho fechado')),
  'avaliar-dono': d => {
    const p = Loja.pedido(d.id), q = Loja.pessoa(p.uid);
    folha('Avaliar quem pediu', '<form class="form" novalidate>' + htmlEstrelas('ad-l', 'Como foi trabalhar para ' + esc(q ? q.nome : 'esta pessoa') + '?') + campo('ad-t', 'O que dizes?', '<textarea id="ad-t" maxlength="400"></textarea>', 'Opcional. Explicou bem o que queria? Respondeu a tempo?') + ERRO + '<button class="btn pri w">Enviar avaliação</button></form>', f => {
      radios($('[role=radiogroup]', f));
      $('form', f).addEventListener('submit', e => { e.preventDefault(); resultado(Loja.avaliarDono(d.id, { estrelas: lerEstrelas(f), texto: $('#ad-t', f).value }), $('.erro', f), 'Avaliação enviada'); });
    });
  },
  'tirar-tarefa': d => resultado(Loja.tirarTarefa(d.pd, d.id), null, ''),
  comprovativo: d => {
    const p = Loja.pedido(d.id), dono = Loja.pessoa(p.uid), f = Loja.pessoa(p.freelancerUid), quandoFoi = dataLonga(p.concluidoEm || Date.now());
    const texto = 'Comprovativo de trabalho concluído na ' + APP_NOME + '\nTrabalho: ' + p.titulo + '\nÁrea: ' + AREA(p.area).nome + '\nFeito por: ' + (f ? f.nome : '') + '\nPedido por: ' + (dono ? dono.nome : '') + '\nConcluído em: ' + quandoFoi + (p.avaliacao ? '\nAvaliação: ' + p.avaliacao.estrelas + ' em 5' + (p.avaliacao.texto ? ' («' + p.avaliacao.texto + '»)' : '') : '');
    folha('Comprovativo', '<div class="comprov"><div class="cab" style="background-image:' + esc(Facetas.svg(p.id, AREA(p.area).cor, 6, 3)) + '"></div><div class="col"><span class="muted sm">Trabalho concluído na ' + APP_NOME + '</span><h3>' + esc(p.titulo) + '</h3><dl class="dl mini"><div><dt>Área</dt><dd>' + esc(AREA(p.area).nome) + '</dd></div><div><dt>Feito por</dt><dd>' + esc(f ? f.nome : '') + '</dd></div><div><dt>Pedido por</dt><dd>' + esc(dono ? dono.nome : '') + '</dd></div><div><dt>Concluído em</dt><dd>' + esc(quandoFoi) + '</dd></div></dl>' + (p.avaliacao ? '<div>' + estrelas(p.avaliacao.estrelas) + '</div>' + (p.avaliacao.texto ? '<p>' + esc(p.avaliacao.texto) + '</p>' : '') : '') + '</div></div><button class="btn" id="cp-copiar">' + ico('copiar') + 'Copiar o texto</button><button class="btn" id="cp-pdf">' + ico('selo') + 'Guardar em PDF</button><p class="muted sm">Usa o texto no currículo ou numa candidatura a estágio.</p>', fl => {
      $('#cp-copiar', fl).addEventListener('click', () => copiar(texto, 'Comprovativo copiado'));
      const pdf = $('#cp-pdf', fl); if (pdf) pdf.addEventListener('click', () => imprimirHTML('Comprovativo · ' + p.titulo, '<p class="m">Comprovativo de trabalho concluído na ' + esc(APP_NOME) + '</p><h1>' + esc(p.titulo) + '</h1>'
        + '<p><b>Feito por:</b> ' + esc(f ? f.nome : '') + (f && f.curso ? ' (' + esc(f.curso) + ')' : '') + '<br><b>Pedido por:</b> ' + esc(dono ? dono.nome : '') + '<br><b>Área:</b> ' + esc(AREA(p.area).nome) + '<br><b>Concluído em:</b> ' + esc(quandoFoi) + '</p>'
        + '<p><b>O que era preciso:</b> ' + esc(p.precisa) + '</p>' + (p.entrega ? '<p><b>O que foi entregue:</b> ' + esc(p.entrega.texto) + '</p>' : '')
        + (p.avaliacao ? '<div class="selo"><b>Avaliação: ' + p.avaliacao.estrelas + ' em 5</b>' + (p.avaliacao.texto ? '<br>«' + esc(p.avaliacao.texto) + '»' : '') + '</div>' : '')
        + '<p class="m">Referência: ' + esc(p.id) + '. Este comprovativo mostra um trabalho feito entre alunos e professores da escola; não é um documento oficial.</p>'));
    });
  },
  'resposta-rapida': d => { const r = Loja.enviarMensagem(d.id, d.t); if (r.erro) toast(r.erro); else desenhar(); }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = ACOES[b.dataset.a]; if (a) { e.preventDefault(); a(Object.assign({}, b.dataset)); }
});
