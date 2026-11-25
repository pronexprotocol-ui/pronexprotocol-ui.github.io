/* PRONEX · marca.js
   A marca PRONEX dentro das duas secções da app: Study (pronex_study/) e Freelancer (pronex_link/).
   Este ficheiro é IGUAL nas duas pastas (pronex_study/js/marca.js e pronex_link/js/marca.js): muda os dois ao mesmo tempo.
   Faz três coisas (a terceira, as abas da app, está explicada mais abaixo):
     1. guarda no navegador a última secção aberta ("pronex-secao": "study" ou "freelancer"). A entrada da app (/app/)
        usa isto para abrir logo a secção em que estavas;
     2. pxSplash(fim): mostra o ecrã de arranque da marca (escudo, PRONEX e a secção) uma vez por sessão.
        A chave "pronex-splash" é comum às duas secções: ao mudar de Study para Freelancer não volta a aparecer.
   A secção vem do atributo data-secao do <html> (study / freelancer). O escudo vem da imagem do topo (.brand img). */
(function () {
  'use strict';
  var secao = document.documentElement.getAttribute('data-secao') || 'study';
  /* Tema comum (1.44 / 0.19): o site, o Study e o Freelancer usam a mesma escolha de tema.
     Fica em "pronex-tema-comum" ("escuro", "claro" ou "auto"). Ao abrir uma secção, esta escolha passa à frente da
     que a secção tinha guardada; quando se muda o tema numa secção, ela chama window.pxTema(valor). */
  try {
    var comum = localStorage.getItem('pronex-tema-comum');
    if (comum === 'claro' || comum === 'escuro' || comum === 'auto') {
      var claro = comum === 'claro' || (comum === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
      var raiz = document.documentElement;
      if (secao === 'study') { localStorage.setItem('x13-theme', JSON.stringify(comum)); raiz.classList.toggle('x13light', claro); raiz.style.colorScheme = claro ? 'light' : 'dark'; }
      else raiz.classList.toggle('claro', claro);
    }
  } catch (e) { /* sem armazenamento: cada secção fica com o seu tema */ }
  window.pxTema = function (t) { try { if (t === 'claro' || t === 'escuro' || t === 'auto') localStorage.setItem('pronex-tema-comum', t); } catch (e) { /* idem */ } };
  window.pxTemaComum = function () { try { var t = localStorage.getItem('pronex-tema-comum'); return t === 'claro' || t === 'escuro' || t === 'auto' ? t : null; } catch (e) { return null; } };
  try { localStorage.setItem('pronex-secao', secao); } catch (e) { /* sem armazenamento: a entrada mostra a escolha */ }

  /* A app instalada abre sempre a PRONEX (o site). Quem instalou antes o Study ou o Freelancer como app à parte tem um
     ícone que abre direto aqui: na primeira página dessa janela (sem página anterior, sem atalho na morada), passa para o início.
     Os atalhos (?a=…, #pedidos…) e quem vem do site entram na secção normalmente. */
  try {
    var instalada = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    if (instalada && !document.referrer && !location.search && !location.hash && !sessionStorage.getItem('pronex-dentro')) {
      sessionStorage.setItem('pronex-dentro', '1');
      location.replace('../');
      return;
    }
    sessionStorage.setItem('pronex-dentro', '1');
  } catch (e) { /* sem armazenamento: fica na secção */ }

  // 3. Abas da app PRONEX: faixa no topo de todos os ecrãs (Site · Study · Freelancer).
  //    O escudo e a aba «Início» levam ao site da PRONEX (../), que é o início de tudo. A aba da secção atual fica marcada (aria-current).
  (function abas() {
    if (document.querySelector('.pxt')) return;
    var aba = function (href, nome, id) { return '<a href="' + href + '"' + (id === secao ? ' aria-current="page"' : '') + '>' + nome + '</a>'; };
    var n = document.createElement('nav');
    n.className = 'pxt';
    n.setAttribute('aria-label', 'App PRONEX');
    n.innerHTML = '<a class="pxt-marca" href="../" aria-label="PRONEX: início"><img src="icons/pronex-80.webp" alt="" width="28" height="29"><span>PRONEX</span></a>' +
      '<div class="pxt-abas">' + aba('../', 'Início', 'site') + aba('../pronex_study/', 'Study', 'study') + aba('../pronex_link/', 'Freelancer', 'freelancer') + '</div>';
    document.body.insertBefore(n, document.body.firstChild);
  })();

  // 3b. (1.48 / 0.22) No computador, a faixa do topo sai e a barra lateral ganha o grupo «Apps PRONEX», igual ao do site:
  //     Início da marca, Study e Freelancer, com a secção atual marcada. Assim as três barras laterais têm a mesma forma.
  (function lateral() {
    var ic = {
      site: '<path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z"/>',
      study: '<path d="M12 3l9 4-9 4-9-4zM7 9v5c0 2 2.5 3 5 3s5-1 5-3V9"/>',
      freelancer: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.6"/><path d="M3 20a6 6 0 0112 0M14.5 15.2A5 5 0 0121 20"/>'
    };
    var lig = function (href, nome, id) {
      return '<a href="' + href + '"' + (id === secao ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic[id] + '</svg><span>' + nome + '</span></a>';
    };
    var por = function () {
      var side = document.querySelector('.side'), sn = side && side.querySelector('.snav');
      if (!sn || side.querySelector('.pxl')) return;
      var n = document.createElement('nav');
      n.className = 'pxl';
      n.setAttribute('aria-label', 'Apps PRONEX');
      n.innerHTML = '<p>Apps PRONEX</p>' + lig('../', 'Início da PRONEX', 'site') + lig('../pronex_study/', 'Study', 'study') + lig('../pronex_link/', 'Freelancer', 'freelancer');
      sn.after(n);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', por); else por();
  })();

  window.pxSplash = function (fim) {
    var feito = false;
    var acabar = function () { if (!feito) { feito = true; if (typeof fim === 'function') fim(); } };
    var visto = false;
    try { visto = sessionStorage.getItem('pronex-splash') === '1'; sessionStorage.setItem('pronex-splash', '1'); } catch (e) { /* mostra na mesma */ }
    if (visto) { acabar(); return; }
    var calmo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var logo = document.querySelector('.brand img');
    var s = document.createElement('div');
    s.className = 'pxs';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<div class="pxs-in"><img src="' + (logo ? logo.getAttribute('src') : '') + '" alt="" width="104" height="106">' +
      '<b class="pxs-marca">PRONEX</b><span class="pxs-sec">' + (secao === 'freelancer' ? 'Freelancer' : 'Study') + '</span><i class="pxs-linha"></i></div>';
    document.body.appendChild(s);
    setTimeout(function () {
      s.classList.add('out');
      acabar();
      setTimeout(function () { s.remove(); }, calmo ? 0 : 480);
    }, calmo ? 650 : 1200);
  };
})();
