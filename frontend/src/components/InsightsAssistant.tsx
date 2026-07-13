import { useEffect, useRef, useState } from 'react';
import type { ChatMessage as ChatMessageType, Conversation, EdgeMode, UserSummary } from '../types';
import { EDGE_MODES } from '../types';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Icon, { type IconName } from './Icon';

// Admin-only Copilot surface, the hero of the Insights page. It mirrors the home Copilot's
// feel — streamed replies, inline person cards, follow-up chips — but talks to a
// coordinator-gated endpoint with individual engagement data (who's most/least connected,
// how a specific person is settling in, how the co-ops and teams are doing). It is also a
// superset of the member Copilot (skills, projects, org structure…) and can answer
// relationship questions and re-shape the network view.

const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  { text: 'How are Priya Sharma and Marcus Chen connected?', icon: 'directory', tag: 'Relationships' },
  { text: 'Who should Marcus Chen meet?', icon: 'coffee', tag: 'Relationships' },
  { text: 'Which skills rely on just one person?', icon: 'shield', tag: 'Risk' },
  { text: 'Which active projects have staffing gaps?', icon: 'ticket', tag: 'Delivery' },
  { text: 'Who bridges the most ministries?', icon: 'chart', tag: 'Silos' },
  { text: 'Show the network by shared skills', icon: 'sparkle', tag: 'Network' },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Detect a spatial "find this person" request and pull out the name to highlight.
// Only explicit locate verbs count, so informational questions still reach the backend.
function parseFindPerson(raw: string): string | null {
  const m = raw
    .trim()
    .match(/^(?:find|locate|highlight|where is|where's|point out|zoom to|zoom in on)\s+(.+)$/i);
  if (!m) return null;
  const name = m[1]
    .replace(/[?.!]+$/g, '')
    .replace(/\b(?:on|in)\s+the\s+(?:map|graph|network|chart|nodes?)\b.*$/i, '')
    .replace(/['’]s\b/gi, '')
    .replace(/\b(?:node|profile|person|dot|please)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name.length ? name : null;
}

// Detect a request to re-shape the network view ("show the graph by shared skills") and map
// it to a connection lens, so the assistant can drive the graph filter conversationally.
function parseSetMode(raw: string): EdgeMode | null {
  const q = raw.toLowerCase().trim();
  const looksLikeViewChange =
    /(show|switch|change|colou?r|view|set|display|filter|map|group|re-?colou?r).*(graph|network|nodes?|connections?|view|lens)|connections? by|network by|group by|colou?r by|lens/.test(
      q,
    );
  if (!looksLikeViewChange) return null;
  if (/\bteam/.test(q)) return 'team';
  if (/ministr/.test(q)) return 'ministry';
  if (/division|branch/.test(q)) return 'division';
  if (/cluster/.test(q)) return 'cluster';
  if (/skill/.test(q)) return 'skills';
  if (/interest/.test(q)) return 'interests';
  if (/coffee|already connected/.test(q)) return 'coffee';
  if (/project/.test(q)) return 'project';
  if (/report|manager|org chart/.test(q)) return 'reporting';
  if (/floor|location|desk|proximity/.test(q)) return 'location';
  if (/mentor/.test(q)) return 'mentorship';
  if (/cohort|school/.test(q)) return 'cohort';
  if (/combined|default|everything|overall/.test(q)) return 'combined';
  return null;
}

export default function InsightsAssistant({
  onFindPerson,
  onFocusPerson,
  mode = 'combined',
  onSetMode,
}: {
  onFindPerson?: (name: string) => void;
  /** Tap a person card in a reply to highlight that exact person on the network above. */
  onFocusPerson?: (person: UserSummary) => void;
  mode?: EdgeMode;
  onSetMode?: (mode: EdgeMode) => void;
}) {
  const { notify } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  // Saved admin chats (coordinator-scoped history) surfaced in the header history panel.
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<number | null>(null);

  const loadConversations = () =>
    api.listAdminConversations().then(setConversations).catch(() => setConversations([]));

  useEffect(() => {
    loadConversations();
  }, []);

  // Close the history panel when clicking outside the header bar.
  useEffect(() => {
    if (!historyOpen) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setHistoryOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [historyOpen]);

  const stopStream = () => {
    if (streamTimer.current) {
      window.clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
    setStreamingId(null);
  };

  const selectConversation = async (id: string) => {
    setHistoryOpen(false);
    if (id === activeId) return;
    stopStream();
    setActiveId(id);
    setLoadingThread(true);
    try {
      const { messages: msgs } = await api.getAdminConversation(id);
      setMessages(msgs);
    } catch {
      notify('Could not open that conversation.', 'error');
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const newChat = () => {
    setHistoryOpen(false);
    stopStream();
    setActiveId(null);
    setMessages([]);
  };

  const removeConversation = async (id: string) => {
    try {
      await api.deleteAdminConversation(id);
      if (id === activeId) newChat();
      loadConversations();
    } catch {
      notify('Could not delete that conversation.', 'error');
    }
  };

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

    // "Find <person>" → highlight their node on the graph instead of querying the backend.
    const person = onFindPerson ? parseFindPerson(text) : null;
    if (person) {
      onFindPerson!(person);
      presentAssistant({
        id: `assist-${Date.now()}`,
        conversationId: 'admin-analytics',
        role: 'assistant',
        text: `Highlighting ${person} on the network above — their node is now focused with its direct connections. Tap the background to clear it.`,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    // "Show the network by <lens>" → re-shape the graph filter conversationally.
    const nextMode = onSetMode ? parseSetMode(text) : null;
    if (nextMode) {
      onSetMode!(nextMode);
      const info = EDGE_MODES.find((m) => m.id === nextMode);
      presentAssistant({
        id: `assist-${Date.now()}`,
        conversationId: 'admin-analytics',
        role: 'assistant',
        text: `Switched the network above to the “${info?.label ?? nextMode}” lens — now an edge means ${info?.description ?? 'a shared connection'}. Ask me anything about relationships in this view.`,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    setSending(true);
    try {
      const res = await api.sendAdminChat(text, mode, activeId ?? undefined);
      if (!activeId) setActiveId(res.conversationId);
      loadConversations();
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
      <div className="copilot-hero__bar" ref={barRef}>
        <span className="copilot-hero__brand">
          <span className="copilot-hero__mark">
            <Icon name="sparkle" size={18} />
          </span>
          <span className="copilot-hero__brand-text">
            <span className="copilot-hero__eyebrow">Microsoft Copilot</span>
            <span className="copilot-hero__title">Ask Copilot</span>
          </span>
        </span>
        <div className="copilot-hero__tools">
          <button
            type="button"
            className="copilot-hero__tool"
            onClick={newChat}
            title="New chat"
            aria-label="Start a new chat"
          >
            <Icon name="plus" size={16} />
          </button>
          <button
            type="button"
            className={`copilot-hero__tool ${historyOpen ? 'is-active' : ''}`}
            onClick={() => setHistoryOpen((v) => !v)}
            title="Saved chats"
            aria-label="Saved chats"
            aria-expanded={historyOpen}
          >
            <Icon name="clock" size={16} />
            {conversations.length > 0 && (
              <span className="copilot-hero__tool-count">{conversations.length}</span>
            )}
          </button>
          <span className="copilot-hero__badge">
            <Icon name="shield" size={12} />
            Admin
          </span>
        </div>

        {historyOpen && (
          <div className="copilot-hero__history" role="menu">
            <div className="copilot-hero__history-head">
              <span>Saved chats</span>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close saved chats"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="copilot-hero__history-empty">No saved chats yet.</p>
            ) : (
              <div className="copilot-hero__history-list">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`ins-conv ${activeId === c.id ? 'is-active' : ''}`}
                  >
                    <button
                      type="button"
                      className="ins-conv__open"
                      onClick={() => selectConversation(c.id)}
                    >
                      <Icon name="chat" size={14} />
                      <span className="ins-conv__title">{c.title}</span>
                    </button>
                    <button
                      type="button"
                      className="ins-conv__del"
                      onClick={() => removeConversation(c.id)}
                      aria-label={`Delete ${c.title}`}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={`copilot-hero__thread ${hasMessages ? 'is-active' : ''}`}
        ref={threadRef}
        role="log"
        aria-live="polite"
        aria-busy={sending}
      >
        {loadingThread ? (
          <div className="copilot-hero__empty">
            <p>Loading conversation…</p>
          </div>
        ) : !hasMessages ? (
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
                onPersonClick={onFocusPerson}
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
        placeholder="Ask how people are engaging — or “find Priya Chen” to highlight them…"
        ariaLabel="Ask Copilot about individual engagement"
        hint="Copilot · individual engagement data, visible to coordinators only"
      />
    </section>
  );
}
