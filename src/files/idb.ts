/**
 * A very small IndexedDB wrapper. Documents are far too big for localStorage
 * once a project has a handful of screens in it, and IndexedDB is the only
 * storage every browser gives us that is both large and synchronously
 * transactional. No dependency, ~80 lines.
 */

const DB_NAME = 'applecider'
const DB_VERSION = 1
const STORE = 'items'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('parentId', 'parentId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open the local database'))
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('Storage request failed'))
      }),
  )
}

export const idb = {
  get: <T>(id: string) => tx<T>('readonly', (s) => s.get(id) as IDBRequest<T>),
  all: <T>() => tx<T[]>('readonly', (s) => s.getAll() as IDBRequest<T[]>),
  put: <T>(value: T) => tx('readwrite', (s) => s.put(value)),
  del: (id: string) => tx('readwrite', (s) => s.delete(id)),
  clear: () => tx('readwrite', (s) => s.clear()),
  available: () => typeof indexedDB !== 'undefined',
}
