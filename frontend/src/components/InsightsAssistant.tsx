import { useEffect, useRef, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Icon, { type IconName } from './Icon';

// Admin-only Copilot surface, the hero of the Insights page. It mirrors the home Copilot's
// feel — streamed replies, inline person cards, follow-up chips — but talks to a
// coordinator-gated endpoint with individual engagement data (who's most/least connected,
// how a specific person is settling in, how the co-ops and teams are doing).

const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  { text: 'Who are the most connected people?', icon: 'chart', tag: 'Network' },
  { text: 'Who needs a nudge to connect?', icon: 'coffee', tag: 'Engagement' },
  { text: 'How are the co-op students settling in?', icon: 'sparkle', tag: 'Onboarding' },
  { text: 'Who bridges the most ministries?', icon: 'directory', tag: 'Silos' },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function InsightsAssistant() {
  const { notify } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
    };
  }, []);

  // Keep the panel pinned to the latest message as content streams in.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // Progressively reveal the reply so it reads like a live Copilot response.
  const presentAssistant = (full: ChatMessageType) => {
    const tokens = full.text ? full.text.split(/(\s+)/) : [];
    if (prefersReducedMotion || tokens.length <= 1) {
      setMessages((m) => [...m, full]);
      return;
    }
    setMessages((m) => [...m, { ...full, text: '', people: [], followUps: [] }]);
    setStreamingId(full.id);
    let i = 0;
    streamTimer.current = window.setInterval(() => {
      i += 1;
      const partial = tokens.slice(0, i).join('');
      setMessages((m) => m.map((msg) => (msg.id === full.id ? { ...msg, text: partial } : msg)));
      if (i >= tokens.length) {
        if (streamTimer.current) window.clearInterval(streamTimer.current);
        streamTimer.current = null;
        setMessages((m) => m.map((msg) => (msg.id === full.id ? full : msg)));
        setStreamingId(null);
      }
    }, 20);
  };

  const send = async (text: string) => {
    const optimistic: ChatMessageType = {
      id: `temp-${Date.now()}`,
      conversationId: 'admin-analytics',
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await api.sendAdminChat(text);
      setSending(false);
      presentAssistant(res.message);
    } catch {
      setSending(false);
      notify('Copilot could not respond just now. Please try again.', 'error');
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <section className="copilot-hero ins-anim">
      <div className="copilot-hero__bar">
        <span className="copilot-hero__brand">
          <span className="copilot-hero__mark">
            <Icon name="sparkle" size={18} />
          </span>
          <span className="copilot-hero__brand-text">
            <span className="copilot-hero__eyebrow">Microsoft Copilot</span>
            <span className="copilot-hero__title">Ask Copilot</span>
          </span>
        </span>
        <span className="copilot-hero__badge">
          <Icon name="shield" size={12} />
          Admin
        </span>
      </div>

      <div
        className={`copilot-hero__thread ${hasMessages ? 'is-active' : ''}`}
        ref={threadRef}
        role="log"
        aria-live="polite"
        aria-busy={sending}
      >
        {!hasMessages ? (
          <div className="copilot-hero__empty">
            <h2>What would you like to know?</h2>
            <p>Ask how people are engaging across the OPS network.</p>

            <div className="prompt-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  className="prompt-card"
                  onClick={() => send(s.text)}
                >
                  <span className="prompt-card__icon">
                    <Icon name={s.icon} size={16} />
                  </span>
                  <span className="prompt-card__body">
                    <span className="prompt-card__text">{s.text}</span>
                    <span className="prompt-card__tag">{s.tag}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="chat__empty-footer">
              <span className="copilot-badge__icon">
                <Icon name="sparkle" size={13} />
              </span>
              Individual engagement · coordinators only
            </div>
          </div>
        ) : (
          <div className="copilot-hero__msgs">
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                isStreaming={m.id === streamingId}
                onFollowUp={send}
              />
            ))}
            {sending && (
              <div className="message-row message-row--assistant">
                <div className="message-avatar" aria-hidden="true">
                  <Icon name="sparkle" size={15} />
                </div>
                <div className="message-col" data-align="start">
                  <div className="message-bubble message-bubble--status">
                    <span className="typing" role="status" aria-label="Copilot is analyzing engagement data">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="message-status-text">Analyzing engagement data…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput
        onSend={send}
        disabled={sending}
        placeholder="Ask Copilot how people are engaging…"
        ariaLabel="Ask Copilot about individual engagement"
        hint="Copilot · individual engagement data, visible to coordinators only"
      />
    </section>
  );
}
