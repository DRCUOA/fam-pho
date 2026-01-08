const express = require('express');
const { body, validationResult } = require('express-validator');
const Album = require('../models/Album');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember, requireRole, requirePhotoAccess } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// List albums in library
router.get('/albums', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const albums = await Album.findByLibrary(req.libraryId);
    res.json({ albums });
  } catch (error) {
    logger.error('List albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Create album
router.post('/albums', requireAuth, requireLibraryMember, requireRole('contributor'), [
  body('name').notEmpty().trim(),
  body('description').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const album = await Album.create({
      library_id: req.libraryId,
      name: req.body.name,
      description: req.body.description,
      created_by: req.user.id,
    });

    await ActivityLog.log('album.create', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'album',
      entityId: album.id,
    });

    res.status(201).json({ album });
  } catch (error) {
    logger.error('Create album error:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
router.put('/albums/:id', requireAuth, requireLibraryMember, requireRole('contributor'), [
  body('name').optional().notEmpty().trim(),
  body('description').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const album = await Album.update(req.params.id, req.body);

    await ActivityLog.log('album.update', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'album',
      entityId: album.id,
    });

    res.json({ album });
  } catch (error) {
    logger.error('Update album error:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Add photo to album
router.post('/photos/:id/albums/:albumId', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    await Album.addPhoto(req.params.albumId, req.photo.id, req.user.id);

    await ActivityLog.log('photo.add_to_album', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { album_id: req.params.albumId },
    });

    res.json({ message: 'Photo added to album successfully' });
  } catch (error) {
    logger.error('Add to album error:', error);
    res.status(500).json({ error: 'Failed to add photo to album' });
  }
});

// Remove photo from album
router.delete('/photos/:id/albums/:albumId', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    await Album.removePhoto(req.params.albumId, req.photo.id);

    await ActivityLog.log('photo.remove_from_album', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { album_id: req.params.albumId },
    });

    res.json({ message: 'Photo removed from album successfully' });
  } catch (error) {
    logger.error('Remove from album error:', error);
    res.status(500).json({ error: 'Failed to remove photo from album' });
  }
});

module.exports = router;
