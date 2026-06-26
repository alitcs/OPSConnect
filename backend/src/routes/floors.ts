import { Router } from 'express';
import { getFloorMap } from '../controllers/locationController.js';

const router = Router();

// GET /api/floors/:floorId/map?seat=14-B22
router.get('/:floorId/map', getFloorMap);

export default router;
