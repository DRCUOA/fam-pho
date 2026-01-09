/**
 * Test authentication helper utilities
 * Provides functions to create authenticated sessions for testing
 */

const request = require('supertest');
const app = require('../../server/index');

/**
 * Create an authenticated session
 * Returns a request agent with cookies set
 */
async function createAuthenticatedSession(email = 'test@example.com', password = 'test123') {
  const agent = request.agent(app);
  
  const response = await agent
    .post('/api/auth/login')
    .send({ email, password });
  
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${response.status} - ${JSON.stringify(response.body)}`);
  }
  
  return agent;
}

/**
 * Create a test user and authenticate
 * Returns { user, library, agent }
 */
async function setupAuthenticatedUser(testDb, email = 'test@example.com') {
  const user = await testDb.createTestUser(email);
  if (!user) {
    throw new Error(`Failed to create test user: ${email}`);
  }
  
  const library = await testDb.createTestLibrary('Test Library', user.id);
  if (!library) {
    throw new Error(`Failed to create test library for user: ${email}`);
  }
  
  await testDb.createLibraryMember(library.id, user.id, 'owner');
  
  const agent = await createAuthenticatedSession(email);
  if (!agent) {
    throw new Error(`Failed to authenticate user: ${email}`);
  }
  
  return { user, library, agent };
}

module.exports = {
  createAuthenticatedSession,
  setupAuthenticatedUser,
};
