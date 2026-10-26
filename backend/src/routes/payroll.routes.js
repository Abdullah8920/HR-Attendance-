import { Router } from 'express';
import {
  setSalaryStructure,
  createPayrollDraft,
  finalizePayroll,
  getPayrollRuns,
  getPayrollRunById,
  getAllPayslips,
  generateIndividualPayslip,
  getMyPayslips,
  getPayslipById,
} from '../controllers/payroll.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Salary structures (Admin, HR)
router.post('/salary-structures', authorize('ADMIN', 'HR'), setSalaryStructure);

// Payroll runs
router.post('/runs', authorize('ADMIN', 'HR'), createPayrollDraft);
router.get('/runs', authorize('ADMIN', 'HR'), getPayrollRuns);
router.get('/runs/:id', authorize('ADMIN', 'HR'), getPayrollRunById);

// Finalize run (Admin ONLY!)
router.post('/runs/:id/finalize', authorize('ADMIN'), finalizePayroll);

// Individual & Company Payslips
router.get('/payslips', authorize('ADMIN', 'HR'), getAllPayslips);
router.post('/payslips/generate-individual', authorize('ADMIN', 'HR'), generateIndividualPayslip);
router.get('/payslips/me', getMyPayslips);
router.get('/payslips/:id', getPayslipById);

export default router;
