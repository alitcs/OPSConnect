import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { AdminInsights } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

// Optional org-level analytics for program coordinators / HR. Macro trends only — no
// individual social activity is ever exposed here (that stays private to each user).
export default function AdminPage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<AdminInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    api
      .getAdminInsights()
      .then(setData)
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, []);

  // Only program coordinators can reach this view.
  if (currentUser && !currentUser.isAdmin) return <Navigate to="/" replace />;

  const teams = data?.teams ?? [];
  const topTeam = teams[0] ?? null;
  const lowestTeam = teams.length > 0 ? teams[teams.length - 1] : null;
  const idleEmployees = data ? data.totalEmployees - data.activeUsers : 0;

  const maxPerActive = Math.max(1, ...(teams.map((t) => t.connectionsPerActive) || [1]));

  const summaryMetrics: Array<{
    icon: Parameters<typeof Icon>[0]['name'];
    value: number | string;
    label: string;
    sub?: string;
  }> = data
    ? [
        {
          icon: 'directory',
          value: data.activeUsers,
          label: 'active users',
          sub: `${data.activationRate}% of ${data.totalEmployees}`,
        },
        {
          icon: 'coffee',
          value: data.availableToday,
          label: 'available today',
          sub: idleEmployees > 0 ? `${idleEmployees} not active yet` : 'everyone is active',
        },
        {
          icon: 'chart',
          value: data.totalConnections,
          label: 'connections logged',
          sub: `${data.crossTeamPct}% cross-team`,
        },
        {
          icon: 'sparkle',
          value: `${data.crossTeamPct}%`,
          label: 'cross-team share',
          sub: topTeam ? `led by ${topTeam.team}` : undefined,
        },
      ]
    : [];

  return (
    <div className="page">
      <div className="page__inner admin-page__inner">
        <header className="admin-hero">
          <div>
            <p className="admin-hero__eyebrow">Program insights</p>
            <h1 className="page__title">Program Insights</h1>
            <p className="page__subtitle">
              A quick read on adoption, connection quality, and where attention is needed.
            </p>
          </div>
          <div className="admin-hero__note">
            <Icon name="shield" size={13} />
            Aggregated only, no individual activity
          </div>
        </header>

        {loading && <p className="muted">Loading insights…</p>}
        {denied && !loading && (
          <p className="muted">You don't have access to program insights.</p>
        )}

        {data && (
          <>
            <div className="admin-stats">
              {summaryMetrics.map((metric) => (
                <AdminStat
                  key={metric.label}
                  icon={metric.icon}
                  value={metric.value}
                  label={metric.label}
                  sub={metric.sub}
                />
              ))}
            </div>

            <div className="admin-layout">
              <section className="card admin-card admin-card--focus">
                <div className="admin-card__header">
                  <h2 className="admin-card__title">
                    <Icon name="bell" size={16} />
                    Where attention is needed
                  </h2>
                  <span className="admin-card__meta">Largest gaps and adoption signals</span>
                </div>

                <div className="admin-focus">
                  <div className="admin-focus__lead">
                    <span className="admin-focus__label">Primary signal</span>
                    <p>{data.engagementGaps[0]}</p>
                  </div>

                  {data.engagementGaps.length > 1 && (
                    <ul className="admin-focus__list">
                      {data.engagementGaps.slice(1).map((gap, index) => (
                        <li key={gap}>
                          <span className="admin-focus__index">0{index + 2}</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="admin-callout">
                    <div>
                      <strong>{data.coopCount}</strong> co-op students
                    </div>
                    <div className="muted">
                      averaging <strong>{formatMetric(data.coopConnectionRate)}</strong>{' '}
                      connections each
                    </div>
                  </div>

                  <div className="admin-mini-grid">
                    <div className="admin-mini">
                      <span className="admin-mini__label">Idle employees</span>
                      <span className="admin-mini__value">{idleEmployees}</span>
                      <span className="admin-mini__sub">listed but not active yet</span>
                    </div>
                    <div className="admin-mini">
                      <span className="admin-mini__label">Lowest team</span>
                      <span className="admin-mini__value">
                        {lowestTeam ? lowestTeam.team : '—'}
                      </span>
                      <span className="admin-mini__sub">
                        {lowestTeam ? `${formatMetric(lowestTeam.connectionsPerActive)} / active` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card admin-card">
                <div className="admin-card__header">
                  <h2 className="admin-card__title">
                    <Icon name="chart" size={16} />
                    Team momentum
                  </h2>
                  <span className="admin-card__meta">
                    Ranked by connections per active user
                  </span>
                </div>

                <div className="admin-team-summary">
                  {topTeam && (
                    <div className="admin-pill">
                      <span className="admin-pill__label">Leading team</span>
                      <span className="admin-pill__value">
                        {topTeam.team} · {formatMetric(topTeam.connectionsPerActive)} / active
                      </span>
                    </div>
                  )}
                  {lowestTeam && (
                    <div className="admin-pill admin-pill--quiet">
                      <span className="admin-pill__label">Needs a nudge</span>
                      <span className="admin-pill__value">
                        {lowestTeam.team} · {formatMetric(lowestTeam.connectionsPerActive)} / active
                      </span>
                    </div>
                  )}
                </div>

                <div className="admin-teams">
                  {teams.map((team) => (
                    <div className="admin-team" key={`${team.team}-${team.ministry}`}>
                      <div className="admin-team__info">
                        <div className="admin-team__name">{team.team}</div>
                        <div className="admin-team__ministry">{team.ministry}</div>
                      </div>
                      <div className="admin-team__bar-wrap">
                        <div className="admin-team__bar-track" aria-hidden="true">
                          <div
                            className="admin-team__bar"
                            style={{
                              width: `${Math.round((team.connectionsPerActive / maxPerActive) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="admin-team__value">
                          {formatMetric(team.connectionsPerActive)}
                          <span className="muted"> / active</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <p className="muted admin-footnote">
              Aggregated trends only. Useful for adoption and momentum, not individual monitoring.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AdminStat({
  icon,
  value,
  label,
  sub,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  value: number | string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="card admin-stat">
      <span className="admin-stat__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="admin-stat__value">{value}</span>
      <span className="admin-stat__label">{label}</span>
      {sub && <span className="admin-stat__sub">{sub}</span>}
    </div>
  );
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
