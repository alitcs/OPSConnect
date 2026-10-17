import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import MiniProfileCard from '../components/MiniProfileCard';
import Icon from '../components/Icon';
import { useDirectorySearch } from '../hooks/useDirectorySearch';
import { usePeopleLibrary } from '../context/PeopleContext';
import { EMPTY_PEOPLE_FILTERS, type SavedPeopleSearch } from '../people/types';

type ResultsView = 'all' | 'favorites';

export default function PeoplePage() {
  const finder = useDirectorySearch();
  const { setFilters } = finder;
  const library = usePeopleLibrary();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ResultsView>('all');
  const [searchesOpen, setSearchesOpen] = useState(true);
  const [saveFormOpen, setSaveFormOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const people = view === 'favorites'
    ? finder.people.filter((person) => library.favorites.includes(person.id))
    : finder.people;
  const activeFilters = Object.values(finder.filters).filter(Boolean).length;

  useEffect(() => {
    const searchId = searchParams.get('searchId');
    if (!searchId) return;
    const saved = library.savedSearches.find((item) => item.id === searchId);
    if (saved) setFilters({ ...EMPTY_PEOPLE_FILTERS, ...saved.filters });
    setSearchParams({}, { replace: true });
  }, [library.savedSearches, searchParams, setFilters, setSearchParams]);

  const saveSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!library.saveSearch(searchName, finder.filters)) return;
    setSearchName('');
    setSaveFormOpen(false);
  };

  const renameSearch = (event: FormEvent<HTMLFormElement>, search: SavedPeopleSearch) => {
    event.preventDefault();
    if (!library.renameSearch(search.id, renameValue)) return;
    setRenamingId(null);
    setRenameValue('');
  };

  const loadSearch = (search: SavedPeopleSearch) => {
    finder.setFilters({ ...EMPTY_PEOPLE_FILTERS, ...search.filters });
    setView('all');
  };

  return (
    <div className="page people-page">
      <div className="people-page__inner">
        <header className="people-header">
          <div>
            <span className="knowledge-eyebrow">CONNECTOPS / PEOPLE DIRECTORY</span>
            <h1>People</h1>
            <p>Find colleagues by role, team, ministry, location, or the work they do.</p>
          </div>
          <span className="people-header__count">{finder.loading ? 'Searching…' : `${finder.people.length} people`}</span>
        </header>

        {library.storageError && <div className="knowledge-alert" role="alert"><Icon name="info" size={16} /> {library.storageError}</div>}

        {library.recentlyViewed.length > 0 && (
          <section className="people-recent" aria-labelledby="people-recent-title">
            <div className="people-section-heading">
              <div><span className="knowledge-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2 id="people-recent-title">Recently viewed</h2></div>
            </div>
            <div className="people-recent__list">
              {library.recentlyViewed.map((person) => (
                <MiniProfileCard
                  key={person.id}
                  person={person}
                  favorite={library.favorites.includes(person.id)}
                  onToggleFavorite={() => library.toggleFavorite(person.id)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="people-workspace">
          <aside className="people-tools" aria-label="People search tools">
            <div className="people-tools__heading">
              <h2>Find someone</h2>
              <span className="chip">{activeFilters} filters</span>
            </div>
            <label className="people-search">
              <Icon name="search" size={16} />
              <input
                type="search"
                value={finder.filters.search}
                onChange={(event) => finder.updateFilter('search', event.target.value)}
                placeholder="Name, role, or team"
                aria-label="Search people"
              />
            </label>
            <div className="people-filter-list">
              {finder.loadingFilters ? (
                <span className="directory-state" role="status">Loading filter options…</span>
              ) : finder.filterError ? (
                <span className="directory-state directory-state--error" role="alert">{finder.filterError}</span>
              ) : finder.filterOptions ? (
                <>
                  <FilterSelect label="Ministry" value={finder.filters.ministry} options={finder.filterOptions.ministries} onChange={(value) => finder.updateFilter('ministry', value)} />
                  <FilterSelect label="Department" value={finder.filters.department} options={finder.filterOptions.departments} onChange={(value) => finder.updateFilter('department', value)} />
                  <FilterSelect label="Team" value={finder.filters.team} options={finder.filterOptions.teams} onChange={(value) => finder.updateFilter('team', value)} />
                  <FilterSelect label="Location" value={finder.filters.location} options={finder.filterOptions.locations} onChange={(value) => finder.updateFilter('location', value)} />
                  <FilterSelect label="Job title" value={finder.filters.jobTitle} options={finder.filterOptions.jobTitles} onChange={(value) => finder.updateFilter('jobTitle', value)} />
                </>
              ) : null}
              {activeFilters > 0 && <button type="button" className="people-clear" onClick={finder.resetFilters}>Clear all filters</button>}
            </div>

            <section className="people-saved" aria-labelledby="people-saved-title">
              <button type="button" className="people-saved__heading" aria-expanded={searchesOpen} onClick={() => setSearchesOpen((open) => !open)}>
                <span id="people-saved-title">Saved searches</span>
                <span className="chip">{library.savedSearches.length}</span>
                <Icon name="chevronRight" size={14} className={searchesOpen ? 'is-open' : ''} />
              </button>
              {searchesOpen && (library.savedSearches.length === 0 ? (
                <p className="people-saved__empty">Save a set of filters to return to it later.</p>
              ) : (
                <ul className="people-saved__list">
                  {library.savedSearches.map((saved) => (
                    <li key={saved.id}>
                      {renamingId === saved.id ? (
                        <form className="people-saved__rename" onSubmit={(event) => renameSearch(event, saved)}>
                          <input autoFocus aria-label="New saved search name" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                          <button type="submit" aria-label="Save new name" disabled={!renameValue.trim()}><Icon name="check" size={14} /></button>
                          <button type="button" aria-label="Cancel rename" onClick={() => setRenamingId(null)}><Icon name="x" size={14} /></button>
                        </form>
                      ) : (
                        <>
                          <button type="button" className="people-saved__load" onClick={() => loadSearch(saved)}>
                            <strong>{saved.name}</strong>
                            <span>{describeFilters(saved.filters)}</span>
                          </button>
                          <button type="button" className="people-saved__action" aria-label={`Rename ${saved.name}`} onClick={() => { setRenamingId(saved.id); setRenameValue(saved.name); }}><Icon name="edit" size={14} /></button>
                          <button type="button" className="people-saved__action" aria-label={`Delete ${saved.name}`} onClick={() => library.deleteSearch(saved.id)}><Icon name="trash" size={14} /></button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
            </section>

            {saveFormOpen ? (
              <form className="people-save-form" onSubmit={saveSearch}>
                <label htmlFor="people-save-name">Name this search</label>
                <input id="people-save-name" autoFocus maxLength={50} value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="e.g. Toronto designers" />
                <div><button type="button" className="btn btn--ghost" onClick={() => setSaveFormOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={!searchName.trim()}>Save</button></div>
              </form>
            ) : (
              <button type="button" className="people-save-button" onClick={() => setSaveFormOpen(true)}><Icon name="plus" size={14} /> Save current search</button>
            )}
          </aside>

          <section className="people-results" aria-labelledby="people-results-title">
            <div className="people-results__heading">
              <div><span className="knowledge-eyebrow">DIRECTORY</span><h2 id="people-results-title">Colleagues</h2></div>
              <div className="people-view-tabs" role="group" aria-label="People results">
                <button type="button" aria-pressed={view === 'all'} className={view === 'all' ? 'is-active' : ''} onClick={() => setView('all')}>All <span>{finder.people.length}</span></button>
                <button type="button" aria-pressed={view === 'favorites'} className={view === 'favorites' ? 'is-active' : ''} onClick={() => setView('favorites')}><Icon name="star" size={13} /> Favorites <span>{finder.people.filter((person) => library.favorites.includes(person.id)).length}</span></button>
              </div>
            </div>
            <div className="people-results__list" aria-live="polite" aria-busy={finder.loading}>
              {finder.loading && finder.people.length === 0 ? (
                <div className="people-loading" role="status">Searching the OPS directory…</div>
              ) : finder.error ? (
                <div className="knowledge-state knowledge-state--error" role="alert"><p>{finder.error}</p><button type="button" className="btn" onClick={finder.retry}>Try again</button></div>
              ) : people.length === 0 ? (
                <div className="knowledge-state"><span className="knowledge-state__icon"><Icon name={view === 'favorites' ? 'star' : 'search'} size={20} /></span><h3>{view === 'favorites' ? 'No matching favorites' : 'No colleagues found'}</h3><p>{view === 'favorites' ? 'Favorite colleagues to keep them close at hand.' : 'Try a different name or broaden your filters.'}</p></div>
              ) : (
                <>
                  {finder.loading && <span className="directory-state" role="status">Updating results…</span>}
                  {people.map((person) => (
                    <MiniProfileCard
                      key={person.id}
                      person={person}
                      favorite={library.favorites.includes(person.id)}
                      onToggleFavorite={() => library.toggleFavorite(person.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="people-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Any</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function describeFilters(filters: SavedPeopleSearch['filters']): string {
  const values = [filters.search, filters.ministry, filters.department, filters.team, filters.location, filters.jobTitle].filter(Boolean);
  return values.length ? values.join(' · ') : 'Everyone';
}