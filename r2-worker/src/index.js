import { fromHono } from "chanfana";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { TaskCreate } from "./endpoints/taskCreate.js";
import { TaskDelete } from "./endpoints/taskDelete.js";
import { TaskFetch } from "./endpoints/taskFetch.js";
import { TaskList } from "./endpoints/taskList.js";
import { Task } from "./types.js";
import { listTasks, readTask, taskKey } from "./task-store.js";

// Start a Hono app
const app = new Hono();

async function authenticate(c, next) {
	c.header("Cache-Control", "no-store");
	const secret = c.env?.TASK_API_TOKEN;
	if (typeof secret !== "string" || secret.length < 32) {
		console.error("TASK_API_TOKEN is missing or too short");
		return c.json({ success: false, error: "Task API is not configured" }, 503);
	}
	const match = /^Bearer ([^\s]+)$/i.exec(c.req.header("authorization") || "");
	if (!match) return c.json({ success: false, error: "Unauthorized" }, 401);
	const encoder = new TextEncoder();
	const [expected, supplied] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(secret)),
		crypto.subtle.digest("SHA-256", encoder.encode(match[1])),
	]);
	const a = new Uint8Array(expected);
	const b = new Uint8Array(supplied);
	let difference = 0;
	for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
	if (difference !== 0) return c.json({ success: false, error: "Unauthorized" }, 401);
	if (!c.env.TASKS) {
		console.error("TASKS R2 binding is missing");
		return c.json({ success: false, error: "Task storage is not configured" }, 503);
	}
	await next();
}

app.use("/api/tasks/*", authenticate);
app.use("/internal/*", authenticate);
app.onError((error, c) => {
	if (error instanceof HTTPException) return error.getResponse();
	console.error("Task API error:", error);
	return c.json({ success: false, error: "Task API request failed" }, 500);
});

const scopedTasks = "/internal/users/:userId/businesses/:businessId/tasks";
function namespace(c) {
	const { userId, businessId } = c.req.param();
	if (!/^[a-zA-Z0-9_-]{1,100}$/.test(userId) || !/^[a-zA-Z0-9_-]{1,100}$/.test(businessId)) return null;
	return `users/${userId}/businesses/${businessId}/tasks/`;
}

app.get(scopedTasks, async (c) => {
	const scope = namespace(c);
	const page = c.req.query("page") || "0";
	if (!scope || !/^(?:[0-9]|[1-4][0-9]|50)$/.test(page)) return c.json({ error: "Invalid task request" }, 400);
	return c.json({ tasks: await listTasks(c.env.TASKS, Number(page), undefined, scope) });
});

app.post(scopedTasks, async (c) => {
	const scope = namespace(c);
	if (!scope) return c.json({ error: "Invalid task request" }, 400);
	let input;
	try {
		input = await c.req.json();
	} catch (error) {
		if (error instanceof SyntaxError) return c.json({ error: "Invalid JSON" }, 400);
		throw error;
	}
	const parsed = Task.safeParse(input);
	if (!parsed.success) return c.json({ error: "Invalid task" }, 400);
	const task = parsed.data;
	const stored = await c.env.TASKS.put(taskKey(task.slug, scope), JSON.stringify(task), {
		onlyIf: new Headers({ "If-None-Match": "*" }),
		httpMetadata: { contentType: "application/json" },
		customMetadata: { completed: String(task.completed) },
	});
	if (!stored) return c.json({ error: "Task already exists" }, 409);
	return c.json({ task }, 201);
});

app.delete(`${scopedTasks}/:taskSlug`, async (c) => {
	const scope = namespace(c);
	const slug = c.req.param("taskSlug");
	if (!scope || !/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) return c.json({ error: "Invalid task request" }, 400);
	const task = await readTask(c.env.TASKS, slug, scope);
	if (!task) return c.json({ error: "Task not found" }, 404);
	await c.env.TASKS.delete(taskKey(slug, scope));
	return c.json({ task });
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});
openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
