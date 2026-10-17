import { describe, expect, it } from 'vitest';
import {
  readStorageJson,
  writeStorageJson,
  type StoragePort,
} from './safeStorage';

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('safeStorage', () => {
  it('round-trips JSON and returns the fallback for malformed values', () => {
    const storage = new MemoryStorage();
    expect(writeStorageJson(storage, 'prefs', { theme: 'dark' })).toBe(true);
    expect(readStorageJson(storage, 'prefs', {})).toEqual({ value: { theme: 'dark' }, error: false });
    storage.setItem('broken', '{');
    expect(readStorageJson(storage, 'broken', [])).toEqual({ value: [], error: true });
  });

  it('reports unavailable and throwing storage instead of throwing to callers', () => {
    const broken: StoragePort = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(readStorageJson(null, 'key', [])).toEqual({ value: [], error: true });
    expect(writeStorageJson(broken, 'key', {})).toBe(false);
  });
});