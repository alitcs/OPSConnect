export interface StoragePort {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface StorageRead<T> {
  value: T;
  error: boolean;
}

export function getBrowserStorage(): StoragePort | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readStorageText(storage: StoragePort | null, key: string): StorageRead<string | null> {
  try {
    return storage ? { value: storage.getItem(key), error: false } : { value: null, error: true };
  } catch {
    return { value: null, error: true };
  }
}

export function writeStorageText(storage: StoragePort | null, key: string, value: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageText(storage: StoragePort | null, key: string): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readStorageJson<T>(
  storage: StoragePort | null,
  key: string,
  fallback: T,
): StorageRead<T> {
  const raw = readStorageText(storage, key);
  if (raw.error) return { value: fallback, error: true };
  if (raw.value === null) return { value: fallback, error: false };
  try {
    return { value: JSON.parse(raw.value) as T, error: false };
  } catch {
    return { value: fallback, error: true };
  }
}

export function writeStorageJson(
  storage: StoragePort | null,
  key: string,
  value: unknown,
): boolean {
  try {
    return writeStorageText(storage, key, JSON.stringify(value));
  } catch {
    return false;
  }
}