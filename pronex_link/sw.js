/* Pronex_Link · service worker: guarda a app para abrir sem internet.
   Ao publicar uma versão nova, mudar VERSION (e FILES, se houver ficheiros novos). */
const VERSION = 'pronex-link-0.18.1';
const FILES = ['./', 'index.html', '../site.webmanifest', 'css/app.css', 'css/marca.css', 'js/marca.js',
  'js/01-dados.js', 'js/02-loja.js', 'js/02b-rede.js', 'js/02c-estudo.js', 'js/03-ui.js', 'js/03b-sistema.js', 'js/04-pecas.js', 'js/05-ecra-inicio.js', 'js/06-ecra-pedidos.js', 'js/07-ecra-pessoas.js', 'js/08-ecra-conversas.js', 'js/09-ecra-mais.js', 'js/10-acoes-pedidos.js', 'js/11-acoes-perfil.js', 'js/12-nuvem.js', 'js/14-ecra-rede.js', 'js/15-ecra-estudo.js', 'js/13-arranque.js', 'config.js',
  'fontes/bricolage-latin-700.woff2', 'fontes/bricolage-latin-800.woff2', 'fontes/bricolage-latin-ext-800.woff2', 'fontes/inter-latin.woff2', 'fontes/exo-2-latin.woff2',
  'icons/logo.png', 'icons/pronex.webp', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pronex-link-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Carregar num aviso do sistema abre (ou traz para a frente) a app no sítio certo.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.hash) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.includes('/pronex_link/'));
    if (c) { if (hash) c.postMessage({ abrir: hash }); return c.focus(); }
    return self.clients.openWindow('./' + hash);
  }));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
