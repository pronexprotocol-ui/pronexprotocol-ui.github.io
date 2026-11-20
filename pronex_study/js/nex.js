/* Pronex_Study · nex.js (1.33)
   O Nex: o tutor da app.

   Como responde
   1. Lê a matéria que já está na app (conceitos, lições, fichas, glossário, fórmulas de Matemática e
      exercícios com explicação) e monta um índice de pesquisa no próprio dispositivo.
   2. Percebe o que foi pedido (definição, diferença, exemplo, resumo, exercício, conta, explicação de um
      exercício) e responde com o texto da matéria. Funciona em qualquer dispositivo e sem internet.
   3. Se o modelo opcional estiver instalado (WebLLM, ver IA8 em js/06), usa-o só como reforço: para
      reescrever por outras palavras ou tentar o que não está na matéria, sempre com a matéria encontrada
      como contexto. Se o modelo falhar, fica a resposta da matéria.

   Usado por: ecrã do Nex (tutorHTML / askTutor), folha «Pergunta ao Nex» dos exercícios (js/disciplinas.js),
   explicação e análise de Matemática (js/04-ecras.js). */
(() => {
  'use strict';
  const TNEX = window.TNEX = {};   // «NEX» já é o desenho do mascote (js/05); o tutor fica em TNEX

  /* ================= 1. Texto ================= */
  const B0 = '\u0002', B1 = '\u0003';                       // marcas de negrito dentro do texto das respostas
  const b = s => B0 + s + B1;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const semAc = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nrm = s => semAc(s).toLowerCase();
  const STOP = new Set(('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre e ou mas que se como quando onde qual quais quem porque pois ja nao sim me te lhe vos lhes eu tu ele ela eles elas isto isso aquilo este esta estes estas esse essa esses essas aquele aquela ao aos pelo pela pelos pelas num numa meu minha teu tua seu sua ser estar ter haver sao foi era ha tem sou estao muito mais menos tambem so ate cada ' +
    'the of and to in is are an what how do does you it for on with this that be was were').split(' '));
  // palavras do pedido (não da matéria): saem da pesquisa
  const PERG = new Set(('explica explicar explicas explique explicame diz dizer diga dizme quero queria saber sabes podes pode poderias favor sff pf significa significado define definir definicao exemplo exemplos diferenca diferencas distinguir distingue distinguem resume resumo resumir resumidamente fala falar ajuda ajudar ajudame preciso duvida perceber percebo percebi entender entendo funciona funcionam serve servem usa usar uso usam utiliza utilizar calculo calcular calcula calculam faz fazer faco identifico identificar identifica devo tenho posso existe existem tipo tipos coisa nex ola obrigado obrigada licao licoes materia tema capitulo unidade modulo aula manual pagina disciplina ' +
    'what how when why mean means explain difference between example use').split(' '));
  function rad(w) {                                          // radical leve: plural e género
    if (w.length < 4 || /^\d/.test(w)) return w;
    let x = w;
    if (/(oes|aes)$/.test(x)) x = x.slice(0, -3) + 'ao';
    else if (x.length > 4 && /[aeo]is$/.test(x)) x = x.slice(0, -2) + 'l';
    else if (/ns$/.test(x)) x = x.slice(0, -2) + 'm';
    else if (/[^s]s$/.test(x)) x = x.slice(0, -1);
    if (x.length > 6 && /idade$/.test(x)) x = x.slice(0, -3);                       // validade → valid (como válido)
    else if (x.length > 4 && /[rz]e$/.test(x)) x = x.slice(0, -1);
    else if (x.length > 4 && /[^aeiou][ao]$/.test(x)) x = x.slice(0, -1);          // género: válido/válida, direto/direta
    return x;
  }
  const pal = s => nrm(s).match(/[a-z0-9]+/g) || [];
  const toks = s => pal(s).filter(w => w.length > 1 && !STOP.has(w)).map(rad);
  const curto = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '') + '…' : s; };
  const frase1 = s => { s = String(s || '').trim(); const m = /^(.{25,}?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; };
  const titMod = t => String(t || '').replace(/^(Unidade|Módulo|Modulo|Unit|Tema|Capítulo)\s+[\dIVX.]+\s*[—–:-]\s*/i, '');
  const semTags = h => { const d = document.createElement('div'); d.innerHTML = String(h == null ? '' : h); return d.textContent.replace(/\s+/g, ' ').trim(); };
  function formTxt(html) {                                   // cartão de fórmula (HTML) → texto de uma linha por passo
    const d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('.fr').forEach(f => { const p = [...f.children].map(c => c.textContent.trim()), par = x => /[\s+−-]/.test(x) ? '(' + x + ')' : x; f.textContent = par(p[0] || '') + ' ÷ ' + par(p[1] || ''); });
    d.querySelectorAll('sup').forEach(e => { e.textContent = '^' + e.textContent; });
    d.querySelectorAll('td,th').forEach(e => e.appendChild(document.createTextNode(' | ')));
    d.querySelectorAll('.ln,.lbl,.branch>div,li,p,tr').forEach(e => e.appendChild(document.createTextNode('\n')));
    return d.textContent.replace(/[ \t]+/g, ' ').replace(/ \| (?=\n|$)/g, '').replace(/\s*\n\s*/g, '\n').trim();
  }
  // texto da resposta → HTML seguro (negrito, listas com «• » e passos «1. »)
  TNEX.fmt = t => {
    let h = '', lst = null; const fech = () => { if (lst) { h += '</' + lst + '>'; lst = null; } };
    String(t == null ? '' : t).split('\n').forEach(ln => {
      const e = E(ln).replace(/\u0002([^\u0003]*)\u0003/g, '<b>$1</b>').replace(/[\u0002\u0003]/g, ''); let m;
      if ((m = /^• (.*)$/.exec(e))) { if (lst !== 'ul') { fech(); h += '<ul>'; lst = 'ul'; } h += '<li>' + m[1] + '</li>'; }
      else if ((m = /^\d+\. (.*)$/.exec(e))) { if (lst !== 'ol') { fech(); h += '<ol>'; lst = 'ol'; } h += '<li>' + m[1] + '</li>'; }
      else { fech(); if (e.trim()) h += '<p>' + e + '</p>'; }
    });
    fech(); return h;
  };
  const simples = t => String(t == null ? '' : t).replace(/[\u0002\u0003]/g, '');

  /* ================= 2. Índice da matéria ================= */
  const KB = { docs: [], inv: new Map(), tot: 0, feito: {}, j: {}, p: {} };
  const PESO = { conceito: 1.3, formula: 1.3, termo: 1.2, linha: 1.1, ficha: 1, licao: 1, ex: .7 };
  function junta(d, corpo, semTit) {
    const tt = semTit ? [] : toks(d.titulo), bt = toks(corpo || ''), tf = new Map();
    for (const w of bt) tf.set(w, (tf.get(w) || 0) + 1);
    for (const w of tt) tf.set(w, (tf.get(w) || 0) + 2.5);
    d.len = (bt.length + tt.length * 2.5) || 1; d.tt = new Set(tt); d.tn = ' ' + tt.join(' ') + ' ';
    const i = KB.docs.push(d) - 1; KB.tot += d.len;
    tf.forEach((f, w) => { let a = KB.inv.get(w); if (!a) KB.inv.set(w, a = []); a.push(i, f); });
    return d;
  }
  function kbMat() {
    if (KB.feito.mat || typeof HELP === 'undefined') return; KB.feito.mat = 1;
    Object.keys(HELP).forEach(k => {
      const h = HELP[k]; if (!h || !h.n) return;
      const d = { tipo: 'formula', did: 'mat', disc: 'Matemática', titulo: h.n, onde: h.t || '', key: k, tt0: typeof TYPES !== 'undefined' ? TYPES.findIndex(x => x.h === k) : -1,
        form: formTxt(h.f || ''), vars: (h.vars || []).map(v => [semTags(v[0]), semTags(v[1])]), passos: (h.steps || []).map(semTags), trap: semTags(h.trap || ''), calc: h.calc || '' };
      d.texto = d.form.replace(/\n/g, ' ; ');
      junta(d, [h.t, d.form, d.vars.map(v => v.join(' ')).join(' '), d.passos.join(' '), d.trap].join(' '));
    });
  }
  // fichas de comparação («Kant · Mill»): junta cada valor ao nome da sua coluna
  function colunas(cab, txt) { const c = cab && cab[1] ? String(cab[1]).split(' · ') : [], v = String(txt || '').split(' · '); return c.length > 1 && c.length === v.length ? c.map((n, i) => n + ': ' + v[i]).join('; ') : String(txt || ''); }
  const ehQuiz = it => !it._excerto && it.enunciado && ((it.tipo === 'mc' && Array.isArray(it.opcoes) && typeof it.certa === 'number') || (it.tipo === 'vf' && typeof it.certa === 'boolean'));
  function kbDisc(D) {
    if (KB.feito[D.id]) return Promise.resolve();
    if (KB.p[D.id]) return KB.p[D.id];
    return (KB.p[D.id] = Promise.all([XD.load(D.id), XD.ferr(D.id).catch(() => null)]).then(([j, F]) => {
      if (KB.feito[D.id]) return; KB.feito[D.id] = 1; KB.j[D.id] = j;
      const base = { did: D.id, disc: j.titulo_app || D.n }, cDe = {};
      ((j.mapa && j.mapa.anos) || []).forEach(a => (a.temas || []).forEach(t => (t.conceitos || []).forEach(c => {
        const f = c.ficha || {};
        const d = junta(Object.assign({ tipo: 'conceito', titulo: c.nome, texto: f.texto || '', exemplo: f.exemplo || '', pag: f.pag, onde: t.titulo, cid: c.id, itens: c.itens || [] }, base), [t.titulo, f.texto, f.exemplo].join(' '));
        (c.itens || []).forEach(id => { cDe[id] = d; });
      })));
      j.mods.forEach(m => {
        const l = m.licao; if (!l || !(l.resumo || (l.pontos || []).length)) return;
        junta(Object.assign({ tipo: 'licao', titulo: titMod(m.titulo), texto: l.resumo || '', pontos: l.pontos || [], exemplo: typeof l.exemplo === 'string' ? l.exemplo : '', pag: m.pags && m.pags[0], mid: m.id }, base), [l.resumo, (l.pontos || []).join(' ')].join(' '));
      });
      if (F) {
        (F.fichas || []).forEach(f => {
          const ls = (f.linhas || []).filter(l => l.a && l.b).map(l => ({ a: l.a, b: colunas(f.cabecalho, l.b) }));
          junta(Object.assign({ tipo: 'ficha', titulo: f.titulo, texto: f.intro || '', linhas: ls, pag: f.pag, mid: f.mod }, base), [f.intro, ls.map(l => l.a + ' ' + l.b).join(' ')].join(' '));
          ls.forEach(l => { if (l.b.length >= 25) junta(Object.assign({ tipo: 'linha', titulo: l.a, texto: l.b, onde: 'ficha «' + f.titulo + '»', pag: f.pag, mid: f.mod }, base), l.b); });
        });
        (F.glossario || []).forEach(g => {
          const d = junta(Object.assign({ tipo: 'termo', titulo: g.termo, texto: g.def, onde: 'glossário', pag: g.pag, mid: g.mod }, base), g.def);
          d.ks = nrm(g.termo).split(/\s*(?:\/|;|\(|\)|,| ou )\s*/).map(x => x.replace(/[^a-z0-9 ]+/g, ' ').trim()).filter(x => x.length >= 4);
        });
      }
      XD.itens(j).forEach(it => {
        if (!['mc', 'vf', 'escrita'].includes(it.tipo) || !it.enunciado || !it.explicacao) return;
        junta(Object.assign({ tipo: 'ex', titulo: curto(it.enunciado, 150), texto: it.explicacao, it, cd: cDe[it._pai || it.id] || null, mid: it._m, pag: it.pag }, base), [it.enunciado, it.explicacao, it.tipo === 'mc' ? (it.opcoes || [])[it.certa] : ''].join(' '), true);
      });
      KB.cDe = Object.assign(KB.cDe || {}, Object.fromEntries(Object.entries(cDe).map(([k, v]) => [D.id + ':' + k, v])));
    }).catch(() => { delete KB.p[D.id]; }));
  }
  const pausa = () => new Promise(r => setTimeout(r, 0));
  // prepara o índice: primeiro a disciplina pedida; «tudo» espera pelas outras, senão ficam a carregar em fundo
  TNEX.preparar = async function (prio, tudo) {
    kbMat();
    const Ds = (window.XD && XD.DISC) || [], p = prio && Ds.find(d => d.id === prio);
    if (p) await kbDisc(p);
    const resto = (async () => { for (const D of Ds) { if (!KB.feito[D.id]) { await kbDisc(D); await pausa(); } } })();
    if (tudo || !p) await resto; else resto.catch(() => { });
  };
  const ALIAS = [[/\bfiguras? de (estilo|linguagem|retorica)\b/, 'recursos expressivos'], [/\bif clauses?\b/, 'conditional'], [/\bverbos? modais\b/, 'modal verbs'], [/\bdiscurso indireto\b/, 'reported speech'],
    // 1.38: palavras curtas que se confundem (sem acentos, «há» e «à» ficam «ha» e «a» e perdiam-se na pesquisa)
    [/\b(ha ou a|a ou ha|ha e a|a e ha)\b/, 'palavras que se confundem ha'], [/\b(senao ou se nao|se nao ou senao)\b/, 'palavras que se confundem senao'], [/\b(acerca ou ha cerca|ha cerca ou acerca)\b/, 'palavras que se confundem acerca'],
    [/\b(uv maps?|mapas? uv|uv mapping)\b/, 'uv']];
  function procurar(texto, op) {
    op = op || {}; texto = ALIAS.reduce((t, [re, por]) => t.replace(re, por), nrm(texto));
    const qt = [...new Set(toks(texto).filter(w => !PERG.has(w)))], N = KB.docs.length;
    if (!qt.length || !N) return { qt, r: [] };
    const avg = KB.tot / N, acc = new Map(); let idfTot = 0, desc = 0;
    for (const w of qt) {
      const a = KB.inv.get(w), df = a ? a.length / 2 : 0, idf = Math.log(1 + (N - df + .5) / (df + .5));
      idfTot += a ? idf : idf * .5; if (!a) { desc++; continue; }
      for (let k = 0; k < a.length; k += 2) {
        const d = KB.docs[a[k]], f = a[k + 1]; let o = acc.get(a[k]);
        if (!o) acc.set(a[k], o = { d, s: 0, i: 0, tc: 0 });
        o.s += idf * (f * 2.4) / (f + 1.4 * (.4 + .6 * d.len / avg)); o.i += idf; if (d.tt.has(w)) o.tc++;
      }
    }
    const frase = ' ' + qt.join(' ') + ' ', out = [];
    acc.forEach(o => {
      const d = o.d; if ((op.fora && op.fora(d)) || (op.tipos && !op.tipos.includes(d.tipo))) return;
      o.cob = o.i / idfTot; o.tit = d.tt.size > 0 && o.tc === d.tt.size;      // o título inteiro está na pergunta
      let s = o.s * Math.pow(o.cob, 1.4) * (PESO[d.tipo] || 1);
      if (o.tc === qt.length) { s *= 1.5; if (d.tt.size === o.tc) s *= 1.45; }
      else if (o.tc && o.tc === d.tt.size) s *= 1.25;
      if (o.tc) s *= (.85 + .3 * o.tc / Math.max(d.tt.size, o.tc)) * (1 + .2 * o.tc);
      if (qt.length > 1 && d.tn.includes(frase)) s *= 1.15;
      if (op.did && d.did === op.did) s *= op.forte ? 1.6 : 1.2;
      if (op.mid && d.mid === op.mid) s *= 1.15;
      if (op.pref && op.pref.includes(d.tipo)) s *= 1.3;
      o.s = s; out.push(o);
    });
    out.sort((x, y) => y.s - x.s);
    return { qt, desc, r: out.slice(0, op.n || 8) };
  }
  TNEX.procurar = procurar; TNEX.KB = KB;

  /* ================= 3. Montar respostas ================= */
  const onde = d => d.disc + (d.onde ? ' · ' + d.onde : '');
  const pagTxt = d => d.pag ? ' · pág. ' + d.pag : '';
  function texDoc(d, cheio) {
    const L = [];
    if (d.tipo === 'conceito') { L.push(b(d.titulo) + ' · ' + onde(d)); if (d.texto) L.push(d.texto); if (d.exemplo) L.push(b('Exemplo') + ': ' + d.exemplo); }
    else if (d.tipo === 'termo' || d.tipo === 'linha') { L.push(b(d.titulo) + ' · ' + onde(d)); L.push(d.texto); }
    else if (d.tipo === 'ficha') {
      L.push(b(d.titulo) + ' · ' + d.disc + ' · ficha de consulta'); if (d.texto) L.push(d.texto);
      const n = cheio ? 16 : 8; d.linhas.slice(0, n).forEach(l => L.push('• ' + l.a + ': ' + l.b));
      if (d.linhas.length > n) L.push('Há mais ' + (d.linhas.length - n) + ' linhas nesta ficha, em «Fichas e glossário».');
    }
    else if (d.tipo === 'licao') {
      L.push(b(d.titulo) + ' · ' + d.disc + ' · lição'); if (d.texto) L.push(cheio ? d.texto : curto(d.texto, 560));
      if (d.pontos.length) { L.push(b('Ideias-chave')); d.pontos.slice(0, cheio ? 8 : 4).forEach(p => L.push('• ' + p)); }
    }
    else if (d.tipo === 'formula') {
      L.push(b(d.titulo) + ' · Matemática' + (d.onde ? ' · ' + d.onde : ''));
      L.push(b('Fórmula') + ': ' + d.texto);
      if (d.vars.length) { L.push(b('Onde')); d.vars.forEach(v => L.push('• ' + v[0] + ': ' + v[1])); }
      if (d.passos.length) { L.push(b('Passos')); d.passos.forEach((p, i) => L.push((i + 1) + '. ' + p)); }
      if (d.calc) L.push(b('Na calculadora') + ': ' + d.calc);
      if (d.trap) L.push(b('Armadilha') + ': ' + d.trap);
    }
    else if (d.tipo === 'ex') {
      const it = d.it; L.push('Na matéria de ' + d.disc + ' há uma pergunta sobre isto:'); L.push('«' + curto(it.enunciado, 280) + '»');
      if (it.tipo !== 'escrita') L.push(b('Resposta') + ': ' + XD.certTxt(it));
      L.push(b('Explicação') + ': ' + it.explicacao);
      if (d.cd && d.cd.texto) L.push(b('A regra · ' + d.cd.titulo) + ': ' + d.cd.texto);
    }
    return L.join('\n');
  }
  const acoesDe = d => d.tipo === 'conceito' ? [{ t: 'Treinar este conceito', a: 'conc', did: d.did, cid: d.cid }]
    : d.tipo === 'formula' && d.tt0 >= 0 ? [{ t: 'Treinar este tipo de exercício', a: 'mat', v: d.tt0 }]
      : d.tipo === 'ex' && d.cd ? [{ t: 'Treinar «' + curto(d.cd.titulo, 30) + '»', a: 'conc', did: d.did, cid: d.cd.cid }]
        : d.did !== 'mat' ? [{ t: 'Abrir fichas e glossário de ' + d.disc, a: 'ferr', did: d.did, mid: d.mid || null }] : [];
  const fonteDe = d => 'Da matéria da app: ' + d.disc + pagTxt(d) + '.';
  function vizinhos(R, d0, n) { const v = [], vis = new Set([nrm(d0 ? d0.titulo : '')]); for (const o of R) { const k = nrm(o.d.titulo); if (o.d.tipo === 'ex' || vis.has(k) || o.d.titulo.length > 60 || /[\n=\[\]{}<>]|^[^A-Za-zÀ-ÿ0-9]|\(.*\(/.test(o.d.titulo) || (d0 && (o.d.did !== d0.did || o.cob < .5))) continue; vis.add(k); v.push(o.d.titulo); if (v.length >= (n || 4)) break; } return v; }
  // termos do glossário que aparecem num texto (para explicar as palavras difíceis)
  function termosEm(texto, did, fora) {
    const t = ' ' + nrm(texto).replace(/[^a-z0-9]+/g, ' ') + ' ', out = [];
    for (const d of KB.docs) { if (d.tipo !== 'termo' || d.did !== did || d === fora || !d.ks) continue; if (fora && nrm(d.titulo) === nrm(fora.titulo)) continue; if (d.ks.some(k => t.includes(' ' + k + ' '))) { out.push(d); if (out.length >= 3) break; } }
    return out;
  }
  function maisSimples(d) {
    const L = [b(d.titulo) + ', por outras palavras'];
    const base = d.tipo === 'ex' ? d.it.explicacao : d.texto;
    if (base) L.push(b('O essencial') + ': ' + frase1(base));
    if (d.tipo === 'formula') { L.push(b('Faz assim')); d.passos.forEach((p, i) => L.push((i + 1) + '. ' + p)); if (d.trap) L.push(b('Atenção') + ': ' + d.trap); }
    if (d.tipo === 'licao' && d.pontos.length) d.pontos.slice(0, 3).forEach(p => L.push('• ' + p));
    if (d.exemplo) L.push(b('Exemplo') + ': ' + d.exemplo);
    const ts = d.did === 'mat' ? [] : termosEm((base || '') + ' ' + (d.exemplo || ''), d.did, d);
    if (ts.length) { L.push(b('Palavras que aparecem aqui')); ts.forEach(x => L.push('• ' + x.titulo + ': ' + x.texto)); }
    L.push('Se alguma palavra continuar estranha, escreve só essa palavra.');
    return L.join('\n');
  }

  /* ---------- exercícios dentro da conversa ---------- */
  function poolDe(did, d, foraId) {
    const j = KB.j[did]; if (!j) return [];
    let P = XD.itens(j).filter(ehQuiz);
    if (d && d.tipo === 'conceito' && d.itens.length) { const S = new Set(d.itens), c = P.filter(it => S.has(it._pai || it.id)); if (c.length) P = c; }
    else if (d && d.mid) { const c = P.filter(it => it._m === d.mid); if (c.length) P = c; }
    return foraId ? P.filter(it => it.id !== foraId) : P;
  }
  function tira(P, est) { const vis = est.vistos || (est.vistos = []); let c = P.filter(it => !vis.includes(it.id)); if (!c.length) { vis.length = 0; c = P; } const it = c[Math.floor(Math.random() * c.length)]; vis.push(it.id); return it; }
  function fazQuiz(did, d, est, foraId) {
    const P = poolDe(did, d, foraId); if (!P.length) return null;
    const it = tira(P, est), cd = (KB.cDe || {})[did + ':' + (it._pai || it.id)] || (d && d.tipo === 'conceito' ? d : null), disc = (KB.docs.find(x => x.did === did) || {}).disc || did;
    est.pend = { it, did, cd }; est.pool = { did, d: d || null }; est.did = did;
    const L = [b(it.tipo === 'vf' ? 'Verdadeiro ou falso?' : 'Exercício') + ' · ' + disc + (cd ? ' · ' + cd.titulo : ''), it.enunciado];
    if (it.tipo === 'mc') { it.opcoes.forEach((o, k) => L.push('ABCD'[k] + ') ' + o)); L.push('Responde com a letra. Se não souberes, escreve «não sei».'); }
    else L.push('Responde «verdadeiro» ou «falso». Se não souberes, escreve «não sei».');
    return { text: L.join('\n'), sugestoes: it.tipo === 'mc' ? it.opcoes.map((_, k) => 'ABCD'[k]).concat(['Não sei']) : ['Verdadeiro', 'Falso', 'Não sei'], fonte: 'Exercício da matéria da app' + (it.pag ? ' (pág. ' + it.pag + ')' : '') + '.', conf: 1 };
  }
  function corrige(n, est) {
    const { it, cd } = est.pend; let ans = null, desiste = /(nao sei|nao faco ideia|desisto|mostra|qual e a resposta|diz me a resposta|ver a resposta|a resposta)$/.test(n.replace(/-/g, ' '));
    if (!desiste) {
      if (it.tipo === 'mc') {
        const m = /^(?:e |a resposta e |acho que e |opcao |letra |alinea |a )*\(?([a-d])\)?[.)]?$/.exec(n);
        if (m) ans = 'abcd'.indexOf(m[1]);
        else { const k = it.opcoes.findIndex(o => { const x = nrm(o).replace(/[.!?]+$/, ''); return x.length >= 3 && (x === n || (n.length >= 6 && x.includes(n))); }); if (k >= 0) ans = k; }
        if (ans != null && ans >= it.opcoes.length) ans = null;
      } else {
        if (/^(v|verdadeir[oa]|verdade|true|sim|certo|e verdadeir[oa])$/.test(n)) ans = true; else if (/^(f|fals[oa]|false|nao|errado|e fals[oa])$/.test(n)) ans = false;
      }
      if (ans == null) return null;
    }
    est.pend = null;
    const ok = !desiste && ans === it.certa, L = [], cert = it.tipo === 'mc' ? 'ABCD'[it.certa] + ') ' + it.opcoes[it.certa] : (it.certa ? 'Verdadeiro' : 'Falso');
    if (desiste) L.push(b('A resposta certa') + ': ' + cert);
    else if (ok) L.push(b('Certo!') + ' ' + cert);
    else { L.push(b('Não é essa.') + ' A certa é ' + cert); if (it.tipo === 'mc' && Array.isArray(it.porque) && it.porque[ans]) L.push(b('Porque a tua opção falha') + ': ' + it.porque[ans]); }
    if (it.explicacao) L.push(b('Explicação') + ': ' + it.explicacao);
    if (cd && cd.texto && !ok) L.push(b('A regra · ' + cd.titulo) + ': ' + cd.texto);
    return { text: L.join('\n'), sugestoes: ['Outro exercício'].concat(cd ? [cd.titulo] : []), fonte: 'Da matéria da app' + (it.pag ? ' (pág. ' + it.pag + ')' : '') + '.', conf: 1, acoes: cd ? [{ t: 'Treinar este conceito', a: 'conc', did: est.pool.did, cid: cd.cid }] : [] };
  }

  /* ---------- contas ---------- */
  function conta(n) {
    let s = n.replace(/^(quanto (e|da|vale|sao|fica)|calcula|faz a conta|qual e o resultado de|resultado de|quanto e que da)\s*/, '').replace(/[=?]+\s*$/, '').trim();
    s = s.replace(/,/g, '.').replace(/(\d)\s*[x×]\s*(\d)/g, '$1*$2').replace(/[×]/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*de\s*(\d+(?:\.\d+)?)/g, '($1/100*$2)').replace(/raiz quadrada de\s*(\d+(?:\.\d+)?)/g, 'r($1)').replace(/(\d+(?:\.\d+)?)\s*ao quadrado/g, '($1^2)').replace(/(\d+(?:\.\d+)?)\s*ao cubo/g, '($1^3)');
    // 1.38: contas escritas por extenso («3 ao quadrado mais 4», «10 a dividir por 4»)
    s = s.replace(/\s+(elevado a|levantado a)\s+/g, ' ^ ').replace(/\s+(a dividir por|dividido por|sobre)\s+/g, ' / ').replace(/\s+(vezes|a multiplicar por|multiplicado por)\s+/g, ' * ').replace(/\s+mais\s+/g, ' + ').replace(/\s+menos\s+/g, ' - ');
    if (!/^[\d\s().+\-*/^%r]+$/.test(s) || !/\d/.test(s) || !/[+\-*/^%r]/.test(s.replace(/^-/, ''))) return null;
    let i = 0; const ws = () => { while (s[i] === ' ') i++; };
    const prim = () => { ws(); if (s[i] === '(') { i++; const v = expr(); ws(); if (s[i] !== ')') throw 0; i++; return v; } if (s[i] === 'r') { i++; const v = prim(); if (v < 0) throw 0; return Math.sqrt(v); } const m = /^\d+(?:\.\d+)?/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; let v = +m[0]; ws(); if (s[i] === '%') { i++; v /= 100; } return v; };
    const una = () => { ws(); if (s[i] === '-') { i++; return -una(); } if (s[i] === '+') { i++; return una(); } return prim(); };
    const pot = () => { const a = una(); ws(); if (s[i] === '^') { i++; return Math.pow(a, pot()); } return a; };
    const term = () => { let v = pot(); for (;;) { ws(); if (s[i] === '*') { i++; v *= pot(); } else if (s[i] === '/') { i++; const d = pot(); if (d === 0) throw 1; v /= d; } else return v; } };
    function expr() { let v = term(); for (;;) { ws(); if (s[i] === '+') { i++; v += term(); } else if (s[i] === '-') { i++; v -= term(); } else return v; } }
    try { const v = expr(); ws(); if (i < s.length || !isFinite(v)) return null; const r = Math.round(v * 1e6) / 1e6; return { text: b('Resultado') + ': ' + r.toLocaleString('pt-PT', { maximumFractionDigits: 6 }) + '\nConta feita: ' + s.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/r\(/g, '√(').replace(/\s+/g, ' ').trim(), conf: 1, fonte: 'Conta feita pelo Nex.' }; }
    catch (e) { return e === 1 ? { text: 'Não se pode dividir por zero.', conf: 1 } : null; }
  }

  /* ---------- o que foi pedido ---------- */
  const AREA = { 'Matemática': 'mat', 'Filosofia': 'filosofia', 'Português': 'portugues', 'Inglês': 'ingles', 'Desenho A': 'desenho', 'Teologia': 'teologia', 'Modelação 3D': 'modelacao3d', 'Python': 'python', 'Psicologia': 'psicologia', 'História da Cultura e das Artes': 'hca' };
  const DNOME = [['mat', /\b(matematica|macs)\b/], ['filosofia', /\bfilosofia\b/], ['portugues', /\bportugues\b/], ['ingles', /\b(ingles|english)\b/], ['desenho', /\bdesenho( a)?\b/], ['teologia', /\b(teologia|emrc?|religiao)\b/], ['modelacao3d', /\b(modelacao( 3d)?|blender)\b/], ['python', /\bpython\b/], ['psicologia', /\bpsicologia\b/], ['hca', /\b(hca|historia (da cultura|e cultura) (e )?das artes|historia da arte)\b/]];
  const discNoTexto = n => { const x = DNOME.find(([, re]) => re.test(n)); return x ? x[0] : null; };
  const semDisc = n => DNOME.reduce((s, [, re]) => s.replace(re, ' '), n);
  const nomeDisc = did => did === 'mat' ? 'Matemática' : ((((window.XD && XD.DISC) || []).find(d => d.id === did) || {}).n || did);
  const RX = {
    ola: /^(ola|oi+|ei|hey|hello|hi|bom dia|boa tarde|boa noite|boas|tudo bem)\b/,
    obrig: /^(muito )?(obrigad[oa]|obg|valeu|thanks|thank you|fixe|top|perfeito|ok|okay|ja percebi|percebi|entendi|boa)\b/,
    // 1.38: com fronteira de palavra («quem escreveu» já não é «quem és»)
    sobre: /(\bquem es\b|\bo que es\b|\bcomo te chamas\b|\bes uma ia\b|\bes um robo\b|\bo que (e que )?(sabes|consegues|podes) fazer\b|\bpara que serves\b|\bcomo funcionas\b|\bem que (me )?podes ajudar\b|^ajuda$|^ajuda me$)/,
    quizN: /\b(exercicios?|perguntas?|questao|questoes|quiz|desafio|teste)\b/g,
    quiz: /\b(da|das|faz|faca|cria|quero|queria|manda|propoe|arranja|outro|outra|novo|nova|mais|tens)\b(?: me| nos)?(?: [a-z]+){0,2} (exercicios?|perguntas?|questao|questoes|quiz|desafio|teste)\b|^(testa|pergunta|questiona) me\b|\b(quero|vamos|posso) (treinar|praticar)\b|^(exercicios?|quiz)\b/,
    outro: /^(outro|outra|outro exercicio|outra pergunta|mais um|mais uma|proximo|proxima|seguinte|continua|mais)$/,
    dif: /\b(diferenc\w*|distingu\w+|compar\w+)\b/, exemplo: /\b(exemplos?|exemplifica)\b/, resumo: /\b(resum\w*|sintese|sintetiza|pontos principais|ideias chave|o essencial)\b/,
    simples: /((de |duma |de uma |numa )?(forma|maneira) (mais |muito |bem )?(simples|facil|clara|curta)|mais simples|mais facil|(de |por )?outra (forma|maneira)|(por )?outras palavras|nao percebi|nao entendi|nao compreendi|nao percebo|explica (me )?(isso |isto )?melhor|explica (me )?(isso|isto|outra vez|de novo)|simplifica|passo a passo|como assim)/,
    def: /^(o que (e|sao|significa|quer dizer)|que (e|sao)|define|definicao|significado|what is|what are|what does)\b/, como: /^(como|de que forma|quais (sao )?os passos|qual (e )?o metodo)\b/
  };
  function partesDif(n, eDif) {
    const art = '(?:a |o |as |os |um |uma |the )?';
    let m = new RegExp('diferenc\\w* (?:que ha |que existe )?entre ' + art + '(.+?) e ' + art + '(.+)$').exec(n) || new RegExp('(?:distingu\\w+|compar\\w+) ' + art + '(.+?) (?:e|de|com) ' + art + '(.+)$').exec(n) || /^(.+?) (?:vs|versus) (.+)$/.exec(n);
    if (!m && (eDif || /^(quando (uso|se usa|usar|devo usar)|devo usar|uso)\b/.test(n))) m = new RegExp('^(?:.*?\\b(?:uso|usa|usar|entre|diferenc\\w*)\\b )?' + art + '(.+?) (?:ou|e) ' + art + '(.+)$').exec(n);
    return m ? [m[1], m[2]] : null;
  }

  function determ(q, p, est) {
    const o = p.o || null, n = ALIAS.reduce((t, [re, por]) => t.replace(re, por), nrm(q).replace(/[«»"“”]/g, '').replace(/[?!.…\s]+$/g, '').replace(/\s+/g, ' ').trim()), n2 = n.replace(/-/g, ' ');
    const dCtx = o && o.D ? o.D.id : null, dTxt = discNoTexto(n2), did = dCtx || dTxt || null, pref = did || est.did || AREA[p.area] || null;
    if (p.preset && o) { const r = doPreset(p.preset, o, est); if (r) return r; }
    if (est.pend) { const r = corrige(n2, est); if (r) return r; if (n2.split(' ').length <= 2 && n2.length <= 14) return { text: est.pend.it.tipo === 'mc' ? 'Responde com a letra da opção (A, B, C ou D) ou escreve «não sei».' : 'Responde «verdadeiro» ou «falso», ou escreve «não sei».', conf: 1, sugestoes: est.pend.it.tipo === 'mc' ? est.pend.it.opcoes.map((_, k) => 'ABCD'[k]).concat(['Não sei']) : ['Verdadeiro', 'Falso', 'Não sei'] }; est.pend = null; }
    if (o && !p.preset) { const k = /(porque|onde|em que).*(errad|errei|nao esta cert|falh)/.test(n2) ? 'why' : /porque.*(certa|correta)/.test(n2) ? 'ok' : RX.simples.test(n2) ? 'simple' : RX.quiz.test(n2) ? 'more' : RX.resumo.test(n2) && toks(semDisc(n2).replace(RX.resumo, ' ')).filter(w => !PERG.has(w)).length < 1 ? 'sum' : RX.exemplo.test(n2) && toks(n2).filter(w => !PERG.has(w)).length < 1 ? 'ex' : null; if (k) { const r = doPreset(k, o, est); if (r) return r; } }
    if (n.length < 34 && RX.ola.test(n2) && toks(n2).filter(w => !PERG.has(w)).length < 3) return { text: 'Olá' + (typeof ME !== 'undefined' && ME.nick ? ', ' + ME.nick : '') + '! Diz-me a matéria que queres ver (por exemplo «o que é a mediana?») ou pede «um exercício de ' + nomeDisc(pref || 'filosofia') + '».', conf: 1, sugestoes: ['O que sabes fazer?', 'Dá-me um exercício de ' + nomeDisc(pref || 'filosofia')] };
    if (RX.sobre.test(n2)) return { text: 'Sou o Nex, o tutor da Pronex_Study. Respondo com a matéria que está na app: conceitos, lições, fichas, glossário e fórmulas de Matemática.\n' + b('Podes pedir-me') + '\n• uma definição: «o que é o complemento oblíquo?»\n• uma diferença: «diferença entre média e mediana»\n• um exemplo ou um resumo: «exemplo de modus ponens», «resume a lição sobre Kant»\n• um exercício: «dá-me um exercício de Python» (eu corrijo a tua resposta)\n• uma conta: «15% de 240»\nSe a resposta não estiver na matéria, digo-te isso em vez de inventar.', conf: 1, sugestoes: ['Dá-me um exercício de ' + nomeDisc(pref || 'filosofia'), 'Diferença entre média e mediana'] };
    if (n.length < 40 && RX.obrig.test(n2) && toks(n2).filter(w => !PERG.has(w)).length < 2) return { text: 'Boa. Quando quiseres, continua: outra pergunta ou «outro exercício».', conf: 1, sugestoes: est.pool ? ['Outro exercício'] : [] };
    const c0 = conta(n); if (c0) return c0;
    if (RX.outro.test(n2) && est.pool) { const r = est.pool.did === 'mat' ? null : fazQuiz(est.pool.did, est.pool.d, est); if (r) return r; }

    const eQuiz = RX.quiz.test(n2);
    const topico = semDisc(n2).replace(RX.quizN, ' ').replace(/\b(testa|pergunta|questiona) me\b/, ' ');
    if (eQuiz) {
      const tk = toks(topico).filter(w => !PERG.has(w) && !/^(da|das|faz|faca|cria|quero|queria|manda|propoe|arranja|outro|outra|novo|nova|ten|vamo|posso|treinar|praticar|parecido|parecida|igual|dificil|facil)$/.test(w));
      let d = null, dq = did || pref;
      if (tk.length) { const R = procurar(tk.join(' '), { did: dq, forte: !!did, tipos: ['conceito', 'licao', 'formula', 'termo', 'linha'] }).r; if (R.length && R[0].cob >= .5) { d = R[0].d; dq = d.did; } }
      else if (!did && est.ult) { d = est.ult; dq = d.did; }
      if (dq === 'mat' || (d && d.did === 'mat')) { const f = d && d.tipo === 'formula' ? d : null; return { text: 'Os exercícios de Matemática têm números novos de cada vez e fazem-se no ecrã de treino' + (f ? ': abre «' + f.titulo + '».' : '. Abre Estudar → Matemática e escolhe o tipo.'), conf: 1, acoes: f && f.tt0 >= 0 ? [{ t: 'Treinar «' + curto(f.titulo, 32) + '»', a: 'mat', v: f.tt0 }] : [{ t: 'Abrir Matemática', a: 'ir', v: 'study' }] }; }
      if (!dq) dq = 'filosofia';
      const r = fazQuiz(dq, d && d.tipo !== 'termo' && d.tipo !== 'linha' ? d : (d && d.mid ? { mid: d.mid } : null), est);
      if (r) return r;
      return { text: 'Ainda não consegui abrir os exercícios de ' + nomeDisc(dq) + ' (precisam de ter sido carregados uma vez com internet). Abre a disciplina em Estudar e tenta outra vez.', conf: 1 };
    }

    // seguimento da resposta anterior, sem matéria nova na pergunta
    const tkLivre = toks(semDisc(n2).replace(RX.simples, ' ').replace(RX.resumo, ' ')).filter(w => !PERG.has(w) && !/^(forma|maneira|modo|melhor|vez|novo|curto|rapido)$/.test(w));
    if (est.ult && tkLivre.length < 1) {
      if (RX.simples.test(n2) || /^(porque|e porque|como)$/.test(n2)) return { text: maisSimples(est.ult), conf: 1, fonte: fonteDe(est.ult), modelo: true, ctx: simples(texDoc(est.ult, true)), pedido: 'Explica isto de forma mais simples, passo a passo.' };
      if (RX.exemplo.test(n2)) { let d = est.ult; if (!d.exemplo) { const c = procurar(d.titulo, { did: d.did, forte: true, tipos: ['conceito', 'licao'] }).r.find(x => x.d.exemplo && x.cob >= .6); if (c) d = c.d; } return d.exemplo ? { text: b('Exemplo de ' + d.titulo) + '\n' + d.exemplo, conf: 1, fonte: fonteDe(d) } : { text: 'A matéria da app não tem um exemplo escrito para «' + d.titulo + '». Pede «um exercício» para veres um caso concreto.', conf: 1, sugestoes: ['Outro exercício'] }; }
      if (RX.resumo.test(n2)) return { text: texDoc(est.ult, false), conf: 1, fonte: fonteDe(est.ult) };
    }

    // diferença entre duas coisas
    const eDif = RX.dif.test(n2), pd = partesDif(semDisc(n2), eDif);
    if (pd) {
      const T = ['conceito', 'termo', 'linha', 'formula', 'licao'], A = procurar(pd[0], { did: pref, forte: !!did, tipos: T }).r[0], Bq = procurar(pd[1], { did: pref, forte: !!did, tipos: T }).r[0];
      if (A && Bq && A.cob >= .6 && Bq.cob >= .6) {
        const junto = procurar(pd[0] + ' ' + pd[1], { did: pref, forte: !!did, tipos: T.concat(['ficha']) }).r.slice(0, 4).find(x => x.tc >= 2 && x.d.tt.size <= 3) || null;   // 1.35: uma ficha que já compara os dois (ex.: «Românico e Gótico»)
        if (A.d === Bq.d || (junto && junto.cob > .95 && junto.tc >= 2 && junto.d.tipo !== 'licao')) { const d = A.d === Bq.d ? A.d : junto.d; est.ult = d; est.did = d.did; return { text: texDoc(d), conf: 1, fonte: fonteDe(d), acoes: acoesDe(d) }; }
        const L = [b(A.d.titulo) + ' · ' + onde(A.d), A.d.texto]; if (A.d.exemplo) L.push('Exemplo: ' + A.d.exemplo);
        L.push(b(Bq.d.titulo) + ' · ' + onde(Bq.d), Bq.d.texto); if (Bq.d.exemplo) L.push('Exemplo: ' + Bq.d.exemplo);
        if (frase1(A.d.texto) !== A.d.texto.trim() || frase1(Bq.d.texto) !== Bq.d.texto.trim()) L.push(b('Para não confundir'), '• ' + A.d.titulo + ': ' + frase1(A.d.texto), '• ' + Bq.d.titulo + ': ' + frase1(Bq.d.texto));
        est.ult = A.d; est.did = A.d.did;
        return { text: L.join('\n'), conf: 1, fonte: 'Da matéria da app: ' + A.d.disc + (Bq.d.disc !== A.d.disc ? ' e ' + Bq.d.disc : '') + '.', sugestoes: ['Dá-me um exercício sobre ' + A.d.titulo.toLowerCase()] };
      }
    }

    // pesquisa na matéria
    const prefT = RX.resumo.test(n2) ? ['licao', 'ficha'] : RX.def.test(n2) ? ['conceito', 'termo', 'linha', 'formula'] : RX.como.test(n2) ? ['formula', 'conceito', 'ficha'] : null;
    const fora = o && o.it && !o.r ? d => d.tipo === 'ex' && d.it.id === o.it.id : null;
    const S = procurar(semDisc(n2), { did: pref, forte: !!did, mid: o && o.m ? o.m.id : null, pref: prefT, fora, n: 10 }), R = S.r;
    if (!S.qt.length) return { text: 'Diz-me a matéria ou a palavra que queres ver. Por exemplo: «o que é a mediana?», «oração subordinada», «present perfect».', conf: 0, sugestoes: ['O que sabes fazer?'] };
    let top = R[0];
    // um exercício só é a resposta principal se não houver matéria (conceito, ficha, lição…) quase tão boa
    if (top && top.d.tipo === 'ex') { const alt = R.find(x => x.d.tipo !== 'ex' && ((x.tc >= 1 && x.cob >= .5) || (x.cob >= .8 && x.s >= top.s * .55))); if (alt) top = alt; }
    const aceite = top && ((top.tit && (top.d.tt.size >= 2 || top.cob >= .3)) || (top.cob >= .45 && (top.cob >= .7 || top.tc || S.qt.length >= 3)));
    if (!aceite) {
      const pt = S.desc ? null : R.find(x => x.d.tipo !== 'ex' && x.tc >= 1 && x.cob >= .3), perto = pt ? pt.d : null, viz = vizinhos(R.filter(x => x.cob >= .3 && x.tc >= 1), perto, 4);
      const L = [perto ? 'Não encontrei exatamente isso na matéria da app' + (did ? ' de ' + nomeDisc(did) : '') + '. O mais próximo que há:' : 'Não encontrei isso na matéria da app' + (did ? ' de ' + nomeDisc(did) : '') + '.'];
      if (perto) { L.push(texDoc(perto)); est.ult = perto; est.did = perto.did; }
      else L.push('Experimenta escrever só o nome da matéria (por exemplo «mediana» ou «complemento direto»), ou confirma no manual.');
      return { text: L.join('\n'), conf: 0, sugestoes: viz, fonte: perto ? fonteDe(perto) : '', acoes: perto && !p.o ? acoesDe(perto) : [], modelo: true, ctx: R.slice(0, 2).map(x => simples(texDoc(x.d))).join('\n\n'), naoSei: true };
    }
    let d = top.d;
    const eRes = RX.resumo.test(n2), eComo = RX.como.test(n2);
    if (eRes) { const l = R.find(x => x.d.tipo === 'licao' && x.tc >= 1 && x.cob >= .6) || R.find(x => x.d.tipo === 'ficha' && x.tc >= 1 && x.cob >= .6); if (l) d = l.d; }
    if (RX.exemplo.test(n2)) { const c = R.find(x => x.d.exemplo && x.s >= top.s * .55); if (c) { d = c.d; est.ult = d; est.did = d.did; return { text: b('Exemplo de ' + d.titulo) + ' · ' + onde(d) + '\n' + d.exemplo + (d.texto ? '\n' + b('A regra') + ': ' + frase1(d.texto) : ''), conf: top.cob, fonte: fonteDe(d), sugestoes: vizinhos(R, d, 3), acoes: p.o ? [] : acoesDe(d) }; } }
    // uma definição curta (glossário, linha de ficha) leva também a matéria mais próxima: a ficha com o mesmo nome,
    // a regra e o exemplo do conceito ou, em perguntas «como…», a ficha ou a lição
    let mais = null;
    if (d.tipo === 'termo' || d.tipo === 'linha') {
      const mesmo = x => x.d.did === d.did && x.d !== d && x.s >= top.s * .35;
      const fx = R.find(x => mesmo(x) && x.d.tipo === 'ficha' && x.tit && x.d.tt.size === S.qt.length);
      if (fx) { mais = d; d = fx.d; }                           // a ficha é a resposta; a definição curta vai à frente
      else { const c = R.find(x => mesmo(x) && x.d.tipo === 'conceito' && x.cob >= .8) || (eComo || eRes ? R.find(x => mesmo(x) && (x.d.tipo === 'ficha' || x.d.tipo === 'licao') && x.tc >= 1 && x.cob >= .8) : null); if (c) mais = c.d; }
    }
    let texto;
    if (mais && d.tipo === 'ficha' && (mais.tipo === 'termo' || mais.tipo === 'linha')) { texto = b(mais.titulo) + ': ' + mais.texto + '\n' + texDoc(d, eRes); mais = null; }
    else texto = texDoc(d, eRes) + (mais ? '\n' + (mais.tipo === 'conceito' ? b('Na matéria · ' + mais.titulo) + ': ' + mais.texto + (mais.exemplo ? '\n' + b('Exemplo') + ': ' + mais.exemplo : '') : texDoc(mais)) : '');
    est.ult = mais && mais.tipo === 'conceito' ? mais : d; est.did = d.did;
    const r = { text: texto, conf: top.cob, fonte: fonteDe(d), sugestoes: vizinhos(R, d, 3).filter(x => !mais || nrm(x) !== nrm(mais.titulo)), acoes: p.o ? [] : acoesDe(est.ult) };
    if (d.tipo === 'formula') r.fx = d.key;
    if (d.tipo !== 'ex' && d.tipo !== 'formula' && !o) r.sugestoes = r.sugestoes.concat(d.did !== 'mat' ? ['Dá-me um exercício sobre isto'] : []);
    if (r.sugestoes.includes('Dá-me um exercício sobre isto')) est.pool = { did: d.did, d: est.ult };
    return r;
  }

  /* ---------- dentro de um exercício: porque errei, de outra forma, outro parecido, exemplo, resumo ---------- */
  function doPreset(k, o, est) {
    const it = o.it && o.it.tipo !== 'card' ? o.it : null, card = o.it && o.it.tipo === 'card' ? o.it : null, r = o.r || null, m = o.m || null, Lc = (m && m.licao) || {}, did = o.D.id, j = KB.j[did];
    let c = o.conceito || null; if (!c && it && j && XD.conceitoDe) { const x = XD.conceitoDe(j, it); c = x && x.c; }
    const cf = (c && c.ficha) || {}, L = [], fonte = 'Da matéria da app: ' + (o.D.n) + ((it && it.pag) || cf.pag ? ' · pág. ' + ((it && it.pag) || cf.pag) : '') + '.';
    const regra = (tit) => { if (cf.texto) { L.push(b((tit || 'A regra') + ' · ' + c.nome) + ': ' + cf.texto); if (cf.exemplo) L.push(b('Exemplo') + ': ' + cf.exemplo); } else if (Lc.resumo) L.push(b('Da lição') + ': ' + curto(Lc.resumo, 420)); };
    const ctx = () => (typeof o.ctxTxt === 'string' ? o.ctxTxt : '');
    if (k === 'more') {
      if (did === 'mat') return null;
      const cd = c ? KB.docs.find(d => d.tipo === 'conceito' && d.did === did && d.cid === c.id) : null;
      return fazQuiz(did, cd || (m ? { mid: m.id } : null), est, it ? (it._pai || it.id) : null) || { text: 'Não há mais exercícios deste conceito para te dar aqui. Continua a sessão: os próximos são do mesmo tema.', conf: 1 };
    }
    if (k === 'ex') {
      const e1 = cf.exemplo || Lc.exemplo;
      return e1 ? { text: b('Exemplo' + (c && cf.exemplo ? ' de ' + c.nome : ' da lição')) + '\n' + e1 + (cf.texto ? '\n' + b('A regra') + ': ' + frase1(cf.texto) : ''), conf: 1, fonte } : { text: 'Esta lição não tem um exemplo escrito na app. Vê o manual' + (m && m.pags ? ' (págs. ' + m.pags.join('–') + ')' : '') + '.', conf: 1 };
    }
    if (k === 'sum') {
      if (o.ficha) { const f = o.ficha; L.push(b(f.titulo) + ' · ficha'); if (f.intro) L.push(f.intro); (f.linhas || []).slice(0, 10).forEach(l => L.push('• ' + l.a + ': ' + l.b)); return { text: L.join('\n'), conf: 1, fonte }; }
      if (!Lc.resumo && !(Lc.pontos || []).length) return null;
      L.push(b('Resumo' + (m ? ' · ' + titMod(m.titulo) : ''))); if (Lc.resumo) L.push(frase1(Lc.resumo)); (Lc.pontos || []).slice(0, 4).forEach(x => L.push('• ' + x));
      return { text: L.join('\n'), conf: 1, fonte };
    }
    if (k === 'simple') {
      if (!it) {
        const tit = card ? card.t : c ? c.nome : m ? titMod(m.titulo) : o.D.n; L.push(b(tit) + ', por outras palavras');
        if (cf.texto) L.push(b('O essencial') + ': ' + frase1(cf.texto)); else if (Lc.resumo) L.push(b('O essencial') + ': ' + frase1(Lc.resumo));
        if (cf.exemplo || Lc.exemplo) L.push(b('Exemplo') + ': ' + (cf.exemplo || Lc.exemplo));
        (Lc.pontos || []).slice(0, 3).forEach(x => L.push('• ' + x));
        const ts = termosEm((card ? card.txt : '') + ' ' + (cf.texto || Lc.resumo || ''), did, null); if (ts.length) { L.push(b('Palavras que aparecem aqui')); ts.forEach(x => L.push('• ' + x.titulo + ': ' + x.texto)); }
        L.push('Se alguma palavra continuar estranha, escreve só essa palavra.');
        return L.length > 2 ? { text: L.join('\n'), conf: 1, fonte, modelo: true, ctx: ctx(), pedido: 'Explica isto de outra forma, mais simples e passo a passo.' } : null;
      }
      L.push(b(r ? 'Passo a passo' : 'Por passos, sem te dar a resposta'));
      L.push('1. A pergunta pede: ' + curto(it.enunciado, 220));
      L.push('2. A regra a usar: ' + (cf.texto ? frase1(cf.texto) : Lc.resumo ? frase1(Lc.resumo) : 'está na lição deste tema; abre «Matéria» para a leres.'));
      if (r) {
        const exp = it.explicacao || (Array.isArray(it.porque) && it.porque[it.certa]) || '';
        if (exp) L.push('3. Neste caso: ' + exp);
        if (it.tipo === 'mc' || it.tipo === 'vf') L.push((exp ? '4' : '3') + '. Por isso a resposta é: ' + XD.ansTxt(it, it.certa));
        if (it.tipo === 'mc' && !r.ok && typeof r.ans === 'number' && Array.isArray(it.porque) && it.porque[r.ans]) L.push(b('A tua opção falha porque') + ': ' + it.porque[r.ans]);
        if (it.tipo === 'escrita' && r.g) { const f = r.g.cr.filter(x => !x.hit).map(x => x.c.ideia); if (f.length) { L.push(b('O que faltou na tua resposta')); f.forEach(x => L.push('• ' + x)); } }
      } else L.push(it.tipo === 'mc' ? '3. Agora compara cada opção com a regra e risca as que a contrariam. A que sobra é a certa.' : it.tipo === 'vf' ? '3. Agora vê se a afirmação diz o mesmo que a regra. Uma só palavra a mais («sempre», «nunca», «só») pode torná-la falsa.' : '3. Escreve a resposta com as tuas palavras, usando os termos da regra.');
      if (cf.exemplo) L.push(b('Exemplo do manual') + ': ' + cf.exemplo);
      return { text: L.join('\n'), conf: 1, fonte, modelo: true, ctx: ctx(), pedido: 'Explica isto de outra forma, mais simples e passo a passo.' + (r ? '' : ' O aluno ainda não respondeu: não digas qual é a resposta certa.') };
    }
    if ((k === 'why' || k === 'ok') && it && r) {
      if (it.tipo === 'mc' || it.tipo === 'vf') {
        if (!r.ok && r.ans != null) L.push(b('A tua resposta') + ': ' + XD.ansTxt(it, r.ans));
        L.push(b('A resposta certa') + ': ' + XD.ansTxt(it, it.certa));
        if (it.tipo === 'mc' && !r.ok && typeof r.ans === 'number' && Array.isArray(it.porque) && it.porque[r.ans]) L.push(b('Porque a tua não serve') + ': ' + it.porque[r.ans]);
        const exp = it.explicacao || (Array.isArray(it.porque) && it.porque[it.certa]) || ''; if (exp) L.push(b('Porque é esta a certa') + ': ' + exp);
      } else if (it.tipo === 'escrita') {
        const cr = (r.g && r.g.cr) || [], tem = cr.filter(x => x.hit).map(x => x.c.ideia), falta = cr.filter(x => !x.hit).map(x => x.c.ideia);
        if (tem.length) { L.push(b('O que a tua resposta já tem')); tem.forEach(x => L.push('• ' + x)); }
        if (falta.length) { L.push(b('O que faltou')); falta.forEach(x => L.push('• ' + x)); }
        if (it.modelo) L.push(b('Resposta-modelo') + ': ' + it.modelo);
        if (it.explicacao) L.push(b('Explicação') + ': ' + it.explicacao);
      } else if (it.tipo === 'codigo') {
        const fl = (r.tests || []).filter(t => !t.ok); if (fl.length) { L.push(b('Testes que falharam')); fl.forEach(t => L.push('• ' + (t.msg || t.codigo) + (t.err ? ' (' + t.err + ')' : ''))); }
        if (it.explicacao) L.push(b('Explicação') + ': ' + it.explicacao);
        if (it.solucao) L.push(b('Solução de referência') + ':\n' + it.solucao);
      } else if (it.explicacao) L.push(b('Explicação') + ': ' + it.explicacao);
      regra();
      if (!L.length) return null;
      return { text: L.join('\n'), conf: 1, fonte, sugestoes: did !== 'mat' ? ['Dá-me outro exercício parecido'] : [] };
    }
    return null;
  }

  /* ================= 4. Modelo opcional no dispositivo ================= */
  const M = TNEX.modelo = {
    est: '?',                                                 // '?', 'semgpu', 'nao', 'instalado', 'pronto'
    async ver() {
      try {
        if (typeof IA8 === 'undefined' || typeof IS_APP === 'undefined' || !IS_APP) return (M.est = 'semgpu');
        if (IA8.ready()) return (M.est = 'pronto');
        if (!(await IA8.gpuInfo())) return (M.est = 'semgpu');
        let marca = null; try { marca = localStorage.getItem('x8-ia-pronto'); } catch (e) { }
        if (!marca) return (M.est = 'nao');                   // nunca foi instalado: não vale a pena ir buscar o motor
        return (M.est = (await IA8.cached()) ? 'instalado' : 'nao');
      } catch (e) { return (M.est = 'nao'); }
    },
    quota() { try { return +(localStorage.getItem('ps-ai-' + today()) || 0) < 40; } catch (e) { return true; } },
    limpa: t => String(t || '').replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/\*\*|__|^#+\s*/gm, '').replace(/[\u0002\u0003]/g, '').trim(),
    async gerar(msgs, onText) {
      const t = await IA8.gerar(msgs, { onText: x => { if (onText) onText(M.limpa(x)); }, max_tokens: 420, temperature: .3, espera: 45000 });
      M.est = 'pronto'; return M.limpa(t);
    }
  };
  const SYS = 'És o Nex, tutor de alunos do ensino secundário em Portugal (muitos são menores). Responde em português de Portugal, de forma direta e curta (no máximo 8 linhas), em texto simples, sem markdown. Usa a MATÉRIA dada como fonte; se a resposta não estiver lá e não tiveres a certeza, diz que não tens a certeza e manda confirmar no manual. Só ajudas com estudo; recusa com simpatia tudo o resto. Nunca peças dados pessoais. /no_think';

  /* ================= 5. Responder ================= */
  // p: { q, preset?, o? (contexto do exercício: D, m, it, r, conceito, ficha, ctxTxt), area?, est (estado da conversa), onText?, onEstado? }
  // devolve { text, sugestoes?, acoes?, fx?, fonte?, conf, modelo? }
  TNEX.responder = async function (p) {
    const est = p.est || (p.est = {}), q = String(p.q || '').trim().slice(0, 600);
    try { await TNEX.preparar(p.o && p.o.D ? p.o.D.id : null, !(p.o && p.o.D)); } catch (e) { }
    let r = null;
    try { r = determ(q, p, est); } catch (e) { try { console.warn('Nex', e); } catch (x) { } }
    if (!r || !r.text) r = { text: 'Não consegui tratar essa pergunta. Escreve-a de outra forma, com o nome da matéria.', conf: 0, sugestoes: ['O que sabes fazer?'] };
    if (r.modelo) {
      const e0 = await M.ver();
      if ((e0 === 'pronto' || e0 === 'instalado') && M.quota()) {
        try {
          if (p.onEstado) p.onEstado(e0 === 'pronto' ? 'O Nex está a escrever…' : 'A carregar o modelo do Nex…');
          const t = await M.gerar([{ role: 'system', content: SYS }, { role: 'user', content: 'MATÉRIA:\n' + curto(r.ctx || simples(r.text), 1500) + '\n\nPEDIDO DO ALUNO: ' + (r.pedido || q) }], p.onText);
          if (t && t.length > 20) { try { aiQuotaOk(); } catch (e) { } r.base = r.text; r.text = t; r.fx = null; r.fonte = 'Escrito pelo modelo no teu dispositivo, a partir da matéria da app. Pode errar: confirma no manual.'; if (r.naoSei) r.sugestoes = []; }
        } catch (e) { /* fica a resposta da matéria */ }
      } else if (r.naoSei && e0 === 'nao' && !est.ofereceu && !p.o) { est.ofereceu = 1; r.acoes = (r.acoes || []).concat([{ t: 'Instalar o modelo opcional do Nex', a: 'inst' }]); r.text += '\nPara perguntas fora da matéria podes instalar o modelo opcional do Nex (descarrega uma vez, por Wi-Fi).'; }
    }
    delete r.ctx; delete r.pedido;
    try { if (typeof ME !== 'undefined' && !ME.ai) { ME.ai = 1; syncProfile(); } } catch (e) { }
    return r;
  };

  /* ---------- Matemática: explicação de um exercício e análise do histórico ---------- */
  TNEX.explicaMat = function (t, Ex, g) {
    const T0 = (typeof TYPES !== 'undefined' && TYPES[t]) || {}, h = (typeof HELP !== 'undefined' && HELP[T0.h]) || null, ok = g === Ex.a, L = [], op = k => '(' + 'ABCD'[k] + ') ' + semTags(Ex.o[k]);
    L.push(ok ? 'Acertaste: ' + op(Ex.a) + '. O raciocínio é este.' : 'Escolheste ' + op(g) + '. A certa é ' + op(Ex.a) + '.');
    if (h) { L.push(b('Fórmula · ' + h.n) + ': ' + formTxt(h.f || '').replace(/\n/g, ' ; ')); L.push(b('O método')); (h.steps || []).forEach((s, i) => L.push((i + 1) + '. ' + semTags(s))); }
    L.push(b('Neste exercício')); (Ex.s || []).forEach(s => L.push('• ' + semTags(s)));
    const trap = (h && h.trap) || Ex.trap; if (trap) L.push(b(ok ? 'A armadilha a evitar' : 'O erro mais comum neste tipo') + ': ' + semTags(trap));
    if (h && h.calc) L.push(b('Na calculadora') + ': ' + h.calc);
    if (!ok) L.push('Refaz a conta ao lado destes passos e vê em qual deles o teu número deixa de coincidir.');
    return L.join('\n');
  };
  TNEX.analisaMat = function () {
    const agg = typeAgg(), arr = Object.values(agg).filter(a => TYPES[a.t] && a.d > 0);
    if (!arr.length) return 'Ainda não há respostas de Matemática para analisar. Faz uma ronda e volta aqui.';
    const lin = a => TYPES[a.t].n + ' (' + TYPES[a.t].t + '): ' + a.o + ' em ' + a.d + ' (' + Math.round(a.o / a.d * 100) + '%)';
    const bons = arr.filter(a => a.d >= 3 && a.o / a.d >= .8).sort((x, y) => y.o / y.d - x.o / x.d || y.d - x.d).slice(0, 4);
    const fracos = arr.filter(a => a.o / a.d < .8).sort((x, y) => x.o / x.d - y.o / y.d || y.d - x.d).slice(0, 4);
    const falta = (typeof active === 'function' ? active() : []).filter(t => !agg[t] && TYPES[t]).map(t => TYPES[t].n), L = [];
    if (bons.length) { L.push(b('O que já dominas')); bons.forEach(a => L.push('• ' + lin(a))); }
    if (fracos.length) { L.push(b('Onde erras mais')); fracos.forEach(a => { const h = HELP[TYPES[a.t].h]; L.push('• ' + lin(a) + (h && h.trap ? '. Armadilha: ' + semTags(h.trap) : '')); }); }
    L.push(b('O que treinar a seguir'));
    const ord = fracos.map(a => TYPES[a.t].n).concat(falta.slice(0, 3)); (ord.length ? ord : ['Faz uma simulação para confirmar que está tudo sólido.']).slice(0, 5).forEach((x, i) => L.push((i + 1) + '. ' + x));
    if (falta.length > 3) L.push('Ainda não fizeste: ' + falta.slice(3, 10).join(', ') + '.');
    return L.join('\n');
  };

  /* ================= 6. Interface ================= */
  // corpo de uma mensagem do Nex: texto, cartão de fórmula, ações e origem
  TNEX.corpo = function (m, idx) {
    if (!m.t) return '<span class="typing" aria-label="O Nex está a escrever"><i></i><i></i><i></i></span>';
    let h = '<div class="nxt">' + TNEX.fmt(m.t) + '</div>';
    if (m.fx && typeof helpCard === 'function' && typeof HELP !== 'undefined' && HELP[m.fx]) h = '<div class="nxt nxfx">' + helpCard(m.fx) + '</div>';
    if (m.a && m.a.length) h += '<div class="nxacts">' + m.a.map((a, k) => '<button type="button" class="x8p gh sm" data-nxa="' + idx + ':' + k + '">' + E(a.t) + '</button>').join('') + '</div>';
    if (m.f) h += '<p class="nxsrc">' + E(m.f) + '</p>';
    return h;
  };
  TNEX.agir = function (a) {
    try {
      document.querySelectorAll('.x11sh,.x11sh-bg').forEach(e => e.remove());
      if (a.a === 'conc') XD.irPara(a.did, a.cid);
      else if (a.a === 'mat') startSess('tipo', a.v);
      else if (a.a === 'ir') go(a.v);
      else if (a.a === 'ferr') XD.load(a.did).then(j => XD.openTools(XD.DISC.find(d => d.id === a.did), j, a.mid || null)).catch(() => { });
      else if (a.a === 'inst') IA8.install().then(() => M.ver()).then(() => { if (typeof view !== 'undefined' && view === 'comm' && commTab === 'ai') renderComm(); });
    } catch (e) { }
  };

  /* ---------- ecrã do Nex ---------- */
  const EST = {};                                             // estado da conversa do ecrã do Nex
  let vistoM = null;
  window.tutorHTML = function () {
    if (needLogin()) return emptyHTML(IC.spark, authErr ? 'Sem ligação ao servidor' : 'A preparar o Nex…', authErr ? 'Verifica a internet e abre a app outra vez.' : 'Só um momento.');
    M.ver().then(e0 => { if (e0 !== vistoM) { vistoM = e0; if (view === 'comm' && commTab === 'ai' && !tutorBusy) renderComm(); } });
    TNEX.preparar(AREA[lastArea()] === 'mat' ? null : AREA[lastArea()], false).catch(() => { });
    const area = lastArea(), sug = NEXSUG[area] || NEXSUG['Matemática'], me = M.est, comM = me === 'pronto' || me === 'instalado';
    const ult = TUTOR.length - 1, sugs = TUTOR.length && TUTOR[ult].r === 'a' && !tutorBusy ? (TUTOR[ult].s || []) : [];
    const msgs = TUTOR.map((m, i) => '<div class="msg' + (m.r === 'u' ? ' me' : '') + '">' + (m.r === 'u' ? avatar(ME.nick || '?', ME.cor, 'sm', ME.foto) : NEX8('normal', 34)) + '<div><div class="who"><b>' + (m.r === 'u' ? E(ME.nick || 'Tu') : 'Nex') + '</b></div><div class="txt">' + (m.r === 'u' ? E(m.t) : TNEX.corpo(m, i)) + '</div></div></div>').join('');
    const td = testDays();
    const vazio = '<div class="kgreet">' + NEX8('normal', 84) + '<div class="kbub">' + (td !== null && td <= 7 ? (td === 0 ? 'O teu teste é hoje. Fazemos uma revisão rápida?' : td === 1 ? 'O teu teste é amanhã. Pronto para uma ronda de prática?' : 'Faltam ' + td + ' dias para o teste. Começamos?') : 'Olá' + (ME.nick ? ', ' + E(ME.nick) : '') + '! Pergunta pela matéria de qualquer disciplina ou pede um exercício: eu corrijo e explico.') + '</div></div><div class="sugg">' + sug.concat(['Dá-me um exercício de ' + area]).map(s => '<button class="chip" data-sug="' + E(s) + '">' + E(s) + '</button>').join('') + '</div>';
    const rapidos = TUTOR.length ? (sugs.length ? sugs : ['Explica de forma mais simples', 'Dá-me um exemplo', 'Dá-me um exercício de ' + area]) : [];
    return '<div class="card chat x25chat nxchat"><div class="x25hd">' + NEX8(tutorBusy ? 'pensar' : 'normal', 40) + '<div><b>Nex</b><span>' + (comM ? 'Matéria da app e modelo no dispositivo' : 'Responde com a matéria da app') + '</span></div>' + (TUTOR.length ? '<button class="x8p gh sm" id="tu-clear">Limpar</button>' : '') + '</div>' +
      '<div class="msgs" id="tmsgs" aria-live="polite">' + (TUTOR.length ? msgs : vazio) + '</div>' +
      (rapidos.length ? '<div class="x11tq" role="group" aria-label="Sugestões">' + rapidos.slice(0, 5).map(s => '<button type="button" data-sug="' + E(s) + '"' + (tutorBusy ? ' disabled' : '') + '>' + E(s) + '</button>').join('') + '</div>' : '<div class="x11tq" hidden></div>') +
      '<form class="composer" id="tu-f"><input type="text" id="tu-in" maxlength="600" placeholder="Pergunta ao Nex…" autocomplete="off" aria-label="Pergunta ao Nex"><button class="x8p l sm" type="submit"' + (tutorBusy ? ' disabled' : '') + '>Enviar</button></form>' +
      '<p class="nxfine">O Nex responde com a matéria da app e pode não ter tudo: confirma no manual.' + (me === 'nao' ? ' <button type="button" class="xdlink" id="nex-inst">Instalar o modelo opcional (' + IA8.MOD.leve.mb + ')</button>' : '') + '</p></div>';
  };
  window.askTutor = async function (q) {
    q = String(q || '').trim();
    if (!tutorBusy && typeof nexCrise === 'function' && nexCrise(q)) { TUTOR.push({ r: 'a', t: CRISE_TXT, err: true, crise: true }); renderComm(); return; }
    if (tutorBusy || !q) return;
    tutorBusy = true; TUTOR.push({ r: 'u', t: q.slice(0, 600) }); const last = { r: 'a', t: '' }; TUTOR.push(last); renderComm();
    const caixa = () => document.querySelector('#tmsgs .msg:last-child .txt');
    let r;
    try { r = await TNEX.responder({ q, est: EST, area: lastArea(), onText: t => { const c = caixa(); if (c) { c.textContent = t; const bx = document.getElementById('tmsgs'); if (bx) bx.scrollTop = bx.scrollHeight; } }, onEstado: t => { const c = caixa(); if (c) c.textContent = t; } }); }
    catch (e) { r = { text: 'Não consegui responder a isso. Escreve a pergunta de outra forma.' }; }
    last.t = r.text; if (r.sugestoes && r.sugestoes.length) last.s = r.sugestoes; if (r.acoes && r.acoes.length) last.a = r.acoes; if (r.fx) last.fx = r.fx; if (r.fonte) last.f = r.fonte;
    tutorBusy = false; saveTutor(); renderComm();
  };
  // liga os botões de ação das respostas (ecrã do Nex)
  if (typeof renderComm === 'function') {
    const _rc = renderComm;
    renderComm = function () {
      const r = _rc.apply(this, arguments);
      try {
        if (commTab === 'ai') {
          document.querySelectorAll('#v-comm [data-nxa]').forEach(bt => bt.onclick = () => { const [i, k] = bt.dataset.nxa.split(':').map(Number), m = TUTOR[i]; if (m && m.a && m.a[k]) TNEX.agir(m.a[k]); });
          const bi = document.querySelector('#v-comm #nex-inst'); if (bi) bi.onclick = () => { bi.disabled = true; TNEX.agir({ a: 'inst' }); };
        }
      } catch (e) { }
      return r;
    };
  }
})();
