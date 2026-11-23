/* ==========================================================================
   PRONEX — script.js
   JavaScript leve, sem bibliotecas. Tudo é "melhoria progressiva":
   sem JS o site continua legível, navegável e os formulários enviam na mesma.
   Serve as páginas em português e em inglês (/en/).

   00. Idioma e textos (PT / EN)
   01. Utilitários
   02. Cabeçalho, menu móvel, tema claro/escuro, pausa das animações, progresso, voltar ao topo
   03. Revelação ao fazer scroll
   04. Contadores animados
   05. Hero: spotlight, inclinação do terminal, scramble, código a escrever
   06. Brilho dos cartões
   07. Filtros do portfólio
   08. Envio para o FormSubmit (comum aos formulários)
   09. Formulário de orçamento multi-passo
   10. "Não sei o que preciso" (questionário)
   11. Agenda de conversas
   12. Telemóvel e extras: cartões que deslizam, barra que se esconde ao escrever, aviso de língua
   ========================================================================== */

// IIFE (função que se chama a si própria): todas as variáveis ficam fechadas aqui dentro,
// para não poluírem o espaço global nem chocarem com outros scripts da página.
(function () {
  // Modo estrito: o navegador assinala erros silenciosos (ex.: variáveis não declaradas).
  'use strict';

  /* ---------- 00. IDIOMA E TEXTOS ---------- */
  // LANG: língua da página, lida do atributo lang do <html> ("pt-PT" ou "en").
  // Qualquer valor que comece por "en" conta como inglês; tudo o resto fica português.
  const LANG = (document.documentElement.lang || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
  // TEXT: todos os textos que o JavaScript escreve na página, nas duas línguas.
  // Assim o mesmo script serve as páginas PT e EN sem repetir código.
  // Os valores que são funções recebem números ou nomes e devolvem a frase já montada.
  const TEXT = {
    // ----- Textos em português -----
    pt: {
      // Rótulos (aria-label) do botão do menu móvel: dizem o que o botão vai fazer
      menuOpen: 'Abrir menu', menuClose: 'Fechar menu',
      // Botão do tema: o texto indica o modo para onde se vai mudar
      toLight: 'Mudar para modo claro', toDark: 'Mudar para modo escuro',
      // Botão do rodapé que pausa/retoma as animações
      motionPause: 'Pausar animações', motionResume: 'Retomar animações',
      // Setas e rótulos dos cartões que deslizam no telemóvel; swipeCard(i, n) dá "Cartão 2 de 5"
      swipePrev: 'Anterior', swipeNext: 'Seguinte',
      swipeCard: (i, n) => 'Cartão ' + i + ' de ' + n,
      // filterCount(n, total): frase lida pelos leitores de ecrã depois de filtrar o portfólio
      filterCount: (n, total) => (n === total ? 'A mostrar todos os projetos (' + n + ').' : 'A mostrar ' + n + ' de ' + total + ' projetos.'),
      // Aviso para quem tem o navegador noutra língua (por isso está escrito em inglês)
      langNote: { text: 'Also available in English', close: 'Close', lang: 'en' },
      // Palavras para escrever prazos ("3 a 5 dias", "2 semanas"); to é o separador do intervalo
      day: 'dia', days: 'dias', week: 'semana', weeks: 'semanas', to: ' a ',
      // Linhas do orçamento: páginas extra e redação de textos, com singular/plural conforme n
      pagesMore: (n) => n + (n === 1 ? ' página a mais' : ' páginas a mais'),
      texts: (n) => 'Escrevemos os textos (' + n + (n === 1 ? ' página)' : ' páginas)'),
      // Mais linhas e rótulos do resumo do orçamento
      urgent: 'Entrega urgente (+20%)',
      maintenance: 'Manutenção',
      maxValue: 'No máximo, depois da conversa',
      upTo: 'até',
      estTime: 'Prazo estimado: ',
      // estBar(v): texto da barra fixa com a estimativa (no telemóvel); v é o valor já formatado
      estBar: (v) => 'Estimativa: ' + v + '. Ver detalhes',
      // estLive(v, t): anúncio para leitores de ecrã sempre que a estimativa muda (t = prazo, opcional)
      estLive: (v, t) => 'Estimativa atualizada: ' + v + (t ? ', prazo de ' + t : '') + '.',
      // pagesHint(tipo, inc, price): ajuda no passo das páginas (quantas o formato já inclui e o preço de cada extra)
      pagesHint: (tipo, inc, price) => 'O formato que escolheste (' + tipo + ') já inclui ' + inc + (inc === 1 ? ' página' : ' páginas') +
        '. Cada página a mais custa ' + price + '. Se não tens a certeza, escolhe a opção mais próxima.',
      // Mostrado quando não se escolheu nenhum extra
      none: 'Nenhum',
      // Nomes das respostas: resumo do último passo, email que recebemos e mensagens já escritas (WhatsApp/email)
      f: {
        tipo: 'Tipo de site', setor: 'Tipo de negócio', paginas: 'Páginas', extras: 'Extras', prazo: 'Prazo pedido',
        prazoEst: 'Prazo estimado', conteudos: 'Textos e fotos', manutencao: 'Manutenção', estimativa: 'Valor estimado',
        nome: 'Nome', email: 'Email', telefone: 'Telemóvel', contacto: 'Contacto preferido', mensagem: 'Mensagem',
        negocio: 'Nome do negócio', site: 'Site atual ou de referência', investir: 'Quanto pensa investir',
        origem: 'Como chegou até nós', link: 'Link de entrada', consent: 'Consentimento', assunto: 'Assunto', nota: 'Nota'
      },
      // step(i, n): indicador do passo atual do formulário multi-passo
      step: (i, n) => 'Passo ' + i + ' de ' + n,
      // Início da mensagem de agradecimento (o nome da pessoa é acrescentado a seguir)
      thanks: 'Obrigado, ',
      // Assunto do email de pedido de orçamento
      subject: 'Orçamento',
      // preset(what, setor): aviso quando o orçamento vem pré-preenchido (ex.: a partir de um link de um pacote)
      preset: (what, setor) => 'Preparámos o orçamento' + (setor ? ' para ' + setor : '') + (what ? ': ' + what : '') + '. Podes mudar tudo.',
      // resumeAt(i, n): aviso de que as respostas guardadas foram recuperadas
      resumeAt: (i, n) => 'Continuas onde ficaste (passo ' + i + ' de ' + n + '). ',
      // emailHint(mail): sugestão quando o email parece ter um erro de escrita (ex.: "gmial.com")
      emailHint: (mail) => 'Querias dizer ' + mail + '?',
      emailFix: 'Sim, corrigir',
      // Promessa de resposta, conforme o contacto preferido escolhido
      reply: {
        email: 'Respondemos por email em menos de 24h (dias úteis).',
        whatsapp: 'Respondemos por WhatsApp em menos de 24h (dias úteis).',
        phone: 'Ligamos-te para o teu número em menos de 24h (dias úteis), no horário de atendimento.'
      },
      // Erro de envio: as respostas não se perdem e oferecem-se alternativas (WhatsApp/email já escritos)
      sendError: 'Não foi possível enviar agora. As tuas respostas continuam aqui: tenta de novo daqui a pouco ou envia o pedido, já escrito, por WhatsApp ou por email.',
      // Botões alternativos; newTab avisa os leitores de ecrã que o link abre noutro separador
      sendWa: 'Enviar por WhatsApp', sendMail: 'Enviar por email', newTab: ' (abre num novo separador)',
      // Primeira linha das mensagens de WhatsApp já escritas (orçamento e marcação)
      waQuote: 'Olá! Queria um orçamento para um site.',
      waBooking: 'Olá! Queria marcar uma conversa com a PRONEX.',
      // Nota junto ao campo do telemóvel: muda conforme o contacto preferido
      phoneNeeded: '(obrigatório para WhatsApp ou chamada)',
      phoneOptional: '(opcional)',
      // Dias da semana (curtos e longos) e meses, pela ordem do objeto Date (domingo = 0, janeiro = 0)
      weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      weekdaysLong: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
      months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
      today: 'hoje', tomorrow: 'amanhã',
      // hour(h, m): hora à portuguesa, "9h" ou "14h30" (os minutos só aparecem se não forem zero)
      hour: (h, m) => h + 'h' + (m ? String(m).padStart(2, '0') : ''),
      // Estado do horário de atendimento, mostrado na agenda e no rodapé
      openNow: (end) => 'Aberto agora · até às ' + end,
      closedNow: (when, start) => 'Fechado agora · abre ' + when + ' às ' + start,
      // nextPeriod(open, when, start, end): frase extra com o horário atual ou o próximo
      nextPeriod: (open, when, start, end) => (open
        ? ' Estamos em horário de atendimento até às ' + end + '.'
        : ' O próximo horário de atendimento é ' + when + ', das ' + start + ' às ' + end + '.'),
      // Mensagens da agenda de conversas
      pickDayFirst: 'Escolhe primeiro um dia.',
      slotsChanged: 'Neste dia o horário é diferente. Escolhe a hora outra vez.',
      bookingEmpty: 'Escolhe o formato, o dia e a hora.',
      bookingPending: 'Por confirmar: respondemos em 24h (dias úteis).',
      bookingRecap: 'Pedido por confirmar',
      bookingSubject: 'Marcação',
      lisbonTime: 'hora de Portugal continental',
      // tzNote(zone, lis, local): aviso para quem está noutro fuso horário.
      // Se souber converter, mostra a hora local equivalente; senão, só avisa da diferença.
      tzNote: (zone, lis, local) => (local
        ? 'Atenção ao fuso horário: ' + lis + ' em Portugal continental são ' + local + ' no teu relógio (' + zone + ').'
        : 'Atenção ao fuso horário: as horas da agenda são as de Portugal continental e o teu relógio está noutro fuso (' + zone + ').'),
      // Acrescentos quando a conversão de fuso muda de dia
      nextDay: ' do dia seguinte', prevDay: ' do dia anterior',
      // Explicação de como decorre a conversa, conforme o formato escolhido
      bookingHow: {
        video: 'No dia, mandamos o link da videochamada por email.',
        phone: 'No dia, ligamos-te nós para o número que deixaste.',
        whatsapp: 'No dia, falamos pelo WhatsApp à hora marcada.',
        presencial: 'Na confirmação combinamos o local exato, na Lousã ou em Coimbra.'
      }
    },
    // ----- Textos em inglês (páginas em /en/) -----
    // Mesmas chaves e mesma ordem do bloco português, para ser fácil comparar e manter as duas línguas.
    en: {
      // Rótulos do botão do menu móvel
      menuOpen: 'Open menu', menuClose: 'Close menu',
      // Botões do tema e da pausa das animações
      toLight: 'Switch to light mode', toDark: 'Switch to dark mode',
      motionPause: 'Pause animations', motionResume: 'Resume animations',
      // Cartões que deslizam no telemóvel
      swipePrev: 'Previous', swipeNext: 'Next',
      swipeCard: (i, n) => 'Card ' + i + ' of ' + n,
      // Contagem anunciada depois de filtrar o portfólio
      filterCount: (n, total) => (n === total ? 'Showing all projects (' + n + ').' : 'Showing ' + n + ' of ' + total + ' projects.'),
      // Aviso para quem tem o navegador em português (por isso está escrito em português)
      langNote: { text: 'Também disponível em português', close: 'Fechar', lang: 'pt-PT' },
      // Prazos, linhas e rótulos do orçamento
      day: 'day', days: 'days', week: 'week', weeks: 'weeks', to: ' to ',
      pagesMore: (n) => n + (n === 1 ? ' extra page' : ' extra pages'),
      texts: (n) => 'We write the text (' + n + (n === 1 ? ' page)' : ' pages)'),
      urgent: 'Rush delivery (+20%)',
      maintenance: 'Care plan',
      maxValue: 'At most, after our chat',
      upTo: 'up to',
      estTime: 'Estimated time: ',
      estBar: (v) => 'Estimate: ' + v + '. See details',
      estLive: (v, t) => 'Estimate updated: ' + v + (t ? ', ready in ' + t : '') + '.',
      pagesHint: (tipo, inc, price) => 'The format you chose (' + tipo + ') already includes ' + inc + (inc === 1 ? ' page' : ' pages') +
        '. Each extra page costs ' + price + '. Not sure? Pick the closest option.',
      none: 'None',
      // Nomes das respostas (resumo, email recebido e mensagens já escritas)
      f: {
        tipo: 'Website type', setor: 'Business type', paginas: 'Pages', extras: 'Extras', prazo: 'Requested timing',
        prazoEst: 'Estimated time', conteudos: 'Text and photos', manutencao: 'Care plan', estimativa: 'Estimated price',
        nome: 'Name', email: 'Email', telefone: 'Phone', contacto: 'Preferred contact', mensagem: 'Message',
        negocio: 'Business name', site: 'Current or reference site', investir: 'Planned budget',
        origem: 'How they found us', link: 'Entry link', consent: 'Consent', assunto: 'About', nota: 'Note'
      },
      // Formulário multi-passo: passo atual, agradecimento, assunto, pré-preenchimento, retoma e email
      step: (i, n) => 'Step ' + i + ' of ' + n,
      thanks: 'Thank you, ',
      subject: 'Quote',
      preset: (what, setor) => 'We\'ve set up your quote' + (setor ? ' (' + setor + ')' : '') + (what ? ': ' + what : '') + '. You can change any of it.',
      resumeAt: (i, n) => 'You are back where you left off (step ' + i + ' of ' + n + '). ',
      emailHint: (mail) => 'Did you mean ' + mail + '?',
      emailFix: 'Yes, fix it',
      // Promessa de resposta, conforme o contacto preferido
      reply: {
        email: 'We reply by email within 24 hours (working days).',
        whatsapp: 'We reply on WhatsApp within 24 hours (working days).',
        phone: 'We\'ll call you within 24 hours (working days), during our opening hours.'
      },
      // Erro de envio e alternativas (WhatsApp, email), mensagens já escritas e nota do telemóvel
      sendError: 'We could not send it right now. Your answers are still here: try again in a moment, or send the request, already written, on WhatsApp or by email.',
      sendWa: 'Send via WhatsApp', sendMail: 'Send by email', newTab: ' (opens in a new tab)',
      waQuote: 'Hi! I would like a quote for a website.',
      waBooking: 'Hi! I would like to book a call with PRONEX.',
      phoneNeeded: '(required for WhatsApp or a call)',
      phoneOptional: '(optional)',
      // Dias e meses, pela ordem do objeto Date
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      today: 'today', tomorrow: 'tomorrow',
      // hour(h, m): formato de 24 horas com dois dígitos, "09:00" ou "14:30"
      hour: (h, m) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'),
      // Estado do horário: em inglês diz-se sempre "Lisbon time", porque quem lê pode estar noutro país
      openNow: (end) => 'Open now · until ' + end + ' (Lisbon time)',
      closedNow: (when, start) => 'Closed now · opens ' + when + ' at ' + start + ' (Lisbon time)',
      nextPeriod: (open, when, start, end) => (open
        ? ' We are open right now, until ' + end + ' (Lisbon time).'
        : ' Our next opening hours are ' + when + ', ' + start + ' to ' + end + ' (Lisbon time).'),
      // Mensagens da agenda de conversas
      pickDayFirst: 'Pick a day first.',
      slotsChanged: 'Times are different on this day. Please pick a time again.',
      bookingEmpty: 'Choose the format, day and time.',
      bookingPending: 'To be confirmed: we reply within 24h (working days).',
      bookingRecap: 'Request to be confirmed',
      bookingSubject: 'Booking',
      lisbonTime: 'Lisbon time',
      // Aviso de fuso horário (com ou sem a hora local convertida)
      tzNote: (zone, lis, local) => (local
        ? 'Mind the time zone: ' + lis + ' in Lisbon is ' + local + ' on your clock (' + zone + ').'
        : 'Mind the time zone: the times shown are Lisbon time and your clock is in another zone (' + zone + ').'),
      nextDay: ' the next day', prevDay: ' the day before',
      // Como decorre a conversa, conforme o formato
      bookingHow: {
        video: 'On the day, we email you the video call link.',
        phone: 'On the day, we call you on the number you gave us.',
        whatsapp: 'On the day, we talk on WhatsApp at the booked time.',
        presencial: 'When we confirm, we\'ll agree on the exact place, in Lousã or Coimbra.'
      }
    }
  };
  // T: atalho para os textos da língua atual (ex.: T.menuOpen)
  const T = TEXT[LANG];

  /* ---------- 01. UTILITÁRIOS ---------- */
  // $(sel, ctx): devolve o primeiro elemento que corresponde ao seletor CSS (ou null).
  // ctx é opcional e limita a procura a um elemento; por omissão procura na página toda.
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  // $$(sel, ctx): devolve TODOS os elementos encontrados, já como Array (para usar forEach, map, filter...)
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  // root: o elemento <html>, onde ficam os atributos globais (data-theme, data-motion) e variáveis CSS
  const root = document.documentElement;
  // Movimento: pára-se tudo se o sistema pedir menos movimento OU se a pessoa carregar em "Pausar animações"
  // (botão do rodapé; o <head> já pôs data-motion="off" no <html> se a escolha estava guardada).
  // sysReduce: consulta de media "prefers-reduced-motion" (a definição de acessibilidade do sistema
  // para quem fica enjoado ou distraído com movimento). Guarda-se o objeto para ouvir mudanças depois.
  const sysReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // motionOff: a escolha feita no botão do rodapé (lida do atributo que o <head> já aplicou)
  let motionOff = root.getAttribute('data-motion') === 'off';
  const noMotion = () => sysReduce.matches || motionOff;       // estado neste momento
  const reduceMotion = noMotion();                             // estado ao abrir a página
  const motionWatchers = [];                                   // funções a avisar quando o estado muda
  // finePointer: true se o aparelho tem um ponteiro preciso (rato ou trackpad).
  // Os efeitos que seguem o rato só se ligam nesse caso; em ecrãs táteis não serviriam de nada.
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  // onMedia(mq, fn): chama fn sempre que a consulta de media mq muda (ex.: o tema do sistema).
  // Ouvir uma mudança de ecrã/preferência (os navegadores antigos só têm addListener)
  const onMedia = (mq, fn) => { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); };
  // euro(n): formata um valor em euros, arredondado à unidade, e devolve o texto.
  // Preços: "1.104 €" em português, "€1,104" em inglês
  // A expressão regular \B(?=(\d{3})+(?!\d)) encontra as posições entre dígitos que têm
  // à direita um múltiplo de 3 dígitos até ao fim; aí insere-se o separador de milhares.
  const euro = (n) => {
    const v = Math.round(n);
    return LANG === 'en'
      ? '€' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  };
  // perMonth(n): preço mensal (manutenção), "25 €/mês" ou "€25/month"
  const perMonth = (n) => (LANG === 'en' ? '€' + n + '/month' : n + ' €/mês');
  // esc(t): escapa os caracteres especiais de HTML (& < > ") antes de pôr texto com innerHTML.
  // Impede que algo escrito pela pessoa seja interpretado como código (proteção contra XSS).
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // store: acesso seguro ao localStorage (memória do navegador neste dispositivo).
  // Cada operação vai dentro de try/catch porque o localStorage pode estar bloqueado
  // (navegação privada, cookies desligados); nesse caso o site funciona na mesma, só não se lembra.
  const store = {
    // get(k): devolve o valor guardado na chave k, ou null
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    // set(k, v): guarda v na chave k; del(k): apaga a chave
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* navegação privada */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } }
  };

  // Ano atual no rodapé
  // (todos os elementos com data-year recebem o ano, para o "©" nunca ficar desatualizado)
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- 02. CABEÇALHO E NAVEGAÇÃO ---------- */
  // Elementos usados nesta secção. Se algum não existir numa página, o código seguinte salta-o.
  const header = $('.site-header');     // cabeçalho fixo no topo
  const toTop = $('.to-top');           // botão "voltar ao topo"
  const progress = $('.read-progress'); // barra fina que mostra quanto da página já se leu

  // Ao descer a página: cabeçalho compacto, botão "voltar ao topo" e barra de progresso.
  // (Uma só atualização por imagem desenhada, por muitos eventos de scroll que cheguem.)
  // scrollRaf: pedido de desenho pendente (requestAnimationFrame); null quando não há nenhum
  let scrollRaf = null;
  // onScroll(): lê a posição vertical da página e atualiza cabeçalho, botão e barra de progresso
  function onScroll() {
    scrollRaf = null;
    const y = window.scrollY;
    // Mais de 20px abaixo do topo: o cabeçalho passa à versão compacta (classe tratada no CSS)
    if (header) header.classList.toggle('is-scrolled', y > 20);
    // O botão "voltar ao topo" só aparece depois de descer cerca de um ecrã (700px)
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    if (progress) {
      // max: quanto é possível descer no total (altura da página menos a altura da janela)
      const max = root.scrollHeight - window.innerHeight;
      // Variável CSS --p entre 0 e 1 (fração já lida); o CSS usa-a para a largura da barra.
      // Se a página não tem scroll (max = 0), fica 0 para evitar dividir por zero.
      progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }
  }
  // O evento scroll dispara muitas vezes por segundo; agrupa-se num só requestAnimationFrame.
  // passive: true diz ao navegador que não vamos travar o scroll, por isso ele não espera pelo JS (scroll mais fluido).
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); }, { passive: true });
  // Corre uma vez logo ao abrir (a página pode abrir a meio, ex.: ao recarregar ou com uma âncora #)
  onScroll();

  // Menu móvel (botão hambúrguer)
  const toggle = $('.nav-toggle'); // botão que abre/fecha o menu
  const menu = $('#menu');         // a lista de links (o botão aponta para ela com aria-controls)
  if (toggle && menu) {
    // setMenu(open): abre (true) ou fecha (false) o menu, mantendo a acessibilidade em dia
    const setMenu = (open) => {
      // aria-expanded diz aos leitores de ecrã se o menu está aberto
      toggle.setAttribute('aria-expanded', String(open));
      // O nome do botão passa a dizer a ação seguinte ("Fechar menu" quando está aberto)
      toggle.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
      menu.classList.toggle('is-open', open);
      // menu-open no <body>: o CSS usa-a para impedir o scroll da página por trás do menu
      document.body.classList.toggle('menu-open', open);
      // Com o menu aberto (ocupa o ecrã todo), o resto da página fica "inerte":
      // o Tab e os leitores de ecrã não passam para o que está tapado por trás.
      $$('.skip-link, main, .site-footer, .mbar, .to-top, .wa-float, .lang-note').forEach((el) => { el.inert = open; });
      // O foco passa para o primeiro link (pequena espera: o menu aparece com uma transição)
      // (volta-se a confirmar que o menu continua aberto, caso tenha sido fechado nesses 60 ms)
      if (open) setTimeout(() => { const first = $('a', menu); if (first && menu.classList.contains('is-open')) first.focus(); }, 60);
    };
    // isOpen(): devolve true se o menu está aberto neste momento
    const isOpen = () => menu.classList.contains('is-open');
    // Clique no botão: alterna entre aberto e fechado
    toggle.addEventListener('click', () => setMenu(!isOpen()));
    // Ao escolher um link do menu, este fecha-se (sobretudo para âncoras na mesma página)
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    // Tecla Escape fecha o menu e devolve o foco ao botão, para quem usa teclado não se perder
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
    });
    // Rodar o tablet ou alargar a janela com o menu aberto: fecha-o (em ecrãs largos o botão nem existe)
    onMedia(window.matchMedia('(min-width: 960px)'), (e) => { if (e.matches && isOpen()) setMenu(false); });
  }

  // Tema claro / escuro. A escolha fica guardada neste dispositivo; sem escolha, segue o tema do sistema.
  // (O tema é aplicado logo no <head>, para a página não "piscar"; aqui só acertamos o botão.)
  const themeBtn = $('.theme-toggle');               // botão sol/lua
  // <meta name="theme-color">: cor da barra do navegador no telemóvel; acompanha o tema
  const metaTheme = $('meta[name="theme-color"]');
  // Preferência de tema do sistema operativo (claro ou escuro)
  const sysLight = window.matchMedia('(prefers-color-scheme: light)');
  // wantedTheme(): devolve 'light' ou 'dark'.
  // Prioridade: 1) a escolha guardada em localStorage ('pronex-tema'); 2) o tema do sistema.
  // O site é escuro por omissão: só fica claro se isso foi pedido.
  const wantedTheme = () => {
    const saved = store.get('pronex-tema');
    return saved === 'light' || (!saved && sysLight.matches) ? 'light' : 'dark';
  };
  // applyTheme(theme): aplica 'light' ou 'dark' à página.
  // O modo claro é o atributo data-theme="light" no <html>; o escuro é a ausência dele (estilo base do CSS).
  function applyTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    // Cores iguais ao fundo de cada tema, para a barra do navegador combinar com a página
    if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#F4F6FC' : '#0A0F2B');
    if (themeBtn) {
      // o nome do botão diz o que ele faz a seguir (por isso não leva aria-pressed)
      themeBtn.setAttribute('aria-label', theme === 'light' ? T.toDark : T.toLight);
      themeBtn.setAttribute('title', theme === 'light' ? T.toDark : T.toLight);
    }
  }
  // Ao abrir: parte do tema que o <head> já aplicou e só acerta o botão e a meta theme-color
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (themeBtn) {
    // Clique no botão: troca para o tema oposto e guarda a escolha neste dispositivo
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      store.set('pronex-tema', next);
      // "Cortina": nos navegadores que o permitem, o tema novo abre-se a partir do botão.
      // O desenho da animação está no style.css (usa --vt-x e --vt-y); nos outros a troca é imediata.
      // Só se faz a animação se a View Transitions API existir e o movimento não estiver desligado.
      if (document.startViewTransition && !noMotion()) {
        // Centro do botão no ecrã: é daí que o círculo do novo tema cresce
        const r = themeBtn.getBoundingClientRect();
        root.style.setProperty('--vt-x', Math.round(r.left + r.width / 2) + 'px');
        root.style.setProperty('--vt-y', Math.round(r.top + r.height / 2) + 'px');
        // theme-vt liga as regras CSS da transição só durante a troca de tema
        root.classList.add('theme-vt');
        // end(): retira a classe no fim; corre tanto se a transição acabar bem como se falhar
        const end = () => root.classList.remove('theme-vt');
        // O navegador tira uma "fotografia" da página, aplica o tema novo e anima entre os dois estados
        document.startViewTransition(() => applyTheme(next)).finished.then(end, end);
      } else {
        applyTheme(next);
      }
    });
  }
  // Sem escolha guardada, a página acompanha o sistema se ele mudar (ex.: modo noturno automático)
  onMedia(sysLight, () => { if (!store.get('pronex-tema')) applyTheme(wantedTheme()); });

  // Botão "Pausar animações" (rodapé). A escolha fica guardada neste dispositivo.
  const motionBtn = $('.motion-toggle');
  // applyMotion(off): liga (false) ou desliga (true) as animações da página.
  // data-motion="off" no <html> faz o CSS parar as animações; os ciclos em JS são avisados via motionWatchers.
  function applyMotion(off) {
    const changed = off !== motionOff;   // só se avisa quem está à escuta se o estado mudou mesmo
    motionOff = off;
    if (off) root.setAttribute('data-motion', 'off'); else root.removeAttribute('data-motion');
    // O texto do botão passa a dizer a ação seguinte ("Retomar" quando está em pausa)
    if (motionBtn) motionBtn.textContent = off ? T.motionResume : T.motionPause;
    if (changed) motionWatchers.forEach((fn) => fn());
  }
  if (motionBtn) {
    motionBtn.removeAttribute('aria-pressed');       // o texto do botão já diz o que ele faz a seguir
    motionBtn.hidden = sysReduce.matches;            // se o sistema já pede menos movimento, não há nada para pausar
    // Clique: inverte o estado e guarda-o em localStorage ('pronex-movimento').
    // Para retomar apaga-se a chave em vez de guardar "on": sem chave é o comportamento normal.
    motionBtn.addEventListener('click', () => {
      const off = !motionOff;
      if (off) store.set('pronex-movimento', 'off'); else store.del('pronex-movimento');
      applyMotion(off);
    });
  }
  // Ao abrir: acerta o texto do botão com o estado inicial
  applyMotion(motionOff);
  // Se a definição do sistema mudar com a página aberta: mostra/esconde o botão e avisa as animações
  onMedia(sysReduce, () => {
    if (motionBtn) motionBtn.hidden = sysReduce.matches;
    motionWatchers.forEach((fn) => fn());
  });

  // As duas escolhas acompanham os outros separadores abertos e o botão "voltar atrás" do navegador
  // Evento storage: dispara quando OUTRO separador do mesmo site altera o localStorage.
  // e.key === null significa que o armazenamento foi todo limpo; nesse caso volta-se aos valores por omissão.
  window.addEventListener('storage', (e) => {
    if (e.key === 'pronex-tema' || e.key === null) applyTheme(wantedTheme());
    if (e.key === 'pronex-movimento' || e.key === null) applyMotion(store.get('pronex-movimento') === 'off');
  });
  // Evento pageshow com e.persisted: a página veio da cache "voltar/avançar" (bfcache) e o script não volta a correr.
  // Relê-se a escolha guardada, porque pode ter mudado noutra página entretanto.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    applyTheme(wantedTheme());
    applyMotion(store.get('pronex-movimento') === 'off');
  });

  /* ---------- 03. REVELAÇÃO AO FAZER SCROLL ---------- */
  // Os elementos com a classe .reveal aparecem (com uma transição do CSS) quando entram no ecrã.
  const reveals = $$('.reveal');
  // Só se anima se o navegador tiver IntersectionObserver e a pessoa não tiver pedido menos movimento
  if ('IntersectionObserver' in window && !reduceMotion) {
    // IntersectionObserver: o navegador avisa quando um elemento entra/sai do ecrã,
    // sem ser preciso calcular posições a cada scroll (muito mais leve).
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Cada elemento só se revela uma vez: deixa de ser vigiado
          io.unobserve(entry.target);
        }
      });
    // threshold 0.12: basta 12% do elemento estar visível.
    // rootMargin com -40px em baixo: só conta depois de subir 40px acima do fundo da janela (a animação vê-se melhor).
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    // Sem suporte ou com movimento reduzido: mostra tudo logo, para nada ficar escondido
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 04. CONTADORES ---------- */
  // O valor final já está escrito no HTML. Aqui só animamos de 0 até ele,
  // mantendo o que vem antes e depois do número (ex.: "−97%", "24h").
  // Elementos com data-count="N", onde N é o número final a mostrar
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion && counters.length) {
    // cio: observador que arranca a contagem de cada número quando este fica visível
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        cio.unobserve(el);                       // conta uma vez só
        const target = Number(el.dataset.count); // valor final, lido do atributo data-count
        const finalText = el.textContent;        // texto completo original, reposto no fim
        // at: posição do número dentro do texto, para separar o prefixo e o sufixo
        const at = finalText.indexOf(String(target));
        if (!target || at < 0) return;          // zero, valor em falta ou número que não está no texto: fica como está
        const prefix = finalText.slice(0, at);
        const suffix = finalText.slice(at + String(target).length);
        const start = performance.now(); // momento de início (em milissegundos, alta precisão)
        const dur = 1400;                // duração total da contagem: 1,4 segundos
        // tick(now): um passo da animação, chamado a cada imagem desenhada pelo navegador
        const tick = (now) => {
          // t: progresso de 0 a 1. Se as animações forem pausadas a meio, salta logo para o fim.
          const t = noMotion() ? 1 : Math.min((now - start) / dur, 1);
          // Easing "ease-out cubic": começa rápido e abranda a chegar ao valor final
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          // Continua enquanto não chegar ao fim; no fim repõe o texto exato do HTML
          if (t < 1) requestAnimationFrame(tick); else el.textContent = finalText;
        };
        requestAnimationFrame(tick);
      });
    // threshold 0.6: só começa quando 60% do número está visível, para a pessoa ver a contagem
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- 05. HERO ---------- */
  const hero = $('.hero');          // secção de abertura da página inicial
  const terminal = $('.terminal');  // janela de "terminal" com o código e a mini-maqueta do site
  // As animações contínuas do hero só correm quando ele está no ecrã, o separador está ativo
  // e as animações não estão em pausa. Um ciclo que fica à espera é retomado quando isso volta a ser verdade.
  let heroOnScreen = true;      // começa em true: o hero está no topo da página
  const heroWaiting = [];       // ciclos de animação parados à espera de poderem continuar
  // heroActive(): true se as animações do hero podem correr agora
  // (document.hidden é true quando o separador está escondido ou a janela minimizada)
  const heroActive = () => heroOnScreen && !document.hidden && !noMotion();
  // wakeHero(): se já se pode animar, esvazia a lista de espera e retoma cada ciclo.
  // splice(0) tira todos os elementos da lista de uma vez, para nenhum ser retomado duas vezes.
  const wakeHero = () => { if (heroActive()) heroWaiting.splice(0).forEach((fn) => fn()); };
  if (hero && 'IntersectionObserver' in window) {
    // Vigia se o hero está visível; quando volta ao ecrã, acorda os ciclos parados
    new IntersectionObserver((entries) => { heroOnScreen = entries[0].isIntersecting; wakeHero(); }).observe(hero);
  }
  // Ao voltar a este separador do navegador, as animações retomam
  document.addEventListener('visibilitychange', wakeHero);
  // No telemóvel o terminal fica parado (já completo): poupa bateria e processador
  // (960px é o mesmo ponto de quebra usado acima para fechar o menu móvel em ecrãs largos)
  const bigScreen = window.matchMedia('(min-width: 960px)').matches;

  // Spotlight que segue o rato + ligeira inclinação 3D do terminal
  // Só com rato/trackpad: num ecrã tátil não há ponteiro a "pairar" sobre a página.
  if (hero && finePointer) {
    let raf = null;   // pedido de desenho pendente (limita a uma atualização por imagem)
    // level(): endireita o terminal (inclinação zero) quando o rato sai ou as animações param
    const level = () => {
      if (terminal) { terminal.style.setProperty('--ry', '0deg'); terminal.style.setProperty('--rx', '0deg'); }
    };
    // pointermove: o ponteiro mexeu-se dentro do hero
    hero.addEventListener('pointermove', (e) => {
      // Já há uma atualização marcada, ou as animações estão desligadas: não faz nada
      if (raf || noMotion()) return;
      raf = requestAnimationFrame(() => {
        // Posição do rato relativa ao canto superior esquerdo do hero
        const r = hero.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        // Variáveis CSS --mx e --my: o CSS usa-as para centrar o brilho (spotlight) no rato
        hero.style.setProperty('--mx', x + 'px');
        hero.style.setProperty('--my', y + 'px');
        if (terminal) {
          // nx e ny vão de -0.5 a 0.5 (o centro do hero é 0)
          const nx = x / r.width - 0.5;
          const ny = y / r.height - 0.5;
          // Inclinação máxima de 4 graus na horizontal (--ry) e 3 graus na vertical (--rx).
          // ny leva sinal negativo para o terminal "olhar" para o rato e não para o lado contrário.
          terminal.style.setProperty('--ry', (nx * 8).toFixed(2) + 'deg');
          terminal.style.setProperty('--rx', (-ny * 6).toFixed(2) + 'deg');
        }
        raf = null;
      });
    });
    // O rato saiu do hero: o terminal volta a ficar direito
    hero.addEventListener('pointerleave', level);
    // Se alguém pausar as animações, o terminal também se endireita
    motionWatchers.push(() => { if (noMotion()) level(); });
  }

  // Scramble: as letras baralham-se até formar a frase seguinte.
  // Dá 2 voltas às frases e fica parado na primeira (ninguém precisa de um título sempre a mexer).
  // scr: o <span> do título com data-scramble (lista de frases separadas por "|")
  const scr = $('[data-scramble]');
  if (scr) {
    // phrases: as frases possíveis; a primeira é a que já está escrita no HTML
    const phrases = scr.dataset.scramble.split('|');
    const chars = 'abcdefghijlnoprstuvxz';        // sem letras largas (m, w): cada letra baralhada cabe no mesmo espaço
    const title = scr.closest('h1');   // o título inteiro (recebe o aria-label com a frase fixa)
    const ROUNDS = 2;                  // número de voltas completas às frases antes de parar
    let index = 0;                     // frase mostrada neste momento
    let run = 0;              // muda sempre que o ciclo arranca ou pára: um ciclo antigo percebe que já não é o dele
    let running = false;      // true enquanto o ciclo de frases está a decorrer

    // scrambleTo(next, mine): transforma o texto atual na frase next, letra a letra.
    // mine é o número do ciclo que pediu a animação. Devolve uma Promise que se resolve
    // quando a frase nova está completa (ou quando o ciclo foi cancelado).
    const scrambleTo = (next, mine) => new Promise((resolve) => {
      const from = scr.textContent;
      // Percorre até ao comprimento da frase mais longa (a nova pode ser maior ou menor)
      const len = Math.max(from.length, next.length);
      // queue: para cada posição, a letra de partida, a de chegada e as imagens (frames)
      // em que começa e acaba de baralhar
      const queue = [];
      for (let i = 0; i < len; i++) {
        const same = from[i] === next[i];                 // letras iguais não baralham
        // Início aleatório entre 0 e 13 frames: as letras não mudam todas ao mesmo tempo
        const start = same ? 0 : Math.floor(Math.random() * 14);
        // Cada letra baralha entre 8 e 21 frames; || '' cobre as posições que só existem numa das frases
        queue.push({ from: from[i] || '', to: next[i] || '', start, end: same ? 0 : start + 8 + Math.floor(Math.random() * 14) });
      }
      let frame = 0;   // contador de imagens desenhadas desde o início desta troca
      // update(): desenha um frame; repete-se com requestAnimationFrame até todas as letras chegarem
      const update = () => {
        if (mine !== run) { resolve(); return; }          // entretanto as animações foram paradas
        let out = '';    // HTML do frame atual
        let done = 0;    // quantas letras já chegaram ao destino
        queue.forEach((q) => {
          // Já acabou de baralhar: mostra a letra final (escapada, porque vai para innerHTML)
          if (frame >= q.end) { done++; out += esc(q.to); }
          else if (frame >= q.start) {
            // A baralhar: letra aleatória dentro de um <span class="scr"> (o CSS dá-lhe outra cor)
            const c = chars[Math.floor(Math.random() * chars.length)];
            out += '<span class="scr">' + c + '</span>';
          // Ainda não começou: mantém a letra antiga
          } else { out += esc(q.from); }
        });
        scr.innerHTML = out;
        // Todas no sítio: põe o texto limpo (sem os <span>) e termina a Promise
        if (done === queue.length) { scr.textContent = next; resolve(); }
        else { frame++; requestAnimationFrame(update); }
      };
      update();
    });

    // stop(): pára o ciclo (o run++ invalida o ciclo em curso) e repõe a primeira frase
    const stop = () => { run++; running = false; index = 0; scr.textContent = phrases[0]; };
    // start(): arranca o ciclo de frases, se ainda não estiver a correr, se houver movimento
    // e se existirem pelo menos duas frases para alternar
    const start = () => {
      if (running || noMotion() || phrases.length < 2) return;
      running = true;
      const mine = ++run;   // número deste ciclo; se run mudar, este ciclo sabe que deve parar
      let rounds = 0;       // voltas completas já dadas
      // Quem usa leitor de ecrã ouve sempre a frase fixa, não as letras a baralhar
      // (a expressão regular \s+ junta espaços e quebras de linha seguidos num só espaço)
      if (title && !title.hasAttribute('aria-label')) title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
      // loop(): passa à frase seguinte e, no fim da animação, marca a próxima troca
      const loop = () => {
        if (mine !== run) return;                                     // ciclo cancelado entretanto
        if (!heroActive()) { heroWaiting.push(loop); return; }       // fora do ecrã: espera sem gastar nada
        // Avança uma frase; o resto da divisão (%) faz voltar à primeira depois da última
        index = (index + 1) % phrases.length;
        scrambleTo(phrases[index], mine).then(() => {
          if (mine !== run) return;
          // Voltou à primeira frase: conta uma volta; ao fim de ROUNDS voltas pára de vez
          if (index === 0 && ++rounds >= ROUNDS) { running = false; return; }
          // Cada frase fica 2,8 segundos à vista antes da troca seguinte
          setTimeout(loop, 2800);
        });
      };
      // Primeira troca 2,6 segundos depois de abrir, para dar tempo de ler o título
      setTimeout(loop, 2600);
    };
    // Pausar animações pára o efeito; retomá-las arranca-o de novo
    motionWatchers.push(() => { if (noMotion()) stop(); else start(); });
    start();
  }

  // Terminal: apaga o código estático e escreve-o caráter a caráter,
  // acendendo os blocos do mini-site à medida que o HTML correspondente aparece.
  // Escreve 2 vezes e pára; no fim, a mini-maqueta dá lugar a um site real do portfólio.
  const codeEl = $('.term-code code');   // o código (com realce de sintaxe) dentro do terminal
  const mini = $('.mini');               // a mini-maqueta de site que se vai "construindo"
  // Só em ecrãs largos (bigScreen); no telemóvel trata-se no else if mais abaixo
  if (codeEl && mini && bigScreen) {
    // Guarda o código completo original, para o repor no fim
    const fullCode = codeEl.innerHTML;
    // Converte o HTML com realce em segmentos {classe, texto}
    // nodeType 3 é um nó de texto simples (sem cor); os outros são <span> com classe de realce.
    const segments = [];
    codeEl.childNodes.forEach((node) => {
      if (node.nodeType === 3) segments.push({ cls: '', text: node.textContent });
      else segments.push({ cls: node.className, text: node.textContent });
    });
    // blocks: os filhos diretos da mini-maqueta (:scope > * significa "só o primeiro nível")
    const blocks = $$(':scope > *', mini);
    // Em que caráter acende cada bloco (nav, hero, cartões, "publicado")
    // total: número de caracteres de todo o código
    const total = segments.reduce((n, s) => n + s.text.length, 0);
    // Cada bloco acende a 22%, 62%, 95% e 100% do código escrito
    const triggers = [0.22, 0.62, 0.95, 1].map((f) => Math.floor(total * f));
    const ROUNDS = 2;          // quantas vezes o código é escrito antes de parar
    let run = 0;               // número do ciclo atual (o mesmo truque do scramble para cancelar ciclos antigos)
    let running = false;

    // render(count): mostra só os primeiros count caracteres do código, mantendo as cores,
    // acrescenta o cursor a piscar e acende os blocos da maqueta que já foram "escritos"
    const render = (count) => {
      let html = '';
      let left = count;          // caracteres que ainda faltam mostrar
      for (const s of segments) {
        if (left <= 0) break;
        // Corta o segmento se só couber uma parte dele
        const part = s.text.slice(0, left);
        left -= part.length;
        // Texto escapado com esc() porque vai para innerHTML
        html += s.cls ? '<span class="' + s.cls + '">' + esc(part) + '</span>' : esc(part);
      }
      // Cursor de texto no fim do que já foi escrito
      codeEl.innerHTML = html + '<span class="caret"></span>';
      // A classe on acende o bloco i quando a contagem passa o respetivo ponto de disparo
      blocks.forEach((b, i) => b.classList.toggle('on', count >= triggers[i]));
    };

    // Estado final: código completo (sem cursor a piscar) e, em vez da mini-maqueta, um site real
    // real: link com a imagem de um projeto real do portfólio (começa com hidden no HTML)
    const real = $('.term-real');
    // finish(): pára a escrita (run++ cancela o ciclo), repõe o código completo,
    // acende todos os blocos e troca a maqueta pelo site real
    const finish = () => {
      run++; running = false;
      codeEl.innerHTML = fullCode;
      blocks.forEach((b) => b.classList.add('on'));
      const img = real && $('img', real);
      // Sem imagem, sem terminal ou já trocado antes: não há mais nada a fazer
      if (!img || !terminal || terminal.classList.contains('is-done')) return;
      // show(): mostra o site real; is-done no terminal faz o CSS esconder a mini-maqueta
      const show = () => {
        real.hidden = false;
        terminal.classList.add('is-done');
        // Aparece com um fade de meio segundo (Web Animations API), exceto com movimento desligado
        if (!noMotion() && real.animate) real.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
      };
      img.loading = 'eager';                                   // só agora se descarrega a imagem
      // decode() espera que a imagem esteja descarregada e pronta a desenhar: evita mostrar um retângulo vazio
      if (img.decode) img.decode().then(show, () => {});       // se a imagem falhar, fica a mini-maqueta
      else show();
    };

    // start(): começa a escrever o código (se ainda não estiver a correr e houver movimento)
    const start = () => {
      if (running || noMotion()) return;
      running = true;
      const mine = ++run;
      let rounds = 0;
      // write(): uma escrita completa do código, desde o terminal vazio
      const write = () => {
        if (mine !== run) return;
        let count = 0;
        render(0);
        // step(): escreve mais 2 caracteres e marca o passo seguinte
        const step = () => {
          if (mine !== run) return;
          if (!heroActive()) { heroWaiting.push(step); return; }     // fora do ecrã: espera sem gastar nada
          count += 2;
          render(count);
          // Intervalo aleatório entre 22 e 52 ms: o ritmo irregular parece alguém a escrever
          if (count < total) setTimeout(step, 22 + Math.random() * 30);
          else if (++rounds < ROUNDS) setTimeout(write, 5200);        // recomeça depois de uma pausa
          // Última volta: deixa o código à vista 2,4 s e depois passa ao estado final
          else setTimeout(() => { if (mine === run) finish(); }, 2400);
        };
        // Meio segundo de terminal vazio antes de começar a escrever
        setTimeout(step, 500);
      };
      write();
    };
    // Pausar as animações (ou o sistema pedir menos movimento) leva logo ao estado final
    motionWatchers.push(() => { if (noMotion() && running) finish(); });
    // Ao abrir: com movimento desligado vai direto ao fim; senão começa a escrever
    if (noMotion()) finish(); else start();
  } else if (terminal && !bigScreen) {
    // Telemóvel e tablet: não há animação do código, por isso mostramos logo o site real
    // do portfólio (LifeCatch) em vez da mini-maqueta genérica. Se a imagem falhar, fica a maqueta.
    const realMobile = $('.term-real');
    const imgMobile = realMobile && $('img', realMobile);
    if (imgMobile) {
      // showReal(): mostra o site real e marca o terminal como concluído (o CSS esconde a maqueta)
      const showReal = () => { realMobile.hidden = false; terminal.classList.add('is-done'); };
      // A imagem já está carregada e tem tamanho real (naturalWidth > 0 quer dizer que não falhou)?
      if (imgMobile.complete && imgMobile.naturalWidth) showReal();
      // Senão, espera pelo evento load (uma só vez) e pede o download já, em vez de esperar pelo lazy loading
      else { imgMobile.addEventListener('load', showReal, { once: true }); imgMobile.loading = 'eager'; }
    }
  }

  // (A faixa de serviços deixou de se mexer no polimento de novembro de 2026: já não precisa de código para a parar.)

  /* ---------- 06. BRILHO DOS CARTÕES ---------- */
  // Um brilho suave segue o rato por cima de cada cartão (.card).
  // Só com rato/trackpad e sem pedido de menos movimento.
  if (finePointer && !reduceMotion) {
    $$('.card').forEach((card) => {
      let raf = null;   // um cálculo por imagem desenhada, no máximo, por cartão
      card.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          // Variáveis CSS --x e --y: posição do rato dentro do cartão; o CSS centra o brilho nesse ponto
          const r = card.getBoundingClientRect();
          card.style.setProperty('--x', (e.clientX - r.left) + 'px');
          card.style.setProperty('--y', (e.clientY - r.top) + 'px');
        });
      });
    });
  }

  /* ---------- 07. FILTROS DO PORTFÓLIO ---------- */
  // Botões .filter com data-filter (categoria) mostram só os projetos .case com o mesmo data-cat.
  // Sem JavaScript, todos os projetos ficam à vista.
  const filters = $$('.filter');
  if (filters.length) {
    const cases = $$('.case');   // os cartões de projeto do portfólio
    // Frase para leitores de ecrã: diz quantos projetos ficaram à vista depois de filtrar
    // role="status" torna o parágrafo uma "região viva": o leitor de ecrã lê as mudanças sem mover o foco.
    // sr-only esconde-o visualmente, mas continua acessível aos leitores de ecrã.
    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    // Fica logo a seguir ao grupo de botões de filtro
    filters[0].parentNode.after(live);
    filters.forEach((btn) => {
      // Clique num filtro: aplica-o a todos os projetos
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;   // categoria escolhida ('todos' mostra tudo)
        let shown = 0;                  // quantos projetos ficam visíveis
        // aria-pressed: só o botão clicado fica "premido" (botões de alternância acessíveis)
        filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        cases.forEach((c) => {
          const show = f === 'todos' || c.dataset.cat === f;
          // is-hidden esconde o projeto (no CSS); toggle com segundo argumento força o estado
          c.classList.toggle('is-hidden', !show);
          // is-visible garante que um projeto ainda não revelado ao scroll aparece logo
          if (show) { c.classList.add('is-visible'); shown++; }
        });
        // Atualiza a frase da região viva, que o leitor de ecrã anuncia
        live.textContent = T.filterCount(shown, cases.length);
      });
    });
  }

  /* ---------- 08. ENVIO PARA O FORMSUBMIT (comum aos formulários) ---------- */
  // Com JavaScript o envio é feito por fetch e mostramos a confirmação na página.
  // Sem JavaScript, o <form> é enviado da forma tradicional.
  // Ligação base do WhatsApp (wa.me + número com indicativo 351); o texto do pedido é acrescentado no fim, já codificado.
  const WA_URL = 'https://wa.me/351912507674?text=';
  // Endereço usado no link mailto: do plano B (quando o envio automático falha)
  const MAIL = 'pronex.protocol@gmail.com';
  const SEND_TIMEOUT = 20000;     // ms à espera do FormSubmit antes de mostrar o plano B
  // pad(n): acrescenta um zero à esquerda até ter 2 algarismos (7 → "07"), útil para horas e datas
  const pad = (n) => String(n).padStart(2, '0');

  /**
   * sendForm(form, data): envia os dados para o FormSubmit em segundo plano (fetch), sem sair da página.
   * - form: o <form>, de onde se tira o endereço (atributo action).
   * - data: objeto com os campos já prontos, enviado como JSON.
   * Não devolve nada: se correr bem, a promessa resolve; se falhar (rede, erro do servidor, tempo esgotado),
   * lança um erro, que quem chama apanha com try/catch para mostrar o plano B.
   */
  async function sendForm(form, data) {
    // AbortController permite cancelar o pedido; navegadores muito antigos não o têm, e aí simplesmente não há corte
    const ctrl = window.AbortController ? new AbortController() : null;
    // Ao fim de SEND_TIMEOUT ms sem resposta, o pedido é cancelado e o fetch dá erro (assim a pessoa não fica à espera para sempre)
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, SEND_TIMEOUT);
    try {
      // O endereço "formsubmit.co/..." do HTML passa a "formsubmit.co/ajax/...": é a versão que responde em JSON
      // em vez de redirecionar para outra página
      const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      });
      // Uma resposta que não seja JSON (uma página de erro, por exemplo) conta como falha
      const json = await res.json().catch(() => null);
      // Falha se: o código HTTP não for 2xx, não houver JSON, ou o FormSubmit disser success: false
      // (vem às vezes como texto "false", daí o String()). A mensagem do servidor é usada se existir.
      if (!res.ok || !json || String(json.success) === 'false') throw new Error((json && json.message) || 'Erro no envio');
    } finally {
      // Corra bem ou mal, o temporizador é desligado para não cancelar nada mais tarde
      clearTimeout(timer);
    }
  }

  // Plano B: se o envio falhar, o pedido segue já escrito por WhatsApp ou por email
  // showPlanB(status, text, subject): escreve na caixa de estado (status) a mensagem de erro e dois botões:
  // - WhatsApp com o texto do pedido (text) já preenchido; abre noutro separador (rel="noopener noreferrer" por segurança)
  //   e tem um texto escondido "abre num novo separador" para leitores de ecrã;
  // - email (mailto:) com o assunto (subject) e o corpo preenchidos.
  // encodeURIComponent protege acentos, espaços e quebras de linha dentro do link; esc() evita que o texto
  // de erro seja interpretado como HTML. Não devolve nada.
  function showPlanB(status, text, subject) {
    status.innerHTML = esc(T.sendError) + ' <span class="status-actions">' +
      '<a class="btn btn-ghost btn-sm" href="' + WA_URL + encodeURIComponent(text) + '" target="_blank" rel="noopener noreferrer">' + T.sendWa +
      '<span class="sr-only">' + T.newTab + '</span></a>' +
      '<a class="btn btn-ghost btn-sm" href="mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&amp;body=' + encodeURIComponent(text) + '">' + T.sendMail + '</a></span>';
    // a mensagem pode nascer fora do ecrã (por baixo do botão): vem para a vista
    // 'nearest' só desloca o mínimo necessário; sem animação se a pessoa pediu menos movimento
    status.scrollIntoView({ block: 'nearest', behavior: noMotion() ? 'auto' : 'smooth' });
  }

  // Leva o que falta responder para a vista: ao centro do ecrã ou, se for mais alto do que o espaço livre, pelo topo
  // bringIntoView(el): el é o bloco a mostrar. Os 220 px descontam o cabeçalho fixo e a barra de botões
  // do telemóvel, que tapam parte do ecrã. Não devolve nada.
  function bringIntoView(el) {
    const tall = el.getBoundingClientRect().height > window.innerHeight - 220;
    el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: noMotion() ? 'auto' : 'smooth' });
  }

  // Confirma um campo sem mexer no aspeto dele: devolve true se estiver bem preenchido
  // checkField(input): input é um <input>, <textarea> ou <select>. Usa setCustomValidity() para marcar
  // o problema ("curto", "email", "telefone") na validação nativa do navegador, sem mexer nas classes.
  function checkField(input) {
    // Caixas, botões de opção e listas: chegam as regras do HTML (required)
    if (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') return input.checkValidity();
    const v = input.value.trim();
    if (v === '' && input.value !== '') input.value = '';          // só espaços não conta como resposta
    // Texto vazio = sem problema personalizado (o required do HTML trata do campo em falta)
    let problem = '';
    if (v) {
      // minlength do HTML: o navegador só o verifica depois de a pessoa escrever, por isso confirmamos aqui
      const min = Number(input.getAttribute('minlength')) || 0;
      if (min && v.length < min) problem = 'curto';
      // Email: "algo@algo.xx" sem espaços, com pelo menos 2 letras depois do último ponto
      // (mais exigente do que o type="email" do navegador, que aceita "ana@empresa")
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) problem = 'email';
      else if (input.type === 'tel') {
        // aceita espaços, hífenes, pontos, parênteses e indicativo (+44…); conta só os algarismos
        const digits = v.replace(/\D/g, '').length;
        // Entre 9 (número português) e 15 algarismos (máximo internacional), e só caracteres permitidos
        if (digits < 9 || digits > 15 || !/^[0-9+ ()./-]+$/.test(v)) problem = 'telefone';
      }
    }
    // Texto vazio limpa o erro anterior; qualquer outro texto torna o campo inválido
    input.setCustomValidity(problem);
    // checkValidity() junta as regras do HTML (required, type...) com o erro personalizado
    return input.checkValidity();
  }

  // Valida um campo e mostra a mensagem de erro que está por baixo dele
  // validateField(input): igual a checkField, mas também mostra o resultado. Devolve true se estiver bem.
  function validateField(input) {
    const ok = checkField(input);
    // .field é o bloco que envolve rótulo, campo e mensagem de erro
    const field = input.closest('.field');
    if (!field) return ok;
    // has-error mostra a mensagem a vermelho; is-valid dá o sinal de certo (só se houver texto)
    field.classList.toggle('has-error', !ok);
    field.classList.toggle('is-valid', ok && input.value !== '');
    // aria-invalid avisa os leitores de ecrã de que o campo tem um erro
    input.setAttribute('aria-invalid', String(!ok));
    // A mensagem só fica ligada ao campo enquanto há erro (assim o leitor de ecrã lê-a na altura certa)
    const err = $('.error', field);
    if (err) {
      // a mensagem precisa de um id para o aria-describedby; cria-se um a partir do id ou nome do campo
      if (!err.id) err.id = (input.id || input.name) + '-erro';
      if (ok) input.removeAttribute('aria-describedby');
      else input.setAttribute('aria-describedby', err.id);
    }
    return ok;
  }

  // liveValidation(form): validação "ao vivo" dos campos de texto do formulário.
  // Não incomoda enquanto a pessoa escreve pela primeira vez: só valida ao sair do campo (blur);
  // depois de haver um erro, volta a validar a cada letra (input), para o erro desaparecer logo que fica certo.
  function liveValidation(form) {
    $$('.field input, .field textarea', form).forEach((inp) => {
      // ao sair de um campo vazio não se mostra erro (a pessoa pode só estar a passar com o Tab)
      inp.addEventListener('blur', () => { if (inp.value) validateField(inp); });
      inp.addEventListener('input', () => { if (inp.closest('.field').classList.contains('has-error')) validateField(inp); });
    });
  }

  // O telefone passa a obrigatório quando a pessoa prefere WhatsApp ou chamada.
  // No orçamento, nesse caso o email deixa de ser obrigatório (marcas [data-email-req] e [data-email-note] no HTML).
  // phoneRule(form, radioName, needsPhone):
  // - form: o formulário; radioName: nome dos botões "como prefere ser contactado";
  // - needsPhone: lista de canais (data-channel) que exigem telefone, ex.: ['whatsapp', 'phone'].
  // [data-phone-note] é a nota junto ao telefone ("obrigatório"/"opcional").
  function phoneRule(form, radioName, needsPhone) {
    const phone = $('input[type="tel"]', form);
    const note = $('[data-phone-note]', form);
    const email = $('input[type="email"]', form);
    const emailReq = $('[data-email-req]', form);
    const emailNote = $('[data-email-note]', form);
    if (!phone) return;
    // um erro antigo não fica preso quando o campo deixa de ser obrigatório
    const refresh = (inp) => { if (inp.closest('.field') && inp.closest('.field').classList.contains('has-error')) validateField(inp); };
    // update(): lê o canal escolhido e acerta o que é obrigatório
    const update = () => {
      const r = $('input[name="' + radioName + '"]:checked', form);
      const need = !!r && needsPhone.includes(r.dataset.channel);
      phone.required = need;
      if (note) note.textContent = need ? T.phoneNeeded : T.phoneOptional;
      refresh(phone);
      // Só no orçamento (onde existem as marcas): o email fica obrigatório apenas se o telefone não for
      // e troca-se o asterisco ([data-email-req]) pela nota explicativa ([data-email-note])
      if (email && emailReq && emailNote) {
        email.required = !need;
        emailReq.hidden = need;
        emailNote.hidden = !need;
        refresh(email);
      }
    };
    // Um único ouvinte no formulário apanha a mudança de qualquer botão (delegação de eventos)
    form.addEventListener('change', (e) => { if (e.target.name === radioName) update(); });
    // Aplica logo ao abrir (pode já haver um canal escolhido, por exemplo vindo do rascunho)
    update();
  }

  // Gralhas no email (gmial.com → gmail.com): sugere a correção por baixo do campo.
  // Só funciona se o HTML tiver <span data-email-suggest hidden> dentro do .field do email.
  const MAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'outlook.pt', 'sapo.pt', 'live.com.pt', 'icloud.com', 'yahoo.com', 'live.com', 'mail.com', 'ymail.com'];
  // Domínios verdadeiros parecidos com os de cima: nunca recebem sugestão
  const MAIL_OK = ['outlook.es', 'outlook.fr', 'outlook.de', 'outlook.it', 'hotmail.fr', 'hotmail.es', 'hotmail.it', 'hotmail.co.uk',
    'yahoo.es', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.com.br', 'aol.com', 'email.com', 'gmx.com', 'gmx.de', 'me.com', 'msn.com', 'proton.me', 'protonmail.com'];
  // Só é gralha se falhar uma letra, ou duas com a mesma inicial e a mesma terminação (.com, .pt)
  // mailTld(d): devolve a terminação do domínio a partir do último ponto ("sapo.pt" → ".pt")
  const mailTld = (d) => d.slice(d.lastIndexOf('.'));
  // mailNear(d, typed): true se o domínio escrito (typed) for uma gralha provável do domínio conhecido d
  const mailNear = (d, typed) => {
    const n = editDistance(d, typed);
    return n === 1 || (n === 2 && d[0] === typed[0] && mailTld(d) === mailTld(typed));
  };
  /**
   * editDistance(a, b): distância de Levenshtein entre dois textos, ou seja, o número mínimo de letras
   * a inserir, apagar ou trocar para passar de a para b ("gmial.com" → "gmail.com" = 2).
   * Usa programação dinâmica guardando só uma linha da tabela de cada vez (poupa memória).
   * Devolve um número inteiro.
   */
  function editDistance(a, b) {
    // linha inicial: transformar "" nos primeiros j caracteres de b custa j inserções
    let row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      // o menor de três caminhos: apagar (row[j] + 1), inserir (next[j - 1] + 1) ou trocar (0 se a letra for igual)
      for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row = next;
    }
    return row[b.length];
  }
  // emailSuggest(form): liga a sugestão de gralhas ao campo de email do formulário. Não devolve nada.
  function emailSuggest(form) {
    const email = $('input[type="email"]', form);
    // box é a caixa escondida onde aparece "Querias dizer ...?" com o botão para corrigir
    const box = $('[data-email-suggest]', form);
    if (!email || !box) return;
    // Só se verifica ao sair do campo, para não interromper quem ainda está a escrever
    email.addEventListener('blur', () => {
      // Separa o email em m[1] = parte antes do @ e m[2] = domínio (sem espaços, com um único @)
      const m = email.value.trim().toLowerCase().match(/^([^\s@]+)@([^\s@]+)$/);
      // Domínio já conhecido (certo) = nada a sugerir
      const known = m && (MAIL_DOMAINS.includes(m[2]) || MAIL_OK.includes(m[2]));
      // Primeiro domínio da lista que esteja "perto" do escrito; null se nenhum estiver
      const dom = m && !known ? MAIL_DOMAINS.find((d) => mailNear(d, m[2])) : null;
      box.hidden = !dom;
      // O email sugerido passa por esc() porque é texto escrito pela pessoa e vai para dentro de HTML;
      // fica guardado em data-fix para o botão o aplicar
      box.innerHTML = dom
        ? esc(T.emailHint(m[1] + '@' + dom)) + ' <button type="button" class="link-btn" data-fix="' + esc(m[1] + '@' + dom) + '">' + T.emailFix + '</button>'
        : '';
    });
    // Clique no botão "Corrigir": troca o email pelo sugerido, esconde a caixa e volta a validar
    // (o ouvinte está na caixa e não no botão porque o botão é recriado a cada sugestão)
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fix]');
      if (!b) return;
      email.value = b.dataset.fix;
      box.hidden = true;
      box.innerHTML = '';
      validateField(email);
      email.dispatchEvent(new Event('input', { bubbles: true }));     // para o rascunho ficar com o email certo
    });
  }

  /* ---------- 09. FORMULÁRIO DE ORÇAMENTO ---------- */
  /**
   * initQuoteForm(): prepara o formulário de orçamento em vários passos de orcamento.html.
   * Trata de: pré-seleção a partir do link, rascunho guardado, cálculo do preço e do prazo em tempo real,
   * validação de cada passo, navegação entre passos, resumo final e envio (com plano B se falhar).
   * Não recebe parâmetros nem devolve nada. Tudo fica dentro desta função para não poluir o resto do script.
   */
  function initQuoteForm() {
    const form = $('#quoteForm');
    // Noutras páginas não há formulário de orçamento: sai sem fazer nada
    if (!form) return;
    form.noValidate = true;       // com JavaScript mostramos as nossas mensagens, não os balões do navegador

    // Elementos usados ao longo da função:
    // steps = cada passo (<fieldset class="fstep">); botões Voltar / Continuar / Enviar;
    // barra de progresso (#progressFill), "Passo X de Y" (#stepLabel), nome do passo (#stepName),
    // pontos do progresso (#progressSteps li), caixa de mensagens (#formStatus) e link de WhatsApp do último passo (#quoteWa)
    const steps = $$('.fstep', form);
    const btnPrev = $('.btn-prev', form);
    const btnNext = $('.btn-next', form);
    const btnSubmit = $('.btn-submit', form);
    const fill = $('#progressFill');
    const stepLabel = $('#stepLabel');
    const stepName = $('#stepName');
    const stepDots = $$('#progressSteps li');
    const status = $('#formStatus');
    const quoteWa = $('#quoteWa');
    let current = 0;              // índice do passo visível (0 = primeiro)
    let sending = false;          // trava envios em duplicado
    let statusKind = '';          // 'erro' = falta responder a algo; 'envio' = o envio falhou

    // Preço (€) de cada página a mais do que as incluídas no formato
    const PAGE_PRICE = 60;
    // Os botões de páginas guardam um valor (1, 3, 5, 8) mas mostram um intervalo: este mapa traduz para o email e o resumo
    const PAGES_LABEL = { 1: '1', 3: '2–3', 5: '4–5', 8: '6–8' };
    // Dias a mais no prazo (mínimo, máximo). Os extras que não estão aqui não mexem no prazo.
    const EXTRA_DAYS = { noticias: [2, 3], ingles: [2, 3] };
    const TEXTS_DAYS = [0, 3];    // quando somos nós a escrever os textos
    // Para comparar com o Site Profissional nos avisos do passo 2
    // Preço base e páginas incluídas vêm do HTML; 450 e 5 são só a reserva se o botão não existir
    const siteRadio = $('input[name="tipo"][data-key="site"]', form);
    const SITE_BASE = siteRadio ? Number(siteRadio.dataset.base) : 450;
    const SITE_PAGES = siteRadio ? Number(siteRadio.dataset.pages) : 5;

    // checkedOf(name): devolve o botão de opção escolhido nesse grupo (ou null se nenhum)
    const checkedOf = (name) => $('input[name="' + name + '"]:checked', form);
    // cut(t, n): corta o texto t em n caracteres e acrescenta reticências (para mensagens longas no resumo e no WhatsApp)
    const cut = (t, n) => (t.length > n ? t.slice(0, n).trim() + '…' : t);

    // Mensagem junto aos botões (no telemóvel a barra está sempre à vista)
    // setStatus(html, kind): mostra html na caixa #formStatus (vazio = limpa) e guarda o tipo da mensagem
    // em statusKind, para saber mais tarde se a deve apagar sozinha. Não devolve nada.
    function setStatus(html, kind) {
      if (!status) return;
      // esvaziar primeiro faz o leitor de ecrã voltar a anunciar uma mensagem igual à anterior
      status.innerHTML = '';
      if (html) status.innerHTML = html;
      statusKind = html ? kind : '';
    }

    // --- O que vem no link ---
    // orcamento.html?tipo=site&setor=restauracao&extra=ingles,animacoes&plano=essencial&paginas=5
    // Só aceitamos letras, números, "-" e "_": um link estranho nunca parte o formulário.
    // Lê os parâmetros depois do "?" no endereço da página
    const params = new URLSearchParams(location.search);
    // key(v): devolve v se só tiver letras, números, "-" ou "_" (regex com i = maiúsculas ou minúsculas); senão ''.
    // Importante porque o valor vai entrar num seletor CSS: aspas ou parênteses partiriam o seletor.
    const key = (v) => (/^[a-z0-9_-]+$/i.test(v || '') ? v : '');
    // byKey(sel, v): troca a palavra KEY do seletor pelo valor do link e devolve o elemento encontrado (ou null)
    const byKey = (sel, v) => (key(v) ? $(sel.replace('KEY', key(v)), form) : null);
    // Elemento que corresponde a cada parâmetro (formato, setor, plano de manutenção, nº de páginas)
    const linkTipo = byKey('input[name="tipo"][data-key="KEY"]', params.get('tipo'));
    const linkSetor = byKey('#setor option[data-key="KEY"]', params.get('setor'));
    const linkPlano = byKey('#manutencao option[data-key="KEY"]', params.get('plano'));
    const linkPaginas = byKey('input[name="paginas"][value="KEY"]', params.get('paginas'));
    // Extras: vários separados por vírgulas; os que não existem no formulário são descartados (filter(Boolean))
    const linkExtras = (params.get('extra') || '').split(',')
      .map((k) => byKey('input[type="checkbox"][data-key="KEY"]', k)).filter(Boolean);
    // o mesmo link, só com o que foi aceite (vai no email e marca o rascunho)
    // Cada linha dá "nome=valor" ou false; filter(Boolean) tira os false e join('&') junta o resto
    const linkText = [
      linkTipo && 'tipo=' + linkTipo.dataset.key,
      linkSetor && 'setor=' + linkSetor.dataset.key,
      linkExtras.length && 'extra=' + linkExtras.map((c) => c.dataset.key).join(','),
      linkPlano && 'plano=' + linkPlano.dataset.key,
      linkPaginas && 'paginas=' + linkPaginas.value
    ].filter(Boolean).join('&');

    // --- Rascunho guardado neste dispositivo (localStorage) ---
    // Se a pessoa fechar a página sem querer, as respostas voltam a aparecer.
    // Fica só no navegador dela: nada é enviado sem carregar em "Enviar pedido".
    // Uma chave por idioma: o rascunho da versão inglesa não se mistura com o da portuguesa
    const DRAFT_KEY = 'pronex-orcamento-rascunho-' + LANG;
    // Nunca se guardam: o campo-armadilha anti-spam (_honey) e a autorização RGPD,
    // que a pessoa tem de dar de novo de cada vez que envia
    const SKIP = ['_honey', 'consentimento'];
    // Campos escritos à mão: são os únicos repostos quando um link manda nas escolhas
    const TEXT_FIELDS = ['nome', 'email', 'telefone', 'negocio', 'site_atual', 'mensagem'];
    // Faixa "Recuperámos as respostas que deixaste a meio" (role="status"), escondida até haver rascunho reposto
    const draftNote = $('#draftNote');

    // saveDraft(): junta as respostas atuais num objeto { nome do campo: valor } e guarda-o em JSON
    // no localStorage (através de store, que ignora erros em navegação privada). Não devolve nada.
    function saveDraft() {
      const data = {};
      $$('input, select, textarea', form).forEach((el) => {
        // campos sem nome, escondidos (preenchidos pelo script) ou da lista SKIP ficam de fora
        if (!el.name || el.type === 'hidden' || SKIP.includes(el.name)) return;
        // de um grupo de opções guarda-se só a marcada; dos campos de texto e listas, o valor se não estiver vazio
        if (el.type === 'radio' || el.type === 'checkbox') { if (el.checked) data[el.name] = el.value; }
        else if (el.value) data[el.name] = el.value;
      });
      if (current) data._passo = current;       // para retomar no passo onde a pessoa ficou
      if (linkText) data._link = linkText;      // este rascunho já é a continuação deste link
      store.set(DRAFT_KEY, JSON.stringify(data));
    }

    // loadDraft(data, textOnly): volta a preencher o formulário com o rascunho data (objeto lido do localStorage).
    // textOnly: repõe só o que a pessoa escreveu (nome, contactos, mensagem), não as escolhas
    // Devolve true se pelo menos um campo foi reposto (para mostrar a faixa do rascunho).
    function loadDraft(data, textOnly) {
      let restored = false;
      Object.entries(data).forEach(([name, value]) => {
        // O localStorage pode ter sido alterado à mão: o nome tem de começar por letra e ter só letras,
        // números, "_" ou "-" (vai entrar num seletor), e o valor tem de ser texto. Chaves internas como _passo ficam de fora.
        if (!/^[a-z][\w-]*$/i.test(name) || typeof value !== 'string') return;
        if (SKIP.includes(name) || (textOnly && !TEXT_FIELDS.includes(name))) return;
        $$('[name="' + name + '"]', form).forEach((el) => {
          if (el.type === 'hidden') return;
          if (el.type === 'radio' || el.type === 'checkbox') {
            // marca a opção cujo valor coincide (sem ligar a maiúsculas) e desmarca as outras do grupo
            el.checked = el.value.toLowerCase() === value.toLowerCase();
            if (el.checked) restored = true;
            // numa lista (<select>) só se repõe um valor que ainda exista nas opções
          } else if (el.tagName !== 'SELECT' || Array.from(el.options).some((o) => o.value === value)) {
            el.value = value;
            restored = true;
          }
        });
      });
      return restored;
    }

    // Lê o rascunho guardado. Um JSON estragado não parte a página: o try/catch transforma-o em "sem rascunho".
    let draft = null;
    try { draft = JSON.parse(store.get(DRAFT_KEY) || 'null'); } catch (e) { draft = null; }
    if (!draft || typeof draft !== 'object') draft = null;
    // Um link com ?tipo= válido manda nas escolhas; o rascunho só repõe os textos.
    // Exceção: se a pessoa recarregou a página (ou voltou atrás) e o rascunho nasceu deste mesmo link, vale o rascunho inteiro.
    // Um clique novo num cartão abre sempre com o formato e o preço que o cartão promete.
    // A Navigation Timing API diz como se chegou à página: 'navigate' (link novo), 'reload' ou 'back_forward'.
    // Em navegadores sem esta API fica um objeto vazio (conta como link novo).
    const navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    const reloaded = navEntry.type === 'reload' || navEntry.type === 'back_forward';
    const sameLink = reloaded && !!(draft && linkText && draft._link === linkText);
    // linkWins = true: as escolhas vêm do link e do rascunho só se aproveitam os textos
    const linkWins = !!linkTipo && !sameLink;
    const restored = draft ? loadDraft(draft, linkWins) : false;
    // Mostra a faixa a avisar que as respostas foram recuperadas
    if (restored && draftNote) draftNote.hidden = false;

    // Botão "Começar de novo" na faixa do rascunho: apaga o rascunho guardado
    const draftClear = $('#draftClear');
    if (draftClear) {
      draftClear.addEventListener('click', () => {
        store.del(DRAFT_KEY);
        location.replace(location.pathname + location.search);      // recarrega o formulário vazio (mantém o formato do link)
      });
    }

    // --- Pré-seleção a partir do link ---
    // Só quando o link é novo; num recarregamento do mesmo link, o rascunho já tem as escolhas (e as mudanças feitas)
    if (linkText && !sameLink) {
      if (linkTipo) linkTipo.checked = true;
      // Páginas: as do link ou, se não vierem, as que o formato inclui (data-pages)
      const pr = linkPaginas || (linkTipo ? $('input[name="paginas"][value="' + linkTipo.dataset.pages + '"]', form) : null);
      if (pr) pr.checked = true;
      if (linkSetor) $('#setor', form).value = linkSetor.value;
      linkExtras.forEach((c) => { c.checked = true; });
      if (linkPlano) $('#manutencao', form).value = linkPlano.value;

      // Faixa "Preparámos o orçamento para…": explica porque é que o formulário já abre com escolhas feitas
      const presetNote = $('#presetNote');
      // what: "Site Profissional + Versão em inglês + Manutenção Essencial"; a manutenção só entra se for um plano pago (data-monthly)
      const what = [linkTipo && linkTipo.value]
        .concat(linkExtras.map((c) => c.dataset.label), linkPlano && linkPlano.dataset.monthly ? T.maintenance + ': ' + linkPlano.value : null)
        .filter(Boolean).join(' + ');
      if (presetNote && (what || linkSetor)) {
        presetNote.textContent = T.preset(what, linkSetor ? linkSetor.textContent.trim() : '');
        presetNote.hidden = false;
      }
    }

    // --- Cálculo da estimativa ---
    /**
     * calc(): calcula o preço e o prazo a partir das escolhas atuais. Todos os valores vêm dos atributos data-*
     * do HTML (data-base, data-pages, data-min, data-max, data-price, data-perpage, data-mult, data-speed, data-monthly),
     * por isso mudar um preço no HTML basta para o cálculo acompanhar.
     * Devolve null se ainda não houver formato escolhido; senão um objeto com:
     * total (€), lines (lista [descrição, valor] para o detalhe), dMin/dMax (dias), monthly (€/mês),
     * pages (nº de páginas) e tipo (o botão do formato escolhido).
     */
    function calc() {
      const tipo = checkedOf('tipo');
      if (!tipo) return null;
      const pag = checkedOf('paginas');
      const prazo = checkedOf('prazo');
      const cont = checkedOf('conteudos');
      const maint = $('#manutencao', form);
      const lines = [];

      // Ponto de partida: preço base do formato (ex.: Site Profissional = 450 €)
      let total = Number(tipo.dataset.base);
      lines.push([tipo.value, total]);
      // Prazo em dias (mínimo e máximo): vem do HTML, igual aos cartões de Serviços
      let dMin = Number(tipo.dataset.min) || 0;
      let dMax = Number(tipo.dataset.max) || 0;

      // Páginas: só se pagam as que passam das incluídas no formato (Math.max evita valores negativos)
      const included = Number(tipo.dataset.pages);
      const pages = pag ? Number(pag.value) : included;
      const extraPages = Math.max(0, pages - included);
      if (extraPages) {
        total += extraPages * PAGE_PRICE;
        lines.push([T.pagesMore(extraPages), extraPages * PAGE_PRICE]);
        dMin += extraPages;             // cada página a mais: +1 dia no mínimo e +2 no máximo
        dMax += extraPages * 2;
      }

      // Extras marcados: cada um soma o seu preço (data-price) e, se estiver em EXTRA_DAYS, dias ao prazo
      $$('input[type="checkbox"][data-label]:checked', form).forEach((c) => {
        total += Number(c.dataset.price);
        lines.push([c.dataset.label, Number(c.dataset.price)]);
        const more = EXTRA_DAYS[c.dataset.key];
        if (more) { dMin += more[0]; dMax += more[1]; }
      });

      // Textos escritos por nós: preço por página (data-perpage) vezes o total de páginas, não só as extra
      if (cont && Number(cont.dataset.perpage)) {
        const v = Number(cont.dataset.perpage) * pages;
        total += v;
        lines.push([T.texts(pages), v]);
        dMin += TEXTS_DAYS[0];
        dMax += TEXTS_DAYS[1];
      }

      // Urgência: multiplicador sobre tudo o que já foi somado (data-mult="1.2" = +20%).
      // Vem depois dos extras e dos textos para a taxa incidir também sobre eles.
      if (prazo && Number(prazo.dataset.mult) > 1) {
        const surcharge = total * (Number(prazo.dataset.mult) - 1);
        lines.push([T.urgent, surcharge]);
        total += surcharge;
      }
      // Urgente: metade do prazo (arredondado para cima), nunca menos de 2 dias
      if (dMax && prazo && Number(prazo.dataset.speed) < 1) {
        dMin = Math.max(2, Math.ceil(dMin * Number(prazo.dataset.speed)));
        dMax = Math.max(2, Math.ceil(dMax * Number(prazo.dataset.speed)));
      }

      // Manutenção: valor mensal à parte, fora do total (paga-se todos os meses, não uma vez)
      const opt = maint ? maint.selectedOptions[0] : null;
      const monthly = opt && opt.dataset.monthly ? Number(opt.dataset.monthly) : 0;

      return { total, lines, dMin, dMax, monthly, pages, tipo };
    }

    // "3–5 dias" até 14 dias; a partir daí em semanas ("2–4 semanas")
    // timeText(min, max, sep): transforma dias em texto legível. sep é o separador do intervalo
    // ("–" por omissão; para leitores de ecrã usa-se a palavra "a"/"to", que se lê melhor). Sem prazo devolve ''.
    function timeText(min, max, sep) {
      if (!max) return '';
      sep = sep || '–';
      // Até duas semanas: em dias, no singular se for 1
      if (max <= 14) return (min === max ? String(max) : min + sep + max) + ' ' + (max === 1 ? T.day : T.days);
      // Em semanas: o mínimo arredonda para baixo (nunca 0) e o máximo para cima, para não prometer menos tempo do que o real
      const a = Math.max(1, Math.floor(min / 7));
      const b = Math.ceil(max / 7);
      return (a === b ? String(b) : a + sep + b) + ' ' + (b === 1 ? T.week : T.weeks);
    }

    // Texto que segue no email e no resumo: "490 € (até 564 €) + 25 €/mês"
    // estimateText(r): r é o resultado de calc(); o valor máximo é o total com uma margem de 15%
    const estimateText = (r) => euro(r.total) + ' (' + T.upTo + ' ' + euro(r.total * 1.15) + ')' + (r.monthly ? ' + ' + perMonth(r.monthly) : '');

    // Caixa da estimativa: valor (#estValue), prazo (#estTime), detalhe das parcelas (#estLines),
    // valor na barra do telemóvel (#estBar) e zona aria-live só para leitores de ecrã (#estLive)
    const estValue = $('#estValue');
    const estTime = $('#estTime');
    const estLines = $('#estLines');
    const estBar = $('#estBar');
    const estLive = $('#estLive');
    const receipt = $$('#estReceipt li b');              // 4 linhas: reservar, entrega, endereço, manutenção
    // texto original da linha da manutenção, reposto quando não há plano pago escolhido
    const receiptPlan = receipt[3] ? receipt[3].textContent : '';
    let lastTotal = null;         // último total mostrado (para só animar quando muda)
    let lastSaid = '';            // última frase anunciada aos leitores de ecrã (para não repetir)
    let liveTimer = null;         // temporizador do anúncio atrasado

    // Dicas do passo 2: quantas páginas já estão incluídas, aviso do Cartão Digital com várias páginas
    // e aviso quando a Página Única ou o Renovar um Site saem mais caros do que o Site Profissional.
    const pagesHint = $('#pagesHint');
    const landingHint = $('#landingHint');
    const cardHint = $('#cardHint');
    // updateHints(r): mostra ou esconde as três dicas conforme o resultado r de calc(). Não devolve nada.
    function updateHints(r) {
      if (!r) return;
      const k = r.tipo.dataset.key;
      const inc = Number(r.tipo.dataset.pages);
      if (pagesHint) pagesHint.textContent = T.pagesHint(r.tipo.value, inc, euro(PAGE_PRICE));
      if (landingHint) {
        // Compara só base + páginas extra dos dois formatos (os extras custam o mesmo em ambos)
        const mine = Number(r.tipo.dataset.base) + Math.max(0, r.pages - inc) * PAGE_PRICE;
        const site = SITE_BASE + Math.max(0, r.pages - SITE_PAGES) * PAGE_PRICE;
        const show = ['landing', 'redesign'].includes(k) && mine > site;
        // o nome do formato atual é escrito dentro do aviso, no elemento [data-format-name]
        const name = $('[data-format-name]', landingHint);
        if (show && name) name.textContent = r.tipo.value;
        landingHint.hidden = !show;
      }
      // O Cartão Digital é de uma só página: avisa se a pessoa pediu mais
      if (cardHint) cardHint.hidden = !(k === 'cartao' && r.pages > 1);
    }
    // Botões dentro dos avisos (#switchToSite ou [data-switch-site]): passam o formato para Site Profissional num clique
    $$('#switchToSite, [data-switch-site]', form).forEach((b) => {
      b.addEventListener('click', () => {
        if (!siteRadio) return;
        siteRadio.checked = true;           // mantém o número de páginas que a pessoa escolheu
        // Mudar .checked pelo script não dispara o evento change: recalcula-se e guarda-se à mão
        updateEstimate();
        saveDraft();
        const pr = checkedOf('paginas');    // o aviso desaparece: o foco passa para as páginas
        if (pr) pr.focus();
      });
    });

    /**
     * updateEstimate(quiet): volta a calcular e atualiza tudo o que mostra o preço e o prazo:
     * caixa da estimativa, barra do telemóvel, detalhe, recibo, campos escondidos que seguem no email
     * e o anúncio para leitores de ecrã. Com quiet = true não faz esse anúncio (usado ao abrir a página).
     */
    function updateEstimate(quiet) {
      const r = calc();
      updateHints(r);
      if (!r) return;
      // Valor máximo: o total + 15% de margem para imprevistos
      const max = r.total * 1.15;
      const time = timeText(r.dMin, r.dMax);
      if (estValue) {
        estValue.textContent = euro(r.total);
        // Pequena animação "bump" quando o valor muda (não na primeira vez)
        if (lastTotal !== null && lastTotal !== r.total) {
          estValue.classList.remove('bump');
          // ler offsetWidth obriga o navegador a recalcular o layout; sem isto, tirar e pôr a classe
          // na mesma volta não reinicia a animação CSS
          void estValue.offsetWidth;            // reinicia a animação
          estValue.classList.add('bump');
        }
      }
      lastTotal = r.total;
      // Barra do telemóvel: só o valor (cabe entre "Voltar" e "Continuar")
      if (estBar) {
        estBar.textContent = euro(r.total);
        // aria-label (texto T.estBar) dá contexto ao valor solto para quem usa leitor de ecrã
        estBar.setAttribute('aria-label', T.estBar(euro(r.total)));
      }
      if (estTime) estTime.textContent = time ? T.estTime + time : '';
      // Detalhe: uma <li> por parcela (o rótulo passa por esc()), a manutenção se o recibo não a mostrar
      // (recibo com menos de 4 linhas) e, no fim, o valor máximo
      if (estLines) {
        estLines.innerHTML = r.lines.map(([label, v]) => '<li>' + esc(label) + ' <b>' + euro(v) + '</b></li>').join('') +
          (r.monthly && receipt.length < 4 ? '<li>' + T.maintenance + ' <b>' + perMonth(r.monthly) + '</b></li>' : '') +
          '<li><span>' + T.maxValue + '</span> <b>' + euro(max) + '</b></li>';
      }
      // Recibo: metade para reservar, metade na entrega, e a manutenção escolhida
      if (receipt.length >= 4) {
        // a reserva arredonda para cima e a entrega leva o resto, para as duas metades somarem sempre o total
        // (a linha 3, endereço, não muda)
        const half = Math.ceil(r.total / 2);
        receipt[0].textContent = euro(half);
        receipt[1].textContent = euro(r.total - half);
        receipt[3].textContent = r.monthly ? perMonth(r.monthly) : receiptPlan;
      }
      // Campos escondidos do formulário com a estimativa e o prazo: ficam sempre com os valores atuais
      // (no envio por fetch, o payload() acrescenta estes dados com nomes legíveis)
      const estInput = $('#estimativaInput', form);
      const timeInput = $('#prazoInput', form);
      if (estInput) estInput.value = estimateText(r);
      if (timeInput) timeInput.value = time;
      // Leitores de ecrã: uma frase completa, só quando o valor ou o prazo mudam e com um pequeno atraso
      const said = T.estLive(euro(r.total), timeText(r.dMin, r.dMax, T.to));
      // O atraso de 600 ms (reiniciado a cada mudança) evita uma enxurrada de anúncios
      // quando a pessoa clica em várias opções seguidas: só a última é lida
      if (estLive && !quiet && said !== lastSaid) {
        clearTimeout(liveTimer);
        liveTimer = setTimeout(() => { estLive.textContent = said; }, 600);
      }
      lastSaid = said;
    }

    // A cada letra escrita: apaga o aviso "falta responder" (a pessoa já está a corrigir) e guarda o rascunho.
    // Um aviso de envio falhado ('envio') fica, porque tem os botões do plano B.
    form.addEventListener('input', () => {
      if (statusKind === 'erro') setStatus('');
      saveDraft();
    });
    // A cada escolha (opções, caixas, listas): recalcula a estimativa e guarda o rascunho
    form.addEventListener('change', (e) => {
      // Ao mudar de tipo, o número de páginas volta ao que esse formato já inclui
      if (e.target.name === 'tipo') {
        const pr = $('input[name="paginas"][value="' + e.target.dataset.pages + '"]', form);
        if (pr) pr.checked = true;
      }
      // tira o vermelho do passo onde houve a mudança
      const step = e.target.closest('.fstep');
      if (step) step.classList.remove('has-error');
      if (statusKind === 'erro') setStatus('');
      updateEstimate();
      saveDraft();
    });

    // Primeiro problema de um passo, pela ordem do ecrã: escolha em falta, campo mal preenchido, autorização.
    // Com mark = true mostra os erros; sem ele só confirma (usado para retomar o rascunho e antes de enviar).
    // stepIssue(i, mark): i é o índice do passo. Devolve { el, msg } (controlo em falta e mensagem a mostrar)
    // ou null se o passo estiver completo.
    function stepIssue(i, mark) {
      const step = steps[i];
      // mensagem geral do passo (ex.: "Escolhe uma opção para continuar."), usada quando o problema não tem mensagem própria
      const groupError = $('.group-error', step);
      const groupMsg = groupError ? groupError.textContent : '';
      let bad = null;
      let msg = '';
      let missing = false;          // true se faltar uma escolha ou a autorização (pinta o passo de vermelho)
      // Grupos de opções obrigatórios: o Set junta os botões pelo nome, para verificar cada grupo uma vez só
      new Set($$('input[type="radio"][required]', step).map((r) => r.name)).forEach((name) => {
        if ($('input[name="' + name + '"]:checked', step)) return;
        missing = true;
        if (!bad) { bad = $('input[name="' + name + '"]', step); msg = groupMsg; }
      });
      // Campos de texto e listas: todos são validados (para pintar cada um), mas só o primeiro errado fica em bad
      $$('.field input, .field textarea, .field select', step).forEach((inp) => {
        const ok = mark ? validateField(inp) : checkField(inp);
        if (ok || bad) return;
        const err = $('.error', inp.closest('.field'));
        bad = inp;
        msg = err ? err.textContent : groupMsg;
      });
      // Autorização para tratar os dados (RGPD): só existe no último passo e tem de estar marcada
      const consent = $('#consent', step);
      if (consent && !consent.checked) {
        missing = true;
        if (!bad) { bad = consent; msg = groupMsg; }
      }
      if (mark) step.classList.toggle('has-error', missing);
      return bad ? { el: bad, msg } : null;
    }

    // Mostra o que falta: a mensagem repete-se junto aos botões e o foco vai para o primeiro controlo em falta
    // validateStep(i): devolve true se o passo i estiver completo (pode avançar); senão mostra o problema e devolve false
    function validateStep(i) {
      const issue = stepIssue(i, true);
      if (!issue) {
        if (statusKind === 'erro') setStatus('');
        return true;
      }
      setStatus(esc(issue.msg), 'erro');
      // box = o bloco que contém o controlo em falta (grupo de opções, autorização ou campo)
      const box = issue.el.closest('.options, .consent, .field') || issue.el;
      // a mensagem do passo fica logo por baixo do grupo em falta: vê-se mesmo quando os botões estão fora do ecrã
      const groupError = $('.group-error', steps[i]);
      if (groupError && box.matches('.options, .consent')) box.after(groupError);
      // Foco no controlo em falta (teclado e leitores de ecrã vão logo para lá); preventScroll porque
      // o deslocamento é feito a seguir por bringIntoView, com mais cuidado
      issue.el.focus({ preventScroll: true });
      bringIntoView(box);
      return false;
    }

    // Liga as ajudas comuns da secção 08 a este formulário: validação ao vivo, telefone obrigatório
    // para WhatsApp/chamada e sugestão de gralhas no email
    liveValidation(form);
    phoneRule(form, 'contacto_preferido', ['whatsapp', 'phone']);
    emailSuggest(form);

    // Contador de caracteres da mensagem (#msgCount), atualizado a cada letra
    const msg = $('#mensagem');
    const msgCount = $('#msgCount');
    if (msg && msgCount) msg.addEventListener('input', () => { msgCount.textContent = msg.value.length; });

    // --- Respostas com nomes legíveis: servem o resumo, o email que recebemos e o plano B ---
    // answers(): devolve um objeto com todas as respostas em texto (tipo, setor, páginas, extras, contactos...),
    // mais r (resultado de calc) e time (prazo em texto). Campos vazios ficam como ''.
    function answers() {
      const r = calc();
      // val(sel): valor sem espaços nas pontas de um campo; pick(name): valor da opção escolhida num grupo
      const val = (sel) => { const el = $(sel, form); return el ? el.value.trim() : ''; };
      const pick = (name) => { const el = checkedOf(name); return el ? el.value : ''; };
      const time = r ? timeText(r.dMin, r.dMax) : '';
      return {
        r, time,
        tipo: pick('tipo'), setor: val('#setor'), paginas: PAGES_LABEL[pick('paginas')] || '',
        extras: $$('input[type="checkbox"][data-label]:checked', form).map((c) => c.dataset.label).join(', ') || T.none,
        prazo: pick('prazo'), conteudos: pick('conteudos'), manutencao: val('#manutencao'),
        estimativa: r ? estimateText(r) : '',
        nome: val('#nome'), email: val('#email'), telefone: val('#telefone'), contacto: pick('contacto_preferido'),
        mensagem: val('#mensagem'), negocio: val('#negocio'), site: val('#site_atual'),
        investir: val('#orcamento'), origem: val('#origem')
      };
    }
    // rowsText(a, keys): uma linha "Rótulo: valor" por chave de keys que tenha resposta (rótulos em T.f), separadas por quebras de linha
    const rowsText = (a, keys) => keys.filter((k) => a[k]).map((k) => T.f[k] + ': ' + a[k]).join('\n');

    // Pedido já escrito, para seguir por WhatsApp ou por email
    // planText(a, withPhone): a = answers(). Devolve o texto completo do pedido. A estimativa leva o prazo junto
    // e a mensagem é cortada a 600 caracteres, para o link do WhatsApp ou do mailto: não ficar demasiado comprido.
    // withPhone = true acrescenta o canal preferido e o telefone (usado no plano B);
    // no link de WhatsApp do resumo não vão, porque a mensagem já chega do número da pessoa.
    function planText(a, withPhone) {
      const b = Object.assign({}, a, { estimativa: a.estimativa + (a.time ? ' · ' + a.time : ''), mensagem: cut(a.mensagem, 600) });
      return T.waQuote + '\n\n' +
        rowsText(b, ['tipo', 'setor', 'paginas', 'extras', 'prazo', 'conteudos', 'manutencao', 'estimativa', 'nome', 'negocio', 'mensagem']
          .concat(withPhone ? ['contacto', 'telefone'] : []));
    }
    // subjectText(a): assunto do email, ex.: "Orçamento · Site Profissional · Ana · 450 €" (só as partes que existem)
    const subjectText = (a) => [T.subject, a.tipo, a.nome, a.r ? euro(a.r.total) : ''].filter(Boolean).join(' · ');

    // Email que recebemos: campos por ordem, com nomes legíveis, sem vazios nem repetidos
    // payload(a): a = answers(). Devolve o objeto que sendForm envia ao FormSubmit.
    // Os nomes das chaves (T.f.*) são os rótulos que aparecem no email, na língua da página.
    function payload(a) {
      // _subject é um campo especial do FormSubmit: define o assunto do email recebido
      const data = { _subject: subjectText(a) };
      // campos escondidos do HTML (_template, _captcha e, na versão inglesa, idioma); a estimativa e o prazo entram mais abaixo
      $$('input[type="hidden"]', form).forEach((h) => {
        if (h.value && !['_subject', 'estimativa', 'prazo_estimado'].includes(h.name)) data[h.name] = h.value;
      });
      // add(label, v): só acrescenta se houver valor (sem linhas vazias no email); a ordem das chamadas é a ordem no email
      const add = (label, v) => { if (v) data[label] = v; };
      add(T.f.nome, a.nome);
      add('email', a.email);                 // "email" fica assim: o FormSubmit usa-o para a resposta
      add(T.f.telefone, a.telefone);
      add(T.f.contacto, a.contacto);
      add(T.f.tipo, a.tipo);
      add(T.f.paginas, a.paginas);
      add(T.f.extras, a.extras);
      add(T.f.prazo, a.prazo);
      add(T.f.prazoEst, a.time);
      add(T.f.conteudos, a.conteudos);
      add(T.f.manutencao, a.manutencao);
      add(T.f.estimativa, a.estimativa);
      add(T.f.mensagem, a.mensagem);
      add(T.f.setor, a.setor);
      add(T.f.negocio, a.negocio);
      add(T.f.site, a.site);
      add(T.f.investir, a.investir);
      add(T.f.origem, a.origem);
      // de que link veio a pessoa (ajuda a saber que cartão ou página a trouxe)
      add(T.f.link, linkText ? '?' + linkText : '');
      // registo da autorização RGPD: o texto do value da caixa, só se estiver marcada
      const consent = $('#consent', form);
      add(T.f.consent, consent && consent.checked ? consent.value : '');
      return data;
    }

    // --- Resumo do último passo ---
    // buildSummary(): preenche a lista #summary com as respostas, para a pessoa rever antes de enviar.
    // A mensagem é cortada a 90 caracteres para o resumo não ficar enorme. Não devolve nada.
    function buildSummary() {
      const a = answers();
      const b = Object.assign({}, a, { estimativa: a.estimativa + (a.time ? ' · ' + a.time : ''), mensagem: cut(a.mensagem, 90) });
      const keys = ['tipo', 'setor', 'paginas', 'extras', 'prazo', 'conteudos', 'manutencao', 'nome', 'email', 'telefone', 'contacto', 'mensagem', 'estimativa'];
      // Cada resposta passa por esc() porque é texto escrito pela pessoa e entra como HTML
      $('#summary').innerHTML = keys.filter((k) => b[k]).map((k) => '<li><span>' + T.f[k] + '</span><b>' + esc(b[k]) + '</b></li>').join('');
      // Alternativa ao formulário: o mesmo pedido, já escrito, pelo WhatsApp
      if (quoteWa) quoteWa.href = WA_URL + encodeURIComponent(planText(a));
    }

    // --- Navegação entre passos ---
    /**
     * showStep(i, back, initial): mostra o passo i e atualiza botões, barra de progresso e textos.
     * - back: true quando se recua (a classe is-back permite ao CSS animar no sentido contrário);
     * - initial: true ao abrir a página (não mexe no foco nem no scroll, não limpa mensagens nem guarda rascunho).
     * Não devolve nada.
     */
    function showStep(i, back, initial) {
      // só o passo i fica com is-active (visível); os outros ficam escondidos pelo CSS
      steps.forEach((s, n) => {
        s.classList.toggle('is-active', n === i);
        s.classList.toggle('is-back', n === i && !!back);
      });
      current = i;
      const last = i === steps.length - 1;
      // "Voltar" não aparece no primeiro passo; "Continuar" não aparece no último
      btnPrev.hidden = i === 0;
      btnNext.hidden = last;
      form.classList.toggle('on-last', last);          // o CSS só mostra "Enviar" no último passo
      if (quoteWa) quoteWa.hidden = !last;
      // Barra de progresso: largura proporcional ao passo atual (passo 1 de 5 = 20%)
      fill.style.width = ((i + 1) / steps.length * 100) + '%';
      // "Passo X de Y" e o nome do passo (atributo data-name de cada .fstep)
      stepLabel.textContent = T.step(i + 1, steps.length);
      stepName.textContent = steps[i].dataset.name;
      // Pontos do progresso: o atual em destaque e os anteriores marcados como feitos
      stepDots.forEach((d, n) => {
        d.classList.toggle('is-current', n === i);
        d.classList.toggle('is-done', n < i);
      });
      // No último passo o resumo é refeito com as respostas mais recentes
      if (last) buildSummary();
      if (initial) return;
      setStatus('');
      saveDraft();
      // leva o topo do formulário para a vista e dá foco à pergunta (leitores de ecrã)
      const legend = $('legend', steps[i]);
      // tabindex="-1" deixa a <legend> receber foco pelo script sem entrar na ordem do Tab
      legend.setAttribute('tabindex', '-1');
      legend.focus({ preventScroll: true });
      // Posição do topo do formulário na página, menos 110 px de folga (para não ficar por baixo do cabeçalho fixo)
      const top = form.getBoundingClientRect().top + window.scrollY - 110;
      // Só sobe se a pessoa estiver mais abaixo; se o topo já está à vista, a página não salta
      if (window.scrollY > top) window.scrollTo({ top, behavior: noMotion() ? 'auto' : 'smooth' });
    }

    // "Continuar" só avança se o passo atual estiver completo; "Voltar" recua sempre (sem validar)
    btnNext.addEventListener('click', () => { if (validateStep(current)) showStep(current + 1); });
    btnPrev.addEventListener('click', () => showStep(current - 1, true));

    // Enter num campo de texto avança em vez de enviar o formulário a meio
    form.addEventListener('keydown', (e) => {
      // só em <input> (numa <textarea> o Enter faz mudança de linha) e nunca no último passo (aí o Enter envia)
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && current < steps.length - 1) {
        // impede o envio nativo; clicar no "Continuar" reaproveita a validação do passo
        e.preventDefault();
        btnNext.click();
      }
    });

    // --- Envio ---
    // async porque espera pela resposta do FormSubmit (await sendForm)
    form.addEventListener('submit', async (e) => {
      // impede o envio tradicional (que sairia da página); o envio é feito por fetch
      e.preventDefault();
      if (sending) return;                                        // já há um envio a decorrer
      // Se o envio acontecer antes do último passo, faz o mesmo que "Continuar"
      if (current < steps.length - 1) { btnNext.click(); return; }
      if (!validateStep(current)) return;
      // Um rascunho antigo pode ter deixado um passo anterior por responder: volta a esse passo
      for (let i = 0; i < current; i++) {
        if (stepIssue(i)) { showStep(i, true); validateStep(i); return; }
      }
      // Honeypot anti-spam: campo invisível para pessoas; se vier preenchido foi um robô e nada é enviado (em silêncio)
      const honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;                           // robô apanhado

      setStatus('');
      sending = true;
      // is-loading mostra o indicador de carregamento no botão; aria-busy avisa os leitores de ecrã de que está a trabalhar
      btnSubmit.classList.add('is-loading');
      btnSubmit.setAttribute('aria-busy', 'true');

      const a = answers();
      // canal preferido ('email', 'whatsapp', 'phone'); o objeto de reserva evita erro se nada estiver marcado
      const channel = (checkedOf('contacto_preferido') || { dataset: {} }).dataset.channel;
      try {
        await sendForm(form, payload(a));
        // Enviado: o rascunho já não é preciso
        store.del(DRAFT_KEY);
        // Mensagem de sucesso personalizada com o primeiro nome (split(/\s+/) parte nos espaços)
        $('#successName').textContent = T.thanks + a.nome.split(/\s+/)[0];
        $('#successValue').textContent = a.estimativa || '—';
        // A primeira linha diz por onde chega a resposta (e, para chamada ou WhatsApp, o próximo horário de atendimento)
        const reply = $('#successReply');
        if (reply && T.reply[channel]) reply.textContent = T.reply[channel] + (channel === 'email' ? '' : nextPeriodText());
        // Esconde o formulário todo (passos, botões, progresso, ajudas, faixas); o display:none garante que
        // nem o CSS que mostra o passo ativo o volta a mostrar
        $$('.fstep, .form-nav, .progress, .form-help, #presetNote, #draftNote', form).forEach((el) => { el.hidden = true; el.style.display = 'none'; });
        const ok = $('#success');
        ok.classList.add('is-visible');
        ok.scrollIntoView({ block: 'start', behavior: noMotion() ? 'auto' : 'smooth' });     // o título "Pedido enviado." fica à vista
        // foco no bloco de sucesso para os leitores de ecrã lerem a confirmação
        ok.focus({ preventScroll: true });
      } catch (err) {
        // Falhou: destrava para poder tentar de novo e mostra o plano B (WhatsApp ou email já escritos)
        sending = false;
        showPlanB(status, planText(a, true), subjectText(a));
        statusKind = 'envio';
      } finally {
        // Em qualquer caso, o botão deixa de mostrar que está a carregar
        btnSubmit.classList.remove('is-loading');
        btnSubmit.removeAttribute('aria-busy');
      }
    });

    // Leitores de ecrã: cada pergunta começa por "Passo 2 de 5" (ao mudar de passo, o foco vai para a pergunta)
    steps.forEach((s, n) => {
      const legend = $('legend', s);
      // 'afterbegin' põe o texto no início da <legend>; sr-only esconde-o visualmente mas o leitor de ecrã lê-o
      if (legend) legend.insertAdjacentHTML('afterbegin', '<span class="sr-only">' + T.step(n + 1, steps.length) + ': </span>');
    });

    // --- Estado inicial ---
    // Mostra o primeiro passo e calcula a estimativa sem anúncio (quiet) para não falar logo ao abrir
    showStep(0, false, true);
    updateEstimate(true);
    if (msg && msgCount) msgCount.textContent = msg.value.length;   // contador certo se houver rascunho
    // Rascunho: retoma no passo onde a pessoa ficou, desde que os passos anteriores estejam completos
    const savedStep = Math.floor(Number(draft && draft._passo)) || 0;     // um valor estragado conta como passo 1
    // Só quando o rascunho foi reposto por inteiro (não quando um link manda nas escolhas)
    if (restored && !linkWins && savedStep > 0) {
      // nunca além do último passo (o formulário pode ter menos passos do que quando o rascunho foi guardado)
      let target = Math.min(savedStep, steps.length - 1);
      // fica no primeiro passo anterior que esteja incompleto, sem mostrar erros (stepIssue sem mark)
      for (let i = 0; i < target; i++) {
        if (stepIssue(i)) { target = i; break; }
      }
      if (target > 0) {
        showStep(target, false, true);
        // Troca só o texto inicial da faixa (nodeType 3 = nó de texto) por "Continuas onde ficaste (passo X de Y).",
        // sem tocar no botão "Começar de novo" que vem a seguir
        if (draftNote && draftNote.firstChild && draftNote.firstChild.nodeType === 3) {
          draftNote.firstChild.nodeValue = T.resumeAt(target + 1, steps.length);
        }
      }
    }
  }

  /* ---------- 10. "NÃO SEI O QUE PRECISO" ---------- */
  // 4 perguntas simples -> recomendação de formato + link para o orçamento já preenchido.
  // Os textos e os preços vêm do HTML (#finderData), um por língua.
  // Existe só em servicos.html (e na versão inglesa); nas outras páginas a função sai logo.

  /**
   * initFinder(): liga o questionário "Não sei o que preciso".
   * Sempre que uma resposta muda, recalcula a sugestão e reescreve o cartão #finderResult
   * (nome do formato, preço "desde", dicas, botão para o orçamento já preenchido,
   * WhatsApp com a mensagem pronta e link para marcar conversa). Não recebe nem devolve nada.
   * Sem JavaScript, o HTML já mostra uma lista simples de formatos com links (melhoria progressiva).
   */
  function initFinder() {
    const finder = $('#finder');            // o formulário com as 4 perguntas (rádios)
    const out = $('#finderResult');         // o cartão onde aparece a sugestão
    const dataEl = $('#finderData');        // <script type="application/json"> com textos e preços
    // Se faltar alguma peça (outra página), não há nada a fazer
    if (!finder || !out || !dataEl) return;
    let formats;
    // O JSON é escrito à mão no HTML: se tiver um erro de sintaxe, desistimos em silêncio
    // e fica visível a lista de formatos que já existe sem JavaScript
    try { formats = JSON.parse(dataEl.textContent); } catch (e) { return; }
    // Dicas extra (sem logótipo, já tem site, clientes estrangeiros); objeto vazio se não existirem
    const tipsData = formats.tips || {};
    // Nomes (atributo name) dos 4 grupos de rádios, pela ordem das perguntas
    const NAMES = ['f_objetivo', 'f_marca', 'f_site', 'f_publico'];
    const initial = out.innerHTML;      // cartão inicial ("Começa pela pergunta 1.")
    let shown = '';                     // o que está no cartão (para só animar quando muda)
    let jumped = false;                 // no telemóvel, só levamos a pessoa até à sugestão uma vez

    // answer(name): devolve o value do rádio escolhido no grupo "name", ou null se a pergunta
    // ainda não tem resposta (procura só dentro do questionário)
    const answer = (name) => { const r = $('input[name="' + name + '"]:checked', finder); return r ? r.value : null; };

    /**
     * recommend(): lê as 4 respostas, escolhe o formato e desenha o cartão da sugestão.
     * Regras: já tem site -> "redesign"; senão o objetivo (pergunta 1) decide
     * (contactos -> cartão, apresentar -> página única, serviços -> site);
     * site sem logótipo -> "pack" (Marca + Site); clientes estrangeiros -> junta o extra "ingles".
     * Não devolve nada; só mexe no DOM quando o resultado muda.
     */
    function recommend() {
      const goal = answer('f_objetivo');
      const brand = answer('f_marca');
      const site = answer('f_site');
      const people = answer('f_publico');
      // Sem a pergunta 1 (e sem um site para renovar) ainda não dá para sugerir um formato
      if (!goal && site !== 'sim') {
        // Volta ao cartão inicial (só se já tínhamos mostrado uma sugestão, para não reescrever à toa)
        if (shown) { out.innerHTML = initial; shown = ''; }
        return;
      }

      // Chave do formato no JSON (cartao, landing, site, pack, redesign). Quem já tem site vai sempre
      // para "redesign"; os outros são traduzidos a partir da resposta à pergunta 1 por uma tabela.
      let key = site === 'sim' ? 'redesign' : { contactos: 'cartao', apresentar: 'landing', servicos: 'site' }[goal];
      // Quer um site completo mas ainda não tem logótipo: sugerimos o pacote Marca + Site
      if (brand === 'nao' && key === 'site') key = 'pack';
      const f = formats[key];
      // Formato inexistente no JSON (erro de edição): não mostra nada em vez de partir
      if (!f) return;

      const extras = [];                    // chaves dos extras a juntar ao orçamento (ex.: "ingles")
      // Copiamos (slice) as razões do formato para não alterar o array original do JSON
      // quando lhe acrescentarmos dicas; senão as dicas acumulavam-se a cada mudança
      const tips = (f.why || []).slice();
      // Já tem site: a dica depende do que a pessoa quer que o site faça (pergunta 1)
      if (site === 'sim' && goal && tipsData.hasSite && tipsData.hasSite[goal]) tips.push(tipsData.hasSite[goal]);
      // Sem logótipo: a dica muda conforme o formato sugerido
      if (brand === 'nao' && key !== 'pack') {
        // noBrand pode ser um objeto (uma dica por formato) ou um só texto para todos
        const tip =tipsData.noBrand && typeof tipsData.noBrand === 'object' ? tipsData.noBrand[key] : tipsData.noBrand;
        if (tip) tips.push(tip);
      }
      // Clientes estrangeiros: junta a versão em inglês ao preço e ao link do orçamento
      if (people === 'estrangeiro') {
        extras.push('ingles');
        if (tipsData.english) tips.push(tipsData.english);
      }

      // Preço total: o mesmo número com que o formulário de orçamento vai abrir
      const prices = formats.extraPrices || {};     // { ingles: 120 }
      const names = formats.extraNames || {};       // { ingles: "versão em inglês" }
      // Soma dos preços dos extras escolhidos; Number(...) || 0 protege contra valores em falta ou texto
      const extraSum = extras.reduce((s, k) => s + (Number(prices[k]) || 0), 0);
      // Só se faz a conta se o formato tiver um preço numérico ("base");
      // senão mostra-se o texto "price" tal como está escrito no JSON
      const hasBase = typeof f.base === 'number';
      // euro() (definida no início do script) formata o número como valor em euros
      const price = hasBase ? euro(f.base + extraSum) : f.price;
      // Linha pequena "450 € + 120 € da versão em inglês", só quando há extras a somar.
      // Os marcadores {base} e {extra} do JSON são trocados pelos valores.
      const sumLine = hasBase && extraSum && formats.sumLine
        ? formats.sumLine.replace('{base}', euro(f.base)).replace('{extra}', euro(extraSum)) : '';
      // Nome completo para a mensagem do WhatsApp, ex.: "Site Profissional + versão em inglês"
      const fullName = f.name + extras.map((k) => (names[k] ? ' + ' + names[k] : '')).join('');

      // Link para o orçamento já preenchido: orcamento.html?tipo=site&extra=ingles
      // (o formulário de orçamento lê estes parâmetros e abre com as escolhas feitas)
      const link = (formats.quoteUrl || 'orcamento.html') + '?tipo=' + key + (extras.length ? '&extra=' + extras.join(',') : '');
      // Link do WhatsApp com a mensagem já escrita ({formato} e {preco} trocados).
      // encodeURIComponent escapa espaços, acentos e "&" para a mensagem caber no URL.
      // Fica vazio (sem botão) se o JSON não tiver o texto da mensagem ou do botão.
      const wa = formats.wa && formats.waCta
        ? WA_URL + encodeURIComponent(formats.wa.replace('{formato}', fullName).replace('{preco}', formats.from + ' ' + price)) : '';

      // HTML do cartão. Todos os textos vindos do JSON passam por esc() (escapa < > & ")
      // para não serem interpretados como HTML. O link do WhatsApp já vem codificado.
      // O botão do WhatsApp abre num novo separador e avisa disso aos leitores de ecrã (sr-only);
      // rel="noopener noreferrer" impede a página aberta de controlar esta. A seta é decorativa (aria-hidden).
      const html =
        '<p class="eyebrow">' + esc(formats.label) + '</p>' +
        '<h3>' + esc(f.name) + '</h3>' +
        '<p class="price"><small>' + esc(formats.from) + '</small> <b>' + esc(price) + '</b></p>' +
        (sumLine ? '<p class="price-sum muted">' + esc(sumLine) + '</p>' : '') +
        '<ul>' + tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        '<a class="btn btn-primary" href="' + esc(link) + '">' + esc(formats.cta) + ' <span class="arrow" aria-hidden="true">→</span></a>' +
        (wa ? '<a class="btn btn-ghost" href="' + wa + '" target="_blank" rel="noopener noreferrer">' + esc(formats.waCta) + '<span class="sr-only">' + T.newTab + '</span></a>' : '') +
        '<a class="btn btn-ghost" href="' + esc(formats.talkLink) + '">' + esc(formats.talk) + '</a>';
      // Mesma sugestão que já está no ecrã: não reescreve (evita a animação e perder o foco num botão)
      if (html === shown) return;
      shown = html;
      out.innerHTML = html;
      // Reinicia a animação CSS "bump": tira a classe, força o navegador a recalcular o layout
      // (ler offsetWidth obriga a isso; "void" só descarta o valor) e volta a pô-la.
      // Sem este truque, a animação não voltava a correr porque a classe nunca chegava a "mudar".
      out.classList.remove('bump');
      void out.offsetWidth;
      out.classList.add('bump');
    }

    // Um só listener no formulário apanha as mudanças de todos os rádios (delegação de eventos)
    finder.addEventListener('change', () => {
      recommend();
      // Telemóvel: na primeira vez que as 4 respostas ficam dadas, leva a sugestão para o topo do ecrã.
      // Depois disso a página já não salta quando a pessoa muda uma resposta.
      const all = NAMES.every((n) => answer(n));          // true quando as 4 perguntas têm resposta
      // 959px: abaixo disto o cartão da sugestão fica por baixo das perguntas (uma só coluna),
      // por isso a pessoa não o veria sem descer
      if (all && !jumped && window.matchMedia('(max-width: 959px)').matches) {
        jumped = true;
        const head = $('.site-header');
        // Desconta a altura do cabeçalho fixo e mais 16px de folga, para o cartão não ficar tapado
        let top = -(head ? head.offsetHeight : 0) - 16;
        // Soma os offsetTop de cada antepassado posicionado até ao topo do documento.
        // Usamos isto em vez de getBoundingClientRect porque o cartão pode estar a meio de uma
        // animação com transform, o que daria uma posição provisória.
        for (let el = out; el; el = el.offsetParent) top += el.offsetTop;     // posição final, sem contar com a animação de entrada
        // Desliza suavemente, a não ser que a pessoa tenha pedido menos movimento (noMotion)
        window.scrollTo({ top, behavior: noMotion() ? 'auto' : 'smooth' });
      }
    });
    // Corre uma vez ao arrancar: o navegador pode ter guardado respostas ao voltar atrás na página
    recommend();
  }
  // /fim de initFinder

  /* ---------- 11. AGENDA DE CONVERSAS ---------- */
  // Mostra os próximos dias disponíveis e as horas de cada dia.
  // Horário (alterar aqui): segunda a sexta 18:00–20:30, sábado 10:00–12:30, domingo fechado.
  // O horário de atendimento vai da primeira hora até meia hora depois da última (18h–21h e 10h–13h).
  // HOURS: as horas de início das conversas (de 30 em 30 min) por dia da semana.
  // A chave é o número do dia como em Date.getUTCDay(): 0 = domingo, 1 = segunda ... 6 = sábado.
  // O domingo (0) não aparece, por isso conta como fechado.
  const HOURS = {
    1: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    2: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    3: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    4: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    5: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    6: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
  };
  // Dias em que não atendemos: feriados nacionais (e férias, se houver). ATUALIZAR UMA VEZ POR ANO.
  // Formato AAAA-MM-DD (ISO), o mesmo que toISOString().slice(0, 10) produz, para comparar texto com texto.
  const CLOSED = [
    '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25',
    '2027-01-01', '2027-03-26', '2027-04-25', '2027-05-01', '2027-05-27', '2027-06-10', '2027-08-15',
    '2027-10-05', '2027-11-01', '2027-12-01', '2027-12-08', '2027-12-25'
  ];
  const DAYS_AHEAD = 14;          // quantos dias com horário mostramos na agenda
  const DAY_MS = 86400000;        // um dia em milissegundos (24 * 60 * 60 * 1000)
  // toMin("18:30"): converte uma hora "HH:MM" em minutos desde a meia-noite (1110), para fazer contas
  const toMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

  // Data e hora em Portugal continental (o visitante pode estar noutro fuso horário)
  /**
   * lisbonParts(date): recebe um Date e devolve { y, m, d, min } com o ano, o mês (1–12), o dia
   * e os minutos desde a meia-noite, tal como estão nesse instante em Lisboa.
   * Usa Intl.DateTimeFormat com timeZone 'Europe/Lisbon', que já trata a hora de verão.
   */
  function lisbonParts(date) {
    try {
      const p = {};
      // 'en-CA' e hourCycle 'h23' dão números simples (0–23 nas horas) em formatToParts;
      // cada parte (year, month, day, hour, minute) é guardada em p como número
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Lisbon', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).formatToParts(date).forEach((x) => { p[x.type] = Number(x.value); });
      // "% 24" protege contra navegadores que escrevem a meia-noite como 24 em vez de 0
      return { y: p.year, m: p.month, d: p.day, min: (p.hour % 24) * 60 + p.minute };
    } catch (e) {       // navegador muito antigo: usa o relógio do visitante
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), min: date.getHours() * 60 + date.getMinutes() };
    }
  }

  // Horário de atendimento de um dia, em minutos [abre, fecha]; null se estiver fechado
  // openRange(dow, iso): dow = dia da semana (0–6), iso = data "AAAA-MM-DD".
  // Fecha meia hora depois da última hora da lista (a última conversa dura até lá).
  function openRange(dow, iso) {
    const h = HOURS[dow];
    if (!h || CLOSED.includes(iso)) return null;
    return [toMin(h[0]), toMin(h[h.length - 1]) + 30];
  }

  // Próximo período de atendimento (ou o atual, se estivermos abertos agora)
  /**
   * nextOpen(): devolve { open, when, start, end } ou null se não houver nenhum nos próximos 15 dias.
   * open = true se estamos a atender neste momento; when = "hoje", "amanhã" ou o nome do dia;
   * start/end = horas de abertura e fecho já em texto (ex.: "18h", "21h").
   */
  function nextOpen() {
    const now = lisbonParts(new Date());
    // Meia-noite UTC do dia de hoje em Lisboa. Trabalhamos em UTC para somar dias certos
    // (sem saltos de uma hora nas mudanças de hora de verão) e lemos com getUTC*.
    const base = Date.UTC(now.y, now.m - 1, now.d);
    // Hoje mais 14 dias: chega para passar por cima de feriados seguidos e do domingo
    for (let i = 0; i < 15; i++) {
      const d = new Date(base + i * DAY_MS);
      const r = openRange(d.getUTCDay(), d.toISOString().slice(0, 10));
      // Salta dias fechados e, no próprio dia, o caso de o horário já ter acabado
      if (!r || (i === 0 && now.min >= r[1])) continue;
      // hour(min): minutos -> texto da hora no formato da língua (T.hour, ex.: "18h30")
      const hour = (min) => T.hour(Math.floor(min / 60), min % 60);
      return {
        open: i === 0 && now.min >= r[0],
        when: i === 0 ? T.today : i === 1 ? T.tomorrow : T.weekdaysLong[d.getUTCDay()],
        start: hour(r[0]), end: hour(r[1])
      };
    }
    return null;
  }

  // Frase para o ecrã de sucesso do orçamento: quando é o próximo horário de atendimento
  // nextPeriodText(): devolve essa frase (T.nextPeriod) ou "" se não houver período conhecido
  function nextPeriodText() {
    const n = nextOpen();
    return n ? T.nextPeriod(n.open, n.when, n.start, n.end) : '';
  }

  // "Aberto agora · até às 21h" no cartão "Ligar" (sem JavaScript fica só o horário escrito no cartão)
  // initOpenNow(): preenche todos os elementos com o atributo data-open-now (em contacto.html)
  function initOpenNow() {
    const els = $$('[data-open-now]');
    if (!els.length) return;
    // paint(): escreve "Aberto agora · até às …" ou "Fechado · abre …" e liga a classe is-open (ponto verde no CSS)
    const paint = () => {
      const n = nextOpen();
      if (!n) return;
      els.forEach((el) => {
        el.textContent = n.open ? T.openNow(n.end) : T.closedNow(n.when, n.start);
        el.classList.toggle('is-open', n.open);
      });
    };
    paint();
    // Atualiza a cada minuto, para o estado mudar sozinho se a página ficar aberta à hora de abrir/fechar
    setInterval(paint, 60000);
  }

  /**
   * initBooking(): liga o formulário de marcação de conversa (#bookingForm, em contacto.html).
   * Cria os dias disponíveis e as horas de cada dia, mantém o resumo do pedido, avisa sobre
   * o fuso horário, valida tudo e envia pelo FormSubmit (com plano B por WhatsApp/email se falhar).
   * Sem JavaScript fica a versão simples com data e hora nativas (.booking-fallback).
   */
  function initBooking() {
    const form = $('#bookingForm');
    if (!form) return;              // página sem agenda
    form.noValidate = true;       // com JavaScript mostramos as nossas mensagens, não os balões do navegador
    const daysBox = $('#days', form);             // onde o script põe os botões dos dias
    const slotsBox = $('#slots', form);           // onde ficam as horas do dia escolhido
    const emptyMsg = $('#slotsEmpty', form);      // "Escolhe primeiro um dia" / aviso de hora perdida
    const summary = $('#bookingSummary');         // cartão-resumo do pedido (ao lado, no computador)
    const recap = $('#bookingRecap');             // resumo curto junto ao botão (telemóvel)
    const waBtn = $('#bookingWa');                // alternativa: enviar o pedido pelo WhatsApp
    const status = $('#bookingStatus');           // mensagens de erro/estado junto ao botão (lidas pelos leitores de ecrã)
    const btn = $('.btn-submit', form);
    const tzNote = $('#tzNote', form);            // aviso de fuso horário diferente do de Lisboa
    // pick(n): o rádio escolhido no grupo n (formato, duracao, dia, hora), ou null
    const pick = (n) => $('input[name="' + n + '"]:checked', form);
    let sending = false;          // trava envios em duplicado
    let statusErr = false;        // a mensagem junto ao botão é um aviso de "falta responder"

    // Com JS, os campos de reserva (data/hora nativos) são desligados para não serem enviados
    $$('.booking-fallback input, .booking-fallback select', form).forEach((el) => { el.disabled = true; });

    // contacto.html?assunto=renovar#agenda abre com o assunto já escolhido (pela ordem das opções no HTML)
    const SUBJECTS = ['novo', 'renovar', 'marca', 'manutencao', 'duvidas', 'outro'];
    const subject = $('#b-assunto', form);
    // Lê ?assunto=... do URL e procura a posição na lista; -1 se não existir ou for inválido
    const wanted = SUBJECTS.indexOf(new URLSearchParams(location.search).get('assunto'));
    if (subject && wanted > -1 && subject.options[wanted]) subject.selectedIndex = wanted;

    // Fuso horário do visitante: segue no pedido e, se não for o de Lisboa, mostramos um aviso
    let zone = '';
    // Nome do fuso do visitante (ex.: "Europe/Paris"); try/catch para navegadores antigos sem Intl
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { zone = ''; }
    const fuso = $('#fusoInput', form);           // campo escondido enviado com o pedido
    if (fuso) fuso.value = zone;
    // minutos de diferença entre o relógio do visitante e o de Lisboa, numa certa data
    // tzDiff(date): escreve a mesma data "à moda de Lisboa" e "à moda do visitante" como se fossem
    // UTC e subtrai. Positivo = o visitante está adiantado em relação a Lisboa. A data conta
    // porque as mudanças de hora de verão não acontecem no mesmo dia em todos os países.
    function tzDiff(date) {
      const p = lisbonParts(date);
      const lis = Date.UTC(p.y, p.m - 1, p.d) + p.min * 60000;
      const loc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
      return Math.round((loc - lis) / 60000);
    }
    /**
     * updateTz(day, h): mostra ou esconde o aviso de fuso horário.
     * day e h são os rádios escolhidos (dia e hora) ou null. Se o visitante estiver noutro fuso,
     * diz que as horas são de Lisboa e, com dia e hora escolhidos, qual é a hora no relógio dele.
     */
    function updateTz(day, h) {
      if (!tzNote || !zone) return;
      // A diferença calcula-se no dia escolhido (meio-dia se ainda não há hora), ou agora
      const diff = tzDiff(day ? new Date(day.value + 'T' + (h ? h.value : '12:00') + ':00Z') : new Date());
      if (!diff) { tzNote.hidden = true; return; }        // mesmo fuso que Lisboa: sem aviso
      let local = '';
      if (day && h) {
        const t = toMin(h.value) + diff;                  // hora local em minutos (pode passar de 24h ou ser negativa)
        // Volta a pôr entre 0 e 1439 (1440 = minutos num dia); o "+ 1440" corrige os negativos,
        // porque em JS o resto de um número negativo também é negativo
        const m = ((t % 1440) + 1440) % 1440;
        // HH:MM com zeros à esquerda (pad), mais "dia seguinte"/"dia anterior" se mudar de dia
        local = pad(Math.floor(m / 60)) + ':' + pad(m % 60) + (t >= 1440 ? T.nextDay : t < 0 ? T.prevDay : '');
      }
      // textContent (e não innerHTML): o nome do fuso vem do navegador e é tratado só como texto
      tzNote.textContent = T.tzNote(zone, h ? h.value : '', local);
      tzNote.hidden = false;
    }

    // Dias: o "hoje" é o de Portugal. O primeiro dia é daqui a 2 dias (amanhã só se em Lisboa ainda for de manhã),
    // para dar tempo de confirmar. Saltam-se os dias sem horário e os da lista CLOSED.
    const now = lisbonParts(new Date());
    const base = Date.UTC(now.y, now.m - 1, now.d);
    let html = '';
    // i = dias a partir de hoje; shown = quantos dias já pusemos. Pára ao chegar a DAYS_AHEAD dias
    // ou, por segurança (ex.: lista CLOSED enorme), ao fim de 60 dias de calendário.
    for (let i = now.min < 12 * 60 ? 1 : 2, shown = 0; shown < DAYS_AHEAD && i < 60; i++) {
      const d = new Date(base + i * DAY_MS);
      const iso = d.toISOString().slice(0, 10);       // "AAAA-MM-DD", o valor enviado no pedido
      const dow = d.getUTCDay();
      if (!openRange(dow, iso)) continue;              // domingo, feriado ou férias
      shown++;
      // Texto completo do dia, ex.: "terça-feira, 20 out" (para o resumo e para os leitores de ecrã)
      const label = T.weekdaysLong[dow] + ', ' + d.getUTCDate() + ' ' + T.months[d.getUTCMonth()];
      // Cada dia é um rádio dentro de um <label> (clicável em toda a área). O aria-label dá o texto
      // completo e o desenho visual (dia abreviado, número, mês) fica escondido dos leitores de ecrã.
      // data-label e data-dow são lidos mais abaixo (resumo e horas desse dia da semana).
      html += '<label class="pick"><input type="radio" name="dia" value="' + iso + '" data-label="' + esc(label) + '" aria-label="' + esc(label) + '" data-dow="' + dow + '" required>' +
        '<span aria-hidden="true"><small>' + T.weekdays[dow] + '</small><b>' + d.getUTCDate() + '</b><small>' + T.months[d.getUTCMonth()] + '</small></span></label>';
    }
    daysBox.innerHTML = html;       // um só innerHTML no fim: mais rápido do que inserir dia a dia

    /**
     * renderSlots(): desenha as horas do dia escolhido (rádios name="hora").
     * Sem dia escolhido, esvazia a lista e mostra "escolhe primeiro um dia".
     * Mantém a hora já escolhida se ela também existir no novo dia.
     */
    function renderSlots() {
      const day = pick('dia');
      if (!day) { slotsBox.innerHTML = ''; emptyMsg.hidden = false; emptyMsg.textContent = T.pickDayFirst; return; }
      // As horas dependem do dia da semana (data-dow): à semana são à noite, ao sábado de manhã
      const hours = HOURS[day.dataset.dow] || [];
      // Hora escolhida antes de mudar de dia ("|| {}" evita erro se ainda não houver nenhuma)
      const prev = (pick('hora') || {}).value;
      // se a hora já escolhida não existe neste dia, avisa em vez de a apagar em silêncio
      const lost = !!prev && !hours.includes(prev);
      emptyMsg.hidden = !lost;
      if (lost) emptyMsg.textContent = T.slotsChanged;
      // Um rádio por hora; a que já estava escolhida volta marcada (checked)
      slotsBox.innerHTML = hours.map((h) =>
        '<label class="pick"><input type="radio" name="hora" value="' + h + '" required' + (h === prev ? ' checked' : '') + '><span><b>' + h + '</b></span></label>'
      ).join('');
    }

    // Pedido já escrito, para seguir por WhatsApp ou por email
    /**
     * bookingText(parts): monta a mensagem de texto do pedido.
     * parts = [formato, duração, dia, hora] (os que existirem). Devolve a saudação, uma linha
     * "formato · duração · dia · hora (hora de Lisboa)" e uma linha por cada campo preenchido
     * (nome, assunto, nota). Os campos vazios ficam de fora.
     */
    function bookingText(parts) {
      // val(sel): valor do campo sem espaços nas pontas, ou "" se o campo não existir
      const val = (sel) => { const el = $(sel, form); return el ? el.value.trim() : ''; };
      // Pares [rótulo, valor], com os rótulos na língua da página (T.f)
      const rows = [[T.f.nome, val('#b-nome')], [T.f.assunto, val('#b-assunto')], [T.f.nota, val('#b-nota')]];
      // "\n" = mudança de linha na mensagem
      return T.waBooking + '\n' + parts.join(' · ') + ' (' + T.lisbonTime + ')' +
        rows.filter((r) => r[1]).map((r) => '\n' + r[0] + ': ' + r[1]).join('');
    }

    /**
     * updateSummary(): junta as escolhas feitas (formato, duração, dia, hora) e atualiza tudo o que
     * depende delas: o campo escondido enviado no email, o cartão-resumo, o resumo do telemóvel,
     * o botão do WhatsApp e o aviso de fuso. Devolve o array das partes escolhidas (usado no envio).
     */
    function updateSummary() {
      const f = pick('formato'), d = pick('duracao'), day = pick('dia'), h = pick('hora');
      // "x && x.value" dá undefined se o grupo não tiver resposta; filter(Boolean) tira esses buracos
      const parts = [f && f.value, d && d.value, day && day.dataset.label, h && h.value].filter(Boolean);
      const text = parts.join(' · ');
      // Campo escondido "marcacao": o pedido chega-nos por email já numa só linha legível
      const hidden = $('#marcacaoInput', form);
      if (hidden) hidden.value = text;
      if (summary) {
        // Nada escolhido ainda: texto de ajuda. Senão, o pedido (escapado com esc) e o aviso
        // de que ainda vai ser confirmado por nós
        summary.innerHTML = !f && !day
          ? '<p>' + T.bookingEmpty + '</p>'
          : '<p>' + esc(text) + '</p><small>' + T.bookingPending + '</small>';
      }
      // No telemóvel o resumo repete-se junto ao botão, com o aviso de que é um pedido por confirmar
      if (recap) recap.textContent = parts.length ? text + ' · ' + T.bookingRecap : '';
      // Alternativa: o mesmo pedido pelo WhatsApp, quando já há formato, dia e hora
      if (waBtn) {
        const ready = !!(f && day && h);
        waBtn.hidden = !ready;
        // wa.me/<número>?text=<mensagem codificada>: abre o WhatsApp com o texto já escrito
        if (ready) waBtn.href = WA_URL + encodeURIComponent(bookingText(parts));
      }
      updateTz(day, h);
      return parts;
    }

    // Qualquer mudança no formulário (delegação de eventos: um só listener para todos os campos)
    form.addEventListener('change', (e) => {
      if (e.target.name === 'dia') renderSlots();           // novo dia -> novas horas
      if (e.target.name === 'hora') emptyMsg.hidden = true; // já escolheu hora: tira o aviso
      // O grupo (fieldset .bfs) onde a pessoa acabou de responder deixa de estar marcado com erro
      const fs = e.target.closest('.bfs');
      if (fs) fs.classList.remove('has-error');
      // Se o aviso junto ao botão era "falta responder", apaga-o (já não corresponde à verdade)
      if (statusErr) { status.textContent = ''; statusErr = false; }
      updateSummary();
    });

    // Validação ao sair de cada campo de texto (função comum aos formulários, definida mais acima)
    liveValidation(form);
    // O telemóvel passa a obrigatório quando o formato escolhido é WhatsApp ou chamada
    phoneRule(form, 'formato', ['whatsapp', 'phone']);

    /**
     * validate(): verifica o formulário inteiro antes de enviar.
     * Marca com "has-error" cada grupo de opções sem resposta, valida os campos de texto
     * e o consentimento (RGPD). Leva o foco ao primeiro problema e escreve a mensagem dele
     * junto ao botão. Devolve true se estiver tudo certo.
     */
    function validate() {
      let firstBad = null;          // primeiro elemento com problema (recebe o foco)
      let firstMsg = '';            // mensagem de erro desse elemento
      // textOf(sel, box): texto do elemento sel dentro de box, ou "" se não existir
      const textOf = (sel, box) => { const el = box && $(sel, box); return el ? el.textContent : ''; };
      // Grupos de rádios obrigatórios: cada fieldset diz em data-group o nome do seu grupo
      $$('.bfs[data-group]', form).forEach((fs) => {
        const has = !!pick(fs.dataset.group);
        fs.classList.toggle('has-error', !has);
        // Continua a marcar todos os grupos em falta, mas só guarda o primeiro
        if (has || firstBad) return;
        // o foco vai para a primeira opção do grupo em falta (ou para o grupo, se ainda não tiver opções)
        firstBad = $('input:not([disabled])', fs) || fs;
        firstMsg = textOf('.group-error', fs);
      });
      // Campos de texto: validateField() mostra o erro de cada um e devolve true se estiver válido.
      // Os desligados (versão sem JS) não contam.
      $$('.field input, .field textarea, .field select', form).forEach((inp) => {
        if (inp.disabled || validateField(inp) || firstBad) return;
        firstBad = inp;
        firstMsg = textOf('.error', inp.closest('.field'));
      });
      // Caixa de consentimento para tratarmos os dados (RGPD): obrigatória
      const consent = $('#bookingConsent', form);
      if (consent) {
        const cfs = consent.closest('.bfs');
        if (cfs) cfs.classList.toggle('has-error', !consent.checked);
        if (!consent.checked && !firstBad) { firstBad = consent; firstMsg = textOf('.group-error', cfs); }
      }
      if (firstBad) {
        // um só aviso para leitores de ecrã, junto ao botão (as mensagens de cada grupo ficam só à vista)
        status.textContent = firstMsg;
        statusErr = true;
        // Um fieldset normalmente não recebe foco: tabIndex = -1 deixa focá-lo por script
        // sem o pôr na ordem do Tab
        if (firstBad.matches('fieldset')) firstBad.tabIndex = -1;
        // Faz scroll até ao bloco inteiro (opções, dias, horas...) para se ver o contexto do erro
        bringIntoView(firstBad.closest('.options, .days, .slots, .consent, .field') || firstBad);
        // preventScroll: o scroll já foi feito acima; o foco não deve dar outro salto
        firstBad.focus({ preventScroll: true });
      }
      return !firstBad;
    }

    // Envio: em vez de mudar de página, enviamos por fetch (sendForm) e mostramos o ecrã de sucesso aqui
    form.addEventListener('submit', async (e) => {
      e.preventDefault();                                         // trava o envio normal do navegador
      if (sending) return;                                        // já há um envio a decorrer
      if (!validate()) return;
      // Honeypot anti-spam: campo escondido que as pessoas não veem; se vier preenchido, é um robô.
      // Saímos sem dizer nada para o robô não perceber que foi apanhado.
      const honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;                           // robô apanhado
      status.textContent = '';
      statusErr = false;
      sending = true;
      // Estado "a enviar": a classe mostra o indicador no botão e aria-busy avisa os leitores de ecrã
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      const parts = updateSummary();                              // garante que o campo "marcacao" está atualizado
      // Email que recebemos: sem campos vazios e com um assunto que se lê na caixa de entrada
      const data = {};
      new FormData(form).forEach((v, k) => { if (k !== '_honey' && String(v).trim()) data[k] = String(v).trim(); });
      // _subject é o assunto do email no FormSubmit: "Marcação · dia · hora · nome".
      // parts.slice(2) fica só com dia e hora; "data.nome || []" não junta nada se não houver nome.
      data._subject = [T.bookingSubject].concat(parts.slice(2), data.nome || []).join(' · ');
      const format = pick('formato');
      try {
        // sendForm (comum aos formulários) faz o pedido e lança erro se falhar ou demorar demais
        await sendForm(form, data);
        // Ecrã de sucesso: repete o pedido feito
        $('#bookingWhen').textContent = data.marcacao || '';
        // O 3.º passo do sucesso diz como vai ser a conversa no formato escolhido
        const how = $('#bookingHow');
        const text = format ? T.bookingHow[format.dataset.channel] : '';
        if (how && text) how.textContent = text;
        // Esconde as perguntas e os botões. hidden e display:none juntos são uma dupla garantia:
        // o estilo inline ganha a qualquer regra de CSS que dê display a estes blocos.
        $$('.bfs, .booking-actions', form).forEach((el) => { el.hidden = true; el.style.display = 'none'; });
        const ok = $('#bookingSuccess');
        ok.classList.add('is-visible');
        ok.scrollIntoView({ block: 'start', behavior: noMotion() ? 'auto' : 'smooth' });
        // Foco no ecrã de sucesso: o leitor de ecrã lê a confirmação e o Tab continua a partir daí.
        // "sending" fica true de propósito: o pedido já foi, não se pode enviar outra vez.
        ok.focus({ preventScroll: true });
      } catch (err) {
        // Falhou (sem rede, FormSubmit em baixo, tempo esgotado): liberta o botão para tentar de novo
        // e mostra o plano B, o pedido já escrito para enviar por WhatsApp ou email
        sending = false;
        showPlanB(status, bookingText(parts), data._subject);
      } finally {
        // Corra bem ou mal, o botão sai do estado "a enviar"
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
      }
    });

    // Estado inicial: mensagem "escolhe um dia" (ou horas, se o navegador repôs um dia) e resumo
    renderSlots();
    updateSummary();
  }
  // /fim de initBooking

  /* ---------- 12. TELEMÓVEL E EXTRAS ---------- */
  // Cartões que deslizam para o lado (só no telemóvel, via CSS). Por baixo de cada faixa o script cria
  // os botões "anterior" e "seguinte" e um ponto por cartão: assim também se usa com rato e com teclado.
  /**
   * initSwipe(): acrescenta controlos (anterior, seguinte, pontos) às faixas de cartões que deslizam
   * no telemóvel: formatos, canais de contacto, portfólio e valores. O deslizar em si é só CSS
   * (scroll horizontal com scroll-snap); o script só mostra em que cartão estamos e deixa saltar.
   */
  function initSwipe() {
    const tracks = $$('.formats-mini, .channels, .work, .values');
    if (!tracks.length) return;
    // 639px: o mesmo ponto de quebra do CSS abaixo do qual estas grelhas passam a faixas a deslizar
    const phone = window.matchMedia('(max-width: 639px)');
    // build(): cria os controlos de todas as faixas (só é chamado uma vez)
    const build = () => tracks.forEach((track) => {
      const items = Array.from(track.children);          // os cartões da faixa
      if (items.length < 2) return;                       // um só cartão: não há para onde deslizar
      const ctrl = document.createElement('div');
      ctrl.className = 'swipe-ctrl';
      // type="button" para não enviarem nenhum formulário; aria-label dá nome aos botões que só
      // têm um símbolo (‹ ›) e diz em cada ponto "Cartão i de n"
      ctrl.innerHTML =
        '<button type="button" class="swipe-btn swipe-prev" aria-label="' + T.swipePrev + '">‹</button>' +
        '<div class="swipe-dots">' +
        items.map((it, i) => '<button type="button" class="swipe-dot" aria-label="' + T.swipeCard(i + 1, items.length) + '"></button>').join('') +
        '</div>' +
        '<button type="button" class="swipe-btn swipe-next" aria-label="' + T.swipeNext + '">›</button>';
      track.after(ctrl);                                  // os controlos ficam logo a seguir à faixa
      const prev = $('.swipe-prev', ctrl);
      const next = $('.swipe-next', ctrl);
      const dots = $$('.swipe-dot', ctrl);
      const last = items.length - 1;
      const posOf = (i) => items[i].offsetLeft - items[0].offsetLeft;     // onde a faixa pára para mostrar o cartão i
      let current = -1;           // índice do cartão atual (-1 = ainda não calculado)
      let raf = null;             // pedido de requestAnimationFrame pendente (para não repetir contas)
      // update(): descobre qual o cartão mais perto da posição atual do scroll e atualiza
      // os pontos (aria-current) e os botões (desligados nas pontas)
      const update = () => {
        raf = null;
        const left = track.scrollLeft;
        let best = 0, dist = Infinity;
        // Procura o cartão cuja posição de paragem está mais perto do scroll atual
        items.forEach((it, i) => {
          const d = Math.abs(posOf(i) - left);
          if (d < dist) { dist = d; best = i; }
        });
        // no fim da faixa, o cartão atual é o último
        // (o último cartão às vezes não consegue chegar à esquerda; 4px de folga para arredondamentos)
        if (left > 0 && left + track.clientWidth >= track.scrollWidth - 4) best = last;
        if (best === current) return;                     // nada mudou: não mexe no DOM
        current = best;
        // aria-current="true" diz aos leitores de ecrã qual o ponto do cartão visível (o CSS destaca-o)
        dots.forEach((d, i) => { if (i === best) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        prev.disabled = best === 0;
        next.disabled = best === last;
      };
      // go(i): desliza a faixa até ao cartão i (limitado entre o primeiro e o último), suave
      // ou instantâneo conforme a preferência de movimento
      const go = (i) => track.scrollTo({ left: posOf(Math.max(0, Math.min(last, i))), behavior: noMotion() ? 'auto' : 'smooth' });
      prev.addEventListener('click', () => go(current - 1));
      next.addEventListener('click', () => go(current + 1));
      dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
      // Com o teclado: o cartão que recebe o foco desliza para dentro do ecrã
      track.addEventListener('focusin', (e) => {
        if (!phone.matches) return;
        const i = items.findIndex((it) => it.contains(e.target));
        if (i >= 0) go(i);
      });
      // O evento scroll dispara muitas vezes por segundo: requestAnimationFrame junta-as numa só conta
      // por imagem desenhada. passive: true diz ao navegador que não vamos bloquear o scroll (mais fluido).
      track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
      update();                   // estado inicial: primeiro cartão, botão "anterior" desligado
    });
    // Em ecrãs largos não há faixas a deslizar: os controlos só são criados se a janela ficar estreita
    if (phone.matches) { build(); return; }
    // later(): ao mudar o tamanho da janela, cria os controlos só se ainda não existirem
    // (confirma pela primeira faixa) e se o ecrã tiver passado a estreito
    const later = () => { if (tracks[0].nextElementSibling && tracks[0].nextElementSibling.classList.contains('swipe-ctrl')) return; if (phone.matches) build(); };
    // onMedia: escuta as mudanças da media query (com recurso para navegadores antigos)
    onMedia(phone, later);
  }
  // /fim de initSwipe

  // Atalhos "Nesta página" (no telemóvel são uma linha que desliza): o link que recebe o foco vem para dentro do ecrã
  $$('.jump').forEach((jump) => {
    // focusin (ao contrário de focus) sobe pelos elementos pais, por isso um listener na barra chega.
    // "nearest" só mexe o mínimo necessário, sem fazer saltar a página na vertical.
    jump.addEventListener('focusin', (e) => e.target.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
  });

  // Enquanto se escreve num campo, a barra de ações de baixo esconde-se (não tapa o teclado)
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    // Conta como "a escrever" só os campos que abrem o teclado do telemóvel: rádios, caixas,
    // sliders e ficheiros ficam de fora. "!!el.matches" protege contra alvos sem matches (ex.: document).
    const typing = !!el.matches && el.matches('input:not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="file"]), textarea, select');
    // A classe vai para <html> (root); o CSS esconde a barra .mbar enquanto ela existir
    root.classList.toggle('is-typing', typing);
  });
  // Ao sair do campo a barra volta; se o foco passar para outro campo, o focusin seguinte volta a pô-la
  document.addEventListener('focusout', () => root.classList.remove('is-typing'));

  // "Ligar" que sabe as horas: os links de chamada do menu e da barra do telemóvel dizem
  // (no título, lido também pelos leitores de ecrã) se estamos a atender agora ou quando abrimos.
  // initCallState(): encontra os links tel: da barra do telemóvel (.mbar) e do menu (.menu-quick)
  function initCallState() {
    // [href^="tel:"] = links cujo endereço começa por "tel:" (os que fazem uma chamada)
    const links = $$('.mbar a[href^="tel:"], .menu-quick a[href^="tel:"]');
    if (!links.length) return;
    // paint(): mesma informação do cartão "Ligar" (nextOpen), aqui no title e na classe call-open
    const paint = () => {
      const n = nextOpen();
      if (!n) return;
      links.forEach((a) => {
        a.classList.toggle('call-open', n.open);
        a.title = n.open ? T.openNow(n.end) : T.closedNow(n.when, n.start);
      });
    };
    paint();
    setInterval(paint, 60000);    // revê o estado a cada minuto
  }

  // Aviso discreto para quem tem o navegador noutra língua: "Also available in English"
  // (e "Também disponível em português" nas páginas inglesas). Só aparece na página por onde
  // a pessoa entra no site; fechá-lo fica guardado neste dispositivo. É uma faixa por baixo do cabeçalho
  // que desliza com a página (o CSS abre-lhe espaço com a classe "has-lang-note"): nunca tapa nada.
  // initLangNote(): decide se mostra o aviso e, se sim, cria-o (link para a outra língua + botão fechar)
  function initLangNote() {
    const other = $('.lang-switch');                      // botão PT/EN do cabeçalho: tem o link da outra versão
    const browser = (navigator.language || '').toLowerCase();   // língua do navegador, ex.: "pt-pt", "en-gb"
    // store = localStorage protegido por try/catch (definido no início): se já o fechou, não volta a aparecer
    if (!other || !browser || store.get('pronex-aviso-lingua')) return;
    // Página PT e navegador noutra língua -> sugere inglês; página EN e navegador em português -> sugere PT
    const wanted = LANG === 'pt' ? !browser.startsWith('pt') : browser.startsWith('pt');
    const inside = document.referrer.indexOf(location.origin + '/') === 0;     // já vinha de outra página do site
    if (!wanted || inside) return;
    // Os elementos são criados com createElement/textContent (sem innerHTML): mais seguro e simples
    const note = document.createElement('div');
    note.className = 'lang-note';
    // É uma zona própria da página (role=region) com nome, para os leitores de ecrã a encontrarem
    note.setAttribute('role', 'region');
    note.setAttribute('aria-label', T.langNote.text);
    // O aviso está escrito na outra língua: lang certo para o leitor de ecrã o pronunciar bem
    note.lang = T.langNote.lang;
    const link = document.createElement('a');
    // getAttribute devolve o href tal como está no HTML (relativo), igual ao do botão PT/EN
    link.href = other.getAttribute('href');
    link.textContent = T.langNote.text;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'lang-note-close';
    // O botão só mostra "×": o aria-label dá-lhe um nome legível ("Close"/"Fechar")
    close.setAttribute('aria-label', T.langNote.close);
    close.textContent = '×';
    close.addEventListener('click', () => {
      // Guarda a escolha neste dispositivo (localStorage) para não voltar a mostrar o aviso
      store.set('pronex-aviso-lingua', 'fechado');
      note.remove();
      document.body.classList.remove('has-lang-note');    // o CSS deixa de reservar espaço
    });
    note.append(link, close);
    const main = $('main');
    if (!main) return;                                    // página sem <main>: não sabemos onde o pôr
    main.before(note);                                  // no HTML fica entre o cabeçalho e o conteúdo, como no ecrã
    document.body.classList.add('has-lang-note');
  }

  // Telemóvel: quem chega ao orçamento por um link com o formato já escolhido começa na faixa "Preparámos o orçamento…",
  // com a pergunta e as opções logo à vista (o título da página fica acima, a um gesto de distância).
  // Corre depois do aviso de língua, que faz descer o conteúdo.
  // initPresetStart(): só atua se a faixa #presetNote estiver visível (o formulário de orçamento
  // mostra-a quando o link trouxe ?tipo=...), se o URL não tiver âncora (#...) que mande para outro sítio,
  // se a pessoa ainda estiver no topo (não mexemos num scroll que ela já fez) e se for telemóvel.
  function initPresetStart() {
    const preset = $('#presetNote');
    if (!preset || preset.hidden || location.hash || window.scrollY > 1 || !window.matchMedia('(max-width: 639px)').matches) return;
    // Desliga por instantes o scroll suave do CSS (scroll-behavior em <html>) para o salto ser
    // imediato, sem animação a abrir a página; depois repõe o valor do CSS
    root.style.scrollBehavior = 'auto';
    preset.scrollIntoView();
    root.style.scrollBehavior = '';
  }

  // Os formulários arrancam primeiro. Se algum falhar, o script pára aqui, "PRONEX_OK" não chega
  // a ser definido e o <head> volta a mostrar a página como se não houvesse JavaScript.
  initQuoteForm();                // orçamento multi-passo (secção 09)
  initFinder();                   // questionário "Não sei o que preciso" (secção 10)
  initBooking();                  // agenda de conversas (secção 11)
  // Os extras não são essenciais: se um falhar, o resto do site continua a funcionar
  // Cada um corre no seu próprio try/catch, por esta ordem (initPresetStart tem de vir depois de initLangNote)
  [initOpenNow, initSwipe, initCallState, initLangNote, initPresetStart].forEach((fn) => {
    try { fn(); } catch (e) { /* segue sem este extra */ }
  });

  // Sinal para o pequeno script inline do <head>: no DOMContentLoaded, se PRONEX_OK não existir,
  // ele tira a classe "js" do <html> e o CSS volta à versão sem JavaScript (nada fica escondido)
  window.PRONEX_OK = true;       // o script chegou ao fim sem erros (o <head> confirma isto)
})();
// /fim da IIFE: a função anónima que envolve todo o script (as variáveis não ficam globais) e corre já
