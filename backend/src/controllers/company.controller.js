import { Company } from '../models/Company.js';
import { Department } from '../models/Department.js';
import { Designation } from '../models/Designation.js';
import { LeaveType } from '../models/LeaveType.js';
import { Holiday } from '../models/Holiday.js';

// Organization settings
export const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.companyId);
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.user.companyId, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Settings updated.', data: company });
  } catch (error) {
    next(error);
  }
};

// Auto-seed default departments & designations if none exist
export const seedDefaultOrganization = async (companyId) => {
  const deptCount = await Department.countDocuments({ companyId });
  if (deptCount === 0) {
    const depts = [
      { name: 'Engineering', code: 'ENG', description: 'Software engineering, QA and DevOps' },
      { name: 'Human Resources', code: 'HR', description: 'Talent management, recruitment, and culture' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Financial management, payroll, and billing' },
      { name: 'Marketing & Sales', code: 'MKT', description: 'Outreach, growth, and client management' },
      { name: 'Operations', code: 'OPS', description: 'Daily operations, administration, and support' },
      { name: 'Product & Design', code: 'PROD', description: 'UI/UX design, research, and product strategy' },
    ];

    const createdDepts = {};
    for (const d of depts) {
      const created = await Department.create({ ...d, companyId });
      createdDepts[d.code] = created._id;
    }

    const desigs = [
      { title: 'Senior Software Engineer', code: 'SR_SWE', deptCode: 'ENG' },
      { title: 'Full Stack Developer', code: 'FS_DEV', deptCode: 'ENG' },
      { title: 'Frontend Developer', code: 'FE_DEV', deptCode: 'ENG' },
      { title: 'Backend Developer', code: 'BE_DEV', deptCode: 'ENG' },
      { title: 'QA Engineer', code: 'QA_ENG', deptCode: 'ENG' },
      { title: 'HR Manager', code: 'HR_MGR', deptCode: 'HR' },
      { title: 'HR Executive', code: 'HR_EXEC', deptCode: 'HR' },
      { title: 'Finance Manager', code: 'FIN_MGR', deptCode: 'FIN' },
      { title: 'Accountant', code: 'ACCT', deptCode: 'FIN' },
      { title: 'Marketing Specialist', code: 'MKT_SPEC', deptCode: 'MKT' },
      { title: 'Sales Executive', code: 'SALES_EXEC', deptCode: 'MKT' },
      { title: 'Operations Lead', code: 'OPS_LEAD', deptCode: 'OPS' },
      { title: 'Support Executive', code: 'SUP_EXEC', deptCode: 'OPS' },
      { title: 'UI/UX Designer', code: 'UI_DES', deptCode: 'PROD' },
      { title: 'Product Manager', code: 'PROD_MGR', deptCode: 'PROD' },
    ];

    for (const des of desigs) {
      await Designation.create({
        companyId,
        departmentId: createdDepts[des.deptCode],
        title: des.title,
        code: des.code,
      });
    }
  }
};

// Departments
export const getDepartments = async (req, res, next) => {
  try {
    let list = await Department.find({ companyId: req.user.companyId }).sort({ name: 1 });
    if (list.length === 0) {
      await seedDefaultOrganization(req.user.companyId);
      list = await Department.find({ companyId: req.user.companyId }).sort({ name: 1 });
    }
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required.' });

    const existing = await Department.findOne({ companyId: req.user.companyId, $or: [{ name }, { code }] });
    if (existing) return res.status(409).json({ success: false, message: 'Department already exists.' });

    const dept = await Department.create({ companyId: req.user.companyId, name, code, description });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await Department.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    next(error);
  }
};

// Designations
export const getDesignations = async (req, res, next) => {
  try {
    let list = await Designation.find({ companyId: req.user.companyId }).populate('departmentId', 'name code').sort({ title: 1 });
    if (list.length === 0) {
      await seedDefaultOrganization(req.user.companyId);
      list = await Designation.find({ companyId: req.user.companyId }).populate('departmentId', 'name code').sort({ title: 1 });
    }
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createDesignation = async (req, res, next) => {
  try {
    const { title, code, departmentId, description } = req.body;
    if (!title || !code) return res.status(400).json({ success: false, message: 'Title and code are required.' });

    const desig = await Designation.create({ companyId: req.user.companyId, title, code, departmentId, description });
    res.status(201).json({ success: true, data: desig });
  } catch (error) {
    next(error);
  }
};

export const deleteDesignation = async (req, res, next) => {
  try {
    await Designation.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ success: true, message: 'Designation deleted.' });
  } catch (error) {
    next(error);
  }
};

// Leave Types
export const getLeaveTypes = async (req, res, next) => {
  try {
    const list = await LeaveType.find({ companyId: req.user.companyId }).sort({ name: 1 });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createLeaveType = async (req, res, next) => {
  try {
    const { name, code, annualQuota, isPaid } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required.' });

    const item = await LeaveType.create({ companyId: req.user.companyId, name, code, annualQuota: annualQuota || 0, isPaid: isPaid ?? true });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// Holidays
export const getHolidays = async (req, res, next) => {
  try {
    const list = await Holiday.find({ companyId: req.user.companyId }).sort({ date: 1 });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req, res, next) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) return res.status(400).json({ success: false, message: 'Name and date are required.' });

    const holiday = await Holiday.create({ companyId: req.user.companyId, name, date, description });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req, res, next) => {
  try {
    await Holiday.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ success: true, message: 'Holiday deleted.' });
  } catch (error) {
    next(error);
  }
};
