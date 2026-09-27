const mongoose = require('mongoose');

const volunteerAssignmentSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: String, required: true },
    notes: { type: String, default: '' },
    shiftStart: { type: Date, required: true },
    shiftEnd: { type: Date, required: true },
    status: { type: String, enum: ['assigned', 'confirmed', 'completed', 'no_show'], default: 'assigned' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerAssignment', volunteerAssignmentSchema);
