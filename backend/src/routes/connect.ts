import { Router } from 'express';
import {
  getActivity,
  getAvailability,
  getConnectFeed,
  getDailyNudge,
  getInsights,
  getProximity,
  logCoffeeChat,
  updateAvailability,
} from '../controllers/connectController.js';

const router = Router();

router.get('/availability', getAvailability);
router.put('/availability', updateAvailability);
router.get('/feed', getConnectFeed);
router.get('/proximity', getProximity);
router.get('/nudge', getDailyNudge);
router.get('/activity', getActivity);
router.post('/activity', logCoffeeChat);
router.get('/insights', getInsights);

export default router;
