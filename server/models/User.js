const pool = require('./db');

class User {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, data.password_hash, data.display_name || null, data.avatar_url || null]
    );
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async getLibraries(userId) {
    const result = await pool.query(
      `SELECT l.*, lm.role, lm.status
       FROM libraries l
       JOIN library_members lm ON l.id = lm.library_id
       WHERE lm.user_id = $1 AND lm.status = 'active'`,
      [userId]
    );
    return result.rows;
  }

  static async getLibraryMembership(userId, libraryId) {
    const result = await pool.query(
      `SELECT * FROM library_members
       WHERE user_id = $1 AND library_id = $2 AND status = 'active'`,
      [userId, libraryId]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
