import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    month: { type: Number, required: true }, // 1 - 12
    year: { type: Number, required: true },
    workingDaysInMonth: { type: Number, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED'],
      default: 'DRAFT',
    },
    employeeCount: { type: Number, default: 0 },
    totalGrossSalary: { type: Number, default: 0 },
    totalAttendanceDeductions: { type: Number, default: 0 },
    totalUnpaidLeaveDeductions: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalNetSalary: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finalizedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

payrollRunSchema.index({ companyId: 1, year: 1, month: 1 }, { unique: true });

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
