import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { AdminInsights, EdgeMode, TeamInsight } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon, { type IconName } from '../components/Icon';

const ConnectionGraph = lazy(() => import('../components/ConnectionGraph'));
const InsightsAssistant = lazy(() => import('../components/InsightsAssistant'));

// Org-level analytics for an upper-level (coordinator/executive) audience. Everything here
// is aggregate — no individual social activity is ever exposed. It answers three executive
// questions: are we breaking down silos, where does our knowledge live, and are new people
// settling in?
export default function AdminPage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<AdminInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  // A "find <person>" request from the assistant (by name) or a person-card tap (by id),
  // consumed by the graph to focus that node.
  const [focusRequest, setFocusRequest] = useState<{
    query: string;
    id?: number;
    nonce: number;
  } | null>(null);
  // The active connection lens — shared between the graph selector and the assistant so the
  // assistant's relationship answers match what's on screen (and it can switch the view).
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('combined');

  useEffect(() => {
    api
      .getAdminInsights()
      .then(setData)
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, []);

  if (currentUser && !currentUser.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <div className="page__inner admin-page__inner">
        <header className="ins-topbar">
          <h1 className="ins-topbar__title">Insights</h1>
          <span className="ins-hero__privacy">
            <Icon name="shield" size={12} />
            Coordinators only
          </span>
        </header>

        {denied && !loading && (
          <p className="muted">You don't have access to program insights.</p>
        )}

        <div className="ins-workspace">
          <Suspense
            fallback={
              <div className="graph-panel graph-panel--pending">
                <div className="graph-panel__loading">Loading network…</div>
              </div>
            }
          >
            <ConnectionGraph
              focusRequest={focusRequest}
              mode={edgeMode}
              onModeChange={setEdgeMode}
            />
          </Suspense>

          {!denied && (
            <Suspense
              fallback={
                <div className="copilot-hero copilot-hero--pending">
                  <div className="copilot-hero__loading">Waking up Copilot…</div>
                </div>
              }
            >
              <InsightsAssistant
                mode={edgeMode}
                onSetMode={setEdgeMode}
                onFindPerson={(name) => setFocusRequest({ query: name, nonce: Date.now() })}
                onFocusPerson={(person) =>
                  setFocusRequest({ query: person.name, id: person.id, nonce: Date.now() })
                }
              />
            </Suspense>
          )}
        </div>

        {loading && <p className="muted">Loading insights…</p>}
        {data && <InsightsBoard data={data} />}
      </div>
    </div>
  );
}

function InsightsBoard({ data }: { data: AdminInsights }) {
  const idle = data.totalEmployees - data.activeUsers;
  const topTeams = data.teams.slice(0, 4);
  const lowTeams = data.teams.length > 4 ? [...data.teams].reverse().slice(0, 3) : [];
  const maxTeam = Math.max(1, ...data.teams.map((t) => t.connectionsPerActive));
  const maxSkill = Math.max(1, ...data.topSkills.map((s) => s.count));
  const coopsIsolated = Math.max(0, data.coopCount - data.coopsConnected);
  const compareMax = Math.max(1, data.coopConnectionRate, data.orgConnectionRate);

  return (
    <div className="ins">
      {/* Headline KPIs — the five numbers an executive should read first */}
      <div className="ins-kpis ins-kpis--5">
        <Kpi
          icon="directory"
          value={data.activationRate}
          suffix="%"
          label="Adoption"
          sub={`${data.activeUsers} of ${data.totalEmployees} employees onboarded`}
          trend={data.adoptionDelta > 0 ? `+${data.adoptionDelta} in 6 mo` : undefined}
          delay={0}
        />
        <Kpi
          icon="sparkle"
          value={data.connectedRate}
          suffix="%"
          label="Actively connected"
          sub={
            data.isolatedActive > 0
              ? `${data.isolatedActive} still isolated — nudge them`
              : 'every active member has a link'
          }
          tone={data.isolatedActive > 0 ? 'warn' : 'pos'}
          delay={60}
        />
        <Kpi
          icon="chart"
          value={data.crossMinistryPct}
          suffix="%"
          label="Cross-ministry links"
          sub={`${data.crossTeamPct}% cross-team — breaking silos`}
          delay={120}
        />
        <Kpi
          icon="shield"
          value={data.singlePointSkills}
          label="Single-expert skills"
          sub="only one person can cover each"
          tone={data.singlePointSkills > 0 ? 'warn' : 'pos'}
          delay={180}
        />
        <Kpi
          icon="clock"
          value={data.estHoursSaved}
          suffix=" h"
          label="Time saved / month"
          sub={`≈ $${data.estCostSaved.toLocaleString()} in staff time`}
          accent
          delay={240}
        />
      </div>

      {/* Adoption momentum */}
      <section className="ins-card ins-anim" style={{ animationDelay: '120ms' }}>
        <header className="ins-card__head">
          <div className="ins-card__headings">
            <h2 className="ins-card__title">Adoption momentum</h2>
            <p className="ins-card__sub">
              Active users each month — a steady climb means ConnectOPS is becoming the default
              way to find the right person.
            </p>
          </div>
          <span className={`ins-trend-chip ${data.adoptionDelta >= 0 ? 'is-up' : 'is-down'}`}>
            <Icon name="chart" size={12} />
            {data.adoptionDelta >= 0 ? '+' : '−'}
            {Math.abs(data.adoptionDelta)} since {data.adoptionTrend[0]?.month}
          </span>
        </header>
        <Sparkline points={data.adoptionTrend} />
      </section>

      {/* Silos / network reach */}
      <section className="ins-card ins-anim" style={{ animationDelay: '160ms' }}>
        <header className="ins-card__head">
          <div className="ins-card__headings">
            <h2 className="ins-card__title">Breaking down silos</h2>
            <p className="ins-card__sub">
              More cross-boundary collaboration means less duplicated work and knowledge that
              travels between teams and ministries.
            </p>
          </div>
        </header>

        <div className="ins-silo">
          <div className="ins-gauges">
            <Gauge value={data.crossTeamPct} label="cross-team" />
            <Gauge value={data.crossMinistryPct} label="cross-ministry" />
          </div>
          <div className="ins-bridges-wrap">
            <span className="ins-mini-label">Key connectors keeping teams linked</span>
            <ul className="ins-bridges">
              {data.bridges.map((b) => (
                <li key={b.id}>
                  <span className="ins-bridges__name">{b.name}</span>
                  <span className="ins-bridges__meta">
                    reaches {b.ministriesReached} ministries · {b.connections} links
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ins-teams">
          <div className="ins-teams__col">
            <span className="ins-mini-label">Most connected teams</span>
            {topTeams.map((t, i) => (
              <TeamBar key={`${t.team}-${t.ministry}`} team={t} max={maxTeam} tone="pos" delay={i * 70} />
            ))}
          </div>
          {lowTeams.length > 0 && (
            <div className="ins-teams__col">
              <span className="ins-mini-label">Teams that need a nudge</span>
              {lowTeams.map((t, i) => (
                <TeamBar key={`${t.team}-${t.ministry}`} team={t} max={maxTeam} tone="low" delay={i * 70} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Network health */}
      <section className="ins-card ins-anim" style={{ animationDelay: '200ms' }}>
        <header className="ins-card__head">
          <div className="ins-card__headings">
            <h2 className="ins-card__title">Network health</h2>
            <p className="ins-card__sub">
              Are people actually connecting — and who is still slipping through the cracks.
            </p>
          </div>
        </header>
        <SplitBar
          connectedPct={data.connectedRate}
          connected={data.activeUsers - data.isolatedActive}
          isolated={data.isolatedActive}
        />
        <div className="ins-stat-row" style={{ marginTop: 16 }}>
          <Stat value={data.avgConnections} decimals={1} label="avg connections / person" />
          <Stat value={data.medianConnections} label="median connections" />
          <Stat value={data.coffeeThisMonth} label="coffee chats this month" />
          <Stat value={data.availableToday} label="open to help today" accent />
        </div>
      </section>

      {/* Knowledge & expertise */}
      <div className="ins-grid2">
        <section className="ins-card ins-anim" style={{ animationDelay: '240ms' }}>
          <header className="ins-card__head">
            <div className="ins-card__headings">
              <h2 className="ins-card__title">Top expertise</h2>
              <p className="ins-card__sub">Where the organisation's deepest skills concentrate.</p>
            </div>
          </header>
          <div className="ins-skills">
            {data.topSkills.map((s, i) => (
              <div className="ins-skill" key={s.skill}>
                <span className="ins-skill__name">{s.skill}</span>
                <span className="ins-skill__track">
                  <SkillBar pct={(s.count / maxSkill) * 100} delay={i * 60} />
                </span>
                <span className="ins-skill__count">{s.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ins-card ins-anim" style={{ animationDelay: '300ms' }}>
          <header className="ins-card__head">
            <div className="ins-card__headings">
              <h2 className="ins-card__title">Knowledge at risk</h2>
              <p className="ins-card__sub">
                Skills only one or two people can cover — a continuity risk if they move on.
              </p>
            </div>
          </header>
          <div className="ins-risk-head">
            <strong>{data.singlePointSkills}</strong> skill{data.singlePointSkills === 1 ? '' : 's'} rest
            on a single expert
          </div>
          <div className="ins-risks">
            {data.scarceSkills.map((s) => (
              <span className={`ins-risk ${s.count === 1 ? 'is-critical' : ''}`} key={s.skill}>
                {s.skill}
                <span className="ins-risk__count">{s.count}</span>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Onboarding health */}
      <section className="ins-card ins-anim" style={{ animationDelay: '360ms' }}>
        <header className="ins-card__head">
          <div className="ins-card__headings">
            <h2 className="ins-card__title">Onboarding health</h2>
            <p className="ins-card__sub">
              How quickly new co-op students plug into the network compared with the wider org.
            </p>
          </div>
        </header>
        <div className="ins-compare">
          <CompareRow
            label="Co-op students"
            value={data.coopConnectionRate}
            max={compareMax}
            tone="pos"
          />
          <CompareRow label="Org average" value={data.orgConnectionRate} max={compareMax} tone="mut" />
        </div>
        <div className="ins-stat-row" style={{ marginTop: 16 }}>
          <Stat value={data.coopConnectedPct} suffix="%" label="co-ops connected" />
          <Stat value={coopsIsolated} label="not connected yet" />
          <Stat value={data.menteesPerMentor} decimals={1} label="co-ops per mentor" />
          <Stat value={data.mentorsAvailable} label="mentors available" />
          <Stat value={idle} label="not active yet" />
        </div>
      </section>
    </div>
  );
}

/* ---------- Small presentational pieces ---------- */

function useCountUp(target: number, decimals = 0, duration = 850): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function CountUp({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const v = useCountUp(value, decimals);
  return <>{decimals ? v.toFixed(decimals) : Math.round(v)}{suffix}</>;
}

function Kpi({
  icon,
  value,
  label,
  sub,
  suffix,
  decimals = 0,
  tone,
  trend,
  accent,
  delay = 0,
}: {
  icon: IconName;
  value: number;
  label: string;
  sub?: string;
  suffix?: string;
  decimals?: number;
  tone?: 'pos' | 'warn';
  trend?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`ins-kpi ins-anim ${tone ? `is-${tone}` : ''} ${accent ? 'is-accent' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ins-kpi__top">
        <span className="ins-kpi__icon">
          <Icon name={icon} size={16} />
        </span>
        {trend && <span className="ins-kpi__trend">{trend}</span>}
      </div>
      <span className="ins-kpi__value">
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </span>
      <span className="ins-kpi__label">{label}</span>
      {sub && <span className="ins-kpi__sub">{sub}</span>}
    </div>
  );
}

function Sparkline({ points }: { points: { month: string; value: number }[] }) {
  const W = 640;
  const H = 150;
  const pad = 20;
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  if (!points.length) return null;
  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const stepX = (W - pad * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: pad + i * stepX,
    y: H - pad - ((p.value - min) / range) * (H - pad * 2),
  }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${H - pad} L${coords[0].x.toFixed(1)},${H - pad} Z`;
  const last = coords[coords.length - 1];
  return (
    <div className="ins-spark">
      <svg viewBox={`0 0 ${W} ${H}`} className="ins-spark__svg" role="img" aria-label="Adoption over time">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkFill)" className={`ins-spark__area ${drawn ? 'is-in' : ''}`} />
        <path d={line} className={`ins-spark__line ${drawn ? 'is-in' : ''}`} />
        {coords.map((c) => (
          <circle key={c.month} cx={c.x} cy={c.y} r="3.5" className="ins-spark__dot" />
        ))}
        <circle cx={last.x} cy={last.y} r="6" className="ins-spark__dot ins-spark__dot--last" />
        <text x={last.x} y={last.y - 14} className="ins-spark__peak" textAnchor="middle">
          {last.value}
        </text>
      </svg>
      <div className="ins-spark__axis">
        {points.map((p) => (
          <span key={p.month}>{p.month}</span>
        ))}
      </div>
    </div>
  );
}

function SplitBar({
  connectedPct,
  connected,
  isolated,
}: {
  connectedPct: number;
  connected: number;
  isolated: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(connectedPct), 100);
    return () => window.clearTimeout(t);
  }, [connectedPct]);
  return (
    <div className="ins-split">
      <div className="ins-split__bar" role="img" aria-label={`${connectedPct}% of active members are connected`}>
        <span className="ins-split__seg" style={{ width: `${w}%` }} />
      </div>
      <div className="ins-split__legend">
        <span className="ins-split__key">
          <i className="ins-dot ins-dot--pos" />
          <strong>{connected}</strong> connected
        </span>
        <span className="ins-split__key">
          <i className="ins-dot ins-dot--warn" />
          <strong>{isolated}</strong> isolated
        </span>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: 'pos' | 'mut';
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW((value / max) * 100), 100);
    return () => window.clearTimeout(t);
  }, [value, max]);
  return (
    <div className="ins-cmp">
      <span className="ins-cmp__label">{label}</span>
      <span className="ins-cmp__track">
        <span className={`ins-cmp__bar ins-cmp__bar--${tone}`} style={{ width: `${w}%` }} />
      </span>
      <span className="ins-cmp__val">{value.toFixed(1)}</span>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), 80);
    return () => window.clearTimeout(t);
  }, [value]);
  const offset = circumference - (shown / 100) * circumference;
  return (
    <div className="ins-gauge">
      <div className="ins-gauge__ring">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle className="ins-gauge__track" cx="36" cy="36" r={r} />
          <circle
            className="ins-gauge__value"
            cx="36"
            cy="36"
            r={r}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
          />
        </svg>
        <span className="ins-gauge__pct">
          <CountUp value={value} suffix="%" />
        </span>
      </div>
      <span className="ins-gauge__label">{label}</span>
    </div>
  );
}

function TeamBar({
  team,
  max,
  tone,
  delay,
}: {
  team: TeamInsight;
  max: number;
  tone: 'pos' | 'low';
  delay: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW((team.connectionsPerActive / max) * 100), 100);
    return () => window.clearTimeout(t);
  }, [team, max]);
  return (
    <div className="ins-team">
      <div className="ins-team__info">
        <span className="ins-team__name">{team.team}</span>
        <span className="ins-team__ministry">{team.ministry}</span>
      </div>
      <span className="ins-team__track">
        <span
          className={`ins-team__bar ins-team__bar--${tone}`}
          style={{ width: `${w}%`, transitionDelay: `${delay}ms` }}
        />
      </span>
      <span className="ins-team__val">{team.connectionsPerActive.toFixed(1)}</span>
    </div>
  );
}

function SkillBar({ pct, delay }: { pct: number; delay: number }) {
  const [w, setW] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = window.setTimeout(() => setW(pct), 100);
    return () => window.clearTimeout(t);
  }, [pct]);
  return <span className="ins-skill__bar" style={{ width: `${w}%`, transitionDelay: `${delay}ms` }} />;
}

function Stat({
  value,
  label,
  accent,
  suffix,
  decimals = 0,
}: {
  value: number;
  label: string;
  accent?: boolean;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className={`ins-stat ${accent ? 'is-accent' : ''}`}>
      <span className="ins-stat__value">
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </span>
      <span className="ins-stat__label">{label}</span>
    </div>
  );
}
