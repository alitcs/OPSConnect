import { useNavigate } from 'react-router-dom';
import { CONNECT_INTENTS, type ConnectPerson } from '../types';
import { usePreviewCard } from '../context/PreviewCardContext';
import Avatar from './Avatar';
import Icon, { type IconName } from './Icon';

// A person on the Connect board: who they are, how they'd like to connect today, and why you'd
// reach out (shared interests + proximity). Tapping opens the preview; "Message" opens a
// private in-app chat with them.
export default function ConnectCard({ person }: { person: ConnectPerson }) {
  const { openPreview } = usePreviewCard();
  const navigate = useNavigate();
  const { user } = person;
  const intents = CONNECT_INTENTS.filter((it) => person.intents?.includes(it.id));

  return (
    <div className="connect-card">
      <button
        type="button"
        className="connect-card__main"
        onClick={() => openPreview(user.id)}
        aria-label={`View ${user.name}, ${user.title}`}
      >
        <Avatar name={user.name} size={40} status={user.status} />
        <div className="connect-card__body">
          <div className="connect-card__top">
            <span className="connect-card__name">{user.name}</span>
            {person.isNearby && (
              <span className="connect-card__badge">
                <Icon name="pin" size={10} strokeWidth={2.4} />
                Nearby
              </span>
            )}
          </div>
          <div className="connect-card__meta">
            {user.title} · {user.team}
          </div>
          {intents.length > 0 && (
            <div className="connect-card__intents">
              {intents.map((it) => (
                <span className="intent-tag" key={it.id} title={it.blurb}>
                  <Icon name={it.icon as IconName} size={11} strokeWidth={2} />
                  {it.label}
                </span>
              ))}
            </div>
          )}
          {person.availabilityNote && (
            <div className="connect-card__note">{person.availabilityNote}</div>
          )}
          {person.sharedInterests.length > 0 && (
            <div className="connect-card__context">
              You both like {person.sharedInterests.join(' & ')}
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        className="connect-card__msg"
        onClick={() => navigate(`/messages?to=${user.id}`)}
        aria-label={`Message ${user.name}`}
      >
        <Icon name="messages" size={16} />
      </button>
    </div>
  );
}
