// Service Worker para PWA Xuxum
// Versão 1.0.0

const CACHE_NAME = 'xuxum-pwa-v1';
const RUNTIME_CACHE = 'xuxum-runtime-v1';

// Recursos para cache na instalação
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Instalar service worker e fazer precache
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Fazendo cache dos recursos principais');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalado com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erro na instalação:', error);
      })
  );
});

// Ativar service worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remover caches antigos
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ativado com sucesso');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições (estratégia: Network First, fallback para Cache)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de extensões do browser
  if (event.request.url.includes('chrome-extension://')) {
    return;
  }

  // Ignorar requisições do Firebase (sempre buscar da rede)
  if (
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    // Tentar da rede primeiro
    fetch(event.request)
      .then((response) => {
        // Se conseguiu da rede, clonar e salvar no cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Se falhou (offline), tentar buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Service Worker: Servindo do cache:', event.request.url);
            return cachedResponse;
          }
          
          // Se não tem no cache e é HTML, retornar página offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          
          // Para outros recursos, retornar erro
          return new Response('Recurso não disponível offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Service Worker: Pulando espera e ativando imediatamente');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Service Worker: Limpando todos os caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Push notifications (futuro)
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push recebido:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova notificação do Xuxum',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'xuxum-notification',
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Xuxum', options)
    );
  }
});

// Clique em notificação (futuro)
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notificação clicada:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('🚀 Service Worker: Carregado');
