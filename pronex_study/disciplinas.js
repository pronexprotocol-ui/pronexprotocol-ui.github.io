/* Pronex_Study · disciplinas novas (1.22)
   Filosofia, Português, Inglês, Desenho A, Teologia, Modelação 3D e Python.
   O conteúdo vem dos manuais e está em disc/<id>.json (formato em .github/pronex/CONTEUDO.md).
   Cada resposta entra no histórico do dia (HIST) como as de Matemática: dá XP, conta para a sequência,
   para as missões, para o ranking e sincroniza entre dispositivos. A chave do exercício é d:<disc>:<id>.

   Tipos de exercício:
   mc / vf    escolha múltipla e verdadeiro/falso
   escrita    resposta por escrito, corrigida por critérios (ideias-chave com sinónimos): está certa quando
              chega ao objetivo da pergunta, seja qual for a forma de escrever
   texto      excerto + perguntas de interpretação
   codigo     Python a correr no próprio dispositivo (Pyodide), verificado com testes
   desenho    desenhar no ecrã ou fotografar o desenho em papel + autoavaliação + perguntas de verificação
   tarefa3d   fazer no Blender, enviar captura de ecrã + autoavaliação + perguntas de verificação
   As imagens (desenhos e capturas) ficam só no dispositivo. */
(() => {
  'use strict';
  const DISC = [
    { id: 'filosofia', n: 'Filosofia', ic: 'owl', cor: '#B3A2FF', d: 'Perguntas de resposta escrita e escolha múltipla' },
    { id: 'portugues', n: 'Português', ic: 'book', cor: '#FF7A3D', d: 'Gramática, interpretação de texto e escrita' },
    { id: 'ingles', n: 'Inglês', ic: 'globe', cor: '#FFC93C', d: 'Reading, grammar, vocabulary and writing' },
    { id: 'desenho', n: 'Desenho A', ic: 'pen', cor: '#E879C0', d: 'Teoria ao estilo do exame e desenho' },
    { id: 'teologia', n: 'Teologia', ic: 'book', cor: '#7FE7FF', d: 'Escolha múltipla e resposta escrita' },
    { id: 'modelacao3d', n: 'Modelação 3D', ic: 'cube', cor: '#2DD4A0', d: 'Blender: teoria e tarefas práticas com captura' },
    { id: 'python', n: 'Python', ic: 'code', cor: '#4F8CFF', d: 'Escreve código e vê-o a correr aqui' }
  ];
  const L = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const T = m => { try { toast(m); } catch (e) { } };
  const CACHE = {};
  let S = { disc: null, mod: null, sess: null }; // estado da vista

  /* ---------- ícones ---------- */
  if (typeof IC !== 'undefined') {
    IC.cube = IC.cube || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/></svg>';
    IC.owl = IC.owl || IC.book; IC.pen = IC.pen || IC.book; IC.globe = IC.globe || IC.book; IC.code = IC.code || IC.book;
  }
  const ico = k => (typeof IC !== 'undefined' && IC[k]) || '';

  /* ---------- conteúdo ---------- */
  function load(id) {
    if (CACHE[id]) return Promise.resolve(CACHE[id]);
    return fetch('disc/' + id + '.json').then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(j => { j.mods = j.modulos || []; j.byId = {}; j.mods.forEach(m => (m.itens || []).forEach(it => { it._m = m.id; j.byId[it.id] = it; (it.perguntas || []).forEach((q, k) => { q.id = q.id || (it.id + '-' + (k + 1)); q._m = m.id; q._pai = it.id; }); })); CACHE[id] = j; return j; });
  }
  // Os itens "texto" desdobram-se: o excerto aparece com cada pergunta.
  function flat(it) { return it.tipo === 'texto' ? (it.perguntas || []).map(q => Object.assign({}, q, { _excerto: it.excerto, _titulo: it.enunciado })) : [it]; }
  const allOf = j => j.mods.flatMap(m => (m.itens || []).flatMap(flat));
  const modItems = (j, m) => (m.itens || []).flatMap(flat);

  /* ---------- progresso a partir do histórico (igual em todos os dispositivos) ---------- */
  function stat(disc) {
    const o = {}; const pre = 'd:' + disc + ':';
    (typeof allItems === 'function' ? allItems() : []).forEach(i => { if (!i || !i.k || i.k.indexOf(pre) !== 0) return; const id = i.k.slice(pre.length); const a = o[id] || (o[id] = { n: 0, ok: 0, last: 0, lastOk: false }); a.n++; if (i.ok) a.ok++; if ((i.ts || 0) >= a.last) { a.last = i.ts || 0; a.lastOk = !!i.ok; } });
    return o;
  }
  function modProg(j, m, st) { const its = modItems(j, m); if (!its.length) return { done: 0, tot: 0, pc: 0 }; const done = its.filter(i => st[i.id] && st[i.id].lastOk).length; return { done, tot: its.length, pc: Math.round(done / its.length * 100) }; }
  // Revisão espaçada: o que erraste volta ao fim de 1, 3 e 7 dias
  function due(j, st) { const now = Date.now(), D = 864e5; return allOf(j).filter(i => { const a = st[i.id]; if (!a) return false; if (!a.lastOk) return now - a.last > 0.5 * D; const gap = a.ok >= 3 ? 7 : a.ok === 2 ? 3 : 1; return a.ok < 4 && now - a.last > gap * D && a.n > a.ok; }); }

  /* ---------- registo da resposta (XP, sequência, ranking) ---------- */
  function record(disc, it, ok, ans) {
    try {
      const kk = 'd:' + disc + ':' + it.id; st.seen = st.seen || {}; const rt = st.seen[kk] ? 1 : 0; st.seen[kk] = 1; save();
      const date = today(); let day = HIST.find(d => d.date === date); if (!day) { day = { date, goal: ME.goal || 15, items: [] }; HIST.unshift(day); } if (!day.goal) day.goal = ME.goal || 15;
      const D = DISC.find(x => x.id === disc) || { n: disc };
      const x = { ts: Date.now(), t: -1, tn: D.n, tema: D.n, q: String(it.enunciado || '').slice(0, 280), esc: String(ans == null ? '' : ans).slice(0, 280), cert: String(certTxt(it)).slice(0, 280), ok: !!ok, mode: 'disc', k: kk };
      if (rt) x.rt = 1; day.items.push(x); persistDay(date); syncProfile();
      if (ok && !rt) { try { if (typeof haptic === 'function') haptic(10); if (typeof tone === 'function' && typeof SND !== 'undefined') tone(SND.ok); } catch (e) { } }
      return rt;
    } catch (e) { return 0; }
  }
  function certTxt(it) { if (it.tipo === 'mc') return (it.opcoes || [])[it.certa] || ''; if (it.tipo === 'vf') return it.certa ? 'Verdadeiro' : 'Falso'; if (it.tipo === 'escrita') return it.modelo || ''; if (it.tipo === 'codigo') return it.solucao || ''; return it.resultado || ''; }

  /* ---------- correção das respostas escritas ---------- */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const m = a.length, n = b.length; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
  function wordHit(tokens, w) { if (w.length < 4) return tokens.includes(w); const st6 = w.slice(0, Math.max(4, Math.min(w.length - 1, 7))); return tokens.some(t => t === w || (t.length >= 4 && (t.startsWith(st6) || w.startsWith(t.slice(0, Math.max(5, t.length - 1))) && t.length >= 5)) || (w.length >= 5 && lev(t, w) <= (w.length >= 8 ? 2 : 1))); }
  function keyHit(text, tokens, k) { const n = norm(k); if (!n) return false; if (text.indexOf(n) >= 0) return true; const ws = n.split(' ').filter(w => w.length > 2 && !STOP.has(w)); return ws.length > 0 && ws.every(w => wordHit(tokens, w)); }
  const STOP = new Set('que com para por uma uns umas dos das nos nas aos the and for with from that this ser sao sua seu suas seus como mais pelo pela'.split(' '));
  function grade(it, ans) {
    const text = norm(ans), tokens = text.split(' ').filter(Boolean);
    const cr = (it.criterios || []).map(c => ({ c, hit: (c.chaves || []).some(k => keyHit(text, tokens, k)) }));
    const tot = cr.reduce((s, x) => s + (+x.c.peso || 1), 0), got = cr.filter(x => x.hit).reduce((s, x) => s + (+x.c.peso || 1), 0);
    const min = +it.minimo || Math.ceil(tot * 0.6);
    const minWords = (it.linhas || 1) >= 3 ? 8 : 2;
    const ok = got >= min && tokens.length >= minWords;
    return { ok, got, tot, min, cr, short: tokens.length < minWords };
  }

  /* ---------- Python (Pyodide num worker; nada sai do dispositivo) ---------- */
  let PY = null, pyReady = null;
  function pyWorker() {
    if (PY) return pyReady;
    PY = new Worker('py-worker.js');
    pyReady = new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('O Python demorou demasiado a carregar. Verifica a internet (só da primeira vez).')), 90000); PY.onmessage = e => { if (e.data && e.data.ready) { clearTimeout(t); res(); } if (e.data && e.data.error && !e.data.id) { clearTimeout(t); rej(new Error(e.data.error)); } }; });
    return pyReady;
  }
  let pyN = 0;
  function pyRun(code, tests) {
    return pyWorker().then(() => new Promise(res => {
      const id = ++pyN; let done = false;
      const kill = setTimeout(() => { if (done) return; done = true; try { PY.terminate(); } catch (e) { } PY = null; pyReady = null; res({ out: '', err: 'O programa demorou mais de 8 segundos (ciclo infinito?). Foi parado.', tests: [] }); }, 8000);
      const prev = PY.onmessage; PY.onmessage = e => { if (!e.data || e.data.id !== id) return; done = true; clearTimeout(kill); PY.onmessage = prev; res(e.data); };
      PY.postMessage({ id, code, tests: tests || [] });
    }));
  }

  /* ---------- vistas ---------- */
  function host() { let el = document.getElementById('v-disc'); if (!el) { el = document.createElement('section'); el.id = 'v-disc'; el.dataset.view = 'disc'; el.hidden = true; const ref = document.getElementById('v-module'); ref.parentNode.insertBefore(el, ref.nextSibling); } return el; }
  function open(id, mod) { host(); S.disc = id; S.mod = mod || null; S.sess = null; S.forceR = true; go('disc'); }
  function render() {
    const el = host(); const D = DISC.find(x => x.id === S.disc); if (!D) { go('study'); return; }
    if (S.sess) { renderSess(el); return; }
    el.innerHTML = '<div class="xdload"><span class="xdspin"></span>A abrir ' + E(D.n) + '…</div>';
    load(D.id).then(j => { if (view !== 'disc' || S.disc !== D.id || S.sess) return; S.mod ? renderMod(el, D, j) : renderDisc(el, D, j); })
      .catch(() => { el.innerHTML = '<div class="xdwrap"><button class="xdback" data-xd="back">← Disciplinas</button><div class="card"><h2>' + E(D.n) + '</h2><p class="muted">Ainda não foi possível abrir os conteúdos desta disciplina. Liga-te à internet e tenta outra vez (depois fica disponível sem rede).</p></div></div>'; bind(el); });
  }
  function ring(pc, c) { const r = 26, C = 2 * Math.PI * r; return '<svg class="xdring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--x8-line,rgba(255,255,255,.12))" stroke-width="7"/><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pc / 100)) + '" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">' + pc + '%</text></svg>'; }
  function renderDisc(el, D, j) {
    const st0 = stat(D.id), all = allOf(j), done = all.filter(i => st0[i.id] && st0[i.id].lastOk).length, pc = all.length ? Math.round(done / all.length * 100) : 0;
    const next = j.mods.find(m => modProg(j, m, st0).pc < 80) || j.mods[0];
    const dv = due(j, st0);
    let h = '<div class="xdwrap"><button class="xdback" data-xd="back">← Disciplinas</button>';
    h += '<div class="xdhero" style="--xd:' + D.cor + '"><span class="xdic">' + ico(D.ic) + '</span><div><div class="eyebrow">' + E(j.fonte || 'Manual') + '</div><h1>' + E(D.n) + '</h1><p>' + E(D.d) + '</p></div>' + ring(pc, D.cor) + '</div>';
    h += '<div class="xdacts"><button class="x8p l" data-xd="cont" data-m="' + E(next.id) + '">' + (done ? 'Continuar' : 'Começar') + ': ' + E(short(next.titulo)) + '</button>' +
      (dv.length ? '<button class="x8p gh" data-xd="rev">Revisão (' + dv.length + ')</button>' : '') +
      '<button class="x8p gh" data-xd="teste">Teste de 10 perguntas</button></div>';
    h += '<h2 class="x8h2">Módulos</h2><div class="xdmods">' + j.mods.map((m, k) => { const p = modProg(j, m, st0); return '<button class="xdmod' + (p.pc >= 80 ? ' ok' : '') + '" data-xd="mod" data-m="' + E(m.id) + '"><span class="xdn">' + (p.pc >= 80 ? '✓' : (k + 1)) + '</span><span class="xdmt"><b>' + E(short(m.titulo)) + '</b><span>' + p.tot + ' exercícios · ' + p.pc + '% dominado</span><i style="width:' + p.pc + '%;background:' + D.cor + '"></i></span><span class="xdgo">›</span></button>'; }).join('') + '</div>';
    h += '<p class="hint">' + kindsHint(D.id) + '</p></div>';
    el.innerHTML = h; bind(el, j);
  }
  const short = t => String(t || '').replace(/^(Unidade|Módulo|Capítulo|Unit|Chapter)\s*\d+\s*[—–:-]\s*/i, '');
  function kindsHint(id) {
    return ({ python: 'Os exercícios de código correm aqui, no teu dispositivo (da primeira vez descarrega o Python, cerca de 10 MB). Escreves, carregas em Executar e vês se passou nos testes.',
      modelacao3d: 'As tarefas práticas fazem-se no Blender: segues os passos, envias a captura de ecrã e respondes a perguntas para confirmar. A captura fica só no teu dispositivo.',
      desenho: 'Os exercícios de desenho fazem-se no ecrã ou em papel (fotografas o desenho). Depois avalias com os critérios e respondes a perguntas sobre a técnica.',
      filosofia: 'Nas respostas escritas não precisas de usar as palavras do manual: a resposta está certa quando chega às ideias que a pergunta pede.',
      teologia: 'Nas respostas escritas não precisas de usar as palavras do manual: a resposta está certa quando chega às ideias que a pergunta pede.' })[id] || 'Nas respostas escritas a correção procura as ideias que a pergunta pede, escritas à tua maneira.';
  }
  function renderMod(el, D, j) {
    const m = j.mods.find(x => x.id === S.mod) || j.mods[0], st0 = stat(D.id), p = modProg(j, m, st0), L1 = m.licao || {};
    let h = '<div class="xdwrap"><button class="xdback" data-xd="disc">← ' + E(D.n) + '</button>';
    h += '<div class="xdhero sm" style="--xd:' + D.cor + '"><div><div class="eyebrow">' + E(D.n) + (m.pags ? ' · manual, págs. ' + E(m.pags.join('–')) : '') + '</div><h1>' + E(short(m.titulo)) + '</h1></div>' + ring(p.pc, D.cor) + '</div>';
    h += '<div class="card xdles"><div class="eyebrow">Lição</div>' + (L1.resumo ? '<p>' + E(L1.resumo) + '</p>' : '') + (L1.pontos && L1.pontos.length ? '<ul>' + L1.pontos.map(x => '<li>' + E(x) + '</li>').join('') + '</ul>' : '') + (L1.exemplo ? '<div class="xdex"><b>Exemplo</b>' + (D.id === 'python' ? '<pre>' + E(L1.exemplo) + '</pre>' : '<p>' + E(L1.exemplo) + '</p>') + '</div>' : '') + '</div>';
    h += '<div class="xdacts"><button class="x8p l" data-xd="pmod" data-m="' + E(m.id) + '">Praticar este módulo (' + p.tot + ')</button>' + (p.done < p.tot && p.done ? '<button class="x8p gh" data-xd="pfal" data-m="' + E(m.id) + '">Só os que faltam (' + (p.tot - p.done) + ')</button>' : '') + '</div>';
    const its = modItems(j, m);
    h += '<h2 class="x8h2">Exercícios</h2><div class="xdlist">' + its.map((it, k) => { const a = st0[it.id]; return '<button class="xdit' + (a ? (a.lastOk ? ' ok' : ' bad') : '') + '" data-xd="one" data-i="' + E(it.id) + '"><span class="xdtag">' + tagOf(it) + '</span><span class="xdq">' + E(String(it.enunciado || '').slice(0, 110)) + '</span><span class="xdst">' + (a ? (a.lastOk ? '✓' : '✗') : '') + '</span></button>'; }).join('') + '</div></div>';
    el.innerHTML = h; bind(el, j);
  }
  const TAG = { mc: 'Escolha', vf: 'V / F', escrita: 'Escrita', codigo: 'Código', desenho: 'Desenho', tarefa3d: 'Blender' };
  const tagOf = it => it._excerto ? 'Texto' : (TAG[it.tipo] || 'Exercício');

  function bind(el, j) {
    el.querySelectorAll('[data-xd]').forEach(b => b.onclick = () => {
      const a = b.dataset.xd, D = S.disc;
      if (a === 'back') { go('study'); return; }
      if (a === 'disc') { S.mod = null; render(); scrollTo(0, 0); return; }
      if (a === 'mod' || a === 'cont') { S.mod = b.dataset.m; render(); scrollTo(0, 0); return; }
      if (!j) return; const st0 = stat(D);
      if (a === 'pmod') { const m = j.mods.find(x => x.id === b.dataset.m); start(j, modItems(j, m), short(m.titulo)); }
      if (a === 'pfal') { const m = j.mods.find(x => x.id === b.dataset.m); start(j, modItems(j, m).filter(i => !(st0[i.id] && st0[i.id].lastOk)), short(m.titulo)); }
      if (a === 'one') { const it = allOf(j).find(x => x.id === b.dataset.i); if (it) start(j, [it], short((j.mods.find(x => x.id === it._m) || {}).titulo)); }
      if (a === 'rev') start(j, shuffle(due(j, st0)).slice(0, 12), 'Revisão');
      if (a === 'teste') { const pool = allOf(j).filter(i => (i.nivel || 1) >= 2 && ['mc', 'vf', 'escrita', 'codigo'].includes(i.tipo)); start(j, shuffle(pool.length >= 10 ? pool : allOf(j)).slice(0, 10), 'Teste', true); }
    });
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }

  /* ---------- sessão de prática ---------- */
  function start(j, list, title, exam) {
    if (!list.length) { T('Não há exercícios aqui por agora.'); return; }
    S.sess = { j, list, i: 0, title, exam: !!exam, res: {}, att: {}, drafts: {} }; render(); scrollTo(0, 0);
  }
  function renderSess(el) {
    const s = S.sess, it = s.list[s.i], D = DISC.find(x => x.id === S.disc), r = s.res[it.id];
    let h = '<div class="xdwrap xdplay"><div class="xdtop"><button class="xdback" data-xs="quit">✕</button><div class="xdbar">' + s.list.map((x, k) => '<i class="' + (s.res[x.id] ? (s.res[x.id].ok ? 'ok' : 'bad') : '') + (k === s.i ? ' cur' : '') + '"></i>').join('') + '</div><span class="xdcnt">' + (s.i + 1) + '/' + s.list.length + '</span></div>';
    h += '<div class="xdcard" style="--xd:' + D.cor + '"><div class="xdmeta"><span class="xdtag">' + tagOf(it) + '</span>' + (it.nivel >= 3 ? '<span class="xdtag ex">Exame</span>' : '') + (it.pag ? '<span class="xdpg">manual, pág. ' + E(it.pag) + '</span>' : '') + '</div>';
    if (it._excerto) h += '<details class="xdexc" open><summary>' + E(it._titulo || 'Lê o texto') + '</summary><div>' + E(it._excerto).replace(/\n/g, '<br>') + '</div></details>';
    h += '<h2 class="xdq">' + E(it.enunciado).replace(/\n/g, '<br>') + '</h2>' + body(it, r) + '</div>';
    if (r && (!s.exam || s.i === s.list.length - 1 && r)) h += feedback(it, r);
    h += '<div class="xdnav">' + navBtns(it, r) + '</div></div>';
    if (s.done) h = summary();
    el.innerHTML = h; bindSess(el, it);
  }
  function body(it, r) {
    const s = S.sess, lock = !!r;
    if (it.tipo === 'mc') return '<div class="xdopts">' + (it.opcoes || []).map((o, k) => '<button class="xdopt' + (lock && !s.exam ? (k === it.certa ? ' ok' : (r.ans === k ? ' bad' : '')) : (lock && r.ans === k ? ' pick' : '')) + '" data-o="' + k + '" ' + (lock ? 'disabled' : '') + '><span>' + 'ABCD'[k] + '</span>' + E(o) + '</button>').join('') + '</div>';
    if (it.tipo === 'vf') return '<div class="xdopts vf">' + [[true, 'Verdadeiro'], [false, 'Falso']].map(([v, n]) => '<button class="xdopt' + (lock && !s.exam ? (v === it.certa ? ' ok' : (r.ans === v ? ' bad' : '')) : (lock && r.ans === v ? ' pick' : '')) + '" data-v="' + v + '" ' + (lock ? 'disabled' : '') + '>' + n + '</button>').join('') + '</div>';
    if (it.tipo === 'escrita') { const att = s.att[it.id] || 0; return '<textarea class="xdta" id="xd-ta" rows="' + Math.max(3, Math.min(10, (it.linhas || 3) + 1)) + '" placeholder="Escreve a tua resposta por palavras tuas…" ' + (lock ? 'disabled' : '') + '>' + E(s.drafts[it.id] || '') + '</textarea>' + (lock ? '' : '<p class="xdhint">' + (att ? 'Tentativa 2 de 2: acrescenta o que falta.' : (it.linhas || 3) >= 3 ? 'Desenvolve: explica com 2 ou 3 frases.' : 'Uma ou duas frases chegam.') + '</p>'); }
    if (it.tipo === 'codigo') return '<div class="xdcode"><div class="xded"><textarea id="xd-code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" ' + (lock ? 'readonly' : '') + '>' + E(s.drafts[it.id] != null ? s.drafts[it.id] : (it.inicio || '')) + '</textarea></div><div class="xdrun"><button class="x8p gh sm" id="xd-run">▶ Executar</button>' + (it.dica ? '<button class="x8p gh sm" id="xd-dica">Dica</button>' : '') + '</div><pre class="xdout" id="xd-out">' + E(s.out && s.out[it.id] || 'A saída do programa aparece aqui.') + '</pre></div>';
    if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') return practical(it, r);
    return '<p class="muted">Este tipo de exercício ainda não é suportado.</p>';
  }
  function practical(it, r) {
    const s = S.sess, p = s.drafts[it.id] || (s.drafts[it.id] = { img: null, ticks: {}, ver: {} }), is3d = it.tipo === 'tarefa3d';
    let h = '';
    if (is3d && it.passos) h += '<ol class="xdsteps">' + it.passos.map(x => '<li>' + E(x) + '</li>').join('') + '</ol>' + (it.resultado ? '<p class="xdres"><b>A captura tem de mostrar:</b> ' + E(it.resultado) + '</p>' : '');
    if (!is3d) h += (it.materiais ? '<p class="xdres"><b>Materiais:</b> ' + E(Array.isArray(it.materiais) ? it.materiais.join(', ') : it.materiais) + '</p>' : '') + (it.tempo ? '<p class="xdres"><b>Tempo:</b> ' + E(it.tempo) + ' min</p>' : '');
    h += '<div class="xdstep"><b>1. ' + (is3d ? 'Envia a captura de ecrã' : 'Desenha aqui ou fotografa o desenho em papel') + '</b>';
    if (!is3d) h += '<div class="xdcanvas"><canvas id="xd-cv" width="900" height="640"></canvas><div class="xdtools"><button data-pc="#111">Preto</button><button data-pc="#d33">Vermelho</button><button data-pc="#2563eb">Azul</button><button data-pw="2">Fino</button><button data-pw="6">Grosso</button><button data-pe="1">Borracha</button><button id="xd-undo">Anular</button><button id="xd-clr">Limpar</button></div></div>';
    h += '<label class="x8p gh sm xdup"><input type="file" accept="image/*" ' + (is3d ? '' : 'capture="environment"') + ' id="xd-file" hidden>' + (is3d ? 'Escolher captura de ecrã' : 'Fotografar desenho em papel') + '</label>' + (p.img ? '<img class="xdimg" src="' + p.img + '" alt="A tua imagem">' : '') + '</div>';
    h += '<div class="xdstep"><b>2. Avalia com os critérios</b>' + (it.criterios || []).map((c, k) => '<label class="xdchk"><input type="checkbox" data-ck="' + k + '" ' + (p.ticks[k] ? 'checked' : '') + ' ' + (r ? 'disabled' : '') + '> ' + E(c) + '</label>').join('') + '</div>';
    if ((it.verificacao || []).length) h += '<div class="xdstep"><b>3. Confirma que percebeste</b>' + it.verificacao.map((q, qi) => '<div class="xdvq"><p>' + E(q.enunciado) + '</p>' + (q.tipo === 'vf' ? [[true, 'Verdadeiro'], [false, 'Falso']].map(([v, n]) => '<button class="xdopt sm' + (p.ver[qi] === v ? ' pick' : '') + (r ? (v === q.certa ? ' ok' : (p.ver[qi] === v ? ' bad' : '')) : '') + '" data-vq="' + qi + '" data-vv="' + v + '" ' + (r ? 'disabled' : '') + '>' + n + '</button>').join('') : (q.opcoes || []).map((o, k) => '<button class="xdopt sm' + (p.ver[qi] === k ? ' pick' : '') + (r ? (k === q.certa ? ' ok' : (p.ver[qi] === k ? ' bad' : '')) : '') + '" data-vq="' + qi + '" data-vv="' + k + '" ' + (r ? 'disabled' : '') + '><span>' + 'ABCD'[k] + '</span>' + E(o) + '</button>').join('')) + '</div>').join('') + '</div>';
    return h;
  }
  function navBtns(it, r) {
    const s = S.sess, last = s.i === s.list.length - 1;
    if (!r) {
      if (it.tipo === 'escrita') return '<button class="x8p l" id="xd-check">Verificar resposta</button>' + (s.att[it.id] ? '<button class="x8p gh" id="xd-give">Ver resposta-modelo</button>' : '');
      if (it.tipo === 'codigo') return '<button class="x8p l" id="xd-check">Verificar com os testes</button>' + ((s.att[it.id] || 0) >= 2 ? '<button class="x8p gh" id="xd-give">Ver solução</button>' : '');
      if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') return '<button class="x8p l" id="xd-check">Concluir exercício</button>';
      return '';
    }
    return '<button class="x8p l" id="xd-next">' + (last ? 'Ver resultado' : 'Seguinte') + '</button>';
  }
  function feedback(it, r) {
    let h = '<div class="xdfb ' + (r.ok ? 'ok' : 'bad') + '"><b>' + (r.ok ? (r.rt ? 'Certo · repetido, sem XP' : 'Certo! +10 XP') : (r.gaveup ? 'Vê como se faz' : 'Ainda não')) + '</b>';
    if (it.tipo === 'escrita' && r.g) h += '<ul class="xdcr">' + r.g.cr.map(x => '<li class="' + (x.hit ? 'ok' : '') + '">' + (x.hit ? '✓ ' : '○ ') + E(x.c.ideia) + '</li>').join('') + '</ul><div class="xdmodel"><b>Resposta-modelo</b><p>' + E(it.modelo || '') + '</p></div>';
    if (it.tipo === 'codigo') h += (r.tests ? '<ul class="xdcr">' + r.tests.map(t => '<li class="' + (t.ok ? 'ok' : '') + '">' + (t.ok ? '✓ ' : '✗ ') + E(t.msg || t.codigo) + (t.err && !t.ok ? '<small>' + E(t.err) + '</small>' : '') + '</li>').join('') + '</ul>' : '') + (r.gaveup || r.ok ? '<div class="xdmodel"><b>' + (r.ok ? 'Uma solução possível' : 'Solução') + '</b><pre>' + E(it.solucao || '') + '</pre></div>' : '');
    if (it.explicacao) h += '<p>' + E(it.explicacao) + '</p>';
    return h + '</div>';
  }
  function finish(it, ok, ans, extra) {
    const s = S.sess; const rt = record(S.disc, it, ok, ans); s.res[it.id] = Object.assign({ ok, ans, rt }, extra || {}); render();
    setTimeout(() => { const f = document.querySelector('.xdfb,#xd-next'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
  }
  function bindSess(el, it) {
    const s = S.sess, q = sel => el.querySelector(sel);
    el.querySelectorAll('[data-xs="quit"]').forEach(b => b.onclick = () => { S.sess = null; render(); });
    const nx = q('#xd-next'); if (nx) nx.onclick = () => { if (s.i < s.list.length - 1) { s.i++; render(); scrollTo(0, 0); } else { s.done = true; render(); scrollTo(0, 0); } };
    const again = q('#xd-again'); if (again) again.onclick = () => start(s.j, shuffle(s.list.filter(x => !(s.res[x.id] && s.res[x.id].ok))), s.title);
    const back = q('#xd-end'); if (back) back.onclick = () => { S.sess = null; render(); };
    if (s.done) return;
    el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const k = +b.dataset.o; finish(it, k === it.certa, k); });
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const v = b.dataset.v === 'true'; finish(it, v === it.certa, v); });
    if (it.tipo === 'escrita') {
      const ta = q('#xd-ta'); if (ta) { ta.oninput = () => { s.drafts[it.id] = ta.value; }; if (!s.res[it.id]) setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) { } }, 50); }
      const ck = q('#xd-check'); if (ck) ck.onclick = () => {
        const ans = (ta && ta.value || '').trim(); if (ans.length < 3) { T('Escreve a tua resposta primeiro.'); return; }
        const g = grade(it, ans); const att = (s.att[it.id] || 0) + 1; s.att[it.id] = att;
        if (g.ok || att >= 2 || s.exam) finish(it, g.ok, ans, { g });
        else { s.drafts[it.id] = ans; render(); const miss = g.cr.filter(x => !x.hit).map(x => x.c.ideia); const box = document.createElement('div'); box.className = 'xdfb bad'; box.innerHTML = '<b>' + (g.short ? 'Desenvolve mais a resposta.' : 'Quase! Falta ' + (miss.length === 1 ? 'uma ideia' : miss.length + ' ideias')) + '</b><p>Pensa em: ' + E(miss.slice(0, 2).join('; ')) + '.</p>'; const c = document.querySelector('.xdcard'); if (c) c.appendChild(box); }
      };
      const gv = q('#xd-give'); if (gv) gv.onclick = () => finish(it, false, (ta && ta.value) || '', { g: grade(it, (ta && ta.value) || ''), gaveup: true });
    }
    if (it.tipo === 'codigo') {
      const ed = q('#xd-code'), out = q('#xd-out');
      if (ed) { ed.oninput = () => { s.drafts[it.id] = ed.value; }; ed.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const a = ed.selectionStart; ed.value = ed.value.slice(0, a) + '    ' + ed.value.slice(ed.selectionEnd); ed.selectionStart = ed.selectionEnd = a + 4; s.drafts[it.id] = ed.value; } }; }
      const show = t => { s.out = s.out || {}; s.out[it.id] = t; if (out) out.textContent = t; };
      const run = (tests) => { show(PY ? 'A correr…' : 'A preparar o Python (só da primeira vez demora)…'); return pyRun(ed.value, tests).catch(e => ({ out: '', err: e.message, tests: [] })); };
      const rb = q('#xd-run'); if (rb) rb.onclick = () => run([]).then(r => show((r.out || '') + (r.err ? (r.out ? '\n' : '') + r.err : '') || '(o programa não escreveu nada)'));
      const db = q('#xd-dica'); if (db) db.onclick = () => T(it.dica);
      const ck = q('#xd-check'); if (ck) ck.onclick = () => { ck.disabled = true; run(it.testes || []).then(r => {
        ck.disabled = false; let tests = r.tests || []; let ok;
        if (it.saida != null) { const okOut = String(r.out || '').trim() === String(it.saida).trim(); tests = [{ ok: okOut && !r.err, msg: 'O programa escreve exatamente: ' + String(it.saida).slice(0, 120), err: okOut ? '' : 'Escreveu: ' + String(r.out || '').slice(0, 200) }]; }
        if (r.err && !tests.length) tests = [{ ok: false, msg: 'O programa correu sem erros', err: r.err }];
        ok = tests.length > 0 && tests.every(t => t.ok) && !r.err;
        show((r.out || '') + (r.err ? (r.out ? '\n' : '') + r.err : ''));
        const att = (s.att[it.id] || 0) + 1; s.att[it.id] = att;
        if (ok || s.exam) finish(it, ok, ed.value, { tests });
        else { render(); const box = document.createElement('div'); box.className = 'xdfb bad'; box.innerHTML = '<b>Ainda não passou em todos os testes</b><ul class="xdcr">' + tests.map(t => '<li class="' + (t.ok ? 'ok' : '') + '">' + (t.ok ? '✓ ' : '✗ ') + E(t.msg || t.codigo) + (t.err && !t.ok ? '<small>' + E(t.err) + '</small>' : '') + '</li>').join('') + '</ul>'; const c = document.querySelector('.xdcard'); if (c) c.appendChild(box); }
      }); };
      const gv = q('#xd-give'); if (gv) gv.onclick = () => finish(it, false, ed.value, { gaveup: true });
    }
    if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') {
      const p = s.drafts[it.id];
      el.querySelectorAll('[data-ck]').forEach(c => c.onchange = () => { p.ticks[c.dataset.ck] = c.checked; });
      el.querySelectorAll('[data-vq]').forEach(b => b.onclick = () => { const qi = +b.dataset.vq, q2 = it.verificacao[qi]; p.ver[qi] = q2.tipo === 'vf' ? b.dataset.vv === 'true' : +b.dataset.vv; el.querySelectorAll('[data-vq="' + qi + '"]').forEach(x => x.classList.toggle('pick', x === b)); });
      const f = q('#xd-file'); if (f) f.onchange = () => { const file = f.files && f.files[0]; if (!file) return; shrink(file).then(u => { p.img = u; p.drawn = false; render(); }); };
      const cv = q('#xd-cv'); if (cv) canvas(cv, p);
      const ck = q('#xd-check'); if (ck) ck.onclick = () => {
        if (it.tipo === 'tarefa3d' && !p.img) { T('Envia a captura de ecrã do Blender primeiro.'); return; }
        if (it.tipo === 'desenho' && !p.img && !p.drawn) { T('Desenha no quadro ou fotografa o teu desenho primeiro.'); return; }
        const vs = it.verificacao || []; if (vs.some((_, i) => p.ver[i] == null)) { T('Responde às perguntas de verificação.'); return; }
        const n = (it.criterios || []).length, t = Object.values(p.ticks).filter(Boolean).length, vOk = vs.every((q2, i) => p.ver[i] === q2.certa);
        const ok = vOk && (n === 0 || t >= Math.ceil(n * 0.7));
        finish(it, ok, (p.img ? '[imagem] ' : '') + t + '/' + n + ' critérios', { pr: true });
        if (!vOk) T('Revê as perguntas de verificação: a técnica não ficou certa.'); else if (!ok) T('Ainda faltam critérios: melhora o trabalho e tenta outra vez mais tarde.');
      };
    }
  }
  function shrink(file) { return new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1100 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; im.onerror = () => res(r.result); im.src = r.result; }; r.readAsDataURL(file); }); }
  function canvas(cv, p) {
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const hist = p.strokes || (p.strokes = []); let cur = null, col = '#111', w = 3, er = false;
    const redraw = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); hist.forEach(s => { ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.beginPath(); s.p.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); }); };
    redraw();
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const pr = e.pressure && e.pointerType === 'pen' ? e.pressure : 1; cur = { c: er ? '#fff' : col, w: (er ? 22 : w) * (0.6 + pr * 0.6), p: [pos(e)] }; hist.push(cur); };
    cv.onpointermove = e => { if (!cur) return; const pt = pos(e); cur.p.push(pt); const a = cur.p[cur.p.length - 2]; ctx.strokeStyle = cur.c; ctx.lineWidth = cur.w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke(); };
    cv.onpointerup = cv.onpointercancel = () => { if (cur) { p.drawn = hist.some(s => s.c !== '#fff'); } cur = null; };
    const box = cv.parentNode;
    box.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { col = b.dataset.pc; er = false; });
    box.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => { w = +b.dataset.pw; er = false; });
    box.querySelectorAll('[data-pe]').forEach(b => b.onclick = () => { er = true; });
    const u = box.querySelector('#xd-undo'); if (u) u.onclick = () => { hist.pop(); redraw(); p.drawn = hist.some(s => s.c !== '#fff'); };
    const c = box.querySelector('#xd-clr'); if (c) c.onclick = () => { hist.length = 0; redraw(); p.drawn = false; };
  }
  function summary() {
    const s = S.sess, n = s.list.length, ok = s.list.filter(x => s.res[x.id] && s.res[x.id].ok).length, xp = s.list.filter(x => s.res[x.id] && s.res[x.id].ok && !s.res[x.id].rt).length * 10;
    const nota = Math.round(ok / n * 200) / 10;
    try { if (ok === n && typeof burst === 'function') burst(innerWidth / 2, innerHeight / 3, 40); } catch (e) { }
    return '<div class="xdwrap"><div class="card xdsum"><div class="eyebrow">' + E(s.title) + '</div><h1>' + ok + ' de ' + n + ' certas</h1>' + (s.exam ? '<p class="xdnota">' + nota.toLocaleString('pt-PT') + ' valores</p>' : '') + '<p class="muted">+' + xp + ' XP' + (xp < ok * 10 ? ' (os repetidos não dão XP)' : '') + '</p>' +
      '<div class="xdbar big">' + s.list.map(x => '<i class="' + (s.res[x.id] && s.res[x.id].ok ? 'ok' : 'bad') + '"></i>').join('') + '</div>' +
      (ok < n ? '<p class="muted">Os que erraste voltam na Revisão daqui a um dia.</p>' : '') +
      '<div class="xdacts">' + (ok < n ? '<button class="x8p l" id="xd-again">Refazer os errados (' + (n - ok) + ')</button>' : '') + '<button class="x8p gh" id="xd-end">Voltar</button></div></div></div>';
  }

  /* ---------- ligação à app ---------- */
  // Lista de disciplinas: Matemática + as do manual; as restantes "em breve"
  if (typeof SUBJ !== 'undefined') {
    const keep = SUBJ.filter(x => x.on);
    const soon = SUBJ.filter(x => !x.on && !['py', 'fil', 'pt', 'des', 'ing'].includes(x.id));
    SUBJ.length = 0; keep.forEach(x => SUBJ.push(x));
    DISC.forEach((d, k) => SUBJ.push({ id: 'd_' + d.id, n: d.n, ic: d.ic, g: ['g2', 'g4', 'g1', 'g2', 'g3', 'g3', 'g1'][k], on: true, disc: d.id, mods: [{ id: d.id, n: d.d }] }));
    soon.forEach(x => SUBJ.push(x));
  }
  const _sc = typeof subjCard === 'function' ? subjCard : null;
  if (_sc) subjCard = function (s) { if (!s.disc) return _sc(s); const D = DISC.find(x => x.id === s.disc); const st0 = stat(s.disc); const n = Object.values(st0).filter(a => a.lastOk).length;
    return '<button class="subj on1" data-disc="' + E(s.disc) + '"><span class="ic ' + s.g + '" style="background:' + D.cor + '">' + ico(s.ic) + '</span><b>' + E(s.n) + '</b><span class="dim" style="font-size:.8rem">' + E(D.d) + '</span><div class="meta"><span>' + n + ' exercícios certos</span><span class="pill new">Nova</span></div></button>'; };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-disc],[data-subj^="d_"]'); if (!b) return; e.stopPropagation(); e.preventDefault(); open(b.dataset.disc || b.dataset.subj.slice(2)); }, true);
  const _rf = refresh; refresh = function () { if (view === 'disc') { try { renderChrome(); } catch (e) { } if (!(S.sess && document.querySelector('#v-disc .xdcard,#v-disc .xdsum')) && !document.querySelector('#v-disc .xdhero') || S.forceR) { S.forceR = false; render(); } try { if (typeof appBar === 'function') appBar(); } catch (e) { } return; } return _rf.apply(this, arguments); };
  // botão "voltar" do telemóvel dentro das disciplinas
  addEventListener('popstate', e => { if (view !== 'disc') return; if (document.querySelector('.x11sh,.x8sheet')) return; e.stopImmediatePropagation(); if (S.sess) { S.sess = null; render(); } else if (S.mod) { S.mod = null; render(); } else go('study'); try { history.pushState({ x17: 1, v: view }, ''); } catch (x) { } }, true);
  window.XD = { open, DISC, load, grade, stat };
  try { if (view === 'home' || view === 'study') refresh(); } catch (e) { }

  /* ---------- estilos ---------- */
  const css = `
#v-disc{padding-bottom:110px}
.xdwrap{display:flex;flex-direction:column;gap:14px;max-width:820px;margin:0 auto}
.xdback{align-self:flex-start;border:0;background:var(--x8-s1);color:var(--x8-ink,#fff);font:700 14px var(--x8-head);padding:8px 14px;border-radius:999px;cursor:pointer}
.xdhero{display:flex;align-items:center;gap:16px;padding:20px;border-radius:24px;background:linear-gradient(140deg,color-mix(in srgb,var(--xd) 28%,transparent),var(--x8-s1));border:1px solid color-mix(in srgb,var(--xd) 40%,transparent)}
.xdhero>div{flex:1;min-width:0}.xdhero h1{font:800 clamp(24px,6vw,34px) var(--x8-head);margin:2px 0 4px;text-wrap:balance}.xdhero p{margin:0;color:var(--x8-ink2)}
.xdhero.sm h1{font-size:clamp(20px,5vw,26px)}
.xdic{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:var(--xd);color:#0A0F2B;flex:none}.xdic svg{width:30px;height:30px}
.xdring{flex:none;color:var(--x8-ink,#fff)}
.xdacts{display:flex;flex-wrap:wrap;gap:10px}.xdacts .x8p{flex:1 1 220px;margin:0}
.xdmods,.xdlist{display:flex;flex-direction:column;gap:8px}
.xdmod{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;border:1px solid var(--x8-line,rgba(255,255,255,.12));background:var(--x8-s1);color:inherit;text-align:left;cursor:pointer}
.xdmod.ok .xdn{background:#2DD4A0;color:#06281E}
.xdn{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--x8-s2,rgba(255,255,255,.08));font:800 15px var(--x8-head);flex:none}
.xdmt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;position:relative;padding-bottom:7px}.xdmt b{font-size:15px;line-height:1.3}.xdmt span{font-size:13px;color:var(--x8-ink2)}
.xdmt i{position:absolute;left:0;bottom:0;height:3px;border-radius:3px;max-width:100%}
.xdgo{font-size:22px;color:var(--x8-ink2)}
.xdles p{line-height:1.6;max-width:68ch}.xdles ul{margin:8px 0;padding-left:20px;line-height:1.6}
.xdex{margin-top:10px;padding:12px 14px;border-radius:14px;background:var(--x8-s2,rgba(255,255,255,.06))}.xdex b{display:block;margin-bottom:4px}
.xdex pre,.xdmodel pre{white-space:pre-wrap;overflow-x:auto;font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;margin:0}
.xdit{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--x8-line,rgba(255,255,255,.12));background:transparent;color:inherit;text-align:left;cursor:pointer}
.xdit.ok{border-color:rgba(45,212,160,.5)}.xdit.bad{border-color:rgba(255,122,92,.5)}
.xdq{flex:1;min-width:0;font-size:14px;line-height:1.4}.xdst{font-weight:800}.xdit.ok .xdst{color:#2DD4A0}.xdit.bad .xdst{color:#FF7A5C}
.xdtag{display:inline-block;font:700 11px var(--x8-head);letter-spacing:.04em;text-transform:uppercase;padding:4px 8px;border-radius:999px;background:var(--x8-s2,rgba(255,255,255,.08));color:var(--x8-ink2);flex:none}
.xdtag.ex{background:rgba(255,201,60,.18);color:#FFC93C}
.xdload{display:flex;align-items:center;gap:10px;justify-content:center;padding:60px 0;color:var(--x8-ink2)}
.xdspin{width:18px;height:18px;border-radius:50%;border:3px solid var(--x8-line,rgba(255,255,255,.2));border-top-color:var(--x8-lil,#9178E6);animation:xdsp 1s linear infinite}@keyframes xdsp{to{transform:rotate(360deg)}}
.xdtop{display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5;padding:8px 0;background:var(--x8-bg,var(--bg))}
.xdbar{flex:1;display:flex;gap:4px}.xdbar i{flex:1;height:8px;border-radius:8px;background:var(--x8-s2,rgba(255,255,255,.1))}.xdbar i.ok{background:#2DD4A0}.xdbar i.bad{background:#FF7A5C}.xdbar i.cur{outline:2px solid var(--x8-ink,#fff);outline-offset:1px}
.xdbar.big i{height:12px}
.xdcnt{font:700 13px var(--x8-head);color:var(--x8-ink2)}
.xdcard{padding:18px;border-radius:22px;background:var(--x8-s1);border:1px solid var(--x8-line,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:12px}
.xdmeta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.xdpg{font-size:12px;color:var(--x8-ink3,var(--x8-ink2))}
h2.xdq{font:700 clamp(17px,4.4vw,20px)/1.4 var(--x8-head);margin:0;text-wrap:pretty}
.xdexc{border-radius:14px;background:var(--x8-s2,rgba(255,255,255,.05));padding:10px 14px}.xdexc summary{cursor:pointer;font-weight:700}.xdexc div{margin-top:8px;line-height:1.65;max-height:42vh;overflow:auto;font-size:15px}
.xdopts{display:flex;flex-direction:column;gap:8px}.xdopts.vf{flex-direction:row}.xdopts.vf .xdopt{flex:1;justify-content:center}
.xdopt{display:flex;align-items:flex-start;gap:10px;text-align:left;padding:13px 14px;border-radius:16px;border:2px solid var(--x8-line,rgba(255,255,255,.14));background:transparent;color:inherit;font:600 15px/1.45 inherit;cursor:pointer}
.xdopt span{flex:none;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:var(--x8-s2,rgba(255,255,255,.08));font-weight:800;font-size:13px}
.xdopt.ok{border-color:#2DD4A0;background:rgba(45,212,160,.12)}.xdopt.bad{border-color:#FF7A5C;background:rgba(255,122,92,.12)}.xdopt.pick{border-color:var(--x8-lil,#9178E6);background:rgba(145,120,230,.14)}
.xdopt.sm{padding:9px 12px;font-size:14px}
.xdta{width:100%;box-sizing:border-box;border-radius:16px;border:2px solid var(--x8-line,rgba(255,255,255,.14));background:var(--x8-bg,transparent);color:inherit;font:16px/1.55 inherit;padding:12px 14px;resize:vertical}
.xdhint{margin:0;font-size:13px;color:var(--x8-ink2)}
.xdcode{display:flex;flex-direction:column;gap:8px}
.xded textarea{width:100%;box-sizing:border-box;min-height:200px;border-radius:14px;border:2px solid var(--x8-line,rgba(255,255,255,.14));background:#0B1020;color:#E6EDF7;font:14px/1.55 'JetBrains Mono',ui-monospace,monospace;padding:12px;tab-size:4;white-space:pre;overflow:auto;resize:vertical}
.xdrun{display:flex;gap:8px}.xdrun .x8p{margin:0}
.xdout{margin:0;min-height:48px;max-height:30vh;overflow:auto;border-radius:12px;padding:10px 12px;background:#05080F;color:#B7F5D8;font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;white-space:pre-wrap}
.xdnav{display:flex;flex-wrap:wrap;gap:10px}.xdnav .x8p{flex:1 1 200px;margin:0}
.xdfb{padding:14px 16px;border-radius:18px;border:2px solid;display:flex;flex-direction:column;gap:8px;line-height:1.5}
.xdfb.ok{border-color:#2DD4A0;background:rgba(45,212,160,.08)}.xdfb.bad{border-color:#FF7A5C;background:rgba(255,122,92,.08)}
.xdfb>b{font:800 17px var(--x8-head)}.xdfb p{margin:0}
.xdcr{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}.xdcr li{color:var(--x8-ink2)}.xdcr li.ok{color:inherit}.xdcr small{display:block;opacity:.75;font-family:ui-monospace,monospace;white-space:pre-wrap}
.xdmodel{padding:10px 12px;border-radius:12px;background:var(--x8-s2,rgba(255,255,255,.06))}.xdmodel b{display:block;margin-bottom:4px}
.xdsteps{margin:0;padding-left:22px;line-height:1.6;display:flex;flex-direction:column;gap:4px}
.xdres{margin:0;line-height:1.5}
.xdstep{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:var(--x8-s2,rgba(255,255,255,.05))}
.xdchk{display:flex;gap:10px;align-items:flex-start;line-height:1.45;cursor:pointer}.xdchk input{width:20px;height:20px;flex:none;margin-top:1px}
.xdvq p{margin:4px 0 6px;font-weight:600}.xdvq{display:flex;flex-direction:column;gap:6px}
.xdcanvas{display:flex;flex-direction:column;gap:6px}.xdcanvas canvas{position:static!important;inset:auto!important;display:block;width:100%!important;height:auto!important;max-width:100%;aspect-ratio:900/640;border-radius:12px;background:#fff;touch-action:none;border:1px solid var(--x8-line,rgba(255,255,255,.2))}
.xdtools{display:flex;flex-wrap:wrap;gap:6px}.xdtools button{border:1px solid var(--x8-line,rgba(255,255,255,.2));background:transparent;color:inherit;border-radius:999px;padding:6px 12px;font:600 13px inherit;cursor:pointer}
.xdup{align-self:flex-start;margin:0;cursor:pointer}
.xdimg{max-width:100%;border-radius:12px;border:1px solid var(--x8-line,rgba(255,255,255,.2))}
.xdsum{display:flex;flex-direction:column;gap:10px;align-items:stretch;text-align:center}.xdsum h1{font:800 30px var(--x8-head);margin:0}
.xdnota{font:800 22px var(--x8-head);margin:0;color:#FFC93C}
html.x13light .xded textarea{background:#0B1020}
html.x13light .xdtag.ex{color:#8A6100}
`;
  const stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);
})();
