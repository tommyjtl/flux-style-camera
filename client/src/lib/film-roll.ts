/** Standard exposure count for single-use / disposable 35mm cameras (e.g. Fujifilm QuickSnap, Kodak FunSaver). */
export const FILM_CAPACITY = 27;

export const DB_NAME = "fluxoid";
export const DB_VERSION = 1;
export const STORE_NAME = "prints";

export type CameraFacing = "front" | "back";

export interface FilmPrint {
  id: string;
  createdAt: string;
  camera: CameraFacing;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  presetId: string;
  outputBlob: Blob;
  previewBlob: Blob;
}

export interface TransformResponse {
  outputBlob: Blob;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  presetId: string;
}

export class FilmRollFullError extends Error {
  constructor() {
    super(
      `Film roll is full (${FILM_CAPACITY}/${FILM_CAPACITY} exposures). Delete prints to free space.`,
    );
    this.name = "FilmRollFullError";
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = fn(store);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        request.onsuccess = () => resolve(request.result as T);
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      }),
  );
}

export async function listPrints(): Promise<FilmPrint[]> {
  const prints = await runTransaction<FilmPrint[]>("readonly", (store) => store.getAll());
  return prints.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPrintCount(): Promise<number> {
  return runTransaction<number>("readonly", (store) => store.count());
}

export async function getRemainingExposures(): Promise<number> {
  const count = await getPrintCount();
  return Math.max(0, FILM_CAPACITY - count);
}

export async function addPrint(print: FilmPrint): Promise<void> {
  const count = await getPrintCount();
  if (count >= FILM_CAPACITY) {
    throw new FilmRollFullError();
  }
  await runTransaction<IDBValidKey>("readwrite", (store) => store.put(print));
}

export async function getPrint(id: string): Promise<FilmPrint | null> {
  const print = await runTransaction<FilmPrint | undefined>("readonly", (store) => store.get(id));
  return print ?? null;
}

export async function deletePrint(id: string): Promise<void> {
  await runTransaction<undefined>("readwrite", (store) => store.delete(id));
}

export async function clearRoll(): Promise<void> {
  await runTransaction<undefined>("readwrite", (store) => store.clear());
}
