import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { LeaveType } from '../models/LeaveType.js';
import { config } from '../config/env.js';
import { logAudit } from '../utils/audit.js';

export const setupFirstRun = async (req, res, next) => {
  try {
    const { companyName, companyEmail, adminEmail, adminPassword, officeStartTime, officeEndTime, gracePeriodMinutes } = req.body;

    if (!companyName || !companyEmail || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'companyName, companyEmail, adminEmail, and adminPassword are required.' });
    }

    const existingCompany = await Company.findOne();
    if (existingCompany) {
      return res.status(409).json({ success: false, message: 'First-run setup has already been completed.' });
    }

    // Create Company
    const company = await Company.create({
      name: companyName.trim(),
      email: companyEmail.toLowerCase().trim(),
      officeStartTime: officeStartTime || '09:00',
      officeEndTime: officeEndTime || '18:00',
      gracePeriodMinutes: gracePeriodMinutes || 15,
      weekendDays: [0, 6],
    });

    // Default Leave Types
    await LeaveType.insertMany([
      { companyId: company._id, name: 'Casual Leave', code: 'CASUAL', annualQuota: 10, isPaid: true },
      { companyId: company._id, name: 'Sick Leave', code: 'SICK', annualQuota: 8, isPaid: true },
      { companyId: company._id, name: 'Annual Leave', code: 'ANNUAL', annualQuota: 14, isPaid: true },
      { companyId: company._id, name: 'Unpaid Leave', code: 'UNPAID', annualQuota: 0, isPaid: false },
    ]);

    // Create First Admin
    const admin = await User.create({
      companyId: company._id,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    });

    const token = jwt.sign(
      { userId: admin._id, role: admin.role, companyId: company._id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    await logAudit({
      companyId: company._id,
      actorUserId: admin._id,
      role: 'ADMIN',
      action: 'SETUP_FIRST_RUN',
      entityType: 'Company',
      entityId: company._id,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Setup completed successfully.',
      data: {
        company: { id: company._id, name: company.name },
        user: { id: admin._id, email: admin.email, role: admin.role },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, companyId: user.companyId, employeeId: user.employeeId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    await logAudit({
      companyId: user.companyId,
      actorUserId: user._id,
      role: user.role,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          employeeId: user.employeeId,
          mustChangePassword: user.mustChangePassword,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid oldPassword and newPassword (min 6 chars) are required.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

export const createHR = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const hr = await User.create({
      companyId: req.user.companyId,
      email: email.toLowerCase().trim(),
      password,
      role: 'HR',
      isActive: true,
      mustChangePassword: true,
    });

    await logAudit({
      companyId: req.user.companyId,
      actorUserId: req.user.userId,
      role: 'ADMIN',
      action: 'CREATE_HR',
      entityType: 'User',
      entityId: hr._id,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'HR account created.',
      data: { id: hr._id, email: hr.email, role: hr.role },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
    }

    const user = await User.findOne({ _id: id, companyId: req.user.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = Boolean(isActive);
    await user.save();

    res.status(200).json({ success: true, message: `User status updated to ${user.isActive ? 'active' : 'inactive'}.` });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'newPassword must be at least 6 characters.' });
    }

    const user = await User.findOne({ _id: id, companyId: req.user.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getDemoAccounts = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        role: 'ADMIN',
        email: config.adminEmail || 'admin@saylanihcm.com',
        password: config.adminPassword || 'AdminPassword123!',
        label: 'Admin (Full Access)',
        description: 'Complete system control, settings, audit logs & payroll finalization'
      },
      {
        role: 'HR',
        email: 'hr@saylanihcm.com',
        password: 'HrPassword123!',
        label: 'HR Manager',
        description: 'Employee management, leave approvals, attendance tracking & payroll drafting'
      },
      {
        role: 'EMPLOYEE',
        email: 'employee@saylanihcm.com',
        password: 'EmployeePassword123!',
        label: 'Employee (Hamza Khan)',
        description: 'Personal self-service, check in/out, view payslips & apply for leaves'
      }
    ]
  });
};

export const seedDemoUsers = async (req, res, next) => {
  try {
    const { seedDatabase } = await import('../../scripts/seedAll.js');
    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo accounts (Admin, HR, Employee) initialized successfully.',
      data: result.accounts
    });
  } catch (error) {
    next(error);
  }
};

