import test from 'node:test'
import assert from 'node:assert/strict'
import { newFreeTrial, publicTrial, trialIsActive, validateTrialAnswer } from '../lib/free-trial.js'
import { handleFreeTrial } from '../lib/free-trial-handler.js'

test('a trial has five question-example pairs and expires exactly three days after starting', () => {
  const now = new Date('2026-01-01T12:00:00Z')
  const trial = newFreeTrial('user', ' Coffee shop ', now)
  assert.equal(trial.title, 'Coffee shop')
  assert.equal(trial.questions.length, 5)
  assert.ok(trial.questions.every((item) => item.question && item.example))
  assert.equal(trial.expiresAt.toISOString(), '2026-01-04T12:00:00.000Z')
  assert.ok(trialIsActive(trial, new Date('2026-01-04T11:59:59.999Z')))
  assert.equal(trialIsActive(trial, trial.expiresAt), false)
  assert.equal(publicTrial(trial, trial.expiresAt).active, false)
  assert.equal(publicTrial(trial, now)._id, undefined)
})

test('trial answers accept only five valid indexes and nonempty bounded text', () => {
  assert.equal(validateTrialAnswer(4, ' Answer '), 'Answer')
  for (const index of [-1, 5, 1.5, '1']) {
    assert.throws(() => validateTrialAnswer(index, 'answer'), /five trial questions/)
  }
  for (const text of ['', ' ', 'x'.repeat(10001), null]) {
    assert.throws(() => validateTrialAnswer(0, text), /answer/)
  }
})

test('trial starts once per user, isolates answers, and blocks writes after expiry', async () => {
  const docs = new Map()
  const collection = {
    findOne: async ({ _id }) => docs.get(_id) || null,
    updateOne: async (filter, update) => {
      const current = docs.get(filter._id)
      if (update.$setOnInsert) {
        if (!current) docs.set(filter._id, update.$setOnInsert)
        return { matchedCount: current ? 1 : 0 }
      }
      if (!current || current.expiresAt <= filter.expiresAt.$gt) return { matchedCount: 0 }
      const [key, value] = Object.entries(update.$set)[0]
      current.answers[key.split('.')[1]] = value
      return { matchedCount: 1 }
    },
  }
  let user = 'one'
  let now = new Date('2026-01-01T00:00:00Z')
  const deps = { authenticate: async () => user ? { id: user } : null, withCollection: (fn) => fn(collection), clock: () => now }
  const request = (method, body) => new Request('http://localhost/api/free-trial', {
    method, ...(body ? { body: JSON.stringify(body) } : {}),
  })
  user = null
  assert.equal((await handleFreeTrial(request('GET'), deps)).status, 401)
  user = 'one'
  const started = await (await handleFreeTrial(request('POST', { title: 'Shop' }), deps)).json()
  assert.equal(started.trial.title, 'Shop')
  assert.equal((await handleFreeTrial(request('PATCH', { index: 0, text: 'My answer' }), deps)).status, 200)
  user = 'two'
  assert.equal((await (await handleFreeTrial(request('GET'), deps)).json()).trial, null)
  assert.equal((await handleFreeTrial(request('PATCH', { index: 0, text: 'Other' }), deps)).status, 403)
  user = 'one'
  now = new Date('2026-01-04T00:00:00Z')
  assert.equal((await handleFreeTrial(request('PATCH', { index: 0, text: 'Late' }), deps)).status, 403)
  const restarted = await (await handleFreeTrial(request('POST', { title: 'Another' }), deps)).json()
  assert.equal(restarted.trial.title, 'Shop')
  assert.equal(restarted.trial.active, false)
  assert.equal(restarted.trial.answers['0'], 'My answer')
})
