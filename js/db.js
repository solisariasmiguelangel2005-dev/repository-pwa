
const DB_NAME = 'devconnect-db';
const DB_VERSION = 2; 
const STORE_NAME = 'posts';
const SYNC_STORE_NAME = 'sync-posts'; 

const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        // Versión 1: Almacén principal
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        // Versión 2: Almacén de cola para sincronización en segundo plano
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
            db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
            console.log('[IndexedDB] Almacén de sincronización "sync-posts" creado.');
        }
    }
});

// ---------- Funciones genéricas (reciben el nombre del almacén) ----------

// Insertar o actualizar un registro
async function guardarEnIndexedDB(tabla, objeto) {
    const db = await dbPromise;
    const tx = db.transaction(tabla, 'readwrite');
    await tx.objectStore(tabla).put(objeto);
    await tx.done;
    return objeto;
}

// Obtener todos los registros de un almacén
async function obtenerDeIndexedDB(tabla) {
    const db = await dbPromise;
    return await db.getAll(tabla);
}

// Borrar un registro por su ID
async function borrarDeIndexedDB(tabla, id) {
    const db = await dbPromise;
    const tx = db.transaction(tabla, 'readwrite');
    await tx.objectStore(tabla).delete(id);
    await tx.done;
}

// ---------- CRUD del almacén principal "posts" ----------

// C - CREATE / UPDATE
async function guardarPost(post) {
    await guardarEnIndexedDB(STORE_NAME, post);
    console.log('[DB] Post guardado en IndexedDB:', post.id);
}

// R - READ
async function obtenerPosts() {
    return await obtenerDeIndexedDB(STORE_NAME);
}

// D - DELETE
async function eliminarPost(id) {
    await borrarDeIndexedDB(STORE_NAME, id);
    console.log('[DB] Post eliminado de IndexedDB:', id);
}

// ---------- Cola de sincronización (almacén "sync-posts") ----------

async function guardarPostSincronizacion(post) {
    await guardarEnIndexedDB(SYNC_STORE_NAME, post);
}

async function obtenerPostsSincronizacion() {
    return await obtenerDeIndexedDB(SYNC_STORE_NAME);
}

async function borrarPostSincronizacion(id) {
    await borrarDeIndexedDB(SYNC_STORE_NAME, id);
}