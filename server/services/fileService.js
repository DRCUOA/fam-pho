const fs = require('fs').promises;
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

// Ensure storage directories exist
const ensureDirectories = async () => {
  const dirs = [
    config.storage.incoming,
    config.storage.masters,
    config.storage.derivatives,
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory ${dir}:`, error);
      throw error;
    }
  }
};

// Initialize directories on module load
ensureDirectories().catch((error) => {
  logger.error('Failed to initialize storage directories:', error);
});

class FileService {
  // Generate storage path for a file
  static generateStoragePath(libraryId, filename, kind = 'incoming') {
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const newFilename = `${sanitizedName}_${timestamp}${ext}`;

    let baseDir;
    if (kind === 'incoming') {
      baseDir = config.storage.incoming;
    } else if (kind === 'master') {
      baseDir = path.join(config.storage.masters, String(libraryId));
    } else if (kind === 'derivative') {
      baseDir = path.join(config.storage.derivatives, String(libraryId));
    } else {
      throw new Error(`Invalid storage kind: ${kind}`);
    }

    // Ensure library directory exists
    if (kind !== 'incoming') {
      fs.mkdir(baseDir, { recursive: true }).catch((err) => {
        logger.error(`Failed to create library directory: ${err}`);
      });
    }

    return {
      fullPath: path.join(baseDir, newFilename),
      relativePath: path.relative(config.storage.basePath, path.join(baseDir, newFilename)),
      filename: newFilename,
    };
  }

  // Save file to storage
  static async saveFile(sourcePath, targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
    return targetPath;
  }

  // Move file from incoming to master
  static async moveToMaster(sourcePath, libraryId, filename) {
    const { fullPath } = this.generateStoragePath(libraryId, filename, 'master');
    await this.saveFile(sourcePath, fullPath);
    await fs.unlink(sourcePath); // Remove from incoming
    return fullPath;
  }

  // Delete file
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // Check if file exists
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file stats
  static async getFileStats(filePath) {
    return await fs.stat(filePath);
  }
}

module.exports = FileService;
