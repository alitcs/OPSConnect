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
}: {
  person: UserSummary;
  rationale?: string;
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
        <Avatar name={person.name} size={38} status={person.status} />
        <div className="mini-card__body">
          <div className="mini-card__name">{person.name}</div>
          <div className="mini-card__meta">
            {person.title} · {person.team}
          </div>
          {rationale && <div className="mini-card__rationale">{rationale}</div>}
        </div>
      </button>

      <div className="mini-card__actions">
        {!isSelf && (
          <button
            type="button"
            className="mini-card__action mini-card__action--primary"
            onClick={() => navigate(`/messages?to=${person.id}`)}
          >
            <Icon name="teams" size={14} />
            Message on Teams
          </button>
        )}
        <button
          type="button"
          className="mini-card__action"
          onClick={() => openPreview(person.id)}
        >
          <Icon name="info" size={14} />
          View details
        </button>
      </div>
    </div>
  );
}
