// Mock authentication middleware.
//
// There is no real auth in the prototype. The frontend's login switcher sends the
// selected user's id in the `x-user-id` header; this middleware resolves that to a
// User and attaches it to the request as `req.currentUser`.
//
// TODO (production): replace with Microsoft Entra ID / Azure AD token validation via
// MSAL. Validate the bearer token, then look up (or provision) the matching user.

import type { NextFunction, Request, Response } from 'express';
import type { User } from '../types.js';
import { getUserById } from '../data/store.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser: User;
    }
  }
}

const DEFAULT_USER_ID = 1;

export function mockAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('x-user-id');
  const userId = header ? Number(header) : DEFAULT_USER_ID;
  const user = getUserById(Number.isFinite(userId) ? userId : DEFAULT_USER_ID);

  if (!user) {
    res.status(401).json({ error: 'Unknown user. Provide a valid x-user-id header.' });
    return;
  }
  req.currentUser = user;
  next();
}
