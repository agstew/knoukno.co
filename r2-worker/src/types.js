import { z } from "zod";

export const Task = z.object({
	name: z.string().min(1).max(200).openapi({ example: "lorem" }),
	slug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
	description: z.string().max(2000).optional(),
	completed: z.boolean().default(false),
	due_date: z.iso.date(),
});
