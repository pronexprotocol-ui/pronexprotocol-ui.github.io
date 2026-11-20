/* Pronex_Link · 03b-sistema.js
   Serviços do dispositivo e ajudas da interface que não são peças de ecrã: imagens em grande, sem internet,
   avisos do sistema e número no ícone, versão nova, ligações nas mensagens, PDF, contraste, listas locais
   (modelos e rascunhos) e o medidor de clareza dos pedidos. */
'use strict';
/* ---------- Imagens em grande ---------- */
// Qualquer <img class="zoom"> abre num visor ao carregar (conversas, entregas, pedidos, portefólio).
document.addEventListener('click', e => {
  const im = e.target.closest && e.target.closest('img.zoom'); if (!im || !im.src) return;
  e.preventDefault();
  folha(im.alt || 'Imagem', '<div class="visor"><img src="' + esc(im.src) + '" alt="' + esc(im.alt || '') + '"></div>');
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('img.zoom')) { e.preventDefault(); e.target.click(); } });

/* ---------- Sem internet ---------- */
function pintarRede() {
  let b = document.getElementById('rede');
  if (navigator.onLine !== false) { if (b) b.hidden = true; return; }
  if (!b) { b = document.createElement('div'); b.id = 'rede'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.textContent = 'Sem internet. O que fizeres fica neste dispositivo e é enviado quando a ligação voltar.'; b.hidden = false;
}
window.addEventListener('online', () => { pintarRede(); toast('Ligação de volta.'); });
window.addEventListener('offline', pintarRede);

/* ---------- Avisos do sistema e número no ícone (como a Pronex_Study) ---------- */
const AVISOS_SISTEMA = {
  ligado: () => { try { return localStorage.getItem('pl-push') === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch (e) { return false; } },
  suportado: () => 'Notification' in window,
  async ligar() {
    if (!('Notification' in window)) { toast(/iPhone|iPad/.test(navigator.userAgent) ? 'No iPhone, instala primeiro a app no ecrã principal para receberes avisos.' : 'Este dispositivo não mostra avisos.'); return false; }
    let p = Notification.permission; if (p === 'default') { try { p = await Notification.requestPermission(); } catch (e) { /* recusado */ } }
    if (p !== 'granted') { toast('O browser não deixou mostrar avisos. Muda isso nas definições do site.'); return false; }
    try { localStorage.setItem('pl-push', '1'); } catch (e) { /* sem espaço */ }
    return true;
  },
  desligar() { try { localStorage.removeItem('pl-push'); } catch (e) { /* sem espaço */ } },
  mostrar(titulo, texto, tag, hash) {
    if (!AVISOS_SISTEMA.ligado()) return;
    const op = { body: texto, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag, lang: 'pt-PT', data: { hash: hash || '' } };
    try { navigator.serviceWorker.ready.then(r => r.showNotification(titulo, op)).catch(() => { try { new Notification(titulo, op); } catch (x) { /* sem avisos */ } }); }
    catch (e) { try { new Notification(titulo, op); } catch (x) { /* sem avisos */ } }
  }
};
// Vê o que chegou de novo desde a última vez (avisos e mensagens de outras pessoas) e mostra um aviso do sistema
// quando a app está escondida. A primeira passagem só regista o que já existia.
const VISTOS = { pronto: false, ids: new Set() };
function verNovidades() {
  if (!DB || !Loja.eu()) return;
  const novos = [];
  DB.avisos.forEach(a => { if (a.para === DB.eu && !a.lido) { const k = 'a:' + a.id; if (!VISTOS.ids.has(k)) { VISTOS.ids.add(k); novos.push({ t: 'Pronex_Link', x: a.texto, tag: k, h: a.alvo && a.alvo.t === 'pedido' ? '#pedido/' + a.alvo.id : '' }); } } });
  Loja.minhasConversas().forEach(c => (c.msgs || []).forEach(m => { if (m.uid && m.uid !== DB.eu) { const k = 'm:' + m.id; if (!VISTOS.ids.has(k)) { VISTOS.ids.add(k); const q = Loja.pessoa(m.uid); novos.push({ t: q ? q.nome : 'Mensagem nova', x: m.texto || 'Enviou uma imagem.', tag: 'c:' + c.id, h: '#conversa/' + c.id }); } } }));
  const al = alertasArea();
  DB.pedidos.forEach(p => { const k = 'p:' + p.id; if (VISTOS.ids.has(k)) return; VISTOS.ids.add(k);
    if (p.estado === 'aberto' && p.uid !== DB.eu && al.includes(p.area) && Loja.visivel(p)) novos.push({ t: 'Pedido novo: ' + AREA(p.area).nome, x: p.titulo, tag: k, h: '#pedido/' + p.id, area: true }); });
  // pessoas que sigo: ficou disponível ou juntou um trabalho ao portefólio
  Loja.seguidos().forEach(u => { const q = Loja.pessoa(u); if (!q) return;
    if (q.disponivel) { const k = 'disp:' + u; if (!VISTOS.ids.has(k)) { VISTOS.ids.add(k); novos.push({ t: q.nome + ' está disponível', x: 'Pode fazer trabalhos ' + (q.areas || []).map(a => AREA(a).nome).slice(0, 2).join(' e '), tag: k, h: '#pessoa/' + u, area: true }); } } else VISTOS.ids.delete('disp:' + u);
    DB.pecas.filter(x => x.uid === u).forEach(x => { const k = 'pc:' + x.id; if (!VISTOS.ids.has(k)) { VISTOS.ids.add(k); novos.push({ t: q.nome + ' juntou um trabalho', x: x.titulo, tag: k, h: '#pessoa/' + u, area: true }); } }); });
  if (!VISTOS.pronto) { VISTOS.pronto = true; return; }
  if (!document.hidden) { const a = novos.filter(n => n.area); if (a.length) toast(a.length === 1 ? a[0].t + ' — ' + a[0].x : a.length + ' pedidos novos nas áreas que segues'); }
  if (document.hidden) novos.slice(-3).forEach(n => AVISOS_SISTEMA.mostrar(n.t, n.x, n.tag, n.h));
}
function pintarContagem() {
  const n = DB && Loja.eu() ? Loja.totalNaoLidas() + Loja.avisosPorLer() : 0;
  try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (e) { /* sem número no ícone */ }
  return n;
}

/* ---------- Versão nova da app ---------- */
function mostrarVersaoNova() {
  if (document.getElementById('nova')) return;
  const b = document.createElement('div'); b.id = 'nova'; b.setAttribute('role', 'status');
  b.innerHTML = '<span>Há uma versão nova da app.</span><button class="btn mini pri" type="button">Atualizar</button>';
  b.querySelector('button').addEventListener('click', () => location.reload());
  document.body.appendChild(b);
}

/* ---------- Ligações dentro das mensagens ---------- */
// Recebe texto JÁ escapado; transforma https://… em ligações que abrem noutro separador, mostrando só o site.
function ligacoes(txt) {
  return txt.replace(/\bhttps?:\/\/[^\s<]{3,300}/g, u => { const site = u.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0]; return '<a class="lk" href="' + u + '" target="_blank" rel="noopener noreferrer nofollow">' + site + '</a>'; });
}
const alertasArea = () => { try { return JSON.parse(localStorage.getItem('pl-alertas') || '[]'); } catch (e) { return []; } };
let RESPOSTA = null; // mensagem a que se está a responder: { c, id, uid, texto }

/* ---------- Guardar em PDF (imprimir) ---------- */
// Abre uma página limpa, clara e própria para papel, e chama a impressão do sistema (onde se escolhe «Guardar como PDF»).
function imprimirHTML(titulo, corpo) {
  const w = window.open('', '_blank'); if (!w) { toast('O browser bloqueou a janela. Deixa abrir janelas deste site e tenta outra vez.'); return; }
  w.document.write('<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>'
    + 'body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#141629;max-width:720px;margin:32px auto;padding:0 24px}'
    + 'h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:26px 0 8px;border-bottom:1px solid #DDE0EE;padding-bottom:4px}'
    + '.m{color:#5B607A}.peca{display:flex;gap:14px;margin:10px 0;break-inside:avoid}.peca img{width:120px;height:90px;object-fit:cover;border-radius:8px}'
    + '.selo{margin-top:30px;padding:16px;border:2px solid #6F4FF2;border-radius:12px}footer{margin-top:36px;color:#8A8FA8;font-size:12px}'
    + '@media print{body{margin:0 auto}}</style></head><body>' + corpo
    + '<footer>' + esc(APP_NOME) + ' · ' + esc(location.origin + location.pathname) + ' · gerado a ' + esc(dataLonga(Date.now())) + '</footer></body></html>');
  w.document.close(); w.focus(); setTimeout(() => { try { w.print(); } catch (e) { /* o utilizador imprime à mão */ } }, 350);
}
const altoContraste = () => { try { return localStorage.getItem('pl-contraste') === '1'; } catch (e) { return false; } };

/* ---------- Modelos próprios e rascunhos guardados (só neste dispositivo) ---------- */
const LISTA_LOCAL = {
  ler(k) { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
  gravar(k, l) { try { localStorage.setItem(k, JSON.stringify(l)); return true; } catch (e) { toast('Este dispositivo está sem espaço.'); return false; } }
};

/* ---------- Qualidade de um pedido ---------- */
// Quanto mais claro o pedido, mais e melhores propostas recebe. Devolve a nota (0 a 6) e a próxima dica.
function qualidadePedido(r) {
  const testes = [
    [String(r.titulo || '').trim().length >= 15, 'Dá um título que diga o que é (por exemplo, «Logótipo para a banda da escola»).'],
    [String(r.precisa || '').trim().length >= 80, 'Explica melhor o que é preciso: tamanho, estilo, o que já tens.'],
    [String(r.objetivo || '').trim().length >= 30, 'Diz o que queres alcançar: ajuda quem faz a acertar.'],
    [String(r.finalidade || '').trim().length > 0, 'Diz para que é (clube, projeto pessoal, exame…).'],
    [!!r.prazo, 'Põe um prazo, mesmo que aproximado.'],
    [!!r.img, 'Junta uma imagem de referência, se tiveres.']
  ];
  const n = testes.filter(t => t[0]).length, falta = testes.find(t => !t[0]);
  return { n, max: testes.length, nome: n <= 2 ? 'Pouco claro' : n <= 4 ? 'Claro' : 'Muito claro', dica: falta ? falta[1] : 'Está ótimo. Quem ler percebe logo o que precisas.' };
}

/* ---------- Estado da gravação (com conta) ---------- */
// «A guardar…» enquanto o servidor não confirma, «Por enviar» sem internet, «Guardado» quando acaba.
let gravTempo = 0, gravAntes = 0;
function pintarGravacao(n, falhou) {
  let b = document.getElementById('gravacao');
  if (!b) { b = document.createElement('div'); b.id = 'gravacao'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); b.hidden = true; document.body.appendChild(b); }
  clearTimeout(gravTempo);
  const mostra = (t, cls, ms) => { b.textContent = t; b.className = cls; b.hidden = false; if (ms) gravTempo = setTimeout(() => { b.hidden = true; }, ms); };
  if (falhou) { gravAntes = n; mostra('Não foi guardado', 'mal', 2500); return; }
  if (n > 0) { if (navigator.onLine === false) mostra('Por enviar · sem internet', 'espera'); else gravTempo = setTimeout(() => mostra('A guardar…', 'aguarda'), 400); }
  else if (gravAntes > 0) mostra('Guardado', 'ok', 1500);
  gravAntes = n;
}
window.addEventListener('offline', () => { if (gravAntes > 0) pintarGravacao(gravAntes); });

// Descrição curta do dispositivo, para o registo do painel (sem nada que identifique a pessoa).
// Respostas rápidas: as próprias (até 5, guardadas neste dispositivo) antes das da app.
function minhasRespostas() { try { const l = JSON.parse(localStorage.getItem('pl-respostas') || '[]'); return Array.isArray(l) ? l.filter(x => typeof x === 'string').slice(0, 5) : []; } catch (e) { return []; } }
function respostasRapidas() { const m = minhasRespostas(); return [...new Set(m.concat(RESPOSTAS_RAPIDAS))].slice(0, 8); }
// Poupança de dados: guardada neste dispositivo.
function poupanca() { try { return localStorage.getItem('pl-poupar') === '1'; } catch (e) { return false; } }
// Celebração ao concluir um trabalho: um momento curto; sem animação para quem a pediu desligada.
function celebrar(texto) {
  const d = document.createElement('div'); d.className = 'festa'; d.setAttribute('role', 'status');
  d.innerHTML = '<div class="festa-c">' + Array.from({ length: 14 }, (_, i) => '<i style="--i:' + i + '"></i>').join('') + '<b>' + esc(texto) + '</b></div>';
  document.body.appendChild(d); setTimeout(() => d.remove(), 2200);
}
// Contagem de uso anónima: uma por evento e por dia (link_uso/{dia}_{evento}). Não leva quem fez.
const USO_EVENTOS = [['abrir', 'Abriram o formulário de pedido'], ['publicar', 'Publicaram um pedido'], ['proposta', 'Enviaram uma proposta'], ['comecar', 'Começaram um trabalho'], ['concluir', 'Concluíram um trabalho']];
function contarUso(e) {
  if (!USO_EVENTOS.some(x => x[0] === e)) return;
  try { if (typeof Nuvem !== 'undefined' && Nuvem.ativa()) Nuvem.contar(e); else if (DB) { const k = hojeISO() + '_' + e; DB.uso = Object.assign({}, DB.uso, { [k]: ((DB.uso || {})[k] || 0) + 1 }); } } catch (x) { /* contar nunca estraga a ação */ }
}
function dispositivo() {
  const u = navigator.userAgent || '', so = /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'outro';
  const nav = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'outro';
  return so + ' · ' + nav;
}
// Apagar agendado: quando o prazo passa e a pessoa abre a app, os dados são apagados.
function verApagarAgendado() {
  if (!DB || !Loja.eu()) return false; const a = Loja.apagarEm(); if (!a || a > Date.now()) return false;
  const r = Loja.apagarConta(); if (r.erro) { toast(r.erro + ' O apagar fica em espera.'); return false; }
  PILHA.length = 0; NAV = { v: 'inicio', sub: null }; toast('Os teus dados foram apagados, como pediste há 7 dias.'); return true;
}
