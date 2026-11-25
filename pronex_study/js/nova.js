/* Pronex_Study · Nova (1.31) — o Início reorganizado.
   Um título que diz o que falta hoje, um cartão principal com o próximo passo, o trilho à volta desse passo
   e três números. O resto do Início (missões, treino, disciplinas, ferramentas) mantém-se por baixo. */
(function () {
  'use strict';
  /* 1.34: na Turma, a caixa de escrever ficava por baixo da barra de navegação no telemóvel.
     A altura da conversa passa a ser medida: do topo da conversa até à barra, menos uma margem. */
  function fitChat() {
    try {
      if (view !== 'comm' || innerWidth > 760) return;
      const c = document.querySelector('#v-comm .chat:not(.nxchat)'); if (!c) return;
      const tb = document.getElementById('tabbar'), fim = tb && tb.offsetHeight ? tb.getBoundingClientRect().top : innerHeight;
      c.style.height = Math.max(300, Math.round(fim - (c.getBoundingClientRect().top + scrollY) - 12)) + 'px';
    } catch (e) { }
  }
  if (typeof renderComm === 'function') { const _rc = renderComm; renderComm = function () { const r = _rc.apply(this, arguments); fitChat(); setTimeout(fitChat, 60); return r; }; }
  addEventListener('resize', fitChat);
  /* 1.35: o botão do Nex encolhe enquanto se desliza para baixo (deixa de tapar os cartões) e volta ao parar */
  let ultY = 0, tRol = 0;
  addEventListener('scroll', () => {
    const y = scrollY, desce = y > ultY + 4 && y > 80; ultY = y;
    if (desce) document.body.classList.add('nxrolar');
    clearTimeout(tRol); tRol = setTimeout(() => document.body.classList.remove('nxrolar'), 700);
  }, { passive: true });
  /* 1.35: sem rede, os envios que precisam do servidor ficam por fazer e o texto escrito não se perde */
  const PRECISA_REDE = ['composer', 'pcomp', 'pform', 'x12-gf', 'x12-gjf', 'x12-rf', 'acc-f'];
  document.addEventListener('submit', e => {
    const f = e.target; if (!f || !PRECISA_REDE.includes(f.id) || navigator.onLine !== false) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { toast('Sem ligação: o que escreveste fica aqui. Envia quando a internet voltar.'); } catch (x) { }
  }, true);
  /* 1.36: ações declaradas no HTML com data-*, sem onclick no meio do HTML (a política de segurança da página bloqueia-os) */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-foco],[data-recarregar],[data-ir]'); if (!b) return;
    if (b.hasAttribute('data-foco')) { const el = document.getElementById(b.dataset.foco); if (el) el.focus(); }
    else if (b.hasAttribute('data-recarregar')) location.reload();
    else if (b.dataset.ir) { try { go(b.dataset.ir); } catch (x) { } }
  });
  /* 1.37: folhas que abrem por cima (.x11sh, .x8sheet, .nsheet) passam a ser janelas modais a sério:
     o resto da app fica inerte (o leitor de ecrã e a tecla Tab não saem da folha), o foco entra na folha
     e, ao fechar, volta ao botão que a abriu. O aviso (#toast) fica de fora para continuar a ser lido. */
  const DLG = '.x11sh,.x8sheet,.nsheet', FORA = '.x8sheet-bg,.x11sh-bg,.sheet-bg,#toast,script,style,link,[aria-live]';
  let focoAntes = null, ultimoFora = null, inertes = [];
  document.addEventListener('focusin', e => { if (e.target && e.target.closest && !e.target.closest(DLG)) ultimoFora = e.target; }, true);
  // se o ecrã foi redesenhado enquanto a folha estava aberta, procura o botão equivalente
  const igual = el => { if (!el) return null; if (el.isConnected) return el; for (const a of ['id', 'data-nv', 'data-xd', 'data-n', 'data-tab', 'aria-label']) { const v = el.getAttribute && el.getAttribute(a); if (v) { const n = document.querySelector('[' + a + '="' + CSS.escape(v) + '"]'); if (n) return n; } } return null; };
  function modais() {
    const ds = [...document.body.children].filter(e => e.matches(DLG));
    if (ds.length) {
      const d = ds[ds.length - 1];
      if (!d.hasAttribute('aria-modal')) d.setAttribute('aria-modal', 'true');
      if (!inertes.length) focoAntes = ultimoFora || document.activeElement;
      [...document.body.children].forEach(e => { if (e.matches(DLG) || e.matches(FORA) || e.inert) return; e.inert = true; inertes.push(e); });
      ds.slice(0, -1).forEach(e => { if (!e.inert) { e.inert = true; inertes.push(e); } });
      d.inert = false; inertes = inertes.filter(e => e !== d);
      if (!d.contains(document.activeElement)) { if (!d.hasAttribute('tabindex')) d.tabIndex = -1; try { d.focus({ preventScroll: true }); } catch (x) { } }
    } else if (inertes.length) {
      inertes.forEach(e => { e.inert = false; }); inertes = [];
      const alvo = focoAntes; focoAntes = null;
      // durante 1,5 s, se o ecrã for redesenhado e o foco cair para o corpo da página, volta ao botão equivalente
      let dono = null;
      const volta = (n) => { const a = document.activeElement; if (a && a !== document.body && a !== dono) return; if (!a || a === document.body) { const f = igual(alvo); if (f && f !== document.body) { try { f.focus({ preventScroll: true }); dono = f; } catch (x) { } } } if (n < 15) setTimeout(() => volta(n + 1), 100); };
      volta(0);
    }
  }
  new MutationObserver(modais).observe(document.body, { childList: true });
  /* 1.36: durante um exercício, as conquistas e as missões esperam pelo fim da sessão.
     Um aviso por cima da correção tapava a explicação no momento em que o aluno a está a ler. */
  if (typeof toast === 'function') {
    const _toast = toast, fila = []; let tFila = 0;
    const aMeio = () => !!document.querySelector('.xdcard') || (typeof view !== 'undefined' && view === 'play' && !!document.querySelector('#v-play .opt'));
    const solta = () => { if (aMeio()) { tFila = setTimeout(solta, 1500); return; } tFila = 0; const m = fila.shift(); if (m) { _toast(m); if (fila.length) tFila = setTimeout(solta, 3200); } };
    toast = function (m) {
      if (/^(Conquista ganha|Missão cumprida)/.test(String(m)) && aMeio()) { if (!fila.includes(m)) fila.push(m); if (!tFila) tFila = setTimeout(solta, 1500); return; }
      return _toast.apply(this, arguments);
    };
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const FACETS = '<svg class="nvf" aria-hidden="true" viewBox="0 0 350 210" preserveAspectRatio="none"><polygon points="0,0 150,0 90,110 0,80" fill="#2E7FE0"/><polygon points="150,0 350,0 350,60 230,90" fill="#3B5BEA"/><polygon points="150,0 230,90 90,110" fill="#3A6BEA"/><polygon points="350,60 350,210 250,210 230,90" fill="#7A48E8"/><polygon points="230,90 250,210 120,210 90,110" fill="#5A4CE6"/><polygon points="0,80 90,110 120,210 0,210" fill="#3550DA"/><polyline points="150,0 230,90 250,210" fill="none" stroke="#fff" stroke-opacity=".22"/><polyline points="0,80 90,110 230,90 350,60" fill="none" stroke="#fff" stroke-opacity=".18"/></svg>';
  function ring(n, goal) {
    const p = Math.max(0, Math.min(1, goal ? n / goal : 0)), c = 188.5, d = (p * c).toFixed(1);
    return '<svg class="nvring" role="img" aria-label="' + n + ' de ' + goal + ' exercícios feitos hoje" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="7"/>' +
      (p > 0 ? '<circle cx="36" cy="36" r="30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + d + ' ' + c + '" transform="rotate(-90 36 36)"/>' : '') +
      '<text x="36" y="41" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="' + (String(n).length + String(goal).length > 4 ? 14 : 17) + '" fill="#fff">' + n + '/' + goal + '</text></svg>';
  }
  // A última matéria em que o aluno trabalhou; sem histórico, a primeira que escolheu no arranque.
  function ultima() {
    let best = null;
    try { (typeof allItems === 'function' ? allItems() : []).forEach(i => { if (i && (!best || (i.ts || 0) > (best.ts || 0))) best = i; }); } catch (e) { }
    if (best) { const m = /^d:([^:]+):/.exec(best.k || ''); return m ? m[1] : 'mat'; }
    try { const E = typeof estudoGet === 'function' ? estudoGet() : null, D = window.XD ? XD.DISC : []; const d = E && (E.disc || []).find(x => D.some(y => y.id === x)); if (d) return d; if (E && (E.disc || []).length) return 'mat'; } catch (e) { }
    return null;
  }
  function hero(el, o) {
    el.style.setProperty('--xd', o.cor || '#6F4FF2');
    el.innerHTML = FACETS + '<div class="nvhr"><div><span class="nve">' + esc(o.eyebrow) + '</span><b class="nvt">' + esc(o.title) + '</b>' + (o.sub ? '<span class="nvs">' + esc(o.sub) + '</span>' : '') + '</div>' + o.ring + '</div><button class="nvgo" type="button">' + esc(o.cta) + '</button>';
    el.querySelector('.nvgo').onclick = o.go;
  }
  function build(H) {
    H.classList.add('nvhome');
    const left = H.querySelector('.x15left') || H; let S = { today: 0, streak: 0 }, goal = 15, wxp = 0, liga = 'Bronze';
    try { S = stats(); goal = (ME && ME.goal) || 15; wxp = weekXP(); liga = tierOf(wxp).name; } catch (e) { }
    const falta = Math.max(0, goal - S.today), R = ring(S.today, goal);
    const h1 = document.createElement('h2'); h1.className = 'nvh1';
    h1.textContent = falta === 0 ? 'Objetivo de hoje cumprido' : S.today ? (falta === 1 ? 'Falta 1 exercício para fechares o dia' : 'Faltam ' + falta + ' exercícios para fechares o dia') : 'Hoje são ' + goal + ' exercícios. Começa pelo primeiro';
    const hi = H.querySelector('h1.hi'); if (hi) hi.after(h1); else H.prepend(h1);
    const he = document.createElement('section'); he.className = 'nvhero';
    const tr = document.createElement('div');
    const stt = document.createElement('div'); stt.className = 'nvstats'; let moedas = 0; try { moedas = X12.coins() | 0; } catch (e) { }
    stt.innerHTML = '<button class="nvstat" type="button" data-nv="perfil"><b>' + pl(S.streak | 0, 'dia', 'dias') + '</b><span>' + ((S.streak | 0) === 1 ? 'seguido' : 'seguidos') + '</span></button>' +
      '<button class="nvstat" type="button" data-nv="pontos" aria-label="' + (wxp | 0) + ' XP na semana: como se ganham os pontos"><b>' + (wxp | 0) + ' XP</b> <span>na semana</span></button>' +
      '<button class="nvstat" type="button" data-nv="rank"><b>' + esc(liga) + '</b><span>a tua liga</span></button>' +
      '<button class="nvstat" type="button" data-nv="loja" aria-label="' + moedas + ' moedas: abrir a loja"><b>' + moedas + '</b> <span>moedas</span></button>';
    stt.querySelectorAll('[data-nv]').forEach(b => b.onclick = () => { try { if (b.dataset.nv === 'rank') { commTab = 'rank'; go('comm'); } else if (b.dataset.nv === 'pontos' && typeof X16 !== 'undefined' && X16.points) X16.points(); else if (b.dataset.nv === 'loja') X12.shop(); else go('profile'); } catch (e) { } });
    left.prepend(he, tr, stt);
    const escolher = () => { const b = document.getElementById('h8-go'); if (b) b.click(); else try { go('study'); } catch (e) { } };
    const id = ultima();
    if (!id) { H.classList.add('nvsem'); hero(he, { eyebrow: 'Para começar', title: 'Escolhe o que queres estudar', sub: 'Há ' + (1 + (window.XD && XD.DISC ? XD.DISC.length : 9)) + ' disciplinas, do 10.º ao 12.º ano.', ring: R, cta: 'Escolher disciplina', go: escolher }); return; }
    if (id === 'mat' || !window.XD) { hero(he, { eyebrow: 'Continuar · Matemática', title: 'Treino de Matemática', sub: 'Exercícios do teu módulo, do mais fácil ao mais difícil.', ring: R, cta: 'Continuar a estudar', go: () => { try { modTab = 'ex'; go('module'); } catch (e) { escolher(); } } }); return; }
    const D = XD.DISC.find(d => d.id === id) || {};
    hero(he, { cor: D.cor, eyebrow: 'Continuar · ' + (D.n || ''), title: 'A abrir o teu trilho', sub: '', ring: R, cta: 'Continuar a estudar', go: () => XD.open(id) });
    XD.resumo(id).then(r => {
      if (!r || !he.isConnected) return; const nx = r.next;
      // 1.36: memória — conceitos dominados que estão a desvanecer pedem uma revisão curta e misturada
      if (r.fade && !H.querySelector('.nvmem')) { const mb = document.createElement('button'); mb.type = 'button'; mb.className = 'nvmem'; mb.style.setProperty('--xd', r.cor);
        mb.innerHTML = '<i aria-hidden="true"></i><span><b>' + pl(r.fade, 'conceito', 'conceitos') + ' de ' + esc(r.nome) + ' a desvanecer</b><small>Revê ' + Math.min(10, r.fade * 2) + ' exercícios misturados para não esqueceres</small></span>';
        mb.onclick = () => XD.memoria(id); he.after(mb); }
      if (!nx) { hero(he, { cor: r.cor, eyebrow: r.nome + ' · ' + r.pct + '% dominado', title: 'Dominaste tudo neste ano', sub: 'Faz um teste ou passa a outro ano.', ring: R, cta: 'Abrir ' + r.nome, go: () => XD.open(id) }); return; }
      hero(he, { cor: r.cor, eyebrow: (nx.feitos || r.done ? 'Continuar' : 'Começar') + ' · ' + r.nome, title: nx.lab, sub: (nx.tema ? nx.tema + ' · ' : '') + pl(nx.n, 'exercício', 'exercícios'), ring: R, cta: nx.feitos || r.done ? 'Continuar a estudar' : 'Começar a estudar', go: () => XD.irPara(id, nx.id) });
      if (!r.mapa || !window.CR) return;
      const node = (nd, cls, tag) => nd ? '<span class="nvn ' + cls + '">' + (tag ? '<small>' + tag + '</small>' : '') + '<i style="--crg:' + CR.hexFacets(nd.id, r.cor, cls === 'cur' ? 'prog' : nd.done ? 'done' : 'new').replace(/"/g, "'") + '"></i><em>' + esc(nd.lab) + '</em></span>' : '<span class="nvn"></span>';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nvtrail'; b.style.setProperty('--xd', r.cor);
      b.setAttribute('aria-label', 'Abrir o trilho de ' + r.nome + ': ' + r.done + ' de ' + r.total + ' conceitos dominados');
      b.innerHTML = node(r.prev, r.prev && r.prev.done ? 'done' : '', '') + node(nx, 'cur', 'A seguir') + node(r.after, '', '');
      b.onclick = () => XD.open(id); tr.replaceWith(b);
    });
  }
  /* 1.47: ordem fixa do Início. Primeiro o cumprimento e o título; depois a revisão de hoje; depois «O que estudas?»
     numa linha que abre; o resto como estava; o convite para instalar vai para o fim. O plano do Nex não aparece
     quando só repete a revisão de hoje. Só mexe no que estiver fora do sítio, para não entrar em ciclo com o observador. */
  function arrumar(H) {
    const v = document.getElementById('v-home'); if (!v || !H) return;
    const antes = (pai, no, ref) => { if (no && no !== ref && no.nextElementSibling !== ref) pai.insertBefore(no, ref); };
    const depois = (no, ref) => { if (no && ref && ref.nextElementSibling !== no) ref.after(no); };
    if (v.firstElementChild !== H) v.prepend(H);
    const hi = H.querySelector(':scope > h1.hi'), h1 = H.querySelector(':scope > .nvh1');
    if (hi && H.firstElementChild !== hi) H.prepend(hi);
    if (hi && h1) depois(h1, hi);
    let ult = h1 || hi; if (!ult) return;
    const rev = v.querySelector('#xd-today'); if (rev) { rev.classList.add('full'); depois(rev, ult); ult = rev; }
    const est = v.querySelector('#x25-est');
    if (est) {
      est.classList.add('full');
      if (!est.dataset.nv) { est.dataset.nv = '1'; const E = typeof X25E !== 'undefined' ? X25E : { aberto: false }; est.classList.toggle('nvfechado', !E.aberto);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'nvestb'; b.setAttribute('aria-expanded', String(!!E.aberto));
        b.innerHTML = '<span><b>Diz-nos o teu ano e as tuas disciplinas</b><small>O Study passa a abrir logo na tua matéria</small></span><i aria-hidden="true">Escolher</i>';
        b.onclick = () => { const f = est.classList.toggle('nvfechado'); b.setAttribute('aria-expanded', String(!f)); E.aberto = !f; };
        est.prepend(b); }
      depois(est, ult); ult = est;
    }
    const msg = H.querySelector(':scope .x11msg:not(.night)');
    if (msg) msg.hidden = !!rev && /rever|revis/i.test(msg.textContent);
    const inst = v.querySelector(':scope > .instcard'), conv = v.querySelector(':scope > #x20-inv-h');
    if (inst) { if (conv) antes(v, inst, conv); else if (v.lastElementChild !== inst) v.append(inst); }
  }
  function check() { const H = document.querySelector('#v-home .x8home'); if (!H) return; if (!H.classList.contains('nvhome')) { try { build(H); } catch (e) { } } try { arrumar(H); } catch (e) { } }
  /* 1.47: sem esperar pelo fotograma seguinte. O Início redesenha-se quando chegam dados da conta, e esse
     fotograma de espera mostrava a página a meio (era parte do «piscar»). */
  function start() { const v = document.getElementById('v-home'); if (!v) return; new MutationObserver(check).observe(v, { childList: true, subtree: true }); check(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
