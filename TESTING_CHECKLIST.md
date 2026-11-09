# PayPal Integration Testing Checklist

## Pre-Testing Setup
- [ ] Verify environment variables in Railway
  ```bash
  railway variable list | grep PAYPAL
  ```
- [ ] Confirm deployment successful
  ```bash
  railway deployment list --limit 1
  ```
- [ ] Check app is running
  - Go to: https://knouknoco-production-bda9.up.railway.app
  - Should see homepage

## Sandbox Account Access
- [ ] Open PayPal Sandbox: https://sandbox.paypal.com
- [ ] Email: sb-buyer@paypal.com
- [ ] Get password from: https://developer.paypal.com/dashboard/ → Accounts
- [ ] Login to sandbox account successfully

## API Testing (Postman/Browser)

### Test 1: Get Prices Endpoint
- [ ] Open: GET `https://knouknoco-production-bda9.up.railway.app/api/paypal/prices`
- [ ] Expected: JSON array with Members, Pro, Bonus tiers
- [ ] All tiers show `checkoutAvailable: true`

### Test 2: Create Order (Authenticated)
- [ ] Login to app at `/login` (create account if needed)
- [ ] Copy auth token from localStorage
- [ ] POST to `/api/paypal/create-order` with:
  ```json
  {
    "tier": "members"
  }
  ```
- [ ] Expected: `{ "id": "order-id", "status": "CREATED" }`
- [ ] Save the order ID

### Test 3: Capture Order
- [ ] POST to `/api/paypal/capture-order` with:
  ```json
  {
    "orderId": "{order-id-from-test-2}",
    "tier": "members"
  }
  ```
- [ ] Expected: `{ "success": true, "status": "COMPLETED" }`

## Frontend UI Testing

### Test 4: Pricing Page Display
- [ ] Go to: https://knouknoco-production-bda9.up.railway.app/price
- [ ] See three pricing cards (Members, Pro, Bonus)
- [ ] Each card shows price, discount, questions count
- [ ] Payment method selector (Stripe/PayPal) visible

### Test 5: PayPal Button Display
- [ ] Click "PayPal" payment method radio
- [ ] PayPal button appears on each card
- [ ] Button says "Pay with PayPal"
- [ ] No console errors (check DevTools)

### Test 6: Complete PayPal Payment (Sandbox)
- [ ] Click "PayPal" radio if not selected
- [ ] Click PayPal button on Members tier
- [ ] PayPal popup should open
  - [ ] Shows order details ($39.00)
  - [ ] Shows "Kno U Kno - Members Plan"
- [ ] Click "Login" in PayPal popup
  - [ ] Email: sb-buyer@paypal.com
  - [ ] Password: (from sandbox)
  - [ ] Approve payment
- [ ] Redirected to dashboard with success message
- [ ] Dashboard shows user tier updated to "members"

### Test 7: Try Different Tier
- [ ] Go back to /price
- [ ] Try Pro tier ($436.00)
- [ ] Complete payment with PayPal
- [ ] Dashboard shows tier updated to "pro"

### Test 8: Bonus Questions
- [ ] Go to /price
- [ ] Try Bonus tier ($100.00)
- [ ] Complete payment
- [ ] Dashboard shows bonus questions increased by 100

## Error Handling

### Test 9: Cancel Payment
- [ ] Go to /price
- [ ] Click PayPal button
- [ ] DON'T approve - click "Cancel"
- [ ] Should be redirected to /price with cancellation message
- [ ] Tier should NOT be updated

### Test 10: Invalid Tier
- [ ] Manually POST to `/api/paypal/create-order` with:
  ```json
  {
    "tier": "invalid"
  }
  ```
- [ ] Expected: 400 error "Invalid tier"

### Test 11: Missing Auth
- [ ] POST to `/api/paypal/create-order` without token
- [ ] Expected: 401 Unauthorized

### Test 12: Missing Credentials
- [ ] (Optional) Temporarily remove PAYPAL credentials
- [ ] Go to /price
- [ ] Should show error message
- [ ] Payment disabled

## Database Verification

### Test 13: Check MongoDB Update
- [ ] After successful payment, check user in MongoDB
  ```bash
  # Connect to MongoDB and run:
  db.users.findOne({email: "your-test@email.com"})
  # Should show: { tier: "members" } or { bonusQuestions: 100 }
  ```

### Test 14: Multiple Payments
- [ ] Logout and login with different account
- [ ] Purchase different tier
- [ ] Verify correct tier in dashboard

## Performance

### Test 15: Speed
- [ ] Measure time from button click to PayPal popup
  - [ ] Should be < 2 seconds
- [ ] Measure time from approval to redirect
  - [ ] Should be < 3 seconds

### Test 16: Network Errors
- [ ] Turn off internet, try to checkout
- [ ] Should show error message
- [ ] Error message is user-friendly

## Security

### Test 17: CORS
- [ ] Open DevTools → Console
- [ ] No CORS errors during payment

### Test 18: HTTPS
- [ ] All requests use HTTPS
- [ ] Browser shows secure lock icon

### Test 19: Token Exposure
- [ ] Check network tab in DevTools
- [ ] Auth token is sent in Authorization header (not in URL)
- [ ] PAYPAL_CLIENT_SECRET never sent to frontend

## Final Checklist

- [ ] All tests passed
- [ ] No console errors
- [ ] No network errors
- [ ] Database updated correctly
- [ ] User redirected appropriately
- [ ] Error messages are clear
- [ ] Performance is good
- [ ] HTTPS/CORS working
- [ ] Ready for production!

## Bugs Found & Fixed

Document any issues here:
```
Issue: [Description]
Steps to reproduce: [Steps]
Expected: [Expected behavior]
Actual: [Actual behavior]
Status: [Open/Fixed]
Fix: [How to fix]
```

---

## When All Tests Pass

1. [ ] Document any issues found
2. [ ] Fix any bugs
3. [ ] Get live PayPal credentials
4. [ ] Update Railway variables with live credentials
5. [ ] Redeploy with `railway up`
6. [ ] Retest with real payment methods
7. [ ] Launch! 🚀
