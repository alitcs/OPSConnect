import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { User } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProfileSection1 from '../components/ProfileSection1';
import FloorMap from '../components/FloorMap';
import Icon from '../components/Icon';

// Viewing someone else's profile: read-only Section 1 only. Section 2 is NOT shown.
// If the person opted in to share their seat/floor, show it plus an individual map view.
// TODO (open question #6): the team may later decide to surface some Tier B data (skills,
// interests) here. For now only Section 1 is public.
export default function UserProfilePage() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const isSelf = currentUser?.id === userId;
  const preview = searchParams.get('preview') === '1';
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setUser(null);
    setError(null);
    setShowMap(false);
    api.getUser(userId).then(setUser).catch((e) => setError(e.message));
  }, [userId]);

  // Viewing yourself normally redirects to the editable profile — unless you explicitly
  // asked to preview how your profile appears to others.
  if (isSelf && !preview) return <Navigate to="/profile" replace />;

  return (
    <div className="page">
      <div className="page__inner">
        <button className="btn btn--ghost btn--back" onClick={() => navigate(-1)}>
          <Icon name="back" size={16} />
          Back
        </button>

        {error && <p className="muted">{error}</p>}
        {!user && !error && <p className="muted">Loading…</p>}

        {user && (
          <>
            {isSelf && preview && (
              <div className="preview-banner">
                <Icon name="info" size={15} />
                This is how your profile appears to others.
              </div>
            )}
            <ProfileSection1 user={user} />

            <div style={{ height: 16 }} />

            {!isSelf && (
              <div className="card" style={{ padding: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn--primary" onClick={() => navigate(`/messages?to=${user.id}`)}>
                  Message
                </button>
                <a className="btn" href={`mailto:${user.email}`}>
                  Email
                </a>
              </div>
            )}

            {/* Tier 2 location — only present if the person opted in (server already gates it). */}
            {(user.floor !== null || user.seat !== null) && (
              <div className="card" style={{ padding: 20, marginTop: 16 }}>
                <div className="profile__section-label">Where to find them</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  {user.floor !== null && (
                    <div className="field">
                      <span className="field__label">Floor</span>
                      <span className="field__value">{user.floor}</span>
                    </div>
                  )}
                  {user.seat !== null && (
                    <div className="field">
                      <span className="field__label">Seat</span>
                      <span className="field__value">{user.seat}</span>
                    </div>
                  )}
                </div>
                {user.seat !== null && user.floor !== null && (
                  <>
                    <button className="btn" onClick={() => setShowMap((s) => !s)}>
                      {showMap ? 'Hide map' : 'Show on map'}
                    </button>
                    {showMap && (
                      <div style={{ marginTop: 14 }}>
                        <FloorMap floor={user.floor} seat={user.seat} building={user.location} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
