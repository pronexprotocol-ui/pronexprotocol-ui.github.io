/* Pronex_Study · service worker
   Guarda a app no telemóvel para funcionar sem internet.
   Para publicar uma atualização: muda VERSION. A app mostra "Nova versão disponível"
   e só passa para a nova versão quando o utilizador carregar em "Atualizar". */
const VERSION = 'pronex-study-1.5.0';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png','./icons/qr.png',
  './fontes/exo-2-latin.woff2',
  './fontes/inter-latin.woff2',
  './fontes/jetbrains-mono-latin.woff2'
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
