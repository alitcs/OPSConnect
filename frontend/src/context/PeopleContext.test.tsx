// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PropsWithChildren } from 'react';
import { PeopleProvider, usePeopleLibrary } from './PeopleContext';

const USER_ID = 88;

function wrapper({ children }: PropsWithChildren) {
  return <PeopleProvider userId={USER_ID}>{children}</PeopleProvider>;
}

describe('People library', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('persists favorite people and named filter searches per account', async () => {
    const { result, unmount } = renderHook(() => usePeopleLibrary(), { wrapper });
    act(() => {
      result.current.toggleFavorite(5);
      result.current.saveSearch('Toronto designers', {
        search: '',
        department: '',
        team: 'Design & Research',
        location: '777 Bay Street, Toronto',
        jobTitle: '',
        ministry: '',
      });
    });
    await waitFor(() => expect(JSON.parse(localStorage.getItem(`connectops.favoritePeople.${USER_ID}`) ?? '[]')).toEqual([5]));
    unmount();

    const restored = renderHook(() => usePeopleLibrary(), { wrapper });
    expect(restored.result.current.favorites).toEqual([5]);
    expect(restored.result.current.savedSearches[0].name).toBe('Toronto designers');
    act(() => restored.result.current.renameSearch(restored.result.current.savedSearches[0].id, 'Design team'));
    expect(restored.result.current.savedSearches[0].name).toBe('Design team');
    act(() => restored.result.current.deleteSearch(restored.result.current.savedSearches[0].id));
    expect(restored.result.current.savedSearches).toEqual([]);
  });
});