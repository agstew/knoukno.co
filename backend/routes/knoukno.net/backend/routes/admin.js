const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Business = require('../models/Business');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/plan
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { tier } = req.body;
    if (!['free', 'members', 'pro'].includes(tier)) return res.status(400).json({ message: 'Invalid plan' });
    // Setting free restarts a 3-day trial; paid plans don't expire
    const tierExpiry = tier === 'free' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null;
    const user = await User.findByIdAndUpdate(req.params.id, { tier, tierExpiry }, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/answers
router.get('/answers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const total = await Answer.countDocuments();
    const answers = await Answer.find()
      .populate('userId', 'name email tier')
      .populate('questionId', 'businessTitle questionText category')
      .sort({ savedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ answers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/questions
router.get('/questions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    // Group by questionNumber so each number appears once (the bank is duplicated per businessTitle).
    const grouped = await Question.aggregate([
      { $sort: { questionNumber: 1, createdAt: 1 } },
      { $group: { _id: '$questionNumber', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { questionNumber: 1 } },
      {
        $facet: {
          questions: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);
    const questions = grouped[0]?.questions || [];
    const total = grouped[0]?.totalCount?.[0]?.count || 0;
    res.json({ questions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/questions
router.post('/questions', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/titles/:title
router.delete('/titles/:title', async (req, res) => {
  try {
    const businessTitle = decodeURIComponent(req.params.title || '').trim();
    if (!businessTitle) {
      return res.status(400).json({ message: 'Business title is required.' });
    }

    const [questionResult, businessResult] = await Promise.all([
      Question.updateMany(
        { businessTitle, isActive: true },
        { $set: { isActive: false } }
      ),
      Business.updateMany(
        { title: businessTitle, isActive: true },
        { $set: { isActive: false } }
      )
    ]);

    if (questionResult.matchedCount === 0 && businessResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Business title not found.' });
    }

    res.json({
      message: 'Business title deleted.',
      title: businessTitle,
      deactivatedQuestions: questionResult.modifiedCount,
      deactivatedBusinesses: businessResult.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
 });

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnswers = await Answer.countDocuments();
    const distinctNumbers = await Question.distinct('questionNumber', { isActive: true });
    const totalQuestions = distinctNumbers.length;
    const freeUsers = await User.countDocuments({ tier: 'free' });
    const membersUsers = await User.countDocuments({ tier: 'members' });
    const proUsers = await User.countDocuments({ tier: 'pro' });
    res.json({ totalUsers, totalAnswers, totalQuestions, byTier: { free: freeUsers, members: membersUsers, pro: proUsers } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
