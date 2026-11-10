import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/index.js";

async function request(path, options) {
	const response = await app.fetch(new Request(`http://localhost${path}`, options));
	return { status: response.status, body: await response.json() };
}

test("task routes retain their example responses", async () => {
	const list = await request("/api/tasks");
	assert.equal(list.status, 200);
	assert.equal(list.body.tasks.length, 2);

	const fetched = await request("/api/tasks/example");
	assert.equal(fetched.status, 200);
	assert.equal(fetched.body.task.slug, "example");

	const deleted = await request("/api/tasks/example", { method: "DELETE" });
	assert.equal(deleted.status, 200);
	assert.equal(deleted.body.result.task.slug, "example");

	const task = { name: "Test", slug: "test", completed: false, due_date: "2026-11-10" };
	const created = await request("/api/tasks", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(task),
	});
	assert.equal(created.status, 201);
	assert.deepEqual(created.body.task, task);
});

test("validation and OpenAPI routes remain available", async () => {
	const invalid = await request("/api/tasks", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({}),
	});
	assert.equal(invalid.status, 400);
	const schema = await request("/openapi.json");
	assert.equal(schema.status, 200);
	assert.ok(schema.body.paths["/api/tasks"].post);
	assert.ok(schema.body.paths["/api/tasks/{taskSlug}"].delete);
});
