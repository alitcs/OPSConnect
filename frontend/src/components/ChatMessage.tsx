import type { ChatMessage as ChatMessageType } from '../types';
import MiniProfileCard from './MiniProfileCard';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-row message-row--${message.role}`}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
        <div className="message-bubble">{message.text}</div>
        {message.people && message.people.length > 0 && (
          <div className="message-people">
            {message.people.map((p) => (
              <MiniProfileCard
                key={p.user.id}
                person={p.user}
                rationale={p.rationale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
