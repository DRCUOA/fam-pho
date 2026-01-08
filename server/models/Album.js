const pool = require('./db');

class Album {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM albums WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByLibrary(libraryId) {
    const result = await pool.query(
      'SELECT * FROM albums WHERE library_id = $1 ORDER BY name',
      [libraryId]
    );
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO albums (library_id, name, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.library_id, data.name, data.description || null, data.created_by]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE albums SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async addPhoto(albumId, photoId, addedBy) {
    await pool.query(
      `INSERT INTO photo_albums (album_id, photo_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (photo_id, album_id) DO NOTHING`,
      [albumId, photoId, addedBy]
    );
  }

  static async removePhoto(albumId, photoId) {
    await pool.query('DELETE FROM photo_albums WHERE album_id = $1 AND photo_id = $2', [
      albumId,
      photoId,
    ]);
  }
}

module.exports = Album;
