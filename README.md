# Kno U Kno

Premium business-learning platform built with Next.js, local auth, and Railway-ready deployment setup.

## Implementation status

The public pricing section describes planned plans, not active checkout. The Next.js application does not yet implement recurring PayPal subscriptions, AI generation and grading, or scheduled email sequences. An AI provider must be selected before the AI features can be enabled.

Signed-in users can open **Business titles** from the admin page to create personal titles, answer sample questions one at a time, assign grades on the Grade page, reorder answers, and view grade totals and averages. Answers, grades, and rankings are saved in MongoDB. Ungraded answers remain visible and are excluded from grade totals and averages until graded. Each of the 20 prepared sample questions has an example. The admin content-management buttons are not yet implemented.

On the Rated page, changes to answer order are drafts until **Save ranking** is selected. Drafts remain while navigating between dashboard views but are lost on reload or logout.

The business dashboard's **Print saved answers** button opens the browser print dialog for a report containing saved answers in saved ranking order, grades, total, and average. Unsaved answer edits and ranking drafts are not included. The browser can also save the report as a PDF.

Planned paid plan question limits apply to the entire subscription. Member is $39 per month, Pro is $436 per year, and Pro-Bonus is $525.99 per year. Each bonus option adds 100 questions for a one-time $100 charge in addition to its recurring plan price.

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

The application sends HSTS with a one-day lifetime for each HTTPS hostname. It does not include subdomains or request browser preload. Browsers ignore HSTS received over HTTP; the hosting layer redirects HTTP requests to HTTPS.

The business dashboard includes private tasks for each signed-in user and business. Task records are stored in the separate R2 worker; business titles and answers remain in MongoDB. Configure the server-only `TASK_API_TOKEN` to match the worker secret. Never expose it to browser code. Tasks can be added, listed and deleted; list pages contain up to 20 tasks.

Responses also disable MIME sniffing and framing, omit the Next.js `X-Powered-By` header, and use a Content Security Policy that permits the homepage's Unsplash images and uptime badge. The policy allows inline scripts and styles for Next.js compatibility, so it is not a strict nonce-based XSS defense. New external resources may require updating the policy.

## PayPal Sandbox testing

The local-only `/sandbox-checkout` page tests recurring subscriptions without enabling paid access. It is disabled in production, even if Sandbox credentials are configured. Sign in to a local account, use a PayPal Sandbox buyer account, and configure `.env.local` using `.env.example`. Never commit credentials.

Create active Sandbox subscription plans with USD fixed prices and one indefinite regular billing cycle: Member and Member-Bonus at $39 monthly; Pro at $436 yearly; and Pro-Bonus at $525.99 yearly. Configure a one-time USD $100 setup fee for each bonus plan and no setup fee for the others. Do not configure a trial or tax. Set the corresponding `PAYPAL_SANDBOX_*_PLAN_ID` values. The server verifies each plan against the displayed recurring price, interval, and one-time bonus fee before sending the buyer to PayPal, and checks subscription status with PayPal on return. A sandbox subscription does not unlock features, enforce limits, or set up emails; live checkout remains unavailable.
