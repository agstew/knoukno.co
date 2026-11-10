import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/index.js";

const token = "test-token-with-at-least-32-characters";

class MemoryBucket {
	objects = new Map();

	async put(key, value, options) {
		if (options.onlyIf.get("If-None-Match") === "*" && this.objects.has(key)) return null;
		this.objects.set(key, { value, customMetadata: options.customMetadata });
		return { key };
	}

	async get(key) {
		const item = this.objects.get(key);
		return item ? { json: async () => JSON.parse(item.value) } : null;
	}

	async delete(key) {
		this.objects.delete(key);
	}

	async list({ prefix, limit, cursor }) {
		const keys = [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort();
		const start = cursor ? Number(cursor) : 0;
		const page = keys.slice(start, start + limit);
		return {
			objects: page.map((key) => ({ key, customMetadata: this.objects.get(key).customMetadata })),
			truncated: start + page.length < keys.length,
			cursor: String(start + page.length),
		};
	}
}

async function request(path, { method = "GET", body, auth = token, env } = {}) {
	const headers = new Headers();
	if (auth) headers.set("authorization", `Bearer ${auth}`);
	if (body !== undefined) headers.set("content-type", "application/json");
	const response = await app.fetch(
		new Request(`http://localhost${path}`, {
			method,
			headers,
			...(body !== undefined ? { body: JSON.stringify(body) } : {}),
		}),
		env,
	);
	return { status: response.status, body: await response.json() };
}

test("tasks persist, reject duplicates, and can be retrieved and deleted", async () => {
	const env = { TASK_API_TOKEN: token, TASKS: new MemoryBucket() };
	const task = { name: "Test", slug: "test", completed: false, due_date: "2026-11-10" };
	const created = await request("/api/tasks", { method: "POST", body: task, env });
	assert.equal(created.status, 201);
	assert.deepEqual(created.body.task, task);
	assert.equal((await request("/api/tasks", { method: "POST", body: task, env })).status, 409);
	assert.deepEqual((await request("/api/tasks/test", { env })).body.task, task);
	assert.deepEqual((await request("/api/tasks", { env })).body.tasks, [task]);
	assert.deepEqual((await request("/api/tasks/test", { method: "DELETE", env })).body.result.task, task);
	assert.equal((await request("/api/tasks/test", { env })).status, 404);
	assert.equal((await request("/api/tasks/test", { method: "DELETE", env })).status, 404);
});

test("authorization and missing configuration fail closed", async () => {
	const env = { TASK_API_TOKEN: token, TASKS: new MemoryBucket() };
	assert.equal((await request("/api/tasks", { auth: null, env })).status, 401);
	assert.equal((await request("/api/tasks/test", { auth: "wrong", env })).status, 401);
	assert.equal((await request("/api/tasks", { env: { TASKS: env.TASKS } })).status, 503);
	assert.equal((await request("/api/tasks", { env: { TASK_API_TOKEN: token } })).status, 503);
});

test("task validation, filtering, and zero-based pagination", async () => {
	const env = { TASK_API_TOKEN: token, TASKS: new MemoryBucket() };
	assert.equal((await request("/api/tasks", { method: "POST", body: {}, env })).status, 400);
	assert.equal((await request("/api/tasks", {
		method: "POST", body: { name: "Bad", slug: "../bad", due_date: "2026-11-10" }, env,
	})).status, 400);
	for (let i = 0; i < 45; i++) {
		const task = { name: `Task ${i}`, slug: `task-${String(i).padStart(2, "0")}`, completed: i % 2 === 0, due_date: "2026-11-10" };
		assert.equal((await request("/api/tasks", { method: "POST", body: task, env })).status, 201);
	}
	assert.equal((await request("/api/tasks?page=1", { env })).body.tasks.length, 20);
	assert.equal((await request("/api/tasks?page=2", { env })).body.tasks.length, 5);
	const filtered = await request("/api/tasks?isCompleted=true&page=1", { env });
	assert.equal(filtered.body.tasks.length, 3);
	assert.ok(filtered.body.tasks.every((task) => task.completed));
	assert.equal((await request("/api/tasks?page=51", { env })).status, 400);
	assert.equal((await request("/api/tasks?isCompleted=no", { env })).status, 400);
});

test("OpenAPI describes bearer authentication", async () => {
	const schema = await request("/openapi.json");
	assert.equal(schema.status, 200);
	assert.equal(schema.body.components.securitySchemes.bearerAuth.scheme, "bearer");
	assert.deepEqual(schema.body.paths["/api/tasks"].post.security, [{ bearerAuth: [] }]);
});

test("listing follows truncated R2 pages and reports storage failures", async () => {
	class ShortPageBucket extends MemoryBucket {
		async list(options) {
			return super.list({ ...options, limit: 3 });
		}
	}
	const env = { TASK_API_TOKEN: token, TASKS: new ShortPageBucket() };
	for (let i = 0; i < 5; i++) {
		const task = { name: `Task ${i}`, slug: `task-${i}`, completed: true, due_date: "2026-11-10" };
		assert.equal((await request("/api/tasks", { method: "POST", body: task, env })).status, 201);
	}
	assert.equal((await request("/api/tasks", { env })).body.tasks.length, 5);
	env.TASKS.list = async () => { throw new Error("Storage unavailable"); };
	assert.equal((await request("/api/tasks", { env })).status, 500);
});
