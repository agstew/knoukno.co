const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

const PRICES = [
  { id: 'members', name: 'Members', price: '39.00', display: '$39.00', original: '$49.00', discount: '20% off', questions: 50 },
  { id: 'pro', name: 'Pro', price: '436.00', display: '$436.00', original: '$675.00', discount: '35% off', questions: 75 },
  { id: 'bonus', name: 'Bonus Questions', price: '100.00', display: '$100.00', original: null, discount: null, questions: 100 }
];

// Get PayPal access token
async function getPayPalToken() {
  try {
    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (err) {
    console.error('PayPal token error:', err.response?.data || err.message);
    throw err;
  }
}

// POST /api/paypal/create-order
router.post('/create-order', protect, async (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ message: 'PayPal is not configured yet.' });
  }

  try {
    const { tier } = req.body;
    const priceInfo = PRICES.find(p => p.id === tier);
    if (!priceInfo) return res.status(400).json({ message: 'Invalid tier' });

    const token = await getPayPalToken();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: priceInfo.price,
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: priceInfo.price
            }
          }
        },
        items: [{
          name: `Kno U Kno - ${priceInfo.name} Plan`,
          description: `Access to ${priceInfo.questions} questions`,
          sku: tier,
          unit_amount: {
            currency_code: 'USD',
            value: priceInfo.price
          },
          quantity: '1'
        }],
        custom_id: req.user.id.toString()
      }],
      application_context: {
        return_url: `${clientUrl}/dashboard?payment=success`,
        cancel_url: `${clientUrl}/price?payment=cancelled`,
        brand_name: 'Kno U Kno',
        locale: 'en-US',
        landing_page: 'BILLING'
      }
    };

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      id: response.data.id,
      status: response.data.status
    });
  } catch (err) {
    console.error('PayPal order error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Payment error: ' + (err.response?.data?.message || err.message) });
  }
});

// POST /api/paypal/capture-order
router.post('/capture-order', protect, async (req, res) => {
  try {
    const { orderId, tier } = req.body;
    if (!orderId || !tier) {
      return res.status(400).json({ message: 'Missing orderId or tier' });
    }

    const priceInfo = PRICES.find(p => p.id === tier);
    if (!priceInfo) return res.status(400).json({ message: 'Invalid tier' });

    const token = await getPayPalToken();

    // Capture the payment
    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (captureResponse.data.status === 'COMPLETED') {
      // Update user in database
      if (tier === 'bonus') {
        await User.findByIdAndUpdate(req.user.id, { $inc: { bonusQuestions: priceInfo.questions } });
      } else {
        await User.findByIdAndUpdate(req.user.id, { tier, tierExpiry: null });
      }

      res.json({
        success: true,
        orderId: captureResponse.data.id,
        status: captureResponse.data.status
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment capture failed',
        status: captureResponse.data.status
      });
    }
  } catch (err) {
    console.error('PayPal capture error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Payment capture error: ' + (err.response?.data?.message || err.message) 
    });
  }
});

// GET /api/paypal/prices
router.get('/prices', (req, res) => {
  res.json(PRICES.map((price) => ({ 
    ...price, 
    checkoutAvailable: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) 
  })));
});

module.exports = router;
