import type { DirectoryFilterOptions } from '../types';
import Icon from './Icon';

export interface DirectoryFilterState {
  department: string;
  team: string;
  location: string;
  jobTitle: string;
  search: string;
}

export default function DirectoryFilters({
  options,
  value,
  onChange,
}: {
  options: DirectoryFilterOptions | null;
  value: DirectoryFilterState;
  onChange: (next: DirectoryFilterState) => void;
}) {
  const set = (key: keyof DirectoryFilterState, v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <div className="search-field">
        <span className="search-field__icon">
          <Icon name="search" size={18} />
        </span>
        <input
          className="directory__search"
          placeholder="Search by name, title, or team…"
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>
      <div className="directory__filters">
        <Select
          label="Department"
          value={value.department}
          options={options?.departments ?? []}
          onChange={(v) => set('department', v)}
        />
        <Select
          label="Team"
          value={value.team}
          options={options?.teams ?? []}
          onChange={(v) => set('team', v)}
        />
        <Select
          label="Location"
          value={value.location}
          options={options?.locations ?? []}
          onChange={(v) => set('location', v)}
        />
        <Select
          label="Job title"
          value={value.jobTitle}
          options={options?.jobTitles ?? []}
          onChange={(v) => set('jobTitle', v)}
        />
        {/* TODO (open question #8): more filters may be added later — ministry, skills,
            availability status. Ministry options are already available from the API. */}
      </div>
    </>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
