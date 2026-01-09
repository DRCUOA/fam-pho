# Test Troubleshooting Guide

## Common Issues and Fixes

### 1. Server Starting During Tests

**Problem**: Server tries to start when importing `server/index.js` in tests.

**Fix**: Set `NODE_ENV=test` before importing the app. This is handled in `tests/setup.js`.

### 2. Database Connection Issues

**Problem**: Tests fail with database connection errors.

**Fix**: 
- Ensure PostgreSQL is running
- Check `.env` file has correct database credentials
- Verify database exists: `psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='fam_pho';"`

### 3. Authentication Failures

**Problem**: Login tests fail with 401 errors.

**Fix**:
- Ensure test users are created with password 'test123' (default)
- Verify password hashing matches between test creation and login
- Check that test users are created before authentication attempts

### 4. Foreign Key Constraint Errors

**Problem**: Cleanup fails due to foreign key constraints.

**Fix**: 
- Delete in correct order (children before parents)
- Use CASCADE deletes where appropriate
- Handle cleanup errors gracefully (don't throw)

### 5. Test Isolation Issues

**Problem**: Tests interfere with each other.

**Fix**:
- Use unique email addresses for each test suite
- Clean up test data before and after each suite
- Use transactions where possible

### 6. Missing library_id in Requests

**Problem**: Routes requiring `requireLibraryMember` fail with "Library ID required".

**Fix**: 
- Add `library_id` query parameter: `?library_id=1`
- For routes using `requirePhotoAccess`, library_id comes from photo

### 7. Async/Await Issues

**Problem**: Tests fail with "Cannot read property of undefined".

**Fix**:
- Ensure all async operations use `await`
- Use `beforeAll`/`afterAll` for setup/teardown
- Use `beforeEach`/`afterEach` for test-specific setup

## Running Tests in Debug Mode

```bash
# See all console output
DEBUG=1 npm test

# Run specific test file
npm test -- tests/api/metadata.test.js

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- -t "should update photo metadata successfully"
```

## Database State Issues

If tests leave the database in a bad state:

```bash
# Clean up manually
psql -U postgres -d fam_pho -c "DELETE FROM photo_workflow_events;"
psql -U postgres -d fam_pho -c "DELETE FROM photo_files;"
psql -U postgres -d fam_pho -c "DELETE FROM photos;"
psql -U postgres -d fam_pho -c "DELETE FROM library_members;"
psql -U postgres -d fam_pho -c "DELETE FROM libraries;"
psql -U postgres -d fam_pho -c "DELETE FROM users WHERE email LIKE 'test%@example.com';"
```

## Common Error Messages

### "Library ID required"
- Add `library_id` query parameter to request
- Example: `.get('/api/photos/metadata-entry?library_id=1')`

### "Photo not found"
- Photo was deleted or doesn't exist
- Check photo ID is correct
- Verify photo belongs to test library

### "Not a member of this library"
- User doesn't have library membership
- Create library member: `await testDb.createLibraryMember(libraryId, userId, 'owner')`

### "State transition failed"
- Photo is not in expected state
- Check current state: `await testDb.getPhotoState(photoId)`
- Verify state before transition

### "Cannot read property 'id' of undefined"
- Async operation not awaited
- Check all database calls use `await`
- Verify object exists before accessing properties
