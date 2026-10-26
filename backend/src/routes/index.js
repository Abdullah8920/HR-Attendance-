import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import userRoutes from './user.routes.js';
import employeeRoutes from './employee.routes.js';
import attendanceRoutes from './attendance.routes.js';
import leaveRoutes from './leave.routes.js';
import payrollRoutes from './payroll.routes.js';
import analyticsRoutes from './analytics.routes.js';
import announcementRoutes from './announcement.routes.js';
import auditRoutes from './audit.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Saylani HCM Lite Backend is running cleanly.',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/audit', auditRoutes);

export default router;
