import {
  readStorageJson,
  writeStorageJson,
  type StoragePort,
} from '../storage/safeStorage';

export interface KnowledgeLibrary {
  bookmarks: string[];
  recentlyViewed: string[];
}

export const MAX_RECENT_ARTICLES = 5;

function keyFor(userId: number, kind: keyof KnowledgeLibrary): string {
  return `connectops.knowledge.${kind}.${userId}`;
}

function readIds(storage: StoragePort | null, key: string): string[] {
  const { value: parsed } = readStorageJson<unknown>(storage, key, []);
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.filter((id): id is string => typeof id === 'string'))];
}

export function readKnowledgeLibrary(storage: StoragePort | null, userId: number): KnowledgeLibrary {
  return {
    bookmarks: readIds(storage, keyFor(userId, 'bookmarks')),
    recentlyViewed: readIds(storage, keyFor(userId, 'recentlyViewed')).slice(0, MAX_RECENT_ARTICLES),
  };
}

export function writeKnowledgeLibrary(
  storage: StoragePort | null,
  userId: number,
  library: KnowledgeLibrary,
): boolean {
  const bookmarksSaved = writeStorageJson(
    storage,
    keyFor(userId, 'bookmarks'),
    [...new Set(library.bookmarks)],
  );
  const historySaved = writeStorageJson(
    storage,
    keyFor(userId, 'recentlyViewed'),
    [...new Set(library.recentlyViewed)].slice(0, MAX_RECENT_ARTICLES),
  );
  return bookmarksSaved && historySaved;
}

export function toggleArticleBookmark(bookmarks: string[], articleId: string): string[] {
  return bookmarks.includes(articleId)
    ? bookmarks.filter((id) => id !== articleId)
    : [articleId, ...bookmarks];
}

export function addRecentlyViewedArticle(recent: string[], articleId: string): string[] {
  return [articleId, ...recent.filter((id) => id !== articleId)].slice(0, MAX_RECENT_ARTICLES);
}