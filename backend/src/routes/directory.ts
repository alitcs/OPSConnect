import { Router } from 'express';
import {
  getDirectoryFilters,
  listDirectory,
} from '../controllers/directoryController.js';

const router = Router();

router.get('/', listDirectory);
router.get('/filters', getDirectoryFilters);

export default router;
