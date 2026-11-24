/* Pronex_Study · service worker
   Guarda a app no telemóvel para funcionar sem internet.
   Para publicar uma atualização: muda VERSION. A app mostra "Nova versão disponível"
   e só passa para a nova versão quando o utilizador carregar em "Atualizar". */
const VERSION = 'pronex-study-1.44.1';
const FILES = [
  './',
  './index.html',
  '../site.webmanifest',
  './css/marca.css',
  './js/marca.js',
  './icons/pronex-80.webp',
  './fontes/exo-2-latin.woff2',
  './config.js',
  './ia-worker.js',
  './css/base.css',
  './css/nova.css',
  './css/app.css',
  './js/01-matematica-geradores.js',
  './js/02-matematica-formulas.js',
  './js/03-nucleo.js',
  './js/04-ecras.js',
  './js/05-contas-mural-painel.js',
  './js/06-entrada-definicoes.js',
  './js/07-cartoes-ferramentas.js',
  './js/08-comunidade.js',
  './js/09-erro-fichas-tema.js',
  './js/10-pontos-ligas.js',
  './js/11-arranque.js',
  './js/disciplinas.js',
  './js/nex.js',
  './js/cristal.js',
  './js/nova.js',
  './js/painel.js',
  './py-worker.js',
  './anim/lottie_light.min.js',
  './js/lib/qrcode.min.js',
  './anim/nex-repouso.json',
  './anim/nex-festejar.json',
  './icons/v2/icon-192.png',
  './icons/v2/icon-512.png',
  './icons/v2/maskable-512.png',
  './icons/v2/apple-touch-icon.png','./icons/qr.png',
  './fontes/inter-latin.woff2',
  './fontes/jetbrains-mono-latin.woff2',
  './fontes/bricolage-latin-700.woff2',
  './fontes/bricolage-latin-800.woff2',
  './fontes/bricolage-latin-ext-800.woff2',
  './legal/termos.html',
  './legal/privacidade.html',
  './legal/regras.html',
  './legal/licencas.html'
];

// Instala a nova versão em segundo plano, mas não a ativa sozinha.
// Exceção: quem ainda tem a 1.0 ou 1.1 (cujo botão Atualizar falhava) passa logo para a versão nova.
self.addEventListener('install', (e) => {
  e.waitUntil(
    // 1.33: cada ficheiro é confirmado com o servidor, para nunca juntar ficheiros de versões diferentes.
    // 1.38: «no-cache» em vez de «reload»: o servidor responde «não mudou» (304) aos ficheiros iguais e só os que
    // mudaram são descarregados outra vez. Antes, cada atualização voltava a descarregar a app inteira.
    caches.open(VERSION).then((c) => Promise.all(FILES.map((f) => fetch(new Request(f, { cache: 'no-cache' })).then((r) => { if (!r.ok) throw new Error(f + ': ' + r.status); return c.put(f, r); }))))
      .then(() => caches.keys())
      .then((keys) => { if (keys.some((k) => /^pronex-study-1\.[01]\./.test(k))) return self.skipWaiting(); })
  );
});

// Quando o utilizador carrega em "Atualizar", a app envia esta mensagem.
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// Ao ativar, apaga as versões antigas guardadas.
// Conteúdo das disciplinas e ferramentas: descarregado em segundo plano quando a versão nova fica ativa,
// para funcionar sem internet mesmo nas disciplinas que ainda não abriste (e já com o conteúdo novo).
const DISC = ['filosofia', 'portugues', 'ingles', 'desenho', 'teologia', 'modelacao3d', 'python', 'psicologia', 'hca'];
// 1.27: o conteúdo fica numa cache com a versão, para o código novo nunca correr com conteúdo antigo.
const DC = 'pronex-disc-' + VERSION;
function prefetchDisc() { return caches.open(DC).then((c) => Promise.all(DISC.flatMap((d) => ['disc/' + d + '.json', 'disc/ferr_' + d + '.json']).map((f) => { const u = new URL(f, self.registration.scope).href; return fetch(u, { cache: 'no-cache' }).then((r) => { if (r.ok) return c.put(u, r); }).catch(() => { }); }))); }
self.addEventListener('activate', (e) => {
  prefetchDisc().then(() => caches.keys()).then((keys) => Promise.all(keys.filter((k) => k.startsWith('pronex-disc') && k !== DC).map((k) => caches.delete(k)))).catch(() => { });
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pronex-study-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve primeiro o que está guardado; se não estiver, vai à internet.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // O Firebase (www.gstatic.com/firebasejs) fica guardado para a app abrir mesmo com rede fraca ou sem rede.
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.open('pronex-sdk').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // Python (Pyodide em cdn.jsdelivr.net/pyodide) fica guardado depois da primeira vez.
  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith('/pyodide/')) {
    e.respondWith(caches.open('pronex-py').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // 1.26: o motor do Nex (WebLLM em cdn.jsdelivr.net/npm/…/+esm) também fica guardado, para o Nex funcionar sem internet.
  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith('/npm/') && (url.pathname.startsWith('/npm/@mlc-ai/') || url.pathname.endsWith('/+esm'))) {
    e.respondWith(caches.open('pronex-ia').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Conteúdo das disciplinas (disc/*.json): usa o desta versão; sem rede, o de qualquer versão guardada.
  if (url.pathname.includes('/disc/') && url.pathname.endsWith('.json')) {
    e.respondWith(caches.open(DC).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })
      .catch(() => caches.match(req).then((old) => old || Response.error())))));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});

// Aviso enviado pelo servidor (Firebase Cloud Messaging) com a app fechada.
// A mensagem traz só dados (titulo, texto, id); a etiqueta (tag) igual à do aviso
// mostrado pela app aberta evita avisos repetidos.
self.addEventListener('push', (e) => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = {}; }
  const d = p.data || p;
  const title = String(d.titulo || (p.notification && p.notification.title) || 'Pronex_Study').slice(0, 80);
  const body = String(d.texto || (p.notification && p.notification.body) || '').slice(0, 300);
  e.waitUntil(self.registration.showNotification(title, {
    body, icon: 'icons/v2/icon-192.png', badge: 'icons/v2/icon-192.png', tag: d.id || undefined, lang: 'pt-PT', data: { url: './' }
  }));
});

// Tocar num aviso abre (ou traz para a frente) a app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
