const { validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');
const crypto = require('crypto');
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

  const { name, email, password, role, rollNumber, branch, section, block, phone, orgSlug } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const requestedRole = role && PUBLIC_SELF_SIGNUP_ROLES.includes(role) ? role : 'participant';
  if (requestedRole === 'participant') {
    throw new ApiError(400, 'Participants must sign up using verified phone OTP.');
  }

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
  if (user.role === 'participant' && !user.emailVerified) {
    throw new ApiError(403, 'Use verified phone OTP to access your participant account.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  await logAudit({ organization: user.organization, actor: user._id, action: 'user.login', entityType: 'User', entityId: user._id, ip: req.ip });

  sendAuthResponse(res, 200, user, token);
});

function getPcteOrganization() {
  return Organization.findOne({ slug: 'pcte' });
}

exports.startPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, intent } = req.body;
  if (!/^\+[1-9]\d{7,14}$/.test(phone || '')) {
    throw new ApiError(400, 'Enter a valid phone number in international format, for example +919876543210.');
  }
  if (!['login', 'register'].includes(intent)) throw new ApiError(400, 'Choose sign in or sign up.');

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new ApiError(503, 'Phone verification is not configured. Set the Twilio Verify credentials in backend/.env.');
  }

  const endpoint = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const body = new URLSearchParams({ To: phone, Channel: 'sms' });
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('[auth] Twilio Verify request failed:', err.message);
    throw new ApiError(502, 'Could not contact the phone verification service. Please try again.');
  }

  const result = await response.json();
  if (!response.ok) {
    console.error('[auth] Twilio Verify rejected a request:', result.message || response.statusText);
    throw new ApiError(502, 'The phone verification service could not send a code. Check the number and try again.');
  }
  res.json({ success: true, message: 'Verification code sent by SMS.' });
});

exports.verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, code, intent, profile = {} } = req.body;
  if (!/^\+[1-9]\d{7,14}$/.test(phone || '') || !/^\d{4,10}$/.test(code || '')) {
    throw new ApiError(400, 'Enter the phone number and verification code.');
  }
  if (!['login', 'register'].includes(intent)) throw new ApiError(400, 'Choose sign in or sign up.');

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new ApiError(503, 'Phone verification is not configured. Set the Twilio Verify credentials in backend/.env.');
  }

  const endpoint = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const body = new URLSearchParams({ To: phone, Code: code });
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('[auth] Twilio Verify check failed:', err.message);
    throw new ApiError(502, 'Could not contact the phone verification service. Please try again.');
  }
  const result = await response.json();
  if (!response.ok) {
    console.error('[auth] Twilio Verify check returned an error:', result.message || response.statusText);
    throw new ApiError(502, 'The phone verification service could not validate that code.');
  }
  if (result.status !== 'approved') throw new ApiError(401, 'That verification code is invalid or expired.');

  let user = await User.findOne({ phone, role: 'participant' });
  if (intent === 'login') {
    if (!user) throw new ApiError(404, 'No participant account is registered with this phone number. Sign up first.');
    user.phoneVerified = true;
  } else {
    const { name, email, rollNumber, className, batch, branch, section, block } = profile;
    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
      throw new ApiError(400, 'For phone sign-up, provide your name and a valid email address.');
    }
    if (user || await User.findOne({ email: email.toLowerCase() })) {
      throw new ApiError(409, 'An account already exists for that phone number or email. Sign in instead.');
    }
    const organization = await getPcteOrganization();
    if (!organization) throw new ApiError(500, 'No PCTE organization is configured. Run the seed script first.');
    user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'),
      role: 'participant',
      organization: organization._id,
      phone,
      phoneVerified: true,
      emailVerified: false,
      rollNumber,
      className,
      batch,
      branch,
      section,
      block: block || null,
    });
    await logAudit({ organization: organization._id, actor: user._id, action: 'user.register.phone_verified', entityType: 'User', entityId: user._id, ip: req.ip });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = generateToken(user._id);
  await logAudit({ organization: user.organization, actor: user._id, action: 'user.login.phone_verified', entityType: 'User', entityId: user._id, ip: req.ip });
  sendAuthResponse(res, intent === 'register' ? 201 : 200, user, token);
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
