import assert from 'node:assert/strict'
import test from 'node:test'
import { gradeSummary, questionAt, reorderAnswers, saveAnswer, validateTitle } from '../lib/business-workflow.js'

test('titles and answers are validated and saved by question', () => {
  assert.equal(validateTitle('  My business  '), 'My business')
  assert.throws(() => validateTitle('  '), /business title/)
  const business = { answers: [] }
  business.answers = saveAnswer(business, { questionIndex: 0, text: ' First answer ', grade: 'A' })
  business.answers = saveAnswer(business, { questionIndex: 0, text: 'Updated', grade: 'B' })
  assert.deepEqual(business.answers, [{ questionIndex: 0, text: 'Updated', grade: 'B' }])
  assert.throws(() => saveAnswer(business, { questionIndex: 99, text: 'No', grade: 'A' }), /Invalid question/)
  assert.throws(() => saveAnswer(business, { questionIndex: 0, text: 'No', grade: 'Z' }), /valid grade/)
  assert.throws(() => saveAnswer(business, { questionIndex: 0, text: 'No', grade: null }), /valid grade/)
})

test('grades include F and ignore ungraded answers', () => {
  const answers = ['A', 'B', 'C', 'D', 'F', null].map((grade) => ({ grade }))
  assert.deepEqual(gradeSummary(answers), { total: 10, count: 5, average: 2 })
  assert.deepEqual(gradeSummary([]), { total: 0, count: 0, average: null })
})

test('answer ranking requires an exact permutation', () => {
  const business = { answers: [{ questionIndex: 1 }, { questionIndex: 3 }] }
  assert.deepEqual(reorderAnswers(business, [3, 1]), [{ questionIndex: 3 }, { questionIndex: 1 }])
  assert.throws(() => reorderAnswers(business, [1, 1]), /invalid/)
  assert.throws(() => reorderAnswers(business, [1]), /invalid/)
  assert.throws(() => reorderAnswers(business, [1, 4]), /invalid/)
})

test('questions without a corresponding sample example do not invent one', () => {
  assert.ok(questionAt(0).example)
  assert.equal(questionAt(19).example, null)
})
