import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ConnectPerson, DailyNudge, ProximitySummary } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvailabilityCard from '../components/AvailabilityCard';
import ConnectCard from '../components/ConnectCard';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

// The Connect bulletin board — the social core of ConnectOPS. Set your own availability,
// see a randomized daily nudge and smart-proximity suggestion, then browse everyone who's
// open for coffee today with mutual context (shared interests + proximity) at a glance.
export default function ConnectPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<ConnectPerson[]>([]);
  const [proximity, setProximity] = useState<ProximitySummary | null>(null);
  const [nudge, setNudge] = useState<DailyNudge | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getConnectFeed(), api.getProximity(), api.getDailyNudge()])
      .then(([f, p, n]) => {
        setFeed(f);
        setProximity(p);
        setNudge(n);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, currentUser?.id]);

  return (
    <div className="page">
      <div className="page__inner">
        <div className="connect-head">
          <div>
            <h1 className="page__title">Connect</h1>
            <p className="page__subtitle">
              See who's open to help — and let others know when you are.
            </p>
          </div>
          {currentUser && (
            <button
              type="button"
              className="connect-head__me"
              onClick={() => navigate(`/users/${currentUser.id}?preview=1`)}
              title="Preview how your profile looks to others"
              aria-label="Preview how your profile looks to others"
            >
              <Avatar name={currentUser.name} size={38} status={currentUser.status} />
            </button>
          )}
        </div>

        <AvailabilityCard onChange={load} />

        {/* Daily nudge — randomized, may surface one, both, or neither nearby person. */}
        {nudge && (
          <section className="nudge-card">
            <span className="nudge-card__icon">
              <Icon name="bell" size={18} />
            </span>
            <div className="nudge-card__body">
              <div className="nudge-card__label">Today's nudge</div>
              <div className="nudge-card__msg">{nudge.message}</div>
              {nudge.people.length > 0 && (
                <div className="nudge-card__people">
                  {nudge.people.map((p) => (
                    <ConnectCard key={p.user.id} person={p} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Smart proximity summary. */}
        {proximity && proximity.shareEnabled && proximity.count > 0 && (
          <section className="prox-summary">
            <Icon name="pin" size={16} />
            <span>
              <strong>{proximity.count}</strong>{' '}
              {proximity.count === 1 ? 'person' : 'people'} near you on Floor {proximity.floor}{' '}
              {proximity.count === 1 ? 'is' : 'are'} open to help.
            </span>
          </section>
        )}
        {proximity && !proximity.shareEnabled && (
          <section className="prox-summary prox-summary--muted">
            <Icon name="pin" size={16} />
            <span>
              Turn on <Link to="/settings">location sharing</Link> to see who's nearby.
            </span>
          </section>
        )}

        <div className="connect-feed__header">
          <h2>Open to help</h2>
          {!loading && <span className="chip">{feed.length}</span>}
        </div>

        <div className="connect-feed">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="skeleton-card" key={i} aria-hidden="true">
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div className="skeleton-card__lines">
                  <div className="skeleton" style={{ height: 12, width: '35%' }} />
                  <div className="skeleton" style={{ height: 10, width: '60%' }} />
                </div>
              </div>
            ))
          ) : feed.length === 0 ? (
            <div className="connect-empty">
              <span className="connect-empty__icon">
                <Icon name="coffee" size={26} />
              </span>
              <p>No one's on the board yet today.</p>
              <p className="muted">Be the first — set yourself open to help above.</p>
            </div>
          ) : (
            feed.map((p) => <ConnectCard key={p.user.id} person={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
