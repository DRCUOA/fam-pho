const express = require('express');
const pool = require('../models/db');
const Photo = require('../models/Photo');
const PhotoFile = require('../models/PhotoFile');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// Search photos
router.get('/photos/search', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const libraryId = req.libraryId;
    const query = req.query.q || '';
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const offset = (page - 1) * limit;

    // Filters
    const dateFrom = req.query.date_from || null;
    const dateTo = req.query.date_to || null;
    const peopleIds = req.query.people ? req.query.people.split(',').map(Number) : [];
    const tagIds = req.query.tags ? req.query.tags.split(',').map(Number) : [];
    const albumId = req.query.album ? parseInt(req.query.album) : null;
    const sortBy = req.query.sort_by || 'upload_at';
    const sortOrder = req.query.sort_order || 'DESC';

    let sql = `
      SELECT DISTINCT p.*
      FROM photos p
      WHERE p.library_id = $1 AND p.is_rejected = FALSE AND p.deleted_at IS NULL
    `;
    const params = [libraryId];
    let paramIndex = 2;

    // Full-text search using PostgreSQL tsvector
    if (query) {
      sql = `
        SELECT DISTINCT p.*
        FROM photos p
        WHERE p.library_id = $1 AND p.is_rejected = FALSE AND p.deleted_at IS NULL
        AND p.search_vector @@ plainto_tsquery('english', $${paramIndex})
      `;
      params.push(query);
      paramIndex++;
    }

    // Date range filter
    if (dateFrom) {
      sql += ` AND p.date_taken >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }
    if (dateTo) {
      sql += ` AND p.date_taken <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // People filter
    if (peopleIds.length > 0) {
      const placeholders = peopleIds.map((_, i) => `$${paramIndex + i}`).join(',');
      sql += ` AND p.id IN (
        SELECT photo_id FROM photo_people WHERE person_id IN (${placeholders})
      )`;
      params.push(...peopleIds);
      paramIndex += peopleIds.length;
    }

    // Tags filter
    if (tagIds.length > 0) {
      const placeholders = tagIds.map((_, i) => `$${paramIndex + i}`).join(',');
      sql += ` AND p.id IN (
        SELECT photo_id FROM photo_tags WHERE tag_id IN (${placeholders})
      )`;
      params.push(...tagIds);
      paramIndex += tagIds.length;
    }

    // Album filter
    if (albumId) {
      sql += ` AND p.id IN (
        SELECT photo_id FROM photo_albums WHERE album_id = $${paramIndex}
      )`;
      params.push(albumId);
      paramIndex++;
    }

    // Sorting
    const allowedSorts = ['upload_at', 'date_taken', 'id'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'upload_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY p.${sortField} ${sortDir}`;

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    const photos = result.rows;

    // Attach file info
    const photosWithFiles = await Promise.all(
      photos.map(async (photo) => {
        const files = await PhotoFile.findByPhotoId(photo.id);
        const thumbnail = files.find((f) => f.kind === 'thumbnail');
        return {
          ...photo,
          thumbnail: thumbnail
            ? {
                id: thumbnail.id,
                url: `/api/files/${thumbnail.id}`,
              }
            : null,
        };
      })
    );

    // Count total
    let countSql = sql.replace(/SELECT DISTINCT p\.\*/g, 'SELECT COUNT(DISTINCT p.id) as count');
    countSql = countSql.replace(/ORDER BY.*$/, '');
    countSql = countSql.replace(/LIMIT \$\d+ OFFSET \$\d+$/, '');
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      photos: photosWithFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
