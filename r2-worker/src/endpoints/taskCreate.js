import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Task } from "../types.js";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Create a new Task",
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

		// Implement your own object insertion here

		// return the new task
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
