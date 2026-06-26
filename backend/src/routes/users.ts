import { Router } from 'express';
import {
  getCurrentUser,
  getManager,
  getReports,
  getTeammates,
  getUser,
  listUsers,
  updateUserProfile,
} from '../controllers/usersController.js';
import {
  getFloorMap,
  getUserLocation,
} from '../controllers/locationController.js';

const router = Router();

router.get('/me', getCurrentUser);
router.get('/', listUsers);
router.get('/:id', getUser);
router.put('/:id', updateUserProfile);
router.get('/:id/reports', getReports);
router.get('/:id/manager', getManager);
router.get('/:id/teammates', getTeammates);
router.get('/:id/location', getUserLocation);

export default router;
