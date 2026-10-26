import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    payrollRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    departmentName: { type: String },
    designationName: { type: String },
    basicSalary: { type: Number, required: true },
    hra: { type: Number, required: true },
    medicalAllowance: { type: Number, required: true },
    otherAllowances: { type: Number, default: 0 },
    grossSalary: { type: Number, required: true },
    workingDaysInMonth: { type: Number, required: true },
    eligibleWorkingDays: { type: Number, required: true },
    proratedGrossSalary: { type: Number, required: true },
    dailySalary: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    attendanceDeductions: { type: Number, default: 0 },
    unpaidLeaveDeductions: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    annualGrossSalary: { type: Number, default: 0 },
    annualTaxLiability: { type: Number, default: 0 },
    monthlyTaxWithheld: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED'],
      default: 'DRAFT',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

payslipSchema.index({ companyId: 1, employeeId: 1, year: 1, month: 1 }, { unique: true });
payslipSchema.index({ payrollRunId: 1 });

export const Payslip = mongoose.model('Payslip', payslipSchema);
