import { randomUUID } from 'node:crypto'

export async function handlePersonalTasks(request, { authenticate, ownsBusiness, callWorker }) {
  const user = await authenticate(request)
  if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 })
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')
  if (!businessId || !/^[a-zA-Z0-9_-]{1,100}$/.test(businessId)) {
    return Response.json({ error: 'Invalid business title.' }, { status: 400 })
  }
  if (!await ownsBusiness(user.id, businessId)) {
    return Response.json({ error: 'Business title not found.' }, { status: 404 })
  }

  const scope = `/internal/users/${encodeURIComponent(user.id)}/businesses/${encodeURIComponent(businessId)}/tasks`
  if (request.method === 'GET') {
    const page = url.searchParams.get('page') || '0'
    if (!/^(?:[0-9]|[1-4][0-9]|50)$/.test(page)) return Response.json({ error: 'Invalid page.' }, { status: 400 })
    return callWorker(`${scope}?page=${page}`, { method: 'GET' })
  }
  let body
  try {
    body = await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: 'Invalid request.' }, { status: 400 })
    throw error
  }
  if (request.method === 'POST') {
    if (typeof body?.name !== 'string' || !body.name.trim() || body.name.trim().length > 200 ||
        typeof body.due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
      return Response.json({ error: 'Enter a task name and valid due date.' }, { status: 400 })
    }
    return callWorker(scope, { method: 'POST', body: JSON.stringify({ name: body.name.trim(), slug: randomUUID(), due_date: body.due_date, completed: false }) })
  }
  if (request.method === 'DELETE') {
    if (typeof body?.slug !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.slug)) {
      return Response.json({ error: 'Invalid task.' }, { status: 400 })
    }
    return callWorker(`${scope}/${encodeURIComponent(body.slug)}`, { method: 'DELETE' })
  }
  return Response.json({ error: 'Method not allowed.' }, { status: 405 })
}
