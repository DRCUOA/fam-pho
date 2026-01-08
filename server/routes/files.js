const express = require('express');
const path = require('path');
const fs = require('fs');
const PhotoFile = require('../models/PhotoFile');
const Photo = require('../models/Photo');
const User = require('../models/User');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const config = require('../utils/config');
const logger = require('../utils/logger');

const router = express.Router();

// Serve file with authorization
router.get('/files/:id', requireAuth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = await PhotoFile.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check photo access
    const photo = await Photo.findById(file.photo_id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check library membership
    const membership = await User.getLibraryMembership(req.user.id, photo.library_id);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build file path
    const filePath = path.join(config.storage.basePath, file.storage_key);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found on disk: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Log access
    await ActivityLog.log('file.access', {
      libraryId: photo.library_id,
      actorUserId: req.user.id,
      entityType: 'photo_file',
      entityId: file.id,
      details: { kind: file.kind },
    });

    // Set headers
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.bytes);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

    // Support range requests for large files
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);

      fileStream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    logger.error('File serve error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;
