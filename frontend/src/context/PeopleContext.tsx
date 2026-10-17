import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserSummary } from '../types';
import type { PeopleSearchFilters, SavedPeopleSearch } from '../people/types';
import {
  getBrowserStorage,
  readStorageJson,
  writeStorageJson,
} from '../storage/safeStorage';

const RECENT_KEY = 'connectops.recentlyViewed.';
const FAVORITES_KEY = 'connectops.favoritePeople.';
const SEARCHES_KEY = 'connectops.savedPeopleSearches.';
const MAX_RECENT = 5;

interface PeopleLibrary {
  recentlyViewed: UserSummary[];
  favorites: number[];
  savedSearches: SavedPeopleSearch[];
}

interface PeopleContextValue extends PeopleLibrary {
  storageError: string | null;
  recordViewedPerson: (person: UserSummary) => void;
  toggleFavorite: (personId: number) => void;
  saveSearch: (name: string, filters: PeopleSearchFilters) => boolean;
  renameSearch: (id: string, name: string) => boolean;
  deleteSearch: (id: string) => boolean;
}

const PeopleContext = createContext<PeopleContextValue | null>(null);

const key = (prefix: string, userId: number) => `${prefix}${userId}`;

function isUserSummary(value: unknown): value is UserSummary {
  if (!value || typeof value !== 'object') return false;
  const person = value as Partial<UserSummary>;
  return typeof person.id === 'number' && typeof person.name === 'string' &&
    typeof person.title === 'string' && typeof person.team === 'string' &&
    typeof person.ministry === 'string' && typeof person.location === 'string' &&
    typeof person.status === 'string';
}

function isSavedPeopleSearch(value: unknown): value is SavedPeopleSearch {
  if (!value || typeof value !== 'object') return false;
  const saved = value as Partial<SavedPeopleSearch>;
  const filters = saved.filters as Partial<PeopleSearchFilters> | undefined;
  return typeof saved.id === 'string' && typeof saved.name === 'string' && !!filters &&
    ['search', 'department', 'team', 'location', 'jobTitle', 'ministry'].every(
      (field) => typeof filters[field as keyof PeopleSearchFilters] === 'string',
    );
}

function loadLibrary(userId: number): { library: PeopleLibrary; error: boolean } {
  const storage = getBrowserStorage();
  const recent = readStorageJson<unknown>(storage, key(RECENT_KEY, userId), []);
  const favorites = readStorageJson<unknown>(storage, key(FAVORITES_KEY, userId), []);
  const searches = readStorageJson<unknown>(storage, key(SEARCHES_KEY, userId), []);
  const people = Array.isArray(recent.value) ? recent.value.filter(isUserSummary).slice(0, MAX_RECENT) : [];
  const favoriteIds = Array.isArray(favorites.value)
    ? [...new Set(favorites.value.filter((id): id is number => Number.isInteger(id)))]
    : [];
  const savedSearches = Array.isArray(searches.value) ? searches.value.filter(isSavedPeopleSearch) : [];
  return {
    library: { recentlyViewed: people, favorites: favoriteIds, savedSearches },
    error: recent.error || favorites.error || searches.error || !storage,
  };
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PeopleProvider({ children, userId }: { children: ReactNode; userId: number }) {
  const [initial] = useState(() => loadLibrary(userId));
  const [library, setLibrary] = useState(initial.library);
  const [storageError, setStorageError] = useState<string | null>(
    initial.error ? 'Some people preferences could not be read or saved in this browser.' : null,
  );

  useEffect(() => {
    const storage = getBrowserStorage();
    const saved = storage &&
      writeStorageJson(storage, key(RECENT_KEY, userId), library.recentlyViewed) &&
      writeStorageJson(storage, key(FAVORITES_KEY, userId), library.favorites) &&
      writeStorageJson(storage, key(SEARCHES_KEY, userId), library.savedSearches);
    setStorageError(saved ? null : 'Some people preferences could not be saved in this browser.');
  }, [library, userId]);

  useEffect(() => {
    const relevantKeys = new Set([
      key(RECENT_KEY, userId),
      key(FAVORITES_KEY, userId),
      key(SEARCHES_KEY, userId),
    ]);
    const sync = (event: StorageEvent) => {
      if (event.key && !relevantKeys.has(event.key)) return;
      const next = loadLibrary(userId);
      setLibrary(next.library);
      setStorageError(next.error ? 'Some people preferences could not be read or saved in this browser.' : null);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [userId]);

  const recordViewedPerson = useCallback((person: UserSummary) => {
    setLibrary((current) => ({
      ...current,
      recentlyViewed: [person, ...current.recentlyViewed.filter((recent) => recent.id !== person.id)].slice(0, MAX_RECENT),
    }));
  }, []);

  const toggleFavorite = useCallback((personId: number) => {
    setLibrary((current) => ({
      ...current,
      favorites: current.favorites.includes(personId)
        ? current.favorites.filter((id) => id !== personId)
        : [personId, ...current.favorites],
    }));
  }, []);

  const saveSearch = useCallback((name: string, filters: PeopleSearchFilters) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    setLibrary((current) => ({
      ...current,
      savedSearches: [...current.savedSearches, { id: createId(), name: cleanName, filters: { ...filters } }],
    }));
    return true;
  }, []);

  const renameSearch = useCallback((id: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    setLibrary((current) => ({
      ...current,
      savedSearches: current.savedSearches.map((saved) => saved.id === id ? { ...saved, name: cleanName } : saved),
    }));
    return true;
  }, []);

  const deleteSearch = useCallback((id: string) => {
    setLibrary((current) => ({
      ...current,
      savedSearches: current.savedSearches.filter((saved) => saved.id !== id),
    }));
    return true;
  }, []);

  return (
    <PeopleContext.Provider value={{ ...library, storageError, recordViewedPerson, toggleFavorite, saveSearch, renameSearch, deleteSearch }}>
      {children}
    </PeopleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePeopleLibrary(): PeopleContextValue {
  const context = useContext(PeopleContext);
  if (!context) throw new Error('usePeopleLibrary must be used within a PeopleProvider');
  return context;
}