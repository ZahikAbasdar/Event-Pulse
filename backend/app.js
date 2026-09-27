const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const societyRoutes = require('./routes/societyRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { manageRouter: competitionManageRoutes } = require('./routes/competitionEventRoutes');
const formRoutes = require('./routes/formRoutes');
const { nestedRouter: teamNestedRoutes, flatRouter: teamFlatRoutes } = require('./routes/teamRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const aiRoutes = require('./routes/aiRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const { UPLOAD_DIR } = require('./middleware/upload');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const supabaseOrigin = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : null;
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'connect-src': ["'self'", 'ws:', 'wss:'],
      'frame-src': ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
      'img-src': ["'self'", 'data:', 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
      'media-src': ["'self'", 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
    },
  },
}));
app.use(
  cors({
    origin: process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Local-development uploads; production media URLs point to object storage.
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'EventPulse API is running', time: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/societies', societyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/competitions', competitionManageRoutes);
app.use('/api/competitions/:competitionEventId', teamNestedRoutes);
app.use('/api/competitions', teamFlatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/youtube', youtubeRoutes);

const frontendIndex = path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html');
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(path.dirname(frontendIndex)));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(frontendIndex);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
