import { Router } from 'express';
import {
  getConversation,
  listConversations,
  newConversation,
  removeConversation,
  sendMessage,
} from '../controllers/chatController.js';

const router = Router();

router.post('/', sendMessage);
router.get('/conversations', listConversations);
router.post('/conversations', newConversation);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', removeConversation);

export default router;
