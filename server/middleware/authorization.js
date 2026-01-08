const User = require('../models/User');

// Role hierarchy: owner > organizer > contributor > viewer
const roleHierarchy = {
  owner: 4,
  organizer: 3,
  contributor: 2,
  viewer: 1,
};

// Check if user has required role or higher
const hasRole = (userRole, requiredRole) => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Middleware to require library membership
const requireLibraryMember = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const libraryId = parseInt(req.params.libraryId || req.body.library_id || req.query.library_id);
  if (!libraryId) {
    return res.status(400).json({ error: 'Library ID required' });
  }

  const membership = await User.getLibraryMembership(req.user.id, libraryId);
  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this library' });
  }

  req.libraryId = libraryId;
  req.membership = membership;
  next();
};

// Middleware to require specific role
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    if (!req.membership) {
      return requireLibraryMember(req, res, async () => {
        if (!hasRole(req.membership.role, requiredRole)) {
          return res.status(403).json({ 
            error: `Requires ${requiredRole} role or higher` 
          });
        }
        next();
      });
    }

    if (!hasRole(req.membership.role, requiredRole)) {
      return res.status(403).json({ 
        error: `Requires ${requiredRole} role or higher` 
      });
    }
    next();
  };
};

// Middleware to require photo ownership or library membership
const requirePhotoAccess = async (req, res, next) => {
  const Photo = require('../models/Photo');
  const photoId = parseInt(req.params.id || req.params.photoId);
  
  if (!photoId) {
    return res.status(400).json({ error: 'Photo ID required' });
  }

  const photo = await Photo.findById(photoId);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  // Check library membership
  const membership = await User.getLibraryMembership(req.user.id, photo.library_id);
  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.photo = photo;
  req.libraryId = photo.library_id;
  req.membership = membership;
  next();
};

module.exports = {
  requireLibraryMember,
  requireRole,
  requirePhotoAccess,
  hasRole,
};
