const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const clientTitleFrom = (body) => typeof body.clientTitle === 'string' ? body.clientTitle.trim() : '';

// POST /api/answers/save
router.post('/save', protect, async (req, res) => {
  try {
    const { questionId, answerText } = req.body;
    const clientTitle = clientTitleFrom(req.body);
    if (!questionId) return res.status(400).json({ message: 'questionId is required' });
    const question = await Question.findById(questionId);
    let answer = await Answer.findOne({ userId: req.user.id, questionId, clientTitle });
    if (answer) {
      answer.answerText = answerText;
      answer.isSaved = true;
      answer.savedAt = new Date();
      if (question) answer.businessTitle = question.businessTitle;
      await answer.save();
    } else {
      answer = await Answer.create({
        userId: req.user.id,
        questionId,
        answerText,
        isSaved: true,
        clientTitle,
        businessTitle: question ? question.businessTitle : ''
      });
    }
    res.json({ message: 'Answer saved', answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/answers/grade
router.post('/grade', protect, async (req, res) => {
  try {
    const { questionId, grade } = req.body;
    const clientTitle = clientTitleFrom(req.body);
    if (!questionId) return res.status(400).json({ message: 'questionId is required' });
    if (grade < 0 || grade > 100) return res.status(400).json({ message: 'Grade must be 0-100' });
    const question = await Question.findById(questionId);
    let answer = await Answer.findOne({ userId: req.user.id, questionId, clientTitle });
    if (answer) {
      answer.grade = grade;
      if (question) answer.businessTitle = question.businessTitle;
      await answer.save();
    } else {
      answer = await Answer.create({
        userId: req.user.id,
        questionId,
        grade,
        clientTitle,
        businessTitle: question ? question.businessTitle : ''
      });
    }
    res.json({ message: 'Grade saved', answer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/answers/rate
router.post('/rate', protect, async (req, res) => {
  try {
    const { questionId, rating } = req.body;
    const clientTitle = clientTitleFrom(req.body);
    if (!questionId) return res.status(400).json({ message: 'questionId is required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });
    const question = await Question.findById(questionId);
    let answer = await Answer.findOne({ userId: req.user.id, questionId, clientTitle });
    if (answer) {
      answer.rating = rating;
      if (question) answer.businessTitle = question.businessTitle;
      await answer.save();
    } else {
      answer = await Answer.create({
        userId: req.user.id,
        questionId,
        rating,
        clientTitle,
        businessTitle: question ? question.businessTitle : ''
      });
    }
    res.json({ message: 'Rating saved', answer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/answers/my
router.get('/my', protect, async (req, res) => {
  try {
    const answers = await Answer.find({ userId: req.user.id })
      .populate('questionId', 'businessTitle questionText category')
      .sort({ savedAt: -1 });
    res.json(answers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/answers/average
router.get('/average', protect, async (req, res) => {
  try {
    const answers = await Answer.find({ userId: req.user.id });
    const gradesArr = answers.filter(a => a.grade != null).map(a => a.grade);
    const ratingsArr = answers.filter(a => a.rating != null).map(a => a.rating);
    const avgGrade = gradesArr.length ? gradesArr.reduce((s, g) => s + g, 0) / gradesArr.length : 0;
    const avgRating = ratingsArr.length ? ratingsArr.reduce((s, r) => s + r, 0) / ratingsArr.length : 0;
    await User.findByIdAndUpdate(req.user.id, { averageGrade: avgGrade, averageRating: avgRating });
    res.json({ averageGrade: Math.round(avgGrade * 10) / 10, averageRating: Math.round(avgRating * 10) / 10, totalAnswers: answers.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/answers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const answer = await Answer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    await Answer.deleteOne({ _id: req.params.id });
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
