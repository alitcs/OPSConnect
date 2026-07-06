import { useEffect, useRef, useState } from 'react';
import type { ChatMessage as ChatMessageType, Conversation } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Icon, { type IconName } from '../components/Icon';

// Starter prompts shown on the empty state. Kept together in one clean grid; the tag is a
// subtle hint of who each is for, not a section divider.
const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  {
    text: "I'm starting a project that needs Python, data visualization, and Azure — who can help?",
    icon: 'sparkle',
    tag: 'Managers',
  },
  {
    text: 'I need to deliver an analytics dashboard — what skills exist internally?',
    icon: 'chart',
    tag: 'Managers',
  },
  {
    text: "Who's around and open to help right now?",
    icon: 'coffee',
    tag: 'Co-ops',
  },
  {
    text: 'I want DevOps experience — who can I shadow?',
    icon: 'directory',
    tag: 'Co-ops',
  },
  {
    text: 'Who works in cybersecurity?',
    icon: 'shield',
    tag: 'Explore',
  },
  {
    text: 'What teams work on data analytics?',
    icon: 'messages',
    tag: 'Explore',
  },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<number | null>(null);
  const followRaf = useRef<number | null>(null);
  const followActive = useRef(false);

  const loadConversations = () =>
    api.listConversations().then(setConversations).catch(() => setConversations([]));

  useEffect(() => {
    loadConversations();
  }, [currentUser?.id]);

  // Clean up any in-flight streaming timer on unmount.
  useEffect(() => {
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
      if (followRaf.current) cancelAnimationFrame(followRaf.current);
    };
  }, []);

  useEffect(() => {
    // While the people cards are staggering in, an eased follow-scroll is running —
    // don't fight it with an instant jump.
    if (followActive.current) return;
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Gently ease the thread down to the bottom over the same window the surfaced people
  // cards take to stagger in, so the view follows each card instead of jumping.
  const followScroll = (cardCount: number) => {
    const el = threadRef.current;
    if (!el) return;
    followActive.current = true;
    const start = el.scrollTop;
    const duration = (cardCount - 1) * 90 + 340;
    const startTime = performance.now();
    const step = (now: number) => {
      const node = threadRef.current;
      if (!node) {
        followActive.current = false;
        return;
      }
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      const target = node.scrollHeight - node.clientHeight;
      node.scrollTop = start + (target - start) * eased;
      if (t < 1) {
        followRaf.current = requestAnimationFrame(step);
      } else {
        followRaf.current = null;
        followActive.current = false;
      }
    };
    followRaf.current = requestAnimationFrame(step);
  };

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setLoadingThread(true);
    try {
      const { messages: msgs } = await api.getConversation(id);
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
      await api.deleteConversation(id);
      if (activeId === id) newChat();
      loadConversations();
    } catch {
      notify('Could not delete that conversation.', 'error');
    }
  };

  // Progressively reveal the assistant reply so it reads like a live Copilot response.
  // Falls back to instant display when the user prefers reduced motion.
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
        const peopleCount = full.people?.length ?? 0;
        // Flag before committing so the autoscroll effect defers to the eased follow.
        if (peopleCount > 1) followActive.current = true;
        setMessages((m) => m.map((msg) => (msg.id === full.id ? full : msg)));
        setStreamingId(null);
        if (peopleCount > 1) {
          requestAnimationFrame(() => followScroll(peopleCount));
        }
      }
    }, 22);
  };

  const send = async (text: string) => {
    // Stop any in-progress follow-scroll from a previous answer.
    if (followRaf.current) cancelAnimationFrame(followRaf.current);
    followActive.current = false;
    // Optimistically append the user's message.
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
      const res = await api.sendChat(text, activeId ?? undefined);
      if (!activeId) {
        setActiveId(res.conversationId);
        loadConversations();
      }
      setSending(false);
      presentAssistant(res.message);
    } catch {
      setSending(false);
      notify('Copilot could not respond just now. Please try again.', 'error');
    }
  };

  return (
    <div className="chat">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="chat__main">
        <button className="chat__mobile-toggle" onClick={() => setSidebarOpen(true)}>
          <Icon name="menu" size={16} />
          Conversations
        </button>

        <div
          className="chat__thread"
          ref={threadRef}
          role="log"
          aria-live="polite"
          aria-busy={sending}
          aria-label="Conversation with Copilot"
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
                <h2>What do you need?</h2>
                <p>Ask who can help, or describe a project.</p>

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
                  Microsoft Copilot · OPS directory
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
                      <span className="typing" role="status" aria-label="Copilot is searching the OPS directory">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="message-status-text">Searching the OPS directory…</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ChatInput onSend={send} disabled={sending} />
      </div>
    </div>
  );
}
