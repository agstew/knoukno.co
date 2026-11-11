# Kno U Kno

Premium business-learning platform built with Next.js, local auth, and Railway-ready deployment setup.

## Implementation status

The free trial can be started once per account from the pricing page. It provides five prepared question-example pairs and accepts saved answers for three days from the moment the user starts it. After expiry, users can view and print saved answers but cannot edit them. This is separate from the existing sample dashboard; it does not generate AI questions. Paid checkout buttons remain disabled. The Next.js application does not yet implement recurring PayPal subscriptions, AI generation and grading, or scheduled email sequences.

Signed-in users can open **Business titles** from the admin page to create personal titles, answer sample questions one at a time, assign grades on the Grade page, reorder answers, and view grade totals and averages. Answers, grades, and rankings are saved in MongoDB. Ungraded answers remain visible and are excluded from grade totals and averages until graded. Each of the 20 prepared sample questions has an example.

The Questions view displays numbered navigation in groups of five, alongside Previous and Next. Save an answer before changing questions.

On the admin page, **Generate question set** creates a personal draft containing five existing sample questions; it does not start a three-day trial or activate a paid tier. Previously saved sets are unchanged. **Save all** saves the set in MongoDB, and the 50 most recent personal sets can be reopened. **Print summary** prints the currently displayed questions, including an unsaved draft if one is selected. **Delete** removes only the selected sample set after confirmation, without changing business answers or other sets. Generating the full paid-tier question sets is not yet implemented.

On the Rated page, changes to answer order are drafts until **Save ranking** is selected. Drafts remain while navigating between dashboard views but are lost on reload or logout.

The business dashboard's **Print saved answers** button opens the browser print dialog for a report containing saved answers in saved ranking order, grades, total, and average. Unsaved answer edits and ranking drafts are not included. The browser can also save the report as a PDF.

Planned paid plan question limits apply to the entire subscription. Member is $39 per month, Pro is $436 per year, and Pro-Bonus is $436 per year. Each bonus option adds 100 questions for a one-time $100 charge in addition to its recurring plan price. Member-Bonus is $139 for the first payment ($39 plus the one-time bonus), then $39 per month.

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

Visitors can navigate to Home, Login, Register, and Price. Signed-in navigation opens business titles, the selected business dashboard, grades, rankings, and averages; when no business is selected, choose a title first. Logout ends the local session.

The separate `/site-admin` page shows real counts and server configuration presence to one designated account. Sign in with an existing account and visit `/site-admin` to see its account ID, then set `ADMIN_USER_ID` to that UUID in the server environment. A non-default `JWT_SECRET` is also required; without either setting, administration fails closed. This read-only overview does not manage accounts, payments, emails, or AI generation. Never designate an account whose credentials you do not control.

Live PayPal plan inspection requires the server-only `PAYPAL_LIVE_CLIENT_ID`, `PAYPAL_LIVE_CLIENT_SECRET`, `PAYPAL_LIVE_MEMBER_PLAN_ID`, and `PAYPAL_LIVE_PRO_PLAN_ID`. The Member plan must be an active USD $39 monthly plan and the Pro plan an active USD $436 yearly plan, each with a single indefinite regular billing cycle and no setup fee or tax. Plan inspection is read-only and does not enable checkout. Never commit credentials. Live checkout, verified payment events, paid access, renewals, and bonus purchases are not implemented.

With these variables set securely in the environment, run `node scripts/inspect-live-paypal.js` to check both live plans without creating a subscription or charging a customer.

The live PayPal helper also supports webhook signature verification using `PAYPAL_LIVE_WEBHOOK_ID`. No webhook listener or event processing is implemented yet; verification alone does not grant paid access.

The application sends HSTS with a one-day lifetime for each HTTPS hostname. It does not include subdomains or request browser preload. Browsers ignore HSTS received over HTTP; the hosting layer redirects HTTP requests to HTTPS.

The business dashboard includes private tasks for each signed-in user and business. Task records are stored in the separate R2 worker; business titles and answers remain in MongoDB. Configure the server-only `TASK_API_TOKEN` to match the worker secret. Never expose it to browser code. Tasks can be added, listed and deleted; list pages contain up to 20 tasks.

Responses also disable MIME sniffing and framing, omit the Next.js `X-Powered-By` header, and use a Content Security Policy that permits the homepage's Unsplash images and uptime badge. The policy allows inline scripts and styles for Next.js compatibility, so it is not a strict nonce-based XSS defense. New external resources may require updating the policy.

## PayPal Sandbox testing

The local-only `/sandbox-checkout` page tests recurring subscriptions without enabling paid access. It is disabled in production, even if Sandbox credentials are configured. Sign in to a local account, use a PayPal Sandbox buyer account, and configure `.env.local` using `.env.example`. Never commit credentials.

Create active Sandbox subscription plans with USD fixed prices and one indefinite regular billing cycle: Member and Member-Bonus at $39 monthly; Pro and Pro-Bonus at $436 yearly. Configure a one-time USD $100 setup fee for each bonus plan and no setup fee for the others. Do not configure a trial or tax. Set the corresponding `PAYPAL_SANDBOX_*_PLAN_ID` values. The server verifies each plan against the displayed recurring price, interval, and one-time bonus fee before sending the buyer to PayPal, and checks subscription status with PayPal on return. A sandbox subscription does not unlock features, enforce limits, or set up emails; live checkout remains unavailable.
