/* ==========================================================================
   PRONEX · sw.js — service worker do site (ponto 100 das melhorias)
   Um service worker é um pequeno programa que o navegador guarda e que fica
   entre o site e a rede. Este faz duas coisas:
     · páginas (HTML): tenta sempre a rede primeiro, para mostrar a versão mais
       recente; sem rede, mostra a última cópia guardada;
     · ficheiros (CSS, JS, fontes, imagens): mostra logo a cópia guardada e
       atualiza-a em segundo plano.
   Substitui o antigo sw.js de limpeza (ponto 9), que só servia para apagar uma
   app que tinha ficado por engano na raiz.

   Regras de segurança:
     · só trata pedidos GET deste site (nunca o envio de formulários, nem o
       FormSubmit, nem o WhatsApp);
     · nunca toca nas apps pronex_study e pronex_link, que têm os seus próprios
       service workers e caches;
     · só apaga caches com o nome "pronex-site-..." (as das apps ficam intactas).
   ========================================================================== */
'use strict';

// Mudar a versão (v2, v3...) obriga os navegadores a recomeçar a cache do zero
const CACHE = 'pronex-site-v1';

// Primeira instalação: guarda já as páginas principais, para funcionarem sem rede
const ESSENCIAIS = ['/', '/index.html', '/servicos.html', '/orcamento.html', '/contacto.html', '/en/', '/style.css', '/script.js', '/extras.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .catch(() => { /* se alguma falhar, o site funciona na mesma */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    // Só as caches antigas DESTE site; as das apps não se tocam
    await Promise.all(nomes.filter((n) => n.startsWith('pronex-site-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Fora do nosso alcance: outros sites, pedidos que não são GET e as apps
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/pronex_(study|link)\//.test(url.pathname) || url.pathname.startsWith('/__/')) return;
  // O estado dos projetos tem de vir sempre fresco da rede (nunca de uma cópia guardada)
  if (url.pathname.startsWith('/estado/')) return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    // Páginas: rede primeiro, cópia guardada se não houver rede
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) (await caches.open(CACHE)).put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || caches.match('/index.html');
      }
    })());
    return;
  }

  // Ficheiros: cópia guardada já, atualização em segundo plano
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
