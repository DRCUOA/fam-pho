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
- **Database**: SQLite with FTS5 for full-text search
- **Frontend**: Responsive web app (mobile-first, Tailwind CSS)
- **Authentication**: Session-based with secure cookies
- **File Storage**: Local filesystem with staging area

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database:**
   ```bash
   npm run migrate
   npm run seed  # Optional: seed with test data
   ```

4. **Start the server:**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

5. **Access the application:**
   - Open http://localhost:3000 in your browser
   - Login with default admin credentials (see seed data)

## Project Structure

```
fam-pho/
├── server/          # Express backend
├── client/          # Frontend application
├── database/        # SQLite DB and migrations
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
