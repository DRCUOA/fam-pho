const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const Photo = require('../models/Photo');
const PhotoFile = require('../models/PhotoFile');
const ImageService = require('../services/imageService');
const FileService = require('../services/fileService');
const HashService = require('../services/hashService');
const ActivityLog = require('../services/activityLog');
const config = require('../utils/config');
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

// Get metadata entry queue
router.get('/photos/metadata-entry', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const libraryId = req.libraryId;
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');

    const photos = await Photo.findByLibrary(libraryId, {
      state: 'metadata_entry',
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

    const count = await Photo.countByState(libraryId, 'metadata_entry');

    res.json({ photos: photosWithFiles, count });
  } catch (error) {
    logger.error('Get metadata entry queue error:', error);
    res.status(500).json({ error: 'Failed to fetch metadata entry queue' });
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
  body('date_taken').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
  body('location_text').optional({ nullable: true, checkFalsy: true }).isString().trim(),
  body('description').optional({ nullable: true, checkFalsy: true }).isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date_taken, location_text, description } = req.body;
    
    // Convert empty strings to null and build update object
    const updateData = {};
    if (date_taken !== undefined) updateData.date_taken = date_taken || null;
    if (location_text !== undefined) updateData.location_text = location_text || null;
    if (description !== undefined) updateData.description = description || null;
    
    const photo = await Photo.update(req.photo.id, updateData);
    
    // Return updated photo with relations
    const updatedPhoto = await Photo.getWithRelations(photo.id);

    // Log activity
    await ActivityLog.log('photo.update', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: updateData,
    });

    res.json({ photo: updatedPhoto || photo });
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

// Create derivative (rotate)
router.post('/photos/:id/rotate', requireAuth, requirePhotoAccess, requireRole('contributor'), [
  body('degrees').isIn([90, 180, 270]),
  body('file_id').optional().isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { degrees, file_id } = req.body;
    const photo = req.photo;

    // Get source file (master or specified file)
    let sourceFile;
    if (file_id) {
      sourceFile = await PhotoFile.findById(file_id);
      if (!sourceFile || sourceFile.photo_id !== photo.id) {
        return res.status(404).json({ error: 'File not found' });
      }
    } else {
      // Use master file
      const files = await PhotoFile.findByPhotoId(photo.id);
      sourceFile = files.find(f => f.kind === 'master') || files.find(f => f.kind === 'original') || files[0];
      if (!sourceFile) {
        return res.status(404).json({ error: 'No source file found' });
      }
    }

    // Get source file path
    const sourcePath = path.join(config.storage.basePath, sourceFile.storage_key);
    
    // Generate derivative path
    const timestamp = Date.now();
    const ext = path.extname(sourceFile.filename) || '.jpg';
    const derivativeFilename = `rotated_${degrees}_${timestamp}${ext}`;
    const { fullPath, relativePath } = FileService.generateStoragePath(
      photo.library_id,
      derivativeFilename,
      'derivative'
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Rotate image
    const rotated = await ImageService.rotateImage(sourcePath, fullPath, degrees);
    if (!rotated) {
      return res.status(500).json({ error: 'Failed to rotate image' });
    }

    // Get metadata for rotated image
    const imageMetadata = await ImageService.getImageMetadata(fullPath);
    const fileStats = await fs.stat(fullPath);
    const sha256 = await HashService.computeFileHash(fullPath);

    // Create derivative file record
    const derivativeFile = await PhotoFile.create({
      photo_id: photo.id,
      kind: 'derivative',
      storage_key: relativePath,
      filename: derivativeFilename,
      mime_type: sourceFile.mime_type,
      bytes: fileStats.size,
      width: imageMetadata?.width || null,
      height: imageMetadata?.height || null,
      orientation: 1, // Rotated images are normalized
      sha256: sha256,
      parent_file_id: sourceFile.id,
      derivative_type: `rotate_${degrees}`,
    });

    // Log activity
    await ActivityLog.log('photo.derivative_created', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: { derivative_type: `rotate_${degrees}`, file_id: derivativeFile.id },
    });

    res.json({ 
      file: derivativeFile,
      message: `Photo rotated ${degrees} degrees`,
    });
  } catch (error) {
    logger.error('Rotate photo error:', error);
    res.status(500).json({ error: 'Failed to rotate photo' });
  }
});

module.exports = router;
