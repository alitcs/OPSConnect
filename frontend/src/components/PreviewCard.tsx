import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePeopleLibrary } from '../context/PeopleContext';
import Avatar from './Avatar';
import StatusDot from './StatusDot';
import Icon from './Icon';

// Step 2 of the universal flow: a dismissible overlay showing Section 1 (business card)
// info. Easy to close (tap outside, X). Has a "View Full Profile" button (step 3).
// NOTE: deliberately no "Ask AI about this person" action — chat and browsing are separate.
export default function PreviewCard({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { recordViewedPerson } = usePeopleLibrary();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getUser(userId)
      .then((u) => {
        if (!active) return;
        setUser(u);
        recordViewedPerson(u);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [userId, recordViewedPerson]);

  // Close on Escape.
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  const isSelf = currentUser?.id === userId;

  const viewProfile = () => {
    onClose();
    navigate(isSelf ? '/profile' : `/users/${userId}`);
  };

  const message = () => {
    onClose();
    navigate(`/messages?to=${userId}`);
  };

  const book = () => {
    if (!user) return;
    const subject = encodeURIComponent('15 min intro chat');
    const body = encodeURIComponent(
      `Hi ${user.name.split(' ')[0]},\n\nWould you have 15 minutes to connect? I found you through ConnectOPS and would love to learn about your work on ${user.team}.\n\nThanks!`,
    );
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="preview-card"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-card-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {error && <p className="muted">{error}</p>}
        {!user && !error && <p className="muted">Loading…</p>}
        {user && (
          <>
            <div className="preview-card__header">
              <Avatar name={user.name} size={50} status={user.status} />
              <div>
                <div className="preview-card__name" id="preview-card-title">{user.name}</div>
                <div className="preview-card__title">{user.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {user.team}
                </div>
              </div>
              <button type="button" ref={closeButtonRef} className="preview-card__close" onClick={onClose} aria-label="Close">
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="preview-card__rows">
              <Row label="Status">
                <StatusDot status={user.status} /> &nbsp;{user.status}
              </Row>
              <Row label="Ministry">{user.ministry}</Row>
              <Row label="Location">{user.location}</Row>
              <Row label="Hours">{user.workHours}</Row>
              <Row label="Email">
                <a href={`mailto:${user.email}`}>{user.email}</a>
              </Row>
              <Row label="Phone">{user.phone}</Row>
              {(user.floor !== null || user.seat !== null) && (
                <Row label="Desk">
                  {[user.floor !== null ? `Floor ${user.floor}` : null, user.seat]
                    .filter(Boolean)
                    .join(' · ')}
                </Row>
              )}
            </div>

            <div className="preview-card__actions">
              <button type="button" className="btn btn--primary btn--block" onClick={viewProfile}>
                <Icon name="profile" size={16} />
                View Full Profile
              </button>
              {!isSelf && (
                <div className="preview-card__actions-row">
                  <button type="button" className="btn btn--block" onClick={message}>
                    <Icon name="messages" size={16} />
                    Message
                  </button>
                  <button type="button" className="btn btn--block" onClick={book}>
                    <Icon name="calendar" size={16} />
                    Book 15 min
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{children}</span>
    </div>
  );
}
