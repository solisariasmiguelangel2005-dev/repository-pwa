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
        const posts = await obtenerPosts();

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

async function enviarAlServidor(post) {
    // Simulación de envío a un endpoint backend o API REST externa
    console.log('[API] Enviando post al servidor en tiempo real:', post);
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-post');
    const formulario = document.getElementById('form-post');
    const inputAutor = document.getElementById('autor');
    const inputContenido = document.getElementById('contenido');
    const btnNuevo = document.getElementById('btn-nuevo-post');
    const btnCancelar = document.getElementById('btn-cancelar');
    const feed = document.getElementById('feed');

    // 1. Mostrar lo que ya está guardado
    cargarYRenderizarPosts();

    // 2. Abrir y cerrar el modal
    btnNuevo.addEventListener('click', () => {
        modal.classList.remove('hidden');
        inputAutor.focus();
    });

    btnCancelar.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // 3. Crear un post nuevo (un SOLO listener de submit)
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const texto = inputContenido.value.trim();
        if (!texto) return;

        const nuevoPost = {
            id: Date.now(), // siempre número, para que guardar, ordenar y borrar usen el mismo tipo
            autor: inputAutor.value.trim() || 'Anónimo',
            tiempo: new Date().toLocaleTimeString(),
            contenido: texto
        };

        // Guardado local + actualización visual inmediata
        await guardarPost(nuevoPost);
        formulario.reset();
        modal.classList.add('hidden');
        await cargarYRenderizarPosts();

        // Background Sync (si el navegador lo soporta)
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await guardarPostSincronizacion(nuevoPost);
                await registration.sync.register('sync-nuevos-posts');
                console.log('[App] Tarea de Background Sync registrada con éxito.');
            } catch (error) {
                console.warn('[App] Error al registrar Sync, intentando envío normal:', error);
                enviarAlServidor(nuevoPost);
            }
        } else {
            enviarAlServidor(nuevoPost);
        }
    });

    // 4. Borrar un post (delegación de eventos)
    feed.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-borrar');
        if (!btn) return;

        await eliminarPost(Number(btn.dataset.id));
        await cargarYRenderizarPosts();
    });
});