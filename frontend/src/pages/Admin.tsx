import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { AdminInsights, TeamInsight } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon, { type IconName } from '../components/Icon';

const ConnectionGraph = lazy(() => import('../components/ConnectionGraph'));

// Org-level analytics for an upper-level (coordinator/executive) audience. Everything here
// is aggregate — no individual social activity is ever exposed. It answers three executive
// questions: are we breaking down silos, where does our knowledge live, and are new people
// settling in?
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

  if (currentUser && !currentUser.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <div className="page__inner admin-page__inner">
        <header className="ins-hero">
          <div>
            <p className="ins-hero__eyebrow">Program insights</p>
            <h1 className="page__title">Insights</h1>
            <p className="page__subtitle">
              How the OPS is connecting, where knowledge lives, and how new people settle in.
            </p>
          </div>
          <span className="ins-hero__privacy">
            <Icon name="shield" size={13} />
            Aggregate only
          </span>
        </header>

        {denied && !loading && (
          <p className="muted">You don't have access to program insights.</p>
        )}

        <Suspense
          fallback={
            <div className="graph-panel graph-panel--pending">
              <div className="graph-panel__loading">Loading network…</div>
            </div>
          }
        >
          <ConnectionGraph />
        </Suspense>

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

  return (
    <div className="ins">
      <div className="ins-kpis">
        <Kpi
          icon="directory"
          value={data.activationRate}
          suffix="%"
          label="Adoption"
          sub={`${data.activeUsers} of ${data.totalEmployees} active`}
          delay={0}
        />
        <Kpi
          icon="sparkle"
          value={data.crossMinistryPct}
          suffix="%"
          label="Cross-ministry reach"
          sub={`${data.crossTeamPct}% cross-team`}
          delay={60}
        />
        <Kpi
          icon="chart"
          value={data.distinctSkills}
          label="Distinct skills"
          sub={`across ${data.ministryCount} ministries`}
          delay={120}
        />
        <Kpi
          icon="coffee"
          value={data.coopConnectionRate}
          decimals={1}
          label="Co-op connections"
          sub={`vs ${data.orgConnectionRate.toFixed(1)} org average`}
          delay={180}
        />
      </div>

      {/* Silos / network health */}
      <section className="ins-card ins-anim" style={{ animationDelay: '120ms' }}>
        <header className="ins-card__head">
          <div>
            <h2 className="ins-card__title">Breaking down silos</h2>
            <p className="ins-card__meta">Where collaboration crosses team and ministry lines</p>
          </div>
        </header>

        <div className="ins-silo">
          <div className="ins-gauges">
            <Gauge value={data.crossTeamPct} label="cross-team" />
            <Gauge value={data.crossMinistryPct} label="cross-ministry" />
          </div>
          <div className="ins-bridges-wrap">
            <span className="ins-mini-label">Top connectors — bridge the most ministries</span>
            <ul className="ins-bridges">
              {data.bridges.map((b) => (
                <li key={b.id}>
                  <span className="ins-bridges__name">{b.name}</span>
                  <span className="ins-bridges__meta">
                    {b.ministriesReached} ministries · {b.connections} links
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
              <span className="ins-mini-label">Needs a nudge</span>
              {lowTeams.map((t, i) => (
                <TeamBar key={`${t.team}-${t.ministry}`} team={t} max={maxTeam} tone="low" delay={i * 70} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Knowledge & expertise */}
      <div className="ins-grid2">
        <section className="ins-card ins-anim" style={{ animationDelay: '180ms' }}>
          <header className="ins-card__head">
            <div>
              <h2 className="ins-card__title">Top expertise</h2>
              <p className="ins-card__meta">Most represented skills across the org</p>
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

        <section className="ins-card ins-anim" style={{ animationDelay: '240ms' }}>
          <header className="ins-card__head">
            <div>
              <h2 className="ins-card__title">Knowledge risks</h2>
              <p className="ins-card__meta">Skills held by only one or two people</p>
            </div>
          </header>
          <div className="ins-risks">
            {data.scarceSkills.map((s) => (
              <span className="ins-risk" key={s.skill}>
                {s.skill}
                <span className="ins-risk__count">{s.count}</span>
              </span>
            ))}
          </div>
          <p className="ins-note">
            Single points of failure — strong candidates for cross-training or documentation.
          </p>
        </section>
      </div>

      {/* Onboarding + reach */}
      <section className="ins-card ins-anim" style={{ animationDelay: '300ms' }}>
        <header className="ins-card__head">
          <div>
            <h2 className="ins-card__title">Onboarding &amp; reach</h2>
            <p className="ins-card__meta">How new people and the wider org are engaging</p>
          </div>
        </header>
        <div className="ins-stat-row">
          <Stat value={data.coopCount} label="co-op students" />
          <Stat value={data.mentorsAvailable} label="mentors listed" />
          <Stat value={data.availableToday} label="open to help today" />
          <Stat value={idle} label="not active yet" />
          <Stat value={data.estHoursSaved} label="est. hours saved / mo" accent />
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
  delay = 0,
}: {
  icon: IconName;
  value: number;
  label: string;
  sub?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}) {
  return (
    <div className="ins-kpi ins-anim" style={{ animationDelay: `${delay}ms` }}>
      <span className="ins-kpi__icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="ins-kpi__value">
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </span>
      <span className="ins-kpi__label">{label}</span>
      {sub && <span className="ins-kpi__sub">{sub}</span>}
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

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`ins-stat ${accent ? 'is-accent' : ''}`}>
      <span className="ins-stat__value">
        <CountUp value={value} />
      </span>
      <span className="ins-stat__label">{label}</span>
    </div>
  );
}
