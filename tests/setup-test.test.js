/**
 * Setup Test - Verifies test environment is working
 * Run this first to diagnose issues
 */

describe('Test Setup Verification', () => {
  test('NODE_ENV should be test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should be able to require app', () => {
    expect(() => {
      const app = require('../server/index');
      expect(app).toBeDefined();
    }).not.toThrow();
  });

  test('should be able to require database pool', async () => {
    expect(() => {
      const pool = require('../server/models/db');
      expect(pool).toBeDefined();
    }).not.toThrow();
  });

  test('should be able to connect to database', async () => {
    const pool = require('../server/models/db');
    try {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}. Make sure PostgreSQL is running and configured correctly.`);
    }
  });

  test('should be able to require test helpers', () => {
    expect(() => {
      const testDb = require('./helpers/testDb');
      const testAuth = require('./helpers/testAuth');
      expect(testDb).toBeDefined();
      expect(testAuth).toBeDefined();
    }).not.toThrow();
  });
});
