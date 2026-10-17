import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ConnectSidebar from '../components/ConnectSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Avatar from '../components/Avatar';
import Icon, { type IconName } from '../components/Icon';
import { useConversationWorkspace } from '../hooks/useConversationWorkspace';
import type { ConnectPerson, ProximitySummary } from '../types';

const CONNECT_OPERATIONS = {
  list: api.listConnectConversations,
  get: api.getConnectConversation,
  send: api.sendConnectChat,
  remove: api.deleteConnectConversation,
  loadError: 'Could not load your recent concierge chats.',
  openError: 'Could not open that conversation. Please try again.',
  deleteError: 'Could not delete that conversation.',
  sendError: 'The concierge could not respond just now. Please try again.',
};

const SUGGESTIONS: { text: string; icon: IconName; tag: string }[] = [
  { text: 'Who should I meet?', icon: 'directory', tag: 'Suggestions' },
  { text: "Who's open to connect today?", icon: 'coffee', tag: 'Today' },
  { text: 'Who shares my interests?', icon: 'star', tag: 'Common ground' },
  { text: 'Draft an intro for me', icon: 'chat', tag: 'Break the ice' },
  { text: "Who's new to the OPS?", icon: 'flag', tag: 'Welcome' },
  { text: 'Who works near me today?', icon: 'pin', tag: 'Nearby' },
];

export default function ConnectPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const workspace = useConversationWorkspace(CONNECT_OPERATIONS);
  const [feed, setFeed] = useState<ConnectPerson[]>([]);
  const [proximity, setProximity] = useState<ProximitySummary | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  const loadBoard = useCallback(() => {
    setLoadingFeed(true);
    setFeedError('');
    Promise.all([api.getConnectFeed(), api.getProximity()])
      .then(([nextFeed, nextProximity]) => {
        setFeed(nextFeed);
        setProximity(nextProximity);
      })
      .catch(() => setFeedError('Could not load the Connect board.'))
      .finally(() => setLoadingFeed(false));
  }, []);

  useEffect(() => loadBoard(), [loadBoard, currentUser?.id]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [workspace.messages, workspace.sending]);

  const send = (text: string) => {
    void workspace.sendMessage(text);
  };

  return (
    <div className="chat connect-chat">
      <ConnectSidebar
        conversations={workspace.conversations}
        activeId={workspace.activeId}
        onSelect={workspace.selectConversation}
        onNew={workspace.newChat}
        onDelete={workspace.deleteConversation}
        open={workspace.sidebarOpen}
        onClose={() => workspace.setSidebarOpen(false)}
        feed={feed}
        proximity={proximity}
        loadingFeed={loadingFeed}
        feedError={feedError}
        onAvailabilityChange={loadBoard}
        onRetryFeed={loadBoard}
      />

      <div className="chat__main">
        <div className="connect-topbar">
          <button type="button" className="chat__mobile-toggle connect-topbar__toggle" onClick={() => workspace.setSidebarOpen(true)}>
            <Icon name="menu" size={16} />
            Status &amp; people
          </button>
          <span className="connect-topbar__brand">
            <span className="connect-topbar__mark"><Icon name="sparkle" size={15} /></span>
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
          aria-busy={workspace.sending || !!workspace.streamingId}
          aria-label="Conversation with the connection concierge"
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
                <h2>Let&apos;s find you someone to connect with</h2>
                <p>Ask who to meet, who&apos;s around today, or to draft a friendly intro.</p>
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
                  Low-pressure suggestions · no pings, no manager visibility
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
                      <span className="typing" role="status" aria-label="The concierge is finding people to connect with"><span /><span /><span /></span>
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
          disabled={workspace.sending || !!workspace.streamingId}
          placeholder="Ask who to meet, who&apos;s around today, or “draft an intro to…”"
          ariaLabel="Ask the connection concierge who to meet"
          hint="Copilot · warm, low-pressure suggestions to help you connect"
        />
      </div>
    </div>
  );
}