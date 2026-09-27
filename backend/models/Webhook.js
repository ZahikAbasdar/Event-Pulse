const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    url: { type: String, required: true },
    events: [{ type: String }], // e.g. ['ticket.checkin', 'event.create']
    secret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date, default: null },
    lastStatus: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Webhook', webhookSchema);
