import { Router } from 'express';
import { getAdminAnalytics, getHRAnalytics, getEmployeeAnalytics } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize('ADMIN'), getAdminAnalytics);
router.get('/hr', authorize('ADMIN', 'HR'), getHRAnalytics);
router.get('/employee', getEmployeeAnalytics);

export default router;
