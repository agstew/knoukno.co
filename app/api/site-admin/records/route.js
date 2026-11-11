import { MongoClient } from 'mongodb'
import { getCurrentUserFromToken } from '../../../../lib/auth-server'
import { gradeSummary } from '../../../../lib/business-workflow'
import { handleAdminRecords } from '../../../../lib/admin-records'

async function authenticate(request) {
  const authorization = request.headers.get('authorization') || ''
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null
  try {
    return await getCurrentUserFromToken(authorization.replace(/^Bearer\s+/i, ''))
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) ||
        error.message === 'User not found.') return null
    throw error
  }
}

async function loadRecords(category) {
  const unavailable = {
    payment: 'Live payments are not implemented; no payment records are available.',
    print: 'Print actions are not recorded in MongoDB.',
    delete: 'Deletion events are not recorded in MongoDB.',
    email: 'Sent email events are not recorded in MongoDB.',
  }
  if (unavailable[category]) return { note: unavailable[category], records: [] }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for site administration.')
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    if (category === 'register' || category === 'login') {
      const users = await db.collection('users').find({}, {
        projection: { _id: 0, id: 1, fullName: 1, email: 1, createdAt: 1 },
      }).sort({ createdAt: -1 }).limit(25).toArray()
      return { note: category === 'login' ? 'Registered accounts; login events are not recorded. Showing up to 25.' : 'Showing up to 25 registered accounts.', records: users }
    }
    if (category === 'question') {
      const sets = await db.collection('personal_question_sets').find({}, {
        projection: { _id: 0, id: 1, userId: 1, questions: 1, createdAt: 1 },
      }).sort({ createdAt: -1 }).limit(25).toArray()
      return { note: 'Showing up to 25 saved personal sample question sets. AI sets are reviewed separately above.', records: sets }
    }
    const businesses = await db.collection('business_workflows').find({}, {
      projection: { _id: 0, id: 1, userId: 1, title: 1, answers: 1, createdAt: 1 },
    }).sort({ createdAt: -1 }).limit(25).toArray()
    const trials = !['save', 'answers'].includes(category) ? [] : await db.collection('free_trials').find({}, {
      projection: { _id: 1, title: 1, answers: 1, startedAt: 1, expiresAt: 1 },
    }).sort({ startedAt: -1 }).limit(25).toArray()
    const records = businesses.map(({ answers = [], ...business }) => {
      if (category === 'title') return business
      if (category === 'average') return { ...business, summary: gradeSummary(answers) }
      if (category === 'grade') return { ...business, answers: answers.map(({ questionIndex, grade }) => ({ questionIndex, grade })) }
      if (category === 'rated') return { ...business, ranking: answers.map(({ questionIndex }, index) => ({ rank: index + 1, questionIndex })) }
      return { ...business, answers }
    })
    return { note: 'Showing up to 25 recent business records and, for saved answers, 25 trials. Trial answers are separate from business grades and rankings.', records: [...records, ...trials.map(({ _id, ...trial }) => ({ userId: _id, ...trial }))] }
  } finally {
    await client.close()
  }
}

export async function GET(request) {
  return handleAdminRecords(request, { authenticate, loadRecords })
}
