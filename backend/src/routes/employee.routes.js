import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  getEmployee360,
  exportCsv,
  importCsv,
} from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Export & Import CSV
router.get('/export', authorize('ADMIN', 'HR'), exportCsv);
router.post('/import', authorize('ADMIN', 'HR'), importCsv);

// Employee CRUD
router.post('/', authorize('ADMIN', 'HR'), createEmployee);
router.get('/', getEmployees);
router.get('/:id/360', getEmployee360);
router.get('/:id', getEmployeeById);
router.patch('/:id', updateEmployee);

export default router;
