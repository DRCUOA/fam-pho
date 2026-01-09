const express = require('express');
const Photo = require('../models/Photo');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember, requirePhotoAccess, requireRole } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// Get next tasks
router.get('/workflow/next-tasks', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const libraryId = req.libraryId;

    const [triageCount, metadataEntryCount, flaggedCount] = await Promise.all([
      Photo.countByState(libraryId, 'triage'),
      Photo.countByState(libraryId, 'metadata_entry'),
      Photo.countByState(libraryId, 'flagged'),
    ]);

    // Get sample photos for each queue
    const [triagePhotos, metadataPhotos] = await Promise.all([
      Photo.findByLibrary(libraryId, {
        state: 'triage',
        excludeRejected: true,
        excludeDeleted: true,
        limit: 5,
      }),
      Photo.findByLibrary(libraryId, {
        state: 'metadata_entry',
        excludeRejected: true,
        excludeDeleted: true,
        limit: 5,
      }),
    ]);

    // Get rejected photos count
    const rejectedCount = await Photo.countByState(libraryId, 'rejected');

    res.json({
      queues: {
        triage: {
          count: triageCount,
          photos: triagePhotos,
        },
        metadata_entry: {
          count: metadataEntryCount,
          photos: metadataPhotos,
        },
        flagged: {
          count: flaggedCount,
        },
        rejected: {
          count: rejectedCount,
        },
      },
    });
  } catch (error) {
    logger.error('Next tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch next tasks' });
  }
});

// Get rejected photos queue
router.get('/workflow/rejected', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const libraryId = req.libraryId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const rejectedPhotos = await Photo.findByLibrary(libraryId, {
      state: 'rejected',
      excludeDeleted: true,
      limit,
      offset,
    });

    const count = await Photo.countByState(libraryId, 'rejected');

    res.json({
      photos: rejectedPhotos,
      count,
    });
  } catch (error) {
    logger.error('Rejected queue error:', error);
    res.status(500).json({ error: 'Failed to fetch rejected photos' });
  }
});

// Complete metadata entry (transition to complete)
router.post('/photos/:id/complete', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    const photo = req.photo; // Already validated by requirePhotoAccess

    if (photo.current_state !== 'metadata_entry') {
      logger.warn(`Photo ${photo.id} is not in metadata_entry state. Current: ${photo.current_state}`);
      return res.status(400).json({ error: `Photo is not in metadata_entry state. Current state: ${photo.current_state}` });
    }

    logger.info(`Completing photo ${photo.id}, transitioning from metadata_entry to complete`);
    await Photo.transitionState(photo.id, 'metadata_entry', 'complete', req.user.id, 'Metadata entry completed');

    // Verify the transition worked
    const updatedPhoto = await Photo.findById(photo.id);
    if (updatedPhoto.current_state !== 'complete') {
      logger.error(`State transition failed for photo ${photo.id}. Expected: complete, Got: ${updatedPhoto.current_state}`);
      return res.status(500).json({ error: 'State transition failed' });
    }

    logger.info(`Photo ${photo.id} successfully transitioned to complete state`);

    res.json({ 
      photo: updatedPhoto,
      message: 'Photo marked as complete',
    });
  } catch (error) {
    logger.error('Complete photo error:', error);
    res.status(500).json({ error: 'Failed to complete photo: ' + error.message });
  }
});

module.exports = router;
