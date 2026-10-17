import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Icon, { type IconName } from '../components/Icon';
import { useConversationWorkspace } from '../hooks/useConversationWorkspace';

const CHAT_OPERATIONS = {
  list: api.listConversations,
  get: api.getConversation,
  send: api.sendChat,
  remove: api.deleteConversation,
  loadError: 'Could not load your recent chats.',
  openError: 'Could not open that conversation. Please try again.',
  deleteError: 'Could not delete that conversation.',
  sendError: 'Copilot could not respond just now. Please try again.',
};

const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  { text: "I'm starting a project that needs Python, data visualization, and Azure — who can help?", icon: 'sparkle', tag: 'Managers' },
  { text: 'Who could work on HDP-482, the health analytics dashboard?', icon: 'layers', tag: 'Projects' },
  { text: 'What projects are due soon or blocked across the OPS?', icon: 'ticket', tag: 'Projects' },
  { text: 'How is the OPS structured?', icon: 'directory', tag: 'Explore' },
  { text: 'Who works in the Ministry of Health?', icon: 'pin', tag: 'Explore' },
  { text: "I'm a new co-op — who should I meet on my team?", icon: 'coffee', tag: 'Co-ops' },
  { text: 'Who has a security certification?', icon: 'shield', tag: 'Explore' },
  { text: 'Who shares my interests?', icon: 'messages', tag: 'Co-ops' },
];

export default function ChatPage() {
  const workspace = useConversationWorkspace(CHAT_OPERATIONS);
  const threadRef = useRef<HTMLDivElement>(null);
  const followRaf = useRef<number | null>(null);
  const followActive = useRef(false);

  useEffect(() => {
    if (followActive.current) return;
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [workspace.messages, workspace.sending]);

  useEffect(() => () => {
    if (followRaf.current !== null) cancelAnimationFrame(followRaf.current);
  }, []);

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
      if (t < 1) followRaf.current = requestAnimationFrame(step);
      else {
        followRaf.current = null;
        followActive.current = false;
      }
    };
    followRaf.current = requestAnimationFrame(step);
  };

  const send = (text: string) => {
    if (followRaf.current !== null) cancelAnimationFrame(followRaf.current);
    followActive.current = false;
    void workspace.sendMessage(text, (message) => {
      const peopleCount = message.people?.length ?? 0;
      if (peopleCount > 1) {
        followActive.current = true;
        requestAnimationFrame(() => followScroll(peopleCount));
      }
    });
  };

  return (
    <div className="chat">
      <ChatSidebar
        conversations={workspace.conversations}
        activeId={workspace.activeId}
        open={workspace.sidebarOpen}
        onSelect={workspace.selectConversation}
        onNew={workspace.newChat}
        onDelete={workspace.deleteConversation}
        onClose={() => workspace.setSidebarOpen(false)}
      />

      <div className="chat__main">
        <button type="button" className="chat__mobile-toggle" onClick={() => workspace.setSidebarOpen(true)}>
          <Icon name="menu" size={16} />
          Chats &amp; people
        </button>

        <div
          className="chat__thread"
          ref={threadRef}
          role="log"
          aria-live="polite"
          aria-busy={workspace.sending || !!workspace.streamingId}
          aria-label="Conversation with Copilot"
        >
          {workspace.loadingThread ? (
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
          ) : workspace.messages.length === 0 ? (
            <div className="chat__empty">
              <div className="chat__empty-inner">
                <div className="chat__empty-mark"><Icon name="sparkle" size={24} /></div>
                <h2>What do you need?</h2>
                <p>Ask who can help, or describe a project.</p>
                <div className="prompt-grid">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion.text} type="button" className="prompt-card" onClick={() => send(suggestion.text)}>
                      <span className="prompt-card__icon"><Icon name={suggestion.icon} size={16} /></span>
                      <span className="prompt-card__body">
                        <span className="prompt-card__text">{suggestion.text}</span>
                        <span className="prompt-card__tag">{suggestion.tag}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="chat__empty-footer">
                  <span className="copilot-badge__icon"><Icon name="sparkle" size={13} /></span>
                  Microsoft Copilot · OPS directory
                </div>
              </div>
            </div>
          ) : (
            <div className="chat__thread-inner">
              {workspace.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === workspace.streamingId}
                  onFollowUp={send}
                />
              ))}
              {workspace.sending && (
                <div className="message-row message-row--assistant">
                  <div className="message-avatar" aria-hidden="true"><Icon name="sparkle" size={15} /></div>
                  <div className="message-col" data-align="start">
                    <div className="message-bubble message-bubble--status">
                      <span className="typing" role="status" aria-label="Copilot is searching the OPS directory"><span /><span /><span /></span>
                      <span className="message-status-text">Searching the OPS directory…</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ChatInput onSend={send} disabled={workspace.sending || !!workspace.streamingId} />
      </div>
    </div>
  );
}