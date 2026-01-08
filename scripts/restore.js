const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const config = require('../server/utils/config');
const logger = require('../server/utils/logger');

class RestoreService {
  static async restoreBackup(backupPath) {
    logger.info(`Starting restore from ${backupPath}`);

    try {
      // Decrypt if encrypted
      let archivePath = backupPath;
      if (backupPath.endsWith('.encrypted')) {
        archivePath = await this.decryptBackup(backupPath);
      }

      // Extract archive
      const extractDir = await this.extractArchive(archivePath);

      // Restore database
      await this.restoreDatabase(extractDir);

      // Restore storage
      await this.restoreStorage(extractDir);

      // Cleanup
      await fs.rm(extractDir, { recursive: true });
      if (archivePath !== backupPath) {
        await fs.unlink(archivePath);
      }

      logger.info('Restore completed successfully');
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  static async decryptBackup(encryptedPath) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.backup.encryptionKey, 'salt', 32);

    const encrypted = await fs.readFile(encryptedPath);
    const iv = encrypted.slice(0, 16);
    const data = encrypted.slice(16);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    const decryptedPath = encryptedPath.replace('.encrypted', '');
    await fs.writeFile(decryptedPath, decrypted);

    return decryptedPath;
  }

  static async extractArchive(archivePath) {
    const extractDir = path.join(config.backup.path, 'restore-temp');
    await fs.mkdir(extractDir, { recursive: true });

    const zip = new AdmZip(archivePath);
    zip.extractAllTo(extractDir, true);

    return extractDir;
  }

  static async restoreDatabase(extractDir) {
    const backupDbPath = path.join(extractDir, 'database.db');
    const dbPath = config.database.path;

    // Backup current database
    const currentBackup = dbPath + '.pre-restore-' + Date.now();
    await fs.copyFile(dbPath, currentBackup);

    // Restore
    await fs.copyFile(backupDbPath, dbPath);
    logger.info('Database restored');
  }

  static async restoreStorage(extractDir) {
    const storageBackupDir = path.join(extractDir, 'storage');

    try {
      await fs.access(storageBackupDir);
    } catch {
      logger.warn('No storage backup found');
      return;
    }

    // Restore storage directories
    const dirs = ['_incoming', 'masters', 'derivatives'];
    for (const dir of dirs) {
      const sourceDir = path.join(storageBackupDir, dir);
      const targetDir = path.join(config.storage.basePath, dir);

      try {
        await fs.access(sourceDir);
        await fs.rm(targetDir, { recursive: true, force: true });
        await this.copyDirectory(sourceDir, targetDir);
        logger.info(`Storage directory restored: ${dir}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  static async copyDirectory(source, target) {
    await fs.mkdir(target, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupPath = process.argv[2];
  if (!backupPath) {
    console.error('Usage: node restore.js <backup-path>');
    process.exit(1);
  }

  RestoreService.restoreBackup(backupPath)
    .then(() => {
      console.log('Restore completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Restore failed:', error);
      process.exit(1);
    });
}

module.exports = RestoreService;
