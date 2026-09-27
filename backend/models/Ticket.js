const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    competitionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetitionEvent', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeName: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // unique code embedded in QR, used for idempotent check-in
    qrDataUrl: { type: String, default: null }, // cached QR image (base64 data URL)
    status: { type: String, enum: ['valid', 'checked_in', 'cancelled', 'expired'], default: 'valid' },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    checkInGate: { type: String, default: null }, // which scanner/gate performed check-in
    feedbackUrl: { type: String, default: null }, // public link to this event's feedback form, if one exists
    feedbackQrDataUrl: { type: String, default: null }, // QR image encoding feedbackUrl — scan it, land on the feedback form
    feedbackSubmitted: { type: Boolean, default: false },
    metadata: {
      rollNumber: String,
      branch: String,
      section: String,
      block: String,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ event: 1, user: 1 });
ticketSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
