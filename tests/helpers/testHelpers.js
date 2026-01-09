/**
 * Additional test helper utilities
 */

/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

/**
 * Retry a function with exponential backoff
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

/**
 * Create a test error handler that doesn't fail tests
 */
function createTestErrorHandler() {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    res.status(error.status || 500).json({
      error: error.message || 'Internal server error',
    });
  };
}

module.exports = {
  waitFor,
  retry,
  createTestErrorHandler,
};
