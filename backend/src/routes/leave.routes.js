import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeaveBalances,
  getLeaves,
  cancelLeave,
  decideLeave,
} from '../controllers/leave.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', applyLeave);
router.get('/balance/me', getLeaveBalances);
router.get('/me', getMyLeaves);
router.get('/', authorize('ADMIN', 'HR'), getLeaves);
router.patch('/:id/cancel', cancelLeave);
router.patch('/:id/decision', authorize('ADMIN', 'HR'), decideLeave);

export default router;
