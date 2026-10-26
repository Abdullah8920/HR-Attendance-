import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getCalendar,
  getDailyBoard,
  requestCorrection,
  getCorrections,
  decideCorrection,
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/me', getMyAttendance);
router.get('/calendar', getCalendar);
router.get('/', authorize('ADMIN', 'HR'), getDailyBoard);
router.post('/corrections', requestCorrection);
router.get('/corrections', getCorrections);
router.patch('/corrections/:id/decision', authorize('ADMIN', 'HR'), decideCorrection);

export default router;
