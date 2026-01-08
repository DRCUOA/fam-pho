const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../server/utils/config');
const logger = require('../server/utils/logger');

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
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
