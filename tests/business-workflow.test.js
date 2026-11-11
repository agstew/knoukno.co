import assert from 'node:assert/strict'
import test from 'node:test'
import { gradeAnswer, gradeSummary, questionAt, questionPageIndices, rankingDraft, reorderAnswers, saveAnswer, validateTitle } from '../lib/business-workflow.js'
import { aiExamples, aiQuestions } from '../lib/site-data.js'

test('titles and answers are validated and saved by question', () => {
  assert.equal(validateTitle('  My business  '), 'My business')
  assert.throws(() => validateTitle('  '), /business title/)
  const business = { answers: [] }
  business.answers = saveAnswer(business, { questionIndex: 0, text: ' First answer ', grade: 'A' })
  business.answers = saveAnswer(business, { questionIndex: 0, text: 'Updated', grade: 'B' })
  assert.deepEqual(business.answers, [{ questionIndex: 0, text: 'Updated', grade: 'B' }])
  assert.throws(() => saveAnswer(business, { questionIndex: 99, text: 'No', grade: 'A' }), /Invalid question/)
  assert.throws(() => saveAnswer(business, { questionIndex: 0, text: 'No', grade: 'Z' }), /valid grade/)
  business.answers = saveAnswer(business, { questionIndex: 1, text: 'Ungraded' })
  assert.equal(business.answers[1].grade, null)
  business.answers = saveAnswer(business, { questionIndex: 0, text: 'Edited without grade' })
  assert.equal(business.answers[0].grade, 'B')
})

test('grades can be assigned and updated without changing answer order or text', () => {
  const business = { answers: [{ questionIndex: 3, text: 'First', grade: null }, { questionIndex: 0, text: 'Second', grade: 'B' }] }
  business.answers = gradeAnswer(business, { questionIndex: 3, grade: 'A' })
  assert.deepEqual(business.answers, [{ questionIndex: 3, text: 'First', grade: 'A' }, { questionIndex: 0, text: 'Second', grade: 'B' }])
  assert.deepEqual(gradeSummary(business.answers), { total: 7, count: 2, average: 3.5 })
  business.answers = gradeAnswer(business, { questionIndex: 0, grade: 'F' })
  assert.deepEqual(gradeSummary(business.answers), { total: 4, count: 2, average: 2 })
  assert.throws(() => gradeAnswer(business, { questionIndex: 1, grade: 'A' }), /Save an answer/)
  assert.throws(() => gradeAnswer(business, { questionIndex: 0, grade: null }), /valid grade/)
  assert.throws(() => gradeAnswer(business, { questionIndex: 0, grade: 'Z' }), /valid grade/)
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

test('ranking drafts retain their order and include newly saved answers', () => {
  const answers = [{ questionIndex: 1 }, { questionIndex: 3 }, { questionIndex: 5 }]
  assert.deepEqual(rankingDraft(answers), [1, 3, 5])
  assert.deepEqual(rankingDraft(answers, [3, 1]), [3, 1, 5])
  assert.deepEqual(rankingDraft(answers, [3, 9, 1]), [3, 1, 5])
})

test('every prepared question has a corresponding example', () => {
  assert.equal(aiQuestions.length, 20)
  assert.equal(aiExamples.length, aiQuestions.length)
  for (let index = 0; index < aiQuestions.length; index += 1) {
    assert.equal(questionAt(index).question, aiQuestions[index])
    assert.ok(questionAt(index).example?.trim(), `Missing example for question ${index + 1}`)
  }
  assert.equal(questionAt(aiQuestions.length).example, null)
})

test('question pagination shows groups of five including a partial final group', () => {
  assert.deepEqual(questionPageIndices(0, 12), [0, 1, 2, 3, 4])
  assert.deepEqual(questionPageIndices(5, 12), [5, 6, 7, 8, 9])
  assert.deepEqual(questionPageIndices(11, 12), [10, 11])
  assert.deepEqual(questionPageIndices(0, 1), [0])
  assert.throws(() => questionPageIndices(12, 12), /Invalid/)
  assert.throws(() => questionPageIndices(0, 0), /Invalid/)
  assert.throws(() => questionPageIndices(0, 12, 0), /Invalid/)
})
