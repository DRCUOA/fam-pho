const express = require('express');
const { body, validationResult } = require('express-validator');
const Tag = require('../models/Tag');
const Photo = require('../models/Photo');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember, requireRole, requirePhotoAccess } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// List tags in library
router.get('/tags', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const tags = await Tag.findByLibrary(req.libraryId);
    res.json({ tags });
  } catch (error) {
    logger.error('List tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Add tag to photo
router.post('/photos/:id/tags', requireAuth, requirePhotoAccess, requireRole('contributor'), [
  body('name').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tag = await Tag.findOrCreate(req.libraryId, req.body.name);
    await Tag.addToPhoto(req.photo.id, tag.id, req.user.id);

    await ActivityLog.log('photo.tag', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { tag_id: tag.id, tag_name: tag.name },
    });

    res.json({ tag, message: 'Tag added successfully' });
  } catch (error) {
    logger.error('Add tag error:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// Remove tag from photo
router.delete('/photos/:id/tags/:tagId', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    await Tag.removeFromPhoto(req.photo.id, req.params.tagId);

    await ActivityLog.log('photo.untag', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { tag_id: req.params.tagId },
    });

    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    logger.error('Remove tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

// Bulk update photo metadata
router.post('/photos/bulk-edit', requireAuth, requireLibraryMember, requireRole('contributor'), [
  body('photo_ids').isArray().notEmpty(),
  body('updates').isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { photo_ids, updates } = req.body;
    const results = [];

    for (const photoId of photo_ids) {
      const photo = await Photo.findById(photoId);
      if (photo && photo.library_id === req.libraryId) {
        await Photo.update(photoId, updates);
        results.push(photoId);

        await ActivityLog.log('photo.bulk_update', {
          libraryId: req.libraryId,
          actorUserId: req.user.id,
          entityType: 'photo',
          entityId: photoId,
          details: updates,
        });
      }
    }

    res.json({ 
      updated: results.length,
      photo_ids: results,
    });
  } catch (error) {
    logger.error('Bulk edit error:', error);
    res.status(500).json({ error: 'Failed to bulk update photos' });
  }
});

module.exports = router;
