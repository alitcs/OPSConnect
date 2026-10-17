import type { ConnectPerson, Conversation, ProximitySummary } from '../types';
import { Link } from 'react-router-dom';
import AvailabilityCard from './AvailabilityCard';
import ConnectCard from './ConnectCard';
import ConversationList from './ConversationList';
import Icon from './Icon';

// The Connect board's side panel. Combines three things the way the user reads the room:
// their saved concierge chats, their own "open to connect" status, and the live list of
// people who are open to connect today. The concierge itself is the main event; this panel
// is the context around it.
export default function ConnectSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
  feed,
  proximity,
  loadingFeed,
  feedError,
  onAvailabilityChange,
  onRetryFeed,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
  feed: ConnectPerson[];
  proximity: ProximitySummary | null;
  loadingFeed: boolean;
  feedError: string;
  onAvailabilityChange: () => void;
  onRetryFeed: () => void;
}) {
  return (
    <>
      {open && <div className="chat__mobile-overlay" onClick={onClose} />}
      <aside className={`chat__sidebar connect-sidebar ${open ? 'open' : ''}`}>
        <div className="chat__sidebar-header">
          <button className="btn btn--primary btn--block" onClick={onNew}>
            <Icon name="plus" size={17} />
            New chat
          </button>
        </div>

        <div className="connect-sidebar__scroll">
          <ConversationList
            title="Recent chats"
            emptyMessage="No saved chats yet."
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onDelete={onDelete}
          />

          {/* Your own "open to connect" status */}
          <section className="connect-sidebar__section">
            <div className="chat__conversations-label">Your status</div>
            <AvailabilityCard onChange={onAvailabilityChange} />
          </section>

          {/* Live list of people open to connect today */}
          <section className="connect-sidebar__section">
            <div className="connect-sidebar__people-head">
              <span className="chat__conversations-label">Open to connect</span>
              {!loadingFeed && <span className="chip">{feed.length}</span>}
            </div>

            {proximity && proximity.shareEnabled && proximity.count > 0 && (
              <div className="prox-summary prox-summary--compact">
                <Icon name="pin" size={14} />
                <span>
                  <strong>{proximity.count}</strong>{' '}
                  {proximity.count === 1 ? 'person' : 'people'} near you on Floor {proximity.floor}.
                </span>
              </div>
            )}
            {proximity && !proximity.shareEnabled && (
              <div className="prox-summary prox-summary--compact prox-summary--muted">
                <Icon name="pin" size={14} />
                <span>
                  Turn on <Link to="/settings">location sharing</Link> to see who's nearby.
                </span>
              </div>
            )}

            <div className="connect-sidebar__feed">
              {loadingFeed ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div className="skeleton-card" key={i} aria-hidden="true">
                    <div
                      className="skeleton"
                      style={{ width: 40, height: 40, borderRadius: '50%' }}
                    />
                    <div className="skeleton-card__lines">
                      <div className="skeleton" style={{ height: 11, width: '40%' }} />
                      <div className="skeleton" style={{ height: 9, width: '65%' }} />
                    </div>
                  </div>
                ))
              ) : feedError && feed.length === 0 ? (
                <div className="directory-state directory-state--error" role="alert">
                  <span>{feedError}</span>
                  <button type="button" onClick={onRetryFeed}>Retry</button>
                </div>
              ) : feed.length === 0 ? (
                <div className="connect-empty connect-empty--compact">
                  <span className="connect-empty__icon">
                    <Icon name="coffee" size={22} />
                  </span>
                  <p>No one's on the board yet today.</p>
                  <p className="muted">Set yourself open to connect above.</p>
                </div>
              ) : (
                feed.map((p) => <ConnectCard key={p.user.id} person={p} />)
              )}
              {feedError && feed.length > 0 && (
                <div className="directory-state directory-state--error" role="alert">
                  <span>{feedError} Showing the last available results.</span>
                  <button type="button" onClick={onRetryFeed}>Retry</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
