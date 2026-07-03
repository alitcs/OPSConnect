import { useEffect, useRef, useState } from 'react';
import type { ChatMessage as ChatMessageType, Conversation } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Icon from '../components/Icon';

const SUGGESTIONS = [
  'Who has Python and data visualization experience?',
  'Who works in cybersecurity?',
  'I want DevOps experience — who can I shadow?',
  'Who should I talk to about accessibility standards?',
  'What teams work on data analytics?',
];

const WELCOME_KEY = 'connectops.welcomeDismissed';

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(WELCOME_KEY) !== '1',
  );
  const threadRef = useRef<HTMLDivElement>(null);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem(WELCOME_KEY, '1');
  };

  const loadConversations = () =>
    api.listConversations().then(setConversations).catch(() => setConversations([]));

  useEffect(() => {
    loadConversations();
  }, [currentUser?.id]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, sending]);

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

  const send = async (text: string) => {
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
      setMessages((m) => [...m, res.message]);
    } catch {
      notify('Copilot could not respond just now. Please try again.', 'error');
    } finally {
      setSending(false);
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
              {showWelcome && (
                <div className="welcome-callout">
                  <span className="welcome-callout__mark">
                    <Icon name="sparkle" size={18} />
                  </span>
                  <div>
                    <div className="welcome-callout__title">Welcome to ConnectOPS</div>
                    <div className="welcome-callout__text">
                      Ask in plain language to find the right people, skills, teams, and
                      mentors across the Ontario Public Service — then message them on Teams
                      or book time, all in one place. Answers are grounded in the OPS
                      directory, so you skip the email chains.
                    </div>
                  </div>
                  <button
                    className="welcome-callout__close"
                    onClick={dismissWelcome}
                    aria-label="Dismiss welcome message"
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              )}
              <div className="chat__empty-mark">
                <Icon name="sparkle" size={26} />
              </div>
              <h2>What can Copilot help you find?</h2>
              <p>Find people, skills, teams, and mentors across the OPS.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="message-meta" style={{ marginTop: 22, justifyContent: 'center' }}>
                <span className="message-meta__source">
                  <span className="copilot-badge__icon">
                    <Icon name="sparkle" size={13} />
                  </span>
                  Powered by Microsoft Copilot · grounded in the OPS directory
                </span>
              </div>
            </div>
          ) : (
            <div className="chat__thread-inner">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {sending && (
                <div className="message-row message-row--assistant">
                  <div className="message-bubble">
                    <span className="typing" role="status" aria-label="Copilot is typing">
                      <span />
                      <span />
                      <span />
                    </span>
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
