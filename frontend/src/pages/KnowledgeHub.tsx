import { useEffect, useMemo, useState } from 'react';
import KnowledgeArticleCard from '../components/KnowledgeArticleCard';
import Icon from '../components/Icon';
import { useKnowledgeLibrary } from '../context/KnowledgeLibraryContext';
import { filterKnowledgeArticles, getKnowledgeCategories, loadKnowledgeArticles } from '../knowledge/catalog';
import type { KnowledgeArticle } from '../types';

type LibraryView = 'all' | 'bookmarks';

export default function KnowledgeHubPage() {
  const library = useKnowledgeLibrary();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<LibraryView>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadKnowledgeArticles()
      .then((items) => {
        if (active) setArticles(items);
      })
      .catch(() => {
        if (active) setError('Articles could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const categories = useMemo(() => getKnowledgeCategories(articles), [articles]);
  const bookmarkedArticles = useMemo(
    () => library.bookmarks.map((id) => articles.find((article) => article.id === id)).filter((article): article is KnowledgeArticle => !!article),
    [articles, library.bookmarks],
  );
  const recentlyViewedArticles = useMemo(
    () => library.recentlyViewed.map((id) => articles.find((article) => article.id === id)).filter((article): article is KnowledgeArticle => !!article),
    [articles, library.recentlyViewed],
  );
  const source = view === 'bookmarks' ? bookmarkedArticles : articles;
  const results = filterKnowledgeArticles(source, query, category);

  return (
    <div className="page knowledge-page">
      <div className="knowledge-page__inner">
        <header className="knowledge-header">
          <div>
            <span className="knowledge-eyebrow">CONNECTOPS / SHARED KNOW-HOW</span>
            <h1>Knowledge Hub</h1>
            <p>Practical guides, lessons, and ideas from across the Ontario Public Service.</p>
          </div>
          <div className="knowledge-header__mark" aria-hidden="true">
            <Icon name="bookOpen" size={28} />
          </div>
        </header>

        {library.storageError && (
          <div className="knowledge-alert" role="alert">
            <Icon name="info" size={16} /> {library.storageError}
          </div>
        )}

        {recentlyViewedArticles.length > 0 && (
          <section className="knowledge-recent" aria-labelledby="knowledge-recent-title">
            <div className="knowledge-section-heading">
              <div>
                <span className="knowledge-eyebrow">PICK UP WHERE YOU LEFT OFF</span>
                <h2 id="knowledge-recent-title">Recently viewed</h2>
              </div>
            </div>
            <div className="knowledge-recent__list">
              {recentlyViewedArticles.map((article) => (
                <KnowledgeArticleCard
                  key={article.id}
                  article={article}
                  bookmarked={library.bookmarks.includes(article.id)}
                  onToggleBookmark={() => library.toggleBookmark(article.id)}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        <section className="knowledge-library" aria-labelledby="knowledge-library-title">
          <div className="knowledge-section-heading knowledge-library__heading">
            <div>
              <span className="knowledge-eyebrow">A GOOD PLACE TO START</span>
              <h2 id="knowledge-library-title">Explore articles</h2>
            </div>
            <div className="knowledge-view-tabs" role="group" aria-label="Article collection">
              <button type="button" className={view === 'all' ? 'is-active' : ''} aria-pressed={view === 'all'} onClick={() => setView('all')}>
                All articles <span>{articles.length}</span>
              </button>
              <button type="button" className={view === 'bookmarks' ? 'is-active' : ''} aria-pressed={view === 'bookmarks'} onClick={() => setView('bookmarks')}>
                <Icon name="bookmark" size={14} /> Saved <span>{bookmarkedArticles.length}</span>
              </button>
            </div>
          </div>

          <div className="knowledge-filters">
            <label className="knowledge-search">
              <Icon name="search" size={16} />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, topics, and tags" aria-label="Search knowledge articles" />
            </label>
            <label className="knowledge-category-filter">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter articles by category">
                <option value="">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="knowledge-grid" role="status" aria-label="Loading articles">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="knowledge-skeleton" key={index} aria-hidden="true">
                  <div className="skeleton" style={{ height: 12, width: '34%' }} />
                  <div className="skeleton" style={{ height: 19, width: '76%', marginTop: 18 }} />
                  <div className="skeleton" style={{ height: 10, width: '92%', marginTop: 12 }} />
                  <div className="skeleton" style={{ height: 10, width: '70%', marginTop: 7 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="knowledge-state knowledge-state--error" role="alert">
              <Icon name="info" size={20} />
              <p>{error}</p>
              <button className="btn" type="button" onClick={() => setRetry((count) => count + 1)}>Try again</button>
            </div>
          ) : results.length === 0 ? (
            <div className="knowledge-state">
              <span className="knowledge-state__icon"><Icon name={view === 'bookmarks' ? 'bookmark' : 'search'} size={21} /></span>
              <h3>{view === 'bookmarks' && !query && !category ? 'No saved articles yet' : 'No articles found'}</h3>
              <p>{view === 'bookmarks' && !query && !category ? 'Bookmark an article to keep it close at hand.' : 'Try another search or broaden the category filter.'}</p>
              {view === 'bookmarks' && !query && !category && (
                <button type="button" className="btn" onClick={() => setView('all')}>Explore all articles</button>
              )}
            </div>
          ) : (
            <div className="knowledge-grid" aria-live="polite">
              {results.map((article) => (
                <KnowledgeArticleCard
                  key={article.id}
                  article={article}
                  bookmarked={library.bookmarks.includes(article.id)}
                  onToggleBookmark={() => library.toggleBookmark(article.id)}
                />
              ))}
            </div>
          )}
        </section>
        <footer className="knowledge-footer">Prototype library · Articles are sample content for ConnectOPS</footer>
      </div>
    </div>
  );
}