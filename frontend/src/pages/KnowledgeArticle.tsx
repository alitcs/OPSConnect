import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import KnowledgeArticleCard from '../components/KnowledgeArticleCard';
import { useKnowledgeLibrary } from '../context/KnowledgeLibraryContext';
import { findKnowledgeArticle, getRelatedKnowledgeArticles, loadKnowledgeArticles } from '../knowledge/catalog';
import type { KnowledgeArticle as KnowledgeArticleType } from '../types';

export default function KnowledgeArticlePage() {
  const { articleId = '' } = useParams();
  const library = useKnowledgeLibrary();
  const { recordView } = library;
  const [article, setArticle] = useState<KnowledgeArticleType | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadKnowledgeArticles()
      .then((articles) => {
        if (!active) return;
        setArticles(articles);
        setArticle(findKnowledgeArticle(articleId, articles) ?? null);
      })
      .catch(() => {
        if (active) setError('This article could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [articleId, retry]);

  useEffect(() => {
    if (article) recordView(article.id);
  }, [article, recordView]);

  if (loading) {
    return (
      <div className="page knowledge-detail-page">
        <div className="knowledge-detail__loading" role="status" aria-label="Loading article">
          <div className="skeleton" style={{ height: 12, width: 110 }} />
          <div className="skeleton" style={{ height: 34, width: '72%', marginTop: 25 }} />
          <div className="skeleton" style={{ height: 12, width: '48%', marginTop: 16 }} />
          <div className="skeleton" style={{ height: 180, width: '100%', marginTop: 34 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page knowledge-detail-page">
        <div className="knowledge-state knowledge-state--error" role="alert">
          <Icon name="info" size={20} />
          <p>{error}</p>
          <button className="btn" type="button" onClick={() => setRetry((count) => count + 1)}>Try again</button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page knowledge-detail-page">
        <div className="knowledge-state">
          <h1>Article not found</h1>
          <p>This article may have moved or is no longer available.</p>
          <Link className="btn" to="/knowledge">Back to Knowledge Hub</Link>
        </div>
      </div>
    );
  }

  const bookmarked = library.bookmarks.includes(article.id);
  const related = getRelatedKnowledgeArticles(article, articles);

  return (
    <div className="page knowledge-detail-page">
      <article className="knowledge-detail">
        <Link className="knowledge-back" to="/knowledge"><Icon name="back" size={15} /> Knowledge Hub</Link>
        {library.storageError && <div className="knowledge-alert" role="alert"><Icon name="info" size={16} /> {library.storageError}</div>}
        <header className="knowledge-detail__header">
          <span className="knowledge-category">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="knowledge-detail__summary">{article.summary}</p>
          <div className="knowledge-detail__byline">
            <span>{article.author}</span>
            <span aria-hidden="true">·</span>
            <span>{article.readingMinutes} min read</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.updatedAt}>Updated {new Date(`${article.updatedAt}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</time>
          </div>
          <button
            type="button"
            className={`btn knowledge-detail__bookmark ${bookmarked ? 'is-bookmarked' : ''}`}
            aria-pressed={bookmarked}
            onClick={() => library.toggleBookmark(article.id)}
          >
            <Icon name="bookmark" size={15} /> {bookmarked ? 'Saved' : 'Save article'}
          </button>
        </header>
        <div className="knowledge-detail__body">
          {article.body.map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}
        </div>
        <div className="knowledge-detail__tags" aria-label="Article topics">
          {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {related.length > 0 && (
          <section className="knowledge-related" aria-labelledby="knowledge-related-title">
            <div className="knowledge-section-heading">
              <div>
                <span className="knowledge-eyebrow">KEEP EXPLORING</span>
                <h2 id="knowledge-related-title">Related articles</h2>
              </div>
            </div>
            <div className="knowledge-related__grid">
              {related.map((relatedArticle) => (
                <KnowledgeArticleCard
                  key={relatedArticle.id}
                  article={relatedArticle}
                  bookmarked={library.bookmarks.includes(relatedArticle.id)}
                  onToggleBookmark={() => library.toggleBookmark(relatedArticle.id)}
                  compact
                />
              ))}
            </div>
          </section>
        )}
        <footer className="knowledge-detail__footer">
          <span>Was this useful?</span>
          <Link to="/knowledge">Browse more articles <Icon name="chevronRight" size={14} /></Link>
        </footer>
      </article>
    </div>
  );
}