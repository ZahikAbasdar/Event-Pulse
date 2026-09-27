const Media = require('../models/Media');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { UPLOAD_DIR } = require('../middleware/upload');
const objectStorage = require('../utils/objectStorage');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// @route POST /api/events/:eventId/media — upload via Multer to object or local storage
// Only platform-uploaded media may be shown; nothing here ever accepts an external URL.
exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const type = req.file.mimetype.startsWith('video') ? 'video' : 'photo';
  const extension = path.extname(req.file.originalname).toLowerCase();
  const fileName = `${crypto.randomUUID()}${extension}`;
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'eventpulse-media';
  let url;

  if (objectStorage.isConfigured()) {
    await objectStorage.uploadObject({
      bucket,
      objectPath: fileName,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });
    url = objectStorage.getPublicObjectUrl({ bucket, objectPath: fileName });
  } else {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), req.file.buffer, { flag: 'wx' });
    url = `/uploads/${fileName}`;
  }

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
