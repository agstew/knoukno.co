import test from 'node:test'
import assert from 'node:assert/strict'
import { generateAdminQuestions, handleAdminQuestions, validateAdminQuestions } from '../lib/admin-ai-questions.js'

const adminId = 'c0d98a22-07df-48f1-a907-77ba62063a94'
const businessId = 'c0d98a22-07df-48f1-a907-77ba62063a95'
const env = { ADMIN_USER_ID: adminId, JWT_SECRET: 'test-secret', OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }
const questions = Array.from({ length: 300 }, (_, index) => `How will you address planning item ${index + 1}?`)
const req = (method, body) => new Request('http://localhost/api/site-admin/questions', {
  method, ...(body ? { body: JSON.stringify(body) } : {}),
})

test('requires exactly 300 distinct short questions without examples', () => {
  assert.equal(validateAdminQuestions({ questions }).length, 300)
  assert.throws(() => validateAdminQuestions({ questions: questions.slice(1) }), /exactly 300/)
  assert.throws(() => validateAdminQuestions({ questions: [...questions.slice(0, 299), questions[0].toUpperCase()] }), /duplicate/)
  assert.throws(() => validateAdminQuestions({ questions: [...questions.slice(0, 299), 'Not a question'] }), /short question/)
})

test('requests general questions without sending business data or retaining provider responses', async () => {
  let payload
  const result = await generateAdminQuestions({ env, fetchImpl: async (url, options) => {
    payload = JSON.parse(options.body)
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ questions }) }] }] })
  } })
  assert.deepEqual(result, questions)
  assert.equal(payload.store, false)
  assert.match(payload.instructions, /any specific industry/)
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(businessId))
  await assert.rejects(generateAdminQuestions({ env, fetchImpl: async () => new Response('', { status: 429 }) }), /HTTP 429/)
})

test('allows only the configured admin to generate, saves once, and rejects concurrent claims', async () => {
  let claimed = false
  let saved
  const store = {
    list: async () => ({ businesses: [], sets: [] }),
    claim: async () => claimed ? 'busy' : (claimed = true, 'claimed'),
    complete: async (id, token, result) => { saved = result; return true },
    fail: async () => { claimed = false },
  }
  const deps = { authenticate: async () => ({ id: 'other' }), store, env, generate: async () => questions }
  assert.equal((await handleAdminQuestions(req('POST', { businessId }), deps)).status, 403)
  assert.equal(claimed, false)
  deps.authenticate = async () => ({ id: adminId })
  assert.equal((await handleAdminQuestions(req('POST', { businessId }), deps)).status, 201)
  assert.deepEqual(saved, questions)
  assert.equal((await handleAdminQuestions(req('POST', { businessId }), deps)).status, 409)
  assert.equal((await handleAdminQuestions(req('GET'), deps)).status, 200)
})

test('failed generation is not saved and releases its reservation', async () => {
  let failed = false
  const original = console.error
  console.error = () => {}
  try {
    const response = await handleAdminQuestions(req('POST', { businessId }), {
      authenticate: async () => ({ id: adminId }), env,
      store: { claim: async () => 'claimed', complete: async () => { throw new Error('must not save') }, fail: async () => { failed = true } },
      generate: async () => questions.slice(1),
    })
    assert.equal(response.status, 500)
    assert.equal(failed, true)
  } finally { console.error = original }
})
