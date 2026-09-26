const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const PRICES = [
  { id: 'members', name: 'Members', price: 3900, display: '$39.00', original: '$49.00', discount: '20% off', questions: 50 },
  { id: 'pro', name: 'Pro', price: 43600, display: '$436.00', original: '$675.00', discount: '35% off', questions: 75 },
  { id: 'bonus', name: 'Bonus Questions', price: 10000, display: '$100.00', original: null, discount: null, questions: 100 }
];

// GET /api/payment/prices
router.get('/prices', (req, res) => {
  res.json(PRICES.map((price) => ({ ...price, checkoutAvailable: Boolean(process.env.STRIPE_SECRET_KEY) })));
});

// POST /api/payment/create-checkout-session
router.post('/create-checkout-session', protect, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ message: 'Checkout is not configured yet.' });
  try {
    const { tier } = req.body;
    const priceInfo = PRICES.find(p => p.id === tier);
    if (!priceInfo) return res.status(400).json({ message: 'Invalid tier' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Kno U Kno - ${priceInfo.name} Plan` },
          unit_amount: priceInfo.price
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/price?payment=cancelled`,
      metadata: { userId: req.user.id.toString(), tier }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ message: 'Payment error: ' + err.message });
  }
});

// POST /api/payment/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, tier } = session.metadata;
    try {
      if (tier === 'bonus') {
        await User.findByIdAndUpdate(userId, { $inc: { bonusQuestions: 100 } });
      } else {
        await User.findByIdAndUpdate(userId, { tier, tierExpiry: null });
      }
    } catch (err) {
      console.error('Webhook DB error:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
