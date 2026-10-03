const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware/auth');
const { isTrialExpired, accessibleTiers, questionLimit } = require('../middleware/tier');

const TRIAL_EXPIRED = { message: 'Your free trial has expired. Please upgrade your plan to keep going.', code: 'TRIAL_EXPIRED' };

// GET /api/questions/titles - public
router.get('/titles', async (req, res) => {
  try {
    const titles = await Question.distinct('businessTitle', { isActive: true });
    res.json(titles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions - protected
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    if (isTrialExpired(user)) return res.status(403).json(TRIAL_EXPIRED);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1;
    const businessTitle = req.query.businessTitle || '';

    const query = { isActive: true, tierAccess: { $in: accessibleTiers(user) } };
    if (businessTitle) query.businessTitle = businessTitle;

    const maxQuestions = questionLimit(user);

    const total = await Question.countDocuments(query);
    const effectiveTotal = Math.min(total, maxQuestions);

    const skip = (page - 1) * limit;
    if (skip >= effectiveTotal && effectiveTotal > 0) {
      return res.json({ questions: [], total: effectiveTotal, page, pages: Math.ceil(effectiveTotal / limit) });
    }

    const questions = await Question.find(query)
      .sort({ questionNumber: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      questions,
      total: effectiveTotal,
      page,
      pages: Math.ceil(effectiveTotal / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question || !question.isActive) return res.status(404).json({ message: 'Question not found' });
    if (isTrialExpired(req.user)) return res.status(403).json(TRIAL_EXPIRED);
    if (!accessibleTiers(req.user).includes(question.tierAccess)) {
      return res.status(403).json({ message: 'Upgrade your plan to access this question.' });
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/questions
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/questions/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
