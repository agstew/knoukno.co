const mongoose = require('mongoose');

const userBusinessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessTitle: { type: String, required: true, trim: true, maxlength: 120 },
  industry: { type: String, trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

userBusinessSchema.index({ userId: 1, businessTitle: 1 }, { unique: true });

module.exports = mongoose.model('UserBusiness', userBusinessSchema);
