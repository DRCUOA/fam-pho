const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Photo = require('../models/Photo');
const PhotoFile = require('../models/PhotoFile');
const HashService = require('../services/hashService');
const FileService = require('../services/fileService');
const ImageService = require('../services/imageService');
const ExifService = require('../services/exifService');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const { requireLibraryMember } = require('../middleware/authorization');
const config = require('../utils/config');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const libraryId = req.body.library_id || req.query.library_id;
    const { fullPath } = FileService.generateStoragePath(libraryId || 0, file.originalname, 'incoming');
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${sanitizedName}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Upload single or multiple photos
router.post('/photos/upload', requireAuth, requireLibraryMember, upload.array('photos', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const libraryId = req.libraryId;
    const userId = req.user.id;
    const results = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;

        // Compute SHA-256 hash
        const sha256 = await HashService.computeFileHash(filePath);

        // Check for duplicates
        const existingFiles = await PhotoFile.findByHash(sha256);
        if (existingFiles.length > 0) {
          // Duplicate detected - delete uploaded file
          await FileService.deleteFile(filePath);
          results.push({
            filename: file.originalname,
            status: 'duplicate',
            message: 'Duplicate file detected',
            existing_photo_id: existingFiles[0].photo_id,
          });
          continue;
        }

        // Read EXIF data
        const exifData = await ExifService.readExif(filePath);
        const dateTaken = ExifService.extractDateTaken(exifData);
        const orientation = ExifService.extractOrientation(exifData);

        // Get image metadata
        const imageMetadata = await ImageService.getImageMetadata(filePath);

        // Generate storage path
        const { fullPath, relativePath, filename } = FileService.generateStoragePath(
          libraryId,
          file.originalname,
          'incoming'
        );

        // Move file to final location
        await FileService.saveFile(filePath, fullPath);
        await FileService.deleteFile(filePath); // Remove temp file

        // Create photo record
        const photo = await Photo.create({
          library_id: libraryId,
          uploaded_by: userId,
          current_state: 'uploaded',
          date_taken: dateTaken,
        });

        // Transition to triage state
        await Photo.transitionState(photo.id, 'uploaded', 'triage', userId, 'Uploaded');

        // Create photo file record
        const photoFile = await PhotoFile.create({
          photo_id: photo.id,
          kind: 'original',
          storage_key: relativePath,
          filename: file.originalname,
          mime_type: file.mimetype,
          bytes: file.size,
          width: imageMetadata?.width || null,
          height: imageMetadata?.height || null,
          orientation: orientation,
          sha256: sha256,
          metadata_json: exifData,
        });

        // Generate thumbnail
        const thumbnailPath = path.join(
          config.storage.derivatives,
          String(libraryId),
          `thumb_${photo.id}.jpg`
        );
        await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
        const thumbnailGenerated = await ImageService.generateThumbnail(fullPath, thumbnailPath);

        if (thumbnailGenerated) {
          const thumbnailRelativePath = path.relative(config.storage.basePath, thumbnailPath);
          await PhotoFile.create({
            photo_id: photo.id,
            kind: 'thumbnail',
            storage_key: thumbnailRelativePath,
            filename: `thumb_${photo.id}.jpg`,
            mime_type: 'image/jpeg',
            bytes: (await fs.stat(thumbnailPath)).size,
            sha256: await HashService.computeFileHash(thumbnailPath),
          });
        }

        // Log activity
        await ActivityLog.log('photo.upload', {
          libraryId,
          actorUserId: userId,
          entityType: 'photo',
          entityId: photo.id,
          details: { filename: file.originalname, sha256 },
        });

        results.push({
          filename: file.originalname,
          status: 'success',
          photo_id: photo.id,
        });
      } catch (error) {
        logger.error(`Upload error for ${file.originalname}:`, error);
        results.push({
          filename: file.originalname,
          status: 'error',
          message: error.message,
        });
      }
    }

    res.json({
      uploaded: results.filter(r => r.status === 'success').length,
      duplicates: results.filter(r => r.status === 'duplicate').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
