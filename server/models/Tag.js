const pool = require('./db');

class Tag {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByLibrary(libraryId) {
    const result = await pool.query(
      'SELECT * FROM tags WHERE library_id = $1 ORDER BY name',
      [libraryId]
    );
    return result.rows;
  }

  static async findOrCreate(libraryId, name) {
    // Try to find existing
    const findResult = await pool.query(
      'SELECT * FROM tags WHERE library_id = $1 AND name = $2',
      [libraryId, name]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0];
    }

    // Create new
    const result = await pool.query(
      'INSERT INTO tags (library_id, name) VALUES ($1, $2) RETURNING *',
      [libraryId, name]
    );
    return result.rows[0];
  }

  static async addToPhoto(photoId, tagId, addedBy) {
    await pool.query(
      `INSERT INTO photo_tags (photo_id, tag_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (photo_id, tag_id) DO NOTHING`,
      [photoId, tagId, addedBy]
    );
  }

  static async removeFromPhoto(photoId, tagId) {
    await pool.query('DELETE FROM photo_tags WHERE photo_id = $1 AND tag_id = $2', [
      photoId,
      tagId,
    ]);
  }
}

module.exports = Tag;
