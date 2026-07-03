import type { ChatMessage as ChatMessageType } from '../types';
import MiniProfileCard from './MiniProfileCard';
import Icon from './Icon';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';
  const people = message.people ?? [];
  // Rough, transparent estimate of manual effort avoided by an instant, grounded answer.
  const minutesSaved = people.length > 0 ? 10 + people.length * 6 : 0;

  return (
    <div className={`message-row message-row--${message.role}`}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
        <div className="message-bubble">{message.text}</div>
        {people.length > 0 && (
          <div className="message-people">
            {people.map((p) => (
              <MiniProfileCard
                key={p.user.id}
                person={p.user}
                rationale={p.rationale}
              />
            ))}
          </div>
        )}
        {!isUser && (
          <div className="message-meta">
            <span className="message-meta__source">
              <span className="copilot-badge__icon">
                <Icon name="sparkle" size={13} />
              </span>
              Microsoft Copilot
              {people.length > 0 && ` · ${people.length} from the OPS directory`}
            </span>
            {minutesSaved > 0 && (
              <span className="message-meta__pill" title="Estimated time saved versus asking around manually">
                <Icon name="check" size={12} />≈ {minutesSaved} min saved
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
