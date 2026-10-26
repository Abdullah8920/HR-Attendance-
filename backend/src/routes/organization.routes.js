import { Router } from 'express';
import {
  getCompany,
  updateCompany,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  deleteDesignation,
  getLeaveTypes,
  createLeaveType,
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Organization settings
router.get('/', getCompany);
router.patch('/', authorize('ADMIN'), updateCompany);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', authorize('ADMIN'), createDepartment);
router.delete('/departments/:id', authorize('ADMIN'), deleteDepartment);

// Designations
router.get('/designations', getDesignations);
router.post('/designations', authorize('ADMIN'), createDesignation);
router.delete('/designations/:id', authorize('ADMIN'), deleteDesignation);

// Leave Types
router.get('/leave-types', getLeaveTypes);
router.post('/leave-types', authorize('ADMIN'), createLeaveType);

// Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', authorize('ADMIN'), createHoliday);
router.delete('/holidays/:id', authorize('ADMIN'), deleteHoliday);

export default router;
