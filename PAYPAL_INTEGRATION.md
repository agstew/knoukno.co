# PayPal Integration Guide

## Setup

### 1. Get PayPal Sandbox Credentials
1. Go to https://developer.paypal.com/dashboard/
2. Sign in or create an account
3. Navigate to **Apps & Credentials** → **Sandbox** tab
4. Under **REST API apps**, select or create your app
5. Copy your **Client ID** and **Secret**

### 2. Add to Railway Environment Variables
```bash
railway variable set PAYPAL_CLIENT_ID="your-client-id"
railway variable set PAYPAL_CLIENT_SECRET="your-secret"
```

### 3. Frontend Configuration
Set the PayPal Client ID as an environment variable in your frontend:
```
REACT_APP_PAYPAL_CLIENT_ID=your-client-id
```

## Backend API Endpoints

### `POST /api/paypal/create-order`
Creates a PayPal order for a given tier.

**Request:**
```json
{
  "tier": "members" // or "pro", "bonus"
}
```

**Response:**
```json
{
  "id": "order-id",
  "status": "CREATED"
}
```

### `POST /api/paypal/capture-order`
Captures (completes) a PayPal order.

**Request:**
```json
{
  "orderId": "order-id",
  "tier": "members"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order-id",
  "status": "COMPLETED"
}
```

### `GET /api/paypal/prices`
Returns all available pricing tiers.

**Response:**
```json
[
  {
    "id": "members",
    "name": "Members",
    "price": "39.00",
    "display": "$39.00",
    "questions": 50,
    "checkoutAvailable": true
  }
]
```

## Frontend Component Usage

### PayPalButton Component

```jsx
import PayPalButton from './components/PayPalButton';

function CheckoutPage() {
  return (
    <PayPalButton
      tier="members"
      onSuccess={(data) => {
        console.log('Payment successful:', data);
        // Redirect to dashboard
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
        // Show error to user
      }}
    />
  );
}
```

## Testing

### Sandbox Testing
1. Use PayPal's test accounts:
   - **Buyer email:** sb-buyer@paypal.com
   - **Buyer password:** Get from your developer dashboard

2. Test with these card numbers:
   - **Visa:** 4111 1111 1111 1111
   - **Mastercard:** 5555 5555 5555 4444

### Mock Checkout (Dev Mode)
For local development without PayPal credentials:
```
npm start -- --mockCheckout=members
```

## Going Live

### 1. Get Live Credentials
1. In PayPal Developer Dashboard, switch to **Live** tab
2. Copy your Live **Client ID** and **Secret**

### 2. Update Environment Variables
```bash
railway variable set PAYPAL_CLIENT_ID="your-live-client-id"
railway variable set PAYPAL_CLIENT_SECRET="your-live-secret"
```

### 3. Redeploy
```bash
railway up
```

## Troubleshooting

### "PayPal is not configured yet"
- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set in Railway
- Check that they're not empty strings
- Restart your application

### Order Creation Fails
- Check if credentials are for the right mode (sandbox vs live)
- Verify the tier ID is valid (members, pro, bonus)
- Check browser console for detailed error messages

### Payment Capture Fails
- Ensure the orderId matches what was created
- Check user is authenticated
- Verify the tier matches the order tier

## Database Updates

When a payment is captured, the user record is updated:
- **For tier purchases:** `tier` field set to the purchased tier
- **For bonus questions:** `bonusQuestions` incremented by the quantity
- Transaction history (optional): Add a `Transaction` model to track all payments

## Security Notes

1. **Never expose secrets:** Keep `PAYPAL_CLIENT_SECRET` private
2. **Validate on backend:** Always verify payment completion server-side
3. **Use HTTPS:** PayPal requires SSL/TLS in production
4. **Rate limiting:** Backend already has rate limiting enabled
5. **CORS:** Ensure frontend URL is in Railway's `CLIENT_URL` environment variable

## Currency

Currently supports **USD only**. To add more currencies:
1. Update `PRICES` in `backend/routes/paypal.js`
2. Update currency code in order creation
3. Add locale selector to frontend
