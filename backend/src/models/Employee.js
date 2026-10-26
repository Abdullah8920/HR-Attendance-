import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeCode: { type: String, required: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
    employmentStatus: {
      type: String,
      enum: ['ACTIVE', 'PROBATION', 'ON_LEAVE', 'TERMINATED', 'RESIGNED'],
      default: 'ACTIVE',
    },
    joiningDate: { type: Date, required: true },
    exitDate: { type: Date },
    salaryStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
    gender: { type: String },
  },
  { timestamps: true }
);

employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const Employee = mongoose.model('Employee', employeeSchema);
