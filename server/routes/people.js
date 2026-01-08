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
  body('name').notEmpty().trim(),
  body('relationship_label').optional().isString().trim(),
  body('notes').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const person = await Person.create({
      library_id: req.libraryId,
      name: req.body.name,
      relationship_label: req.body.relationship_label,
      notes: req.body.notes,
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
router.post('/photos/:photoId/people/:personId', requireAuth, requireLibraryMember, requireRole('contributor'), async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    
    if (!photo || photo.library_id !== req.libraryId) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    await Person.addToPhoto(photo.id, req.params.personId, req.user.id);

    await ActivityLog.log('photo.tag_person', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: { person_id: req.params.personId },
    });

    res.json({ message: 'Person tagged successfully' });
  } catch (error) {
    logger.error('Tag person error:', error);
    res.status(500).json({ error: 'Failed to tag person' });
  }
});

// Remove person tag from photo
router.delete('/photos/:photoId/people/:personId', requireAuth, requireLibraryMember, requireRole('contributor'), async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    
    if (!photo || photo.library_id !== req.libraryId) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    await Person.removeFromPhoto(photo.id, req.params.personId);

    await ActivityLog.log('photo.untag_person', {
      libraryId: req.libraryId,
      actorUserId: req.user.id,
      entityType: 'photo',
      entityId: photo.id,
      details: { person_id: req.params.personId },
    });

    res.json({ message: 'Person tag removed successfully' });
  } catch (error) {
    logger.error('Untag person error:', error);
    res.status(500).json({ error: 'Failed to remove person tag' });
  }
});

module.exports = router;
