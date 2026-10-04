const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    const password = String(req.body.password || '');

    if (
      name.length < 2 ||
      email.length < 5 ||
      password.length < 6
    ) {
      return res.status(400).json({
        message:
          'Name, valid email and a password of at least 6 characters are required.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message:
          'An account with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    setAuthCookie(
      res,
      createToken(user._id.toString())
    );

    res.status(201).json({
      message: 'Account created successfully.',
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    const password = String(req.body.password || '');

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    setAuthCookie(
      res,
      createToken(user._id.toString())
    );

    res.json({
      message: 'Welcome back.',
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  res.json({
    message: 'Logged out successfully.'
  });
});

router.get(
  '/me',
  requireAuth,
  async (req, res, next) => {
    try {
      const user =
        await User.findById(req.userId)
          .select('-password');

      if (!user) {
        return res.status(401).json({
          message:
            'User account no longer exists.'
        });
      }

      res.json({
        user: publicUser(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;