/* Pronex_Link · 13-arranque.js
   Pinta a app (`desenhar`), as barras de navegação, liga os campos (pesquisa, tarefas, perguntas, conversa)
   e arranca. É o último ficheiro a carregar. */
'use strict';
function aplicarTema() {
  if (!DB) return;
  const claro = DB.tema === 'claro', h = document.documentElement;
  h.classList.toggle('claro', claro); h.classList.toggle('grande', DB.texto === 'grande');
  const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', claro ? '#F4F5FA' : '#090B1A');
}
function pintarBarras() {
  const eu = Loja.eu(); if (!eu) return;
  const nl = Loja.totalNaoLidas(), cv = Loja.convites().length, av = Loja.avisosPorLer();
  const bolha = id => id === 'conversas' && nl ? '<span class="dot">' + nl + '</span>' : id === 'inicio' && cv ? '<span class="dot">' + cv + '</span>' : '';
  const nav = SEPARADORES.map(s => '<button data-a="ir" data-v="' + s.id + '"' + (NAV.v === s.id ? ' aria-current="page"' : '') + '>' + ico(s.ico) + '<span>' + s.nome + '</span>' + bolha(s.id) + '</button>').join('');
  $('#tabbar').innerHTML = nav;
  $('#snav').innerHTML = nav + '<button data-a="avisos">' + ico('sino') + '<span>Avisos</span>' + (av ? '<span class="dot">' + av + '</span>' : '') + '</button>';
  $('#sino').innerHTML = ico('sino') + (av ? '<span class="dot">' + av + '</span>' : '');
  $('#sino').setAttribute('aria-label', av ? 'Avisos, ' + av + ' por ler' : 'Avisos');
  $('#sidecard').innerHTML = avatar(eu) + '<div><b>' + esc(eu.nome) + '</b><span>' + esc(rotuloTipo(eu)) + '</span></div>';
  $('#demo').hidden = Nuvem.ativa();
  if (!Nuvem.ativa()) $('#demo').innerHTML = '<span>Demonstração. Estás a usar a app como <b>' + esc(eu.nome) + '</b>.</span><button data-a="trocar">Trocar</button>';
}
function desenhar(topo) {
  const eu = DB && (!Nuvem.ativa() || Nuvem.estado() === 'dentro') ? Loja.eu() : null, app = $('#app'), ent = $('#entrada');
  if (!eu) {
    app.hidden = true; $('#tabbar').hidden = true; ent.hidden = false;
    const k = chaveEntrada(); if (ent.dataset.k !== k) { ent.dataset.k = k; ent.innerHTML = ecraEntrada(); ligarEntrada(); window.scrollTo(0, 0); }
    return;
  }
  ent.hidden = true; ent.innerHTML = ''; ent.dataset.k = ''; app.hidden = false; $('#tabbar').hidden = false;
  // guarda o foco e o texto por enviar, para os repor depois de pintar
  const v = $('#vista'), ativo = document.activeElement, fid = ativo && ativo.id && v.contains(ativo) ? ativo.id : '', pos = fid && ativo.selectionStart != null ? ativo.selectionStart : null;
  const porEnviar = {}; ['msg-t', 'tarefa-t', 'pergunta-t'].forEach(id => { const el = document.getElementById(id); if (el && el.value) porEnviar[id] = el.value; });
  pintarBarras();
  v.innerHTML = NAV.v === 'pedidos' ? ecraPedidos() : NAV.v === 'freelancers' ? ecraFreelancers() : NAV.v === 'conversas' ? ecraConversas() : NAV.v === 'perfil' ? ecraPessoa(DB.eu) : ecraInicio();
  document.title = (SEPARADORES.find(s => s.id === NAV.v) || SEPARADORES[0]).nome + ' · ' + APP_NOME;
  if (!topo) Object.keys(porEnviar).forEach(id => { const el = document.getElementById(id); if (el) el.value = porEnviar[id]; });
  if (fid && !topo) { const el = document.getElementById(fid); if (el) { el.focus({ preventScroll: true }); if (pos != null) try { el.setSelectionRange(pos, pos); } catch (e) { /* campo sem cursor */ } } }
  if (NAV.sub && NAV.sub.t === 'conversa') { Loja.marcarLida(NAV.sub.id); requestAnimationFrame(() => window.scrollTo(0, document.documentElement.scrollHeight)); }
  else if (topo) window.scrollTo(0, 0);
  if (Loja.semEspaco()) toast('Este dispositivo está sem espaço: a última alteração pode não ter ficado guardada.');
}
function ligarEntrada() {
  const tipoRadios = f => { const g = $('[role=radiogroup]', f); if (!g) return null; radios(g); g.addEventListener('mudou', e => { const prof = e.detail.dataset.tipo === 'professor'; $('#en-cl').textContent = prof ? 'Disciplina ou área' : 'Ano e curso'; $('#en-curso').placeholder = prof ? 'Matemática' : '11.º, Multimédia'; const pr = $('#en-prof'); if (pr) pr.hidden = !prof; }); return g; };
  const erro = t => { const er = $('#en-erro'); if (er) { er.textContent = t; er.hidden = !t; } else toast(t); };
  // modo de demonstração
  const fd = $('#f-entrada');
  if (fd) {
    const g = tipoRadios(fd);
    fd.addEventListener('submit', e => {
      e.preventDefault();
      const r = Loja.criarPerfil({ nome: $('#en-nome').value, tipo: $('[aria-checked=true]', g).dataset.tipo, curso: $('#en-curso').value, idade: $('#en-idade').checked, regras: $('#en-regras').checked });
      if (r.erro) return erro(r.erro);
      ir('inicio'); if (!Loja.guiaVisto()) { Loja.verGuia(); ACOES.guia(); }
    });
  }
  // conta: entrar com email
  const fe = $('#f-email');
  if (fe) fe.addEventListener('submit', async e => {
    e.preventDefault(); const b = $('.btn.pri', fe); b.disabled = true; erro('');
    try { await Nuvem.entrarEmail($('#en-email').value, $('#en-pass').value); } catch (x) { erro(Nuvem.msgErro(x)); }
    b.disabled = false;
  });
  // conta: criar o perfil na primeira entrada
  const fp = $('#f-perfil');
  if (fp) {
    const g = tipoRadios(fp);
    Nuvem.nomeDaStudy().then(n => { const i = $('#en-nome'); if (n && i && !i.value) i.value = n.slice(0, 40); });
    fp.addEventListener('submit', async e => {
      e.preventDefault(); const b = $('.btn.pri', fp); b.disabled = true; erro('');
      try {
        const r = await Nuvem.criarPerfil({ nome: $('#en-nome').value, tipo: $('[aria-checked=true]', g).dataset.tipo, curso: $('#en-curso').value, idade: $('#en-idade').checked, regras: $('#en-regras').checked });
        if (r.erro) erro(r.erro); else { ir('inicio'); if (!Loja.guiaVisto()) { Loja.verGuia(); ACOES.guia(); } }
      } catch (x) { erro('Não foi possível criar o perfil (' + ((x && x.code) || 'erro') + ').'); }
      b.disabled = false;
    });
  }
}
// campos que filtram listas
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'ped-q') { F.pedQ = t.value; desenhar(); }
  else if (t.id === 'pes-q') { F.pesQ = t.value; desenhar(); }
  else if (t.id === 'msg-t') { t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight + 2) + 'px'; }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'ped-ord') { F.pedOrd = t.value; desenhar(); }
  else if (t.id === 'pes-disp') { F.pesDisp = t.checked; desenhar(); }
  else if (t.id === 'pes-guard') { F.pesGuard = t.checked; desenhar(); }
  else if (t.dataset.tarefa) { const r = Loja.marcarTarefa(t.dataset.pd, t.dataset.tarefa); if (r.erro) toast(r.erro); desenhar(); }
  else if (t.id === 'msg-img' && t.files[0]) { // imagem enviada na conversa
    try { const img = await lerImagem(t.files[0]), r = Loja.enviarMensagem(t.form.dataset.id, '', img); if (r.erro) toast(r.erro); } catch (er) { toast(er.message); }
    desenhar();
  }
});
// formulários que vivem dentro dos ecrãs (os das folhas ligam-se quando a folha abre)
function enviarMsg(form) {
  const t = $('#msg-t', form), r = Loja.enviarMensagem(form.dataset.id, t.value);
  if (r.erro) return toast(r.erro);
  if (r.ok) { t.value = ''; desenhar(); const n = $('#msg-t'); if (n) n.focus({ preventScroll: true }); }
}
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'escrever') { e.preventDefault(); enviarMsg(f); }
  else if (f.id === 'f-tarefa') { e.preventDefault(); const t = $('#tarefa-t', f), r = Loja.juntarTarefa(f.dataset.pd, t.value); if (r.erro) return toast(r.erro); t.value = ''; desenhar(); const n = $('#tarefa-t'); if (n) n.focus({ preventScroll: true }); }
  else if (f.id === 'f-pergunta') { e.preventDefault(); const t = $('#pergunta-t', f), r = Loja.perguntar(f.dataset.pd, t.value); if (r.erro) return toast(r.erro); t.value = ''; toast('Pergunta publicada'); desenhar(); }
});
// conversa: Enter envia, Shift+Enter muda de linha
document.addEventListener('keydown', e => { if (e.target.id === 'msg-t' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviarMsg(e.target.form); } });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (SEPARADORES.some(s => s.id === h) && (h !== NAV.v || NAV.sub)) { PILHA.length = 0; NAV = { v: h, sub: null }; desenhar(true); } });

(function arrancar() {
  const h = location.hash.slice(1); if (SEPARADORES.some(s => s.id === h)) NAV.v = h;
  if (Nuvem.disponivel() && !Nuvem.modoDemo()) {
    // Com conta: DB fica vazio até a conta e os dados chegarem (Nuvem chama desenhar).
    DB = null; desenhar(true);
    Nuvem.iniciar().catch(e => { console.warn('Pronex_Link: Firebase', e); ERRO_NUVEM = 'Não foi possível ligar ao servidor. Confirma a ligação à internet.'; desenhar(true); });
  } else { Loja.iniciar(); aplicarTema(); desenhar(true); }
  // Guarda a app para abrir sem internet. Só existe quando a app está publicada no seu endereço.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && /github\.io$/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { /* sem service worker a app funciona na mesma */ });
})();
