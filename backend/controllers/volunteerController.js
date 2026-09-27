const VolunteerAssignment = require('../models/VolunteerAssignment');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { getIO } = require('../utils/socket');

// @route POST /api/events/:eventId/volunteers/assign
exports.assignVolunteer = asyncHandler(async (req, res) => {
  const { volunteer, task, notes, shiftStart, shiftEnd } = req.body;
  const assignment = await VolunteerAssignment.create({
    organization: req.user.organization,
    event: req.params.eventId,
    volunteer,
    task,
    notes,
    shiftStart,
    shiftEnd,
    assignedBy: req.user._id,
  });

  const notification = await Notification.create({
    organization: req.user.organization,
    recipient: volunteer,
    type: 'system',
    title: 'New volunteer task assigned',
    message: `You've been assigned: ${task}`,
    relatedEvent: req.params.eventId,
  });

  getIO()?.to(`user:${volunteer}`).emit('notification:new', notification);

  res.status(201).json({ success: true, assignment });
});

// @route GET /api/events/:eventId/volunteers
exports.listEventVolunteers = asyncHandler(async (req, res) => {
  const assignments = await VolunteerAssignment.find({ event: req.params.eventId }).populate('volunteer', 'name email').sort('shiftStart');
  res.json({ success: true, assignments });
});

// @route GET /api/volunteers/mine
exports.myAssignments = asyncHandler(async (req, res) => {
  const assignments = await VolunteerAssignment.find({ volunteer: req.user._id }).populate('event', 'title slug').sort('shiftStart');
  res.json({ success: true, assignments });
});

// @route PATCH /api/volunteers/:id/status
exports.updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const assignment = await VolunteerAssignment.findOneAndUpdate(
    { _id: req.params.id, volunteer: req.user._id },
    { status },
    { new: true }
  );
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, assignment });
});
