import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DirectoryFilterOptions, UserSummary } from '../types';
import { EMPTY_PEOPLE_FILTERS, type PeopleSearchFilters } from '../people/types';

export function useDirectorySearch(initialFilters: PeopleSearchFilters = EMPTY_PEOPLE_FILTERS) {
  const [filters, setFilters] = useState<PeopleSearchFilters>(initialFilters);
  const [people, setPeople] = useState<UserSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<DirectoryFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingFilters(true);
    api.getDirectoryFilters()
      .then((options) => { if (active) setFilterOptions(options); })
      .catch(() => { if (active) setFilterError('Filter options could not be loaded.'); })
      .finally(() => { if (active) setLoadingFilters(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      const params = Object.fromEntries(
        Object.entries(filters)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value),
      );
      api.getDirectory(params)
        .then((results) => { if (active) setPeople(results); })
        .catch(() => { if (active) setError('Could not load people. Try again.'); })
        .finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [filters, retry]);

  const updateFilter = (key: keyof PeopleSearchFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => setFilters({ ...EMPTY_PEOPLE_FILTERS });

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    people,
    filterOptions,
    loading,
    loadingFilters,
    error,
    filterError,
    retry: () => setRetry((count) => count + 1),
  };
}