const Media = require('../models/Media');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route POST /api/events/:eventId/media — upload via Multer (see routes for disk storage config)
// Only platform-uploaded media may be shown; nothing here ever accepts an external URL.
exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const type = req.file.mimetype.startsWith('video') ? 'video' : 'photo';
  const url = `/uploads/${req.file.filename}`;

  const media = await Media.create({
    organization: req.user.organization,
    event: req.params.eventId,
    type,
    url,
    caption: req.body.caption || '',
    uploadedBy: req.user._id,
  });

  res.status(201).json({ success: true, media });
});

// @route GET /api/events/:eventId/media (public gallery)
exports.listMedia = asyncHandler(async (req, res) => {
  const media = await Media.find({ event: req.params.eventId }).sort('-createdAt');
  res.json({ success: true, media });
});
