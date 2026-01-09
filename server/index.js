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

// Health check endpoint (at root level, before auth middleware)
app.get('/health', async (req, res) => {
  const pool = require('./models/db');
  const startTime = process.uptime();
  
  try {
    // Check database connectivity
    const dbResult = await pool.query('SELECT NOW() as db_time, version() as db_version');
    const dbTime = dbResult.rows[0].db_time;
    const dbVersion = dbResult.rows[0].db_version.split(' ')[0] + ' ' + dbResult.rows[0].db_version.split(' ')[1];
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(startTime),
      environment: config.env,
      database: {
        status: 'connected',
        time: dbTime,
        version: dbVersion,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(startTime),
      environment: config.env,
      database: {
        status: 'disconnected',
        error: error.message,
      },
    });
  }
});

// Attach user to request
app.use(attachUser);

// API routes
// Note: More specific routes (like /photos/search, /photos/:id/complete) must be registered BEFORE
// parameterized routes (like /photos/:id) to avoid route conflicts
app.use('/api/auth', authRoutes);
const libraryRoutes = require('./routes/libraries');
app.use('/api', libraryRoutes);
app.use('/api', uploadRoutes);
app.use('/api', searchRoutes); // Register before photoRoutes to handle /photos/search
app.use('/api', workflowRoutes); // Register before photoRoutes to handle /photos/:id/complete
app.use('/api', photoRoutes);
app.use('/api', fileRoutes);
app.use('/api', peopleRoutes);
app.use('/api', tagsRoutes);
app.use('/api', albumsRoutes);

// Legacy health check endpoint (kept for backward compatibility)
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

// Serve static files (client application)
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html for SPA routes (catch-all for client-side routing)
app.get('*', (req, res, next) => {
  // Skip API routes and health check
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server (skip in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, config.host, () => {
    logger.info(`Server running on http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.env}`);
  });
}

// Graceful shutdown (skip in test environment)
if (process.env.NODE_ENV !== 'test' && server) {
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
}

module.exports = app;
