# Test Suite for Metadata Review and Update Flow

This directory contains comprehensive automated tests for the metadata review and update workflow.

## Test Structure

### Unit Tests
- `models/Photo.test.js` - Tests for Photo model state transitions and data operations

### API Integration Tests
- `api/metadata.test.js` - Main integration tests for metadata update and completion flow
- `api/metadata-edge-cases.test.js` - Edge cases, error scenarios, and race conditions

### Test Helpers
- `helpers/testDb.js` - Database utilities for test setup and cleanup
- `helpers/testAuth.js` - Authentication helpers for creating test sessions

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- tests/api/metadata.test.js
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Coverage

The test suite covers:

1. **State Transitions**
   - Transition from `metadata_entry` to `complete`
   - Workflow event creation
   - State validation
   - Multiple sequential transitions

2. **Metadata Updates**
   - Update date_taken, location_text, description
   - Partial updates
   - Null value handling
   - Empty string handling
   - Validation

3. **End-to-End Flow**
   - Update metadata → Complete photo → Verify queue update
   - Rapid sequential updates
   - Concurrent updates to different photos

4. **Queue Management**
   - Queue count updates after completion
   - Photo removal from metadata_entry queue
   - Next-tasks queue updates

5. **Edge Cases**
   - Non-existent photo IDs
   - Invalid data formats
   - Double completion prevention
   - Race conditions
   - Concurrent operations
   - Queue pagination

6. **Error Handling**
   - Authentication requirements
   - Authorization (role-based access)
   - Invalid state transitions
   - Data validation errors

## Test Database

Tests use the same database as the application. The test helpers automatically:
- Clean up test data before and after test runs
- Create isolated test users and libraries
- Clean up photos, files, and workflow events

**Important**: Tests will delete data matching test email patterns (`test%@example.com`). Ensure your development database doesn't contain important data with these email addresses.

## Writing New Tests

### Example: Testing a new metadata field

```javascript
const testDb = require('../helpers/testDb');
const testAuth = require('../helpers/testAuth');

describe('New Metadata Field', () => {
  let authAgent;
  let photo;

  beforeAll(async () => {
    const setup = await testAuth.setupAuthenticatedUser(testDb);
    authAgent = setup.agent;
  });

  beforeEach(async () => {
    photo = await testDb.createTestPhoto(testLibrary.id, testUser.id, {
      current_state: 'metadata_entry',
    });
  });

  afterEach(async () => {
    // Cleanup
  });

  test('should update new field', async () => {
    const response = await authAgent
      .put(`/api/photos/${photo.id}`)
      .send({ new_field: 'value' })
      .expect(200);

    expect(response.body.photo.new_field).toBe('value');
  });
});
```

## Debugging Tests

### Enable debug logging
```bash
DEBUG=1 npm test
```

### Run single test
```bash
npm test -- -t "should update photo metadata successfully"
```

### Inspect test database
Tests use the same database connection. You can query the database during test runs to inspect state.

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure:
1. Database is set up and migrated
2. Environment variables are configured
3. Test database is isolated or properly cleaned
