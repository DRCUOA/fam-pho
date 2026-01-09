const express = require('express');
const { body, validationResult } = require('express-validator');
const Person = require('../models/Person');
const Photo = require('../models/Photo');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember, requireRole, requirePhotoAccess } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();

// List people in library
router.get('/people', requireAuth, requireLibraryMember, async (req, res) => {
  try {
    const people = await Person.findByLibrary(req.libraryId);
    res.json({ people });
  } catch (error) {
    logger.error('List people error:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// Create person
router.post('/people', requireAuth, requireLibraryMember, requireRole('contributor'), [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('relationship_label').optional({ nullable: true, checkFalsy: true }).isString().trim(),
  body('notes').optional({ nullable: true, checkFalsy: true }).isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Create person validation errors:', errors.array());
      logger.warn('Request body:', req.body);
      logger.warn('Library ID:', req.libraryId);
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure name is trimmed
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const person = await Person.create({
      library_id: req.libraryId,
      name: name,
      relationship_label: req.body.relationship_label?.trim() || null,
      notes: req.body.notes?.trim() || null,
    });

    await ActivityLog.log('person.create', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'person',
      entityId: person.id,
    });

    res.status(201).json({ person });
  } catch (error) {
    logger.error('Create person error:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// Update person
router.put('/people/:id', requireAuth, requireLibraryMember, requireRole('contributor'), [
  body('name').optional().notEmpty().trim(),
  body('relationship_label').optional().isString().trim(),
  body('notes').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const person = await Person.update(req.params.id, req.body);

    await ActivityLog.log('person.update', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'person',
      entityId: person.id,
    });

    res.json({ person });
  } catch (error) {
    logger.error('Update person error:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

// Tag photo with person
router.post('/photos/:photoId/people/:personId', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    // requirePhotoAccess sets req.photo and req.libraryId
    await Person.addToPhoto(req.photo.id, req.params.personId, req.user.id);

    await ActivityLog.log('photo.tag_person', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { person_id: req.params.personId },
    });

    res.json({ message: 'Person tagged successfully' });
  } catch (error) {
    logger.error('Tag person error:', error);
    res.status(500).json({ error: 'Failed to tag person' });
  }
});

// Remove person tag from photo
router.delete('/photos/:photoId/people/:personId', requireAuth, requirePhotoAccess, requireRole('contributor'), async (req, res) => {
  try {
    // requirePhotoAccess sets req.photo and req.libraryId
    await Person.removeFromPhoto(req.photo.id, req.params.personId);

    await ActivityLog.log('photo.untag_person', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: req.photo.id,
      details: { person_id: req.params.personId },
    });

    res.json({ message: 'Person tag removed successfully' });
  } catch (error) {
    logger.error('Untag person error:', error);
    res.status(500).json({ error: 'Failed to remove person tag' });
  }
});

module.exports = router;
