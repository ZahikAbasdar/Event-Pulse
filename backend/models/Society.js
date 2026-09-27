const mongoose = require('mongoose');

const societySchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImageUrl: { type: String, default: null }, // platform-uploaded only
    logoUrl: { type: String, default: null },
    colorTheme: { type: String, default: '#7A1F2B' },
    gallery: [{ url: String, caption: String, uploadedAt: { type: Date, default: Date.now } }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

societySchema.index({ organization: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Society', societySchema);
