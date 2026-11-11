import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../lib/auth-server'
import { sameQuestions, sampleQuestions, validSampleSetId } from '../../../lib/personal-question-sets'

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

async function handle(request, action) {
  try {
    const user = await authenticate(request)
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 })
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required to save question sets.')
    const client = new MongoClient(process.env.MONGODB_URI)
    try {
      await client.connect()
      return await action(client.db().collection('personal_question_sets'), user)
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Personal question set request failed:', error)
    return Response.json({ error: 'Unable to access your question sets. Please try again.' }, { status: 500 })
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
  return handle(request, async (collection, user) => {
    const sets = await collection.find({ userId: user.id }, { projection: { _id: 0, userId: 0 } })
      .sort({ createdAt: -1 }).limit(50).toArray()
    return Response.json({ sets })
  })
}

export async function POST(request) {
  return handle(request, async (collection, user) => {
    const body = await readBody(request)
    if (!validSampleSetId(body?.id)) {
      return Response.json({ error: 'Invalid question set.' }, { status: 400 })
    }
    const key = `${user.id}:${body.id}`
    const existing = await collection.findOne({ _id: key, userId: user.id }, { projection: { _id: 0, userId: 0 } })
    if (existing) {
      if (!sameQuestions(body.questions, existing.questions)) {
        return Response.json({ error: 'This set was already saved with different questions.' }, { status: 409 })
      }
      return Response.json({ set: existing })
    }
    const questions = sampleQuestions()
    if (!sameQuestions(body.questions, questions)) {
      return Response.json({ error: 'The prepared questions changed. Generate a new sample set and try again.' }, { status: 409 })
    }
    await collection.updateOne(
      { _id: key, userId: user.id },
      { $setOnInsert: { id: body.id, userId: user.id, questions, createdAt: new Date().toISOString() } },
      { upsert: true },
    )
    const set = await collection.findOne({ _id: key, userId: user.id }, { projection: { _id: 0, userId: 0 } })
    if (!set) throw new Error('Saved question set could not be retrieved.')
    if (!sameQuestions(body.questions, set.questions)) {
      return Response.json({ error: 'This set was already saved with different questions.' }, { status: 409 })
    }
    return Response.json({ set })
  })
}

export async function DELETE(request) {
  return handle(request, async (collection, user) => {
    const body = await readBody(request)
    if (!validSampleSetId(body?.id)) {
      return Response.json({ error: 'Invalid question set.' }, { status: 400 })
    }
    const result = await collection.deleteOne({ _id: `${user.id}:${body.id}`, userId: user.id })
    if (!result.deletedCount) {
      return Response.json({ error: 'Question set not found.' }, { status: 404 })
    }
    return Response.json({ deleted: true })
  })
}
