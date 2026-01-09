/**
 * Test database helper utilities
 * Provides functions to set up and tear down test database state
 */

const pool = require('../../server/models/db');
const argon2 = require('argon2');

/**
 * Clean up test data
 */
async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete in reverse order of foreign key dependencies
    // Get test user IDs first to avoid complex subqueries
    const testUsers = await client.query('SELECT id FROM users WHERE email LIKE $1', ['test%@example.com']);
    const testUserIds = testUsers.rows.map(u => u.id);
    
    if (testUserIds.length === 0) {
      await client.query('COMMIT');
      return;
    }
    
    // Get test library IDs
    const testLibraries = await client.query('SELECT id FROM libraries WHERE created_by = ANY($1)', [testUserIds]);
    const testLibraryIds = testLibraries.rows.map(l => l.id);
    
    if (testLibraryIds.length > 0) {
      // Get test photo IDs
      const testPhotos = await client.query('SELECT id FROM photos WHERE library_id = ANY($1)', [testLibraryIds]);
      const testPhotoIds = testPhotos.rows.map(p => p.id);
      
      if (testPhotoIds.length > 0) {
        await client.query('DELETE FROM photo_workflow_events WHERE photo_id = ANY($1)', [testPhotoIds]);
        await client.query('DELETE FROM photo_tags WHERE photo_id = ANY($1)', [testPhotoIds]);
        await client.query('DELETE FROM photo_people WHERE photo_id = ANY($1)', [testPhotoIds]);
        await client.query('DELETE FROM photo_albums WHERE photo_id = ANY($1)', [testPhotoIds]);
        await client.query('DELETE FROM photo_files WHERE photo_id = ANY($1)', [testPhotoIds]);
      }
      
      await client.query('DELETE FROM photos WHERE library_id = ANY($1)', [testLibraryIds]);
      await client.query('DELETE FROM library_members WHERE library_id = ANY($1)', [testLibraryIds]);
      await client.query('DELETE FROM people WHERE library_id = ANY($1)', [testLibraryIds]);
      await client.query('DELETE FROM tags WHERE library_id = ANY($1)', [testLibraryIds]);
      await client.query('DELETE FROM albums WHERE library_id = ANY($1)', [testLibraryIds]);
    }
    
    await client.query('DELETE FROM libraries WHERE created_by = ANY($1)', [testUserIds]);
    await client.query('DELETE FROM users WHERE id = ANY($1)', [testUserIds]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    // Don't throw - just log, as cleanup failures shouldn't break tests
    if (process.env.DEBUG) {
      console.error('Cleanup error (non-fatal):', error.message);
    }
  } finally {
    client.release();
  }
}

/**
 * Create a test user
 */
async function createTestUser(email = 'test@example.com', password = 'test123', displayName = 'Test User') {
  const passwordHash = await argon2.hash(password);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING *`,
    [email, passwordHash, displayName]
  );
  return result.rows[0];
}

/**
 * Create a test library
 */
async function createTestLibrary(name = 'Test Library', createdBy) {
  const result = await pool.query(
    `INSERT INTO libraries (name, created_by)
     VALUES ($1, $2)
     RETURNING *`,
    [name, createdBy]
  );
  return result.rows[0];
}

/**
 * Create a library member
 */
async function createLibraryMember(libraryId, userId, role = 'owner') {
  const result = await pool.query(
    `INSERT INTO library_members (library_id, user_id, role, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING *`,
    [libraryId, userId, role]
  );
  return result.rows[0];
}

/**
 * Create a test photo
 */
async function createTestPhoto(libraryId, uploadedBy, options = {}) {
  const {
    current_state = 'metadata_entry',
    date_taken = null,
    location_text = null,
    description = null,
    is_rejected = false,
  } = options;

  const result = await pool.query(
    `INSERT INTO photos (library_id, uploaded_by, current_state, date_taken, location_text, description, is_rejected)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [libraryId, uploadedBy, current_state, date_taken, location_text, description, is_rejected]
  );
  return result.rows[0];
}

/**
 * Create a test photo file
 */
async function createTestPhotoFile(photoId, options = {}) {
  const {
    kind = 'master',
    storage_key = `test/${photoId}/test.jpg`,
    filename = 'test.jpg',
    mime_type = 'image/jpeg',
    bytes = 1024,
    width = 1920,
    height = 1080,
  } = options;

  const result = await pool.query(
    `INSERT INTO photo_files (photo_id, kind, storage_key, filename, mime_type, bytes, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [photoId, kind, storage_key, filename, mime_type, bytes, width, height]
  );
  return result.rows[0];
}

/**
 * Get photo with current state
 */
async function getPhotoState(photoId) {
  const result = await pool.query('SELECT current_state FROM photos WHERE id = $1', [photoId]);
  return result.rows[0]?.current_state;
}

/**
 * Get workflow events for a photo
 */
async function getWorkflowEvents(photoId) {
  const result = await pool.query(
    'SELECT * FROM photo_workflow_events WHERE photo_id = $1 ORDER BY created_at ASC',
    [photoId]
  );
  return result.rows;
}

/**
 * Count photos by state
 */
async function countPhotosByState(libraryId, state) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM photos
     WHERE library_id = $1 AND current_state = $2 AND is_rejected = FALSE AND deleted_at IS NULL`,
    [libraryId, state]
  );
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  cleanupTestData,
  createTestUser,
  createTestLibrary,
  createLibraryMember,
  createTestPhoto,
  createTestPhotoFile,
  getPhotoState,
  getWorkflowEvents,
  countPhotosByState,
};
