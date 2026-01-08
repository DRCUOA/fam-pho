const pool = require('./db');

class Photo {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM photos WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByLibrary(libraryId, options = {}) {
    let query = 'SELECT * FROM photos WHERE library_id = $1';
    const params = [libraryId];
    let paramIndex = 2;

    if (options.state) {
      query += ` AND current_state = $${paramIndex}`;
      params.push(options.state);
      paramIndex++;
    }

    if (options.excludeRejected) {
      query += ' AND is_rejected = FALSE';
    }

    if (options.excludeDeleted) {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY upload_at DESC';

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO photos (library_id, uploaded_by, current_state, date_taken, location_text, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.library_id,
        data.uploaded_by,
        data.current_state || 'uploaded',
        data.date_taken || null,
        data.location_text || null,
        data.description || null,
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (data.current_state !== undefined) {
      updates.push(`current_state = $${paramIndex}`);
      params.push(data.current_state);
      paramIndex++;
    }
    if (data.date_taken !== undefined) {
      updates.push(`date_taken = $${paramIndex}`);
      params.push(data.date_taken);
      paramIndex++;
    }
    if (data.location_text !== undefined) {
      updates.push(`location_text = $${paramIndex}`);
      params.push(data.location_text);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }
    if (data.is_flagged !== undefined) {
      updates.push(`is_flagged = $${paramIndex}`);
      params.push(data.is_flagged);
      paramIndex++;
    }
    if (data.is_rejected !== undefined) {
      updates.push(`is_rejected = $${paramIndex}`);
      params.push(data.is_rejected);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE photos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async transitionState(photoId, fromState, toState, actorUserId, reason = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO photo_workflow_events (photo_id, from_state, to_state, actor_user_id, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [photoId, fromState, toState, actorUserId, reason]
      );

      const result = await client.query(
        'UPDATE photos SET current_state = $1 WHERE id = $2 RETURNING *',
        [toState, photoId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getWithRelations(id) {
    const photo = await this.findById(id);
    if (!photo) return null;

    // Get photo files
    const filesResult = await pool.query('SELECT * FROM photo_files WHERE photo_id = $1', [id]);
    photo.files = filesResult.rows;

    // Get people
    const peopleResult = await pool.query(
      `SELECT p.* FROM people p
       JOIN photo_people pp ON p.id = pp.person_id
       WHERE pp.photo_id = $1`,
      [id]
    );
    photo.people = peopleResult.rows;

    // Get tags
    const tagsResult = await pool.query(
      `SELECT t.* FROM tags t
       JOIN photo_tags pt ON t.id = pt.tag_id
       WHERE pt.photo_id = $1`,
      [id]
    );
    photo.tags = tagsResult.rows;

    // Get albums
    const albumsResult = await pool.query(
      `SELECT a.* FROM albums a
       JOIN photo_albums pa ON a.id = pa.album_id
       WHERE pa.photo_id = $1`,
      [id]
    );
    photo.albums = albumsResult.rows;

    // Get workflow events
    const eventsResult = await pool.query(
      'SELECT * FROM photo_workflow_events WHERE photo_id = $1 ORDER BY created_at DESC',
      [id]
    );
    photo.workflow_events = eventsResult.rows;

    return photo;
  }

  static async countByState(libraryId, state) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM photos
       WHERE library_id = $1 AND current_state = $2 AND is_rejected = FALSE AND deleted_at IS NULL`,
      [libraryId, state]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = Photo;
