const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../server/utils/config');
const logger = require('../server/utils/logger');

// Helper function to create database if it doesn't exist
const ensureDatabaseExists = async () => {
  // Connect to postgres database to create the app database
  const adminPool = new Pool({
    connectionString: config.database.connectionString.replace(
      `/${config.database.database}`,
      '/postgres'
    ),
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl,
  });

  try {
    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database.database]
    );

    if (result.rows.length === 0) {
      logger.info(`Creating database: ${config.database.database}`);
      await adminPool.query(`CREATE DATABASE ${config.database.database}`);
      logger.info(`Database created successfully`);
    }
  } catch (error) {
    // If postgres database doesn't exist, try template1
    if (error.code === '3D000') {
      try {
        const templatePool = new Pool({
          connectionString: config.database.connectionString.replace(
            `/${config.database.database}`,
            '/template1'
          ),
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          ssl: config.database.ssl,
        });

        const result = await templatePool.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [config.database.database]
        );

        if (result.rows.length === 0) {
          logger.info(`Creating database: ${config.database.database}`);
          await templatePool.query(`CREATE DATABASE ${config.database.database}`);
          logger.info(`Database created successfully`);
        }

        await templatePool.end();
      } catch (templateError) {
        logger.warn('Could not auto-create database. Please create it manually:');
        logger.warn(`  createdb ${config.database.database}`);
        logger.warn(`  Or: psql -c "CREATE DATABASE ${config.database.database};"`);
      }
    } else {
      logger.warn('Could not auto-create database. Please create it manually:');
      logger.warn(`  createdb ${config.database.database}`);
      logger.warn(`  Or: psql -c "CREATE DATABASE ${config.database.database};"`);
    }
  } finally {
    await adminPool.end();
  }
};

const pool = new Pool({
  connectionString: config.database.connectionString,
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
});

// Create migrations table
const initMigrations = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get executed migrations
const getExecutedMigrations = async () => {
  const result = await pool.query('SELECT name FROM migrations ORDER BY name');
  return result.rows.map((row) => row.name);
};

// Execute migration
const executeMigration = async (name, sql) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    logger.info(`Migration executed: ${name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Main migration function
const migrate = async () => {
  try {
    // Try to ensure database exists
    await ensureDatabaseExists();

    await initMigrations();

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const executedMigrations = await getExecutedMigrations();

    // Execute pending migrations
    let executed = 0;
    for (const file of migrationFiles) {
      const name = file;
      if (!executedMigrations.includes(name)) {
        let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Handle \i directive for schema.sql
        if (sql.includes('\\i schema.sql')) {
          const schemaPath = path.join(__dirname, 'schema.sql');
          sql = fs.readFileSync(schemaPath, 'utf8');
        }
        
        try {
          await executeMigration(name, sql);
          executed++;
        } catch (error) {
          logger.error(`Migration failed: ${name}`, error);
          process.exit(1);
        }
      }
    }

    if (executed === 0) {
      logger.info('No pending migrations');
    } else {
      logger.info(`Executed ${executed} migration(s)`);
    }
  } catch (error) {
    logger.error('Migration error:', error);
    
    // Provide helpful error messages
    if (error.code === '28000' || error.message.includes('does not exist')) {
      logger.error('\n=== PostgreSQL Connection Error ===');
      logger.error('The PostgreSQL user/role does not exist or cannot connect.');
      logger.error('\nTroubleshooting:');
      logger.error('1. Check your .env file - ensure DB_USER matches your PostgreSQL username');
      logger.error('2. On macOS with Homebrew PostgreSQL, the default user is your macOS username');
      logger.error(`3. Current configured user: ${config.database.user}`);
      logger.error('4. Try connecting manually: psql -l');
      logger.error('5. Create the database: createdb fam_pho');
      logger.error('6. Or set DATABASE_URL in .env: DATABASE_URL=postgresql://YourUsername@localhost:5432/fam_pho');
    } else if (error.code === '3D000') {
      logger.error('\n=== Database Not Found ===');
      logger.error(`Database "${config.database.database}" does not exist.`);
      logger.error('\nCreate it with:');
      logger.error(`  createdb ${config.database.database}`);
      logger.error(`  Or: psql -c "CREATE DATABASE ${config.database.database};"`);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
