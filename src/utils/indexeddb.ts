const DB_NAME = 'ChatSecureStorage';
const STORE_NAME = 'secrets';
const PRIVATE_KEY_ALIAS = 'e2ee_private_key';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Saves the decrypted private key to local IndexedDB.
 */
export async function storeLocalPrivateKey(privateKey: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(privateKey, PRIVATE_KEY_ALIAS);
    return new Promise((res) => (tx.oncomplete = () => res()));
}

/**
 * Retrieves the decrypted private key from local IndexedDB.
 */
export async function getLocalPrivateKey(): Promise<string | null> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(PRIVATE_KEY_ALIAS);
    return new Promise((res) => (request.onsuccess = () => res(request.result || null)));
}

/**
 * Removes the private key from local storage (e.g. on logout).
 */
export async function clearLocalSecrets(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(PRIVATE_KEY_ALIAS);
    return new Promise((res) => (tx.oncomplete = () => res()));
}
