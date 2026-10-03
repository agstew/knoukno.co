# Kno U Kno

[Kno U Kno](https://www.knoukno.online) is a business knowledge platform that guides users through practical questions about starting, operating, and growing a business. Users can save answers, grade and rate their work, track averages, and unlock additional questions through paid plans.

## Features

- Three-day free trial with five questions
- Members and Pro question tiers
- Saved answers, grading, ratings, and progress averages
- PayPal one-time checkout and server-verified payment capture
- Password reset email through Resend
- JWT authentication with role-based admin access
- Admin controls for users, plans, questions, answers, and statistics
- Responsive React frontend and REST API served from one deployment

## Stack

- Frontend: React 18, React Router, Lucide React
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT and bcrypt
- Payments: PayPal REST API
- Email: Resend API
- Deployment: Docker and Railway

## Project Structure

```text
backend/
	middleware/       Authentication and plan enforcement
	models/           Mongoose models
	routes/           REST API routes
	scripts/          Administrative scripts
	utils/            Email integration
	server.js         Express application entry point
frontend/
	public/            Static files
	src/components/    Shared React components
	src/context/       Authentication state
	src/pages/         Application pages
	src/styles/        Application styles
Dockerfile           Production multi-stage build
railway.json         Railway deployment configuration
```

## Local Setup

Requirements:

- Node.js 24
- MongoDB running locally, or a MongoDB connection URI

Install dependencies:

```bash
cd backend
npm install
cp .env.example .env

cd ../frontend
npm install
```

Generate a local JWT secret and add it to `backend/.env`:

```bash
openssl rand -hex 32
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm start
```

The frontend runs at `http://localhost:3000` and proxies API requests to the backend at `http://localhost:5000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` for local development. Never commit `.env` or put real credentials in `.env.example`.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Use `production` in deployed environments |
| `PORT` | Express server port; Railway supplies this automatically |
| `MONGO_URI` | MongoDB connection URI |
| `JWT_SECRET` | Secret used to sign login tokens; production requires at least 32 characters |
| `JWT_EXPIRE` | Login token lifetime, such as `7d` |
| `CLIENT_URL` | Public frontend origin and payment return URL |
| `PAYPAL_ENV` | `sandbox` for testing or `live` for real payments |
| `PAYPAL_CLIENT_ID` | PayPal application client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal application secret |
| `RESEND_API_KEY` | Resend API key for password-reset email |
| `MAIL_FROM` | Verified sender, such as `Kno U Kno <support@knoukno.online>` |

## Plans

| Plan | Questions | Access |
|---|---:|---|
| Free | 5 | Three-day trial |
| Members | 50 | One-time purchase |
| Pro | 75 | One-time purchase |
| Bonus | +100 | Add-on for Members or Pro |

The server reads the current role and plan from MongoDB on every protected request. Trial expiration, question limits, direct question access, and bonus limits are enforced by the API rather than only by the frontend.

## PayPal Setup

1. Create an application under PayPal Developer Dashboard, Apps & Credentials.
2. Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` to the deployment environment.
3. Use `PAYPAL_ENV=sandbox` with sandbox credentials while testing.
4. Test checkout with a PayPal sandbox buyer account.
5. Replace the credentials with a Live app and set `PAYPAL_ENV=live` before accepting real payments.

The backend creates each order, captures it after PayPal redirects the customer back, and verifies ownership, currency, amount, and completion status before changing a plan.

## Resend Setup

1. Add and verify `knoukno.online` in Resend.
2. Add Resend's MX, SPF, and DKIM records to the domain's DNS provider.
3. Create a sending API key.
4. Store it as `RESEND_API_KEY` in the deployment environment.
5. Set `MAIL_FROM` to an address on the verified domain.

API keys belong only in Railway variables or an ignored local `.env` file. Do not paste them into source files, commits, issues, or chat messages.

## Admin Access

Register an account normally, then promote it from a trusted environment connected to the production database:

```bash
cd backend
node scripts/make-admin.js you@example.com
```

Administrators can open `/admin` to manage plans and platform content. Setting a user to Free starts a new three-day trial; Members and Pro do not expire.

## Production Deployment

The root `Dockerfile` builds the React application, installs production backend dependencies, copies the frontend build into `backend/public`, and starts Express. The frontend and `/api` are served together from `knoukno.online`.

On Railway:

1. Connect this repository and the `main` branch.
2. Add a MongoDB service.
3. Set `MONGO_URI` to the MongoDB service reference.
4. Add the required environment variables above.
5. Deploy and verify `/api/health` returns:

```json
{"status":"ok"}
```

Production: [www.knoukno.online](https://www.knoukno.online)