// IndexedDB key-value store
const DB_NAME = 'hoso_db'
const STORE = 'keyval'
const VERSION = 1

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION)
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE)
        }
        req.onsuccess = (e) => resolve(e.target.result)
        req.onerror = (e) => reject(e.target.error)
    })
}

export async function idbGet(key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

export async function idbSet(key, val) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const req = tx.objectStore(STORE).put(val, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}

export async function idbDel(key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const req = tx.objectStore(STORE).delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}
