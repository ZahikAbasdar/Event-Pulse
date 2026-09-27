const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    speaker: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    venue: { type: String, default: '' },
    capacity: { type: Number, default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ event: 1, startTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
