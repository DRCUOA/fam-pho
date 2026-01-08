const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const config = require('../server/utils/config');
const logger = require('../server/utils/logger');

class BackupService {
  static async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(config.backup.path, timestamp);
    await fs.mkdir(backupDir, { recursive: true });

    logger.info(`Starting backup to ${backupDir}`);

    try {
      // Backup database
      await this.backupDatabase(backupDir);

      // Backup storage directories
      await this.backupStorage(backupDir);

      // Create archive
      const archivePath = await this.createArchive(backupDir, timestamp);

      // Encrypt if key is configured
      if (config.backup.encryptionKey) {
        await this.encryptBackup(archivePath);
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      logger.info(`Backup completed: ${archivePath}`);
      return archivePath;
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  static async backupDatabase(backupDir) {
    const dbPath = config.database.path;
    const backupDbPath = path.join(backupDir, 'database.db');

    // Copy database file
    await fs.copyFile(dbPath, backupDbPath);
    logger.info('Database backed up');
  }

  static async backupStorage(backupDir) {
    const storageBackupDir = path.join(backupDir, 'storage');
    await fs.mkdir(storageBackupDir, { recursive: true });

    // Copy storage directories
    const dirs = ['_incoming', 'masters', 'derivatives'];
    for (const dir of dirs) {
      const sourceDir = path.join(config.storage.basePath, dir);
      const targetDir = path.join(storageBackupDir, dir);
      
      try {
        await fs.access(sourceDir);
        await this.copyDirectory(sourceDir, targetDir);
        logger.info(`Storage directory backed up: ${dir}`);
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

  static async createArchive(backupDir, timestamp) {
    return new Promise((resolve, reject) => {
      const archivePath = path.join(config.backup.path, `backup-${timestamp}.zip`);
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info(`Archive created: ${archivePath} (${archive.pointer()} bytes)`);
        resolve(archivePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(backupDir, false);
      archive.finalize();
    });
  }

  static async encryptBackup(archivePath) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.backup.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = await fs.readFile(archivePath);
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

    const encryptedPath = archivePath + '.encrypted';
    await fs.writeFile(encryptedPath, Buffer.concat([iv, encrypted]));

    // Remove unencrypted archive
    await fs.unlink(archivePath);

    logger.info(`Backup encrypted: ${encryptedPath}`);
    return encryptedPath;
  }

  static async cleanupOldBackups() {
    const files = await fs.readdir(config.backup.path);
    const now = Date.now();
    const retentionMs = config.backup.retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('backup-')) {
        const filePath = path.join(config.backup.path, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
          logger.info(`Deleted old backup: ${file}`);
        }
      }
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  BackupService.createBackup()
    .then((path) => {
      console.log(`Backup completed: ${path}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}

module.exports = BackupService;
