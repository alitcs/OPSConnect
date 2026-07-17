import { useEffect, useState } from 'react';
import type { Conversation, UserSummary } from '../types';
import { api } from '../api/client';
import MiniProfileCard from './MiniProfileCard';
import Icon from './Icon';

// The home Copilot's side panel — mirrors the Connect board's panel. Under the member's
// recent chats sits a live directory of everyone across the OPS, searchable inline, so the
// old standalone Directory page folds into the same LLM-first layout.
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
  const [search, setSearch] = useState('');
  const [directory, setDirectory] = useState<UserSummary[]>([]);
  const [loadingDir, setLoadingDir] = useState(true);

  // Debounce so typing in the search box doesn't spam the directory query.
  useEffect(() => {
    setLoadingDir(true);
    const handle = setTimeout(() => {
      const params: Record<string, string> = search.trim() ? { search: search.trim() } : {};
      api
        .getDirectory(params)
        .then(setDirectory)
        .finally(() => setLoadingDir(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <>
      {open && <div className="chat__mobile-overlay" onClick={onClose} />}
      <aside className={`chat__sidebar connect-sidebar ${open ? 'open' : ''}`}>
        <div className="chat__sidebar-header">
          <button className="btn btn--primary btn--block" onClick={onNew}>
            <Icon name="plus" size={17} />
            New Chat
          </button>
        </div>

        <div className="connect-sidebar__scroll">
          {/* Saved chats */}
          <section className="connect-sidebar__section">
            <div className="chat__conversations-label">Recent</div>
            {conversations.length === 0 ? (
              <p className="connect-sidebar__empty">No conversations yet.</p>
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

          {/* Directory of everyone across the OPS */}
          <section className="connect-sidebar__section">
            <div className="connect-sidebar__people-head">
              <span className="chat__conversations-label">Directory</span>
              {!loadingDir && <span className="chip">{directory.length}</span>}
            </div>

            <div className="search-field sidebar-search">
              <span className="search-field__icon">
                <Icon name="search" size={14} />
              </span>
              <input
                className="directory__search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                aria-label="Search the directory"
              />
            </div>

            <div className="connect-sidebar__feed">
              {loadingDir && directory.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div className="skeleton-card" key={i} aria-hidden="true">
                    <div
                      className="skeleton"
                      style={{ width: 36, height: 36, borderRadius: '50%' }}
                    />
                    <div className="skeleton-card__lines">
                      <div className="skeleton" style={{ height: 11, width: '45%' }} />
                      <div className="skeleton" style={{ height: 9, width: '65%' }} />
                    </div>
                  </div>
                ))
              ) : directory.length === 0 ? (
                <p className="connect-sidebar__empty">No one matches your search.</p>
              ) : (
                directory.map((u) => <MiniProfileCard key={u.id} person={u} />)
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
