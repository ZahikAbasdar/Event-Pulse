const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // number for rating/nps, string for choice/open_text
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    respondentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null if anonymous public link
    academicInfo: {
      name: String,
      rollNumber: String,
      className: String,
      batch: String,
      branch: String,
      section: String,
      block: String,
      phone: String,
      email: String,
    },
    answers: [answerSchema],
    voiceFeedback: {
      fileName: { type: String, default: null },
      mimeType: { type: String, default: null },
      originalName: { type: String, default: null },
      sizeBytes: { type: Number, default: null },
    },
    npsScore: { type: Number, default: null }, // extracted from any 'nps' question, for fast aggregation
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative', null], default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

responseSchema.index({ form: 1, createdAt: -1 });
responseSchema.index({ event: 1 });
responseSchema.index({ form: 1, submittedAt: -1 });

module.exports = mongoose.model('Response', responseSchema);
