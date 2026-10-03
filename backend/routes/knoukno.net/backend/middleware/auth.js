const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
  try {
    // Read plan and role from the DB so upgrades and admin changes apply immediately
    const user = await User.findById(decoded.id).select('name email role tier tierExpiry bonusQuestions').lean();
    if (!user) return res.status(401).json({ message: 'Account not found' });
    req.user = { ...user, id: user._id.toString() };
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      req.user = decoded;
    } catch (err) {
      // ignore
    }
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, optionalAuth, adminOnly };
