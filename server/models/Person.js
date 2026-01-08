const pool = require('./db');

class Person {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM people WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByLibrary(libraryId) {
    const result = await pool.query(
      'SELECT * FROM people WHERE library_id = $1 ORDER BY name',
      [libraryId]
    );
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO people (library_id, name, relationship_label, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.library_id, data.name, data.relationship_label || null, data.notes || null]
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
    if (data.relationship_label !== undefined) {
      updates.push(`relationship_label = $${paramIndex}`);
      params.push(data.relationship_label);
      paramIndex++;
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(data.notes);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE people SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async addToPhoto(photoId, personId, taggedBy) {
    await pool.query(
      `INSERT INTO photo_people (photo_id, person_id, tagged_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (photo_id, person_id) DO NOTHING`,
      [photoId, personId, taggedBy]
    );
  }

  static async removeFromPhoto(photoId, personId) {
    await pool.query('DELETE FROM photo_people WHERE photo_id = $1 AND person_id = $2', [
      photoId,
      personId,
    ]);
  }
}

module.exports = Person;
