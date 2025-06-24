import mongoose from 'mongoose';

const dailyUsageSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD format
  model: { type: String, required: true },
  usageType: { type: String, required: true, enum: ['public', 'userKey'] },
  totalCost: { type: Number, required: true, default: 0 },
  requestCount: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Number, required: true, default: Date.now }
});

// Create compound index for efficient queries
dailyUsageSchema.index({ date: 1, model: 1, usageType: 1 }, { unique: true });

export const DailyUsage = mongoose.models.DailyUsage || mongoose.model('DailyUsage', dailyUsageSchema);
