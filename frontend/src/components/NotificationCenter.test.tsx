// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationCenter from './NotificationCenter';

const USER_ID = 92;

function renderCenter() {
  return render(
    <MemoryRouter>
      <NotificationProvider userId={USER_ID}>
        <NotificationCenter />
      </NotificationProvider>
    </MemoryRouter>,
  );
}

describe('NotificationCenter', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('persists read and unread changes and restores them', async () => {
    const first = renderCenter();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(`connectops.notifications.${USER_ID}`) ?? '[]');
      expect(stored.every((item: { read: boolean }) => item.read)).toBe(true);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark Welcome to ConnectOPS unread' }));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(`connectops.notifications.${USER_ID}`) ?? '[]');
      expect(stored.find((item: { id: string }) => item.id === 'welcome-to-connectops').read).toBe(false);
    });
    first.unmount();

    renderCenter();
    expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    expect(screen.getByText('Welcome to ConnectOPS')).toBeTruthy();
  });
});