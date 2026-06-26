import { useEffect, useState } from 'react';
import type { User, UserSummary } from '../types';
import { api } from '../api/client';
import { usePreviewCard } from '../context/PreviewCardContext';
import Avatar from './Avatar';
import StatusDot from './StatusDot';

// Section 1 — the "business card". Clean, glanceable Tier 1 data. Read-only display used
// on both the user's own profile and when viewing someone else's.
export default function ProfileSection1({ user }: { user: User }) {
  const { openPreview } = usePreviewCard();
  const [manager, setManager] = useState<UserSummary | null>(null);
  const [reports, setReports] = useState<UserSummary[]>([]);

  useEffect(() => {
    api.getManager(user.id).then(setManager).catch(() => setManager(null));
    api.getReports(user.id).then(setReports).catch(() => setReports([]));
  }, [user.id]);

  return (
    <section className="card business-card">
      <div className="business-card__top">
        <Avatar name={user.name} size={56} status={user.status} />
        <div>
          <div className="business-card__name">{user.name}</div>
          <div className="business-card__title">{user.title}</div>
          <div className="muted" style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <StatusDot status={user.status} /> {user.status} · {user.workHours}
          </div>
        </div>
      </div>

      <div className="business-card__grid">
        <Field label="Team">{user.team}</Field>
        <Field label="Branch / Division">{user.branch}</Field>
        <Field label="Ministry">{user.ministry}</Field>
        <Field label="Location">{user.location}</Field>
        <Field label="Email">
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </Field>
        <Field label="Phone">
          <a href={`tel:${user.phone}`}>{user.phone}</a>
        </Field>
        <Field label="Manager">
          {manager ? (
            <button className="people-link" onClick={() => openPreview(manager.id)}>
              {manager.name}
            </button>
          ) : (
            <span className="muted">—</span>
          )}
        </Field>
        <Field label="Direct Reports">
          {reports.length ? (
            <div className="people-links">
              {reports.map((r) => (
                <button key={r.id} className="people-link" onClick={() => openPreview(r.id)}>
                  {r.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="muted">—</span>
          )}
        </Field>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <span className="field__value">{children}</span>
    </div>
  );
}
