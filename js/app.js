// Escapa texto para evitar inyección de HTML
function esc(texto) {
    const d = document.createElement('div');
    d.textContent = texto ?? '';
    return d.innerHTML;
}

// Genera el HTML de una tarjeta
function crearTarjeta(post) {
    const autor = post.autor || 'Anónimo';
    const tiempo = post.tiempo || post.fecha || '';
    const inicial = autor.charAt(0).toUpperCase();

    return `
        <article class="bg-white p-4 rounded-lg shadow mb-4 flex justify-between items-start">
            <div class="flex items-start">
                <div class="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">
                    ${esc(inicial)}
                </div>
                <div>
                    <div class="flex items-center mb-1">
                        <span class="font-bold text-gray-800 text-sm mr-2">${esc(autor)}</span>
                        <span class="text-xs text-gray-400">${esc(tiempo)}</span>
                    </div>
                    <p class="text-gray-700">${esc(post.contenido)}</p>
                </div>
            </div>
            <button data-id="${post.id}" class="btn-borrar text-red-500 hover:text-red-700 text-xs p-1">
                <i class="fa-solid fa-trash"></i>
            </button>
        </article>
    `;
}

// Lee de IndexedDB y pinta en pantalla
async function cargarYRenderizarPosts() {
    const feed = document.getElementById('feed');
    if (!feed) return;

    try {
        const posts = await obtenerDeIndexedDB('posts');

        if (posts.length === 0) {
            feed.innerHTML = '<p class="text-center text-gray-500 py-4">No hay publicaciones locales.</p>';
            return;
        }

        // Más nuevos primero
        posts.sort((a, b) => Number(b.id) - Number(a.id));
        feed.innerHTML = posts.map(crearTarjeta).join('');
    } catch (err) {
        console.error('Error al cargar posts:', err);
        feed.innerHTML = '<p class="text-center text-red-500 py-4">Error al leer la base de datos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('form-post');
    const input = document.getElementById('input-contenido');
    const feed = document.getElementById('feed');

    // 1. Mostrar lo que ya está guardado
    cargarYRenderizarPosts();

    // 2. Crear un post nuevo
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const texto = input.value.trim();
        if (!texto) return;

        await guardarEnIndexedDB('posts', {
            id: Date.now(), // número, no texto
            autor: 'Desarrollador Local',
            tiempo: new Date().toLocaleTimeString(),
            contenido: texto
        });

        formulario.reset();
        await cargarYRenderizarPosts();
    });

    // 3. Borrar un post (delegación de eventos)
    feed.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-borrar');
        if (!btn) return;

        await borrarDeIndexedDB('posts', Number(btn.dataset.id));
        await cargarYRenderizarPosts();
    });

    // 4. El botón del lápiz lleva el cursor al cuadro de texto
    const btnNuevo = document.getElementById('btn-nuevo-post');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
        });
    }
});


// js/app.js - Registro de la tarea de sincronización
document.getElementById('form-post')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const contenido = document.getElementById('input-contenido').value;
    if (!contenido.trim()) return;

    const nuevoPost = {
        id: Date.now().toString(),
        autor: 'Estudiante PWA',
        contenido: contenido,
        fecha: new Date().toLocaleTimeString()
    };

    // 1. Guardamos localmente en el feed para actualización visual inmediata
    await guardarPost(nuevoPost);
    await cargarYRenderizarPosts();
    document.getElementById('form-post').reset();

    // 2. Verificamos soporte de Background Sync y Service Worker
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            // Guardamos en la cola temporal de IndexedDB
            await guardarPostSincronizacion(nuevoPost);
            // Registramos la etiqueta de sincronización
            await registration.sync.register('sync-nuevos-posts');
            console.log('[App] Tarea de Background Sync registrada con éxito.');
        } catch (error) {
            console.warn('[App] Error al registrar Sync, intentando envío normal:', error);
            enviarAlServidor(nuevoPost);
        }
    } else {
        // Fallback para navegadores que no soportan SyncManager
        enviarAlServidor(nuevoPost);
    }
});

async function enviarAlServidor(post) {
    // Simulación de envío a un endpoint backend o API REST externa
    console.log('[API] Enviando post al servidor en tiempo real:', post);
}