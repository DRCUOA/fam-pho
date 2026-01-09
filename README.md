# Family Photo Archive (fam-pho)

A self-hosted Family Photo Archive web application for digitizing and managing family photo collections with a focus on quality, security, and guided workflow.

## Features

- **Secure Access**: Authentication with RBAC (admin/editor/viewer roles)
- **Multi-device Upload**: Mobile camera capture and desktop drag-and-drop
- **Triage Workflow**: Review and curate photos before archival
- **Rich Metadata**: Date, location, people, tags, albums, and notes
- **Full-text Search**: Fast search across all metadata with filters
- **Workflow Guidance**: Next-task queues to keep workflow moving
- **Audit Trail**: Complete logging of all operations
- **Backup & Recovery**: Encrypted backups with restore capability

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with full-text search (tsvector)
- **Frontend**: Responsive web app (mobile-first, Tailwind CSS)
- **Authentication**: Session-based with secure cookies
- **File Storage**: Local filesystem with staging area

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- npm or yarn

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   
   **On macOS with Homebrew PostgreSQL:**
   ```bash
   # The default user is your macOS username
   createdb fam_pho
   ```
   
   **On Linux or other systems:**
   ```bash
   # Create database as postgres user
   sudo -u postgres createdb fam_pho
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE fam_pho;"
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection details
   # On macOS, DB_USER should be your macOS username (not 'postgres')
   ```

4. **Initialize database:**
   ```bash
   npm run migrate
   npm run seed  # Optional: seed with test data
   ```

5. **Start the server:**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

6. **Access the application:**
   - Open http://localhost:3000 in your browser
   - Login with default admin credentials (see seed data)

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `DATABASE_URL` - PostgreSQL connection string (or use `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
  - **macOS/Homebrew**: Use your macOS username instead of 'postgres'
  - Example: `DATABASE_URL=postgresql://YourUsername@localhost:5432/fam_pho`
- `SESSION_SECRET` - Secret for session encryption (change in production!)
- `STORAGE_PATH` - Base path for file storage
- `BACKUP_ENCRYPTION_KEY` - Key for encrypted backups (optional)

## Database Setup

The application uses PostgreSQL. To set up:

1. **Install PostgreSQL** (if not already installed)
   - macOS: `brew install postgresql@16`
   - Linux: Use your distribution's package manager

2. **Start PostgreSQL service**
   - macOS: `brew services start postgresql@16`
   - Linux: `sudo systemctl start postgresql`

3. **Create database:**
   ```bash
   # macOS (Homebrew) - uses your macOS username
   createdb fam_pho
   
   # Linux - as postgres user
   sudo -u postgres createdb fam_pho
   ```

4. **Configure connection in `.env` file**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` or `DB_USER` with your PostgreSQL username
   - On macOS, this is typically your macOS username

5. **Run migrations:**
   ```bash
   npm run migrate
   ```

6. **(Optional) Seed test data:**
   ```bash
   npm run seed
   ```

## Troubleshooting

### "role 'postgres' does not exist"
- **macOS/Homebrew**: The default PostgreSQL user is your macOS username, not 'postgres'
- Update `.env` file: Set `DB_USER` to your macOS username or use `DATABASE_URL=postgresql://YourUsername@localhost:5432/fam_pho`

### "database 'fam_pho' does not exist"
- Create the database: `createdb fam_pho` (macOS) or `sudo -u postgres createdb fam_pho` (Linux)

### Connection refused
- Ensure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check PostgreSQL port (default: 5432)

## Default Test Credentials

After running `npm run seed`:
- **Admin**: admin@example.com / admin123
- **Editor**: editor@example.com / editor123
- **Viewer**: viewer@example.com / viewer123

## Project Structure

```
fam-pho/
├── server/          # Express backend
├── client/          # Frontend application
├── database/        # PostgreSQL migrations and schema
├── storage/         # File storage directories
├── scripts/         # Utility scripts (backup, restore)
└── tests/           # Test suites
```

## Documentation

See `/documentation/Full_PID/` for:
- Project charter and requirements
- Wireframes and UI design
- Data model and ER narrative

## License

MIT
