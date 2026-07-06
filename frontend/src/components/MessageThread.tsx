import { useEffect, useRef, useState } from 'react';
import type { DirectMessage, UserSummary } from '../types';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import Icon from './Icon';

export function threadKeyFor(a: number, b: number): string {
  const [low, high] = a < b ? [a, b] : [b, a];
  return `thread-${low}-${high}`;
}

// Minimal two-person message thread. Plain text only — no reactions, read receipts, typing
// indicators, or file sharing (by design, see Section 8.2). Intended for initial outreach.
export default function MessageThread({
  otherUser,
  onSent,
  onBack,
}: {
  otherUser: UserSummary;
  onSent: () => void;
  onBack?: () => void;
}) {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const threadId = currentUser ? threadKeyFor(currentUser.id, otherUser.id) : '';

  const load = () => {
    if (!threadId) return;
    api
      .getThread(threadId)
      .then((res) => setMessages(res.messages))
      .catch(() => setMessages([])); // thread may not exist yet
  };

  useEffect(load, [threadId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await api.sendMessage(otherUser.id, text);
      load();
      onSent();
    } catch (err) {
      setDraft(text); // keep what they typed
      notify(
        err instanceof ApiError ? err.message : 'Could not send your message. Please try again.',
        'error',
      );
    }
  };

  return (
    <div className="messages__thread">
      <div className="messages__thread-header">
        {onBack && (
          <button className="btn btn--ghost icon-btn" onClick={onBack} aria-label="Back">
            <Icon name="back" size={18} />
          </button>
        )}
        <Avatar name={otherUser.name} size={34} status={otherUser.status} />
        <div>
          <div style={{ fontWeight: 600 }}>{otherUser.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{otherUser.title}</div>
        </div>
      </div>

      <div className="messages__thread-body" ref={bodyRef}>
        {messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
            Say hello — this is a quick way to make an initial connection.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`dm-bubble ${m.fromUserId === currentUser?.id ? 'dm-bubble--mine' : 'dm-bubble--theirs'}`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="chat__input">
        <div className="chat__input-inner">
          <textarea
            rows={1}
            placeholder={`Message ${otherUser.name.split(' ')[0]}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="chat__send" onClick={send} disabled={!draft.trim()} aria-label="Send">
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
