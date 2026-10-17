import { knowledgeArticles } from '../data/knowledgeArticles';
import type { KnowledgeArticle } from '../types';

export function getKnowledgeCategories(articles: KnowledgeArticle[] = knowledgeArticles): string[] {
  return [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b));
}

export function filterKnowledgeArticles(
  articles: KnowledgeArticle[],
  query: string,
  category: string,
): KnowledgeArticle[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return articles.filter((article) => {
    if (category && article.category !== category) return false;
    if (!normalizedQuery) return true;
    const searchable = [article.title, article.summary, article.category, article.author, ...article.tags]
      .join(' ')
      .toLocaleLowerCase();
    return searchable.includes(normalizedQuery);
  });
}

export function loadKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(knowledgeArticles), 160);
  });
}

export function findKnowledgeArticle(id: string, articles: KnowledgeArticle[] = knowledgeArticles): KnowledgeArticle | undefined {
  return articles.find((article) => article.id === id);
}

export function getRelatedKnowledgeArticles(
  article: KnowledgeArticle,
  articles: KnowledgeArticle[] = knowledgeArticles,
  limit = 3,
): KnowledgeArticle[] {
  const tags = new Set(article.tags.map((tag) => tag.toLocaleLowerCase()));
  return articles
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => ({
      article: candidate,
      score: (candidate.category === article.category ? 2 : 0) +
        candidate.tags.filter((tag) => tags.has(tag.toLocaleLowerCase())).length,
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || b.article.updatedAt.localeCompare(a.article.updatedAt))
    .slice(0, limit)
    .map((match) => match.article);
}