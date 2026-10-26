import { Router } from 'express';
import { setupFirstRun, login, getMe, changePassword, getDemoAccounts, seedDemoUsers } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/demo-accounts', getDemoAccounts);
router.post('/seed-demo', seedDemoUsers);
router.post('/setup', setupFirstRun);
router.post('/login', login);
router.post('/logout', authenticate, (req, res) => res.status(200).json({ success: true, message: 'Logged out.' }));
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, changePassword);

export default router;
