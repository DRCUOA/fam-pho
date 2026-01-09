const express = require('express');
const { body, validationResult } = require('express-validator');
const Library = require('../models/Library');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create a new library
router.post('/libraries', requireAuth, [
  body('name').notEmpty().trim().withMessage('Library name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const library = await Library.create({
      name: req.body.name.trim(),
      created_by: req.user.id,
    });

    // Add creator as owner
    await Library.addMember(library.id, req.user.id, 'owner');

    await ActivityLog.log('library.create', {
      libraryId: library.id,
      actorUserId: req.user.id,
      entityType: 'library',
      entityId: library.id,
    });

    logger.info(`Library created: ${library.name} by user ${req.user.email}`);

    res.status(201).json({ library });
  } catch (error) {
    logger.error('Create library error:', error);
    res.status(500).json({ error: 'Failed to create library' });
  }
});

module.exports = router;
