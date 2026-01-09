# Changelog

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
