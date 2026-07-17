import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ChatMessage as ChatMessageType,
  ConnectPerson,
  Conversation,
  ProximitySummary,
} from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConnectSidebar from '../components/ConnectSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Avatar from '../components/Avatar';
import Icon, { type IconName } from '../components/Icon';

// The Connect board — reframed around its "connection concierge". The Copilot is the whole
// page: it suggests who to meet, welcomes newcomers, and drafts friendly intros. The side
// panel carries the context around it — your saved chats, your own "open to connect" status,
// and the live list of people open to connect today.

const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  { text: 'Who should I meet?', icon: 'directory', tag: 'Suggestions' },
  { text: "Who's open to connect today?", icon: 'coffee', tag: 'Today' },
  { text: 'Who shares my interests?', icon: 'star', tag: 'Common ground' },
  { text: 'Draft an intro for me', icon: 'chat', tag: 'Break the ice' },
  { text: "Who's new to the OPS?", icon: 'flag', tag: 'Welcome' },
  { text: 'Who works near me today?', icon: 'pin', tag: 'Nearby' },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ConnectPage() {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  // --- Concierge chat state ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<number | null>(null);

  // --- Board state (your status + people open to connect) ---
  const [feed, setFeed] = useState<ConnectPerson[]>([]);
  const [proximity, setProximity] = useState<ProximitySummary | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const loadConversations = () =>
    api.listConnectConversations().then(setConversations).catch(() => setConversations([]));

  const loadBoard = useCallback(() => {
    setLoadingFeed(true);
    Promise.all([api.getConnectFeed(), api.getProximity()])
      .then(([f, p]) => {
        setFeed(f);
        setProximity(p);
      })
      .finally(() => setLoadingFeed(false));
  }, []);

  useEffect(() => {
    loadConversations();
    loadBoard();
  }, [loadBoard, currentUser?.id]);

  // Clean up any in-flight streaming timer on unmount.
  useEffect(() => {
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
    };
  }, []);

  // Keep the thread pinned to the latest message as content streams in.
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

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setLoadingThread(true);
    try {
      const { messages: msgs } = await api.getConnectConversation(id);
      setMessages(msgs);
    } catch {
      notify('Could not open that conversation. Please try again.', 'error');
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.deleteConnectConversation(id);
      if (activeId === id) newChat();
      loadConversations();
    } catch {
      notify('Could not delete that conversation.', 'error');
    }
  };

  const send = async (text: string) => {
    const optimistic: ChatMessageType = {
      id: `temp-${Date.now()}`,
      conversationId: activeId ?? 'pending',
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await api.sendConnectChat(text, activeId ?? undefined);
      if (!activeId) {
        setActiveId(res.conversationId);
        loadConversations();
      }
      setSending(false);
      presentAssistant(res.message);
    } catch {
      setSending(false);
      notify('The concierge could not respond just now. Please try again.', 'error');
    }
  };

  return (
    <div className="chat connect-chat">
      <ConnectSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        feed={feed}
        proximity={proximity}
        loadingFeed={loadingFeed}
        onAvailabilityChange={loadBoard}
      />

      <div className="chat__main">
        <div className="connect-topbar">
          <button
            className="chat__mobile-toggle connect-topbar__toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" size={16} />
            Status &amp; people
          </button>
          <span className="connect-topbar__brand">
            <span className="connect-topbar__mark">
              <Icon name="sparkle" size={15} />
            </span>
            Connection concierge
          </span>
          {currentUser && (
            <button
              type="button"
              className="connect-topbar__me"
              onClick={() => navigate(`/users/${currentUser.id}?preview=1`)}
              title="Preview how your profile looks to others"
              aria-label="Preview how your profile looks to others"
            >
              <Avatar name={currentUser.name} size={32} status={currentUser.status} />
            </button>
          )}
        </div>

        <div
          className="chat__thread"
          ref={threadRef}
          role="log"
          aria-live="polite"
          aria-busy={sending}
          aria-label="Conversation with the connection concierge"
        >
          {loadingThread ? (
            <div className="chat__thread-inner" aria-hidden="true">
              <div className="skeleton" style={{ height: 44, width: '55%', alignSelf: 'flex-end' }} />
              <div className="skeleton" style={{ height: 68, width: '78%' }} />
              <div className="skeleton-card">
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                <div className="skeleton-card__lines">
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton" style={{ height: 10, width: '70%' }} />
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat__empty">
              <div className="chat__empty-inner">
                <div className="chat__empty-mark">
                  <Icon name="sparkle" size={24} />
                </div>
                <h2>Let's find you someone to connect with</h2>
                <p>Ask who to meet, who's around today, or to draft a friendly intro.</p>

                <div className="prompt-grid">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.text} className="prompt-card" onClick={() => send(s.text)}>
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
                  Low-pressure suggestions · no pings, no manager visibility
                </div>
              </div>
            </div>
          ) : (
            <div className="chat__thread-inner">
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
                      <span
                        className="typing"
                        role="status"
                        aria-label="The concierge is finding people to connect with"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="message-status-text">Finding good people to meet…</span>
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
          placeholder="Ask who to meet, who's around today, or “draft an intro to…”"
          ariaLabel="Ask the connection concierge who to meet"
          hint="Copilot · warm, low-pressure suggestions to help you connect"
        />
      </div>
    </div>
  );
}
