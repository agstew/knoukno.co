import { newFreeTrial, publicTrial, validateTrialAnswer } from './free-trial.js'

async function bodyOf(request) {
  try {
    return await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }
}

export async function handleFreeTrial(request, { authenticate, withCollection, clock = () => new Date() }) {
  try {
    const user = await authenticate(request)
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 })
    return await withCollection(async (collection) => {
      if (request.method === 'GET') {
        return Response.json({ trial: publicTrial(await collection.findOne({ _id: user.id }), clock()) })
      }
      if (request.method === 'POST') {
        const body = await bodyOf(request)
        let trial
        try {
          trial = newFreeTrial(user.id, body?.title, clock())
        } catch (error) {
          return Response.json({ error: error.message }, { status: 400 })
        }
        try {
          await collection.updateOne({ _id: user.id }, { $setOnInsert: trial }, { upsert: true })
        } catch (error) {
          if (error.code !== 11000) throw error
        }
        const saved = await collection.findOne({ _id: user.id })
        if (!saved) throw new Error('The free trial could not be retrieved.')
        return Response.json({ trial: publicTrial(saved, clock()) })
      }
      if (request.method === 'PATCH') {
        const body = await bodyOf(request)
        let answer
        try {
          answer = validateTrialAnswer(body?.index, body?.text)
        } catch (error) {
          return Response.json({ error: error.message }, { status: 400 })
        }
        const result = await collection.updateOne(
          { _id: user.id, expiresAt: { $gt: clock() } },
          { $set: { [`answers.${body.index}`]: answer } },
        )
        if (!result.matchedCount) {
          return Response.json({ error: 'Your free trial has expired or has not been started.' }, { status: 403 })
        }
        const saved = await collection.findOne({ _id: user.id })
        if (!saved) throw new Error('The free trial could not be retrieved.')
        return Response.json({ trial: publicTrial(saved, clock()) })
      }
      return Response.json({ error: 'Method not allowed.' }, { status: 405 })
    })
  } catch (error) {
    console.error('Free trial request failed:', error)
    return Response.json({ error: 'Unable to access your free trial. Please try again.' }, { status: 500 })
  }
}
