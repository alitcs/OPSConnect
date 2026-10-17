import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getBrowserStorage } from '../storage/safeStorage';
import {
  addRecentlyViewedArticle,
  readKnowledgeLibrary,
  toggleArticleBookmark,
  writeKnowledgeLibrary,
  type KnowledgeLibrary,
} from '../knowledge/library';

interface KnowledgeLibraryContextValue extends KnowledgeLibrary {
  storageError: string | null;
  toggleBookmark: (articleId: string) => void;
  recordView: (articleId: string) => void;
}

const KnowledgeLibraryContext = createContext<KnowledgeLibraryContextValue | null>(null);

function initialLibrary(userId: number): { library: KnowledgeLibrary; error: string | null } {
  const storage = getBrowserStorage();
  if (!storage) {
    return {
      library: { bookmarks: [], recentlyViewed: [] },
      error: 'Your article library could not be read from this browser.',
    };
  }
  return { library: readKnowledgeLibrary(storage, userId), error: null };
}

export function KnowledgeLibraryProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: number;
}) {
  const [initial] = useState(() => initialLibrary(userId));
  const [library, setLibrary] = useState(initial.library);
  const [storageError, setStorageError] = useState<string | null>(initial.error);

  useEffect(() => {
    try {
      if (!writeKnowledgeLibrary(getBrowserStorage(), userId, library)) {
        setStorageError('Changes could not be saved. Check this browser’s storage settings.');
        return;
      }
      setStorageError(null);
    } catch {
      setStorageError('Changes could not be saved. Check this browser’s storage settings.');
    }
  }, [library, userId]);

  const toggleBookmark = useCallback((articleId: string) => {
    setLibrary((current) => ({
      ...current,
      bookmarks: toggleArticleBookmark(current.bookmarks, articleId),
    }));
  }, []);

  const recordView = useCallback((articleId: string) => {
    setLibrary((current) => ({
      ...current,
      recentlyViewed: addRecentlyViewedArticle(current.recentlyViewed, articleId),
    }));
  }, []);

  return (
    <KnowledgeLibraryContext.Provider
      value={{ ...library, storageError, toggleBookmark, recordView }}
    >
      {children}
    </KnowledgeLibraryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKnowledgeLibrary(): KnowledgeLibraryContextValue {
  const context = useContext(KnowledgeLibraryContext);
  if (!context) throw new Error('useKnowledgeLibrary must be used within a KnowledgeLibraryProvider');
  return context;
}