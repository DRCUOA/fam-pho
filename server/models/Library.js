const pool = require('./db');

class Library {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM libraries WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO libraries (name, created_by)
       VALUES ($1, $2)
       RETURNING *`,
      [data.name, data.created_by]
    );
    return result.rows[0];
  }

  static async addMember(libraryId, userId, role = 'owner') {
    const result = await pool.query(
      `INSERT INTO library_members (library_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (library_id, user_id) DO UPDATE SET
         role = EXCLUDED.role,
         status = 'active'
       RETURNING *`,
      [libraryId, userId, role]
    );
    return result.rows[0];
  }
}

module.exports = Library;
