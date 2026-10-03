const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answerText: { type: String },
  grade: { type: Number, min: 0, max: 100 },
  rating: { type: Number, min: 1, max: 5 },
  savedAt: { type: Date, default: Date.now },
  businessTitle: { type: String },
  clientTitle: { type: String, default: '', trim: true },
  isSaved: { type: Boolean, default: false }
});

answerSchema.index({ userId: 1, questionId: 1, clientTitle: 1 });

module.exports = mongoose.model('Answer', answerSchema);
