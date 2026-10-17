import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { KnowledgeArticle, UserSummary } from '../types';
import { api } from '../api/client';
import { usePreviewCard } from '../context/PreviewCardContext';
import { knowledgeArticles } from '../data/knowledgeArticles';
import { filterKnowledgeArticles } from '../knowledge/catalog';
import Avatar from './Avatar';
import Icon from './Icon';

type SearchKind = 'all' | 'people' | 'knowledge';
type SearchResult =
  | { kind: 'person'; key: string; person: UserSummary }
  | { kind: 'article'; key: string; article: KnowledgeArticle };

export function GlobalSearchTrigger({
  onOpen,
  className = '',
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className || 'global-search-trigger'}
      onClick={onOpen}
      aria-label="Search people and knowledge"
      title="Search people and knowledge (Ctrl+K)"
    >
      <Icon name="search" size={18} />
      <span className="sidebar__link-label">Search</span>
    </button>
  );
}

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind>('all');
  const [people, setPeople] = useState<UserSummary[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [peopleError, setPeopleError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { openPreview } = usePreviewCard();

  const close = useCallback(() => {
    onClose();
    setQuery('');
    setActiveIndex(0);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [close, open]);

  useEffect(() => {
    const term = query.trim();
    setActiveIndex(0);
    if (!open || term.length < 2) {
      setPeople([]);
      setArticles([]);
      setPeopleError(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setPeopleError(false);
    setArticles(filterKnowledgeArticles(knowledgeArticles, term, ''));
    const timer = window.setTimeout(() => {
      api.getDirectory({ search: term })
        .then((result) => { if (active) setPeople(result.slice(0, 8)); })
        .catch(() => { if (active) setPeopleError(true); })
        .finally(() => { if (active) setLoading(false); });
    }, 160);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const results = useMemo<SearchResult[]>(() => {
    const peopleResults: SearchResult[] = kind === 'knowledge'
      ? []
      : people.map((person) => ({ kind: 'person', key: `person-${person.id}`, person }));
    const articleResults: SearchResult[] = kind === 'people'
      ? []
      : articles.slice(0, 8).map((article) => ({ kind: 'article', key: `article-${article.id}`, article }));
    return [...peopleResults, ...articleResults];
  }, [articles, kind, people]);

  const activate = (result: SearchResult) => {
    if (result.kind === 'person') openPreview(result.person.id);
    else navigate(`/knowledge/${result.article.id}`);
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index + 1) % results.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index - 1 + results.length) % results.length : 0);
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      activate(results[activeIndex]);
    }
  };

  if (!open) return null;

  return (
        <div className="global-search-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section ref={dialogRef} className="global-search" role="dialog" aria-modal="true" aria-labelledby="global-search-title" tabIndex={-1}>
            <h2 id="global-search-title" className="sr-only">Search ConnectOPS</h2>
            <div className="global-search__input-row">
              <Icon name="search" size={19} />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-label="Search people and knowledge"
                aria-expanded="true"
                aria-controls="global-search-results"
                aria-activedescendant={results[activeIndex] ? `global-result-${results[activeIndex].key}` : undefined}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search people, teams, skills, articles…"
              />
              <kbd>ESC</kbd>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close search"><Icon name="x" size={17} /></button>
            </div>
            <div className="global-search__filters" role="group" aria-label="Search category">
              {([['all', 'All'], ['people', 'People'], ['knowledge', 'Knowledge']] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={kind === value} className={kind === value ? 'is-active' : ''} onClick={() => setKind(value)}>{label}</button>
              ))}
              {loading && <span role="status">Searching…</span>}
            </div>
            <div className="global-search__results" id="global-search-results" role="listbox" aria-label="Search results">
              {peopleError && kind !== 'knowledge' && <p className="global-search__error" role="alert">People results are unavailable right now.</p>}
              {query.trim().length < 2 ? (
                <p className="global-search__empty">Type at least two characters to search.</p>
              ) : results.length === 0 && !loading ? (
                <p className="global-search__empty">No matching people or articles.</p>
              ) : results.map((result, index) => (
                <button
                  key={result.key}
                  id={`global-result-${result.key}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`global-search__result ${index === activeIndex ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => activate(result)}
                >
                  {result.kind === 'person' ? (
                    <>
                      <Avatar name={result.person.name} size={34} status={result.person.status} />
                      <span className="global-search__result-copy"><strong>{result.person.name}</strong><small>{result.person.title} · {result.person.team}</small></span>
                      <span className="global-search__result-type">Person</span>
                    </>
                  ) : (
                    <>
                      <span className="global-search__article-icon"><Icon name="bookOpen" size={16} /></span>
                      <span className="global-search__result-copy"><strong>{result.article.title}</strong><small>{result.article.summary}</small></span>
                      <span className="global-search__result-type">{result.article.category}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            <footer className="global-search__footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Ctrl</kbd><kbd>K</kbd> search</span></footer>
          </section>
        </div>
  );
}