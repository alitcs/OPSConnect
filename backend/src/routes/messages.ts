import { Router } from 'express';
import {
  getThread,
  listThreads,
  postMessage,
} from '../controllers/messagesController.js';

const router = Router();

router.get('/', listThreads);
router.get('/:threadId', getThread);
router.post('/:userId', postMessage);

export default router;
