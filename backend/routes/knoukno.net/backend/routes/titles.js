const express = require('express');
const UserBusiness = require('../models/UserBusiness');
const Answer = require('../models/Answer');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const titles = await UserBusiness.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const answers = await Answer.find({ userId: req.user.id, clientTitle: { $nin: [null, ''] } })
      .select('clientTitle')
      .lean();
    const countByTitle = answers.reduce((counts, answer) => {
      counts[answer.clientTitle] = (counts[answer.clientTitle] || 0) + 1;
      return counts;
    }, {});
    res.json({
      titles: titles.map(title => ({ ...title, answerCount: countByTitle[title.businessTitle] || 0 }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load business titles.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const businessTitle = typeof req.body.businessTitle === 'string' ? req.body.businessTitle.trim() : '';
    if (!businessTitle) return res.status(400).json({ message: 'Business title is required.' });

    const title = await UserBusiness.create({
      userId: req.user.id,
      businessTitle,
      industry: req.body.industry,
      location: req.body.location,
      description: req.body.description
    });
    res.status(201).json(title);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already have a business with that title.' });
    res.status(500).json({ message: err.message || 'Could not save business title.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const title = await UserBusiness.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!title) return res.status(404).json({ message: 'Business title not found.' });
    await Answer.deleteMany({ userId: req.user.id, clientTitle: title.businessTitle });
    res.json({ message: 'Business title deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete business title.' });
  }
});

module.exports = router;
