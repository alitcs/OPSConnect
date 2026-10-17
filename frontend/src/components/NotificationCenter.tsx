import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import Icon from './Icon';

function timeLabel(date: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationCenter({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, storageError, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`notification-center ${className}`} ref={rootRef}>
      <button
        type="button"
        className="sidebar__footer-btn notification-center__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
      >
        <span className="sidebar__link-icon"><Icon name="bell" size={18} /></span>
        <span className="sidebar__link-label">Notifications</span>
        {unreadCount > 0 && <span className="notification-center__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section className="notification-panel" aria-label="Notification center">
          <header className="notification-panel__header">
            <div><h2>Notifications</h2><span>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</span></div>
            {unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}
          </header>
          {storageError && <p className="notification-panel__error" role="alert">{storageError}</p>}
          {notifications.length === 0 ? (
            <div className="notification-panel__empty"><Icon name="bell" size={20} /><p>You&apos;re all caught up.</p></div>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification.id} className={!notification.read ? 'is-unread' : ''}>
                  <button
                    type="button"
                    className="notification-list__open"
                    onClick={() => {
                      markRead(notification.id);
                      setOpen(false);
                      navigate(notification.href);
                    }}
                  >
                    {!notification.read && <span className="notification-list__dot" aria-label="Unread" />}
                    <span className="notification-list__copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time dateTime={notification.createdAt}>{timeLabel(notification.createdAt)}</time>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="notification-list__toggle"
                    aria-label={notification.read ? `Mark ${notification.title} unread` : `Mark ${notification.title} read`}
                    onClick={() => markRead(notification.id, !notification.read)}
                  >
                    <Icon name={notification.read ? 'bell' : 'check'} size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}