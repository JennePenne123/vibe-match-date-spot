/**
 * Secure storage for the "remember me" e-mail.
 *
 * The e-mail is encrypted with AES-GCM. The key is a NON-EXTRACTABLE CryptoKey
 * kept in IndexedDB, so the plaintext address never sits readable in
 * localStorage / DevTools and cannot be exported by scripts.
 * Falls back to not storing anything when WebCrypto/IndexedDB are unavailable.
 */

const DB_NAME = 'hioutz-secure-store';
const STORE_NAME = 'keys';
const KEY_ID = 'remember-email-key';
const CIPHER_KEY = 'hioutz-remembered-email-enc';
const LEGACY_KEY = 'hioutz-remembered-email';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db: IDBDatabase, key: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    !!window.crypto?.subtle
  );
}

async function getKey(create: boolean): Promise<CryptoKey | null> {
  const db = await openDb();
  const existing = await idbGet(db, KEY_ID);
  if (existing) return existing;
  if (!create) return null;
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
  await idbSet(db, KEY_ID, key);
  return key;
}

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Encrypt + persist the e-mail. Also removes any legacy plaintext entry. */
export async function saveRememberedEmail(email: string): Promise<void> {
  try {
    localStorage.removeItem(LEGACY_KEY);
    if (!isSupported() || !email) return;
    const key = await getKey(true);
    if (!key) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(email)
    );
    localStorage.setItem(
      CIPHER_KEY,
      JSON.stringify({ iv: toB64(iv.buffer), data: toB64(cipher) })
    );
  } catch {
    /* storage/crypto unavailable – silently skip */
  }
}

/** Decrypt the stored e-mail, or '' when none / undecryptable. */
export async function loadRememberedEmail(): Promise<string> {
  try {
    // Migrate any legacy plaintext value away immediately.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.removeItem(LEGACY_KEY);
      await saveRememberedEmail(legacy);
      return legacy;
    }
    const raw = localStorage.getItem(CIPHER_KEY);
    if (!raw || !isSupported()) return '';
    const { iv, data } = JSON.parse(raw) as { iv: string; data: string };
    const key = await getKey(false);
    if (!key) return '';
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(iv) },
      key,
      fromB64(data)
    );
    return new TextDecoder().decode(plain);
  } catch {
    return '';
  }
}

/** Remove the stored e-mail and its encryption key. */
export async function clearRememberedEmail(): Promise<void> {
  try {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(CIPHER_KEY);
    if (!isSupported()) return;
    const db = await openDb();
    await idbDelete(db, KEY_ID);
  } catch {
    /* ignore */
  }
}
