import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Task } from "../types.js";
import { readTask, taskKey } from "../task-store.js";

export class TaskDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Delete a Task",
		security: [{ bearerAuth: [] }],
		request: {
			params: z.object({
				taskSlug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).describe("Task slug"),
			}),
		},
		responses: {
			"200": {
				description: "Returns if the task was deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.object({
								task: Task,
							}),
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
		await c.env.TASKS.delete(taskKey(taskSlug));
		return { result: { task }, success: true };
	}
}
