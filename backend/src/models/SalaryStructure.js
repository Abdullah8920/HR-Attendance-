import mongoose from 'mongoose';

const salaryStructureSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    basicSalary: { type: Number, required: true },
    hra: { type: Number, required: true }, // 40%
    medicalAllowance: { type: Number, required: true }, // 10%
    otherAllowances: { type: Number, default: 0 },
    grossSalary: { type: Number, required: true }, // basic + hra + medical + other (1.5x)
    effectiveFrom: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);
