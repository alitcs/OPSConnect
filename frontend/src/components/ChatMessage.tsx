import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import MiniProfileCard from './MiniProfileCard';
import Icon from './Icon';

export default function ChatMessage({
  message,
  isStreaming = false,
  onFollowUp,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
  onFollowUp?: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const people = message.people ?? [];
  const followUps = message.followUps ?? [];
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const copy = async () => {
    const lines = [message.text, ...people.map((p) => `• ${p.user.name} — ${p.user.title}`)];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className={`message-row message-row--${message.role}`}>
      {!isUser && (
        <div className="message-avatar" aria-hidden="true">
          <Icon name="sparkle" size={15} />
        </div>
      )}
      <div className="message-col" data-align={isUser ? 'end' : 'start'}>
        <div className="message-bubble">
          {isStreaming ? (
            <>
              <span aria-hidden="true">{message.text}</span>
              <span className="message-cursor" aria-hidden="true" />
            </>
          ) : (
            message.text
          )}
        </div>

        {!isStreaming && people.length > 0 && (
          <div className="message-people">
            {people.map((p, i) => (
              <div
                className="message-person"
                key={p.user.id}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {p.capability && <div className="message-person__cap">{p.capability}</div>}
                <MiniProfileCard person={p.user} rationale={p.rationale} matchStrength={p.matchStrength} />
              </div>
            ))}
          </div>
        )}

        {!isStreaming && !isUser && (
          <div className="message-meta">
            <span className="message-meta__source">
              <span className="copilot-badge__icon">
                <Icon name="sparkle" size={13} />
              </span>
              Microsoft Copilot
              {people.length > 0 && ` · ${people.length} from the OPS directory`}
            </span>
            <span className="message-actions">
              <button
                type="button"
                className="message-action"
                onClick={copy}
                aria-label={copied ? 'Answer copied' : 'Copy answer'}
              >
                <Icon name={copied ? 'check' : 'copy'} size={14} />
              </button>
              <button
                type="button"
                className={`message-action ${vote === 'up' ? 'is-active' : ''}`}
                onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}
                aria-label="Good response"
                aria-pressed={vote === 'up'}
              >
                <Icon name="thumbsUp" size={14} />
              </button>
              <button
                type="button"
                className={`message-action ${vote === 'down' ? 'is-active' : ''}`}
                onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}
                aria-label="Needs improvement"
                aria-pressed={vote === 'down'}
              >
                <Icon name="thumbsDown" size={14} />
              </button>
            </span>
          </div>
        )}

        {!isStreaming && !isUser && followUps.length > 0 && onFollowUp && (
          <div className="message-followups">
            {followUps.map((f) => (
              <button
                type="button"
                key={f}
                className="message-followup"
                onClick={() => onFollowUp(f)}
              >
                {f}
                <Icon name="chevronRight" size={13} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

