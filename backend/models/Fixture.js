const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    competitionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetitionEvent', required: true },
    round: { type: String, required: true }, // e.g. "Quarterfinal", "Round 1"
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    status: { type: String, enum: ['scheduled', 'live', 'completed'], default: 'scheduled' },
    scheduledAt: { type: Date, default: null },
    venue: { type: String, default: '' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fixture', fixtureSchema);
