import { aiQuestions } from './site-data.js'

export function sampleQuestions() {
  return aiQuestions.slice(0, 5)
}

export function sameQuestions(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((question, index) => question === right[index])
}

export function validSampleSetId(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
