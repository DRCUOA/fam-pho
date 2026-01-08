const exifr = require('exifr');

class ExifService {
  // Read EXIF data from file
  static async readExif(filePath) {
    try {
      const exifData = await exifr.parse(filePath, {
        pick: [
          'DateTimeOriginal',
          'CreateDate',
          'ModifyDate',
          'GPSLatitude',
          'GPSLongitude',
          'Make',
          'Model',
          'Orientation',
          'ImageWidth',
          'ImageHeight',
        ],
      });
      return exifData || {};
    } catch (error) {
      // Return empty object if EXIF reading fails
      return {};
    }
  }

  // Extract date taken from EXIF
  static extractDateTaken(exifData) {
    if (exifData.DateTimeOriginal) {
      return new Date(exifData.DateTimeOriginal).toISOString();
    }
    if (exifData.CreateDate) {
      return new Date(exifData.CreateDate).toISOString();
    }
    return null;
  }

  // Extract orientation from EXIF
  static extractOrientation(exifData) {
    return exifData.Orientation || 1;
  }
}

module.exports = ExifService;
