const User = require('../models/User');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to attach user to request
const attachUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      req.user = user;
    }
  }
  next();
};

module.exports = {
  requireAuth,
  attachUser,
};
