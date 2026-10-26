import { Router } from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', authorize('ADMIN', 'HR'), createAnnouncement);
router.delete('/:id', authorize('ADMIN', 'HR'), deleteAnnouncement);

export default router;
