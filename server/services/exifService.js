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
  // EXIF orientation values: 1=Normal, 2=FlipH, 3=Rotate180, 4=FlipV, 
  // 5=Rotate90CW+FlipH, 6=Rotate90CW, 7=Rotate90CCW+FlipH, 8=Rotate90CCW
  static extractOrientation(exifData) {
    const orientation = exifData.Orientation;
    
    if (!orientation) {
      return 1; // Default to normal
    }
    
    // If it's already a number, return it
    if (typeof orientation === 'number') {
      // Ensure it's a valid orientation value (1-8)
      return (orientation >= 1 && orientation <= 8) ? orientation : 1;
    }
    
    // If it's a string, try to parse it
    if (typeof orientation === 'string') {
      // Try to extract number from string (e.g., "6" or "Rotate 90 CW")
      const numMatch = orientation.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        return (num >= 1 && num <= 8) ? num : 1;
      }
      
      // Map common string descriptions to orientation values
      const lower = orientation.toLowerCase();
      if (lower.includes('normal') || lower.includes('0')) return 1;
      if (lower.includes('flip') && lower.includes('horizontal')) return 2;
      if (lower.includes('rotate') && lower.includes('180')) return 3;
      if (lower.includes('flip') && lower.includes('vertical')) return 4;
      if (lower.includes('rotate') && lower.includes('90') && lower.includes('cw') && lower.includes('flip')) return 5;
      if (lower.includes('rotate') && lower.includes('90') && lower.includes('cw')) return 6;
      if (lower.includes('rotate') && lower.includes('90') && lower.includes('ccw') && lower.includes('flip')) return 7;
      if (lower.includes('rotate') && lower.includes('90') && lower.includes('ccw')) return 8;
    }
    
    // Default to normal orientation if we can't parse it
    return 1;
  }
}

module.exports = ExifService;
