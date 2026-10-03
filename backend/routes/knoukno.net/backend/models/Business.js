const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: String },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Business', businessSchema);
