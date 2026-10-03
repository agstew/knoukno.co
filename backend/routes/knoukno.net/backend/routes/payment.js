const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const PRICES = [
  { id: 'members', name: 'Members', price: 3900, display: '$39.00', original: '$49.00', discount: '20% off', questions: 50 },
  { id: 'pro', name: 'Pro', price: 43600, display: '$436.00', original: '$675.00', discount: '35% off', questions: 75 },
  { id: 'bonus', name: 'Bonus Questions', price: 10000, display: '$100.00', original: null, discount: null, questions: 100 }
];
const TIER_RANK = { free: 0, members: 1, pro: 2 };

const paypalConfigured = () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
const paypalBase = () =>
  process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const toDollars = (cents) => (cents / 100).toFixed(2);

const paypalToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return (await res.json()).access_token;
};

const paypal = async (path, options = {}) => {
  const res = await fetch(`${paypalBase()}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${await paypalToken()}`, 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

// GET /api/payment/prices
router.get('/prices', (req, res) => {
  res.json(PRICES.map((price) => ({ ...price, checkoutAvailable: paypalConfigured() })));
});

// POST /api/payment/create-order
router.post('/create-order', protect, async (req, res) => {
  if (!paypalConfigured()) return res.status(503).json({ message: 'Checkout is not configured yet.' });
  try {
    const priceInfo = PRICES.find(p => p.id === req.body.tier);
    if (!priceInfo) return res.status(400).json({ message: 'Invalid plan' });
    if (priceInfo.id === 'bonus' && req.user.tier === 'free') {
      return res.status(400).json({ message: 'Bonus questions are an add-on for Members and Pro.' });
    }
    if (priceInfo.id !== 'bonus' && TIER_RANK[req.user.tier] >= TIER_RANK[priceInfo.id]) {
      return res.status(400).json({ message: `You already have the ${req.user.tier} plan.` });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const { ok, data } = await paypal('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: toDollars(priceInfo.price) },
          description: `Kno U Kno - ${priceInfo.name}`,
          custom_id: `${req.user.id}:${priceInfo.id}`
        }],
        application_context: {
          brand_name: 'Kno U Kno',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${clientUrl}/price?paypal=return`,
          cancel_url: `${clientUrl}/price?payment=cancelled`
        }
      })
    });
    const approve = ok && data.links?.find(l => l.rel === 'approve');
    if (!approve) {
      console.error('PayPal create order failed:', data.name || data);
      return res.status(502).json({ message: 'Could not start PayPal checkout. Please try again.' });
    }
    res.json({ url: approve.href });
  } catch (err) {
    console.error('PayPal error:', err.message);
    res.status(500).json({ message: 'Payment error. Please try again.' });
  }
});

// POST /api/payment/capture
router.post('/capture', protect, async (req, res) => {
  if (!paypalConfigured()) return res.status(503).json({ message: 'Checkout is not configured yet.' });
  try {
    const { orderId } = req.body;
    if (typeof orderId !== 'string' || !/^[A-Z0-9]{5,40}$/.test(orderId)) {
      return res.status(400).json({ message: 'Invalid order.' });
    }

    const { ok, data } = await paypal(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST' });
    if (!ok || data.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', data.name || data.status);
      return res.status(400).json({ message: 'Payment was not completed.' });
    }

    const unit = data.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const [userId, tier] = String(capture?.custom_id || unit?.custom_id || '').split(':');
    const priceInfo = PRICES.find(p => p.id === tier);
    if (userId !== req.user.id || !priceInfo) {
      return res.status(403).json({ message: 'This payment does not belong to your account.' });
    }
    if (capture?.status !== 'COMPLETED' || capture.amount?.currency_code !== 'USD' || capture.amount?.value !== toDollars(priceInfo.price)) {
      console.error('PayPal capture mismatch for order', orderId);
      return res.status(400).json({ message: 'Payment amount did not match. Please contact support.' });
    }

    const update = tier === 'bonus'
      ? { $inc: { bonusQuestions: priceInfo.questions } }
      : { tier, tierExpiry: null };
    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ message: 'Payment complete. Your plan has been upgraded.', tier });
  } catch (err) {
    console.error('PayPal capture error:', err.message);
    res.status(500).json({ message: 'Payment error. Please contact support.' });
  }
});

module.exports = router;
