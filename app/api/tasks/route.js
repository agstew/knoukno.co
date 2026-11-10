import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../lib/auth-server'
import { handlePersonalTasks } from '../../../lib/personal-tasks'

async function authenticate(request) {
  const authorization = request.headers.get('authorization') || ''
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null
  try {
    return await getCurrentUserFromToken(authorization.replace(/^Bearer\s+/i, ''))
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) ||
        error.message === 'User not found.') return null
    throw error
  }
}

async function ownsBusiness(userId, businessId) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    return Boolean(await client.db().collection('business_workflows').findOne({ id: businessId, userId }, { projection: { _id: 1 } }))
  } finally {
    await client.close()
  }
}

async function callWorker(path, options) {
  if (!process.env.TASK_API_TOKEN) throw new Error('TASK_API_TOKEN is required.')
  const response = await fetch(`https://r2-worker.agstew1.workers.dev${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${process.env.TASK_API_TOKEN}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  })
  const result = await response.json()
  if (!response.ok) {
    if ([400, 404, 409].includes(response.status)) return Response.json({ error: result.error || 'Task request failed.' }, { status: response.status })
    throw new Error(`Task service returned ${response.status}`)
  }
  return Response.json(result, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
}

async function handle(request) {
  try {
    return await handlePersonalTasks(request, { authenticate, ownsBusiness, callWorker })
  } catch (error) {
    console.error('Personal tasks request failed:', error)
    return Response.json({ error: 'Unable to access tasks. Please try again.' }, { status: 503 })
  }
}

export const GET = handle
export const POST = handle
export const DELETE = handle
