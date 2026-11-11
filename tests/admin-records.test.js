import test from 'node:test'
import assert from 'node:assert/strict'
import { handleAdminRecords, recordCategories } from '../lib/admin-records.js'

const adminId = 'c0d98a22-07df-48f1-a907-77ba62063a94'
const env = { ADMIN_USER_ID: adminId, JWT_SECRET: 'test-secret' }
const request = (category) => new Request(`http://localhost/api/site-admin/records?category=${category}`)

test('record categories include each requested administration link', () => {
  assert.deepEqual(recordCategories.map(([name]) => name), ['payment', 'title', 'login', 'register', 'print', 'save', 'question', 'grade', 'rated', 'answers', 'average', 'delete', 'email'])
})

test('records require configured admin authorization and a valid category', async () => {
  let calls = 0
  const deps = { authenticate: async () => null, env, loadRecords: async (category) => { calls++; return { category, records: [] } } }
  assert.equal((await handleAdminRecords(request('title'), deps)).status, 401)
  deps.authenticate = async () => ({ id: 'other' })
  assert.equal((await handleAdminRecords(request('title'), deps)).status, 403)
  deps.authenticate = async () => ({ id: adminId })
  assert.equal((await handleAdminRecords(request('invalid'), deps)).status, 400)
  assert.equal(calls, 0)
  const response = await handleAdminRecords(request('grade'), deps)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { category: 'grade', records: [] })
  assert.equal(calls, 1)
})
