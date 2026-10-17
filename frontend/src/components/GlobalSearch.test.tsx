// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GlobalSearch, { GlobalSearchTrigger } from './GlobalSearch';
import { PreviewCardProvider } from '../context/PreviewCardContext';

function RouteDisplay() {
  const location = useLocation();
  return <output data-testid="current-route">{location.pathname}</output>;
}

function SearchHarness() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return <><GlobalSearchTrigger onOpen={() => setOpen(true)} /><GlobalSearch open={open} onClose={() => setOpen(false)} /></>;
}

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <PreviewCardProvider>
        <SearchHarness />
        <Routes>
          <Route path="/" element={<RouteDisplay />} />
          <Route path="/knowledge/:articleId" element={<RouteDisplay />} />
        </Routes>
      </PreviewCardProvider>
    </MemoryRouter>,
  );
}

describe('GlobalSearch', () => {
  afterEach(() => cleanup());

  it('opens with Ctrl+K and navigates to a knowledge result with arrow and Enter', async () => {
    renderSearch();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = await screen.findByRole('combobox', { name: 'Search people and knowledge' });
    fireEvent.change(input, { target: { value: 'briefing' } });
    await screen.findByRole('option', { name: /A clear briefing note/ });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('current-route').textContent).toBe('/knowledge/plain-language-review'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});