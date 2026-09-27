const mongoose = require('mongoose');

const competitionEventSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, // parent fest, e.g. Koshish 2026
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['group', 'solo', 'dramatics', 'literary', 'creative_fine_art', 'sports', 'esports', 'other'],
      default: 'other',
    },
    format: { type: String, enum: ['individual', 'team'], default: 'individual' },
    teamSize: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 1 },
    },
    pointsSystem: {
      first: { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third: { type: Number, default: 0 },
      participation: { type: Number, default: 0 },
    },
    timeAllowed: { type: String, default: '' }, // human readable e.g. "3-5 minutes"
    rules: [{ type: String }], // bullet list of rules, sourced from official rule book
    hasPreliminaryRound: { type: Boolean, default: false },
    coverImageUrl: { type: String, default: null },
    schedule: {
      date: { type: Date, default: null },
      venue: { type: String, default: '' },
    },
    judgingCriteria: [{ type: String }],
    orderIndex: { type: Number, default: 0 }, // display order on the fest page
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

competitionEventSchema.index({ event: 1, slug: 1 }, { unique: true });
competitionEventSchema.index({ event: 1, orderIndex: 1 });

module.exports = mongoose.model('CompetitionEvent', competitionEventSchema);
