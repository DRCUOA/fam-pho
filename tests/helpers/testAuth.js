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
  
  await agent
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  
  return agent;
}

/**
 * Create a test user and authenticate
 * Returns { user, library, agent }
 */
async function setupAuthenticatedUser(testDb, email = 'test@example.com') {
  const user = await testDb.createTestUser(email);
  const library = await testDb.createTestLibrary('Test Library', user.id);
  await testDb.createLibraryMember(library.id, user.id, 'owner');
  
  const agent = await createAuthenticatedSession(email);
  
  return { user, library, agent };
}

module.exports = {
  createAuthenticatedSession,
  setupAuthenticatedUser,
};
