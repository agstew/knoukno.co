import { aiExamples, aiQuestions } from './site-data.js'
import { validateTitle } from './business-workflow.js'

export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000
export const TRIAL_QUESTION_COUNT = 5

export function newFreeTrial(userId, title, now = new Date()) {
  const businessTitle = validateTitle(title)
  return {
    _id: userId,
    title: businessTitle,
    startedAt: now,
    expiresAt: new Date(now.getTime() + TRIAL_DURATION_MS),
    questions: aiQuestions.slice(0, TRIAL_QUESTION_COUNT).map((question, index) => ({
      question,
      example: aiExamples[index],
    })),
    answers: {},
  }
}

export function trialIsActive(trial, now = new Date()) {
  return trial && trial.expiresAt instanceof Date && trial.expiresAt.getTime() > now.getTime()
}

export function validateTrialAnswer(index, text) {
  if (!Number.isInteger(index) || index < 0 || index >= TRIAL_QUESTION_COUNT) {
    throw new Error('Select one of the five trial questions.')
  }
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 10000) {
    throw new Error('Enter an answer of up to 10,000 characters.')
  }
  return text.trim()
}

export function publicTrial(trial, now = new Date()) {
  if (!trial) return null
  return {
    title: trial.title,
    startedAt: trial.startedAt,
    expiresAt: trial.expiresAt,
    questions: trial.questions,
    answers: trial.answers,
    active: Boolean(trialIsActive(trial, now)),
  }
}
