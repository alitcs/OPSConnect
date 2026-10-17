import { describe, expect, it } from 'vitest';
import { knowledgeArticles } from '../data/knowledgeArticles';
import {
  filterKnowledgeArticles,
  findKnowledgeArticle,
  getRelatedKnowledgeArticles,
  getKnowledgeCategories,
} from './catalog';

describe('knowledge catalog', () => {
  it('searches article titles, summaries, authors, and tags without case sensitivity', () => {
    const results = filterKnowledgeArticles(knowledgeArticles, 'ACCESSIBILITY', '');
    expect(results.map((article) => article.id)).toContain('accessible-meetings');
  });

  it('filters by category together with the search term', () => {
    const results = filterKnowledgeArticles(knowledgeArticles, 'mentor', 'People & Culture');
    expect(results.map((article) => article.id)).toEqual(['find-a-mentor', 'career-conversation']);
    expect(filterKnowledgeArticles(knowledgeArticles, 'mentor', 'Digital & Data')).toEqual([]);
  });

  it('returns unique, alphabetically ordered categories and finds articles by id', () => {
    const categories = getKnowledgeCategories(knowledgeArticles);
    expect(categories).toEqual([...categories].sort((a, b) => a.localeCompare(b)));
    expect(new Set(categories).size).toBe(categories.length);
    expect(findKnowledgeArticle('first-week')?.title).toBe('Your first week across the OPS');
    expect(findKnowledgeArticle('missing-article')).toBeUndefined();
  });

  it('ranks related articles by category and shared topics without including itself', () => {
    const article = findKnowledgeArticle('accessible-meetings');
    expect(article).toBeDefined();
    const related = getRelatedKnowledgeArticles(article!);
    expect(related).toHaveLength(3);
    expect(related.some((candidate) => candidate.id === article!.id)).toBe(false);
    expect(related.some((candidate) => candidate.category === article!.category)).toBe(true);
  });
});