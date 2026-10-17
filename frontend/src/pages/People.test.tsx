// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { PeopleProvider } from '../context/PeopleContext';
import { PreviewCardProvider } from '../context/PreviewCardContext';
import PeoplePage from './People';

function renderPeople() {
  return render(
    <MemoryRouter initialEntries={['/people']}>
      <AuthProvider>
        <PeopleProvider userId={9}>
          <PreviewCardProvider>
            <Routes><Route path="/people" element={<PeoplePage />} /></Routes>
          </PreviewCardProvider>
        </PeopleProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('People workspace', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('favorites a colleague and saves/reapplies the current search', async () => {
    const { container } = renderPeople();
    const search = await screen.findByRole('searchbox', { name: 'Search people' }) as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Marcus Chen' } });
    await screen.findByRole('button', { name: /View details for Marcus Chen/ });

    fireEvent.click(screen.getByRole('button', { name: 'Add Marcus Chen to favorites' }));
    expect(screen.getByRole('button', { name: 'Remove Marcus Chen from favorites' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Save current search' }));
    fireEvent.change(await screen.findByLabelText('Name this search'), { target: { value: 'Marcus Chen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(localStorage.getItem('connectops.savedPeopleSearches.9')).toContain('Marcus Chen'));

    fireEvent.change(search, { target: { value: '' } });
    const savedSearch = container.querySelector('.people-saved__load') as HTMLButtonElement;
    fireEvent.click(savedSearch);
    expect(search.value).toBe('Marcus Chen');

    fireEvent.click(screen.getByRole('button', { name: /Favorites/ }));
    expect(screen.getByRole('button', { name: /View details for Marcus Chen/ })).toBeTruthy();
  });
});