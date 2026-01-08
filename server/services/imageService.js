const sharp = require('sharp');
const path = require('path');
const FileService = require('./fileService');
const logger = require('../utils/logger');

class ImageService {
  // Generate thumbnail
  static async generateThumbnail(sourcePath, targetPath, size = 300) {
    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(targetPath);
      return true;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      return false;
    }
  }

  // Generate preview (medium size)
  static async generatePreview(sourcePath, targetPath, maxWidth = 1920, maxHeight = 1920) {
    try {
      await sharp(sourcePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(targetPath);
      return true;
    } catch (error) {
      logger.error('Preview generation failed:', error);
      return false;
    }
  }

  // Get image metadata
  static async getImageMetadata(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        orientation: metadata.orientation || 1,
      };
    } catch (error) {
      logger.error('Failed to get image metadata:', error);
      return null;
    }
  }
}

module.exports = ImageService;
