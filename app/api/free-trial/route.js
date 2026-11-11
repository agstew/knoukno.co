import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../lib/auth-server'
import { handleFreeTrial } from '../../../lib/free-trial-handler'

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

async function withCollection(action) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for the free trial.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    return await action(client.db().collection('free_trials'))
  } finally {
    await client.close()
  }
}

const handle = (request) => handleFreeTrial(request, { authenticate, withCollection })
export const GET = handle
export const POST = handle
export const PATCH = handle
