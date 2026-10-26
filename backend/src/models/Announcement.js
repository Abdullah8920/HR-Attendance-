import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
    targetAudience: { type: String, enum: ['ALL', 'DEPARTMENT'], default: 'ALL' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
