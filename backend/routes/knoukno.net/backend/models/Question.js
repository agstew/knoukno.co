const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const questionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  businessTitle: { type: String, required: true },
  questionText: { type: String, required: true },
  example: { type: String },
  category: { type: String, enum: ['start', 'manage', 'money'], required: true },
  tierAccess: { type: String, enum: ['free', 'members', 'pro'], default: 'free' },
  questionNumber: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
