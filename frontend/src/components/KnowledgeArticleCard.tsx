import { Link } from 'react-router-dom';
import type { KnowledgeArticle } from '../types';
import Icon from './Icon';

export default function KnowledgeArticleCard({
  article,
  bookmarked,
  onToggleBookmark,
  compact = false,
}: {
  article: KnowledgeArticle;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  compact?: boolean;
}) {
  return (
    <article className={`knowledge-card ${compact ? 'knowledge-card--compact' : ''}`}>
      <div className="knowledge-card__topline">
        <span className="knowledge-category">{article.category}</span>
        <button
          type="button"
          className={`knowledge-bookmark ${bookmarked ? 'is-bookmarked' : ''}`}
          onClick={onToggleBookmark}
          aria-label={bookmarked ? `Remove ${article.title} from bookmarks` : `Bookmark ${article.title}`}
          aria-pressed={bookmarked}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
        >
          <Icon name="bookmark" size={17} />
        </button>
      </div>
      <Link className="knowledge-card__link" to={`/knowledge/${article.id}`}>
        <h3>{article.title}</h3>
        <p>{article.summary}</p>
      </Link>
      <div className="knowledge-card__meta">
        <span>{article.readingMinutes} min read</span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.updatedAt}>
          Updated {new Date(`${article.updatedAt}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </time>
      </div>
    </article>
  );
}