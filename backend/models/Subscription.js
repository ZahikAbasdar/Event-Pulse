const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    seats: { type: Number, default: 5 },
    monthlyEventLimit: { type: Number, default: 3 },
    renewsAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled'], default: 'trialing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
