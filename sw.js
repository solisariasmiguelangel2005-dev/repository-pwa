

const CACHE_NAME = 'devconnect-shell-v3';

const LOCAL_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './img/icon-192.png',
    './img/icon-512.png'
];

const EXTERNAL_CORS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

const EXTERNAL_NOCORS = [
    'https://cdn.tailwindcss.com'
];

// FASE DE INSTALACIÓN
self.addEventListener('install', event => {
    console.log('SW: Guardando recursos estáticos en la caché...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                console.log('SW: Caché abierta con éxito:', CACHE_NAME);

                await cache.addAll(LOCAL_ASSETS);

                const corsPromises = EXTERNAL_CORS.map(async url => {
                    try {
                        const response = await fetch(url, { mode: 'cors' });
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    } catch (err) {
                        console.warn(`SW: No se pudo guardar el CDN (${url}):`, err);
                    }
                });

                const noCorsPromises = EXTERNAL_NOCORS.map(async url => {
                    try {
                        const response = await fetch(url, { mode: 'no-cors' });
                        await cache.put(url, response);
                    } catch (err) {
                        console.warn(`SW: No se pudo guardar el CDN (${url}):`, err);
                    }
                });

                return Promise.all([...corsPromises, ...noCorsPromises]);
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

    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// FASE FETCH - Estrategia Cache First
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            if (cachedResponse) {
                console.log('SW: Sirviendo desde Caché', event.request.url);
                return cachedResponse;
            }

            return fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return Response.error();
            });
        })
    );
});