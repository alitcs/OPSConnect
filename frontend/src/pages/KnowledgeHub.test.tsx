// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KnowledgeArticlePage from './KnowledgeArticle';
import KnowledgeHubPage from './KnowledgeHub';
import { KnowledgeLibraryProvider } from '../context/KnowledgeLibraryContext';

const USER_ID = 27;
const MENTOR_ARTICLE = 'Find a mentor beyond your immediate team';

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/knowledge']}>
      <KnowledgeLibraryProvider userId={USER_ID}>
        <KnowledgeHubPage />
      </KnowledgeLibraryProvider>
    </MemoryRouter>,
  );
}

describe('Knowledge Hub workflows', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('filters article cards by search text and category', async () => {
    renderHub();
    const search = await screen.findByRole('searchbox', { name: 'Search knowledge articles' });
    fireEvent.change(search, { target: { value: 'mentor' } });
    expect(await screen.findByRole('heading', { name: MENTOR_ARTICLE })).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: 'Filter articles by category' }), {
      target: { value: 'Digital & Data' },
    });
    await waitFor(() => expect(screen.queryByRole('heading', { name: MENTOR_ARTICLE })).toBeNull());
    expect(screen.getByText('No articles found')).toBeTruthy();
  });

  it('bookmarks an article and lists it in the saved view', async () => {
    renderHub();
    const bookmark = await screen.findByRole('button', { name: `Bookmark ${MENTOR_ARTICLE}` });
    fireEvent.click(bookmark);
    expect(screen.getByRole('button', { name: `Remove ${MENTOR_ARTICLE} from bookmarks` }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Saved/ }));
    expect(screen.getByRole('heading', { name: MENTOR_ARTICLE })).toBeTruthy();
  });

  it('records an opened article and restores it in Recently viewed', async () => {
    render(
      <MemoryRouter initialEntries={['/knowledge/briefing-note-basics']}>
        <KnowledgeLibraryProvider userId={USER_ID}>
          <Routes>
            <Route path="/knowledge/:articleId" element={<KnowledgeArticlePage />} />
          </Routes>
        </KnowledgeLibraryProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'A clear briefing note, from question to recommendation' })).toBeTruthy();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(`connectops.knowledge.recentlyViewed.${USER_ID}`) ?? '[]'))
        .toEqual(['briefing-note-basics']);
    });

    cleanup();
    renderHub();
    expect(await screen.findByRole('heading', { name: 'Recently viewed' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'A clear briefing note, from question to recommendation' })).toHaveLength(2);
  });
});