const { validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');
const PUBLIC_SELF_SIGNUP_ROLES = ['participant', 'volunteer', 'sponsor_viewer']; // roles a person can self-register as
// staff roles (org_admin, event_manager, judge) must be invited/promoted by an admin, not self-registered

function sendAuthResponse(res, statusCode, user, token) {
  res
    .status(statusCode)
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      token,
      user: user.toSafeObject ? user.toSafeObject() : user,
    });
}

// @route POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const { name, email, password, role, rollNumber, className, batch, branch, section, block, phone, orgSlug } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const requestedRole = role && PUBLIC_SELF_SIGNUP_ROLES.includes(role) ? role : 'participant';

  let organization = null;
  if (orgSlug) {
    organization = await Organization.findOne({ slug: orgSlug.toLowerCase() });
  }
  if (!organization) {
    organization = await Organization.findOne({ slug: 'pcte' });
  }
  if (!organization) throw new ApiError(500, 'No organization configured. Run the seed script first.');

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: requestedRole,
    organization: organization._id,
    rollNumber,
    className,
    batch,
    branch,
    section,
    block: block || null,
    phone,
  });

  const token = generateToken(user._id);
  await logAudit({ organization: organization._id, actor: user._id, action: 'user.register', entityType: 'User', entityId: user._id, ip: req.ip });

  sendAuthResponse(res, 201, user, token);
});

// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated. Contact your organization admin.');
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  await logAudit({ organization: user.organization, actor: user._id, action: 'user.login', entityType: 'User', entityId: user._id, ip: req.ip });

  sendAuthResponse(res, 200, user, token);
});

// @route POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// @route GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization', 'name slug brandColors logoUrl');
  res.json({ success: true, user });
});

// @route PATCH /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'rollNumber', 'className', 'batch', 'branch', 'section', 'block', 'avatarUrl'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
});

// @route PATCH /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  const token = generateToken(user._id);
  await logAudit({ organization: user.organization, actor: user._id, action: 'user.change_password', entityType: 'User', entityId: user._id, ip: req.ip });
  sendAuthResponse(res, 200, user, token);
});
