import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Payslip } from '../models/Payslip.js';
import { Department } from '../models/Department.js';
import { logAudit } from '../utils/audit.js';

export const createEmployee = async (req, res, next) => {
  try {
    const { employeeCode, firstName, lastName, email, phone, address, departmentId, designationId, joiningDate, basicSalary } = req.body;

    if (!employeeCode || !firstName || !lastName || !email || !joiningDate) {
      return res.status(400).json({ success: false, message: 'employeeCode, firstName, lastName, email, and joiningDate are required.' });
    }

    const cleanCode = employeeCode.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingEmp = await Employee.findOne({ companyId: req.user.companyId, employeeCode: cleanCode });
    if (existingEmp) return res.status(409).json({ success: false, message: 'Employee code already exists.' });

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists.' });

    const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      companyId: req.user.companyId,
      email: cleanEmail,
      password: tempPassword,
      role: 'EMPLOYEE',
      isActive: true,
      mustChangePassword: true,
    });

    const employee = await Employee.create({
      companyId: req.user.companyId,
      userId: user._id,
      employeeCode: cleanCode,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone,
      address,
      departmentId: departmentId || undefined,
      designationId: designationId || undefined,
      joiningDate: new Date(joiningDate),
    });

    user.employeeId = employee._id;
    await user.save();

    // Default salary structure: HRA = 40%, Medical = 10%, Gross = 1.5x basic
    if (basicSalary && basicSalary > 0) {
      const basic = Math.round(basicSalary);
      const hra = Math.round(basic * 0.4);
      const medical = Math.round(basic * 0.1);
      const gross = basic + hra + medical;

      const salary = await SalaryStructure.create({
        companyId: req.user.companyId,
        employeeId: employee._id,
        basicSalary: basic,
        hra,
        medicalAllowance: medical,
        otherAllowances: 0,
        grossSalary: gross,
        effectiveFrom: employee.joiningDate,
        isActive: true,
      });

      employee.salaryStructureId = salary._id;
      await employee.save();
    }

    await logAudit({
      companyId: req.user.companyId,
      actorUserId: req.user.userId,
      role: req.user.role,
      action: 'CREATE_EMPLOYEE',
      entityType: 'Employee',
      entityId: employee._id,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      data: {
        employee,
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { companyId: req.user.companyId };
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.status) filter.employmentStatus = req.query.status;

    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { employeeCode: regex }, { email: regex }];
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('departmentId', 'name code')
        .populate('designationId', 'title code')
        .populate('salaryStructureId', 'basicSalary grossSalary')
        .skip(skip)
        .limit(limit)
        .sort({ employeeCode: 1 }),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('departmentId', 'name code')
      .populate('designationId', 'title code')
      .populate('salaryStructureId');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // Employees can only update their own phone and address
    if (req.user.role === 'EMPLOYEE') {
      if (employee.userId?.toString() !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Forbidden. You can only update your own profile.' });
      }
      employee.phone = req.body.phone ?? employee.phone;
      employee.address = req.body.address ?? employee.address;
    } else {
      // HR / Admin
      Object.assign(employee, req.body);
    }

    await employee.save();
    res.status(200).json({ success: true, message: 'Employee updated.', data: employee });
  } catch (error) {
    next(error);
  }
};

export const getEmployee360 = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('salaryStructureId');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    if (req.user.role === 'EMPLOYEE' && employee.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const [attendance, leaves, payslips] = await Promise.all([
      Attendance.find({ companyId: req.user.companyId, employeeId: employee._id }).sort({ date: -1 }).limit(10),
      LeaveRequest.find({ companyId: req.user.companyId, employeeId: employee._id }).populate('leaveTypeId', 'name code').sort({ createdAt: -1 }).limit(5),
      Payslip.find({ companyId: req.user.companyId, employeeId: employee._id, status: 'FINALIZED' }).sort({ year: -1, month: -1 }).limit(6),
    ]);

    res.status(200).json({
      success: true,
      data: {
        profile: employee,
        recentAttendance: attendance,
        recentLeaves: leaves,
        recentPayslips: payslips,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Simple CSV export (plain text CSV without external library)
export const exportCsv = async (req, res, next) => {
  try {
    const employees = await Employee.find({ companyId: req.user.companyId }).populate('departmentId', 'name').sort({ employeeCode: 1 });

    let csv = 'employeeCode,firstName,lastName,email,phone,department\n';
    for (const e of employees) {
      const dept = e.departmentId?.name || '';
      csv += `"${e.employeeCode}","${e.firstName}","${e.lastName}","${e.email}","${e.phone || ''}","${dept}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// Simple CSV import
export const importCsv = async (req, res, next) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) return res.status(400).json({ success: false, message: 'csvContent is required.' });

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return res.status(400).json({ success: false, message: 'CSV has no data rows.' });

    let importedCount = 0;
    const errors = [];

    // Header: employeeCode,firstName,lastName,email,joiningDate,basicSalary
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((item) => item.replace(/(^"|"$)/g, '').trim());
      const [code, first, last, email, joinDate, salary] = row;

      if (!code || !first || !last || !email) {
        errors.push({ row: i + 1, message: 'Missing required fields' });
        continue;
      }

      const existing = await Employee.findOne({ companyId: req.user.companyId, employeeCode: code.toUpperCase() });
      if (existing) {
        errors.push({ row: i + 1, message: `Code ${code} already exists` });
        continue;
      }

      const user = await User.create({
        companyId: req.user.companyId,
        email: email.toLowerCase(),
        password: 'ChangeMe123!',
        role: 'EMPLOYEE',
        mustChangePassword: true,
      });

      const emp = await Employee.create({
        companyId: req.user.companyId,
        userId: user._id,
        employeeCode: code.toUpperCase(),
        firstName: first,
        lastName: last,
        email: email.toLowerCase(),
        joiningDate: joinDate ? new Date(joinDate) : new Date(),
      });

      user.employeeId = emp._id;
      await user.save();
      importedCount++;
    }

    res.status(200).json({ success: true, importedCount, errors });
  } catch (error) {
    next(error);
  }
};
