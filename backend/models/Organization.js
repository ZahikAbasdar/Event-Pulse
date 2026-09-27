const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: null },
    brandColors: {
      primary: { type: String, default: '#7A1F2B' }, // PCTE maroon
      accent: { type: String, default: '#C9A227' }, // PCTE gold
    },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    billingStatus: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled'], default: 'trialing' },
    usage: {
      eventsThisMonth: { type: Number, default: 0 },
      registrationsThisMonth: { type: Number, default: 0 },
      storageMB: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
