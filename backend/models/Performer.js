const mongoose = require('mongoose');

const performerSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    actType: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    logisticsNotes: { type: String, default: '' },
    slotTime: { type: Date, default: null },
    feedbackFormLink: { type: String, default: null }, // performers get their own sub-form
  },
  { timestamps: true }
);

module.exports = mongoose.model('Performer', performerSchema);
