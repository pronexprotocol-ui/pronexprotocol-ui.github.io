/* Pronex_Link · 03-ui.js
   Peças comuns aos ecrãs: texto seguro, ícones, facetas de cristal, avatar, estrelas, datas, aviso e folha. */
'use strict';
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICO = {
  gosto: '<path d="M7 11v9H4v-9zM7 11l4-7c1.7 0 2.6 1.2 2.2 2.8L12.6 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>',
  repetir: '<path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/>',
  pincel: '<path d="M14 4l6 6-8 8H6v-6zM4 20h4"/>',
  codigo: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cubo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9"/>',
  nota: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  lapis: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  texto: '<path d="M5 6h14M5 11h14M5 16h9"/>',
  globo: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3.5 3 13.5 0 17M12 3.5c-3 3.5-3 13.5 0 17"/>',
  calendario: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pino: '<path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9"/>',
  chama: '<path d="M12 3c1 3 4 5 4 9a4 4 0 01-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z"/>',
  raio: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  mais3: '<circle cx="5" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="19" cy="12" r="1.600"/>',
  cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  sino: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0"/>',
  marcador: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  certo: '<path d="M5 12l5 5 9-10"/>',
  partilhar: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 114 2c-.900.700-1.500 1.200-1.500 2.500M12 17.500v.010"/>',
  imagem: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.500"/><path d="M21 16l-5-5-8 8"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  selo: '<circle cx="12" cy="9" r="6"/><path d="M8.500 14l-1.500 7 5-3 5 3-1.500-7"/>',
  inicio: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  pedidos: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.900 6.500 5.500M16 5a3.500 3.500 0 010 7M18 14.800c1.900.700 3.200 2.400 3.600 5.200"/>',
  conversas: '<path d="M20 12a8 8 0 01-11.800 7L4 20l1.100-4A8 8 0 1120 12z"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.200 4-6.500 8-6.500s7.200 2.300 8 6.500"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  procurar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.500-3.500"/>',
  enviar: '<path d="M4 12l16-8-6 16-3-6z"/>',
  bandeira: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  editar: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500L19 19M5 19l1.500-1.500M17.500 6.500L19 5"/>',
  ligacao: '<path d="M10 14a4 4 0 005.700 0l3-3a4 4 0 00-5.700-5.700l-1 1M14 10a4 4 0 00-5.700 0l-3 3a4 4 0 005.700 5.700l1-1"/>'
};
const ico = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[n] || '') + '</svg>';
const ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="FILL" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M12 3.200l2.700 5.600 6.100.800-4.500 4.300 1.100 6.100L12 17.100 6.600 20l1.100-6.100L3.200 9.600l6.100-.800z"/></svg>';
function estrelas(n) {
  n = Math.round(n);
  let h = '<span class="estrelas" role="img" aria-label="' + n + ' de 5 estrelas">';
  for (let i = 1; i <= 5; i++) h += ESTRELA.replace('FILL', i <= n ? 'currentColor' : 'none');
  return h + '</span>';
}

/* Facetas de cristal, na linguagem do logótipo PRONEX. O mesmo texto (semente) dá sempre o mesmo desenho. */
const Facetas = (function () {
  const cache = new Map();
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = hash(seed) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; }
  const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  function svg(seed, cor, cols, rows) {
    const k = seed + '|' + cor + '|' + cols + '|' + rows;
    if (cache.has(k)) return cache.get(k);
    const r = rng(seed), W = 400, H = 250, P = [];
    for (let j = 0; j <= rows; j++) { P.push([]); for (let i = 0; i <= cols; i++) P[j].push([i * W / cols + (i > 0 && i < cols ? (r() - .5) * W / cols * .7 : 0), j * H / rows + (j > 0 && j < rows ? (r() - .5) * H / rows * .7 : 0)]); }
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">';
    const tri = (a, b, c) => { const cy = (a[1] + b[1] + c[1]) / 3, cx = (a[0] + b[0] + c[0]) / 3; const l = (.5 - cy / H) * .5 + (.4 - cx / W) * .25 + (r() - .5) * .32; const f = l >= 0 ? mix(cor, '#ffffff', Math.min(.55, l)) : mix(cor, '#0B0D1A', Math.min(.6, -l)); s += '<path fill="' + f + '" stroke="' + f + '" stroke-width=".6" d="M' + a.map(v => v.toFixed(1)).join(' ') + 'L' + b.map(v => v.toFixed(1)).join(' ') + 'L' + c.map(v => v.toFixed(1)).join(' ') + 'Z"/>'; };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i]; if (r() > .5) { tri(a, b, c); tri(a, c, d); } else { tri(a, b, d); tri(b, c, d); } }
    s += '</svg>';
    const u = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) + '")';
    cache.set(k, u); return u;
  }
  return { svg };
})();
// Imagem de uma peça do portefólio: a fotografia, se houver; se não, facetas na cor da área.
// Só entram imagens criadas pela própria app (data:image). Qualquer outro valor é ignorado.
const imgSegura = v => (typeof v === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) ? v : '';
const capaDe = peca => imgSegura(peca.img) ? 'url(' + imgSegura(peca.img) + ')' : Facetas.svg(peca.id + peca.titulo, AREA(peca.area).cor, 5, 4);

/* Avatar igual ao da Pronex_Study: redondo, com a cor escolhida (g0 a g11) e as iniciais, ou a fotografia. */
function avatar(p, cls) {
  if (!p) return '<span class="av ' + (cls || '') + ' g5" aria-hidden="true">?</span>';
  const foto = imgSegura(p.foto), cor = p.cor >= 0 && p.cor < CORES ? p.cor : Loja.corInicial(p.uid);
  const ini = String(p.nome || '?').replace(/^Prof\.\s*/i, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return '<span class="av ' + (cls || '') + ' g' + cor + (foto ? ' ph' : '') + '" aria-hidden="true">' + (foto ? '<img loading="lazy" decoding="async" src="' + foto + '" alt="">' : esc(ini)) + '</span>';
}
// Números da Pronex_Study (nível, sequência, XP), em fichas como no perfil de lá.
function fichasStudy(uid) {
  const s = Loja.study(uid); if (!s) return '';
  const n = v => Number(v) || 0;
  return '<span class="fichas"><span class="ficha">Nível ' + Math.max(1, n(s.nivel)) + '</span><span class="ficha chama">' + ico('chama') + n(s.streak) + (n(s.streak) === 1 ? ' dia' : ' dias') + '</span><span class="ficha raio">' + ico('raio') + n(s.xp).toLocaleString('pt-PT') + ' XP</span></span>';
}
const chipArea = id => { const a = AREA(id); return '<span class="chip area" style="--ac:' + a.cor + '">' + (ICO[ICO_AREA[a.id]] ? ico(ICO_AREA[a.id]) : '') + esc(a.nome) + '</span>'; };
// Texto sem acentos e em minúsculas, para a pesquisa encontrar «musica» em «música».
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function chipPrazo(p) {
  const d = Loja.prazoInfo(p); if (d == null) return '';
  if (d < 0) return '<span class="chip bad">Prazo ultrapassado</span>';
  if (d === 0) return '<span class="chip warn">Termina hoje</span>';
  if (d <= 3) return '<span class="chip warn">' + (d === 1 ? 'Falta 1 dia' : 'Faltam ' + d + ' dias') + '</span>';
  return '<span class="chip">Até ' + esc(dataPrazo(p.prazo)) + '</span>';
}
const dataLonga = ms => new Date(ms).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
// Copia texto. Se o browser recusar, mostra o texto numa folha para a pessoa copiar à mão.
function copiar(texto, msgOk) {
  const falha = () => folha('Copiar', '<p class="muted">Seleciona o texto e copia.</p><textarea readonly rows="8" style="font-size:14px">' + esc(texto) + '</textarea>', f => { const t = $('textarea', f); t.focus(); t.select(); });
  try { navigator.clipboard.writeText(texto).then(() => toast(msgOk || 'Copiado'), falha); } catch (e) { falha(); }
}
const chipEstado = e => { const s = ESTADOS[e] || ESTADOS.aberto; return '<span class="chip ' + s.chip + '">' + s.nome + '</span>'; };
// O ano e curso só aparecem a quem trabalha (ou trabalhou) com a pessoa, se ela o escondeu.
const cursoVisivel = p => !!p && !!p.curso && (!p.cursoPrivado || p.uid === DB.eu || Loja.trabalhamosJuntos(p.uid) || Loja.eAdmin());
const rotuloTipo = p => p ? (p.tipo === 'professor' ? 'Professor' : 'Aluno') + (cursoVisivel(p) ? ', ' + p.curso : '') : '';

function quando(ms) {
  const d = Date.now() - ms, m = 60000, h = 3600000, dia = 86400000;
  if (d < m) return 'agora';
  if (d < h) return 'há ' + Math.floor(d / m) + ' min';
  if (d < dia) return 'há ' + Math.floor(d / h) + ' h';
  if (d < 2 * dia) return 'ontem';
  if (d < 30 * dia) return 'há ' + Math.floor(d / dia) + ' dias';
  return new Date(ms).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}
const hora = ms => new Date(ms).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
function dataPrazo(iso) { if (!iso) return ''; const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }); }

let _toastT = 0;
function toast(msg) {
  const t = $('#toast'); if (!t || !msg) return;
  t.textContent = msg; t.hidden = false; clearTimeout(_toastT); _toastT = setTimeout(() => { t.hidden = true; }, 3200);
}

/* Folha: painel que sobe do fundo no telemóvel e fica ao centro no computador. Substitui alert/confirm. */
let _folha = null;
function folha(titulo, corpo, aoAbrir) {
  fecharFolha();
  const antes = document.activeElement;
  const f = document.createElement('div'); f.className = 'fundo';
  f.innerHTML = '<div class="folha" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><div class="fh"><h2>' + esc(titulo) + '</h2><button type="button" class="x" data-a="fechar-folha" aria-label="Fechar">' + ico('fechar') + '</button></div>' + corpo + '</div>';
  f.addEventListener('mousedown', e => { if (e.target === f) fecharFolha(); });
  document.body.appendChild(f); _folha = { el: f, antes };
  const alvo = f.querySelector('input:not([type=checkbox]):not([type=file]),textarea,select') || f.querySelector('.fh .x');
  // Põe o cursor no primeiro campo, mas só se a pessoa ainda não tiver tocado noutro sítio da folha.
  if (alvo) setTimeout(() => { if (document.contains(alvo) && !f.contains(document.activeElement)) alvo.focus(); }, 30);
  if (aoAbrir) aoAbrir(f);
  return f;
}
function fecharFolha() {
  if (!_folha) return;
  _folha.el.remove(); const a = _folha.antes; _folha = null;
  if (a && document.contains(a)) a.focus();
}
document.addEventListener('keydown', e => {
  if (!_folha) return;
  if (e.key === 'Escape') { fecharFolha(); return; }
  if (e.key === 'Tab') { // o foco fica dentro da folha
    const f = [..._folha.el.querySelectorAll('button,input,textarea,select,a[href]')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
function confirmar(titulo, texto, rotulo, acao, perigo) {
  folha(titulo, '<p class="muted">' + esc(texto) + '</p><div class="acoes"><button type="button" class="btn" data-a="fechar-folha">Voltar</button><button type="button" class="btn ' + (perigo ? 'perigo' : 'pri') + '" id="cf-ok">' + esc(rotulo) + '</button></div>', f => {
    $('#cf-ok', f).addEventListener('click', () => { fecharFolha(); acao(); });
  });
}

/* Como na Pronex_Study: se um texto parece um contacto (telefone, email, rede social), pergunta antes de publicar.
   Se parece um pedido de ajuda (crise), mostra os contactos de ajuda antes de enviar. Depois chama fazer(). */
function verificarAntes(textos, fazer) {
  const t = textos.filter(Boolean).join(' ');
  const passo2 = () => (pareceContacto(t) ? folha('Isto parece um contacto', '<p class="muted">Um telefone, um email ou uma rede social ficam à vista de quem lê. Tens a certeza de que queres publicar?</p><div class="acoes"><button type="button" class="btn" data-a="fechar-folha">Voltar e rever</button><button type="button" class="btn pri" id="ct-sim">Publicar na mesma</button></div>', f => $('#ct-sim', f).addEventListener('click', () => { fecharFolha(); fazer(); })) : fazer());
  if (CRISE_RE.test(t)) return folha('Não estás sozinho', '<p>Isto é importante e mereces apoio de uma pessoa a sério. Fala com alguém em quem confies: os teus pais, um professor ou o diretor de turma.</p><p class="muted">Podes ligar, de graça:</p><ul class="regras">' + CRISE_AJUDA.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul><div class="acoes"><button type="button" class="btn" data-a="fechar-folha">Voltar</button><button type="button" class="btn pri" id="cr-seguir">Continuar</button></div>', f => $('#cr-seguir', f).addEventListener('click', () => { fecharFolha(); passo2(); }));
  passo2();
}

/* Lê uma imagem escolhida pela pessoa e devolve-a reduzida (JPEG, lado maior até 900 px). */
function lerImagem(file, max) {
  const nuvem = typeof Nuvem !== 'undefined' && Nuvem.ativa();
  max = max || (nuvem ? 720 : 900);
  return new Promise((ok, falha) => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return falha(new Error('Escolhe uma imagem JPG, PNG ou WebP.'));
    if (file.size > 12 * 1024 * 1024) return falha(new Error('A imagem é grande de mais (máximo 12 MB).'));
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); const webp = c.toDataURL('image/webp', nuvem ? .72 : .8); ok(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', nuvem ? .72 : .8)); // WebP fica mais leve; se o browser não o fizer, JPEG
    };
    im.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não foi possível abrir esta imagem.')); };
    im.src = url;
  });
}
