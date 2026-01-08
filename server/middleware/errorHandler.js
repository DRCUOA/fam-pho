const logger = require('../utils/logger');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.session?.userId,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Default to 500
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { message: err.message, stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
