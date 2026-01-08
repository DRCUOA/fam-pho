const pool = require('../models/db');

class ActivityLog {
  static async log(action, options = {}) {
    const {
      libraryId = null,
      actorUserId,
      entityType = null,
      entityId = null,
      details = null,
    } = options;

    if (!actorUserId) {
      throw new Error('actorUserId is required');
    }

    await pool.query(
      `INSERT INTO activity_log (library_id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        libraryId,
        actorUserId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
      ]
    );
  }

  static async getByLibrary(libraryId, options = {}) {
    let query = 'SELECT * FROM activity_log WHERE library_id = $1';
    const params = [libraryId];
    let paramIndex = 2;

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getByUser(userId, options = {}) {
    let query = 'SELECT * FROM activity_log WHERE actor_user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = ActivityLog;
