const CACHE_NAME = 'vendas-mj-dynamic-v2';

// Salva apenas o básico na instalação para evitar o bloqueio do navegador (CORS)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Ignora requisições do Firebase/Firestore para não dar conflito com o banco de dados
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // 1. Tenta carregar do cache primeiro (instantâneo se já estiver salvo)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Se não estiver no cache, busca na internet
      return fetch(e.request).then((networkResponse) => {
        // Verifica se o arquivo é válido antes de salvar
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // 3. Salva uma cópia no cache de forma silenciosa (Cache Dinâmico)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se a internet cair e o arquivo não estiver no cache, tenta mostrar o index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});