import { aiExamples, aiQuestions } from './site-data.js'

export const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }

export function validateTitle(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) {
    throw new Error('Enter a business title of up to 120 characters.')
  }
  return value.trim()
}

export function saveAnswer(business, { questionIndex, text, grade }) {
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= aiQuestions.length) {
    throw new Error('Invalid question.')
  }
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 10000) {
    throw new Error('Enter an answer of up to 10,000 characters.')
  }
  if (grade != null && (typeof grade !== 'string' || !Object.hasOwn(gradePoints, grade))) {
    throw new Error('Select a valid grade.')
  }
  const answers = [...business.answers]
  const index = answers.findIndex((item) => item.questionIndex === questionIndex)
  const answer = { questionIndex, text: text.trim(), grade: grade ?? (index < 0 ? null : answers[index].grade ?? null) }
  if (index < 0) answers.push(answer)
  else answers[index] = answer
  return answers
}

export function gradeAnswer(business, { questionIndex, grade }) {
  if (!Number.isInteger(questionIndex)) throw new Error('Invalid question.')
  if (typeof grade !== 'string' || !Object.hasOwn(gradePoints, grade)) {
    throw new Error('Select a valid grade.')
  }
  const index = business.answers.findIndex((answer) => answer.questionIndex === questionIndex)
  if (index < 0) throw new Error('Save an answer before assigning a grade.')
  return business.answers.map((answer, answerIndex) => answerIndex === index ? { ...answer, grade } : answer)
}

export function reorderAnswers(business, order) {
  if (!Array.isArray(order) || order.length !== business.answers.length ||
      new Set(order).size !== order.length ||
      order.some((index) => !business.answers.some((answer) => answer.questionIndex === index))) {
    throw new Error('The answer order is invalid.')
  }
  return order.map((index) => business.answers.find((answer) => answer.questionIndex === index))
}

export function rankingDraft(answers, draft) {
  const savedOrder = answers.map((answer) => answer.questionIndex)
  if (!draft) return savedOrder
  const included = draft.filter((index) => savedOrder.includes(index))
  return [...included, ...savedOrder.filter((index) => !included.includes(index))]
}

export function gradeSummary(answers) {
  const graded = answers.filter((answer) => Object.hasOwn(gradePoints, answer.grade))
  const total = graded.reduce((sum, answer) => sum + gradePoints[answer.grade], 0)
  return { total, count: graded.length, average: graded.length ? total / graded.length : null }
}

export function questionAt(index) {
  return { question: aiQuestions[index], example: aiExamples[index] || null }
}
