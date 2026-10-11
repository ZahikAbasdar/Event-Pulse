const { validationResult } = require('express-validator');
const AdminAccessRequest = require('../models/AdminAccessRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');

function hasEducationEmail(email) {
  const domain = email.toLowerCase().split('@')[1] || '';
  return domain.endsWith('.edu') || domain.endsWith('.edu.in');
}

exports.getMyRequest = asyncHandler(async (req, res) => {
  const request = await AdminAccessRequest.findOne({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, request });
});

exports.createRequest = asyncHandler(async (req, res) => {
  if (!hasEducationEmail(req.user.email)) {
    throw new ApiError(400, 'Admin access requests require an .edu or .edu.in account email.');
  }
  if (['super_admin', 'org_admin'].includes(req.user.role)) {
    throw new ApiError(409, 'Your account already has an admin role.');
  }

  const pending = await AdminAccessRequest.findOne({ user: req.user._id, status: 'pending' });
  if (pending) throw new ApiError(409, 'Your admin access request is already awaiting review.');

  const organization = req.user.organization
    ? req.user.organization
    : await Organization.findOne({ slug: 'pcte' }).select('_id');
  if (!organization) throw new ApiError(500, 'No organization is configured for this account.');
  let request;
  try {
    request = await AdminAccessRequest.create({
      user: req.user._id,
      organization: organization._id || organization,
      reason: typeof req.body.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 1000)
        : 'Applicant requested organization-admin access using an education email.',
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Your admin access request is already awaiting review.');
    throw err;
  }

  await logAudit({
    organization: request.organization,
    actor: req.user._id,
    action: 'admin_access.requested',
    entityType: 'AdminAccessRequest',
    entityId: request._id,
    ip: req.ip,
  });
  res.status(201).json({ success: true, request, message: 'Your request was sent to a super admin for review.' });
});

exports.listRequests = asyncHandler(async (req, res) => {
  const requests = await AdminAccessRequest.find({ status: 'pending' })
    .populate('user', 'name email role')
    .sort('createdAt');
  res.json({ success: true, requests });
});

exports.reviewRequest = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Choose approve or reject.', errors.array());

  const { decision } = req.body;
  const request = await AdminAccessRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!request) throw new ApiError(404, 'Pending admin access request not found.');

  if (decision === 'approve') {
    try {
      const user = await User.findByIdAndUpdate(
        request.user,
        { $set: { role: 'org_admin', organization: request.organization, isActive: true } },
        { new: true, runValidators: true }
      );
      if (!user) throw new Error('Applicant account was not found.');
    } catch (err) {
      try {
        await AdminAccessRequest.updateOne(
          { _id: request._id, status: 'approved', reviewedBy: req.user._id },
          { $set: { status: 'pending', reviewedBy: null, reviewedAt: null } }
        );
      } catch (rollbackError) {
        console.error('[admin-access] Failed to roll back request approval:', rollbackError.message);
      }
      throw new ApiError(500, 'Could not approve this request. The applicant account was not updated.');
    }
  }

  await logAudit({
    organization: request.organization,
    actor: req.user._id,
    action: `admin_access.${decision === 'approve' ? 'approved' : 'rejected'}`,
    entityType: 'AdminAccessRequest',
    entityId: request._id,
    ip: req.ip,
    metadata: { applicant: request.user },
  });
  res.json({ success: true, request, message: `Admin access request ${decision === 'approve' ? 'approved' : 'rejected'}.` });
});
