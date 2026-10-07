// sw.js - Service Worker limpio y compatible con CDN

const CACHE_NAME = 'devconnect-shell-v1';

// 1. Archivos locales de tu proyecto
const LOCAL_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js'
];

// 2. Recursos externos de CDN
const EXTERNAL_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// FASE DE INSTALACIÓN
self.addEventListener('install', event => {
    console.log('SW: Guardando recursos estáticos en la caché...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                console.log('SW: Caché abierta con éxito:', CACHE_NAME);
                
                // Guardar recursos locales normalmente
                await cache.addAll(LOCAL_ASSETS);

                // Guardar recursos externos usando mode: 'no-cors' para evitar bloqueo CORS
                const externalPromises = EXTERNAL_ASSETS.map(async url => {
                    try {
                        const response = await fetch(url, { mode: 'no-cors' });
                        await cache.put(url, response);
                    } catch (err) {
                        console.warn(`SW: No se pudo guardar el CDN (${url}):`, err);
                    }
                });

                return Promise.all(externalPromises);
            })
            .then(() => {
                console.log('SW: Todos los archivos del App Shell fueron almacenados.');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('SW: Falló el almacenamiento en caché del App Shell:', err);
            })
    );
});

// FASE DE ACTIVACIÓN
self.addEventListener('activate', event => {
    console.log('SW: Activado y listo.');
    return self.clients.claim();
});

// FASE FETCH
self.addEventListener('fetch', event => {
    console.log('SW pidiendo:', event.request.url);

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request);
            })
    );
});