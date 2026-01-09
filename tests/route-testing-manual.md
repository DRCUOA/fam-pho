# Route Testing Manual

This document provides curl commands to test all API routes using the seed data.

## Prerequisites

1. **Start the server:**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

2. **Seed the database (if not already done):**
   ```bash
   npm run seed
   ```

3. **Test Credentials (from seed data):**
   - **Admin/Owner**: `admin@example.com` / `admin123`
   - **Editor/Organizer**: `editor@example.com` / `editor123`
   - **Viewer**: `viewer@example.com` / `viewer123`
   - **Library ID**: `1`

4. **Base URL:** `http://localhost:3000`

5. **Cookie File:** Commands use `-c cookies.txt` to save session cookies and `-b cookies.txt` to reuse them.

---

## 1. Health Check Routes

### GET /health (Root-level health check)
```bash
curl -X GET http://localhost:3000/health
```

### GET /api/health (Legacy health check)
```bash
curl -X GET http://localhost:3000/api/health
```

**Expected Response:** `200 OK` with status information

---

## 2. Authentication Routes

### POST /api/auth/login
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Login as editor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"editor123"}" \
  -c cookies-editor.txt

# Login as viewer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"viewer123"}" \
  -c cookies-viewer.txt
```

**Expected Response:** `200 OK` with user object

### GET /api/auth/me (Get current user)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

**Expected Response:** `200 OK` with user info and libraries

### POST /api/auth/logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

**Expected Response:** `200 OK` with success message

---

## 3. Photo Upload Routes

### POST /api/photos/upload
```bash
# Upload a photo (requires authentication + library membership)
# Note: Replace /path/to/image.jpg with an actual image file path
curl -X POST http://localhost:3000/api/photos/upload \
  -b cookies.txt \
  -F "photos=@/path/to/image.jpg" \
  -F "library_id=1"

# Upload multiple photos
curl -X POST http://localhost:3000/api/photos/upload \
  -b cookies.txt \
  -F "photos=@/path/to/image1.jpg" \
  -F "photos=@/path/to/image2.jpg" \
  -F "library_id=1"
```

**Expected Response:** `200 OK` with upload results (success, duplicates, errors)

**Note:** After upload, photos will be in `triage` state. Use the returned `photo_id` for subsequent operations.

---

## 4. Photo Management Routes

### GET /api/photos/triage (Get triage queue)
```bash
curl -X GET "http://localhost:3000/api/photos/triage?limit=50&offset=0" \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with photos array and total count

### GET /api/photos/:id (Get photo by ID)
```bash
# Replace :id with actual photo ID from upload or triage queue
curl -X GET http://localhost:3000/api/photos/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with photo object and relations

### PUT /api/photos/:id (Update photo metadata)
```bash
curl -X PUT http://localhost:3000/api/photos/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "date_taken": "2024-01-15T10:30:00Z",
    "location_text": "Family Home",
    "description": "Family gathering in the living room"
  }'
```

**Expected Response:** `200 OK` with updated photo object

### POST /api/photos/:id/triage (Triage action)
```bash
# Keep photo (moves to metadata_entry state)
curl -X POST http://localhost:3000/api/photos/1/triage \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "action": "keep",
    "reason": "Good quality photo"
  }'

# Discard photo (moves to rejected state)
curl -X POST http://localhost:3000/api/photos/1/triage \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "action": "discard",
    "reason": "Blurry image"
  }'

# Mark as duplicate
curl -X POST http://localhost:3000/api/photos/1/triage \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "action": "duplicate",
    "reason": "Duplicate of photo 2",
    "duplicate_of": 2
  }'
```

**Expected Response:** `200 OK` with updated photo and message

### POST /api/photos/:id/undo-discard (Undo discard)
```bash
# Requires organizer role or higher
curl -X POST http://localhost:3000/api/photos/1/undo-discard \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with restored photo

---

## 5. Search Routes

### GET /api/photos/search (Search photos)
```bash
# Basic search
curl -X GET "http://localhost:3000/api/photos/search?q=family&page=1&limit=50" \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# Search with date range
curl -X GET "http://localhost:3000/api/photos/search?date_from=2024-01-01&date_to=2024-12-31&page=1&limit=50" \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# Search with filters
curl -X GET "http://localhost:3000/api/photos/search?people=1,2&tags=3&album=1&sort_by=date_taken&sort_order=ASC" \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# Combined search
curl -X GET "http://localhost:3000/api/photos/search?q=birthday&date_from=2024-01-01&people=1&page=1&limit=20" \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with photos array and pagination info

---

## 6. Workflow Routes

### GET /api/workflow/next-tasks (Get next tasks)
```bash
curl -X GET http://localhost:3000/api/workflow/next-tasks \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with queue counts and sample photos

### POST /api/photos/:id/complete (Mark photo as complete)
```bash
curl -X POST http://localhost:3000/api/photos/1/complete \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with completed photo and message

---

## 7. People Management Routes

### GET /api/people (List people)
```bash
curl -X GET http://localhost:3000/api/people \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with people array

### POST /api/people (Create person)
```bash
curl -X POST http://localhost:3000/api/people \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "name": "John Doe",
    "relationship_label": "Father",
    "notes": "Born 1970"
  }'
```

**Expected Response:** `201 Created` with person object

### PUT /api/people/:id (Update person)
```bash
curl -X PUT http://localhost:3000/api/people/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "name": "John Doe Updated",
    "relationship_label": "Dad",
    "notes": "Updated notes"
  }'
```

**Expected Response:** `200 OK` with updated person object

### POST /api/photos/:photoId/people/:personId (Tag photo with person)
```bash
curl -X POST http://localhost:3000/api/photos/1/people/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with success message

### DELETE /api/photos/:photoId/people/:personId (Remove person tag)
```bash
curl -X DELETE http://localhost:3000/api/photos/1/people/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with success message

---

## 8. Tags Management Routes

### GET /api/tags (List tags)
```bash
curl -X GET http://localhost:3000/api/tags \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with tags array

### POST /api/photos/:id/tags (Add tag to photo)
```bash
curl -X POST http://localhost:3000/api/photos/1/tags \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "name": "birthday"
  }'
```

**Expected Response:** `200 OK` with tag object and message

### DELETE /api/photos/:id/tags/:tagId (Remove tag from photo)
```bash
curl -X DELETE http://localhost:3000/api/photos/1/tags/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with success message

### POST /api/photos/bulk-edit (Bulk update photos)
```bash
curl -X POST http://localhost:3000/api/photos/bulk-edit \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "photo_ids": [1, 2, 3],
    "updates": {
      "location_text": "Updated Location"
    }
  }'
```

**Expected Response:** `200 OK` with count of updated photos

---

## 9. Albums Management Routes

### GET /api/albums (List albums)
```bash
curl -X GET http://localhost:3000/api/albums \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with albums array

### POST /api/albums (Create album)
```bash
curl -X POST http://localhost:3000/api/albums \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "name": "Summer 2024",
    "description": "Photos from summer vacation"
  }'
```

**Expected Response:** `201 Created` with album object

### PUT /api/albums/:id (Update album)
```bash
curl -X PUT http://localhost:3000/api/albums/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{
    "name": "Summer 2024 Updated",
    "description": "Updated description"
  }'
```

**Expected Response:** `200 OK` with updated album object

### POST /api/photos/:id/albums/:albumId (Add photo to album)
```bash
curl -X POST http://localhost:3000/api/photos/1/albums/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with success message

### DELETE /api/photos/:id/albums/:albumId (Remove photo from album)
```bash
curl -X DELETE http://localhost:3000/api/photos/1/albums/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"
```

**Expected Response:** `200 OK` with success message

---

## 10. File Serving Routes

### GET /api/files/:id (Serve file)
```bash
# Get file (returns image binary)
curl -X GET http://localhost:3000/api/files/1 \
  -b cookies.txt \
  --output photo.jpg

# Get file with range request (for large files)
curl -X GET http://localhost:3000/api/files/1 \
  -b cookies.txt \
  -H "Range: bytes=0-1023" \
  --output photo-part.jpg
```

**Expected Response:** `200 OK` or `206 Partial Content` with file binary

---

## Testing Workflow Example

Here's a complete workflow to test the application:

```bash
# 1. Check health
curl -X GET http://localhost:3000/health

# 2. Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}" \
  -c cookies.txt

# 3. Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# 4. Upload a photo (replace with actual image path)
curl -X POST http://localhost:3000/api/photos/upload \
  -b cookies.txt \
  -F "photos=@/path/to/test-image.jpg" \
  -F "library_id=1"

# 5. Get triage queue
curl -X GET "http://localhost:3000/api/photos/triage?limit=10" \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 6. Keep photo in triage (use photo ID from step 4)
curl -X POST http://localhost:3000/api/photos/1/triage \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{"action":"keep","reason":"Good photo"}'

# 7. Update photo metadata
curl -X PUT http://localhost:3000/api/photos/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{"date_taken":"2024-01-15T10:30:00Z","location_text":"Home"}'

# 8. Create a person
curl -X POST http://localhost:3000/api/people \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{"name":"Test Person","relationship_label":"Friend"}'

# 9. Tag photo with person
curl -X POST http://localhost:3000/api/photos/1/people/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 10. Add tag to photo
curl -X POST http://localhost:3000/api/photos/1/tags \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{"name":"test-tag"}'

# 11. Create album
curl -X POST http://localhost:3000/api/albums \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-Library-Id: 1" \
  -d '{"name":"Test Album","description":"Test description"}'

# 12. Add photo to album
curl -X POST http://localhost:3000/api/photos/1/albums/1 \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 13. Search photos
curl -X GET "http://localhost:3000/api/photos/search?q=test&page=1&limit=10" \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 14. Get next tasks
curl -X GET http://localhost:3000/api/workflow/next-tasks \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 15. Mark photo as complete
curl -X POST http://localhost:3000/api/photos/1/complete \
  -b cookies.txt \
  -H "X-Library-Id: 1"

# 16. Get file
curl -X GET http://localhost:3000/api/files/1 \
  -b cookies.txt \
  --output downloaded-photo.jpg

# 17. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## Notes

1. **Session Cookies:** All authenticated routes require session cookies. Save cookies after login with `-c cookies.txt` and reuse with `-b cookies.txt`.

2. **Library ID Header:** Most routes require `X-Library-Id: 1` header to specify which library you're working with.

3. **Role-Based Access:**
   - **Viewer**: Can only read data
   - **Editor/Organizer**: Can create and update (contributor role)
   - **Admin/Owner**: Full access (organizer role)

4. **Photo States:** Photos progress through states: `uploaded` → `triage` → `metadata_entry` → `complete` (or `rejected`)

5. **Error Responses:** All routes return JSON error objects with `error` or `errors` fields on failure.

6. **Rate Limiting:** Login endpoint is rate-limited (5 attempts per 15 minutes).

7. **File Upload:** Replace `/path/to/image.jpg` with actual image file paths. Supported formats: JPEG, PNG, TIFF.

---

## Troubleshooting

- **401 Unauthorized:** Make sure you're logged in and using cookies (`-b cookies.txt`)
- **403 Forbidden:** Check user role and library membership
- **404 Not Found:** Verify the resource ID exists
- **400 Bad Request:** Check request body format and required fields
- **500 Internal Server Error:** Check server logs for details
