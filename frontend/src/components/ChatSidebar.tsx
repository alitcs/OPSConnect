import type { Conversation } from '../types';
import Icon from './Icon';

export default function ChatSidebar({
  conversations,
  activeId,
  open,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="chat__mobile-overlay" onClick={onClose} />}
      <aside className={`chat__sidebar ${open ? 'open' : ''}`}>
        <div className="chat__sidebar-header">
          <button className="btn btn--primary btn--block" onClick={onNew}>
            <Icon name="plus" size={17} />
            New Chat
          </button>
        </div>
        <div className="chat__conversations">
          <div className="chat__conversations-label">Recent</div>
          {conversations.length === 0 && (
            <p className="muted" style={{ padding: '4px 11px', fontSize: 13 }}>
              No conversations yet.
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conversation-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="conversation-item__icon">
                <Icon name="chat" size={16} />
              </span>
              <span className="conversation-item__title">{c.title}</span>
              <span
                className="conversation-item__delete"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                aria-label="Delete conversation"
              >
                <Icon name="trash" size={15} />
              </span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
