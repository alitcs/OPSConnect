// User-facing data shaping: filtering, summaries, and consent-aware projection.

import type { User, UserSummary } from '../types.js';
import { getAllUsers } from '../data/store.js';

export function toSummary(u: User): UserSummary {
  return {
    id: u.id,
    name: u.name,
    title: u.title,
    team: u.team,
    ministry: u.ministry,
    location: u.location,
    status: u.status,
  };
}

/**
 * Project a user for public viewing by someone else.
 * Strips Tier 2 location data unless the user opted in (consent-gated).
 * Tier B data is kept on the object but the frontend decides what to display.
 */
export function toPublicProfile(u: User): User {
  return {
    ...u,
    floor: u.floorPublic ? u.floor : null,
    seat: u.seatPublic ? u.seat : null,
  };
}

export interface DirectoryFilters {
  department?: string; // matches branch or division
  team?: string;
  location?: string;
  jobTitle?: string;
  ministry?: string;
  search?: string;
}

export function filterUsers(filters: DirectoryFilters): User[] {
  let result = getAllUsers();

  if (filters.department) {
    const dept = filters.department.toLowerCase();
    result = result.filter(
      (u) =>
        u.branch.toLowerCase() === dept || u.division.toLowerCase() === dept,
    );
  }
  if (filters.team) {
    const team = filters.team.toLowerCase();
    result = result.filter((u) => u.team.toLowerCase() === team);
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    result = result.filter((u) => u.location.toLowerCase() === loc);
  }
  if (filters.jobTitle) {
    const title = filters.jobTitle.toLowerCase();
    result = result.filter((u) => u.title.toLowerCase() === title);
  }
  if (filters.ministry) {
    const ministry = filters.ministry.toLowerCase();
    result = result.filter((u) => u.ministry.toLowerCase() === ministry);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q),
    );
  }
  return result;
}

/** Distinct, sorted filter option lists for the directory UI. */
export function getFilterOptions() {
  const users = getAllUsers();
  const unique = (values: string[]) =>
    Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  return {
    departments: unique(users.flatMap((u) => [u.branch, u.division])),
    teams: unique(users.map((u) => u.team)),
    locations: unique(users.map((u) => u.location)),
    jobTitles: unique(users.map((u) => u.title)),
    ministries: unique(users.map((u) => u.ministry)),
  };
}
