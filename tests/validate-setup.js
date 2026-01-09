/**
 * Test Setup Validation Script
 * Run this to verify test environment is set up correctly
 * Usage: node tests/validate-setup.js
 */

const pool = require('../server/models/db');

async function validateSetup() {
  console.log('🔍 Validating test setup...\n');
  
  let errors = [];
  let warnings = [];
  
  // 1. Check database connection
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection: OK');
  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
    console.log('❌ Database connection: FAILED');
  }
  
  // 2. Check required tables exist
  const requiredTables = [
    'users', 'libraries', 'library_members', 'photos', 
    'photo_files', 'photo_workflow_events', 'people', 'tags', 'albums'
  ];
  
  for (const table of requiredTables) {
    try {
      await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`✅ Table '${table}': exists`);
    } catch (error) {
      if (error.code === '42P01') {
        errors.push(`Table '${table}' does not exist`);
        console.log(`❌ Table '${table}': MISSING`);
      } else {
        warnings.push(`Table '${table}': ${error.message}`);
        console.log(`⚠️  Table '${table}': ${error.message}`);
      }
    }
  }
  
  // 3. Check test user can be created
  try {
    const argon2 = require('argon2');
    const testEmail = 'validation-test@example.com';
    const passwordHash = await argon2.hash('test123');
    
    // Try to create and delete a test user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id`,
      [testEmail, passwordHash, 'Validation Test User']
    );
    
    await pool.query('DELETE FROM users WHERE id = $1', [result.rows[0].id]);
    console.log('✅ Test user creation: OK');
  } catch (error) {
    errors.push(`Test user creation failed: ${error.message}`);
    console.log('❌ Test user creation: FAILED');
  }
  
  // 4. Check environment
  if (process.env.NODE_ENV === 'test') {
    console.log('✅ NODE_ENV: test (correct for testing)');
  } else {
    warnings.push('NODE_ENV is not set to "test"');
    console.log('⚠️  NODE_ENV: not set to "test"');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Test environment is ready.');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}):`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

validateSetup().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
