const pool = require('./db');

class PhotoFile {
  static async findByPhotoId(photoId) {
    const result = await pool.query('SELECT * FROM photo_files WHERE photo_id = $1', [photoId]);
    return result.rows;
  }

  static async findByHash(sha256) {
    const result = await pool.query('SELECT * FROM photo_files WHERE sha256 = $1', [sha256]);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM photo_files WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const result = await pool.query(
      `INSERT INTO photo_files (
        photo_id, kind, storage_key, filename, mime_type, bytes,
        width, height, orientation, sha256, metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.photo_id,
        data.kind,
        data.storage_key,
        data.filename,
        data.mime_type,
        data.bytes,
        data.width || null,
        data.height || null,
        data.orientation || 1,
        data.sha256,
        data.metadata_json ? JSON.stringify(data.metadata_json) : null,
      ]
    );
    return result.rows[0];
  }

  static async findByPhotoAndKind(photoId, kind) {
    const result = await pool.query(
      'SELECT * FROM photo_files WHERE photo_id = $1 AND kind = $2',
      [photoId, kind]
    );
    return result.rows[0] || null;
  }
}

module.exports = PhotoFile;
