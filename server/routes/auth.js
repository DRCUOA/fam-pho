const express = require('express');
const argon2 = require('argon2');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ActivityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/auth');
const config = require('../utils/config');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for login - more lenient in development
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'development' ? 100 : 50, // 100 requests in dev, 50 in production
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await argon2.verify(user.password_hash, password);
    if (!validPassword) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    // Update last login
    await User.updateLastLogin(user.id);

    // Log activity
    await ActivityLog.log('user.login', {
      actorUserId: user.id,
      details: { email: user.email },
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  req.session.destroy(async (err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    await ActivityLog.log('user.logout', {
      actorUserId: userId,
    });

    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const libraries = await User.getLibraries(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
      libraries,
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
