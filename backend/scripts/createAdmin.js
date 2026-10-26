import mongoose from 'mongoose';
import dns from 'dns';
import { Company } from '../src/models/Company.js';
import { User } from '../src/models/User.js';
import { LeaveType } from '../src/models/LeaveType.js';
import { config } from '../src/config/env.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const seed = async () => {
  try {
    if (!config.adminPassword) throw new Error('Set ADMIN_PASSWORD before creating an admin account.');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const existingCompany = await Company.findOne();
    if (existingCompany) {
      console.log('Company already initialized.');
      process.exit(0);
    }

    const company = await Company.create({
      name: 'Saylani HCM Enterprises',
      email: config.adminEmail,
      officeStartTime: '09:00',
      officeEndTime: '18:00',
      gracePeriodMinutes: 15,
      weekendDays: [0, 6],
    });

    await LeaveType.insertMany([
      { companyId: company._id, name: 'Casual Leave', code: 'CASUAL', annualQuota: 10, isPaid: true },
      { companyId: company._id, name: 'Sick Leave', code: 'SICK', annualQuota: 8, isPaid: true },
      { companyId: company._id, name: 'Annual Leave', code: 'ANNUAL', annualQuota: 14, isPaid: true },
      { companyId: company._id, name: 'Unpaid Leave', code: 'UNPAID', annualQuota: 0, isPaid: false },
    ]);

    const admin = await User.create({
      companyId: company._id,
      email: config.adminEmail,
      password: config.adminPassword,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    });

    console.log('Admin account created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${config.adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
