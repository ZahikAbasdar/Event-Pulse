const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password recovery attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  ctrl.register
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().withMessage('A valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  ctrl.login
);

router.post('/forgot-password', passwordResetLimiter, [body('email').isEmail().withMessage('A valid email is required')], ctrl.requestPasswordReset);
router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('A valid reset token is required'),
    body('newPassword').isLength({ min: 12 }).withMessage('New password must be at least 12 characters'),
  ],
  ctrl.resetPassword
);

router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, ctrl.updateMe);
router.patch('/change-password', protect, ctrl.changePassword);

module.exports = router;
