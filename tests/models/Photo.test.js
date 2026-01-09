/**
 * Unit tests for Photo model
 * Tests state transitions and data operations
 */

const Photo = require('../../server/models/Photo');
const testDb = require('../helpers/testDb');

describe('Photo Model', () => {
  let testUser;
  let testLibrary;

  beforeAll(async () => {
    // Clean up before starting
    await testDb.cleanupTestData();
    
    // Create test user and library
    testUser = await testDb.createTestUser('phototest@example.com');
    testLibrary = await testDb.createTestLibrary('Photo Test Library', testUser.id);
    await testDb.createLibraryMember(testLibrary.id, testUser.id, 'owner');
  });

  afterAll(async () => {
    await testDb.cleanupTestData();
  });

  describe('State Transitions', () => {
    let photo;

    beforeEach(async () => {
      // Create a photo in metadata_entry state
      photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
    });

    afterEach(async () => {
      // Clean up photo
      if (photo) {
        await Photo.findById(photo.id).then(p => {
          if (p) {
            const pool = require('../../server/models/db');
            return pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id])
              .then(() => pool.query('DELETE FROM photos WHERE id = $1', [photo.id]));
          }
        }).catch(() => {});
      }
    });

    test('should transition from metadata_entry to complete', async () => {
      const updatedPhoto = await Photo.transitionState(
        photo.id,
        'metadata_entry',
        'complete',
        testUser.id,
        'Metadata entry completed'
      );

      expect(updatedPhoto.current_state).toBe('complete');
      
      // Verify state in database
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('complete');
    });

    test('should create workflow event on state transition', async () => {
      await Photo.transitionState(
        photo.id,
        'metadata_entry',
        'complete',
        testUser.id,
        'Test reason'
      );

      const events = await testDb.getWorkflowEvents(photo.id);
      expect(events).toHaveLength(1);
      expect(events[0].from_state).toBe('metadata_entry');
      expect(events[0].to_state).toBe('complete');
      expect(events[0].actor_user_id).toBe(testUser.id);
      expect(events[0].reason).toBe('Test reason');
    });

    test('should update updated_at timestamp on state transition', async () => {
      const beforeTransition = await Photo.findById(photo.id);
      const beforeTime = new Date(beforeTransition.updated_at).getTime();

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await Photo.transitionState(
        photo.id,
        'metadata_entry',
        'complete',
        testUser.id
      );

      const afterTransition = await Photo.findById(photo.id);
      const afterTime = new Date(afterTransition.updated_at).getTime();

      expect(afterTime).toBeGreaterThan(beforeTime);
    });

    test('should rollback on invalid state transition', async () => {
      // Try to transition from wrong state
      await expect(
        Photo.transitionState(
          photo.id,
          'triage', // Wrong from_state
          'complete',
          testUser.id
        )
      ).rejects.toThrow();

      // Verify state didn't change
      const state = await testDb.getPhotoState(photo.id);
      expect(state).toBe('metadata_entry');
    });

    test('should handle multiple sequential transitions', async () => {
      // Transition to complete
      await Photo.transitionState(
        photo.id,
        'metadata_entry',
        'complete',
        testUser.id,
        'First transition'
      );

      // Verify events
      let events = await testDb.getWorkflowEvents(photo.id);
      expect(events).toHaveLength(1);

      // Update photo state manually for testing (normally wouldn't do this)
      const pool = require('../../server/models/db');
      await pool.query('UPDATE photos SET current_state = $1 WHERE id = $2', ['flagged', photo.id]);

      // Transition from flagged to complete
      await Photo.transitionState(
        photo.id,
        'flagged',
        'complete',
        testUser.id,
        'Second transition'
      );

      events = await testDb.getWorkflowEvents(photo.id);
      expect(events).toHaveLength(2);
      expect(events[1].from_state).toBe('flagged');
      expect(events[1].to_state).toBe('complete');
    });
  });

  describe('Update Operations', () => {
    let photo;

    beforeEach(async () => {
      photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
      });
    });

    afterEach(async () => {
      if (photo) {
        const pool = require('../../server/models/db');
        await pool.query('DELETE FROM photo_workflow_events WHERE photo_id = $1', [photo.id])
          .then(() => pool.query('DELETE FROM photos WHERE id = $1', [photo.id]))
          .catch(() => {});
      }
    });

    test('should update date_taken', async () => {
      const newDate = new Date('2024-01-15');
      const updated = await Photo.update(photo.id, { date_taken: newDate });
      expect(updated.date_taken).toEqual(newDate);
    });

    test('should update location_text', async () => {
      const updated = await Photo.update(photo.id, { location_text: 'Test Location' });
      expect(updated.location_text).toBe('Test Location');
    });

    test('should update description', async () => {
      const updated = await Photo.update(photo.id, { description: 'Test Description' });
      expect(updated.description).toBe('Test Description');
    });

    test('should update multiple fields at once', async () => {
      const newDate = new Date('2024-01-15');
      const updated = await Photo.update(photo.id, {
        date_taken: newDate,
        location_text: 'Test Location',
        description: 'Test Description',
      });

      expect(updated.date_taken).toEqual(newDate);
      expect(updated.location_text).toBe('Test Location');
      expect(updated.description).toBe('Test Description');
    });

    test('should set null values correctly', async () => {
      // First set values
      await Photo.update(photo.id, {
        location_text: 'Test Location',
        description: 'Test Description',
      });

      // Then set to null
      const updated = await Photo.update(photo.id, {
        location_text: null,
        description: null,
      });

      expect(updated.location_text).toBeNull();
      expect(updated.description).toBeNull();
    });

    test('should update updated_at timestamp', async () => {
      const before = await Photo.findById(photo.id);
      const beforeTime = new Date(before.updated_at).getTime();

      await new Promise(resolve => setTimeout(resolve, 10));

      await Photo.update(photo.id, { description: 'Updated' });

      const after = await Photo.findById(photo.id);
      const afterTime = new Date(after.updated_at).getTime();

      expect(afterTime).toBeGreaterThan(beforeTime);
    });
  });

  describe('Count Operations', () => {
    beforeEach(async () => {
      // Create multiple photos in different states
      await testDb.createTestPhoto(testLibrary.id, testUser.id, { current_state: 'metadata_entry' });
      await testDb.createTestPhoto(testLibrary.id, testUser.id, { current_state: 'metadata_entry' });
      await testDb.createTestPhoto(testLibrary.id, testUser.id, { current_state: 'complete' });
      await testDb.createTestPhoto(testLibrary.id, testUser.id, { current_state: 'triage' });
    });

    afterEach(async () => {
      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photo_workflow_events WHERE photo_id IN (SELECT id FROM photos WHERE library_id = $1)', [testLibrary.id]);
      await pool.query('DELETE FROM photos WHERE library_id = $1', [testLibrary.id]);
    });

    test('should count photos by state correctly', async () => {
      const metadataCount = await Photo.countByState(testLibrary.id, 'metadata_entry');
      expect(metadataCount).toBe(2);

      const completeCount = await Photo.countByState(testLibrary.id, 'complete');
      expect(completeCount).toBe(1);

      const triageCount = await Photo.countByState(testLibrary.id, 'triage');
      expect(triageCount).toBe(1);
    });

    test('should exclude rejected photos from count', async () => {
      const rejectedPhoto = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
        current_state: 'metadata_entry',
        is_rejected: true,
      });

      const count = await Photo.countByState(testLibrary.id, 'metadata_entry');
      expect(count).toBe(2); // Should not include rejected photo

      const pool = require('../../server/models/db');
      await pool.query('DELETE FROM photos WHERE id = $1', [rejectedPhoto.id]);
    });
  });
});
