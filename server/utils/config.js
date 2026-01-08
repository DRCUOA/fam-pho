require('dotenv').config();
const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    cookie: {
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
      sameSite: process.env.SESSION_COOKIE_SAMESITE || 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  database: {
    path: process.env.DB_PATH || path.join(__dirname, '../../database/fam-pho.db'),
  },

  storage: {
    basePath: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
    incoming: process.env.STORAGE_INCOMING || path.join(__dirname, '../../storage/_incoming'),
    masters: process.env.STORAGE_MASTERS || path.join(__dirname, '../../storage/masters'),
    derivatives: process.env.STORAGE_DERIVATIVES || path.join(__dirname, '../../storage/derivatives'),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB default
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/tiff').split(','),
  },

  security: {
    csrfSecret: process.env.CSRF_SECRET || 'dev-csrf-secret-change-in-production',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
    },
  },

  backup: {
    path: process.env.BACKUP_PATH || path.join(__dirname, '../../backups'),
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || null,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log'),
  },

  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    keyPath: process.env.HTTPS_KEY_PATH || '',
    certPath: process.env.HTTPS_CERT_PATH || '',
  },
};

// Validate required configuration
if (config.env === 'production') {
  if (config.session.secret === 'dev-secret-change-in-production') {
    throw new Error('SESSION_SECRET must be set in production');
  }
  if (!config.https.enabled && !process.env.BEHIND_PROXY) {
    console.warn('Warning: HTTPS not enabled in production. Ensure reverse proxy handles HTTPS.');
  }
}

module.exports = config;
