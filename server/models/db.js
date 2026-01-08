const { Pool } = require('pg');
const config = require('../utils/config');
const logger = require('../utils/logger');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.connectionString,
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log database operations in development
if (config.env === 'development') {
  pool.on('connect', (client) => {
    logger.debug('New client connected to database');
  });

  pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', err);
  });
}

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
  } else {
    logger.info('Database connected successfully');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  logger.info('Database connection pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  logger.info('Database connection pool closed');
  process.exit(0);
});

module.exports = pool;
