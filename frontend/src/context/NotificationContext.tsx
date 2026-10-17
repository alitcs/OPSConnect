import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getBrowserStorage, readStorageJson, readStorageText, writeStorageJson } from '../storage/safeStorage';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  href: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  storageError: string | null;
  markRead: (id: string, read?: boolean) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const KEY_PREFIX = 'connectops.notifications.';

function storageKey(userId: number): string {
  return `${KEY_PREFIX}${userId}`;
}

function isNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AppNotification>;
  return typeof item.id === 'string' && typeof item.title === 'string' &&
    typeof item.message === 'string' && typeof item.createdAt === 'string' &&
    typeof item.href === 'string' && typeof item.read === 'boolean';
}

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'welcome-to-connectops',
      title: 'Welcome to ConnectOPS',
      message: 'Explore the directory to find colleagues and expertise across the OPS.',
      createdAt: new Date(now - 15 * 60_000).toISOString(),
      href: '/people',
      read: false,
    },
    {
      id: 'knowledge-update',
      title: 'New in the Knowledge Hub',
      message: 'Read practical guidance on accessible hybrid meetings.',
      createdAt: new Date(now - 3 * 60 * 60_000).toISOString(),
      href: '/knowledge/accessible-meetings',
      read: false,
    },
    {
      id: 'connect-board',
      title: 'Make a new connection',
      message: 'See who is open to connect today and start with a short introduction.',
      createdAt: new Date(now - 24 * 60 * 60_000).toISOString(),
      href: '/connect',
      read: true,
    },
  ];
}

function readNotifications(userId: number): { items: AppNotification[]; error: boolean } {
  const storage = getBrowserStorage();
  const key = storageKey(userId);
  const raw = readStorageText(storage, key);
  if (raw.error) return { items: seedNotifications(), error: true };
  if (raw.value === null) return { items: seedNotifications(), error: false };
  const parsed = readStorageJson<unknown>(storage, key, []);
  if (parsed.error || !Array.isArray(parsed.value)) return { items: [], error: true };
  return { items: parsed.value.filter(isNotification), error: false };
}

export function NotificationProvider({ children, userId }: { children: ReactNode; userId: number }) {
  const [initial] = useState(() => readNotifications(userId));
  const [notifications, setNotifications] = useState(initial.items);
  const [storageError, setStorageError] = useState<string | null>(
    initial.error ? 'Notifications could not be read from this browser.' : null,
  );

  useEffect(() => {
    const saved = writeStorageJson(getBrowserStorage(), storageKey(userId), notifications);
    setStorageError(saved ? null : 'Notification changes could not be saved in this browser.');
  }, [notifications, userId]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey(userId)) return;
      const next = readNotifications(userId);
      setNotifications(next.items);
      setStorageError(next.error ? 'Notifications could not be read from this browser.' : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const markRead = useCallback((id: string, read = true) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read } : item));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, storageError, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}