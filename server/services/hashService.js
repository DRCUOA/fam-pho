const crypto = require('crypto');
const fs = require('fs');

class HashService {
  // Compute SHA-256 hash of a file
  static computeFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Compute SHA-256 hash of a buffer
  static computeBufferHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

module.exports = HashService;
