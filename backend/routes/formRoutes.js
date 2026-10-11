const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/formController');
const { protect, authorize } = require('../middleware/auth');
const { voiceFeedbackUpload } = require('../middleware/upload');

const router = express.Router();
const feedbackSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { success: false, message: 'Too many feedback submissions from this connection. Please try later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const optionalFeedbackUpload = voiceFeedbackUpload.fields([
  { name: 'voiceFeedback', maxCount: 1 },
  { name: 'videoFeedback', maxCount: 1 },
]);

function acceptFeedbackWithoutInvalidOptionalMedia(req, res, next) {
  optionalFeedbackUpload(req, res, (err) => {
    if (!err) return next();

    if ((err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
      || err.code === 'UNSUPPORTED_FEEDBACK_MEDIA') {
      req.files = {};
      req.mediaUploadWarnings = [
        err.code === 'LIMIT_FILE_SIZE'
          ? `Your written feedback was accepted, but an optional recording exceeded the ${Number(process.env.MAX_VOICE_FEEDBACK_MB) || 25} MB per-file limit. Submit without it or choose a smaller file.`
          : 'Your written feedback was accepted, but an optional recording format or file type was not supported.',
      ];
      return next();
    }

    return next(err);
  });
}

// Organizer-only builder routes
router.post('/event-feedback/ensure', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.ensureEventFeedbackForms);
router.get('/', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.listMyForms);
router.post('/', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.createForm);
router.post('/ai-generate', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.aiGenerateForm);
router.get('/:id/responses', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.listResponses);
router.get('/:id/responses/:responseId/voice', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.getVoiceFeedback);
router.get('/:id/responses/:responseId/video', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.getVideoFeedback);
router.get('/:id/responses/export', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.exportResponsesExcel);
router.get('/:id/analytics', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.formAnalytics);

// Public routes — no login required to respond
router.get('/share/:shareSlug', ctrl.getPublicForm);
router.post(
  '/share/:shareSlug/responses',
  feedbackSubmitLimiter,
  acceptFeedbackWithoutInvalidOptionalMedia,
  ctrl.submitPublicResponse
);

module.exports = router;
