# Changelog

## [2026-01-09] - Bug Fix: Static File Serving in Development Mode

### Summary
Fixed critical bug preventing frontend from loading in development mode. Static file serving was conditionally wrapped in production-only check, and catch-all route was interfering with API endpoints.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-09",
  "version": "1.0.6",
  "type": "bugfix",
  "category": "server",
  "changes": [
    {
      "component": "server/index.js",
      "action": "fix",
      "changes": [
        "Removed conditional check for static file serving (was only enabled in production)",
        "Static files now served unconditionally in all environments",
        "Updated catch-all route to skip API routes and health check endpoint",
        "Added explicit check: if (req.path.startsWith('/api') || req.path === '/health') return next()",
        "Ensures API routes are handled by backend before serving index.html"
      ],
      "lines_modified": "130-138, catch-all route handler",
      "issue": "Frontend index.html not served in development, causing 'Route not found' error",
      "root_cause": "Static file middleware wrapped in if (config.env === 'production') condition"
    }
  ],
  "benefits": [
    "Frontend now loads correctly in development mode",
    "API routes properly handled before SPA catch-all",
    "Health check endpoint accessible without interference",
    "Consistent behavior across development and production environments"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Changes |
|-----------|--------|---------|
| **server/index.js** | Fix | Removed production-only static file serving, fixed catch-all route to skip API/health endpoints |

### Benefits

- ✅ Frontend loads correctly in development mode (no more "Route not found" error)
- ✅ API routes properly handled before SPA catch-all route
- ✅ Health check endpoint (`/health`) accessible without interference
- ✅ Consistent static file serving behavior across all environments
- ✅ Proper separation of concerns: API routes vs. frontend routes

### Files Modified

- `server/index.js`

### Testing Recommendations

- Verify frontend loads at `http://localhost:3000` in development mode
- Test API routes are accessible (e.g., `/api/photos`)
- Verify health check endpoint works (`/health`)
- Test SPA client-side routing (navigate between views)
- Verify static assets (CSS, JS, images) are served correctly

---

## [2026-01-09] - Feature: Complete Core Workflow Frontend Implementation

### Summary
Completed full frontend implementation for core workflow (Login → Upload → Triage → Search) with mobile-responsive design, comprehensive error handling, and enhanced user experience features.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-09",
  "version": "1.0.5",
  "type": "feature",
  "category": "frontend",
  "changes": [
    {
      "component": "client/js/api.js",
      "action": "enhance",
      "changes": [
        "Fixed FormData upload handling (removed Content-Type header for browser handling)",
        "Added XMLHttpRequest-based upload with progress tracking",
        "Added session expiration handling (401 redirect to login)",
        "Added removePersonFromPhoto and removeTagFromPhoto API methods",
        "Improved error handling with user-friendly messages"
      ]
    },
    {
      "component": "client/js/views.js",
      "action": "complete",
      "changes": [
        "Enhanced upload view with mobile camera capture button",
        "Added file preview list with thumbnails",
        "Completed triage view with loading/empty states",
        "Enhanced search view with filters UI and pagination",
        "Completed metadata view with photo preview and EXIF display",
        "Enhanced dashboard with workflow status and next tasks",
        "Added touch-friendly button sizes (min 44px)"
      ]
    },
    {
      "component": "client/js/app.js",
      "action": "complete",
      "changes": [
        "Implemented file upload with progress tracking and previews",
        "Added triage photo navigation (previous/next) with keyboard shortcuts",
        "Added triage grid view toggle",
        "Implemented debounced search with filters and pagination",
        "Completed metadata form with all fields (date, location, description)",
        "Added people and tags management in metadata view",
        "Enhanced dashboard with workflow status indicators",
        "Added comprehensive error handling utilities (showError, showSuccess, showLoading)",
        "Implemented loading states across all views",
        "Added session expiration handling"
      ]
    },
    {
      "component": "client/css/styles.css",
      "action": "enhance",
      "changes": [
        "Added upload zone drag-over styles and hover effects",
        "Added loading spinner animations",
        "Enhanced photo grid responsive layout",
        "Added form validation error styles",
        "Added mobile-responsive utilities",
        "Added transition animations for view changes",
        "Added notification styles (slideDown animation)",
        "Added scrollbar styling",
        "Added safe area support for mobile notches",
        "Added focus-visible styles for accessibility"
      ]
    }
  ],
  "benefits": [
    "Complete end-to-end workflow functionality",
    "Mobile-responsive design with touch-friendly interactions",
    "Comprehensive error handling and user feedback",
    "Enhanced user experience with loading states and animations",
    "Keyboard shortcuts for efficient triage workflow",
    "Progress tracking for file uploads",
    "Debounced search for better performance",
    "Accessible design with proper focus management"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Changes |
|-----------|--------|---------|
| **client/js/api.js** | Enhance | Fixed FormData upload, added progress tracking, session expiration handling |
| **client/js/views.js** | Complete | Enhanced all views with mobile support, loading states, and improved UX |
| **client/js/app.js** | Complete | Implemented all handlers, navigation, error handling, and workflow features |
| **client/css/styles.css** | Enhance | Added animations, responsive styles, mobile optimizations, accessibility |

### Benefits

- ✅ Complete core workflow implementation (Login → Upload → Triage → Search)
- ✅ Mobile-responsive design with touch-friendly interactions (44px minimum touch targets)
- ✅ Comprehensive error handling with toast notifications
- ✅ Loading states provide clear user feedback
- ✅ Keyboard shortcuts for efficient triage (← → K D U)
- ✅ Upload progress tracking with visual indicators
- ✅ Debounced search for better performance
- ✅ Photo navigation in triage view
- ✅ Grid/list view toggle for triage
- ✅ Search filters (date range) with pagination
- ✅ Metadata form with EXIF display and people/tags management
- ✅ Dashboard workflow status and next tasks display
- ✅ Accessible design with proper focus management

### Files Modified

- `client/js/api.js`
- `client/js/views.js`
- `client/js/app.js`
- `client/css/styles.css`

### Testing Recommendations

- Test complete workflow: Login → Upload → Triage → Search
- Test mobile responsiveness on actual devices
- Test keyboard shortcuts in triage view
- Test upload with progress tracking
- Test error handling (network errors, session expiration)
- Test search with filters and pagination
- Test metadata entry with people/tags
- Verify touch-friendly button sizes on mobile

---

## [2026-01-09] - Documentation: Add Route Testing Manual

### Summary
Created comprehensive route testing manual with curl commands for all API endpoints using seed data credentials.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-09",
  "version": "1.0.4",
  "type": "documentation",
  "category": "testing",
  "changes": [
    {
      "component": "route-testing-manual.md",
      "action": "create",
      "changes": [
        "Created comprehensive route testing manual",
        "Includes curl commands for all API endpoints",
        "Organized by route category (auth, photos, search, workflow, etc.)",
        "Includes seed data credentials and test workflow",
        "Provides troubleshooting section",
        "Documents session cookie usage",
        "Includes role-based access examples"
      ],
      "sections": [
        "Health check routes",
        "Authentication routes",
        "Photo upload routes",
        "Photo management routes",
        "Search routes",
        "Workflow routes",
        "People management routes",
        "Tags management routes",
        "Albums management routes",
        "File serving routes",
        "Complete testing workflow example"
      ]
    }
  ],
  "benefits": [
    "Enables manual API testing without frontend",
    "Provides reference for API usage",
    "Documents all available endpoints",
    "Includes seed data credentials for testing",
    "Shows complete workflow examples"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Changes |
|-----------|--------|---------|
| **route-testing-manual.md** | Create | Comprehensive curl-based route testing manual with all endpoints |

### Benefits

- ✅ Enables manual API testing without frontend
- ✅ Provides reference documentation for all API endpoints
- ✅ Includes seed data credentials and test IDs
- ✅ Shows complete testing workflow examples
- ✅ Documents session cookie management
- ✅ Includes troubleshooting guidance

### Files Created

- `route-testing-manual.md`

---

## [2026-01-09] - Feature: Add Root-Level Health Check Endpoint

### Summary
Added a comprehensive health check endpoint at `/health` for monitoring server status and database connectivity. This endpoint is accessible without authentication and provides detailed system information.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-09",
  "version": "1.0.3",
  "type": "feature",
  "category": "monitoring",
  "changes": [
    {
      "component": "server/index.js",
      "action": "add",
      "changes": [
        "Added GET /health endpoint at root level (before auth middleware)",
        "Endpoint checks database connectivity",
        "Returns server status, uptime, environment, and database info",
        "Returns HTTP 503 on database connection failure",
        "Kept existing /api/health endpoint for backward compatibility"
      ],
      "response_format": {
        "healthy": {
          "status": "ok",
          "timestamp": "ISO 8601 timestamp",
          "uptime": "seconds",
          "environment": "development|production",
          "database": {
            "status": "connected",
            "time": "database server timestamp",
            "version": "PostgreSQL version"
          }
        },
        "unhealthy": {
          "status": "error",
          "timestamp": "ISO 8601 timestamp",
          "uptime": "seconds",
          "environment": "development|production",
          "database": {
            "status": "disconnected",
            "error": "error message"
          }
        }
      }
    }
  ],
  "benefits": [
    "Enables monitoring and deployment health checks",
    "No authentication required (standard practice)",
    "Provides detailed system diagnostics",
    "Supports automated monitoring tools"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Changes |
|-----------|--------|---------|
| **server/index.js** | Add endpoint | GET /health route at root level with database connectivity check |

### Benefits

- ✅ Enables monitoring and deployment health checks
- ✅ No authentication required (standard practice for health endpoints)
- ✅ Provides detailed system diagnostics (uptime, environment, database status)
- ✅ Supports automated monitoring tools and load balancers
- ✅ Backward compatible (existing /api/health endpoint retained)

### Files Modified

- `server/index.js`

---

## [2026-01-08] - Database Migration: SQLite to PostgreSQL

### Summary
Migrated the entire application stack from SQLite (better-sqlite3) to PostgreSQL to resolve critical compilation issues with Node.js v24.12.0 and improve production readiness.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-08",
  "version": "1.0.0",
  "type": "major",
  "category": "database_migration",
  "changes": [
    {
      "component": "package.json",
      "action": "replace",
      "from": "better-sqlite3@^9.2.2",
      "to": "pg@^8.11.3",
      "reason": "Resolve C++20 compilation errors with Node.js v24.12.0"
    },
    {
      "component": "database/schema.sql",
      "action": "convert",
      "changes": [
        "INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY",
        "DATETIME → TIMESTAMP",
        "INTEGER DEFAULT 0/1 → BOOLEAN DEFAULT FALSE/TRUE",
        "TEXT → VARCHAR/TEXT (PostgreSQL compatible)",
        "FTS5 virtual table → PostgreSQL tsvector with GIN index",
        "GROUP_CONCAT() → string_agg()",
        "Added search_vector tsvector column to photos table",
        "Created PostgreSQL triggers and functions for full-text search"
      ]
    },
    {
      "component": "server/models/db.js",
      "action": "rewrite",
      "from": "better-sqlite3 Database instance",
      "to": "pg Pool connection",
      "changes": [
        "Synchronous API → Asynchronous Pool API",
        "Added connection pool configuration",
        "Added graceful shutdown handlers"
      ]
    },
    {
      "component": "server/models/*.js",
      "action": "convert",
      "files": [
        "User.js",
        "Photo.js",
        "PhotoFile.js",
        "Person.js",
        "Album.js",
        "Tag.js"
      ],
      "changes": [
        "All methods converted to async/await",
        "Parameter placeholders: ? → $1, $2, $3...",
        "db.prepare().get() → pool.query() with result.rows[0]",
        "db.prepare().all() → pool.query() with result.rows",
        "db.prepare().run() → pool.query() with RETURNING *",
        "INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING",
        "result.lastInsertRowid → result.rows[0].id"
      ]
    },
    {
      "component": "server/services/activityLog.js",
      "action": "convert",
      "changes": [
        "All methods converted to async/await",
        "Updated to use PostgreSQL parameterized queries"
      ]
    },
    {
      "component": "server/routes/*.js",
      "action": "convert",
      "files": [
        "auth.js",
        "photos.js",
        "upload.js",
        "search.js",
        "workflow.js",
        "files.js",
        "people.js",
        "tags.js",
        "albums.js"
      ],
      "changes": [
        "All route handlers converted to async functions",
        "All model method calls updated with await",
        "All ActivityLog.log() calls updated with await"
      ]
    },
    {
      "component": "server/middleware/auth.js",
      "action": "update",
      "changes": [
        "attachUser middleware converted to async",
        "User.findById() calls updated with await"
      ]
    },
    {
      "component": "server/middleware/authorization.js",
      "action": "update",
      "changes": [
        "requireLibraryMember converted to async",
        "requirePhotoAccess converted to async",
        "requireRole wrapper updated for async support",
        "All User and Photo model calls updated with await"
      ]
    },
    {
      "component": "server/utils/config.js",
      "action": "update",
      "changes": [
        "database.path → database.connectionString",
        "Added database connection parameters (host, port, database, user, password, ssl)"
      ]
    },
    {
      "component": "database/migrate.js",
      "action": "rewrite",
      "changes": [
        "better-sqlite3 → pg Pool",
        "Synchronous migration → Async/await migration",
        "Added transaction support",
        "Added schema.sql file reading logic"
      ]
    },
    {
      "component": "database/seed.js",
      "action": "rewrite",
      "changes": [
        "better-sqlite3 → pg Pool",
        "Synchronous operations → Async/await",
        "INSERT OR REPLACE → INSERT ... ON CONFLICT DO UPDATE",
        "Added transaction support"
      ]
    },
    {
      "component": "server/routes/search.js",
      "action": "update",
      "changes": [
        "FTS5 MATCH operator → PostgreSQL @@ plainto_tsquery()",
        "Updated search_vector column usage",
        "Converted to async/await"
      ]
    }
  ],
  "breaking_changes": [
    "Database connection string format changed",
    "All model methods are now async",
    "All route handlers must use async/await",
    "Environment variables changed (DB_PATH → DATABASE_URL or DB_HOST/DB_PORT/etc)"
  ],
  "migration_required": true,
  "migration_steps": [
    "Install PostgreSQL",
    "Create database: CREATE DATABASE fam_pho;",
    "Update .env with PostgreSQL connection details",
    "Run: npm run migrate",
    "Run: npm run seed (optional)"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | From | To | Details |
|-----------|--------|------|-----|---------|
| **package.json** | Replace dependency | `better-sqlite3@^9.2.2` | `pg@^8.11.3` | Resolves C++20 compilation errors |
| **database/schema.sql** | Convert schema | SQLite syntax | PostgreSQL syntax | AUTOINCREMENT→SERIAL, DATETIME→TIMESTAMP, FTS5→tsvector |
| **server/models/db.js** | Rewrite | better-sqlite3 Database | pg Pool | Async connection pool |
| **server/models/*.js** | Convert all models | Synchronous SQLite | Async PostgreSQL | All methods async, $1/$2 params |
| **server/services/activityLog.js** | Convert | Synchronous | Async | Updated to async/await |
| **server/routes/*.js** | Convert all routes | Synchronous handlers | Async handlers | All routes use async/await |
| **server/middleware/auth.js** | Update | Synchronous | Async | attachUser now async |
| **server/middleware/authorization.js** | Update | Synchronous | Async | All middleware async |
| **server/utils/config.js** | Update config | DB_PATH | DATABASE_URL/connection params | PostgreSQL connection config |
| **database/migrate.js** | Rewrite | SQLite migration | PostgreSQL migration | Async migration with transactions |
| **database/seed.js** | Rewrite | SQLite seed | PostgreSQL seed | Async seed with transactions |
| **server/routes/search.js** | Update search | FTS5 MATCH | PostgreSQL @@ tsquery | Full-text search conversion |

### Breaking Changes

1. **Database Connection**: Changed from file-based SQLite to PostgreSQL connection string
2. **Async API**: All model methods are now async and must be awaited
3. **Environment Variables**: 
   - Removed: `DB_PATH`
   - Added: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`

### Migration Steps

1. Install PostgreSQL (if not already installed)
2. Create database: `CREATE DATABASE fam_pho;`
3. Update `.env` file with PostgreSQL connection details:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/fam_pho
   # OR
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fam_pho
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_SSL=false
   ```
4. Run migrations: `npm run migrate`
5. (Optional) Seed database: `npm run seed`

### Benefits

- ✅ Resolves Node.js v24.12.0 C++20 compilation issues
- ✅ Better production scalability and performance
- ✅ Advanced full-text search capabilities
- ✅ Better concurrent access handling
- ✅ More robust data integrity features
- ✅ Industry-standard database for production use

### Files Modified

- `package.json`
- `database/schema.sql`
- `database/migrations/001_initial.sql`
- `database/migrate.js`
- `database/seed.js`
- `server/models/db.js`
- `server/models/User.js`
- `server/models/Photo.js`
- `server/models/PhotoFile.js`
- `server/models/Person.js`
- `server/models/Album.js`
- `server/models/Tag.js`
- `server/services/activityLog.js`
- `server/utils/config.js`
- `server/middleware/auth.js`
- `server/middleware/authorization.js`
- `server/routes/auth.js`
- `server/routes/photos.js`
- `server/routes/upload.js`
- `server/routes/search.js`
- `server/routes/workflow.js`
- `server/routes/files.js`
- `server/routes/people.js`
- `server/routes/tags.js`
- `server/routes/albums.js`
- `server/index.js`

### Testing Recommendations

- Test database connection on startup
- Verify all CRUD operations work correctly
- Test full-text search functionality
- Verify file upload and duplicate detection
- Test workflow state transitions
- Verify activity logging
- Test concurrent access scenarios
