/* Pronex_Study · service worker
   Guarda a app no telemóvel para funcionar sem internet.
   Para publicar uma atualização: muda VERSION. A app mostra "Nova versão disponível"
   e só passa para a nova versão quando o utilizador carregar em "Atualizar". */
const VERSION = 'pronex-study-1.16.1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './ia-worker.js',
  './anim/lottie_light.min.js',
  './anim/nex-repouso.json',
  './anim/nex-festejar.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png','./icons/qr.png',
  './fontes/exo-2-latin.woff2',
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
    caches.open(VERSION).then((c) => c.addAll(FILES))
      .then(() => caches.keys())
      .then((keys) => { if (keys.some((k) => /^pronex-study-1\.[01]\./.test(k))) return self.skipWaiting(); })
  );
});

// Quando o utilizador carrega em "Atualizar", a app envia esta mensagem.
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// Ao ativar, apaga as versões antigas guardadas.
self.addEventListener('activate', (e) => {
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
  if (url.origin !== location.origin) return;
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
    body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.id || undefined, lang: 'pt-PT', data: { url: './' }
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
