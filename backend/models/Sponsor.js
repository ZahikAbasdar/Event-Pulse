const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    tier: { type: String, enum: ['title', 'gold', 'silver', 'bronze', 'partner'], default: 'partner' },
    logoUrl: { type: String, default: null },
    contactUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // a sponsor_viewer user scoped to this sponsor
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
