import { useEffect, useRef, useState } from 'react';
import type { ChatMessage as ChatMessageType, Conversation } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
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

export default function ChatPage() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

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
    const { messages: msgs } = await api.getConversation(id);
    setMessages(msgs);
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    await api.deleteConversation(id);
    if (activeId === id) newChat();
    loadConversations();
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

        <div className="chat__thread" ref={threadRef}>
          {messages.length === 0 ? (
            <div className="chat__empty">
              <div className="chat__empty-mark">
                <Icon name="chat" size={26} />
              </div>
              <h2>How can I help you connect?</h2>
              <p>Ask me about people, teams, or skills across the OPS.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
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
                    <span className="typing">
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
