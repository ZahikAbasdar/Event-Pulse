require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = require('./app');
const connectDB = require('./config/db');
const { setIO } = require('./utils/socket');
const objectStorage = require('./utils/objectStorage');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

async function start() {
  if (process.env.NODE_ENV === 'production' && !objectStorage.isConfigured()) {
    throw new Error('Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for durable production file storage.');
  }
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate socket connections with the same JWT used for the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous connections for public event pages
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) socket.user = user;
      next();
    } catch (err) {
      next(); // fall back to unauthenticated rather than blocking the socket handshake
    }
  });

  io.on('connection', (socket) => {
    // Organizer dashboards join a room per event to receive only relevant live updates
    socket.on('join:event', (eventId) => {
      if (eventId) socket.join(`event:${eventId}`);
    });
    socket.on('leave:event', (eventId) => {
      if (eventId) socket.leave(`event:${eventId}`);
    });
    // Per-user room for notifications
    if (socket.user) socket.join(`user:${socket.user._id}`);
  });

  setIO(io);

  server.listen(PORT, () => {
    console.log(`[server] EventPulse API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
