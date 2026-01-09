const express = require('express');
const { body, validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const PhotoFile = require('../models/PhotoFile');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const { requirePhotoAccess, requireLibraryMember, requireRole } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// Get triage queue
router.get('/photos/triage', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const libraryId = req.libraryId;
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');

    const photos = await Photo.findByLibrary(libraryId, {
      state: 'triage',
      excludeRejected: true,
      excludeDeleted: true,
      limit,
      offset,
    });

    // Attach file info
    const photosWithFiles = await Promise.all(
      photos.map(async (photo) => {
        const files = await PhotoFile.findByPhotoId(photo.id);
        return {
          ...photo,
          files,
        };
      })
    );

    const total = await Photo.countByState(libraryId, 'triage');

    res.json({
      photos: photosWithFiles,
      total,
    });
  } catch (error) {
    logger.error('Triage queue error:', error);
    res.status(500).json({ error: 'Failed to fetch triage queue' });
  }
});

// Get photo by ID
router.get('/photos/:id', requireAuth, requirePhotoAccess, async (req, res) => {
  try {
    const photo = await Photo.getWithRelations(req.photo.id);
    res.json({ photo });
  } catch (error) {
    logger.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Update photo metadata
router.put('/photos/:id', requireAuth, requirePhotoAccess, requireRole('contributor'), [
  body('date_taken').optional().isISO8601(),
  body('location_text').optional().isString().trim(),
  body('description').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date_taken, location_text, description } = req.body;
    const photo = await Photo.update(req.photo.id, {
      date_taken,
      location_text,
      description,
    });

    // Log activity
    await ActivityLog.log('photo.update', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: { date_taken, location_text, description },
    });

    res.json({ photo });
  } catch (error) {
    logger.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Triage action
router.post('/photos/:id/triage', requireAuth, requirePhotoAccess, requireRole('contributor'), [
  body('action').isIn(['keep', 'discard', 'duplicate']),
  body('reason').optional({ nullable: true, checkFalsy: true }).isString(),
  body('duplicate_of').optional({ nullable: true, checkFalsy: true }).isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, reason, duplicate_of } = req.body;
    const photo = req.photo;
    const fromState = photo.current_state;
    let toState;

    if (action === 'keep') {
      toState = 'metadata_entry';
    } else if (action === 'discard') {
      await Photo.update(photo.id, { is_rejected: true });
      toState = 'rejected';
    } else if (action === 'duplicate') {
      if (!duplicate_of) {
        return res.status(400).json({ error: 'duplicate_of required for duplicate action' });
      }
      await Photo.update(photo.id, { is_rejected: true });
      toState = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await Photo.transitionState(photo.id, fromState, toState, req.user.id, reason);

    // Log activity
    await ActivityLog.log('photo.triage', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: { action, reason, duplicate_of },
    });

    const updatedPhoto = await Photo.findById(photo.id);

    res.json({ 
      photo: updatedPhoto,
      message: `Photo ${action}ed successfully`,
    });
  } catch (error) {
    logger.error('Triage action error:', error);
    res.status(500).json({ error: 'Failed to process triage action' });
  }
});

// Undo discard
router.post('/photos/:id/undo-discard', requireAuth, requirePhotoAccess, requireRole('organizer'), async (req, res) => {
  try {
    const photo = await Photo.update(req.photo.id, {
      is_rejected: false,
    });

    await Photo.transitionState(photo.id, 'rejected', 'triage', req.user.id, 'Undo discard');

    // Log activity
    await ActivityLog.log('photo.undo_discard', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
    });

    res.json({ photo });
  } catch (error) {
    logger.error('Undo discard error:', error);
    res.status(500).json({ error: 'Failed to undo discard' });
  }
});

module.exports = router;
