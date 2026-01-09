# Changelog

## [2026-01-08] - Configuration: Fix PostgreSQL Default User & Error Handling

### Summary
Fixed PostgreSQL connection defaults for macOS/Homebrew installations and improved error handling in migration script.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-08",
  "version": "1.0.2",
  "type": "patch",
  "category": "configuration_fix",
  "changes": [
    {
      "component": "server/utils/config.js",
      "action": "update",
      "changes": [
        "Auto-detect macOS username for PostgreSQL default user",
        "Use os.userInfo().username instead of hardcoded 'postgres'",
        "Falls back to 'postgres' on non-macOS systems"
      ]
    },
    {
      "component": ".env.example",
      "action": "update",
      "changes": [
        "Updated default DB_USER to macOS username (Rich)",
        "Added comment explaining macOS/Homebrew PostgreSQL user difference",
        "Updated DATABASE_URL example to use macOS username"
      ]
    },
    {
      "component": "database/migrate.js",
      "action": "enhance",
      "changes": [
        "Added ensureDatabaseExists() function to auto-create database",
        "Improved error handling with helpful messages",
        "Added troubleshooting guidance for common PostgreSQL errors",
        "Better error messages for role/database not found errors"
      ]
    },
    {
      "component": "README.md",
      "action": "update",
      "changes": [
        "Added macOS-specific PostgreSQL setup instructions",
        "Added troubleshooting section",
        "Clarified database user differences between macOS and Linux"
      ]
    }
  ],
  "fixes": [
    "PostgreSQL role 'postgres' does not exist error on macOS",
    "Better error messages for database connection issues",
    "Auto-detection of correct PostgreSQL username"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Changes |
|-----------|--------|---------|
| **server/utils/config.js** | Update | Auto-detect macOS username for PostgreSQL default user |
| **.env.example** | Update | Updated default to macOS username with explanatory comments |
| **database/migrate.js** | Enhance | Added database auto-creation and improved error messages |
| **README.md** | Update | Added macOS-specific setup instructions and troubleshooting |

### Fixes

- ✅ Fixed "role 'postgres' does not exist" error on macOS/Homebrew PostgreSQL
- ✅ Auto-detection of correct PostgreSQL username based on platform
- ✅ Improved error messages with troubleshooting guidance
- ✅ Database auto-creation attempt before migration

---

## [2026-01-08] - Configuration: Add .env.example File

### Summary
Added missing `.env.example` file with all required environment variables for PostgreSQL configuration.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-08",
  "version": "1.0.1",
  "type": "patch",
  "category": "configuration",
  "changes": [
    {
      "component": ".env.example",
      "action": "create",
      "reason": "Missing file referenced in README.md",
      "contents": [
        "PostgreSQL connection configuration (DATABASE_URL or individual parameters)",
        "Session security settings",
        "Storage paths",
        "Upload limits",
        "Backup configuration",
        "Logging configuration",
        "HTTPS settings",
        "Reverse proxy settings"
      ]
    },
    {
      "component": "README.md",
      "action": "update",
      "changes": [
        "Updated database description from SQLite to PostgreSQL",
        "Added PostgreSQL setup instructions",
        "Added prerequisites section",
        "Added environment variables documentation"
      ]
    }
  ]
}
```

#### Markdown Table Format (Human-readable)

| Component | Action | Details |
|-----------|--------|---------|
| **.env.example** | Created | Complete environment variable template with PostgreSQL configuration |
| **README.md** | Updated | Added PostgreSQL setup instructions, prerequisites, and environment variable docs |

---

## [2026-01-08] - Package Updates: Remove Deprecated Dependencies

### Summary
Updated deprecated packages to latest stable versions to eliminate security vulnerabilities and memory leak warnings.

### Changes

#### JSON Format (LLM-friendly)

```json
{
  "date": "2026-01-08",
  "version": "1.0.1",
  "type": "patch",
  "category": "security_update",
  "changes": [
    {
      "component": "package.json",
      "action": "update",
      "package": "multer",
      "from": "^1.4.5-lts.1",
      "to": "^2.0.2",
      "reason": "Security vulnerabilities (CVE-2025-47935, CVE-2025-47944, CVE-2025-48997) and memory leak fixes",
      "breaking_changes": false,
      "compatibility": "Backward compatible API"
    },
    {
      "component": "package.json",
      "action": "update",
      "package": "supertest",
      "from": "^6.3.3",
      "to": "^7.1.3",
      "reason": "Deprecated version, maintenance supported by Forward Email",
      "breaking_changes": false,
      "compatibility": "Mostly backward compatible"
    },
    {
      "component": "server/routes/upload.js",
      "action": "update",
      "changes": [
        "Added error handling in multer destination callback",
        "Verified compatibility with multer 2.x API"
      ]
    },
    {
      "component": "scripts/backup.js",
      "action": "update",
      "changes": [
        "Fixed fs.createWriteStream bug (was using fs.promises)",
        "Updated to use pg_dump for PostgreSQL backups",
        "Added fsSync import for stream operations"
      ]
    },
    {
      "component": "scripts/restore.js",
      "action": "update",
      "changes": [
        "Updated to use psql for PostgreSQL restore",
        "Changed database backup file from .db to .sql"
      ]
    }
  ],
  "security_fixes": [
    "CVE-2025-47935: Fixed memory leaks from unclosed streams",
    "CVE-2025-47944: Fixed DoS from malformed multipart requests",
    "CVE-2025-48997: Fixed DoS from empty string field names"
  ],
  "warnings_resolved": [
    "multer@1.4.5-lts.2 deprecated warning",
    "supertest@6.3.4 deprecated warning",
    "superagent@8.1.2 deprecated warning (transitive dependency)"
  ]
}
```

#### Markdown Table Format (Human-readable)

| Package | From | To | Reason | Breaking Changes |
|---------|------|-----|--------|------------------|
| **multer** | ^1.4.5-lts.1 | ^2.0.2 | Security vulnerabilities & memory leaks | No (backward compatible) |
| **supertest** | ^6.3.3 | ^7.1.3 | Deprecated, maintenance supported | No (mostly compatible) |

### Additional Updates

- **scripts/backup.js**: Fixed bug with `fs.createWriteStream`, updated to use `pg_dump` for PostgreSQL
- **scripts/restore.js**: Updated to use `psql` for PostgreSQL restore

### Security Fixes

- **CVE-2025-47935**: Fixed memory leaks from unclosed streams (DoS vulnerability)
- **CVE-2025-47944**: Fixed DoS from malformed multipart upload requests
- **CVE-2025-48997**: Fixed DoS from empty string field names causing crashes

### Warnings Resolved

- ✅ `multer@1.4.5-lts.2` deprecated warning resolved
- ✅ `supertest@6.3.4` deprecated warning resolved
- ✅ `superagent@8.1.2` deprecated warning resolved (via supertest update)

### Notes

- Multer 2.x maintains backward compatibility with callback-based API
- All existing upload code works without modification
- Transitive dependency warnings (inflight, npmlog, rimraf, glob) are from dev dependencies (jest) and don't affect production runtime
- No memory leak warnings from direct production dependencies
- Updated backup/restore scripts to use PostgreSQL pg_dump/psql instead of file copy

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
