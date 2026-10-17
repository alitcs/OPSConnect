import type { Conversation } from '../types';
import Icon from './Icon';

export default function ConversationList({
  title,
  emptyMessage,
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  title: string;
  emptyMessage: string;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="connect-sidebar__section" aria-label={title}>
      <div className="chat__conversations-label">{title}</div>
      {conversations.length === 0 ? (
        <p className="connect-sidebar__empty">{emptyMessage}</p>
      ) : (
        <div className="connect-sidebar__convos">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${activeId === conversation.id ? 'active' : ''}`}
            >
              <button
                type="button"
                className="conversation-item__select"
                onClick={() => onSelect(conversation.id)}
                aria-current={activeId === conversation.id ? 'true' : undefined}
              >
                <span className="conversation-item__icon">
                  <Icon name="chat" size={16} />
                </span>
                <span className="conversation-item__title">{conversation.title}</span>
              </button>
              <button
                type="button"
                className="conversation-item__delete"
                onClick={() => onDelete(conversation.id)}
                aria-label={`Delete conversation: ${conversation.title}`}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}