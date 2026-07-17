import type { ConnectPerson, Conversation, ProximitySummary } from '../types';
import { Link } from 'react-router-dom';
import AvailabilityCard from './AvailabilityCard';
import ConnectCard from './ConnectCard';
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
  onAvailabilityChange,
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
  onAvailabilityChange: () => void;
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
          {/* Saved concierge chats */}
          <section className="connect-sidebar__section">
            <div className="chat__conversations-label">Recent chats</div>
            {conversations.length === 0 ? (
              <p className="connect-sidebar__empty">No saved chats yet.</p>
            ) : (
              <div className="connect-sidebar__convos">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`conversation-item ${activeId === c.id ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="conversation-item__select"
                      onClick={() => onSelect(c.id)}
                      aria-current={activeId === c.id ? 'true' : undefined}
                    >
                      <span className="conversation-item__icon">
                        <Icon name="chat" size={16} />
                      </span>
                      <span className="conversation-item__title">{c.title}</span>
                    </button>
                    <button
                      type="button"
                      className="conversation-item__delete"
                      onClick={() => onDelete(c.id)}
                      aria-label={`Delete conversation: ${c.title}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

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
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
