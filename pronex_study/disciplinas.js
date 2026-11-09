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
      .then(j => { mix(j); j.mods = j.modulos || []; j.byId = {}; j.mods.forEach(m => (m.itens || []).forEach(it => { it._m = m.id; it._d = j.disc; j.byId[it.id] = it; (it.perguntas || []).forEach((q, k) => { q.id = q.id || (it.id + '-' + (k + 1)); q._m = m.id; q._pai = it.id; q._d = j.disc; }); })); CACHE[id] = j; return j; });
  }
  // A posição da opção certa é baralhada de forma fixa por exercício (a mesma em todos os dispositivos),
  // para a resposta certa não cair sempre na mesma letra.
  function seeded(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  function mixOne(q, key) { if (!q || q.tipo === 'vf' || !Array.isArray(q.opcoes) || q.opcoes.length < 2 || typeof q.certa !== 'number' || q._mx || /\b(op[cç][aã]o|option|al[ií]nea|letra|answer)\s*\(?[A-D]\b|\([A-D]\)|\b[A-D]\)\s/i.test(String(q.explicacao || '') + ' ' + String(q.enunciado || ''))) return; const r = seeded(key), idx = q.opcoes.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [idx[i], idx[k]] = [idx[k], idx[i]]; } q.opcoes = idx.map(i => q.opcoes[i]); if (Array.isArray(q.porque) && q.porque.length === idx.length) q.porque = idx.map(i => q.porque[i]); q.certa = idx.indexOf(q.certa); q._mx = 1; }
  function mix(j) { (j.modulos || []).forEach(m => (m.itens || []).forEach(it => { mixOne(it, j.disc + it.id); (it.perguntas || []).forEach((q, k) => mixOne(q, j.disc + it.id + 'p' + k)); (it.verificacao || []).forEach((q, k) => mixOne(q, j.disc + it.id + 'v' + k)); })); }
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
  const norm = s => String(s || '').replace(/¬/g, ' nao ').replace(/∧/g, ' e ').replace(/∨/g, ' ou ').replace(/→|⊃/g, ' entao ').replace(/↔/g, ' se e so se ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const m = a.length, n = b.length; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
  function wordHit(tokens, w) { if (w.length < 4) return tokens.includes(w); const st6 = w.slice(0, Math.max(4, Math.min(w.length - 1, 7))); return tokens.some(t => t === w || (t.length >= 4 && (t.startsWith(st6) || w.startsWith(t.slice(0, Math.max(5, t.length - 1))) && t.length >= 5)) || (w.length >= 5 && lev(t, w) <= (w.length >= 8 ? 2 : 1))); }
  function keyHit(text, tokens, k) { const n = norm(k); if (!n) return false; if ((' ' + text + ' ').indexOf(' ' + n + ' ') >= 0) return true; if (n.length >= 6 && n.indexOf(' ') > 0 && text.indexOf(n) >= 0) return true; const ws = [...new Set(n.split(' ').filter(w => w.length > 2 && !STOP.has(w)))]; if (!(ws.length >= 2 || (ws.length === 1 && ws[0].length >= 5))) return false; return ws.every(w => wordHit(tokens, w)); }
  const STOP = new Set('que com para por uma uns umas dos das nos nas aos the and for with from that this ser sao sua seu suas seus como mais pelo pela'.split(' '));
  function grade(it, ans) {
    const text = norm(ans), tokens = text.split(' ').filter(Boolean);
    const cr = (it.criterios || []).map(c => ({ c, hit: (c.chaves || []).some(k => keyHit(text, tokens, k)) }));
    const tot = cr.reduce((s, x) => s + (+x.c.peso || 1), 0), got = cr.filter(x => x.hit).reduce((s, x) => s + (+x.c.peso || 1), 0);
    const min = +it.minimo || Math.ceil(tot * 0.6);
    const ln = +it.linhas || 1, minWords = ln >= 3 ? 8 : ln === 2 ? 2 : 1;
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
  /* ---------- trilho por níveis: cada módulo divide-se em lições curtas (uma ideia de cada vez) e acaba num desafio ---------- */
  function chunks(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); if (out.length > 1 && out[out.length - 1].length < 3) { const l = out.pop(); out[out.length - 1] = out[out.length - 1].concat(l); } return out; }
  function trail(j) {
    if (j._trail) return j._trail; const nodes = [];
    j.mods.forEach((m, mi) => {
      // uma lição por ideia-chave do manual: um cartão com a ideia e 2 ou 3 exercícios logo a seguir
      const its = modItems(j, m), L1 = m.licao || {}, pts = (L1.pontos || []).slice();
      const nL = Math.max(1, Math.min(pts.length || 1, Math.floor(its.length / 2))), per = its.length / nL;
      for (let k = 0; k < nL; k++) {
        const a = Math.floor(pts.length * k / nL), b = Math.floor(pts.length * (k + 1) / nL), cards = [];
        pts.slice(a, Math.max(b, a + 1)).forEach(x => x && cards.push({ t: 'Ideia ' + (a + 1) + ' de ' + pts.length, txt: x }));
        if (k === nL - 1 && L1.exemplo) cards.push({ t: 'Exemplo', txt: L1.exemplo, code: j.disc === 'python' });
        nodes.push({ id: m.id + '-L' + (k + 1), m, mi, k, n: nL, kind: 'lic', items: its.slice(Math.round(k * per), Math.round((k + 1) * per)), cards, lab: 'Lição ' + (k + 1) });
      }
      const boss = its.filter(x => (x.nivel || 1) >= 2); nodes.push({ id: m.id + '-D', m, mi, kind: 'des', items: (boss.length >= 4 ? boss : its).slice(0, 8), cards: [], lab: 'Desafio' });
    });
    return (j._trail = nodes);
  }
  function nodeState(nd, st0) { const its = nd.items; if (!its.length) return { done: true, stars: 3 }; const tried = its.filter(i => st0[i.id] && st0[i.id].n > 0).length, lastOk = its.filter(i => st0[i.id] && st0[i.id].lastOk).length;
    const done = tried === its.length; return { done, stars: done ? (lastOk === its.length ? 3 : lastOk / its.length >= 0.75 ? 2 : 1) : 0, part: its.filter(i => st0[i.id]).length / its.length }; }
  function nextNode(j, st0) { return trail(j).find(nd => !nodeState(nd, st0).done) || null; }
  function renderDisc(el, D, j) {
    const st0 = stat(D.id), nodes = trail(j), all = allOf(j), done = all.filter(i => st0[i.id] && st0[i.id].lastOk).length, pc = all.length ? Math.round(done / all.length * 100) : 0;
    const nx = nextNode(j, st0), dv = due(j, st0), nDone = nodes.filter(nd => nodeState(nd, st0).done).length;
    let h = '<div class="xdwrap"><button class="xdback" data-xd="back">← Disciplinas</button>';
    h += '<div class="xdhero" style="--xd:' + D.cor + '"><span class="xdic">' + ico(D.ic) + '</span><div><div class="eyebrow">' + E(j.fonte || 'Manual') + '</div><h1>' + E(D.n) + '</h1><p>' + nDone + ' de ' + nodes.length + ' níveis · ' + pc + '% da matéria</p></div>' + ring(pc, D.cor) + '</div>';
    h += '<div class="xdacts">' + (nx ? '<button class="x8p l" data-xd="node" data-n="' + E(nx.id) + '">' + (nDone ? 'Continuar' : 'Começar') + ': ' + E(short(nx.m.titulo)) + ' · ' + nx.lab + '</button>' : '<button class="x8p l" data-xd="teste">Fizeste todos os níveis! Teste de 10 perguntas</button>') + '</div>';
    h += '<div class="xdquick">' + (dv.length ? '<button data-xd="rev"><b>' + dv.length + '</b><span>para rever</span></button>' : '') + '<button data-xd="cards"><b>' + flashDue(D.id, j) + '</b><span>cartões</span></button>' + (D.id === 'ingles' ? '<button data-xd="ouvir"><b>' + IC2.ear + '</b><span>ouvir</span></button>' : '') + '<button data-xd="teste"><b>10</b><span>teste</span></button></div>';
    h += '<div class="trail xdtrail" style="--xd:' + D.cor + '">'; let z = 0, lastM = null; const seen = new Set();
    nodes.forEach(nd => {
      if (nd.m !== lastM) { lastM = nd.m; h += '<div class="chap xdchap"><button data-xd="mod" data-m="' + E(nd.m.id) + '">Nível ' + (nd.mi + 1) + ' · ' + E(short(nd.m.titulo)) + ' ›</button></div>'; }
      const ns = nodeState(nd, st0), isNext = nx && nd.id === nx.id, locked = !ns.done && !isNext && !seen.has('open');
      if (isNext) seen.add('open');
      const cls = ns.done ? 's' + ns.stars : isNext ? 'prog' : 'new lock', x = Math.round(ZIG[z++ % ZIG.length] * (innerWidth > 900 ? 1.7 : 1));
      h += '<div class="nrow"><button class="node ' + cls + (isNext ? ' rec' : '') + (nd.kind === 'des' ? ' xdboss' : '') + '" data-xd="node" data-n="' + E(nd.id) + '" ' + (locked ? 'data-lock="1"' : '') + ' style="transform:translateX(' + x + 'px)">' + (isNext ? '<span class="ring2"></span>' : '') + '<span class="hex">' + (locked ? IC2.lock : nd.kind === 'des' ? (IC.crown || '★') : IC2.book) + '</span>' + (ns.done ? crownRow(ns.stars) : '') + '<span class="lab">' + nd.lab + (isNext ? ' · aqui' : '') + '</span></button></div>';
    });
    h += '</div><p class="hint">' + kindsHint(D.id) + '</p></div>';
    el.innerHTML = h; bind(el, j);
    setTimeout(() => { const r = el.querySelector('.node.rec'); if (r && !S.noScroll) r.scrollIntoView({ block: 'center' }); S.noScroll = false; }, 30);
  }
  const IC2 = { lock: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h7"/></svg>',
    ear: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>' };
  function startNode(j, id) { const nd = trail(j).find(x => x.id === id); if (!nd) return; const list = []; nd.cards.forEach(c => list.push({ tipo: 'card', id: 'card:' + nd.id + ':' + list.length, t: c.t, txt: c.txt, code: c.code }));
    // uma ideia de cada vez: cada cartão é seguido pelos exercícios dessa parte
    const ex = nd.kind === 'des' ? shuffle(nd.items) : nd.items.slice(); const per = Math.max(1, Math.ceil(ex.length / Math.max(1, list.length)));
    const out = []; if (list.length) { list.forEach((c, k) => { out.push(c); out.push(...ex.slice(k * per, (k + 1) * per)); }); out.push(...ex.slice(list.length * per)); } else out.push(...ex);
    start(j, out, short(nd.m.titulo) + ' · ' + nd.lab, false, { node: nd.id, requeue: true }); }
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
      if (a === 'node' && b.dataset.lock) { T('Termina primeiro o nível assinalado com «aqui».'); return; }
      if (!j) return; const st0 = stat(D);
      if (a === 'pmod') { const m = j.mods.find(x => x.id === b.dataset.m); start(j, modItems(j, m), short(m.titulo)); }
      if (a === 'pfal') { const m = j.mods.find(x => x.id === b.dataset.m); start(j, modItems(j, m).filter(i => !(st0[i.id] && st0[i.id].lastOk)), short(m.titulo)); }
      if (a === 'one') { const it = allOf(j).find(x => x.id === b.dataset.i); if (it) start(j, [it], short((j.mods.find(x => x.id === it._m) || {}).titulo)); }
      if (a === 'node') { startNode(j, b.dataset.n); return; }
      if (a === 'cards') { startFlash(j); return; }
      if (a === 'ouvir') { const pool = shuffle(allOf(j).filter(x => x._excerto && x.tipo === 'mc' && x._excerto.length <= 900 && !/paragraph|line \d|lines? \d|gap|parágrafo/i.test(x.enunciado + ' ' + (x.opcoes || []).join(' ')))).slice(0, 6); if (!pool.length) { T('Não há textos para ouvir.'); return; } start(j, pool, 'Ouvir e responder', false, { listen: true }); return; }
      if (a === 'rev') start(j, shuffle(due(j, st0)).slice(0, 12), 'Revisão');
      if (a === 'teste') { const pool = allOf(j).filter(i => (i.nivel || 1) >= 2 && ['mc', 'vf', 'escrita', 'codigo'].includes(i.tipo)); start(j, shuffle(pool.length >= 10 ? pool : allOf(j)).slice(0, 10), 'Teste', true); }
    });
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }

  const KK = it => it._key || it.id;
  /* ---------- sessão de prática ---------- */
  function start(j, list, title, exam, opt) {
    if (!list.length) { T('Não há exercícios aqui por agora.'); return; }
    S.sess = Object.assign({ j, list: list.slice(), i: 0, title, exam: !!exam, res: {}, att: {}, drafts: {}, combo: 0, best: 0, first: {} }, opt || {}); render(); scrollTo(0, 0);
  }
  function renderSess(el) {
    const s = S.sess, it = s.list[s.i], D = DISC.find(x => x.id === (it._d || S.disc)) || DISC[0], r = s.res[KK(it)];
    let h = '<div class="xdwrap xdplay" style="--xd:' + D.cor + '"><div class="xdtop"><button class="xdback" data-xs="quit" aria-label="Sair">✕</button><div class="xdbar">' + s.list.map((x, k) => '<i class="' + (x.tipo === 'card' ? (k < s.i ? 'ok cd' : 'cd') : s.res[KK(x)] ? (s.res[KK(x)].ok ? 'ok' : 'bad') : '') + (k === s.i ? ' cur' : '') + '"></i>').join('') + '</div>' + (s.combo >= 2 ? '<span class="xdcombo">' + s.combo + ' seguidas</span>' : '<span class="xdcnt">' + (s.i + 1) + '/' + s.list.length + '</span>') + '</div>';
    if (s.done) { if (s.duel && !s.sent) { s.sent = 1; duelSend(s); } el.innerHTML = summary(); bindSess(el, it); return; }
    if (it.tipo === 'card') { h += '<div class="xdteach"><div class="eyebrow">' + E(it.t) + '</div>' + (it.code ? '<pre class="xdpre">' + E(it.txt) + '</pre>' : '<p>' + E(it.txt) + '</p>') + '</div><div class="xdnav"><button class="x8p l" id="xd-next">Percebi</button></div></div>'; el.innerHTML = h; bindSess(el, it); return; }
    if (it.tipo === 'flash') { const rv = s.drafts[KK(it)]; h += '<div class="xdteach xdflash"><div class="eyebrow">' + E(short(it.m.titulo)) + '</div><p>' + E(rv ? it.full : it.front) + '</p>' + (rv ? '<p class="xdhint">A palavra era: <b>' + E(it.word) + '</b></p>' : '<p class="xdhint">Lembras-te da palavra que falta? Pensa nela e depois vê.</p>') + '</div><div class="xdnav">' + (rv ? '<button class="x8p gh" id="xd-fno">Não sabia</button><button class="x8p l" id="xd-fyes">Sabia</button>' : '<button class="x8p l" id="xd-frev">Ver a resposta</button>') + '</div></div>'; el.innerHTML = h; bindSess(el, it); return; }
    if (it._rq && !r) h += '<p class="xdrq">Outra vez: este falhou há pouco.</p>';
    h += '<div class="xdcard" style="--xd:' + D.cor + '"><div class="xdmeta"><span class="xdtag">' + tagOf(it) + '</span>' + (it.nivel >= 3 ? '<span class="xdtag ex">Exame</span>' : '') + (it.pag ? '<span class="xdpg">manual, pág. ' + E(it.pag) + '</span>' : '') + '</div>';
    if (it._excerto) h += (it._d === 'ingles' || S.disc === 'ingles' ? '<button class="x8p gh sm xdspk" id="xd-spk">' + IC2.ear + (s.listen && !r ? ' Ouvir o texto' : ' Ouvir') + '</button>' : '') + (s.listen && !r ? '<p class="xdhint">Ouve o texto (podes repetir) e responde sem o ler. O texto aparece depois de responderes.</p>' : '<details class="xdexc" open><summary>' + E(it._titulo || 'Lê o texto') + '</summary><div>' + E(it._excerto).replace(/\n/g, '<br>') + '</div></details>');
    const en = String(it.enunciado || ''), cut = en.indexOf('\n');
    h += '<h2 class="xdq">' + E(cut > 0 ? en.slice(0, cut) : en) + '</h2>' + (cut > 0 ? (S.disc === 'python' || /[=#{}()\[\]]|^\s{2,}/m.test(en.slice(cut)) ? '<pre class="xdpre">' + E(en.slice(cut + 1)) + '</pre>' : '<p class="xdsubq">' + E(en.slice(cut + 1)).replace(/\n/g, '<br>') + '</p>') : '') + body(it, r) + '</div>';
    if (r && (!s.exam || s.i === s.list.length - 1 && r)) h += feedback(it, r);
    h += '<div class="xdnav">' + navBtns(it, r) + '</div></div>';
    el.innerHTML = h; bindSess(el, it);
    if (s.listen && it._excerto && !r && !s.spoke) { s.spoke = KK(it); setTimeout(() => speak(it._excerto), 300); } else if (s.spoke !== KK(it)) s.spoke = null;
  }
  function body(it, r) {
    const s = S.sess, lock = !!r;
    if (it.tipo === 'mc') return '<div class="xdopts">' + (it.opcoes || []).map((o, k) => '<button class="xdopt' + (lock && !s.exam ? (k === it.certa ? ' ok' : (r.ans === k ? ' bad' : '')) : (lock && r.ans === k ? ' pick' : '')) + '" data-o="' + k + '" ' + (lock ? 'disabled' : '') + '><span>' + 'ABCD'[k] + '</span>' + E(o) + '</button>').join('') + '</div>';
    if (it.tipo === 'vf') return '<div class="xdopts vf">' + [[true, 'Verdadeiro'], [false, 'Falso']].map(([v, n]) => '<button class="xdopt' + (lock && !s.exam ? (v === it.certa ? ' ok' : (r.ans === v ? ' bad' : '')) : (lock && r.ans === v ? ' pick' : '')) + '" data-v="' + v + '" ' + (lock ? 'disabled' : '') + '>' + n + '</button>').join('') + '</div>';
    if (it.tipo === 'escrita') { const att = s.att[KK(it)] || 0; return '<textarea class="xdta" id="xd-ta" rows="' + Math.max(3, Math.min(10, (it.linhas || 3) + 1)) + '" placeholder="Escreve a tua resposta por palavras tuas…" ' + (lock ? 'disabled' : '') + '>' + E(s.drafts[KK(it)] || '') + '</textarea>' + (lock ? '' : '<p class="xdhint">' + (att ? 'Tentativa 2 de 2: acrescenta o que falta.' : (it.linhas || 3) >= 3 ? 'Desenvolve: explica com 2 ou 3 frases.' : 'Uma ou duas frases chegam.') + '</p>' + ((it.nivel || 1) <= 2 && (it.criterios || []).length ? (s.help && s.help[KK(it)] ? '<div class="xdhelp"><b>A tua resposta deve tocar nestas ideias:</b><ul>' + it.criterios.map(c => '<li>' + E(c.ideia) + '</li>').join('') + '</ul></div>' : '<button class="xdlink" id="xd-help">Preciso de ajuda: que ideias devo incluir?</button>') : '')); }
    if (it.tipo === 'codigo') return '<div class="xdcode"><div class="xded"><textarea id="xd-code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" ' + (lock ? 'readonly' : '') + '>' + E(s.drafts[KK(it)] != null ? s.drafts[KK(it)] : (it.inicio || '')) + '</textarea></div><div class="xdrun"><button class="x8p gh sm" id="xd-run">▶ Executar</button>' + (it.dica ? '<button class="x8p gh sm" id="xd-dica">Dica</button>' : '') + '</div><pre class="xdout" id="xd-out">' + E(s.out && s.out[KK(it)] || 'A saída do programa aparece aqui.') + '</pre></div>';
    if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') return practical(it, r);
    return '<p class="muted">Este tipo de exercício ainda não é suportado.</p>';
  }
  function practical(it, r) {
    const s = S.sess, p = s.drafts[KK(it)] || (s.drafts[KK(it)] = { img: null, ticks: {}, ver: {} }), is3d = it.tipo === 'tarefa3d';
    let h = '';
    if (is3d && it.passos) h += '<ol class="xdsteps">' + it.passos.map(x => '<li>' + E(x) + '</li>').join('') + '</ol>' + (it.resultado ? '<p class="xdres"><b>A captura tem de mostrar:</b> ' + E(it.resultado) + '</p>' : '');
    if (!is3d) h += (it.materiais ? '<p class="xdres"><b>Materiais:</b> ' + E(Array.isArray(it.materiais) ? it.materiais.join(', ') : it.materiais) + '</p>' : '') + (it.tempo ? '<p class="xdres"><b>Tempo:</b> ' + E(it.tempo) + ' min</p>' : '');
    h += '<div class="xdstep"><b>1. ' + (is3d ? 'Envia a captura de ecrã' : 'Desenha aqui ou fotografa o desenho em papel') + '</b>';
    if (!is3d) h += '<div class="xdcanvas"><canvas id="xd-cv" width="900" height="640"></canvas><div class="xdtools"><button data-pc="#111">Preto</button><button data-pc="#d33">Vermelho</button><button data-pc="#2563eb">Azul</button><button data-pw="2">Fino</button><button data-pw="6">Grosso</button><button data-pe="1">Borracha</button><button id="xd-undo">Anular</button><button id="xd-clr">Limpar</button></div></div>';
    h += '<label class="x8p gh sm xdup"><input type="file" accept="image/*" ' + (is3d ? '' : 'capture="environment"') + ' id="xd-file" hidden>' + (is3d ? 'Escolher captura de ecrã' : 'Fotografar desenho em papel') + '</label>' + (p.img ? '<img class="xdimg" src="' + p.img + '" alt="A tua imagem">' : '') + '</div>';
    h += '<div class="xdstep"><b>2. Avalia com os critérios</b>' + (it.criterios || []).map((c, k) => '<label class="xdchk"><input type="checkbox" data-ck="' + k + '" ' + (p.ticks[k] ? 'checked' : '') + ' ' + (r ? 'disabled' : '') + '> ' + E(c) + '</label>').join('') + '</div>';
    if ((it.verificacao || []).length) h += '<div class="xdstep"><b>3. Confirma que percebeste</b>' + it.verificacao.map((q, qi) => '<div class="xdvq"><p>' + E(q.enunciado) + '</p>' + (q.tipo === 'vf' ? [[true, 'Verdadeiro'], [false, 'Falso']].map(([v, n]) => '<button class="xdopt sm' + (p.ver[qi] === v ? ' pick' : '') + (r ? (v === q.certa ? ' ok' : (p.ver[qi] === v ? ' bad' : '')) : '') + '" data-vq="' + qi + '" data-vv="' + v + '" ' + (r ? 'disabled' : '') + '>' + n + '</button>').join('') : (q.opcoes || []).map((o, k) => '<button class="xdopt sm' + (p.ver[qi] === k ? ' pick' : '') + (r ? (k === q.certa ? ' ok' : (p.ver[qi] === k ? ' bad' : '')) : '') + '" data-vq="' + qi + '" data-vv="' + k + '" ' + (r ? 'disabled' : '') + '><span>' + 'ABCD'[k] + '</span>' + E(o) + '</button>').join('')) + (r && Array.isArray(q.porque) && p.ver[qi] != null && p.ver[qi] !== q.certa && q.porque[p.ver[qi]] ? '<p class="xdwhy"><b>A tua escolha:</b> ' + E(q.porque[p.ver[qi]]) + '</p>' : '') + '</div>').join('') + '</div>';
    return h;
  }
  function navBtns(it, r) {
    const s = S.sess, last = s.i === s.list.length - 1;
    if (!r) {
      if (it.tipo === 'escrita') return '<button class="x8p l" id="xd-check">Verificar resposta</button>' + (s.att[KK(it)] ? '<button class="x8p gh" id="xd-give">Ver resposta-modelo</button>' : '');
      if (it.tipo === 'codigo') return '<button class="x8p l" id="xd-check">Verificar com os testes</button>' + ((s.att[KK(it)] || 0) >= 2 ? '<button class="x8p gh" id="xd-give">Ver solução</button>' : '');
      if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') return '<button class="x8p l" id="xd-check">Concluir exercício</button>';
      return '';
    }
    return '<button class="x8p l" id="xd-next">' + (last ? 'Ver resultado' : 'Seguinte') + '</button>';
  }
  function feedback(it, r) {
    let h = '<div class="xdfb ' + (r.ok ? 'ok' : 'bad') + '"><b>' + (r.ok ? (r.rt ? 'Certo · repetido, sem XP' : 'Certo! +10 XP') : (r.gaveup ? 'Vê como se faz' : 'Ainda não')) + '</b>';
    if (it.tipo === 'escrita' && r.g) h += '<ul class="xdcr">' + r.g.cr.map(x => '<li class="' + (x.hit ? 'ok' : '') + '">' + (x.hit ? '✓ ' : '○ ') + E(x.c.ideia) + '</li>').join('') + '</ul><div class="xdmodel"><b>Resposta-modelo</b><p>' + E(it.modelo || '') + '</p></div>';
    if (it.tipo === 'codigo') h += (r.tests ? '<ul class="xdcr">' + r.tests.map(t => '<li class="' + (t.ok ? 'ok' : '') + '">' + (t.ok ? '✓ ' : '✗ ') + E(t.msg || t.codigo) + (t.err && !t.ok ? '<small>' + E(t.err) + '</small>' + ptErr(t.err) : '') + '</li>').join('') + '</ul>' : '') + (r.gaveup || r.ok ? '<div class="xdmodel"><b>' + (r.ok ? 'Uma solução possível' : 'Solução') + '</b><pre>' + E(it.solucao || '') + '</pre></div>' : '');
    if ((it.tipo === 'desenho' || it.tipo === 'tarefa3d') && FB && fbUser && !isAnon()) h += '<button class="x8p gh sm xdpeer" id="xd-peer">Pedir a um colega do grupo para confirmar</button><p class="xdhint">A imagem vai só para o teu grupo de estudo e é apagada ao fim de 30 dias.</p>';
    if ((it.tipo === 'mc') && Array.isArray(it.porque)) { if (!r.ok && typeof r.ans === 'number' && it.porque[r.ans]) h += '<p class="xdwhy"><b>A tua escolha:</b> ' + E(String(it.porque[r.ans]).replace(/^Errado:\s*/i, '')) + '</p>'; if (it.porque[it.certa]) h += '<p class="xdwhy ok"><b>A certa:</b> ' + E(String(it.porque[it.certa]).replace(/^Certo:\s*/i, '')) + '</p>'; }
    if (it.explicacao && !(it.tipo === 'mc' && Array.isArray(it.porque) && r.ok)) h += '<p>' + E(it.explicacao) + '</p>';
    return h + '</div>';
  }
  function finish(it, ok, ans, extra) {
    const s = S.sess; const rt = record(it._d || S.disc, it, ok, ans); s.res[KK(it)] = Object.assign({ ok, ans, rt }, extra || {});
    if (!(it.id in s.first)) s.first[it.id] = !!ok;
    s.combo = ok ? s.combo + 1 : 0; s.best = Math.max(s.best, s.combo);
    if (ok && s.combo >= 3 && s.combo % 3 === 0) { try { if (typeof floatXP === 'function') floatXP(s.combo + ' seguidas!'); } catch (e) { } }
    // à moda do Duolingo: o que falhou volta no fim da lição, até acertares
    if (!ok && s.requeue && !s.exam && !it._rq && ['mc', 'vf'].includes(it.tipo)) s.list.push(Object.assign({}, it, { _rq: 1, _key: it.id + '#2' }));
    render();
    setTimeout(() => { const f = document.querySelector('.xdfb,#xd-next'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
  }
  function bindSess(el, it) {
    const s = S.sess, q = sel => el.querySelector(sel);
    el.querySelectorAll('[data-xs="quit"]').forEach(b => b.onclick = () => { S.sess = null; render(); });
    const pe = q('#xd-peer'); if (pe) pe.onclick = () => peer(it, s.drafts[KK(it)] || {});
    const hp = q('#xd-help'); if (hp) hp.onclick = () => { s.help = s.help || {}; s.help[KK(it)] = 1; const ta0 = q('#xd-ta'); if (ta0) s.drafts[KK(it)] = ta0.value; render(); };
    const sp = q('#xd-spk'); if (sp) sp.onclick = () => speak(it._excerto);
    const nx = q('#xd-next'); if (nx) nx.onclick = () => { if (s.i < s.list.length - 1) { s.i++; render(); scrollTo(0, 0); } else { s.done = true; render(); scrollTo(0, 0); } };
    const again = q('#xd-again'); if (again) again.onclick = () => start(s.j, shuffle(s.list.filter(x => !(s.res[KK(x)] && s.res[KK(x)].ok))), s.title);
    const back = q('#xd-end'); if (back) back.onclick = () => { S.sess = null; S.noScroll = false; render(); };
    const cont = q('#xd-cont'); if (cont) cont.onclick = () => startNode(s.j, cont.dataset.n);
    const fr = q('#xd-frev'); if (fr) fr.onclick = () => { s.drafts[KK(it)] = 1; render(); };
    const adv = () => { if (s.i < s.list.length - 1) { s.i++; render(); } else { S.sess = null; T('Cartões revistos. Voltam quando for altura de os rever.'); render(); } };
    const fy = q('#xd-fyes'); if (fy) fy.onclick = () => { flashRate(it, true); s.combo++; s.best = Math.max(s.best, s.combo); adv(); };
    const fn = q('#xd-fno'); if (fn) fn.onclick = () => { flashRate(it, false); s.combo = 0; adv(); };
    if (s.done) return;
    el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const k = +b.dataset.o; finish(it, k === it.certa, k); });
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const v = b.dataset.v === 'true'; finish(it, v === it.certa, v); });
    if (it.tipo === 'escrita') {
      const ta = q('#xd-ta'); if (ta) { ta.oninput = () => { s.drafts[KK(it)] = ta.value; }; if (!s.res[KK(it)]) setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) { } }, 50); }
      const ck = q('#xd-check'); if (ck) ck.onclick = () => {
        const ans = (ta && ta.value || '').trim(); if (ans.length < 3) { T('Escreve a tua resposta primeiro.'); return; }
        const g = grade(it, ans); const att = (s.att[KK(it)] || 0) + 1; s.att[KK(it)] = att;
        if (g.ok || att >= 2 || s.exam) finish(it, g.ok, ans, { g });
        else { s.drafts[KK(it)] = ans; render(); const miss = g.cr.filter(x => !x.hit).map(x => x.c.ideia); const box = document.createElement('div'); box.className = 'xdfb bad'; box.innerHTML = '<b>' + (g.short ? 'Desenvolve mais a resposta.' : 'Quase! Falta ' + (miss.length === 1 ? 'uma ideia' : miss.length + ' ideias')) + '</b><p>Pensa em: ' + E(miss.slice(0, 2).join('; ')) + '.</p>'; const c = document.querySelector('.xdcard'); if (c) c.appendChild(box); }
      };
      const gv = q('#xd-give'); if (gv) gv.onclick = () => finish(it, false, (ta && ta.value) || '', { g: grade(it, (ta && ta.value) || ''), gaveup: true });
    }
    if (it.tipo === 'codigo') {
      const ed = q('#xd-code'), out = q('#xd-out');
      if (ed) { ed.oninput = () => { s.drafts[KK(it)] = ed.value; }; ed.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const a = ed.selectionStart; ed.value = ed.value.slice(0, a) + '    ' + ed.value.slice(ed.selectionEnd); ed.selectionStart = ed.selectionEnd = a + 4; s.drafts[KK(it)] = ed.value; } }; }
      const show = t => { s.out = s.out || {}; s.out[KK(it)] = t; if (out) out.textContent = t; };
      const run = (tests) => { show(PY ? 'A correr…' : 'A preparar o Python (só da primeira vez demora)…'); return pyRun(ed.value, tests).catch(e => ({ out: '', err: e.message, tests: [] })); };
      const rb = q('#xd-run'); if (rb) rb.onclick = () => run([]).then(r => { show((r.out || '') + (r.err ? (r.out ? '\n' : '') + r.err : '') || '(o programa não escreveu nada)'); const ex = el.querySelector('.xderr'); if (ex) ex.remove(); if (r.err && out) out.insertAdjacentHTML('afterend', '<div class="xderr">' + ptErr(r.err) + '</div>'); });
      const db = q('#xd-dica'); if (db) db.onclick = () => T(it.dica);
      const ck = q('#xd-check'); if (ck) ck.onclick = () => { ck.disabled = true; run(it.testes || []).then(r => {
        ck.disabled = false; let tests = r.tests || []; let ok;
        if (it.saida != null) { const okOut = String(r.out || '').trim() === String(it.saida).trim(); tests = [{ ok: okOut && !r.err, msg: 'O programa escreve exatamente: ' + String(it.saida).slice(0, 120), err: okOut ? '' : 'Escreveu: ' + String(r.out || '').slice(0, 200) }]; }
        if (r.err && !tests.length) tests = [{ ok: false, msg: 'O programa correu sem erros', err: r.err }];
        ok = tests.length > 0 && tests.every(t => t.ok) && !r.err;
        show((r.out || '') + (r.err ? (r.out ? '\n' : '') + r.err : ''));
        const att = (s.att[KK(it)] || 0) + 1; s.att[KK(it)] = att;
        if (ok || s.exam) finish(it, ok, ed.value, { tests });
        else { render(); const box = document.createElement('div'); box.className = 'xdfb bad'; box.innerHTML = '<b>Ainda não passou em todos os testes</b><ul class="xdcr">' + tests.map(t => '<li class="' + (t.ok ? 'ok' : '') + '">' + (t.ok ? '✓ ' : '✗ ') + E(t.msg || t.codigo) + (t.err && !t.ok ? '<small>' + E(t.err) + '</small>' + ptErr(t.err) : '') + '</li>').join('') + '</ul>'; const c = document.querySelector('.xdcard'); if (c) c.appendChild(box); }
      }); };
      const gv = q('#xd-give'); if (gv) gv.onclick = () => finish(it, false, ed.value, { gaveup: true });
    }
    if (it.tipo === 'desenho' || it.tipo === 'tarefa3d') {
      const p = s.drafts[KK(it)];
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
        if (!p.img && p.drawn) { try { const cv2 = q('#xd-cv'); if (cv2) p.cvimg = cv2.toDataURL('image/jpeg', .8); } catch (e) { } }
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
    const s = S.sess, ex = s.list.filter(x => x.tipo !== 'card' && !x._rq), n = ex.length;
    const ok1 = ex.filter(x => s.first[x.id]).length, okAll = ex.filter(x => (s.res[KK(x)] && s.res[KK(x)].ok) || s.list.some(y => y._rq && y.id === x.id && s.res[KK(y)] && s.res[KK(y)].ok)).length;
    const xp = ex.filter(x => s.res[KK(x)] && s.res[KK(x)].ok && !s.res[KK(x)].rt).length * 10;
    const stars = n ? (ok1 === n ? 3 : ok1 / n >= 0.75 ? 2 : 1) : 3, nota = n ? Math.round(ok1 / n * 200) / 10 : 0;
    try { if (stars === 3 && typeof burst === 'function') burst(innerWidth / 2, innerHeight / 3, 40); } catch (e) { }
    let nxt = null; if (s.node && s.j) { const st0 = stat(s.j.disc); nxt = nextNode(s.j, st0); }
    return '<div class="xdwrap"><div class="card xdsum"><div class="eyebrow">' + E(s.title) + '</div>' +
      (s.exam ? '<h1>' + ok1 + ' de ' + n + ' certas</h1><p class="xdnota">' + nota.toLocaleString('pt-PT') + ' valores</p>' : '<div class="xdstars">' + [1, 2, 3].map(k => '<span class="' + (k <= stars ? 'on' : '') + '">★</span>').join('') + '</div><h1>' + (stars === 3 ? 'Perfeito!' : stars === 2 ? 'Muito bem!' : 'Lição feita!') + '</h1>') +
      '<div class="xdsg"><div><b>+' + xp + '</b><span>XP</span></div><div><b>' + (n ? Math.round(ok1 / n * 100) : 0) + '%</b><span>à primeira</span></div><div><b>' + s.best + '</b><span>seguidas</span></div></div>' +
      (okAll < n ? '<p class="muted">Os que falhaste voltam na Revisão daqui a um dia.</p>' : (xp < okAll * 10 ? '<p class="muted">Os exercícios repetidos não dão XP outra vez.</p>' : '')) +
      '<div class="xdacts">' + (nxt && s.node ? '<button class="x8p l" id="xd-cont" data-n="' + E(nxt.id) + '">Continuar: ' + E(nxt.lab) + (nxt.m.id !== (s.j.byId[(ex[0] || {}).id] || {})._m ? ' · ' + E(short(nxt.m.titulo)) : '') + '</button>' : '') + (!s.node && okAll < n ? '<button class="x8p l" id="xd-again">Refazer os errados (' + (n - okAll) + ')</button>' : '') + '<button class="x8p gh" id="xd-end">Voltar ao trilho</button></div></div></div>';
  }

  /* ---------- revisão por um colega (desenhos e capturas do Blender) ---------- */
  function small(url) { return new Promise(res => { const im = new Image(); im.onload = () => { const k = Math.min(1, 640 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); let q = .7, u = c.toDataURL('image/jpeg', q); while (u.length > 150000 && q > .3) { q -= .1; u = c.toDataURL('image/jpeg', q); } res(u); }; im.onerror = () => res(null); im.src = url; }); }
  function peer(it, p) {
    const src = p.img || p.cvimg; if (!src) { T('Não há imagem para enviar.'); return; }
    const F = FB.Fs; F.getDocs(F.query(fcol('grupos'), F.where('membros.' + uid, '==', true))).then(qs => {
      const gs = qs.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(g => !g.apagado);
      if (!gs.length) { T('Entra ou cria um grupo de estudo na Comunidade para pedires a um colega.'); return; }
      const sh = X11.sheet('Pedir confirmação', '<p class="x8sub">Escolhe o grupo. Os colegas veem a imagem e os critérios e dizem-te se concordam.</p><div class="xddp">' + gs.map(g => '<button data-pg="' + E(g.id) + '" style="--xd:#9178E6">' + E(g.nome) + '</button>').join('') + '</div>');
      sh.sh.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { b.disabled = true; small(src).then(img => { if (!img) throw new Error('img');
        const D = DISC.find(x => x.id === (it._d || S.disc)) || { n: '' };
        const text = ('Pedido de revisão · ' + D.n + ': ' + String(it.enunciado || '').slice(0, 160) + ' · Critérios: ' + (it.criterios || []).slice(0, 4).join('; ')).slice(0, 490) + ' · Concordas?';
        return addRitmo('canais/' + b.dataset.pg + '/msgs', { uid, text, ts: Date.now(), img }, 'ultimaMsg'); }).then(() => { sh.close(); T('Enviado para o grupo. Vê as respostas na Comunidade.'); }).catch(e => { b.disabled = false; T(e && e.code === 'x-filtro' ? e.message : 'Não foi possível enviar. Tenta outra vez.'); }); });
    }).catch(() => T('Não foi possível ver os teus grupos. Verifica a internet.'));
  }

  /* ---------- erros do Python explicados em português ---------- */
  const PTE = [
    [/IndentationError|unexpected indent|expected an indented block/, 'Erro de indentação: as linhas dentro de um if, for, while ou def têm de ter 4 espaços a mais do que a linha de cima, todas iguais.'],
    [/SyntaxError/, 'Erro de sintaxe: falta ou sobra alguma coisa na escrita (dois pontos no fim do if/for/def, parênteses ou aspas por fechar).'],
    [/NameError: name '([^']+)'/, 'Usaste «$1» antes de o criar, ou escreveste o nome de forma diferente (maiúsculas contam).'],
    [/TypeError: can only concatenate str|unsupported operand|must be str, not/, 'Estás a juntar tipos diferentes (por exemplo texto + número). Converte com str() ou int().'],
    [/TypeError: .*takes (\d+) positional argument/, 'A função recebeu um número de argumentos diferente do que espera.'],
    [/TypeError/, 'Tipo errado: a operação não funciona com este tipo de valor.'],
    [/ValueError/, 'O valor não serve para esta operação (por exemplo int("abc")).'],
    [/ZeroDivisionError/, 'Divisão por zero: confirma o valor do divisor antes de dividir.'],
    [/IndexError/, 'Posição fora da lista: lembra-te que as posições começam em 0 e a última é len(lista) - 1.'],
    [/KeyError: (.+)/, 'A chave $1 não existe no dicionário. Usa .get() ou confirma com «in».'],
    [/AttributeError: '(\w+)' object has no attribute '(\w+)'/, 'O tipo «$1» não tem «$2»: confirma o nome do método ou o tipo da variável.'],
    [/RecursionError/, 'Recursão infinita: a função chama-se a si própria sem chegar ao caso de paragem.'],
    [/demorou mais de 8 segundos/, 'O programa não acabou: confirma se o ciclo tem uma condição que fica falsa.'],
    [/input\(\) não está disponível/, 'Aqui não há input(): usa os parâmetros da função ou valores no código.']
  ];
  function ptErr(err) { const e = String(err || ''); for (const [re, t] of PTE) { const m = e.match(re); if (m) { const ln = (e.match(/line (\d+)/) || [])[1]; return '<p class="xdpte"><b>O que quer dizer:</b> ' + E(t.replace(/\$(\d)/g, (_, d) => m[+d] || '')) + (ln ? ' (linha ' + ln + ')' : '') + '</p>'; } } return ''; }

  /* ---------- ouvir (Inglês): voz do próprio dispositivo, sem internet ---------- */
  function speak(txt) { try { const u = new SpeechSynthesisUtterance(String(txt || '').slice(0, 3000)); u.lang = 'en-GB'; u.rate = 0.95; const v = speechSynthesis.getVoices().find(x => /^en(-|_)GB/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^en/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { T('Este dispositivo não consegue ler o texto em voz alta.'); } }

  /* ---------- cartões de memória (a partir das ideias-chave das lições) ---------- */
  function cardsOf(j) { const out = []; j.mods.forEach(m => ((m.licao || {}).pontos || []).forEach((p, k) => { const ws = String(p).split(/\s+/); let best = -1, bl = 0; ws.forEach((w, i) => { const c = w.replace(/[^\p{L}\p{N}-]/gu, ''); if (c.length > bl && c.length >= 5 && !STOP.has(norm(c))) { bl = c.length; best = i; } }); if (best < 0) return; const word = ws[best].replace(/[^\p{L}\p{N}-]/gu, ''); out.push({ id: m.id + '-p' + k, m, front: ws.map((w, i) => i === best ? w.replace(word, '_____') : w).join(' '), word, full: p }); })); return out; }
  const FCK = d => 'x22-fc-' + d, DAYMS = 864e5, FGAP = [1, 3, 7, 16, 35];
  function flashDue(d, j) { const st0 = L.get(FCK(d), {}), now = Date.now(); return cardsOf(j).filter(c => !st0[c.id] || st0[c.id].due <= now).length; }
  function startFlash(j) { const st0 = L.get(FCK(j.disc), {}), now = Date.now(); let pool = cardsOf(j).filter(c => !st0[c.id] || st0[c.id].due <= now);
    const seenM = new Set(stat(j.disc) ? Object.keys(stat(j.disc)).map(id => (j.byId[id] || {})._m) : []); const pri = pool.filter(c => seenM.has(c.m.id)); pool = (pri.length >= 5 ? pri : pool).slice(0, 15);
    if (!pool.length) { T('Não há cartões para hoje. Volta amanhã!'); return; }
    S.sess = { j, list: pool.map(c => Object.assign({ tipo: 'flash' }, c)), i: 0, title: 'Cartões de memória', res: {}, att: {}, drafts: {}, combo: 0, best: 0, first: {}, flash: true }; render(); scrollTo(0, 0); }
  function flashRate(c, ok) { const st0 = L.get(FCK(S.sess.j.disc), {}), cur = st0[c.id] || { b: 0 }; const b = ok ? Math.min(FGAP.length - 1, (cur.b | 0) + 1) : 0; st0[c.id] = { b, due: Date.now() + (ok ? FGAP[b] : 0.3) * DAYMS }; L.set(FCK(S.sess.j.disc), st0); }

  /* ---------- revisão de hoje: o que erraste em todas as disciplinas, misturado ---------- */
  function dueAll() { const used = new Set(); (typeof allItems === 'function' ? allItems() : []).forEach(i => { if (i && i.k && i.k.indexOf('d:') === 0) used.add(i.k.split(':')[1]); });
    return Promise.all([...used].filter(d => DISC.some(x => x.id === d)).map(d => load(d).then(j => due(j, stat(d)).map(it => Object.assign(it, { _d: d }))).catch(() => []))).then(a => a.flat()); }
  function startToday() { dueAll().then(list => { if (!list.length) { T('Nada para rever hoje. Boa!'); return; } const j = CACHE[list[0]._d]; S.disc = list[0]._d; S.mod = null; host(); S.forceR = true; go('disc'); start(j, shuffle(list).slice(0, 10), 'Revisão de hoje', false, { requeue: true }); }); }

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
    return '<button class="subj on1 xdsubj" data-disc="' + E(s.disc) + '" style="--xd:' + D.cor + '"><span class="ic ' + s.g + '">' + ico(s.ic) + '</span><b>' + E(s.n) + '</b><span class="dim" style="font-size:.8rem">' + E(D.d) + '</span><div class="meta"><span>' + n + ' exercícios certos</span><span class="pill new">Nova</span></div></button>'; };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-disc],[data-subj^="d_"]'); if (!b) return; e.stopPropagation(); e.preventDefault(); open(b.dataset.disc || b.dataset.subj.slice(2)); }, true);
  const _rf = refresh; refresh = function () { if (view === 'disc') { try { renderChrome(); } catch (e) { } if (!(S.sess && document.querySelector('#v-disc .xdcard,#v-disc .xdsum')) && !document.querySelector('#v-disc .xdhero') || S.forceR) { S.forceR = false; render(); } try { if (typeof appBar === 'function') appBar(); } catch (e) { } return; } return _rf.apply(this, arguments); };
  // botão "voltar" do telemóvel dentro das disciplinas
  addEventListener('popstate', e => { if (view !== 'disc') return; if (document.querySelector('.x11sh,.x8sheet')) return; e.stopImmediatePropagation(); if (S.sess) { S.sess = null; render(); } else if (S.mod) { S.mod = null; render(); } else go('study'); try { history.pushState({ x17: 1, v: view }, ''); } catch (x) { } }, true);
  /* ---------- duelos nas disciplinas: 5 perguntas iguais para os dois (escolhidas pela semente do duelo) ---------- */
  function duelItems(j, seed) { const pool = allOf(j).filter(x => (x.tipo === 'mc' || x.tipo === 'vf') && !x._excerto).sort((a, b) => a.id < b.id ? -1 : 1); const r = seeded('duelo' + seed), a = pool.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a.slice(0, 5); }
  function duel(d) { load(d.disc).then(j => { S.disc = d.disc; S.mod = null; host(); S.forceR = true; go('disc'); start(j, duelItems(j, d.seed), 'Duelo com ' + (d.a === uid ? d.nB : d.nA), true, { duel: d.id, duelField: d.a === uid ? 'ra' : 'rb' }); }).catch(() => T('Não foi possível abrir o duelo. Verifica a internet.')); }
  function duelSend(s) { const ex = s.list.filter(x => x.tipo !== 'card'), v = Math.min(5, ex.filter(x => s.first[x.id]).length); try { localStorage.setItem('x19-dp', JSON.stringify({ id: s.duel, field: s.duelField, v })); } catch (e) { }
    const F = FB.Fs; F.updateDoc(fdoc('duelos/' + s.duel), { [s.duelField]: v }).then(() => { try { localStorage.removeItem('x19-dp'); } catch (e) { } T('Resultado do duelo enviado: ' + v + '/5.'); }).catch(() => T('O resultado fica guardado e é enviado quando houver ligação.')); }
  window.XD = { open, DISC, load, grade, stat, startToday, ptErr, duel };
  // Início: «Revisão de hoje» com o que erraste em todas as disciplinas novas
  let todayN = null, todayAt = 0;
  function homeCard() { const el = document.getElementById('v-home'); if (!el || el.querySelector('#xd-today')) return; if (todayN === null || Date.now() - todayAt > 60000) { todayAt = Date.now(); dueAll().then(l => { todayN = l.length; todayDs = new Set(l.map(x => x._d)).size; if (view === 'home') { const old = document.getElementById('xd-today'); if (old) old.remove(); homeCard(); } }); return; }
    if (!todayN) return; const b = document.createElement('button'); b.id = 'xd-today'; b.className = 'xdtoday'; b.innerHTML = '<span class="xdti">' + IC2.book + '</span><span><b>Revisão de hoje</b><small>' + todayN + ' exercício' + (todayN > 1 ? 's' : '') + ' que falhaste' + (todayDs > 1 ? ', de ' + todayDs + ' disciplinas' : '') + '</small></span><i>›</i>'; b.onclick = startToday;
    const anchor = el.querySelector('.x8goal,.goal,.card'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(b, anchor.nextSibling); else el.prepend(b); }
  let todayDs = 0;
  if (typeof renderHome === 'function') { const _rh = renderHome; renderHome = function () { const r = _rh.apply(this, arguments); try { homeCard(); } catch (e) { } return r; }; }
  try { if (view === 'home' || view === 'study') refresh(); } catch (e) { }

  /* ---------- estilos ---------- */
  const css = `
#v-disc{padding-bottom:110px}
.xdwrap{display:flex;flex-direction:column;gap:14px;max-width:820px;margin:0 auto}
.xdback{align-self:flex-start;border:0;background:var(--x8-s1);color:var(--x8-ink,#fff);font:700 14px var(--x8-head);padding:8px 14px;border-radius:999px;cursor:pointer}
.xdhero{display:flex;align-items:center;gap:16px;padding:20px;border-radius:24px;background:linear-gradient(140deg,color-mix(in srgb,var(--xd) 28%,transparent),var(--x8-s1));border:1px solid color-mix(in srgb,var(--xd) 40%,transparent)}
.xdhero>div{flex:1;min-width:0}.xdhero .eyebrow{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}.xdhero h1{font:800 clamp(24px,6vw,34px) var(--x8-head);margin:2px 0 4px;text-wrap:balance}.xdhero p{margin:0;color:var(--x8-ink2)}
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
.xdtop{display:flex;align-items:center;gap:10px;padding:4px 0}
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
.xdpre{margin:0;padding:10px 12px;border-radius:12px;background:#0B1020;color:#E6EDF7;font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;white-space:pre;overflow-x:auto}
.xdsubq{margin:0;line-height:1.55}
.subj.xdsubj{background:linear-gradient(150deg,var(--xd),color-mix(in srgb,var(--xd) 55%,#0A0F2B))!important;color:#0A0F2B!important}
.subj.xdsubj .dim,.subj.xdsubj .meta span{color:rgba(10,15,43,.78)!important}
.subj.xdsubj .ic{background:#0A0F2B!important;color:var(--xd)!important}
html.x13light .xdtag.ex{color:#8A6100}
.xdquick{display:flex;gap:8px;flex-wrap:wrap}.xdquick button{flex:1 1 70px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border-radius:16px;border:1px solid var(--x8-line,rgba(255,255,255,.14));background:var(--x8-s1);color:inherit;cursor:pointer}
.xdquick b{font:800 18px var(--x8-head);display:flex;align-items:center;justify-content:center;min-height:22px}.xdquick span{font-size:12px;color:var(--x8-ink2)}
.xdtrail .node.s1 .hex,.xdtrail .node.s2 .hex,.xdtrail .node.s3 .hex{background:linear-gradient(160deg,var(--xd),color-mix(in srgb,var(--xd) 45%,#1a2a99))}
.xdtrail .node.s3 .hex{box-shadow:0 0 0 3px #FFC93C inset}
.xdtrail .node.prog .hex{background:var(--xd);color:#0A0F2B}.xdtrail .node.rec .ring2{background:var(--xd)}
.xdtrail .node.lock{opacity:.55}.xdtrail .node.lock .hex{background:var(--x8-s2,rgba(255,255,255,.08))}
.xdtrail .node.xdboss .hex{transform:scale(1.08)}
.xdchap button{border:0;background:none;color:var(--xd);font:700 .74rem var(--f-mono,ui-monospace);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:normal;text-align:center;max-width:280px}
.xdteach{padding:22px 20px;border-radius:24px;background:linear-gradient(150deg,color-mix(in srgb,var(--xd) 26%,var(--x8-s1)),var(--x8-s1));border:1px solid color-mix(in srgb,var(--xd) 45%,transparent);min-height:38vh;display:flex;flex-direction:column;justify-content:center;gap:12px}
.xdteach p{font:600 clamp(18px,4.8vw,22px)/1.5 var(--x8-head);margin:0;text-wrap:pretty}.xdteach .eyebrow{color:var(--xd)}
.xdflash p.xdhint{font:400 15px/1.5 inherit}
.xdcombo{font:800 13px var(--x8-head);color:#FFC93C;white-space:nowrap}
.xdbar i.cd{background:color-mix(in srgb,var(--xd) 45%,transparent)}.xdbar i.cd.ok{background:var(--xd)}
.xdrq{margin:0;font:700 13px var(--x8-head);color:#FFC93C}
.xdhelp{padding:10px 12px;border-radius:12px;background:var(--x8-s2,rgba(255,255,255,.06));font-size:14px}.xdhelp ul{margin:6px 0 0;padding-left:18px;line-height:1.5}
.xdlink{align-self:flex-start;border:0;background:none;color:var(--xd);font:700 14px inherit;padding:0;cursor:pointer;text-decoration:underline}
.xdwhy{margin:0;font-size:15px}.xdwhy b{color:#FF7A5C}.xdwhy.ok b{color:#2DD4A0}
.xdpte{margin:4px 0 0;font:500 14px/1.45 inherit;color:inherit;font-family:inherit}.xderr .xdpte{padding:10px 12px;border-radius:12px;background:rgba(255,201,60,.1)}
.xdspk{align-self:flex-start;margin:0;display:inline-flex;align-items:center;gap:6px}
.xdstars{display:flex;justify-content:center;gap:8px;font-size:44px;line-height:1}.xdstars span{color:var(--x8-s2,rgba(255,255,255,.15))}.xdstars span.on{color:#FFC93C;text-shadow:0 0 18px rgba(255,201,60,.5)}
.xdsg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.xdsg div{padding:10px;border-radius:14px;background:var(--x8-s2,rgba(255,255,255,.06));display:flex;flex-direction:column}.xdsg b{font:800 22px var(--x8-head)}.xdsg span{font-size:12px;color:var(--x8-ink2)}
.xdtoday{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 0;padding:14px;border-radius:20px;border:1px solid rgba(255,201,60,.45);background:linear-gradient(140deg,rgba(255,201,60,.16),transparent);color:inherit;text-align:left;cursor:pointer}
.xdtoday span:nth-child(2){flex:1;display:flex;flex-direction:column;gap:2px}.xdtoday b{font:800 16px var(--x8-head)}.xdtoday small{color:var(--x8-ink2);font-size:13px}.xdtoday i{font-style:normal;font-size:22px;color:var(--x8-ink2)}
.xdti{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#FFC93C;color:#0A0F2B;flex:none}
html.x13light .xdcombo,html.x13light .xdrq{color:#8A6100}
.xdpeer{align-self:flex-start;margin:4px 0 0}
.xddp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.xddp button{padding:14px 10px;border-radius:16px;border:2px solid var(--xd);background:color-mix(in srgb,var(--xd) 14%,transparent);color:inherit;font:700 15px var(--x8-head);cursor:pointer}

`;
  const stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);
})();
