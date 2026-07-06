import type { Request, Response } from 'express';
import { addCoffeeChat, getUserById, setAvailability } from '../data/store.js';
import {
  activityMetrics,
  adminInsights,
  connectFeed,
  dailyNudge,
  proximitySummary,
} from '../services/connectService.js';

/** GET /api/connect/availability — the current user's own availability status. */
export function getAvailability(req: Request, res: Response): void {
  const u = req.currentUser;
  res.json({
    availableForCoffee: u.availableForCoffee,
    availabilityNote: u.availabilityNote,
    availabilitySetAt: u.availabilitySetAt,
  });
}

/** PUT /api/connect/availability — set "open for coffee today" (with optional note). */
export function updateAvailability(req: Request, res: Response): void {
  const { available, note } = req.body as { available?: boolean; note?: string | null };
  const updated = setAvailability(req.currentUser.id, Boolean(available), note ?? null);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    availableForCoffee: updated.availableForCoffee,
    availabilityNote: updated.availabilityNote,
    availabilitySetAt: updated.availabilitySetAt,
  });
}

/** GET /api/connect/feed — everyone open for coffee today, with mutual context. */
export function getConnectFeed(req: Request, res: Response): void {
  res.json(connectFeed(req.currentUser));
}

/** GET /api/connect/proximity — smart proximity summary for the current user. */
export function getProximity(req: Request, res: Response): void {
  res.json(proximitySummary(req.currentUser));
}

/** GET /api/connect/nudge — randomized daily nudge (may surface 0, 1, or 2 people). */
export function getDailyNudge(req: Request, res: Response): void {
  res.json(dailyNudge(req.currentUser));
}

/** GET /api/connect/activity — the current user's private activity metric. */
export function getActivity(req: Request, res: Response): void {
  res.json(activityMetrics(req.currentUser));
}

/** POST /api/connect/activity — log a coffee chat toward the private metric. */
export function logCoffeeChat(req: Request, res: Response): void {
  const withUserId = Number((req.body as { withUserId?: number }).withUserId);
  if (!Number.isFinite(withUserId)) {
    res.status(400).json({ error: 'withUserId is required' });
    return;
  }
  if (withUserId === req.currentUser.id) {
    res.status(400).json({ error: 'You cannot log a chat with yourself.' });
    return;
  }
  if (!getUserById(withUserId)) {
    res.status(404).json({ error: 'Person not found' });
    return;
  }
  addCoffeeChat(req.currentUser.id, withUserId);
  res.json(activityMetrics(req.currentUser));
}

/** GET /api/connect/insights — org-level analytics (program coordinators only). */
export function getInsights(req: Request, res: Response): void {
  if (!req.currentUser.isAdmin) {
    res.status(403).json({ error: 'Insights are available to program coordinators only.' });
    return;
  }
  res.json(adminInsights());
}
