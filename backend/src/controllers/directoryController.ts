import type { Request, Response } from 'express';
import {
  filterUsers,
  getFilterOptions,
  toSummary,
} from '../services/userService.js';

/** GET /api/directory — list users with optional filters. */
export function listDirectory(req: Request, res: Response): void {
  const { department, team, location, jobTitle, ministry, search } = req.query;
  const users = filterUsers({
    department: department as string | undefined,
    team: team as string | undefined,
    location: location as string | undefined,
    jobTitle: jobTitle as string | undefined,
    ministry: ministry as string | undefined,
    search: search as string | undefined,
  });
  res.json(users.map(toSummary));
}

/** GET /api/directory/filters — available filter option lists. */
export function getDirectoryFilters(_req: Request, res: Response): void {
  res.json(getFilterOptions());
}
