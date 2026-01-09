/**
 * API Integration Tests for Metadata Review and Update Flow
 * Tests the complete flow: update metadata → complete photo → verify queue updates
 */

const request = require('supertest');
const app = require('../../server/index');
const testDb = require('../helpers/testDb');
const testAuth = require('../helpers/testAuth');

describe('Metadata Review and Update API', () => {
  let testUser;
  let testLibrary;
  let authAgent;

  beforeAll(async () => {
    await testDb.cleanupTestData();
    
    // Set up authenticated user
    const setup = await testAuth.setupAuthenticatedUser(testDb, 'metadatatest@example.com');
    testUser = setup.user;
    testLibrary = setup.library;
    authAgent = setup.agent;
  });

  afterAll(async () => {
    await testDb.cleanupTestData();
  });

  describe('PUT /api/photos/:id - Update Metadata', () => {
    let photo;

    beforeEach(async () => {
      photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);
    });

    afterEach(async () => {
      if (photo) {
        const pool = require('../../server/models/db');
        await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
      }
    });

    test('should update photo metadata successfully', async () => {
      const updateData = {
        date_taken: '2024-01-15',
        location_text: 'Test Location',
        description: 'Test Description',
      };

      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.photo).toBeDefined();
      expect(response.body.photo.id).toBe(photo.id);
      expect(response.body.photo.date_taken).toBeTruthy();
      expect(response.body.photo.location_text).toBe('Test Location');
      expect(response.body.photo.description).toBe('Test Description');
    });

    test('should handle partial updates', async () => {
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: 'Partial Update' })
        .expect(200);

      expect(response.body.photo.location_text).toBe('Partial Update');
    });

    test('should handle null values', async () => {
      // First set values
      await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: 'Test', description: 'Test' })
        .expect(200);

      // Then set to null
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: null, description: null })
        .expect(200);

      expect(response.body.photo.location_text).toBeNull();
      expect(response.body.photo.description).toBeNull();
    });

    test('should handle empty strings as null', async () => {
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: '', description: '' })
        .expect(200);

      expect(response.body.photo.location_text).toBeNull();
      expect(response.body.photo.description).toBeNull();
    });

    test('should validate date_taken format', async () => {
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ date_taken: 'invalid-date' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(app)
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: 'Test' })
        .expect(401);
    });

    test('should require contributor role', async () => {
      // Create viewer user
      const viewer = await testDb.createTestUser('viewer@example.com');
      await testDb.createLibraryMember(testLibrary.id, viewer.id, 'viewer');
      const viewerAgent = await testAuth.createAuthenticatedSession('viewer@example.com');

      await viewerAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: 'Test' })
        .expect(403);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM library_members WHERE user_id = $1', [viewer.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [viewer.id]);
    });

    test('should not change photo state on metadata update', async () => {
      const beforeState = await testDb.getPhotoState(photo.id);
      expect(beforeState).toBe('metadata_entry');

      await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ location_text: 'Test' })
        .expect(200);

      const afterState = await testDb.getPhotoState(photo.id);
      expect(afterState).toBe('metadata_entry'); // State should not change
    });
  });

  describe('POST /api/photos/:id/complete - Complete Photo', () => {
    let photo;

    beforeEach(async () => {
      photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);
    });

    afterEach(async () => {
      if (photo) {
        const pool = require('../../server/models/db');
        await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
      }
    });

    test('should complete photo from metadata_entry state', async () => {
      const response = await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      expect(response.body.photo).toBeDefined();
      expect(response.body.photo.current_state).toBe('complete');
      expect(response.body.message).toBe('Photo marked as complete');

      // Verify state in database
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('complete');
    });

    test('should create workflow event on completion', async () => {
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      const events = await testDb.getWorkflowEvents(photo.id);
      expect(events.length).toBeGreaterThan(0);
      
      const completeEvent = events.find(e => e.to_state === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent.from_state).toBe('metadata_entry');
      expect(completeEvent.to_state).toBe('complete');
    });

    test('should reject completion from wrong state', async () => {
      // Change photo to triage state
      const pool = require('../../server/models/db');
      await pool.query('UPDATE photos SET current_state = $1 WHERE id = $2', ['triage', photo.id]);

      const response = await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(400);

      expect(response.body.error).toContain('not in metadata_entry state');

      // Verify state didn't change
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('triage');
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/photos/${photo.id}/complete`)
        .expect(401);
    });

    test('should require contributor role', async () => {
      const viewer = await testDb.createTestUser('viewer2@example.com');
      await testDb.createLibraryMember(testLibrary.id, viewer.id, 'viewer');
      const viewerAgent = await testAuth.createAuthenticatedSession('viewer2@example.com');

      await viewerAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(403);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM library_members WHERE user_id = $1', [viewer.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [viewer.id]);
    });
  });

  describe('End-to-End Metadata Flow', () => {
    let photo1, photo2;

    beforeEach(async () => {
      // Create two photos in metadata_entry state
      photo1 = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      photo2 = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo1.id);
      await testDb.createTestPhotoFile(photo2.id);
    });

    afterEach(async () => {
      if (photo1) {
        const pool = require('../../server/models/db');
        await pool.query('DELETE FROM photo_workflow_events WHERE photo_id IN ($1, $2)', [photo1.id, photo2.id]);
        await pool.query('DELETE FROM photo_files WHERE photo_id IN ($1, $2)', [photo1.id, photo2.id]);
        await pool.query('DELETE FROM photos WHERE id IN ($1, $2)', [photo1.id, photo2.id]);
      }
    });

    test('should complete full metadata flow: update → complete → verify queue', async () => {
      // Step 1: Verify initial queue count
      let initialCount = await testDb.countPhotosByState(testLibrary.id, 'metadata_entry');
      expect(initialCount).toBeGreaterThanOrEqual(2);

      // Step 2: Update metadata for photo1
      await authAgent
        .put(`/api/photos/${photo1.id}`)
        .send({
          date_taken: '2024-01-15',
          location_text: 'Test Location',
          description: 'Test Description',
        })
        .expect(200);

      // Step 3: Verify state is still metadata_entry
      let state = await testDb.getPhotoState(photo1.id);
      expect(state).toBe('metadata_entry');

      // Step 4: Complete the photo
      await authAgent
        .post(`/api/photos/${photo1.id}/complete`)
        .expect(200);

      // Step 5: Verify state transitioned to complete
      state = await testDb.getPhotoState(photo1.id);
      expect(state).toBe('complete');

      // Step 6: Verify queue count decreased
      let newCount = await testDb.countPhotosByState(testLibrary.id, 'metadata_entry');
      expect(newCount).toBe(initialCount - 1);

      // Step 7: Verify photo1 is not in metadata_entry queue
      const queueResponse = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}`)
        .expect(200);

      const photoIds = queueResponse.body.photos.map(p => p.id);
      expect(photoIds).not.toContain(photo1.id);
      expect(photoIds).toContain(photo2.id); // photo2 should still be there
    });

    test('should handle rapid sequential updates and completion', async () => {
      // Update metadata multiple times rapidly
      await Promise.all([
        authAgent.put(`/api/photos/${photo1.id}`).send({ location_text: 'Location 1' }),
        authAgent.put(`/api/photos/${photo1.id}`).send({ location_text: 'Location 2' }),
        authAgent.put(`/api/photos/${photo1.id}`).send({ location_text: 'Location 3' }),
      ]);

      // Verify final state
      const response = await authAgent
        .get(`/api/photos/${photo1.id}`)
        .expect(200);

      expect(response.body.photo.location_text).toBe('Location 3');

      // Complete photo
      await authAgent
        .post(`/api/photos/${photo1.id}/complete`)
        .expect(200);

      // Verify completion
      const state = await testDb.getPhotoState(photo1.id);
      expect(state).toBe('complete');
    });

    test('should handle concurrent updates to different photos', async () => {
      // Update both photos concurrently
      await Promise.all([
        authAgent.put(`/api/photos/${photo1.id}`).send({ location_text: 'Location 1' }),
        authAgent.put(`/api/photos/${photo2.id}`).send({ location_text: 'Location 2' }),
      ]);

      // Verify both updates succeeded
      const response1 = await authAgent.get(`/api/photos/${photo1.id}`).expect(200);
      const response2 = await authAgent.get(`/api/photos/${photo2.id}`).expect(200);

      expect(response1.body.photo.location_text).toBe('Location 1');
      expect(response2.body.photo.location_text).toBe('Location 2');

      // Complete both photos
      await Promise.all([
        authAgent.post(`/api/photos/${photo1.id}/complete`).expect(200),
        authAgent.post(`/api/photos/${photo2.id}/complete`).expect(200),
      ]);

      // Verify both are complete
      const state1 = await testDb.getPhotoState(photo1.id);
      const state2 = await testDb.getPhotoState(photo2.id);
      expect(state1).toBe('complete');
      expect(state2).toBe('complete');
    });

    test('should verify workflow events are created correctly', async () => {
      // Update and complete
      await authAgent.put(`/api/photos/${photo1.id}`).send({ location_text: 'Test' }).expect(200);
      await authAgent.post(`/api/photos/${photo1.id}/complete`).expect(200);

      // Check workflow events
      const events = await testDb.getWorkflowEvents(photo1.id);
      
      // Should have at least one event (the completion)
      expect(events.length).toBeGreaterThan(0);
      
      const completeEvent = events.find(e => e.to_state === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent.from_state).toBe('metadata_entry');
      expect(completeEvent.actor_user_id).toBe(testUser.id);
    });
  });

  describe('Queue Refresh After Completion', () => {
    let photo;

    beforeEach(async () => {
      photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);
    });

    afterEach(async () => {
      if (photo) {
        const pool = require('../../server/models/db');
        await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
        await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
      }
    });

    test('should remove completed photo from metadata_entry queue', async () => {
      // Get initial queue
      const beforeResponse = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}`)
        .expect(200);

      const beforePhotoIds = beforeResponse.body.photos.map(p => p.id);
      expect(beforePhotoIds).toContain(photo.id);

      // Complete photo
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      // Wait a moment for database consistency
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get updated queue
      const afterResponse = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}`)
        .expect(200);

      const afterPhotoIds = afterResponse.body.photos.map(p => p.id);
      expect(afterPhotoIds).not.toContain(photo.id);
      expect(afterResponse.body.count).toBe(beforeResponse.body.count - 1);
    });

    test('should update next-tasks queue count after completion', async () => {
      // Get initial next tasks
      const beforeResponse = await authAgent
        .get(`/api/workflow/next-tasks?library_id=${testLibrary.id}`)
        .expect(200);

      const beforeCount = beforeResponse.body.queues.metadata_entry.count;
      expect(beforeCount).toBeGreaterThan(0);

      // Complete photo
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      // Wait a moment for database consistency
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get updated next tasks
      const afterResponse = await authAgent
        .get(`/api/workflow/next-tasks?library_id=${testLibrary.id}`)
        .expect(200);

      const afterCount = afterResponse.body.queues.metadata_entry.count;
      expect(afterCount).toBe(beforeCount - 1);
    });
  });
});
