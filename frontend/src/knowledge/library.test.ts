import { describe, expect, it } from 'vitest';
import {
  addRecentlyViewedArticle,
  readKnowledgeLibrary,
  toggleArticleBookmark,
  writeKnowledgeLibrary,
} from './library';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private readonly values = new Map<string, string>();

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

describe('knowledge library', () => {
  it('toggles bookmarks without duplicates', () => {
    expect(toggleArticleBookmark(['a'], 'b')).toEqual(['b', 'a']);
    expect(toggleArticleBookmark(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('moves a viewed article to the front and caps history at five', () => {
    const recent = addRecentlyViewedArticle(['a', 'b', 'c', 'd', 'e'], 'c');
    expect(recent).toEqual(['c', 'a', 'b', 'd', 'e']);
    expect(addRecentlyViewedArticle(recent, 'f')).toEqual(['f', 'c', 'a', 'b', 'd']);
  });

  it('persists bookmarks and recent history separately for each user', () => {
    const storage = new MemoryStorage();
    writeKnowledgeLibrary(storage, 7, {
      bookmarks: ['briefing-note-basics'],
      recentlyViewed: ['first-week', 'accessible-meetings'],
    });

    expect(readKnowledgeLibrary(storage, 7)).toEqual({
      bookmarks: ['briefing-note-basics'],
      recentlyViewed: ['first-week', 'accessible-meetings'],
    });
    expect(readKnowledgeLibrary(storage, 8)).toEqual({ bookmarks: [], recentlyViewed: [] });
  });

  it('ignores malformed localStorage values and sanitizes duplicate or non-string ids', () => {
    const storage = new MemoryStorage();
    storage.setItem('connectops.knowledge.bookmarks.3', '{broken');
    storage.setItem('connectops.knowledge.recentlyViewed.3', '["x", 2, "x"]');
    expect(readKnowledgeLibrary(storage, 3)).toEqual({
      bookmarks: [],
      recentlyViewed: ['x'],
    });
  });
});