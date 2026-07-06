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
  // Auto-prioritize without hiding anything: conversations where it's your turn float to a
  // "Needs your reply" group; everything else stays below. Same on mobile and desktop.
  const needsReply = threads.filter((t) => t.needsReply);
  const rest = threads.filter((t) => !t.needsReply);

  const renderThread = (t: MessageThreadSummary) => (
    <button
      key={t.id}
      className={`thread-item ${activeThreadId === t.id ? 'active' : ''}`}
      onClick={() => onSelect(t)}
    >
      {t.participant && <Avatar name={t.participant.name} size={38} status={t.participant.status} />}
      <div className="thread-item__body">
        <div className="thread-item__name">
          {t.participant?.name ?? 'Unknown'}
          {t.needsReply && <span className="thread-item__dot" aria-label="Awaiting your reply" />}
        </div>
        <div className="thread-item__last">
          {t.lastMessageFromMe && t.lastMessage ? 'You: ' : ''}
          {t.lastMessage ?? 'No messages yet'}
        </div>
      </div>
    </button>
  );

  return (
    <div className={`messages__list ${className}`}>
      <div className="messages__list-header">Messages</div>
      <div className="messages__list-inner">
        {threads.length === 0 && (
          <p className="muted" style={{ padding: 16, fontSize: 14 }}>
            No conversations yet. Message someone from their profile to start one.
          </p>
        )}

        {needsReply.length > 0 && (
          <>
            <div className="messages__group-label">
              Needs your reply
              <span className="messages__group-count">{needsReply.length}</span>
            </div>
            {needsReply.map(renderThread)}
          </>
        )}

        {rest.length > 0 && (
          <>
            {needsReply.length > 0 && <div className="messages__group-label">Conversations</div>}
            {rest.map(renderThread)}
          </>
        )}
      </div>
    </div>
  );
}
