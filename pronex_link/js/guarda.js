/* PRONEX · guarda dos dados (igual no Study e no Freelancer; tem de ser o primeiro script a correr)
   Regra fixa de 25-11-2026: nenhuma atualização pode perder registos dos utilizadores.

   O que faz:
   1. Mal a página abre, e ANTES de o código da app tocar nos dados, tira uma fotografia de tudo o que está guardado
      neste aparelho (localStorage do site, que o Study e o Freelancer partilham).
   2. Guarda essa fotografia numa base própria (IndexedDB «pronex-guarda») quando a versão da app muda
      (a app chama pxGuarda.versao(...)) ou quando a última cópia tem mais de 20 horas. Ficam as 6 mais recentes.
   3. «Os meus registos e cópias» (qualquer elemento com data-pxg abre a janela): mostra o que a conta tem, as cópias
      deste aparelho, e deixa descarregar ou repor uma cópia. Repor nunca apaga: escreve por cima e guarda antes o estado atual.

   Não apaga nem altera dados da app. As chaves desta guarda começam por «pronex-guarda». */
(function () {
  'use strict';
  var BD = 'pronex-guarda', LOJA = 'copias', MAX = 6, HORAS20 = 72e6;
  var K_EM = 'pronex-guarda-em', K_VER = 'pronex-guarda-ver';
  var secao = document.documentElement.getAttribute('data-secao') || 'study';

  function fotografia() {
    var o = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('pronex-guarda') !== 0) o[k] = localStorage.getItem(k); } } catch (e) { /* sem armazenamento */ }
    return o;
  }
  var aoAbrir = fotografia();   // estado dos dados antes de a app correr

  function abrirBD() {
    return new Promise(function (ok, falha) {
      try {
        var r = indexedDB.open(BD, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(LOJA, { keyPath: 'em' }); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { falha(r.error); };
      } catch (e) { falha(e); }
    });
  }
  function pedido(modo, fn) {
    return abrirBD().then(function (bd) {
      return new Promise(function (ok, falha) {
        var t = bd.transaction(LOJA, modo), res = fn(t.objectStore(LOJA));
        t.oncomplete = function () { bd.close(); ok(res && 'result' in res ? res.result : undefined); };
        t.onerror = t.onabort = function () { bd.close(); falha(t.error); };
      });
    });
  }
  function bytes(d) { var n = 0; for (var k in d) n += k.length + (d[k] ? d[k].length : 0); return n; }

  function listar() {
    return pedido('readonly', function (l) { return l.getAll(); }).then(function (c) {
      return (c || []).sort(function (a, b) { return b.em - a.em; });
    });
  }
  function copiar(motivo, dados) {
    dados = dados || fotografia();
    if (!Object.keys(dados).length) return Promise.resolve(null);
    var c = { em: Date.now(), motivo: motivo, secao: secao, chaves: Object.keys(dados).length, bytes: bytes(dados), dados: dados };
    return pedido('readwrite', function (l) { return l.put(c); }).then(function () {
      try { localStorage.setItem(K_EM, String(c.em)); } catch (e) { /* sem espaço: a cópia ficou na base */ }
      return listar();
    }).then(function (todas) {
      var fora = todas.slice(MAX);
      if (!fora.length) return c;
      return pedido('readwrite', function (l) { fora.forEach(function (x) { l.delete(x.em); }); }).then(function () { return c; });
    });
  }
  /* Repor: guarda primeiro o estado atual e depois escreve as chaves da cópia. Não remove chaves que existam agora. */
  function repor(em) {
    return listar().then(function (todas) {
      var c = todas.filter(function (x) { return x.em === em; })[0];
      if (!c) throw new Error('Cópia não encontrada.');
      return copiar('antes de repor a cópia de ' + data(c.em)).then(function () {
        for (var k in c.dados) { try { localStorage.setItem(k, c.dados[k]); } catch (e) { throw new Error('Sem espaço no aparelho para repor a cópia.'); } }
        // até a página recarregar, a app não pode gravar por cima do que acabou de ser reposto
        try { Storage.prototype.setItem = function () {}; Storage.prototype.removeItem = function () {}; } catch (e) { /* segue */ }
        return c;
      });
    });
  }
  function descarregar(c) {
    var nome = 'pronex-copia-' + new Date(c.em).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'PRONEX', tipo: 'cópia do aparelho', feitaEm: new Date(c.em).toISOString(), motivo: c.motivo, dados: c.dados }, null, 1)], { type: 'application/json' }));
    a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* A app diz que versão está a correr. Se mudou desde a última vez, guarda a fotografia tirada ao abrir. */
  function versao(v) {
    var chave = K_VER + '-' + secao, antes = null;
    try { antes = localStorage.getItem(chave); } catch (e) { /* sem armazenamento */ }
    if (antes === String(v)) return Promise.resolve(false);
    try { localStorage.setItem(chave, String(v)); } catch (e) { /* idem */ }
    return copiar(antes ? 'antes de passar da versão ' + antes + ' para a ' + v : 'primeira cópia (versão ' + v + ')', aoAbrir).then(function () { return true; }, function () { return false; });
  }
  // cópia de rotina: uma por dia de uso, com o estado de quando a página abriu
  try {
    var ult = +localStorage.getItem(K_EM) || 0;
    if (Date.now() - ult > HORAS20) setTimeout(function () { copiar('cópia diária', aoAbrir).catch(function () { /* sem IndexedDB: fica sem cópia local */ }); }, 4000);
  } catch (e) { /* sem armazenamento */ }

  /* ---------- «Os meus registos e cópias» ---------- */
  function data(ms) { try { return new Date(ms).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return new Date(ms).toISOString(); } }
  function tam(n) { return n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function txt(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* Cada secção pode dizer o que a conta tem: window.pxGuarda.contar = () => [{ nome, n }] */
  function contagens() {
    try { if (typeof api.contar === 'function') return api.contar() || []; } catch (e) { /* sem contagens */ }
    return [];
  }
  function abrir() {
    var velho = document.getElementById('pxg'); if (velho) velho.remove();
    var d = document.createElement('dialog');
    d.id = 'pxg'; d.className = 'pxg'; d.setAttribute('aria-labelledby', 'pxg-t');
    var conta = contagens();
    d.innerHTML = '<form method="dialog" class="pxg-topo"><h2 id="pxg-t">Os meus registos e cópias</h2><button type="submit" class="pxg-x" aria-label="Fechar">×</button></form>'
      + '<p class="pxg-nota">Nenhuma atualização da PRONEX apaga os teus registos. Aqui confirmas o que está guardado.</p>'
      + (conta.length ? '<h3>O que tens agora</h3><ul class="pxg-num">' + conta.map(function (c) { return '<li><b>' + txt(c.n) + '</b><span>' + txt(c.nome) + '</span></li>'; }).join('') + '</ul>' : '')
      + '<h3>Cópias neste aparelho</h3><p class="pxg-nota">Feitas sozinhas: uma por dia de uso e uma antes de cada versão nova. Ficam as ' + MAX + ' mais recentes.</p><div class="pxg-lista" aria-live="polite">A ler…</div>'
      + '<div class="pxg-fim"><button type="button" class="pxg-b" data-g="agora">Fazer uma cópia agora</button></div>';
    document.body.appendChild(d);
    var lista = d.querySelector('.pxg-lista');
    function pintar() {
      listar().then(function (todas) {
        lista.innerHTML = todas.length ? '<ul>' + todas.map(function (c) {
          return '<li><div><b>' + txt(data(c.em)) + '</b><span>' + txt(c.motivo) + ' · ' + tam(c.bytes) + '</span></div><div class="pxg-ac"><button type="button" class="pxg-b" data-g="baixar" data-em="' + c.em + '">Descarregar</button><button type="button" class="pxg-b" data-g="repor" data-em="' + c.em + '">Repor</button></div></li>';
        }).join('') + '</ul>' : '<p class="pxg-nota">Ainda não há cópias neste aparelho. A primeira é feita daqui a instantes.</p>';
      }, function () { lista.innerHTML = '<p class="pxg-nota">Este navegador não deixa guardar cópias no aparelho (modo privado ou sem espaço).</p>'; });
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return;
      var em = +b.getAttribute('data-em'), g = b.getAttribute('data-g');
      if (g === 'agora') { b.disabled = true; copiar('cópia feita à mão').then(function () { b.disabled = false; pintar(); }, function () { b.disabled = false; pintar(); }); }
      if (g === 'baixar') listar().then(function (t) { var c = t.filter(function (x) { return x.em === em; })[0]; if (c) descarregar(c); });
      if (g === 'repor') {
        if (b.getAttribute('data-certo') !== '1') { b.setAttribute('data-certo', '1'); b.textContent = 'Repor mesmo? Toca outra vez'; return; }
        b.disabled = true;
        repor(em).then(function () { location.reload(); }, function (err) { b.disabled = false; b.removeAttribute('data-certo'); b.textContent = (err && err.message) || 'Não foi possível repor'; });
      }
    });
    d.addEventListener('close', function () { d.remove(); });
    pintar();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-pxg]'); if (a) { e.preventDefault(); abrir(); } });

  var api = { versao: versao, copiar: copiar, listar: listar, repor: repor, abrir: abrir, contar: null };
  window.pxGuarda = api;
})();
