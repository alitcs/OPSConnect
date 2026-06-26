import type { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
} from '../data/store.js';
import { toPublicProfile, toSummary } from '../services/userService.js';

/** GET /api/users/:id — full profile. Own profile shows everything; others are projected. */
export function getUser(req: Request, res: Response): void {
  const id = Number(req.params.id);
  const user = getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const isSelf = req.currentUser.id === id;
  res.json(isSelf ? user : toPublicProfile(user));
}

/** PUT /api/users/:id — update own profile (Tier B + Tier 2 toggles only). */
export function updateUserProfile(req: Request, res: Response): void {
  const id = Number(req.params.id);
  if (req.currentUser.id !== id) {
    res.status(403).json({ error: 'You can only edit your own profile.' });
    return;
  }
  const updated = updateUser(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(updated);
}

/** GET /api/users/:id/reports — direct reports (summaries). */
export function getReports(req: Request, res: Response): void {
  const user = getUserById(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const reports = user.directReports
    .map((rid) => getUserById(rid))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map(toSummary);
  res.json(reports);
}

/** GET /api/users/:id/manager — manager (summary). */
export function getManager(req: Request, res: Response): void {
  const user = getUserById(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const manager = user.managerId ? getUserById(user.managerId) : undefined;
  res.json(manager ? toSummary(manager) : null);
}

/** GET /api/users/:id/teammates — teammates (summaries). */
export function getTeammates(req: Request, res: Response): void {
  const user = getUserById(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const teammates = user.teammates
    .map((tid) => getUserById(tid))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map(toSummary);
  res.json(teammates);
}

/** GET /api/users — list all (summaries). */
export function listUsers(_req: Request, res: Response): void {
  res.json(getAllUsers().map(toSummary));
}

/** GET /api/me — the currently "logged in" user (full profile). */
export function getCurrentUser(req: Request, res: Response): void {
  res.json(req.currentUser);
}
