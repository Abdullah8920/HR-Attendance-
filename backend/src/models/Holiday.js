import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

holidaySchema.index({ companyId: 1, date: 1 }, { unique: true });

export const Holiday = mongoose.model('Holiday', holidaySchema);
