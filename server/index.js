const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./utils/config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { attachUser } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const photoRoutes = require('./routes/photos');
const fileRoutes = require('./routes/files');
const peopleRoutes = require('./routes/people');
const tagsRoutes = require('./routes/tags');
const albumsRoutes = require('./routes/albums');
const searchRoutes = require('./routes/search');
const workflowRoutes = require('./routes/workflow');

// Initialize Express app
const app = express();

// Trust proxy (for reverse proxy setups)
if (process.env.BEHIND_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure for production
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.session.cookie.secure,
    httpOnly: true,
    sameSite: config.session.cookie.sameSite,
    maxAge: config.session.cookie.maxAge,
  },
  name: 'fam-pho.sid',
}));

// Attach user to request
app.use(attachUser);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', photoRoutes);
app.use('/api', fileRoutes);
app.use('/api', peopleRoutes);
app.use('/api', tagsRoutes);
app.use('/api', albumsRoutes);
app.use('/api', searchRoutes);
app.use('/api', workflowRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const pool = require('./models/db');
  try {
    // Check database connectivity
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Serve static files in production
if (config.env === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  // Serve index.html for SPA routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info(`Server running on http://${config.host}:${config.port}`);
  logger.info(`Environment: ${config.env}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    const pool = require('./models/db');
    await pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    const pool = require('./models/db');
    await pool.end();
    process.exit(0);
  });
});

module.exports = app;
