const crypto = require('crypto');
const Organization = require('../models/Organization');
const Subscription = require('../models/Subscription');
const Webhook = require('../models/Webhook');
const Escalation = require('../models/Escalation');
const AuditLog = require('../models/AuditLog');
const Event = require('../models/Event');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route GET /api/admin/organizations (super_admin only)
exports.listOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find().sort('-createdAt');
  res.json({ success: true, organizations: orgs });
});

// @route GET /api/admin/organizations/:id/usage
exports.getOrganizationUsage = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new ApiError(404, 'Organization not found');
  const [eventCount, userCount, subscription] = await Promise.all([
    Event.countDocuments({ organization: org._id }),
    User.countDocuments({ organization: org._id }),
    Subscription.findOne({ organization: org._id }),
  ]);
  res.json({ success: true, organization: org, eventCount, userCount, subscription });
});

// @route GET /api/admin/benchmarking — cross-institution benchmarking (super_admin)
exports.crossInstitutionBenchmark = asyncHandler(async (req, res) => {
  const orgs = await Organization.find();
  const benchmark = await Promise.all(
    orgs.map(async (org) => {
      const events = await Event.find({ organization: org._id });
      const totalRegistrations = events.reduce((s, e) => s + (e.stats.registrations || 0), 0);
      const totalCheckIns = events.reduce((s, e) => s + (e.stats.checkIns || 0), 0);
      return {
        organization: org.name,
        plan: org.plan,
        eventCount: events.length,
        totalRegistrations,
        totalCheckIns,
        checkInRate: totalRegistrations ? Number(((totalCheckIns / totalRegistrations) * 100).toFixed(1)) : 0,
      };
    })
  );
  res.json({ success: true, benchmark: benchmark.sort((a, b) => b.totalRegistrations - a.totalRegistrations) });
});

// @route GET /api/admin/audit-logs — compliance/audit-log viewer, paginated + filterable
exports.listAuditLogs = asyncHandler(async (req, res) => {
  const { action, actor, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (req.user.role !== 'super_admin') filter.organization = req.user.organization;
  if (action) filter.action = action;
  if (actor) filter.actor = actor;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('actor', 'name email role').sort('-createdAt').skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, logs, pagination: { page: Number(page), limit: Number(limit), total } });
});

// --- Webhooks ---
// @route POST /api/admin/webhooks
exports.createWebhook = asyncHandler(async (req, res) => {
  const { url, events } = req.body;
  const webhook = await Webhook.create({ organization: req.user.organization, url, events, secret: crypto.randomBytes(24).toString('hex') });
  res.status(201).json({ success: true, webhook });
});

// @route GET /api/admin/webhooks
exports.listWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await Webhook.find({ organization: req.user.organization });
  res.json({ success: true, webhooks });
});

// @route DELETE /api/admin/webhooks/:id
exports.deleteWebhook = asyncHandler(async (req, res) => {
  await Webhook.findOneAndDelete({ _id: req.params.id, organization: req.user.organization });
  res.json({ success: true, message: 'Webhook deleted' });
});

// --- Escalations (SLA) ---
// @route POST /api/admin/escalations
exports.createEscalation = asyncHandler(async (req, res) => {
  const { title, description, severity, assignedTo } = req.body;
  const escalation = await Escalation.create({
    organization: req.user.organization, title, description, severity, assignedTo, raisedBy: req.user._id,
  });
  res.status(201).json({ success: true, escalation });
});

// @route GET /api/admin/escalations
exports.listEscalations = asyncHandler(async (req, res) => {
  const escalations = await Escalation.find({ organization: req.user.organization }).populate('raisedBy assignedTo', 'name email').sort('-createdAt');
  res.json({ success: true, escalations });
});

// @route PATCH /api/admin/escalations/:id
exports.updateEscalation = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'resolved') updates.resolvedAt = new Date();
  const escalation = await Escalation.findOneAndUpdate({ _id: req.params.id, organization: req.user.organization }, updates, { new: true });
  if (!escalation) throw new ApiError(404, 'Escalation not found');
  res.json({ success: true, escalation });
});
