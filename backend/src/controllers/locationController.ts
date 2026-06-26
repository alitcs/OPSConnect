import type { Request, Response } from 'express';
import type { FloorMapData } from '../types.js';
import { getUserById } from '../data/store.js';

// Placeholder floor plan dimensions (SVG viewBox units).
const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;

/**
 * Derive a deterministic (x, y) position for a seat label like "14-B22" so the same
 * seat always renders in the same spot on the placeholder floor plan.
 * TODO (production): replace with real coordinates from a facilities/floor-plan system.
 */
function seatToCoordinates(seat: string): { x: number; y: number } {
  // Use the row letter and number to spread seats across a grid.
  const match = seat.match(/-([A-Z])(\d+)/);
  const margin = 80;
  if (!match) {
    return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
  }
  const rowLetter = match[1].charCodeAt(0) - 'A'.charCodeAt(0); // 0..n
  const seatNumber = Number(match[2]);
  const cols = 8;
  const col = seatNumber % cols;
  const row = rowLetter;
  const usableW = MAP_WIDTH - margin * 2;
  const usableH = MAP_HEIGHT - margin * 2;
  const x = margin + (col / (cols - 1)) * usableW;
  const y = margin + (row / 5) * usableH;
  return { x: Math.round(x), y: Math.round(y) };
}

/** GET /api/users/:id/location — floor/seat data (403 if the user hasn't opted in). */
export function getUserLocation(req: Request, res: Response): void {
  const user = getUserById(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (!user.floorPublic && !user.seatPublic) {
    res.status(403).json({ error: 'This user has not shared their location.' });
    return;
  }
  res.json({
    floor: user.floorPublic ? user.floor : null,
    seat: user.seatPublic ? user.seat : null,
    building: user.location,
  });
}

/**
 * GET /api/floors/:floorId/map?seat=14-B22 — floor plan data for rendering.
 * floorId is expected as `<building-encoded>-<floor>`; for the prototype we just echo
 * back placeholder dimensions plus the highlighted seat coordinates.
 */
export function getFloorMap(req: Request, res: Response): void {
  const seat = req.query.seat as string | undefined;
  const floorId = req.params.floorId;
  const floorNumber = Number(floorId.split('-').pop());

  const data: FloorMapData = {
    floorId,
    building: (req.query.building as string) || 'OPS Office',
    floor: Number.isFinite(floorNumber) ? floorNumber : 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    highlightedSeat: seat
      ? { seat, ...seatToCoordinates(seat) }
      : null,
  };
  res.json(data);
}
