const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    certificateNumber: { type: String, required: true, unique: true },
    pdfBase64: { type: String, required: true }, // stored inline for this phase; swap for object storage URL in production
    issuedAt: { type: Date, default: Date.now },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

certificateSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
