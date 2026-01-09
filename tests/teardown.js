/**
 * Global teardown - runs after all tests complete
 * Closes database connections to allow Jest to exit
 */

module.exports = async () => {
  try {
    const pool = require('../server/models/db');
    await pool.end();
  } catch (error) {
    // Ignore errors during teardown
  }
};
