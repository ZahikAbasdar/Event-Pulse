const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    competitionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetitionEvent', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // for individual/solo events
    judge: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    round: { type: String, default: 'final' },
    criteriaScores: [{ criterion: String, score: Number, weight: { type: Number, default: 1 } }],
    totalScore: { type: Number, required: true },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
);

scoreSchema.index({ competitionEvent: 1, judge: 1, team: 1, round: 1 }, { unique: true, partialFilterExpression: { team: { $type: 'objectId' } } });

module.exports = mongoose.model('Score', scoreSchema);
