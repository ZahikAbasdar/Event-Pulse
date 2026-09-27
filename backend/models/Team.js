const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    competitionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetitionEvent', required: true },
    name: { type: String, required: true, trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // max 4 for hackathons, validated in controller
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectTitle: { type: String, default: '' },
    projectDescription: { type: String, default: '' },
    repoUrl: { type: String, default: '' },
    demoUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ['registered', 'submitted', 'disqualified'], default: 'registered' },
  },
  { timestamps: true }
);

teamSchema.index({ competitionEvent: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
