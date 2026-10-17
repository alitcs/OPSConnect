export interface PeopleSearchFilters {
  search: string;
  department: string;
  team: string;
  location: string;
  jobTitle: string;
  ministry: string;
}

export interface SavedPeopleSearch {
  id: string;
  name: string;
  filters: PeopleSearchFilters;
}

export const EMPTY_PEOPLE_FILTERS: PeopleSearchFilters = {
  search: '',
  department: '',
  team: '',
  location: '',
  jobTitle: '',
  ministry: '',
};