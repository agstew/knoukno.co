import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../lib/auth-server'
import { handleSiteAdmin } from '../../../lib/site-admin'

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

async function loadOverview() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for site administration.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const [users, businesses, trials] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('business_workflows').countDocuments(),
      db.collection('free_trials').countDocuments(),
    ])
    return { users, businesses, trials }
  } finally {
    await client.close()
  }
}

export async function GET(request) {
  return handleSiteAdmin(request, { authenticate, loadOverview })
}
