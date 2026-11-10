# Private task worker

This Cloudflare Worker provides a shared task API backed by the private `knoukno-worker-tasks` R2 bucket. It is separate from the Kno U Kno website and does not provide per-user accounts.

The website's server also uses token-protected `/internal/users/:userId/businesses/:businessId/tasks` endpoints. It authenticates the signed-in user and checks ownership in MongoDB before accessing a namespace. These internal endpoints trust the shared token holder to select the correct user and business; the token must never be exposed to website clients. Existing shared `/api/tasks` data is kept separately.

## Configuration

Install dependencies with `npm install`. The `TASKS` R2 binding is configured in `wrangler.jsonc`; create the named bucket before deploying. Set a random, unique token of at least 32 characters as the `TASK_API_TOKEN` Worker secret:

```sh
npx wrangler secret put TASK_API_TOKEN
npx wrangler deploy
```

For local development, set `TASK_API_TOKEN` in an untracked `.dev.vars` file and run `npm run dev`. Never commit the token or put it in browser-side code. Requests to `/api/tasks` and `/api/tasks/:slug` require `Authorization: Bearer <token>`; missing or invalid credentials are rejected. The OpenAPI documentation at `/` and `/openapi.json` is public but contains no task data.

## Task API

- `POST /api/tasks`: create a task with `name`, `slug`, optional `description`, optional `completed` (default `false`), and `due_date` in `YYYY-MM-DD` format. Slugs contain only letters, digits, `_`, or `-`. Duplicate slugs return 409.
- `GET /api/tasks/:slug`: retrieve a task; missing tasks return 404.
- `DELETE /api/tasks/:slug`: delete a task; missing tasks return 404.
- `GET /api/tasks`: list 20 tasks per zero-based `page` (0–50), optionally filtered by `isCompleted=true` or `isCompleted=false`. Listing scans at most ten R2 pages; exceeding that limit returns an error rather than an incomplete result.

The API uses a single shared token: anyone with it can read and delete all tasks. R2 operations and storage may incur Cloudflare charges. Run tests with `node --test tests/*.test.js`.
