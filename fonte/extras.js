/* ==========================================================================
   PRONEX · extras.js
   Funcionalidades acrescentadas em novembro de 2026 (lista das 100 melhorias),
   num ficheiro à parte para não mexer na lógica de negócio do script.js
   (preços, orçamento, questionário, agenda e envio).
   Cada bloco é independente: se a página não tiver o elemento de que precisa,
   o bloco não faz nada. O número entre parênteses é o ponto da lista.

   Índice
     0. Configuração (a única parte que se edita à mão)
     1. Ferramentas pequenas usadas por todos os blocos
     2. Proteção dos formulários: robôs e envios repetidos      (2, 3)
     3. Número do pedido                                          (85)
     4. Orçamento: copiar link, comparar formatos, 1.º ano,
        aviso de saída                                            (77, 78, 79, 96)
     5. Questionário: guardar respostas e explicar o resultado   (80, 81)
     6. Perguntas frequentes com ligação direta                  (89)
     7. Portfólio: o filtro fica no endereço                     (90)
     8. Guias: pesquisa por palavra                              (88)
     9. Língua: lembrar a versão escolhida                       (87)
    10. Atalho T para trocar o tema                              (97)
    11. 404 em inglês para endereços /en/                        (34)
    12. Próxima vaga no selo "A aceitar projetos"                (93)
    13. Marcação: juntar ao calendário (.ics)                    (86)
    14. Contagem de cliques importantes                          (94, 95)
    15. Funcionar sem rede (service worker)                      (100)
    16. Página do estado do projeto (estado.html)               (98)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 0. Configuração ----------
     PROXIMA_VAGA: quando estiveres com a agenda cheia, escreve aqui a próxima
     data livre (por exemplo 'janeiro' / 'January'). Vazio = não mostra nada. */
  var CONFIG = {
    PROXIMA_VAGA: { pt: '', en: '' },
    ESPERA_ENTRE_ENVIOS: 30,   // segundos entre dois pedidos do mesmo navegador
    TEMPO_MINIMO: 3            // segundos: uma pessoa nunca preenche e envia mais depressa
  };

  /* ---------- 1. Ferramentas pequenas ---------- */

  // A língua da página decide os textos (o <html lang> é "pt-PT" ou "en")
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var T = EN ? {
    tooFast: 'That was very quick. Please check the form and try again.',
    wait: function (s) { return 'Request sent a moment ago. You can send another in ' + s + ' seconds.'; },
    ref: 'Request number: ',
    copy: 'Copy link to this quote',
    copied: 'Link copied. Paste it in a message to show this quote to someone.',
    copyFail: 'Select and copy the link:',
    year: function (v) { return ' (' + v + ' in the first year)'; },
    compare: function (from, to, diff, gain) {
      return 'From ' + from + ' to ' + to + ': ' + (diff >= 0 ? '+' : '−') + money(Math.abs(diff)) + (gain ? '. Includes: ' + gain : '.');
    },
    leave: 'Leaving? Your choices are saved on this device. To keep the estimate, copy the link and send it to yourself.',
    leaveClose: 'Close',
    why: 'Why: you answered ',
    faqLink: 'Link to this answer',
    faqCopied: 'Link copied',
    search: 'Search the guides',
    none: 'No guide matches that word.',
    slot: function (v) { return ' · next slot: ' + v; },
    ics: 'Add to my calendar',
    icsTitle: 'Call with PRONEX (to be confirmed)'
  } : {
    tooFast: 'Foi muito rápido. Confirma o formulário e tenta outra vez.',
    wait: function (s) { return 'Pedido enviado há pouco. Podes enviar outro daqui a ' + s + ' segundos.'; },
    ref: 'Número do pedido: ',
    copy: 'Copiar link deste orçamento',
    copied: 'Link copiado. Cola-o numa mensagem para mostrar este orçamento a alguém.',
    copyFail: 'Seleciona e copia o link:',
    year: function (v) { return ' (' + v + ' no 1.º ano)'; },
    compare: function (from, to, diff, gain) {
      return 'De ' + from + ' para ' + to + ': ' + (diff >= 0 ? '+' : '−') + money(Math.abs(diff)) + (gain ? '. Inclui: ' + gain : '.');
    },
    leave: 'Vais sair? As tuas escolhas ficam guardadas neste aparelho. Para guardar a estimativa, copia o link e envia-o a ti próprio.',
    leaveClose: 'Fechar',
    why: 'Porquê: respondeste ',
    faqLink: 'Ligação direta para esta resposta',
    faqCopied: 'Link copiado',
    search: 'Pesquisar nos guias',
    none: 'Nenhum guia tem essa palavra.',
    slot: function (v) { return ' · próxima vaga: ' + v; },
    ics: 'Juntar ao meu calendário',
    icsTitle: 'Conversa com a PRONEX (por confirmar)'
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Armazenamento do navegador: pode estar bloqueado (modo privado), por isso nunca deixamos dar erro.
  // store(tipo, chave) lê; store(tipo, chave, valor) grava; valor null apaga.
  function store(kind, key, value) {
    try {
      var s = window[kind];
      if (value === undefined) return s.getItem(key);
      if (value === null) s.removeItem(key); else s.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }

  // Preço escrito como no resto do site: "450 €" em PT, "€450" em EN
  function money(n) {
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? ',' : '.');
    return EN ? '€' + s : s + ' €';
  }

  // Pequena mensagem de estado (lida pelos leitores de ecrã através de role="status")
  function statusEl(cls) {
    var p = document.createElement('p');
    p.className = cls;
    p.setAttribute('role', 'status');
    return p;
  }

  /* ---------- 2. Proteção dos formulários (pontos 2 e 3) ----------
     - Um robô preenche e envia em menos de 3 segundos; uma pessoa não.
     - Depois de um envio, esperamos 30 segundos antes de aceitar outro, para
       ninguém encher a caixa de correio com pedidos repetidos.
     - O campo-armadilha (_honey) já existia: se vier preenchido, é um robô.
     O ouvinte fica na fase de "captura" (o true no fim), por isso corre ANTES
     do envio feito pelo script.js e pode travá-lo. */
  var FORMS = '#quoteForm, #bookingForm';
  var LOADED = Date.now();

  function guardMsg(form, text) {
    var p = $('.form-guard', form);
    if (!p) {
      p = statusEl('form-guard');
      p.setAttribute('role', 'alert');
      var btn = $('[type="submit"]', form);
      (btn && btn.parentNode ? btn.parentNode : form).appendChild(p);
    }
    p.textContent = text;
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches || !form.matches(FORMS)) return;
    var stop = function (text) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (text) guardMsg(form, text);
    };
    var honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value) return stop('');                       // robô: paramos sem dizer nada
    if (Date.now() - LOADED < CONFIG.TEMPO_MINIMO * 1000) return stop(T.tooFast);
    var last = Number(store('localStorage', 'pronex-ultimo-envio')) || 0;
    var left = CONFIG.ESPERA_ENTRE_ENVIOS - Math.floor((Date.now() - last) / 1000);
    if (left > 0) return stop(T.wait(left));
    var old = $('.form-guard', form);
    if (old) old.textContent = '';
    // Só marcamos a hora quando o formulário está válido (ou seja, vai mesmo ser enviado)
    if (form.checkValidity()) {
      store('localStorage', 'pronex-ultimo-envio', String(Date.now()));
      setRef(form);
    }
  }, true);

  /* ---------- 3. Número do pedido (ponto 85) ----------
     PX-AAMMDD-XXXX: a data e 4 letras/números ao acaso. Vai no email (campo
     escondido "referencia") e aparece no ecrã de sucesso, para tu e o cliente
     falarem do mesmo pedido. */
  function newRef() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sem 0/O e 1/I, que se confundem
    var rnd = '';
    var bytes = new Uint8Array(4);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    for (var i = 0; i < 4; i++) rnd += abc[bytes[i] % abc.length];
    return 'PX-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rnd;
  }
  function setRef(form) {
    var input = $('[name="referencia"]', form);
    if (!input) return;
    input.value = newRef();
    // Mostra o número no ecrã de sucesso (o script.js mostra-o depois de o envio correr bem)
    var ok = $('#success, #bookingSuccess', form.parentNode) || $('#success') || $('#bookingSuccess');
    if (!ok) return;
    var p = $('.success-ref', ok);
    if (!p) {
      p = document.createElement('p');
      p.className = 'success-ref';
      var h = $('h2', ok);
      if (h) h.insertAdjacentElement('afterend', p); else ok.appendChild(p);
    }
    p.textContent = T.ref + input.value;
  }

  /* ---------- 4. Orçamento (pontos 77, 78, 79 e 96) ---------- */
  var quote = $('#quoteForm');
  var panel = $('#estimatePanel');
  if (quote && panel) {
    // 4a. Botão "Copiar link": guarda as escolhas no endereço. O script.js já lê
    //     estes parâmetros (tipo, setor, extra, plano, paginas) quando a página abre.
    var wrap = document.createElement('div');
    wrap.className = 'copy-link';
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-ghost btn-sm';
    copyBtn.textContent = T.copy;
    var copyOut = statusEl('copy-link-status');
    wrap.appendChild(copyBtn);
    wrap.appendChild(copyOut);
    var lines = $('#estLines', panel);
    (lines ? lines.parentNode : panel).insertBefore(wrap, lines ? lines.nextSibling : null);

    var quoteLink = function () {
      var p = [];
      var pick = function (sel) { return $(sel, quote); };
      var tipo = pick('input[name="tipo"]:checked');
      if (tipo && tipo.dataset.key) p.push('tipo=' + tipo.dataset.key);
      var setor = pick('#setor option:checked');
      if (setor && setor.dataset.key) p.push('setor=' + setor.dataset.key);
      var ex = $$('input[type="checkbox"][data-key]:checked', quote).map(function (c) { return c.dataset.key; });
      if (ex.length) p.push('extra=' + ex.join(','));
      var plano = pick('#manutencao option:checked');
      if (plano && plano.dataset.key) p.push('plano=' + plano.dataset.key);
      var pag = pick('input[name="paginas"]:checked');
      if (pag) p.push('paginas=' + encodeURIComponent(pag.value));
      return location.origin + location.pathname + (p.length ? '?' + p.join('&') : '');
    };
    copyBtn.addEventListener('click', function () {
      var url = quoteLink();
      count('orcamento-copiar-link');
      var done = function () { copyOut.textContent = T.copied; };
      var fail = function () {
        // Sem acesso à área de transferência: mostramos o link num campo já selecionado
        copyOut.textContent = T.copyFail + ' ';
        var input = document.createElement('input');
        input.className = 'copy-link-field';
        input.value = url;
        input.readOnly = true;
        input.setAttribute('aria-label', T.copyFail);
        copyOut.appendChild(input);
        input.select();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fail);
      else fail();
    });

    // 4b. Comparar formatos: ao trocar de formato, uma linha diz quanto muda o
    //     preço base e o que se ganha (o primeiro item da lista do novo formato).
    var cmp = statusEl('format-compare');
    var tipos = $$('input[name="tipo"]', quote);
    var group = tipos.length ? tipos[0].closest('fieldset, .options, .fstep') : null;
    if (group) group.appendChild(cmp);
    var prev = $('input[name="tipo"]:checked', quote);
    tipos.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        if (prev && prev !== r && prev.dataset.base && r.dataset.base) {
          var diff = Number(r.dataset.base) - Number(prev.dataset.base);
          var gain = '';
          if (diff > 0) {
            var li = $('.opt-box small', r.closest('label'));   // a descrição curta do formato
            gain = li ? li.textContent.replace(/\s+/g, ' ').trim() : '';
          }
          cmp.textContent = T.compare(prev.value, r.value, diff, gain);
        }
        prev = r;
      });
    });

    // 4c. Ao lado da mensalidade de manutenção, o total do primeiro ano. A mensalidade aparece na
    //     última linha do "recibo" (#estReceipt) ou, se não houver recibo, numa linha da conta (#estLines).
    var receipt = $('#estReceipt', panel);
    var addYear = function () {
      [receipt, lines].forEach(function (list) {
        if (!list) return;
        $$('li', list).forEach(function (li) {
          var b = $('b', li);
          var t = b ? b.textContent : '';
          var m = t.match(/([\d.,]+)\s*€\/mês/) || t.match(/€([\d.,]+)\/month/);
          var old = $('.year-total', li);
          var want = m ? T.year(money(Number(m[1].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')) * 12)) : '';
          if (old && old.textContent === want) return;          // já está certo: não mexe (evita ciclos)
          if (old) old.remove();
          if (!want) return;
          var sm = document.createElement('small');
          sm.className = 'year-total';
          sm.textContent = want;
          li.appendChild(sm);
        });
      });
    };
    if (window.MutationObserver) {
      [receipt, lines].forEach(function (list) {
        if (list) new MutationObserver(addYear).observe(list, { childList: true, subtree: true, characterData: true });
      });
    }
    addYear();

    // 4d. Aviso de saída (só em computador, uma vez por visita): quando o rato
    //     sai pelo topo da janela depois de a pessoa ter escolhido alguma coisa,
    //     aparece uma faixa calma (não é uma janela que bloqueia).
    var touched = false;
    quote.addEventListener('change', function () { touched = true; });
    document.addEventListener('mouseout', function (e) {
      if (e.relatedTarget || e.clientY > 0 || !touched) return;
      if (store('sessionStorage', 'pronex-aviso-saida')) return;
      if ($('#success') && !$('#success').hidden && $('#success').offsetParent) return;
      store('sessionStorage', 'pronex-aviso-saida', '1');
      var bar = document.createElement('div');
      bar.className = 'leave-note';
      bar.setAttribute('role', 'status');
      var txt = document.createElement('p');
      txt.textContent = T.leave;
      var b1 = document.createElement('button');
      b1.type = 'button';
      b1.className = 'btn btn-primary btn-sm';
      b1.textContent = T.copy;
      b1.addEventListener('click', function () { copyBtn.click(); bar.remove(); });
      var b2 = document.createElement('button');
      b2.type = 'button';
      b2.className = 'btn btn-ghost btn-sm';
      b2.textContent = T.leaveClose;
      b2.addEventListener('click', function () { bar.remove(); });
      bar.appendChild(txt);
      bar.appendChild(b1);
      bar.appendChild(b2);
      document.body.appendChild(bar);
    });
  }

  /* ---------- 5. Questionário "Não sei o que preciso" (pontos 80 e 81) ----------
     As respostas ficam guardadas durante a visita (sessionStorage): quem sai a
     meio e volta encontra o questionário como o deixou. Por baixo da sugestão
     aparece uma linha com as respostas que levaram a ela. */
  var finder = $('#finder');
  var result = $('#finderResult');
  if (finder && result) {
    var KEY = 'pronex-questionario';
    var NAMES = ['f_objetivo', 'f_marca', 'f_site', 'f_publico'];
    try {
      var saved = JSON.parse(store('sessionStorage', KEY) || '{}');
      NAMES.forEach(function (n) {
        if (!saved[n] || !/^[a-z0-9_-]+$/i.test(saved[n])) return;   // só valores simples entram no seletor
        var r = $('input[name="' + n + '"][value="' + saved[n] + '"]', finder);
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    } catch (e) { /* respostas guardadas estragadas: começa do zero */ }

    var answers = function () {
      return NAMES.map(function (n) { return $('input[name="' + n + '"]:checked', finder); }).filter(Boolean);
    };
    finder.addEventListener('change', function () {
      var data = {};
      answers().forEach(function (r) { data[r.name] = r.value; });
      store('sessionStorage', KEY, JSON.stringify(data));
    });

    var addWhy = function () {
      if ($('.finder-why', result) || !$('a.btn', result)) return;   // só quando já há sugestão
      var picked = answers().map(function (r) {
        var label = r.closest('label');
        return label ? '«' + label.textContent.replace(/\s+/g, ' ').trim() + '»' : '';
      }).filter(Boolean);
      if (!picked.length) return;
      var p = document.createElement('p');
      p.className = 'finder-why';
      p.textContent = T.why + picked.join(', ') + '.';
      var first = $('a.btn', result);
      first.parentNode.insertBefore(p, first);
    };
    if (window.MutationObserver) new MutationObserver(addWhy).observe(result, { childList: true, subtree: true });
    addWhy();
  }

  /* ---------- 6. Perguntas frequentes com ligação direta (ponto 89) ----------
     Cada pergunta tem um id (por exemplo #faq-o-site-fica-em-meu-nome). Quem
     abre esse endereço vê a pergunta já aberta, e cada resposta tem um botão
     que copia o link para mandar a um cliente. */
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!/^faq-[a-z0-9-]+$/.test(id)) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'center' }); }
  }
  $$('details[id^="faq-"]').forEach(function (d) {
    var body = d.lastElementChild;
    if (!body || body.tagName === 'SUMMARY' || $('.faq-link', d)) return;
    var a = document.createElement('a');
    a.className = 'faq-link';
    a.href = '#' + d.id;
    a.textContent = T.faqLink;
    a.addEventListener('click', function (e) {
      var url = location.origin + location.pathname + '#' + d.id;
      if (!navigator.clipboard) return;            // sem área de transferência: o link funciona como link normal
      e.preventDefault();
      history.replaceState(null, '', '#' + d.id);
      navigator.clipboard.writeText(url).then(function () {
        a.textContent = T.faqCopied;
        setTimeout(function () { a.textContent = T.faqLink; }, 2500);
      }, function () {});
    });
    body.parentNode.appendChild(a);
  });
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- 7. Portfólio: o filtro fica no endereço (ponto 90) ----------
     Ao escolher "Sites" ou "3D e jogos", o endereço passa a ter #filtro-web,
     e quem recebe esse link (ou volta atrás) vê o mesmo filtro. */
  var filters = $$('.filter[data-filter]');
  if (filters.length) {
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filter;
        var url = location.pathname + location.search + (f === 'todos' ? '' : '#filtro-' + f);
        try { history.replaceState(null, '', url); } catch (e) { /* sem histórico: ignora */ }
      });
    });
    var fm = location.hash.match(/^#filtro-([a-z0-9-]+)$/);
    if (fm) {
      var target = $('.filter[data-filter="' + fm[1] + '"]');
      if (target) target.click();
    }
  }

  /* ---------- 8. Guias: pesquisa por palavra (ponto 88) ----------
     Procura no título do cartão e no texto do guia, sem ligar a acentos
     ("orcamento" encontra "orçamento"). */
  var list = $('.guide-list');
  if (list) {
    var box = document.createElement('div');
    box.className = 'guide-search';
    var label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = 'pesquisa-guias';
    label.textContent = T.search;
    var input = document.createElement('input');
    input.type = 'search';
    input.id = 'pesquisa-guias';
    input.autocomplete = 'off';
    input.placeholder = T.search;
    var status = statusEl('muted');
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(status);
    list.parentNode.insertBefore(box, list);
    var plain = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    input.addEventListener('input', function () {
      var q = plain(input.value.trim());
      var shown = 0;
      $$('.guide-link', list).forEach(function (card) {
        var guide = document.getElementById((card.getAttribute('href') || '').slice(1));
        var text = plain(card.textContent + ' ' + (guide ? guide.textContent : ''));
        var hit = !q || text.indexOf(q) !== -1;
        card.hidden = !hit;
        if (hit) shown++;
      });
      status.textContent = shown ? '' : T.none;
    });
  }

  /* ---------- 9. Língua: lembrar a versão escolhida (ponto 87) ----------
     Quem carrega em EN fica com o inglês guardado. Da próxima vez que entrar
     pela página inicial portuguesa vindo de fora (Google, link partilhado),
     vai direto para a inicial em inglês. Quem escolher PT volta ao português. */
  $$('a.lang-switch').forEach(function (a) {
    a.addEventListener('click', function () { store('localStorage', 'pronex-lingua', EN ? 'pt' : 'en'); });
  });
  var fromOutside = !document.referrer || document.referrer.indexOf(location.origin) !== 0;
  var isPtHome = !EN && /\/(index\.html)?$/.test(location.pathname) && !/\/(pronex_|en\/)/.test(location.pathname);
  if (isPtHome && fromOutside && store('localStorage', 'pronex-lingua') === 'en') {
    location.replace(location.pathname.replace(/index\.html$/, '') + 'en/');
  }

  /* ---------- 10. Atalho T para o tema (ponto 97) ----------
     Carregar em T (fora de campos de texto) troca entre claro e escuro. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 't' && e.key !== 'T') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    var toggle = $('.theme-toggle');
    if (toggle) toggle.click();
  });

  /* ---------- 11. 404 em inglês (ponto 34) ----------
     O GitHub Pages mostra sempre a 404 portuguesa. Se o endereço que falhou
     começa por /en/, mostramos a versão inglesa. */
  if (!EN && document.querySelector('.hero--404') && /^\/en\//.test(location.pathname)) {
    location.replace('/en/404.html');
  }

  /* ---------- 12. Próxima vaga (ponto 93) ---------- */
  var vaga = CONFIG.PROXIMA_VAGA[EN ? 'en' : 'pt'];
  if (vaga) {
    $$('.status-pill').forEach(function (pill) {
      var s = document.createElement('span');
      s.className = 'status-next';
      s.textContent = T.slot(vaga);
      pill.appendChild(s);
    });
  }

  /* ---------- 13. Marcação: juntar ao calendário (ponto 86) ----------
     Depois de pedir uma conversa, aparece um botão que descarrega um ficheiro
     .ics com o dia e a hora pedidos (abre no Google Calendar, Outlook ou
     calendário do telemóvel). Fica marcado como "por confirmar". */
  var booking = $('#bookingForm');
  var bookingOk = $('#bookingSuccess');
  if (booking && bookingOk) {
    booking.addEventListener('submit', function () {
      var day = $('input[name="dia"]:checked', booking);
      var hour = $('input[name="hora"]:checked', booking);
      var dur = $('input[name="duracao"]:checked', booking);
      if (!day || !hour || !/^\d{4}-\d{2}-\d{2}$/.test(day.value) || !/^\d{1,2}:\d{2}$/.test(hour.value)) return;
      var mins = dur ? parseInt(dur.value, 10) || 30 : 30;
      var start = day.value.replace(/-/g, '') + 'T' + ('0' + hour.value).slice(-5).replace(':', '') + '00';
      var endDate = new Date(day.value + 'T' + ('0' + hour.value).slice(-5) + ':00');
      endDate.setMinutes(endDate.getMinutes() + mins);
      var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      var end = endDate.getFullYear() + p2(endDate.getMonth() + 1) + p2(endDate.getDate()) + 'T' + p2(endDate.getHours()) + p2(endDate.getMinutes()) + '00';
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PRONEX//Marcacao//PT',
        'BEGIN:VEVENT',
        'UID:' + Date.now() + '@pronexprotocol-ui.github.io',
        'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
        'DTSTART;TZID=Europe/Lisbon:' + start,
        'DTEND;TZID=Europe/Lisbon:' + end,
        'SUMMARY:' + T.icsTitle,
        'STATUS:TENTATIVE',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var a = $('.ics-link', bookingOk);
      if (!a) {
        a = document.createElement('a');
        a.className = 'btn btn-ghost ics-link';
        a.textContent = T.ics;
        a.download = 'conversa-pronex.ics';
        bookingOk.appendChild(a);
      }
      a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    });
  }

  /* ---------- 14. Contagem de cliques importantes (pontos 94 e 95) ----------
     Só conta se as estatísticas estiverem ligadas (GoatCounter, sem cookies).
     Enquanto não estiverem, não faz nada e não envia nada a ninguém.
     Elementos com data-conta="nome" são contados ao clicar. */
  function count(name) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: 'clique-' + name, title: name, event: true });
    }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-conta]');
    if (el) count(el.getAttribute('data-conta'));
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id) count('envio-' + e.target.id);
  });

  /* ---------- 15. Funcionar sem rede (ponto 100) ----------
     Regista o service worker do site (sw.js na raiz). Ele guarda as páginas e
     ficheiros já visitados, para o site abrir mesmo sem rede. As apps
     (pronex_study, pronex_link) têm os seus próprios service workers. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () { /* sem SW: o site funciona na mesma */ });
    });
  }

  /* ---------- 16. Estado do projeto (ponto 98) ----------
     Lê estado/projetos.json e mostra as fases do projeto com o número pedido.
     Tudo é criado com createElement/textContent: o que vem do ficheiro nunca é
     tratado como HTML. */
  var estadoForm = $('#estadoForm');
  var estadoOut = $('#estadoResultado');
  if (estadoForm && estadoOut) {
    var codeInput = $('#estadoCodigo', estadoForm);
    var showEstado = function (code) {
      estadoOut.textContent = '';
      if (!/^PX-\d{6}-[A-Z0-9]{4}$/.test(code)) return;
      fetch('/estado/projetos.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (all) {
          var p = all[code];
          if (!p || !Array.isArray(p.fases)) {
            estadoOut.textContent = 'Não encontrámos esse número. Confirma-o no email do pedido ou fala connosco pelo WhatsApp.';
            return;
          }
          var ol = document.createElement('ol');
          ol.className = 'estado-fases';
          p.fases.forEach(function (f) {
            var li = document.createElement('li');
            li.className = f.feita ? 'feita' : '';
            var b = document.createElement('b');
            b.textContent = String(f.nome || '');
            var d = document.createElement('span');
            d.textContent = (f.feita ? 'Feita · ' : 'Prevista · ') + String(f.data || '');
            li.appendChild(b);
            li.appendChild(d);
            ol.appendChild(li);
          });
          estadoOut.appendChild(ol);
          if (p.atualizado) {
            var u = document.createElement('p');
            u.className = 'muted';
            u.textContent = 'Atualizado em ' + String(p.atualizado) + '.';
            estadoOut.appendChild(u);
          }
        })
        .catch(function () { estadoOut.textContent = 'Não foi possível ler o estado agora. Tenta daqui a pouco.'; });
    };
    estadoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = codeInput.value.trim().toUpperCase();
      try { history.replaceState(null, '', '?c=' + encodeURIComponent(code)); } catch (err) { /* ignora */ }
      showEstado(code);
    });
    var given = new URLSearchParams(location.search).get('c');
    if (given) { codeInput.value = given.toUpperCase(); showEstado(codeInput.value); }
  }
})();
