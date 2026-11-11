import assert from 'node:assert/strict'
import test from 'node:test'
import { sameQuestions, sampleQuestions, validSampleSetId } from '../lib/personal-question-sets.js'
import { aiQuestions } from '../lib/site-data.js'

test('sample sets contain the existing prepared questions without mutating them', () => {
  const questions = sampleQuestions()
  assert.deepEqual(questions, aiQuestions)
  assert.equal(questions.length, 20)
  questions.pop()
  assert.equal(aiQuestions.length, 20)
})

test('sample set identifiers must be version 4 UUIDs', () => {
  assert.equal(validSampleSetId('a482979f-166c-4613-b252-58f62a64d30f'), true)
  assert.equal(validSampleSetId('not-a-uuid'), false)
  assert.equal(validSampleSetId('a482979f-166c-1613-b252-58f62a64d30f'), false)
  assert.equal(validSampleSetId(null), false)
})

test('question snapshots must match exactly', () => {
  const questions = sampleQuestions()
  assert.equal(sameQuestions(questions, sampleQuestions()), true)
  assert.equal(sameQuestions(questions.slice(1), questions), false)
  assert.equal(sameQuestions([...questions].reverse(), questions), false)
  assert.equal(sameQuestions(null, questions), false)
})
