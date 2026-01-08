const express = require('express');
const Photo = require('../models/Photo');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember, requirePhotoAccess } = require('../middleware/authorization');
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
      },
    });
  } catch (error) {
    logger.error('Next tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch next tasks' });
  }
});

// Complete metadata entry (transition to complete)
router.post('/photos/:id/complete', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    // Check photo access
    const photo = await Photo.findById(req.params.id);
    if (!photo || photo.library_id !== req.libraryId) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.current_state !== 'metadata_entry') {
      return res.status(400).json({ error: 'Photo is not in metadata_entry state' });
    }

    await Photo.transitionState(photo.id, 'metadata_entry', 'complete', req.user.id, 'Metadata entry completed');

    const updatedPhoto = await Photo.findById(photo.id);

    res.json({ 
      photo: updatedPhoto,
      message: 'Photo marked as complete',
    });
  } catch (error) {
    logger.error('Complete photo error:', error);
    res.status(500).json({ error: 'Failed to complete photo' });
  }
});

module.exports = router;
