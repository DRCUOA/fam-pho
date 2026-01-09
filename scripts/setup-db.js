#!/usr/bin/env node

/**
 * Database Setup Helper Script
 * Helps create the PostgreSQL database and user if needed
 */

const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const getCurrentUser = () => os.userInfo().username;

const checkPostgresRunning = () => {
  try {
    execSync('psql -l', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const databaseExists = (dbName) => {
  try {
    const result = execSync(`psql -lqt | cut -d \\| -f 1 | grep -qw ${dbName}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
};

const createDatabase = async (dbName, dbUser) => {
  try {
    console.log(`Creating database: ${dbName}...`);
    execSync(`createdb ${dbName}`, { stdio: 'inherit' });
    console.log(`✓ Database '${dbName}' created successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to create database: ${error.message}`);
    console.log('\nTry manually:');
    console.log(`  createdb ${dbName}`);
    return false;
  }
};

const main = async () => {
  console.log('=== Family Photo Archive - Database Setup ===\n');

  // Check if PostgreSQL is running
  if (!checkPostgresRunning()) {
    console.error('✗ PostgreSQL is not running or not accessible');
    console.log('\nStart PostgreSQL:');
    console.log('  macOS: brew services start postgresql@16');
    console.log('  Linux: sudo systemctl start postgresql');
    process.exit(1);
  }

  console.log('✓ PostgreSQL is running\n');

  const currentUser = getCurrentUser();
  const defaultDbName = 'fam_pho';

  // Get database name
  const dbName = await question(`Database name [${defaultDbName}]: `) || defaultDbName;

  // Check if database exists
  if (databaseExists(dbName)) {
    console.log(`✓ Database '${dbName}' already exists`);
  } else {
    console.log(`Database '${dbName}' does not exist`);
    const create = await question('Create it now? [Y/n]: ') || 'Y';
    
    if (create.toLowerCase() === 'y') {
      await createDatabase(dbName, currentUser);
    } else {
      console.log('Skipping database creation. Please create it manually.');
      process.exit(0);
    }
  }

  // Generate .env file
  console.log('\n=== Generating .env file ===');
  const envPath = '.env';
  const fs = require('fs');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file exists. Overwrite? [y/N]: ') || 'N';
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Keeping existing .env file');
      rl.close();
      return;
    }
  }

  const envContent = `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Session Configuration
SESSION_SECRET=change-this-to-a-random-secret-in-production
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax

# Database Configuration (PostgreSQL)
# Using connection string (recommended)
DATABASE_URL=postgresql://${currentUser}@localhost:5432/${dbName}

# Storage Configuration
STORAGE_PATH=./storage
STORAGE_INCOMING=./storage/_incoming
STORAGE_MASTERS=./storage/masters
STORAGE_DERIVATIVES=./storage/derivatives

# Upload Configuration
MAX_FILE_SIZE=104857600
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/tiff

# Security Configuration
CSRF_SECRET=change-this-csrf-secret-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Backup Configuration
BACKUP_PATH=./backups
BACKUP_ENCRYPTION_KEY=change-this-backup-key-in-production
BACKUP_RETENTION_DAYS=30

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# HTTPS Configuration (for production)
HTTPS_ENABLED=false
HTTPS_KEY_PATH=
HTTPS_CERT_PATH=

# Reverse Proxy Configuration
BEHIND_PROXY=false
CORS_ORIGIN=
`;

  fs.writeFileSync(envPath, envContent);
  console.log(`✓ Created ${envPath} file`);
  console.log(`  Database: ${dbName}`);
  console.log(`  User: ${currentUser}`);

  console.log('\n=== Next Steps ===');
  console.log('1. Review and update .env file if needed');
  console.log('2. Run migrations: npm run migrate');
  console.log('3. (Optional) Seed test data: npm run seed');
  console.log('4. Start server: npm start');

  rl.close();
};

main().catch((error) => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
