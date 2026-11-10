import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Task } from "../types.js";
import { listTasks } from "../task-store.js";

export class TaskList extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "List Tasks",
		security: [{ bearerAuth: [] }],
		request: {
			query: z.object({
				page: z.coerce.number().int().min(0).max(50).default(0).describe("Zero-based page number (20 tasks per page)"),
				isCompleted: z
					.enum(["true", "false"])
					.optional()
					.describe("Filter by completed flag"),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of tasks",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							tasks: Task.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c) {
		// Get validated data
		const data = await this.getValidatedData();

		// Retrieve the validated parameters
		const { page, isCompleted } = data.query;

		return {
			success: true,
			tasks: await listTasks(c.env.TASKS, page, isCompleted === undefined ? undefined : isCompleted === "true"),
		};
	}
}
