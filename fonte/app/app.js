/* ==========================================================================
   PRONEX · app/app.js · lógica da app PRONEX (Estudos + Freelancer)
   1. Escolhe o separador inicial: o do endereço (#estudos / #freelancer),
      senão o último usado, senão Estudos.
   2. Troca de separador (clique, setas do teclado) e carrega cada app só
      na primeira vez que é aberta.
   3. Dentro das apps, os links de uma app para a outra (que normalmente
      abrem noutro separador do navegador) passam a trocar de separador aqui.
   4. As cores da barra seguem a app aberta (tema claro/escuro e fundo).
   5. Guarda a app PRONEX para abrir sem rede (service worker do site).
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'pronex-app-ultima';           // localStorage: último separador usado
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var painel = function (app) { return document.getElementById('painel-' + app); };
  var PASTA = { estudos: '/pronex_study/', freelancer: '/pronex_link/' };

  // ---------- 4. Cores da barra a partir da app aberta ----------
  function luz(cor) {               // 0 (preto) a 255 (branco), a partir de "rgb(r, g, b)"
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(cor || '');
    if (!m || m[4] === '0') return null;
    return 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3];
  }
  function cores(app) {
    try {
      var doc = painel(app).contentDocument;
      if (!doc || !doc.body) return;
      var fundo = getComputedStyle(doc.body).backgroundColor;
      if (luz(fundo) === null) fundo = getComputedStyle(doc.documentElement).backgroundColor;
      var l = luz(fundo);
      if (l === null) return;
      document.documentElement.style.setProperty('--fundo-app', fundo);
      document.documentElement.setAttribute('data-tema', l > 140 ? 'claro' : 'escuro');
      var meta = document.querySelector('meta[name="theme-color"]');
      var barra = getComputedStyle(document.querySelector('.barra')).backgroundColor;
      if (meta) meta.setAttribute('content', barra);
    } catch (e) { /* app noutra origem (ex.: página do Google ao entrar): fica como está */ }
  }

  // ---------- 3. Links de uma app para a outra ----------
  function ligar(app) {
    var f = painel(app);
    f.addEventListener('load', function () {
      var doc;
      try { doc = f.contentDocument; } catch (e) { return; }
      if (!doc) return;
      doc.addEventListener('click', function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (!a) return;
        var url;
        try { url = new URL(a.getAttribute('href'), doc.baseURI); } catch (e) { return; }
        if (url.origin !== location.origin) return;
        var destino = Object.keys(PASTA).filter(function (k) { return url.pathname.indexOf(PASTA[k]) === 0 && k !== app; })[0];
        if (!destino) return;
        ev.preventDefault();
        mostrar(destino, true);
      }, true);
      cores(app);
      // A app pode mudar de tema depois de abrir (ex.: definições): volta a ver as cores de vez em quando
      try { new MutationObserver(function () { if (!f.hidden) cores(app); }).observe(doc.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] }); } catch (e) {}
    });
  }

  // ---------- 2. Trocar de separador ----------
  function mostrar(app, focar) {
    tabs.forEach(function (t) {
      var sim = t.getAttribute('data-app') === app;
      t.setAttribute('aria-selected', sim ? 'true' : 'false');
      t.tabIndex = sim ? 0 : -1;
      var p = painel(t.getAttribute('data-app'));
      p.hidden = !sim;
      if (sim && !p.getAttribute('src')) p.setAttribute('src', p.getAttribute('data-src'));
      if (sim && focar) t.focus();
    });
    try { localStorage.setItem(CHAVE, app); } catch (e) {}
    try { history.replaceState(null, '', '#' + app); } catch (e) {}
    document.title = (app === 'estudos' ? 'Estudos' : 'Freelancer') + ' · PRONEX';
    cores(app);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { mostrar(t.getAttribute('data-app')); });
    t.addEventListener('keydown', function (ev) {     // setas, Home e End, como nos separadores do sistema
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[ev.key];
      if (n === undefined) return;
      ev.preventDefault();
      mostrar(tabs[(n + tabs.length) % tabs.length].getAttribute('data-app'), true);
    });
  });
  Object.keys(PASTA).forEach(ligar);
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (PASTA[h]) mostrar(h); });

  // ---------- 1. Separador inicial ----------
  var inicial = location.hash.slice(1);
  if (!PASTA[inicial]) { try { inicial = localStorage.getItem(CHAVE); } catch (e) { inicial = null; } }
  mostrar(PASTA[inicial] ? inicial : 'estudos');

  // ---------- 5. Sem rede ----------
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function () {});
})();
