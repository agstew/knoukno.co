const prefix = "tasks/";
const pageSize = 20;
const maxListRequests = 10;

export function taskKey(slug, namespace = prefix) {
	return `${namespace}${slug}`;
}

export async function readTask(bucket, slug, namespace = prefix) {
	const object = await bucket.get(taskKey(slug, namespace));
	return object ? object.json() : null;
}

export async function listTasks(bucket, page, isCompleted, namespace = prefix) {
	const start = page * pageSize;
	const selected = [];
	let matching = 0;
	let cursor;
	let requests = 0;

	do {
		if (++requests > maxListRequests) {
			throw new Error("Task listing exceeded the scan limit");
		}
		const result = await bucket.list({
			prefix: namespace,
			limit: 1000,
			include: ["customMetadata"],
			...(cursor ? { cursor } : {}),
		});
		for (const object of result.objects) {
			const completed = object.customMetadata?.completed;
			if (completed !== "true" && completed !== "false") {
				throw new Error(`Task metadata is invalid for ${object.key}`);
			}
			if (isCompleted !== undefined && (completed === "true") !== isCompleted) continue;
			if (matching++ >= start) selected.push(object.key);
			if (selected.length === pageSize) break;
		}
		if (selected.length === pageSize || !result.truncated) break;
		if (!result.cursor || result.cursor === cursor) {
			throw new Error("Task listing returned an invalid cursor");
		}
		cursor = result.cursor;
	} while (cursor);

	const tasks = await Promise.all(selected.map(async (key) => {
		const object = await bucket.get(key);
		return object ? object.json() : null;
	}));
	return tasks.filter((task) => task !== null);
}
