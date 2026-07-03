import { useEffect, useState } from 'react';
import type { DirectoryFilterOptions, UserSummary } from '../types';
import { api } from '../api/client';
import DirectoryFilters, {
  type DirectoryFilterState,
} from '../components/DirectoryFilters';
import MiniProfileCard from '../components/MiniProfileCard';

const EMPTY: DirectoryFilterState = {
  department: '',
  team: '',
  location: '',
  jobTitle: '',
  search: '',
};

export default function DirectoryPage() {
  const [options, setOptions] = useState<DirectoryFilterOptions | null>(null);
  const [filters, setFilters] = useState<DirectoryFilterState>(EMPTY);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDirectoryFilters().then(setOptions).catch(() => setOptions(null));
  }, []);

  // Debounce filter changes so typing in search doesn't spam the API.
  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string> = {};
      if (filters.department) params.department = filters.department;
      if (filters.team) params.team = filters.team;
      if (filters.location) params.location = filters.location;
      if (filters.jobTitle) params.jobTitle = filters.jobTitle;
      if (filters.search) params.search = filters.search;
      api
        .getDirectory(params)
        .then(setUsers)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [filters]);

  return (
    <div className="page">
      <div className="page__inner">
        <h1 className="page__title">Directory</h1>
        <p className="page__subtitle">Browse everyone across the OPS.</p>

        <DirectoryFilters options={options} value={filters} onChange={setFilters} />

        <div className="directory__count" aria-live="polite">
          {loading ? 'Searching…' : `${users.length} ${users.length === 1 ? 'person' : 'people'}`}
        </div>

        <div className="directory__list">
          {loading && users.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i} aria-hidden="true">
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                <div className="skeleton-card__lines">
                  <div className="skeleton" style={{ height: 12, width: '35%' }} />
                  <div className="skeleton" style={{ height: 10, width: '60%' }} />
                </div>
              </div>
            ))
          ) : (
            <>
              {users.map((u) => (
                <MiniProfileCard key={u.id} person={u} />
              ))}
              {!loading && users.length === 0 && (
                <p className="muted">No one matches those filters.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
