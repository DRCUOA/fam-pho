// Test setup file - runs before all tests

// Set NODE_ENV to test to prevent server from starting
process.env.NODE_ENV = 'test';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  const originalConsole = { ...console };
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: originalConsole.error, // Keep errors visible
  };
}

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific warnings in tests
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
