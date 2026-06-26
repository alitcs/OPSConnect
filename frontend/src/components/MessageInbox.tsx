import type { MessageThreadSummary } from '../types';
import Avatar from './Avatar';

export default function MessageInbox({
  threads,
  activeThreadId,
  onSelect,
  className = '',
}: {
  threads: MessageThreadSummary[];
  activeThreadId: string | null;
  onSelect: (thread: MessageThreadSummary) => void;
  className?: string;
}) {
  return (
    <div className={`messages__list ${className}`}>
      <div className="messages__list-header">Messages</div>
      <div className="messages__list-inner">
        {threads.length === 0 && (
          <p className="muted" style={{ padding: 16, fontSize: 14 }}>
            No conversations yet. Message someone from their profile to start one.
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            className={`thread-item ${activeThreadId === t.id ? 'active' : ''}`}
            onClick={() => onSelect(t)}
          >
            {t.participant && <Avatar name={t.participant.name} size={38} status={t.participant.status} />}
            <div className="thread-item__body">
              <div className="thread-item__name">{t.participant?.name ?? 'Unknown'}</div>
              <div className="thread-item__last">{t.lastMessage ?? 'No messages yet'}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
