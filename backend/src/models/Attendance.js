import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'],
      default: 'PRESENT',
    },
    location: {
      latitude: Number,
      longitude: Number,
      withinGeofence: Boolean,
    },
    isCorrected: { type: Boolean, default: false },
    correctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceCorrection' },
  },
  { timestamps: true }
);

// One attendance record per employee per day
attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
