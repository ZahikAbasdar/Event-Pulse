const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    type: { type: String, enum: ['photo', 'video'], required: true },
    url: { type: String, required: true }, // platform-uploaded only, never hotlinked
    caption: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

mediaSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
