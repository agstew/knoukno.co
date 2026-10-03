const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const mailer = require('../utils/mailer');

const RESET_TTL_MS = 60 * 60 * 1000;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { message: 'Too many requests. Please try again later.' } });

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, tier: user.tier, name: user.name, tierExpiry: user.tierExpiry },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const tierExpiry = new Date();
    tierExpiry.setDate(tierExpiry.getDate() + 3);

    const user = new User({ name, email, password, tier: 'free', tierExpiry });
    await user.save();

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tier: user.tier, tierExpiry: user.tierExpiry }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tier: user.tier, tierExpiry: user.tierExpiry }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', resetLimiter, async (req, res) => {
  const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!mailer.isConfigured()) {
      console.error('Password reset requested but SMTP is not configured');
      return res.status(503).json({ message: 'Password reset is not available yet. Please contact support.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    await mailer.sendMail({
      to: user.email,
      subject: 'Reset your Kno U Kno password',
      text: `Hi ${user.name},\n\nReset your password here (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
      html: `<p>Hi ${user.name.replace(/[<>&"]/g, '')},</p><p><a href="${link}">Reset your password</a> (valid for 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`
    });
    res.json(generic);
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Could not send reset email. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Your password has been reset. You can log in now.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
