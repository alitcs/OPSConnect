import { useEffect, useState } from 'react';
import type { ActivityMetrics } from '../types';
import { api } from '../api/client';
import Icon from './Icon';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(key: string): string {
  const [, m] = key.split('-');
  return MONTH_LABELS[Number(m) - 1] ?? key;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// A private, self-reflective view of your own social activity. No manager visibility, no
// leaderboards — a mirror, not a scoreboard.
export default function ActivityMetric() {
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getActivityMetrics()
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card activity-metric">
        <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 60, width: '100%' }} />
      </section>
    );
  }
  if (!metrics) return null;

  const max = Math.max(1, ...metrics.history.map((h) => h.count));
  const chartLabel = metrics.history.length
    ? `Connections per month — ${metrics.history
        .map((h) => `${monthLabel(h.month)}: ${h.count}`)
        .join(', ')}.`
    : '';

  return (
    <section className="card activity-metric">
      <div className="activity-metric__head">
        <h2>
          <Icon name="coffee" size={17} />
          Your activity
        </h2>
        <span className="activity-metric__private">
          <Icon name="shield" size={13} />
          Private to you
        </span>
      </div>
      <p className="muted activity-metric__blurb">
        A mirror, not a scoreboard.
      </p>

      <div className="activity-metric__stats">
        <Stat value={metrics.coffeeChatsThisMonth} label="connections this month" />
        <Stat value={metrics.distinctPeople} label="people met" />
        <Stat value={`${metrics.crossTeamPct}%`} label="outside your team" />
      </div>

      {metrics.history.length > 0 && (
        <div className="activity-metric__chart" role="img" aria-label={chartLabel}>
          {metrics.history.map((h) => (
            <div className="activity-metric__bar-col" key={h.month}>
              <div className="activity-metric__bar-track">
                <div
                  className="activity-metric__bar"
                  style={{ height: `${Math.round((h.count / max) * 100)}%` }}
                />
              </div>
              <span className="activity-metric__bar-label">{monthLabel(h.month)}</span>
              <span className="activity-metric__bar-value">{h.count}</span>
            </div>
          ))}
        </div>
      )}

      {metrics.recent.length > 0 && (
        <div className="activity-metric__recent">
          <div className="field__label" style={{ marginBottom: 8 }}>
            Recent connections
          </div>
          <ul className="activity-metric__list">
            {metrics.recent.map((r, i) => (
              <li key={i}>
                <span>{r.withUser.name}</span>
                <span className="activity-metric__list-meta">
                  {r.crossTeam && <span className="chip activity-metric__cross">cross-team</span>}
                  <span className="muted">{timeAgo(r.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="activity-metric__stat">
      <span className="activity-metric__stat-value">{value}</span>
      <span className="activity-metric__stat-label">{label}</span>
    </div>
  );
}
