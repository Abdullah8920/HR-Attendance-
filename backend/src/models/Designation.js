import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

designationSchema.index({ companyId: 1, code: 1 }, { unique: true });
designationSchema.index({ companyId: 1, title: 1 }, { unique: true });

export const Designation = mongoose.model('Designation', designationSchema);
