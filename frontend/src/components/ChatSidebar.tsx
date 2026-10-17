import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Conversation } from '../types';
import MiniProfileCard from './MiniProfileCard';
import ConversationList from './ConversationList';
import Icon from './Icon';
import { usePeopleLibrary } from '../context/PeopleContext';
import { EMPTY_PEOPLE_FILTERS, type SavedPeopleSearch, type PeopleSearchFilters } from '../people/types';
import { useDirectorySearch } from '../hooks/useDirectorySearch';

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
  const directorySearch = useDirectorySearch();
  const peopleLibrary = usePeopleLibrary();
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    people: directory,
    filterOptions,
    loading: loadingDir,
    loadingFilters: loadingFilterOptions,
    error: directoryError,
    filterError: filterOptionsError,
    retry: retryDirectory,
  } = directorySearch;
  const { recentlyViewed, favorites, savedSearches, storageError } = peopleLibrary;
  const [saveFormOpen, setSaveFormOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [renamingSearchId, setRenamingSearchId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const saveSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = savedSearchName.trim();
    if (!name) return;
    if (peopleLibrary.saveSearch(name, filters)) {
      setSavedSearchName('');
      setSaveFormOpen(false);
    }
  };

  const renameSearch = (event: FormEvent<HTMLFormElement>, saved: SavedPeopleSearch) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) return;
    if (peopleLibrary.renameSearch(saved.id, name)) {
      setRenamingSearchId(null);
      setRenameValue('');
    }
  };

  const removeSavedSearch = (id: string) => {
    peopleLibrary.deleteSearch(id);
  };

  const loadSavedSearch = (saved: SavedPeopleSearch) => {
    setFilters({ ...EMPTY_PEOPLE_FILTERS, ...saved.filters });
    setSearchesOpen(false);
  };

  const [searchesOpen, setSearchesOpen] = useState(false);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
          <ConversationList
            title="Recent"
            emptyMessage="No conversations yet."
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onDelete={onDelete}
          />

          <section className="connect-sidebar__section" aria-labelledby="recently-viewed-title">
            <div className="connect-sidebar__people-head">
              <span className="chat__conversations-label" id="recently-viewed-title">
                Recently viewed
              </span>
              {recentlyViewed.length > 0 && <span className="chip">{recentlyViewed.length}</span>}
            </div>
            {storageError ? (
              <p className="recently-viewed__empty" role="alert">{storageError}</p>
            ) : recentlyViewed.length === 0 ? (
              <p className="recently-viewed__empty">People you open will show up here.</p>
            ) : (
              <div className="connect-sidebar__feed recently-viewed__feed">
                {recentlyViewed.map((person) => (
                  <MiniProfileCard
                    key={person.id}
                    person={person}
                    favorite={favorites.includes(person.id)}
                    onToggleFavorite={() => peopleLibrary.toggleFavorite(person.id)}
                  />
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
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search people…"
                aria-label="Search the directory"
              />
            </div>

            <details className="directory-filters">
              <summary>
                <Icon name="layers" size={14} />
                Filters
                {activeFilterCount > 0 && <span className="chip">{activeFilterCount}</span>}
              </summary>
              <div className="directory-filters__fields">
                {loadingFilterOptions ? (
                  <span className="directory-state">Loading filter options…</span>
                ) : filterOptionsError ? (
                  <span className="directory-state directory-state--error" role="alert">{filterOptionsError}</span>
                ) : filterOptions ? (
                  <>
                    <FilterSelect label="Ministry" value={filters.ministry} options={filterOptions.ministries} onChange={(value) => updateFilter('ministry', value)} />
                    <FilterSelect label="Department" value={filters.department} options={filterOptions.departments} onChange={(value) => updateFilter('department', value)} />
                    <FilterSelect label="Team" value={filters.team} options={filterOptions.teams} onChange={(value) => updateFilter('team', value)} />
                    <FilterSelect label="Location" value={filters.location} options={filterOptions.locations} onChange={(value) => updateFilter('location', value)} />
                    <FilterSelect label="Job title" value={filters.jobTitle} options={filterOptions.jobTitles} onChange={(value) => updateFilter('jobTitle', value)} />
                  </>
                ) : null}
                {activeFilterCount > 0 && (
                  <button type="button" className="directory-filters__clear" onClick={resetFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            </details>

            <div className="saved-searches">
              <button
                type="button"
                className="saved-searches__toggle"
                onClick={() => setSearchesOpen((open) => !open)}
                aria-expanded={searchesOpen}
              >
                <span><Icon name="search" size={14} /> Saved searches</span>
                <span className="chip">{savedSearches.length}</span>
                <Icon name={searchesOpen ? 'chevronRight' : 'chevronRight'} size={13} className={searchesOpen ? 'saved-searches__chevron is-open' : 'saved-searches__chevron'} />
              </button>
              {searchesOpen && (
                <div className="saved-searches__panel">
                  {storageError && <p className="saved-searches__error" role="alert">{storageError}</p>}
                  {savedSearches.length === 0 ? (
                    <p className="saved-searches__empty">No saved searches yet.</p>
                  ) : (
                    <ul className="saved-searches__list">
                      {savedSearches.map((saved) => (
                        <li key={saved.id} className="saved-searches__item">
                          {renamingSearchId === saved.id ? (
                            <form className="saved-searches__rename" onSubmit={(event) => renameSearch(event, saved)}>
                              <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} aria-label="New saved search name" />
                              <button className="saved-searches__action" type="submit" disabled={!renameValue.trim()} aria-label="Save new name"><Icon name="check" size={14} /></button>
                              <button className="saved-searches__action" type="button" onClick={() => setRenamingSearchId(null)} aria-label="Cancel rename"><Icon name="x" size={14} /></button>
                            </form>
                          ) : (
                            <>
                              <button type="button" className="saved-searches__load" onClick={() => loadSavedSearch(saved)} title="Load this search">
                                <span>{saved.name}</span>
                                <small>{describeSearch(saved.filters)}</small>
                              </button>
                              <button type="button" className="saved-searches__action" onClick={() => { setRenamingSearchId(saved.id); setRenameValue(saved.name); }} aria-label={`Rename ${saved.name}`} title="Rename">
                                <Icon name="edit" size={14} />
                              </button>
                              <button type="button" className="saved-searches__action" onClick={() => removeSavedSearch(saved.id)} aria-label={`Delete ${saved.name}`} title="Delete">
                                <Icon name="trash" size={14} />
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {saveFormOpen ? (
              <form className="save-search-form" onSubmit={saveSearch}>
                <label htmlFor="save-search-name">Name this search</label>
                <input id="save-search-name" autoFocus value={savedSearchName} onChange={(event) => setSavedSearchName(event.target.value)} maxLength={50} placeholder="e.g. Toronto designers" />
                <div className="save-search-form__actions">
                  <button type="button" className="btn btn--ghost" onClick={() => { setSaveFormOpen(false); setSavedSearchName(''); }}>Cancel</button>
                  <button type="submit" className="btn btn--primary" disabled={!savedSearchName.trim()}>Save search</button>
                </div>
              </form>
            ) : (
              <button type="button" className="save-search-button" onClick={() => setSaveFormOpen(true)}>
                <Icon name="plus" size={14} /> Save current search
              </button>
            )}

            <div className="connect-sidebar__feed">
              {loadingDir && directory.length === 0 ? (
                <>
                  <span className="directory-state" role="status">Loading people…</span>
                  {Array.from({ length: 4 }).map((_, i) => (
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
                  ))}
                </>
              ) : directoryError ? (
                <div className="directory-state directory-state--error" role="alert">
                  <span>{directoryError}</span>
                  <button type="button" onClick={retryDirectory}>Retry</button>
                </div>
              ) : directory.length === 0 ? (
                <p className="connect-sidebar__empty">No one matches these filters.</p>
              ) : (
                directory.map((person) => (
                  <MiniProfileCard
                    key={person.id}
                    person={person}
                    favorite={favorites.includes(person.id)}
                    onToggleFavorite={() => peopleLibrary.toggleFavorite(person.id)}
                  />
                ))
              )}
              {loadingDir && directory.length > 0 && (
                <span className="directory-state" role="status">Updating results…</span>
              )}
              {directoryError && directory.length > 0 && (
                <div className="directory-state directory-state--error" role="alert">
                  <span>{directoryError}</span>
                  <button type="button" onClick={retryDirectory}>Retry</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="directory-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Any</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function describeSearch(filters: PeopleSearchFilters): string {
  const terms = [
    filters.search,
    filters.ministry,
    filters.department,
    filters.team,
    filters.location,
    filters.jobTitle,
  ].filter(Boolean);
  return terms.length ? terms.join(' · ') : 'Everyone';
}
