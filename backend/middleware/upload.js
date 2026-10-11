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

const AUDIO_MIME_BY_EXTENSION = {
  '.aac': 'audio/aac',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
  '.amr': 'audio/amr',
  '.caf': 'audio/x-caf',
  '.flac': 'audio/flac',
  '.3gp': 'audio/3gpp',
  '.3gpp': 'audio/3gpp',
  '.m4a': 'audio/mp4',
  '.midi': 'audio/midi',
  '.mid': 'audio/midi',
  '.mp3': 'audio/mpeg',
  '.mpa': 'audio/mpeg',
  '.oga': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.weba': 'audio/webm',
  '.wma': 'audio/x-ms-wma',
};
const VIDEO_MIME_BY_EXTENSION = {
  '.asf': 'video/x-ms-asf',
  '.3g2': 'video/3gpp2',
  '.3gp': 'video/3gpp',
  '.3gpp': 'video/3gpp',
  '.avi': 'video/x-msvideo',
  '.divx': 'video/divx',
  '.f4v': 'video/x-f4v',
  '.flv': 'video/x-flv',
  '.m2ts': 'video/mp2t',
  '.m4v': 'video/x-m4v',
  '.mkv': 'video/x-matroska',
  '.mxf': 'video/mxf',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.mpe': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.mts': 'video/mp2t',
  '.ogv': 'video/ogg',
  '.qt': 'video/quicktime',
  '.ts': 'video/mp2t',
  '.vob': 'video/dvd',
  '.webm': 'video/webm',
  '.wmv': 'video/x-ms-wmv',
};
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
  limits: { fileSize: voiceFeedbackMaxBytes, files: 2 },
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype.split(';')[0].toLowerCase();
    const extension = path.extname(file.originalname).toLowerCase();
    const family = file.fieldname === 'voiceFeedback' ? 'audio' : file.fieldname === 'videoFeedback' ? 'video' : null;
    const extensionTypes = family === 'audio' ? AUDIO_MIME_BY_EXTENSION : VIDEO_MIME_BY_EXTENSION;
    if (!family) return cb(new Error('Unexpected feedback upload field.'));

    if (mimeType === 'application/octet-stream' || !mimeType) {
      if (!extensionTypes[extension]) {
        const error = new Error(`Choose a recognized ${family} recording file.`);
        error.code = 'UNSUPPORTED_FEEDBACK_MEDIA';
        return cb(error);
      }
      file.mimetype = extensionTypes[extension];
    } else if (!mimeType.startsWith(`${family}/`)) {
      const error = new Error(`Choose an ${family} recording file for this field.`);
      error.code = 'UNSUPPORTED_FEEDBACK_MEDIA';
      return cb(error);
    }
    cb(null, true);
  },
});

module.exports = {
  mediaUpload,
  spreadsheetUpload,
  voiceFeedbackUpload,
  UPLOAD_DIR,
  AUDIO_MIME_BY_EXTENSION,
  VIDEO_MIME_BY_EXTENSION,
};
