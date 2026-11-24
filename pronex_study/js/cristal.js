/* Pronex_Study · Cristal (1.29)
   Gera em vetor, no próprio dispositivo, os elementos visuais na linguagem do logótipo PRONEX:
   facetas de cristal azul, ciano e violeta. Cada conceito, tema, tipo de exercício, disciplina,
   conquista e estado vazio recebe um desenho próprio, sempre igual para o mesmo id (semente).
   Nada é descarregado: os desenhos são SVG feitos aqui e guardados em memória. */
(function () {
  'use strict';
  const NAVY = '#0B0D1A', VIO = '#8B4CF0', CY = '#33D6FF', BL = '#2E7FE0';
  const cache = new Map();
  const memo = (k, f) => { if (cache.has(k)) return cache.get(k); const v = f(); if (cache.size > 1500) cache.clear(); cache.set(k, v); return v; };

  // semente → números estáveis
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = hash(seed) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; }
  // cores
  const hx = c => { c = String(c || '#9B85FF'); if (/^rgb/.test(c)) return c.match(/[\d.]+/g).slice(0, 3).map(Number); c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); };
  const toH = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toH(A.map((v, i) => v + (B[i] - v) * t)); };
  const shade = (c, t) => t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t);
  const uri = svg => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  // luz de cima à esquerda: a cor de cada faceta depende da direção da sua face e de um pouco de ruído
  function lit(base, tri, r, amt) {
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    const ux = tri[1][0] - tri[0][0], uy = tri[1][1] - tri[0][1], vx = tri[2][0] - tri[0][0], vy = tri[2][1] - tri[0][1];
    const z = Math.abs(ux * vy - uy * vx) + 1, nx = (uy - vy) / Math.sqrt(z), ny = (vx - ux) / Math.sqrt(z);
    const l = (-nx * 0.6 - ny * 0.8) * 0.18 + (0.5 - cy / 120) * 0.35 + (r() - 0.5) * (amt || 0.22);
    return shade(base, Math.max(-0.55, Math.min(0.6, l)));
  }

  /* ---------- 1. Cristal hexagonal (nós dos conceitos e dos tipos de exercício) ---------- */
  // estado: 'done' (cor plena), 'prog' (meio), 'new' (apagado), 'boss' (âmbar → violeta)
  function hexFacets(seed, color, state) {
    return memo('h|' + seed + '|' + color + '|' + state, () => {
      const r = rng(seed), W = 100, H = 112, cx = 50 + (r() - 0.5) * 10, cy = 56 + (r() - 0.5) * 12;
      const O = [[50, 0], [100, 28], [100, 84], [50, 112], [0, 84], [0, 28]];
      const k = 0.42 + r() * 0.16, I = O.map(([x, y]) => [cx + (x - cx) * k + (r() - 0.5) * 6, cy + (y - cy) * k + (r() - 0.5) * 6]);
      let base = color, sat = 1;
      if (state === 'new') { base = mix(color, '#2A2F55', 0.72); sat = 0.5; }
      else if (state === 'prog') base = mix(color, '#24307A', 0.38);
      else if (state === 'boss') base = '#FFB21E';
      const tris = [];
      for (let i = 0; i < 6; i++) {
        const a = O[i], b = O[(i + 1) % 6], c = I[(i + 1) % 6], d = I[i];
        const m = [(a[0] + b[0]) / 2 + (r() - 0.5) * 8, (a[1] + b[1]) / 2 + (r() - 0.5) * 8];
        tris.push([a, m, d], [m, c, d], [m, b, c]);
        tris.push([[cx, cy], d, c]);
      }
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">';
      tris.forEach((t, i) => {
        let col = lit(base, t, r, 0.24 * sat);
        if (state === 'boss') col = mix(col, i % 3 ? '#FF5C7A' : VIO, (t[0][1] + t[1][1] + t[2][1]) / 3 / 140);
        else if (state !== 'new' && r() < 0.12) col = mix(col, VIO, 0.35);
        else if (state !== 'new' && r() < 0.1) col = mix(col, CY, 0.3);
        s += '<polygon points="' + pts(t) + '" fill="' + col + '"/>';
      });
      // arestas claras, como as linhas brancas do logótipo
      s += '<polygon points="' + pts(I) + '" fill="none" stroke="#fff" stroke-opacity="' + (state === 'new' ? 0.12 : 0.35) + '" stroke-width="1.6"/>';
      s += I.map((p, i) => '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + O[i][0] + '" y2="' + O[i][1] + '" stroke="#fff" stroke-opacity="' + (state === 'new' ? 0.08 : 0.22) + '" stroke-width="1.2"/>').join('');
      s += '<polygon points="50,2 98,29 50,22 2,29" fill="#fff" fill-opacity="' + (state === 'new' ? 0.04 : 0.16) + '"/></svg>';
      return uri(s);
    });
  }

  /* ---------- 2. Faixa de cristal (cabeçalhos de tema e de disciplina) ---------- */
  function band(seed, color, dark, w, h) {
    w = w || 640; h = h || 140;
    return memo('b|' + seed + '|' + color + '|' + dark + '|' + w + '|' + h, () => {
      const r = rng('band' + seed), cols = 10, rows = 3, dx = w / cols, dy = h / rows, P = [];
      for (let j = 0; j <= rows; j++) { P.push([]); for (let i = 0; i <= cols; i++) {
        const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
        P[j].push([i * dx + (edgeX ? 0 : (r() - 0.5) * dx * 0.8), j * dy + (edgeY ? 0 : (r() - 0.5) * dy * 0.8)]); } }
      const tint = mix(color, '#6F4FF2', 0.3), base = dark ? mix(tint, '#0E1130', 0.6) : mix(tint, '#FFFFFF', 0.74);
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">';
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i];
        const fade = i / cols; // mais vivo à direita, para o texto à esquerda ler bem
        [[a, b, c], [a, c, d]].forEach(t => {
          let col = lit(base, t, r, dark ? 0.16 : 0.1);
          col = mix(col, dark ? tint : shade(tint, 0.35), fade * (dark ? 0.42 : 0.28));
          if (r() < 0.07) col = mix(col, VIO, dark ? 0.3 : 0.15);
          s += '<polygon points="' + pts(t) + '" fill="' + col + '" stroke="' + col + '" stroke-width=".6"/>';
        });
      }
      s += '</svg>';
      return uri(s);
    });
  }

  /* ---------- 3. Fundo da app (cristal muito discreto atrás de tudo) ---------- */
  function appBg(dark) {
    return memo('bg|' + dark, () => {
      const r = rng('fundo-pronex'), w = 1200, h = 900, cols = 9, rows = 7, dx = w / cols, dy = h / rows, P = [];
      for (let j = 0; j <= rows; j++) { P.push([]); for (let i = 0; i <= cols; i++) P[j].push([i * dx + (i % cols ? (r() - 0.5) * dx * 0.7 : 0), j * dy + (j % rows ? (r() - 0.5) * dy * 0.7 : 0)]); }
      const base = dark ? '#0B0D1A' : '#F6F5FB';
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">';
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i];
        [[a, b, c], [a, c, d]].forEach(t => {
          const cy = (t[0][1] + t[1][1] + t[2][1]) / 3, cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
          const glow = Math.max(0, 1 - Math.hypot(cx - w * 0.8, cy - h * 0.05) / (w * 0.75));
          let col = shade(base, dark ? (r() * 0.035 + glow * 0.06) : -(r() * 0.02 + glow * 0.025));
          if (glow > 0.25 && r() < 0.35) col = mix(col, dark ? '#1C2D6E' : '#E4E0FF', dark ? 0.35 * glow : 0.4 * glow);
          s += '<polygon points="' + pts(t) + '" fill="' + col + '" stroke="' + col + '" stroke-width=".8"/>';
        });
      }
      return uri(s + '</svg>');
    });
  }

  /* ---------- 4. Medalhas de conquista (escudo de cristal, cor da conquista) ---------- */
  const SH = [[14, 28], [50, 18], [86, 28], [83, 70], [50, 100], [17, 70]];
  function medal(seed, color, glyph, locked) {
    return memo('m|' + seed + '|' + color + '|' + locked, () => {
      const r = rng('medal' + seed), C = [50 + (r() - 0.5) * 6, 57 + (r() - 0.5) * 6];
      const base = locked ? '#3A3F63' : color, I = SH.map(([x, y]) => [C[0] + (x - C[0]) * 0.6, C[1] + (y - C[1]) * 0.6]);
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 8 100 98" class="crmed" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
      s += '<polygon points="' + pts(SH) + '" fill="' + NAVY + '" stroke="' + NAVY + '" stroke-width="6" stroke-linejoin="round"/>';
      for (let k = 0; k < 6; k++) {
        const a = SH[k], b = SH[(k + 1) % 6], c = I[(k + 1) % 6], d = I[k];
        [[a, b, d], [b, c, d], [C, d, c]].forEach(t => { let col = lit(base, t, r, locked ? 0.08 : 0.26); if (!locked && r() < 0.15) col = mix(col, VIO, 0.35); s += '<polygon points="' + pts(t) + '" fill="' + col + '"/>'; });
      }
      s += '<polygon points="' + pts(I) + '" fill="none" stroke="#fff" stroke-opacity="' + (locked ? 0.15 : 0.6) + '" stroke-width="1.6"/>';
      if (glyph) s += '<g transform="translate(36 41) scale(1.17)" color="' + (locked ? '#8A8FB5' : '#fff') + '" style="color:' + (locked ? '#8A8FB5' : '#fff') + '">' + glyph.replace(/<svg[^>]*>|<\/svg>/g, '') + '</g>';
      return s + '</svg>';
    });
  }

  /* ---------- 5. Cenas para os ecrãs vazios ---------- */
  function scene(seed, color) {
    return memo('s|' + seed + '|' + color, () => {
      const r = rng('cena' + seed), w = 320, h = 150;
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMax meet">';
      // chão de cristal
      const g = [];
      for (let i = 0; i <= 8; i++) g.push([i * 40 + (i % 8 ? (r() - 0.5) * 14 : 0), 118 + (r() - 0.5) * 10]);
      for (let i = 0; i < 8; i++) { const t = [g[i], g[i + 1], [(g[i][0] + g[i + 1][0]) / 2, 150]]; s += '<polygon points="' + pts(t) + '" fill="' + lit(mix(color, '#141836', 0.55), t, r, 0.2) + '" opacity=".75"/>'; }
      // cristais (3 a 5) que nascem do chão, dos lados, para deixar o centro ao Nex
      const n = 3 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const left = k % 2 === 0, x = left ? 20 + r() * 80 : 220 + r() * 80, hgt = 40 + r() * 60, wd = 14 + r() * 14, y = 120;
        const top = [x + (r() - 0.5) * 8, y - hgt], L = [x - wd, y - hgt * 0.25], R = [x + wd, y - hgt * 0.3], B = [x, y + 4];
        const col = r() < 0.3 ? VIO : r() < 0.5 ? CY : color;
        [[top, L, B], [top, B, R]].forEach((t, i) => s += '<polygon points="' + pts(t) + '" fill="' + shade(col, i ? -0.25 : 0.15) + '" opacity=".9"/>');
        s += '<line x1="' + top[0].toFixed(1) + '" y1="' + top[1].toFixed(1) + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>';
      }
      // brilhos
      for (let k = 0; k < 6; k++) { const x = r() * w, y = r() * 90, z = 2 + r() * 3; s += '<path d="M' + x.toFixed(1) + ' ' + (y - z).toFixed(1) + 'l' + (z * 0.35).toFixed(1) + ' ' + (z * 0.65).toFixed(1) + 'l' + (z * 0.65).toFixed(1) + ' ' + (z * 0.35).toFixed(1) + 'l-' + (z * 0.65).toFixed(1) + ' ' + (z * 0.35).toFixed(1) + 'l-' + (z * 0.35).toFixed(1) + ' ' + (z * 0.65).toFixed(1) + 'l-' + (z * 0.35).toFixed(1) + '-' + (z * 0.65).toFixed(1) + 'l-' + (z * 0.65).toFixed(1) + '-' + (z * 0.35).toFixed(1) + 'l' + (z * 0.65).toFixed(1) + '-' + (z * 0.35).toFixed(1) + 'z" fill="#fff" opacity=".7"/>'; }
      return uri(s + '</svg>');
    });
  }

  /* ---------- Pintar o ecrã: aplica os desenhos a cada elemento pela sua semente ---------- */
  const isDark = () => !document.documentElement.classList.contains('x13light');
  // 1.39: a cor --xd vem sempre em linha (style) de um antepassado; procurá-la assim evita getComputedStyle,
  // que obrigava o navegador a recalcular os estilos da página a cada nó (mais de 250 ms ao abrir uma disciplina num telemóvel lento).
  const varColor = el => { try { for (let x = el; x && x.style; x = x.parentElement) { const v = x.style.getPropertyValue('--xd'); if (v) return v.trim(); } return ''; } catch (e) { return ''; } };
  const MAT = '#9B85FF';
  function stateOf(btn) { const c = btn.classList; if (btn.dataset.lock) return 'new'; if (c.contains('boss') || c.contains('xdboss')) return 'boss'; if (c.contains('s1') || c.contains('s2') || c.contains('s3')) return 'done'; if (c.contains('prog') || c.contains('rec')) return 'prog'; return 'new'; }
  const MEDC = ['#33D6FF', '#2E7FE0', '#FF8A3D', '#FF5C7A', '#7C6CFF', '#8B4CF0', '#FFB21E', '#FFC93C', '#2DD4A0', '#4F8CFF', '#E879C0', '#7FE7FF'];
  function paint(root) {
    root = root || document;
    const dk = isDark();
    // nós dos trilhos (disciplinas e Matemática)
    root.querySelectorAll('.node .hex').forEach(hx => {
      const b = hx.closest('.node'); if (!b) return;
      const seed = b.dataset.n || b.dataset.node || b.dataset.mode || hx.textContent || 'x', st = stateOf(b);
      let col = varColor(b) || MAT; if (b.classList.contains('s3')) col = mix(col, CY, 0.28); else if (b.classList.contains('s1')) col = mix(col, '#1a2a99', 0.25); const key = seed + st + col;
      if (hx.dataset.cr === key) return; hx.dataset.cr = key;
      hx.style.setProperty('--crg', hexFacets(seed, col, st)); hx.classList.add('crx');
    });
    // cabeçalhos de tema e capítulos
    root.querySelectorAll('.xdchap, #v-path .chap, .chap').forEach(ch => {
      if (ch.querySelector('button[data-xd="mod"]')) return;
      const seed = (ch.textContent || '').trim().slice(0, 60), col = varColor(ch) || MAT, key = seed + dk + col;
      if (ch.dataset.cr === key) return; ch.dataset.cr = key;
      ch.style.setProperty('--crb', band(seed, col, dk)); ch.classList.add('crband');
    });
    // topo da disciplina
    root.querySelectorAll('.xdhero').forEach(he => {
      const seed = 'hero' + (he.textContent || '').trim().slice(0, 30), col = varColor(he) || MAT, key = seed + dk + col;
      if (he.dataset.cr === key) return; he.dataset.cr = key;
      he.style.setProperty('--crhero', band(seed, col, dk, 720, 220)); he.classList.add('crhero');
    });
    // ícones das disciplinas (Início e Estudar)
    root.querySelectorAll('.subj .ic, .x8subj .si, .soonc .ic').forEach(ic => {
      const card = ic.closest('.subj,.x8subj,.soonc') || ic; let col = varColor(ic) || varColor(card);
      if (!col) { try { const t = (card.textContent || '').trim(), D = (window.XD ? XD.DISC : []).find(d => t.indexOf(d.n) === 0 || (d.curto && t.indexOf(d.curto) === 0)); col = D ? D.cor : /^Matem/.test(t) ? '#7C5CFF' : ''; } catch (e) { } }
      if (!col) { const bc = getComputedStyle(ic).backgroundColor; col = bc && !/rgba\(0, 0, 0, 0\)|transparent/.test(bc) ? bc : MAT; }
      const seed = 'disc' + ((card.textContent || '').trim().slice(0, 16)), key = seed + col;
      if (ic.dataset.cr === key) return; ic.dataset.cr = key;
      ic.style.setProperty('--crg', hexFacets(seed, col, 'done')); ic.classList.add('crgem');
    });
    // medalhas das conquistas (Perfil)
    root.querySelectorAll('.badges .badge').forEach((bd, i) => {
      const sv = bd.querySelector('svg.x11med'); if (!sv || sv.classList.contains('crmed')) return;
      const locked = bd.classList.contains('locked'), w = document.createElement('span');
      w.innerHTML = medal('b' + i + (bd.querySelector('b') || {}).textContent, MEDC[i % MEDC.length], '', locked);
      const n = w.firstChild; n.classList.add('x11med'); n.setAttribute('width', '56'); n.setAttribute('height', '66'); sv.replaceWith(n);
    });
    // ecrãs vazios
    root.querySelectorAll('.x8empty').forEach(em => {
      const seed = (em.textContent || '').trim().slice(0, 40), key = seed + dk;
      if (em.dataset.cr === key) return; em.dataset.cr = key;
      em.style.setProperty('--crscene', scene(seed, dk ? BL : '#B9A9FF')); em.classList.add('crscene');
    });
  }
  const CSS = `.hex.crx,.crgem,html body :is(#v-study,#v-home,#v-disc,#v-module,main) .subj .ic.crgem.crgem{background:var(--crg) center/100% 100% no-repeat!important}
html body :is(#v-study,#v-home,#v-disc,#v-module,main) .subj .ic.crgem.crgem,html body :is(#v-study,#v-home,#v-disc,#v-module,main) .subj .ic.crgem.crgem svg{color:#fff!important}.hex.crx::after{display:none}
.hex.crx svg{color:#fff!important;filter:drop-shadow(0 1px 2px rgba(5,8,30,.55))}
.node.new .hex.crx svg,.node.lock .hex.crx svg{color:rgba(255,255,255,.55)!important}
html.x13light .node.new .hex.crx svg{color:rgba(255,255,255,.8)!important}
.node .hex.crx{box-shadow:none!important}
.node:not(.new):not(.lock) .hex.crx{filter:drop-shadow(0 6px 10px color-mix(in srgb,var(--xd,#7C6CFF) 35%,transparent))}
.chap.crband{background:var(--crb) center/cover no-repeat!important;border-radius:18px;padding:14px 16px!important;border:1px solid color-mix(in srgb,var(--xd,#7C6CFF) 30%,transparent);overflow:hidden}
.xdhero.crhero{background-image:linear-gradient(100deg,var(--x8-s1,#12152B) 8%,color-mix(in srgb,var(--x8-s1,#12152B) 55%,transparent) 55%,transparent),var(--crhero)!important;background-size:cover!important;background-position:center!important}
html.x13light .xdhero.crhero{background-image:linear-gradient(100deg,#fff 10%,rgba(255,255,255,.6) 55%,rgba(255,255,255,.1)),var(--crhero)!important}
.crgem{clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);border-radius:0!important;color:#fff!important;box-shadow:none!important}
.crgem svg{color:#fff!important;filter:drop-shadow(0 1px 2px rgba(5,8,30,.5))}
.x8subj .si.crgem{width:58px;height:64px}
.badge .x11med.crmed+.x11mi{color:#fff!important;filter:drop-shadow(0 1px 2px rgba(5,8,30,.6))}.badge .x11med.crmed+.x11mi.off{color:rgba(255,255,255,.4)!important}
@media (prefers-reduced-motion:no-preference){.node .hex.crx{transition:transform .2s}.node:hover .hex.crx{transform:translateY(-2px)}}
`;
  let pend = 0;
  function schedule() { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; try { paint(document); } catch (e) { } }); }
  function bg() { try { const dk = isDark(); document.documentElement.style.setProperty('--crbg', appBg(dk)); } catch (e) { } }
  function start() {
    try { if (!document.getElementById('crcss')) { const st = document.createElement('style'); st.id = 'crcss'; st.textContent = CSS; document.head.appendChild(st); } } catch (e) { }
    bg(); paint(document);
    const host = document.body;   // 1.44.1: o corpo inteiro: as janelas e avisos abrem fora do <main>
    try { new MutationObserver(schedule).observe(host, { childList: true, subtree: true }); } catch (e) { }
    try { new MutationObserver(() => { bg(); schedule(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) { }
    try { new MutationObserver(schedule).observe(document.body, { childList: true }); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.CR = { hexFacets, band, appBg, medal, scene, paint, mix, shade, count: () => cache.size };
})();
