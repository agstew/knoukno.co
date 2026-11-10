import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../lib/auth-server'
import { reorderAnswers, saveAnswer, validateTitle } from '../../../lib/business-workflow'

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

async function withCollection(callback) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required to save business data.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    return await callback(client.db().collection('business_workflows'))
  } finally {
    await client.close()
  }
}

async function handle(request, action) {
  try {
    const user = await authenticate(request)
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 })
    return await action(user)
  } catch (error) {
    console.error('Business workflow request failed:', error)
    return Response.json({ error: 'Unable to access business data. Please try again.' }, { status: 500 })
  }
}

async function readBody(request) {
  try {
    return await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }
}

export async function GET(request) {
  return handle(request, async (user) => {
    const businesses = await withCollection((collection) =>
      collection.find({ userId: user.id }, { projection: { _id: 0, userId: 0 } }).sort({ createdAt: 1 }).toArray())
    return Response.json({ businesses })
  })
}

export async function POST(request) {
  return handle(request, async (user) => {
    const body = await readBody(request)
    let title
    try {
      title = validateTitle(body?.title)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    const business = { id: randomUUID(), userId: user.id, title, answers: [], version: 0, createdAt: new Date().toISOString() }
    await withCollection((collection) => collection.insertOne(business))
    return Response.json({ business: { id: business.id, title, answers: [], version: 0, createdAt: business.createdAt } }, { status: 201 })
  })
}

export async function PATCH(request) {
  return handle(request, async (user) => {
    const body = await readBody(request)
    if (!body || typeof body.id !== 'string' || !Number.isInteger(body.version) || body.version < 0 ||
        !['answer', 'reorder'].includes(body.action)) {
      return Response.json({ error: 'Invalid update request.' }, { status: 400 })
    }
    return withCollection(async (collection) => {
      const business = await collection.findOne({ id: body.id, userId: user.id })
      if (!business) return Response.json({ error: 'Business title not found.' }, { status: 404 })
      if (business.version !== body.version) {
        return Response.json({ error: 'This business was changed elsewhere. Reload and try again.' }, { status: 409 })
      }
      let answers
      try {
        answers = body.action === 'answer' ? saveAnswer(business, body) : reorderAnswers(business, body.order)
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 })
      }
      const result = await collection.updateOne(
        { id: business.id, userId: user.id, version: business.version },
        { $set: { answers }, $inc: { version: 1 } },
      )
      if (!result.modifiedCount) {
        return Response.json({ error: 'This business was changed elsewhere. Reload and try again.' }, { status: 409 })
      }
      return Response.json({ business: { id: business.id, title: business.title, answers, version: business.version + 1, createdAt: business.createdAt } })
    })
  })
}
