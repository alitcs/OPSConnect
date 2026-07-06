import { useNavigate } from 'react-router-dom';
import type { UserSummary } from '../types';
import { usePreviewCard } from '../context/PreviewCardContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Icon from './Icon';

// A compact, tappable person card used inline in chat results and in the directory.
// Tapping the main region opens the preview card; the action row lets you act on the
// result directly (message on Teams, view details) so the workflow loop is closed.
export default function MiniProfileCard({
  person,
  rationale,
  matchStrength,
}: {
  person: UserSummary;
  rationale?: string;
  matchStrength?: 'high' | 'medium';
}) {
  const { openPreview } = usePreviewCard();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isSelf = currentUser?.id === person.id;

  return (
    <div className="mini-card">
      <button
        type="button"
        className="mini-card__main"
        onClick={() => openPreview(person.id)}
        aria-label={`View details for ${person.name}, ${person.title}`}
      >
        <Avatar name={person.name} size={36} status={person.status} />
        <div className="mini-card__body">
          <div className="mini-card__name">
            <span className="mini-card__name-text">{person.name}</span>
            {matchStrength === 'high' && (
              <span className="match-flag" title="Strong match" aria-label="Strong match">
                <Icon name="check" size={11} strokeWidth={3} />
              </span>
            )}
          </div>
          {rationale ? (
            <div className="mini-card__rationale">{rationale}</div>
          ) : (
            <div className="mini-card__meta">
              {person.title} · {person.team}
            </div>
          )}
        </div>
      </button>

      {!isSelf && (
        <button
          type="button"
          className="mini-card__msg"
          onClick={() => navigate(`/messages?to=${person.id}`)}
          aria-label={`Message ${person.name}`}
        >
          <Icon name="messages" size={16} />
        </button>
      )}
    </div>
  );
}
