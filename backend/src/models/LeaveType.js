import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    annualQuota: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
