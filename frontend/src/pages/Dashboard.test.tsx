// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { KnowledgeLibraryProvider } from '../context/KnowledgeLibraryContext';
import { PeopleProvider } from '../context/PeopleContext';
import { PreviewCardProvider } from '../context/PreviewCardContext';
import DashboardPage from './Dashboard';

const USER_ID = 13;

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(`connectops.recentlyViewed.${USER_ID}`, JSON.stringify([{
      id: 24,
      name: 'Marcus Chen',
      title: 'Co-op Student, Web Development',
      team: 'Enterprise Web Development',
      ministry: 'Treasury Board Secretariat',
      location: 'Toronto',
      status: 'Online',
    }]));
    localStorage.setItem(`connectops.savedPeopleSearches.${USER_ID}`, JSON.stringify([{
      id: 'search-data-team',
      name: 'Data teams',
      filters: { search: '', department: '', team: 'Data Platform Engineering', location: '', jobTitle: '', ministry: '' },
    }]));
    localStorage.setItem(`connectops.knowledge.bookmarks.${USER_ID}`, JSON.stringify(['briefing-note-basics']));
  });
  afterEach(() => cleanup());

  it('shows shared people, searches, bookmarked knowledge, and quick actions', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <PeopleProvider userId={USER_ID}>
            <KnowledgeLibraryProvider userId={USER_ID}>
              <PreviewCardProvider><DashboardPage /></PreviewCardProvider>
            </KnowledgeLibraryProvider>
          </PeopleProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Recently viewed people' })).toBeTruthy();
    expect(screen.getByText('Marcus Chen')).toBeTruthy();
    const savedSearch = screen.getByRole('link', { name: /Data teams/ });
    expect(savedSearch.getAttribute('href')).toBe('/people?searchId=search-data-team');
    expect(await screen.findByRole('heading', { name: 'A clear briefing note, from question to recommendation' })).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('link', { name: /Find people/ })).toBeTruthy());
  });
});