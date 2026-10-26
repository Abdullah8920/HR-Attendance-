import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    currency: { type: String, default: 'PKR' },
    timezone: { type: String, default: 'Asia/Karachi' },
    officeStartTime: { type: String, default: '09:00' },
    officeEndTime: { type: String, default: '18:00' },
    gracePeriodMinutes: { type: Number, default: 15 },
    halfDayThresholdHours: { type: Number, default: 5 },
    weekendDays: { type: [Number], default: [0, 6] }, // Sun, Sat
    officeLatitude: { type: Number },
    officeLongitude: { type: Number },
    officeRadiusMeters: { type: Number, default: 150 },
    isSetupComplete: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model('Company', companySchema);
