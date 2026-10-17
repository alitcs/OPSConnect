import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { KnowledgeArticle } from '../types';
import Icon from '../components/Icon';
import KnowledgeArticleCard from '../components/KnowledgeArticleCard';
import MiniProfileCard from '../components/MiniProfileCard';
import { useAuth } from '../context/AuthContext';
import { useKnowledgeLibrary } from '../context/KnowledgeLibraryContext';
import { usePeopleLibrary } from '../context/PeopleContext';
import { loadKnowledgeArticles } from '../knowledge/catalog';
import { EMPTY_PEOPLE_FILTERS } from '../people/types';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const people = usePeopleLibrary();
  const knowledge = useKnowledgeLibrary();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleError, setArticleError] = useState(false);

  useEffect(() => {
    let active = true;
    loadKnowledgeArticles()
      .then((result) => { if (active) setArticles(result); })
      .catch(() => { if (active) setArticleError(true); })
      .finally(() => { if (active) setLoadingArticles(false); });
    return () => { active = false; };
  }, []);

  const savedArticles = useMemo(
    () => knowledge.bookmarks
      .map((id) => articles.find((article) => article.id === id))
      .filter((article): article is KnowledgeArticle => !!article)
      .slice(0, 3),
    [articles, knowledge.bookmarks],
  );
  const greetingName = currentUser?.name.split(' ')[0] ?? 'there';

  return (
    <div className="page dashboard-page">
      <div className="dashboard-page__inner">
        <header className="dashboard-header">
          <div>
            <span className="knowledge-eyebrow">CONNECTOPS / OVERVIEW</span>
            <h1>Good to see you, {greetingName}.</h1>
            <p>Your people, knowledge, and next steps in one place.</p>
          </div>
          <Link className="btn btn--primary dashboard-header__search" to="/people">
            <Icon name="search" size={15} /> Find a colleague
          </Link>
        </header>

        {(people.storageError || knowledge.storageError) && (
          <div className="knowledge-alert" role="alert"><Icon name="info" size={16} /> {people.storageError ?? knowledge.storageError}</div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <section className="dashboard-section" aria-labelledby="dashboard-people-title">
              <div className="dashboard-section__heading">
                <div><span className="knowledge-eyebrow">YOUR NETWORK</span><h2 id="dashboard-people-title">Recently viewed people</h2></div>
                <Link to="/people">Open directory <Icon name="chevronRight" size={14} /></Link>
              </div>
              {people.recentlyViewed.length ? (
                <div className="dashboard-people-list">
                  {people.recentlyViewed.map((person) => (
                    <MiniProfileCard
                      key={person.id}
                      person={person}
                      favorite={people.favorites.includes(person.id)}
                      onToggleFavorite={() => people.toggleFavorite(person.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <span>People you open will appear here.</span>
                  <Link to="/people">Browse the directory <Icon name="chevronRight" size={13} /></Link>
                </div>
              )}
            </section>

            <section className="dashboard-section" aria-labelledby="dashboard-searches-title">
              <div className="dashboard-section__heading">
                <div><span className="knowledge-eyebrow">YOUR SHORTCUTS</span><h2 id="dashboard-searches-title">Saved people searches</h2></div>
                <Link to="/people">Manage searches <Icon name="chevronRight" size={14} /></Link>
              </div>
              {people.savedSearches.length ? (
                <div className="dashboard-saved-searches">
                  {people.savedSearches.slice(0, 4).map((search) => (
                    <Link key={search.id} to={`/people?searchId=${encodeURIComponent(search.id)}`} className="dashboard-saved-search">
                      <span className="dashboard-saved-search__icon"><Icon name="search" size={15} /></span>
                      <span><strong>{search.name}</strong><small>{describeSearch(search.filters)}</small></span>
                      <Icon name="chevronRight" size={14} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <span>Save a useful set of filters to get back to colleagues faster.</span>
                  <Link to="/people">Create a saved search <Icon name="chevronRight" size={13} /></Link>
                </div>
              )}
            </section>

            <section className="dashboard-section" aria-labelledby="dashboard-knowledge-title">
              <div className="dashboard-section__heading">
                <div><span className="knowledge-eyebrow">YOUR READING LIST</span><h2 id="dashboard-knowledge-title">Bookmarked knowledge</h2></div>
                <Link to="/knowledge">Knowledge Hub <Icon name="chevronRight" size={14} /></Link>
              </div>
              {loadingArticles ? (
                <div className="dashboard-empty" role="status">Loading your saved articles…</div>
              ) : articleError ? (
                <div className="dashboard-empty dashboard-empty--error" role="alert">Your saved articles could not be loaded.</div>
              ) : savedArticles.length ? (
                <div className="dashboard-articles">
                  {savedArticles.map((article) => (
                    <KnowledgeArticleCard
                      key={article.id}
                      article={article}
                      bookmarked
                      onToggleBookmark={() => knowledge.toggleBookmark(article.id)}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <span>Bookmark articles to keep useful guidance close.</span>
                  <Link to="/knowledge">Explore articles <Icon name="chevronRight" size={13} /></Link>
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-quick" aria-labelledby="dashboard-actions-title">
            <span className="knowledge-eyebrow">GET MOVING</span>
            <h2 id="dashboard-actions-title">Quick actions</h2>
            <Link to="/" className="dashboard-action"><span><Icon name="sparkle" size={17} /></span><span><strong>Ask Copilot</strong><small>Find a skill or get unstuck</small></span><Icon name="chevronRight" size={14} /></Link>
            <Link to="/people" className="dashboard-action"><span><Icon name="directory" size={17} /></span><span><strong>Find people</strong><small>Search across the OPS</small></span><Icon name="chevronRight" size={14} /></Link>
            <Link to="/connect" className="dashboard-action"><span><Icon name="coffee" size={17} /></span><span><strong>Connect today</strong><small>See who is open to meet</small></span><Icon name="chevronRight" size={14} /></Link>
            <Link to="/knowledge" className="dashboard-action"><span><Icon name="bookOpen" size={17} /></span><span><strong>Browse knowledge</strong><small>Guides from across the OPS</small></span><Icon name="chevronRight" size={14} /></Link>
            <Link to="/invite" className="dashboard-action"><span><Icon name="teams" size={17} /></span><span><strong>Invite a colleague</strong><small>Bring another perspective in</small></span><Icon name="chevronRight" size={14} /></Link>
            <div className="dashboard-favorite-count"><Icon name="star" size={15} /> {people.favorites.length} favorite {people.favorites.length === 1 ? 'person' : 'people'}</div>
          </aside>
        </div>
        <footer className="knowledge-footer">ConnectOPS · Internal prototype</footer>
      </div>
    </div>
  );
}

function describeSearch(filters: typeof EMPTY_PEOPLE_FILTERS): string {
  const values = [filters.search, filters.ministry, filters.department, filters.team, filters.location, filters.jobTitle].filter(Boolean);
  return values.length ? values.join(' · ') : 'Everyone';
}