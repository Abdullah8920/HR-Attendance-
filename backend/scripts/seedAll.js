import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Company } from '../src/models/Company.js';
import { User } from '../src/models/User.js';
import { Employee } from '../src/models/Employee.js';
import { Department } from '../src/models/Department.js';
import { Designation } from '../src/models/Designation.js';
import { LeaveType } from '../src/models/LeaveType.js';
import { SalaryStructure } from '../src/models/SalaryStructure.js';
import { Attendance } from '../src/models/Attendance.js';
import { LeaveRequest } from '../src/models/LeaveRequest.js';
import { Announcement } from '../src/models/Announcement.js';
import { config } from '../src/config/env.js';
import { formatDate } from '../src/utils/dateUtils.js';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
      console.log('Connected to MongoDB Atlas');
    }

    // 1. Company
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'Saylani HCM Enterprises',
        email: 'info@saylanihcm.com',
        officeStartTime: '09:00',
        officeEndTime: '18:00',
        gracePeriodMinutes: 15,
        halfDayThresholdHours: 5,
        weekendDays: [0, 6],
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        isSetupComplete: true,
      });
      console.log('Created Company:', company.name);
    }

    // 2. Default Leave Types
    const leaveTypesData = [
      { name: 'Casual Leave', code: 'CASUAL', annualQuota: 10, isPaid: true },
      { name: 'Sick Leave', code: 'SICK', annualQuota: 8, isPaid: true },
      { name: 'Annual Leave', code: 'ANNUAL', annualQuota: 14, isPaid: true },
      { name: 'Unpaid Leave', code: 'UNPAID', annualQuota: 0, isPaid: false },
    ];

    for (const lt of leaveTypesData) {
      const exists = await LeaveType.findOne({ companyId: company._id, code: lt.code });
      if (!exists) {
        await LeaveType.create({ companyId: company._id, ...lt });
      }
    }

    // 3. Departments & Designations
    let engDept = await Department.findOne({ companyId: company._id, code: 'ENG' });
    if (!engDept) {
      engDept = await Department.create({
        companyId: company._id,
        name: 'Engineering',
        code: 'ENG',
        description: 'Software Engineering and DevOps',
        isActive: true,
      });
    }

    let hrDept = await Department.findOne({ companyId: company._id, code: 'HR' });
    if (!hrDept) {
      hrDept = await Department.create({
        companyId: company._id,
        name: 'Human Resources',
        code: 'HR',
        description: 'Human Resources & Talent Management',
        isActive: true,
      });
    }

    let sweDesig = await Designation.findOne({ companyId: company._id, code: 'SR_SWE' });
    if (!sweDesig) {
      sweDesig = await Designation.create({
        companyId: company._id,
        departmentId: engDept._id,
        title: 'Senior Software Engineer',
        code: 'SR_SWE',
        isActive: true,
      });
    }

    let hrDesig = await Designation.findOne({ companyId: company._id, code: 'HR_MGR' });
    if (!hrDesig) {
      hrDesig = await Designation.create({
        companyId: company._id,
        departmentId: hrDept._id,
        title: 'HR Manager',
        code: 'HR_MGR',
        isActive: true,
      });
    }

    // 4. ADMIN USER
    const adminEmail = (config.adminEmail || 'admin@saylanihcm.com').toLowerCase().trim();
    if (!config.adminPassword) throw new Error('Set ADMIN_PASSWORD before seeding demo accounts.');
    const adminPassword = config.adminPassword;
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        companyId: company._id,
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
      });
      console.log(`Created ADMIN: ${adminEmail}`);
    } else {
      adminUser.password = adminPassword;
      adminUser.role = 'ADMIN';
      adminUser.isActive = true;
      adminUser.mustChangePassword = false;
      await adminUser.save();
      console.log(`Updated ADMIN: ${adminEmail}`);
    }

    // 5. HR USER
    const hrEmail = 'hr@saylanihcm.com';
    const hrPassword = 'HrPassword123!';
    let hrUser = await User.findOne({ email: hrEmail });
    if (!hrUser) {
      hrUser = await User.create({
        companyId: company._id,
        email: hrEmail,
        password: hrPassword,
        role: 'HR',
        isActive: true,
        mustChangePassword: false,
      });
      console.log(`Created HR: ${hrEmail}`);
    } else {
      hrUser.password = hrPassword;
      hrUser.role = 'HR';
      hrUser.isActive = true;
      hrUser.mustChangePassword = false;
      await hrUser.save();
      console.log(`Updated HR: ${hrEmail}`);
    }

    // 6. EMPLOYEE USER & EMPLOYEE PROFILE
    const employeeEmail = 'employee@saylanihcm.com';
    const employeePassword = 'EmployeePassword123!';
    let empUser = await User.findOne({ email: employeeEmail });
    if (!empUser) {
      empUser = await User.create({
        companyId: company._id,
        email: employeeEmail,
        password: employeePassword,
        role: 'EMPLOYEE',
        isActive: true,
        mustChangePassword: false,
      });
      console.log(`Created EMPLOYEE user: ${employeeEmail}`);
    } else {
      empUser.password = employeePassword;
      empUser.role = 'EMPLOYEE';
      empUser.isActive = true;
      empUser.mustChangePassword = false;
      await empUser.save();
      console.log(`Updated EMPLOYEE user: ${employeeEmail}`);
    }

    // Employee document for Hamza Khan
    let employeeDoc = await Employee.findOne({ companyId: company._id, email: employeeEmail });
    if (!employeeDoc) {
      employeeDoc = await Employee.create({
        companyId: company._id,
        userId: empUser._id,
        employeeCode: 'EMP-001',
        firstName: 'Hamza',
        lastName: 'Khan',
        email: employeeEmail,
        phone: '+92-300-1234567',
        address: 'Karachi, Pakistan',
        departmentId: engDept._id,
        designationId: sweDesig._id,
        employmentStatus: 'ACTIVE',
        joiningDate: new Date('2025-01-15'),
      });
      console.log('Created Employee profile for Hamza Khan (EMP-001)');
    } else {
      employeeDoc.userId = empUser._id;
      employeeDoc.departmentId = engDept._id;
      employeeDoc.designationId = sweDesig._id;
      await employeeDoc.save();
    }

    empUser.employeeId = employeeDoc._id;
    await empUser.save();

    // 7. Salary Structure for Employee
    let salary = await SalaryStructure.findOne({ employeeId: employeeDoc._id, isActive: true });
    if (!salary) {
      salary = await SalaryStructure.create({
        companyId: company._id,
        employeeId: employeeDoc._id,
        basicSalary: 90000,
        hra: 36000,
        medicalAllowance: 9000,
        otherAllowances: 15000,
        grossSalary: 150000,
        effectiveFrom: new Date('2025-01-15'),
        isActive: true,
      });
      employeeDoc.salaryStructureId = salary._id;
      await employeeDoc.save();
    }

    // 8. Sample Attendance for Employee
    const todayStr = formatDate(new Date());
    const existingAtt = await Attendance.findOne({
      companyId: company._id,
      employeeId: employeeDoc._id,
      date: todayStr,
    });

    if (!existingAtt) {
      const now = new Date();
      const inTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 5, 0);
      await Attendance.create({
        companyId: company._id,
        employeeId: employeeDoc._id,
        date: todayStr,
        checkIn: inTime,
        status: 'PRESENT',
        workingMinutes: 0,
      });
    }

    // Also seed yesterday's full attendance
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    const existingYestAtt = await Attendance.findOne({
      companyId: company._id,
      employeeId: employeeDoc._id,
      date: yesterdayStr,
    });

    if (!existingYestAtt) {
      const yCheckIn = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 2, 0);
      const yCheckOut = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 18, 5, 0);
      await Attendance.create({
        companyId: company._id,
        employeeId: employeeDoc._id,
        date: yesterdayStr,
        checkIn: yCheckIn,
        checkOut: yCheckOut,
        status: 'PRESENT',
        workingMinutes: 543,
      });
    }

    // 9. Sample Announcement
    const existingAnnouncement = await Announcement.findOne({ companyId: company._id });
    if (!existingAnnouncement) {
      await Announcement.create({
        companyId: company._id,
        createdBy: adminUser._id,
        title: 'Welcome to Saylani HCM Enterprise Portal',
        message: 'All staff members are requested to log their attendance daily and review their updated leave balances.',
        priority: 'HIGH',
        targetAudience: 'ALL',
        isActive: true,
      });
    }

    console.log('✅ Demo accounts seeded successfully:');
    console.log('--------------------------------------------------');
    console.log(`ADMIN:    ${adminEmail}  |  ${adminPassword}`);
    console.log(`HR:       ${hrEmail}     |  ${hrPassword}`);
    console.log(`EMPLOYEE: ${employeeEmail}  |  ${employeePassword}`);
    console.log('--------------------------------------------------');

    return {
      success: true,
      accounts: [
        { role: 'ADMIN', email: adminEmail, password: adminPassword, name: 'System Administrator' },
        { role: 'HR', email: hrEmail, password: hrPassword, name: 'HR Manager' },
        { role: 'EMPLOYEE', email: employeeEmail, password: employeePassword, name: 'Hamza Khan (Senior SWE)' },
      ],
    };
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  }
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seedAll.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
