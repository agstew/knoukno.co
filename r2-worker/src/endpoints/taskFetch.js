import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Task } from "../types.js";
import { readTask } from "../task-store.js";

export class TaskFetch extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Get a single Task by slug",
		security: [{ bearerAuth: [] }],
		request: {
			params: z.object({
				taskSlug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).describe("Task slug"),
			}),
		},
		responses: {
			"200": {
				description: "Returns a single task if found",
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

		// Retrieve the validated slug
		const { taskSlug } = data.params;

		const task = await readTask(c.env.TASKS, taskSlug);
		if (!task) return c.json({ success: false, error: "Task not found" }, 404);
		return { success: true, task };
	}
}
