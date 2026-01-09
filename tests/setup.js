// Test setup file - runs before all tests

// Set NODE_ENV to test to prevent server from starting
process.env.NODE_ENV = 'test';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Increase timeout for database operations
jest.setTimeout(30000);
