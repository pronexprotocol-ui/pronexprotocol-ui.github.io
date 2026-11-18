/* Pronex_Study · Nova (1.31) — o Início reorganizado.
   Um título que diz o que falta hoje, um cartão principal com o próximo passo, o trilho à volta desse passo
   e três números. O resto do Início (missões, treino, disciplinas, ferramentas) mantém-se por baixo. */
(function () {
  'use strict';
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
    const stt = document.createElement('div'); stt.className = 'nvstats';
    stt.innerHTML = '<button class="nvstat" type="button" data-nv="perfil"><b>' + pl(S.streak | 0, 'dia', 'dias') + '</b><span>' + ((S.streak | 0) === 1 ? 'seguido' : 'seguidos') + '</span></button>' +
      '<button class="nvstat" type="button" data-nv="rank"><b>' + (wxp | 0) + ' XP</b><span>esta semana</span></button>' +
      '<button class="nvstat" type="button" data-nv="rank"><b>' + esc(liga) + '</b><span>a tua liga</span></button>';
    stt.querySelectorAll('[data-nv]').forEach(b => b.onclick = () => { try { if (b.dataset.nv === 'rank') { commTab = 'rank'; go('comm'); } else go('profile'); } catch (e) { } });
    left.prepend(he, tr, stt);
    const escolher = () => { const b = document.getElementById('h8-go'); if (b) b.click(); else try { go('study'); } catch (e) { } };
    const id = ultima();
    if (!id) { H.classList.add('nvsem'); hero(he, { eyebrow: 'Para começar', title: 'Escolhe o que queres estudar', sub: 'Há 8 disciplinas, do 10.º ao 12.º ano.', ring: R, cta: 'Escolher disciplina', go: escolher }); return; }
    if (id === 'mat' || !window.XD) { hero(he, { eyebrow: 'Continuar · Matemática', title: 'Treino de Matemática', sub: 'Exercícios do teu módulo, do mais fácil ao mais difícil.', ring: R, cta: 'Continuar a estudar', go: () => { try { modTab = 'ex'; go('module'); } catch (e) { escolher(); } } }); return; }
    const D = XD.DISC.find(d => d.id === id) || {};
    hero(he, { cor: D.cor, eyebrow: 'Continuar · ' + (D.n || ''), title: 'A abrir o teu trilho', sub: '', ring: R, cta: 'Continuar a estudar', go: () => XD.open(id) });
    XD.resumo(id).then(r => {
      if (!r || !he.isConnected) return; const nx = r.next;
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
  let pend = 0;
  function check() { pend = 0; const H = document.querySelector('#v-home .x8home'); if (H && !H.classList.contains('nvhome')) { try { build(H); } catch (e) { } } }
  function start() { const v = document.getElementById('v-home'); if (!v) return; new MutationObserver(() => { if (!pend) pend = requestAnimationFrame(check); }).observe(v, { childList: true, subtree: true }); check(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
