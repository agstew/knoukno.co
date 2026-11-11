import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../../lib/auth-server'
import { generateAdminQuestions, handleAdminQuestions } from '../../../../lib/admin-ai-questions'

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

async function withDb(action) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for site administration.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    return await action(client.db())
  } finally {
    await client.close()
  }
}

const store = {
  async list() {
    return withDb(async (db) => {
      const businesses = await db.collection('business_workflows')
        .find({}, { projection: { _id: 0, id: 1, title: 1, createdAt: 1 } })
        .sort({ createdAt: -1 }).limit(50).toArray()
      const sets = await db.collection('admin_ai_question_sets')
        .find({ _id: { $in: businesses.map((business) => business.id) }, status: 'complete' },
          { projection: { _id: 1, questions: 1, createdAt: 1 } }).toArray()
      return { businesses, sets: sets.map((set) => ({ businessId: set._id, questions: set.questions, createdAt: set.createdAt })) }
    })
  },
  async claim(businessId, token) {
    return withDb(async (db) => {
      if (!await db.collection('business_workflows').findOne({ id: businessId }, { projection: { _id: 1 } })) return 'missing'
      const now = new Date()
      try {
        const result = await db.collection('admin_ai_question_sets').updateOne(
          { _id: businessId, $or: [{ status: 'failed' }, { status: 'pending', leaseUntil: { $lte: now } }] },
          { $set: { status: 'pending', token, leaseUntil: new Date(now.getTime() + 180000) }, $setOnInsert: { createdAt: now } },
          { upsert: true },
        )
        return result.matchedCount || result.upsertedCount ? 'claimed' : 'busy'
      } catch (error) {
        if (error.code === 11000) return 'busy'
        throw error
      }
    })
  },
  async complete(businessId, token, questions) {
    return withDb(async (db) => {
      const result = await db.collection('admin_ai_question_sets').updateOne(
        { _id: businessId, status: 'pending', token, leaseUntil: { $gt: new Date() } },
        { $set: { status: 'complete', questions, completedAt: new Date() }, $unset: { token: '', leaseUntil: '' } },
      )
      return result.modifiedCount === 1
    })
  },
  async fail(businessId, token) {
    return withDb((db) => db.collection('admin_ai_question_sets').updateOne(
      { _id: businessId, status: 'pending', token },
      { $set: { status: 'failed' }, $unset: { token: '', leaseUntil: '' } },
    ))
  },
}

const handle = (request) => handleAdminQuestions(request, { authenticate, store, generate: generateAdminQuestions })
export const GET = handle
export const POST = handle
