# Kno U Kno

Premium business-learning platform built with Next.js, local auth, and Railway-ready deployment setup.

## Implementation status

The public pricing section describes planned plans, not active checkout. The Next.js application does not yet implement recurring PayPal subscriptions, AI generation and grading, or scheduled email sequences. An AI provider must be selected before the AI features can be enabled.

Signed-in users can open **Business titles** from the admin page to create personal titles, answer sample questions one at a time, assign a required grade to each saved answer, reorder answers, and view grade totals and averages. Answers and rankings are saved in MongoDB. Existing ungraded answers remain visible and are excluded from grade totals and averages until graded. Only the first ten questions have sample examples; the remaining questions explicitly indicate that an example is unavailable. The admin content-management buttons are not yet implemented.

Paid plan question limits apply to the entire subscription. Pro is $436 per year; the Member, Member-Bonus, and Pro-Bonus plans are monthly.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Container build

```bash
docker build -t knoukno:test .
```

## Required environment variables

Copy `.env.example` and set values for:

- `MONGODB_URI`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NEXT_PUBLIC_APP_URL`

Password reset requires `MONGODB_URI`, `RESEND_API_KEY`, `RESEND_FROM`, and a publicly reachable `NEXT_PUBLIC_APP_URL`. Links expire after one hour, are single-use, and invalidate existing sessions. Reset requests for an account are limited to one per minute. Configure a verified sender in Resend.

## Deployment

The project includes a Railway configuration and Dockerfile for containerized deployment.

## PayPal Sandbox testing

The local-only `/sandbox-checkout` page tests recurring subscriptions without enabling paid access. It is disabled in production, even if Sandbox credentials are configured. Sign in to a local account, use a PayPal Sandbox buyer account, and configure `.env.local` using `.env.example`. Never commit credentials.

Create active Sandbox subscription plans with USD fixed prices and one indefinite regular billing cycle: Member $39 monthly, Member-Bonus $199 monthly, Pro $436 yearly, and Pro-Bonus $299 monthly. Do not configure a trial, setup fee, or tax on these test plans. Set the corresponding `PAYPAL_SANDBOX_*_PLAN_ID` values. The server verifies each plan against the displayed price and interval before sending the buyer to PayPal, and checks subscription status with PayPal on return. A sandbox subscription does not unlock features, enforce limits, or set up emails; live checkout remains unavailable.
