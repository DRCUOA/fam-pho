/**
 * Edge Cases and Error Scenarios for Metadata Flow
 * Tests error handling, race conditions, and edge cases
 */

const request = require('supertest');
const app = require('../../server/index');
const testDb = require('../helpers/testDb');
const testAuth = require('../helpers/testAuth');

describe('Metadata Flow - Edge Cases and Error Scenarios', () => {
  let testUser;
  let testLibrary;
  let authAgent;

  beforeAll(async () => {
    await testDb.cleanupTestData();
    
    const setup = await testAuth.setupAuthenticatedUser(testDb, 'edgecasetest@example.com');
    testUser = setup.user;
    testLibrary = setup.library;
    authAgent = setup.agent;
  });

  afterAll(async () => {
    await testDb.cleanupTestData();
  });

  describe('Error Handling', () => {
    test('should handle non-existent photo ID', async () => {
      const fakeId = 999999;
      
      await authAgent
        .put(`/api/photos/${fakeId}`)
        .send({ location_text: 'Test' })
        .expect(404);

      await authAgent
        .post(`/api/photos/${fakeId}/complete`)
        .expect(404);
    });

    test('should handle invalid photo ID format', async () => {
      await authAgent
        .put('/api/photos/invalid-id')
        .send({ location_text: 'Test' })
        .expect(400);

      await authAgent
        .post('/api/photos/invalid-id/complete')
        .expect(400);
    });

    test('should handle missing required fields gracefully', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Empty body should be fine (no-op update)
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({})
        .expect(200);

      expect(response.body.photo).toBeDefined();

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should handle very long text fields', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      const longText = 'A'.repeat(10000);
      
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ description: longText })
        .expect(200);

      expect(response.body.photo.description).toBe(longText);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should handle special characters in text fields', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      const specialText = 'Test "quotes" & <tags> & \'apostrophes\' & "more"';
      
      const response = await authAgent
        .put(`/api/photos/${photo.id}`)
        .send({ description: specialText })
        .expect(200);

      expect(response.body.photo.description).toBe(specialText);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });
  });

  describe('State Transition Edge Cases', () => {
    test('should prevent double completion', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // First completion should succeed
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      // Second completion should fail
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(400);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should handle completion attempt after state change', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Manually change state to something else
      const pool = require('../../server/models/db');
      await pool.query('UPDATE photos SET current_state = $1 WHERE id = $2', ['flagged', photo.id]);

      // Completion should fail
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(400);

      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should handle rapid state transitions', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Try to complete multiple times rapidly
      const promises = [
        authAgent.post(`/api/photos/${photo.id}/complete`),
        authAgent.post(`/api/photos/${photo.id}/complete`),
        authAgent.post(`/api/photos/${photo.id}/complete`),
      ];

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successes.length).toBe(1);

      // Verify final state
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('complete');

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });
  });

  describe('Concurrency and Race Conditions', () => {
    test('should handle concurrent metadata updates', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Update same photo concurrently
      const updates = [
        { location_text: 'Location 1' },
        { location_text: 'Location 2' },
        { location_text: 'Location 3' },
      ];

      const results = await Promise.all(
        updates.map(data => authAgent.put(`/api/photos/${photo.id}`).send(data))
      );

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
      });

      // Final state should be one of the values
      const finalResponse = await authAgent.get(`/api/photos/${photo.id}`).expect(200);
      expect(['Location 1', 'Location 2', 'Location 3']).toContain(finalResponse.body.photo.location_text);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should handle update and complete race condition', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Try to update and complete simultaneously
      const [updateResult, completeResult] = await Promise.allSettled([
        authAgent.put(`/api/photos/${photo.id}`).send({ location_text: 'Race Test' }),
        authAgent.post(`/api/photos/${photo.id}/complete`),
      ]);

      // Both operations should complete (order doesn't matter)
      expect(updateResult.status).toBe('fulfilled');
      expect(completeResult.status).toBe('fulfilled');

      // Photo should end up complete
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('complete');

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });
  });

  describe('Queue Consistency', () => {
    test('should maintain queue consistency after multiple completions', async () => {
      // Create multiple photos
      const photos = [];
      for (let i = 0; i < 5; i++) {
        const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
          current_state: 'metadata_entry',
        });
        await testDb.createTestPhotoFile(photo.id);
        photos.push(photo);
      }

      // Get initial count
      const initialCount = await testDb.countPhotosByState(testLibrary.id, 'metadata_entry');
      expect(initialCount).toBeGreaterThanOrEqual(5);

      // Complete all photos
      await Promise.all(
        photos.map(photo => authAgent.post(`/api/photos/${photo.id}/complete`).expect(200))
      );

      // Wait for consistency
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify queue count
      const finalCount = await testDb.countPhotosByState(testLibrary.id, 'metadata_entry');
      expect(finalCount).toBe(initialCount - 5);

      // Verify queue endpoint
      const queueResponse = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}`)
        .expect(200);

      const queuePhotoIds = queueResponse.body.photos.map(p => p.id);
      photos.forEach(photo => {
        expect(queuePhotoIds).not.toContain(photo.id);
      });

      // Cleanup
      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = ANY($1)', [photos.map(p => p.id)]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = ANY($1)', [photos.map(p => p.id)]);
      await pool.query('DELETE FROM photos WHERE id = ANY($1)', [photos.map(p => p.id)]);
    });

    test('should handle queue pagination correctly after completion', async () => {
      // Create enough photos to require pagination
      const photos = [];
      for (let i = 0; i < 10; i++) {
        const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
          current_state: 'metadata_entry',
        });
        await testDb.createTestPhotoFile(photo.id);
        photos.push(photo);
      }

      // Complete first 5 photos
      await Promise.all(
        photos.slice(0, 5).map(photo => 
          authAgent.post(`/api/photos/${photo.id}/complete`).expect(200)
        )
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      // Get queue with pagination
      const page1 = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}&limit=5&offset=0`)
        .expect(200);

      const page2 = await authAgent
        .get(`/api/photos/metadata-entry?library_id=${testLibrary.id}&limit=5&offset=5`)
        .expect(200);

      // Verify completed photos are not in either page
      const allPhotoIds = [...page1.body.photos, ...page2.body.photos].map(p => p.id);
      photos.slice(0, 5).forEach(photo => {
        expect(allPhotoIds).not.toContain(photo.id);
      });

      // Cleanup
      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = ANY($1)', [photos.map(p => p.id)]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = ANY($1)', [photos.map(p => p.id)]);
      await pool.query('DELETE FROM photos WHERE id = ANY($1)', [photos.map(p => p.id)]);
    });
  });

  describe('Data Integrity', () => {
    test('should preserve metadata after state transition', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      const metadata = {
        date_taken: '2024-01-15',
        location_text: 'Test Location',
        description: 'Test Description',
      };

      // Update metadata
      await authAgent
        .put(`/api/photos/${photo.id}`)
        .send(metadata)
        .expect(200);

      // Complete photo
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      // Verify metadata is preserved
      const response = await authAgent
        .get(`/api/photos/${photo.id}`)
        .expect(200);

      expect(response.body.photo.location_text).toBe(metadata.location_text);
      expect(response.body.photo.description).toBe(metadata.description);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });

    test('should maintain workflow event history', async () => {
      const photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
      await testDb.createTestPhotoFile(photo.id);

      // Complete photo
      await authAgent
        .post(`/api/photos/${photo.id}/complete`)
        .expect(200);

      // Verify workflow events
      const events = await testDb.getWorkflowEvents(photo.id);
      expect(events.length).toBeGreaterThan(0);

      // Should have completion event
      const completeEvent = events.find(e => e.to_state === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent.from_state).toBe('metadata_entry');
      expect(completeEvent.actor_user_id).toBe(testUser.id);

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photo_files WHERE photo_id = $1', [photo.id]);
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
    });
  });
});
