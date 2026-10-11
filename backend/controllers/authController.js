const { validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const getPublicBaseUrl = require('../utils/publicUrl');
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

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Enter a valid email address.', errors.array());
  if (!process.env.SMTP_HOST || !(process.env.SMTP_FROM || process.env.SMTP_USER)) {
    throw new ApiError(503, 'Password recovery email is not configured. Contact the service administrator.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  try {
    await transporter.verify();
  } catch (err) {
    console.error('[auth] Password recovery SMTP is unavailable:', err.message);
    throw new ApiError(503, 'Password recovery email is temporarily unavailable. Contact the service administrator.');
  }

  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (user?.isActive) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    try {
      const resetUrl = `${getPublicBaseUrl(req)}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your EventPulse password',
        text: `A password reset was requested for your EventPulse account. Open this link within 30 minutes to choose a new password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      });
    } catch (err) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      console.error('[auth] Password reset email could not be sent:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'If an active account exists for that email, a password reset link has been sent.',
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'The reset link or new password is invalid.', errors.array());

  const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true,
  }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) throw new ApiError(400, 'This password reset link is invalid or has expired. Request a new one.');

  user.password = req.body.newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
  await logAudit({
    organization: user.organization,
    actor: user._id,
    action: 'user.password_reset',
    entityType: 'User',
    entityId: user._id,
    ip: req.ip,
  });
  res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});
