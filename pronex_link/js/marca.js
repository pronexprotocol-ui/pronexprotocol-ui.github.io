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
  try { localStorage.setItem('pronex-secao', secao); } catch (e) { /* sem armazenamento: a entrada mostra a escolha */ }

  // 3. Abas da app PRONEX: faixa no topo de todos os ecrãs (Site · Study · Freelancer).
  //    O escudo e a aba «Site» levam ao site da PRONEX (../), que é o início de tudo. A aba da secção atual fica marcada (aria-current).
  (function abas() {
    if (document.querySelector('.pxt')) return;
    var aba = function (href, nome, id) { return '<a href="' + href + '"' + (id === secao ? ' aria-current="page"' : '') + '>' + nome + '</a>'; };
    var n = document.createElement('nav');
    n.className = 'pxt';
    n.setAttribute('aria-label', 'App PRONEX');
    n.innerHTML = '<a class="pxt-marca" href="../" aria-label="PRONEX: site"><img src="icons/pronex.webp" alt="" width="28" height="29"><span>PRONEX</span></a>' +
      '<div class="pxt-abas">' + aba('../', 'Site', 'site') + aba('../pronex_study/', 'Study', 'study') + aba('../pronex_link/', 'Freelancer', 'freelancer') + '</div>';
    document.body.insertBefore(n, document.body.firstChild);
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
