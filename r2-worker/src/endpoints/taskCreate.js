import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Task } from "../types.js";
import { taskKey } from "../task-store.js";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Create a new Task",
		security: [{ bearerAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Task,
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created task",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							task: Task,
						}),
					},
				},
			},
		},
	};

	async handle(c) {
		// Get validated data
		const data = await this.getValidatedData();

		// Retrieve the validated request body
		const taskToCreate = data.body;

		const stored = await c.env.TASKS.put(taskKey(taskToCreate.slug), JSON.stringify(taskToCreate), {
			onlyIf: new Headers({ "If-None-Match": "*" }),
			httpMetadata: { contentType: "application/json" },
			customMetadata: { completed: String(taskToCreate.completed) },
		});
		if (!stored) return c.json({ success: false, error: "Task already exists" }, 409);

		return c.json(
			{
				success: true,
				task: {
					name: taskToCreate.name,
					slug: taskToCreate.slug,
					description: taskToCreate.description,
					completed: taskToCreate.completed,
					due_date: taskToCreate.due_date,
				},
			},
			201,
		);
	}
}
