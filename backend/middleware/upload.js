const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(process.env.MEDIA_UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_SPREADSHEET = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const maxSizeBytes = (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;

const spreadsheetUpload = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_SPREADSHEET.includes(file.mimetype)) return cb(new Error('Only CSV/Excel files are allowed'));
    cb(null, true);
  },
});

const ALLOWED_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav'];
const voiceFeedbackMaxBytes = (Number(process.env.MAX_VOICE_FEEDBACK_MB) || 25) * 1024 * 1024;
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MEDIA.includes(file.mimetype)) return cb(new Error('Only image/video files are allowed'));
    cb(null, true);
  },
});

const voiceFeedbackUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: voiceFeedbackMaxBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_AUDIO.includes(file.mimetype.split(';')[0].toLowerCase())) {
      return cb(new Error('Voice feedback must be a WebM, Ogg, MP4, MP3, or WAV audio file.'));
    }
    cb(null, true);
  },
});

module.exports = { mediaUpload, spreadsheetUpload, voiceFeedbackUpload, UPLOAD_DIR };
