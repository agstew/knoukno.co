import { randomUUID } from 'node:crypto'
import { authorizeSiteAdmin } from './site-admin.js'

const QUESTION_COUNT = 300
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const headers = { 'Cache-Control': 'no-store' }

export function validateAdminQuestions(value) {
  if (!value || !Array.isArray(value.questions) || value.questions.length !== QUESTION_COUNT) {
    throw new Error('The AI must return exactly 300 questions.')
  }
  const questions = value.questions.map((question) => {
    if (typeof question !== 'string' || !question.trim() || question.trim().split(/\s+/u).length > 40 ||
        !question.trim().endsWith('?')) {
      throw new Error('Each AI question must be a short question of at most 40 words.')
    }
    return question.trim().replace(/\s+/gu, ' ')
  })
  const normalized = questions.map((question) => question.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim())
  if (new Set(normalized).size !== QUESTION_COUNT) throw new Error('The AI returned duplicate questions.')
  return questions
}

export async function generateAdminQuestions({ env = process.env, fetchImpl = fetch } = {}) {
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) throw new Error('AI question generation is not configured.')
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      store: false,
      instructions: 'Create 300 distinct short questions about the general steps to start and run a business. Progress from legal foundations through planning, location, finance, customers, hiring, operations, and continued improvement. Do not target any specific industry, trade, product, or sales sector. Do not provide examples or answers. Each question must end in a question mark and contain at most 40 words. Avoid repeating the same idea. This is educational content, not legal or financial advice.',
      input: 'Generate one general business-planning question set for administrator review.',
      text: { format: { type: 'json_schema', name: 'business_questions', strict: true, schema: {
        type: 'object', properties: { questions: { type: 'array', items: { type: 'string' } } },
        required: ['questions'], additionalProperties: false,
      } } },
      max_output_tokens: 12000,
    }),
    signal: AbortSignal.timeout(120000),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`AI question generation failed (HTTP ${response.status}).`)
  const result = await response.json()
  if (result.status !== 'completed') throw new Error('AI question generation did not complete.')
  const output = result.output?.flatMap((item) => item.type === 'message' ? item.content || [] : [])
    .filter((item) => item.type === 'output_text')
  if (!output || output.length !== 1 || typeof output[0].text !== 'string') {
    throw new Error('AI question generation returned an invalid response.')
  }
  let data
  try {
    data = JSON.parse(output[0].text)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new Error('AI question generation returned invalid JSON.')
  }
  return validateAdminQuestions(data)
}

export async function handleAdminQuestions(request, { authenticate, store, generate = generateAdminQuestions, env = process.env }) {
  try {
    const access = await authorizeSiteAdmin(request, authenticate, env)
    if (access.error) return Response.json({ error: access.error }, { status: access.status, headers })
    if (request.method === 'GET') return Response.json(await store.list(), { headers })
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers })
    let body
    try {
      body = await request.json()
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      return Response.json({ error: 'Invalid request.' }, { status: 400, headers })
    }
    if (typeof body?.businessId !== 'string' || !UUID_V4.test(body.businessId)) {
      return Response.json({ error: 'Select a valid business.' }, { status: 400, headers })
    }
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
      return Response.json({ error: 'AI question generation is not configured.' }, { status: 503, headers })
    }
    const token = randomUUID()
    const claimed = await store.claim(body.businessId, token)
    if (claimed === 'missing') return Response.json({ error: 'Business not found.' }, { status: 404, headers })
    if (claimed !== 'claimed') return Response.json({ error: 'A question set already exists or is being generated for this business.' }, { status: 409, headers })
    try {
      const questions = validateAdminQuestions({ questions: await generate({ env }) })
      if (!await store.complete(body.businessId, token, questions)) throw new Error('The generation reservation expired before the set could be saved.')
      return Response.json({ businessId: body.businessId, questions }, { status: 201, headers })
    } catch (error) {
      await store.fail(body.businessId, token)
      throw error
    }
  } catch (error) {
    console.error('Admin question request failed:', error)
    return Response.json({ error: 'Unable to generate or load questions. Check the server logs and try again.' }, { status: 500, headers })
  }
}
