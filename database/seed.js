const { Pool } = require('pg');
const argon2 = require('argon2');
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

// Hash passwords for seed users
const hashPassword = async (password) => {
  return await argon2.hash(password);
};

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.info('Starting database seed...');

    // Hash passwords
    const adminHash = await hashPassword('admin123');
    const editorHash = await hashPassword('editor123');
    const viewerHash = await hashPassword('viewer123');

    // Insert test users (using ON CONFLICT for upsert)
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, is_active)
       VALUES (1, $1, $2, $3, TRUE)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         is_active = EXCLUDED.is_active`,
      ['admin@example.com', adminHash, 'Admin User']
    );

    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, is_active)
       VALUES (2, $1, $2, $3, TRUE)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         is_active = EXCLUDED.is_active`,
      ['editor@example.com', editorHash, 'Editor User']
    );

    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, is_active)
       VALUES (3, $1, $2, $3, TRUE)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         is_active = EXCLUDED.is_active`,
      ['viewer@example.com', viewerHash, 'Viewer User']
    );

    logger.info('Created test users');

    // Insert test library
    await client.query(
      `INSERT INTO libraries (id, name, created_by)
       VALUES (1, $1, 1)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         created_by = EXCLUDED.created_by`,
      ['Family Archive']
    );

    logger.info('Created test library');

    // Insert library members
    await client.query(
      `INSERT INTO library_members (library_id, user_id, role, status)
       VALUES (1, 1, 'owner', 'active')
       ON CONFLICT (library_id, user_id) DO UPDATE SET
         role = EXCLUDED.role,
         status = EXCLUDED.status`
    );

    await client.query(
      `INSERT INTO library_members (library_id, user_id, role, status)
       VALUES (1, 2, 'organizer', 'active')
       ON CONFLICT (library_id, user_id) DO UPDATE SET
         role = EXCLUDED.role,
         status = EXCLUDED.status`
    );

    await client.query(
      `INSERT INTO library_members (library_id, user_id, role, status)
       VALUES (1, 3, 'viewer', 'active')
       ON CONFLICT (library_id, user_id) DO UPDATE SET
         role = EXCLUDED.role,
         status = EXCLUDED.status`
    );

    logger.info('Created library members');

    await client.query('COMMIT');
    logger.info('Database seed completed successfully');
    logger.info('Test credentials:');
    logger.info('  Admin: admin@example.com / admin123');
    logger.info('  Editor: editor@example.com / editor123');
    logger.info('  Viewer: viewer@example.com / viewer123');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
