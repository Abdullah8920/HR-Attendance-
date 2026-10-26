import { Router } from 'express';
import { createHR, toggleUserStatus, resetPassword } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.post('/hr', createHR);
router.patch('/:id/status', toggleUserStatus);
router.patch('/:id/reset-password', resetPassword);

export default router;
