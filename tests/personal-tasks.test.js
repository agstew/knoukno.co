import test from 'node:test'
import assert from 'node:assert/strict'
import { handlePersonalTasks } from '../lib/personal-tasks.js'

test('personal task requests require authentication and business ownership', async () => {
  let calls = 0
  const deps = {
    authenticate: async () => null,
    ownsBusiness: async () => true,
    callWorker: async () => { calls++; return Response.json({ tasks: [] }) },
  }
  const request = () => new Request('http://localhost/api/tasks?businessId=other')
  assert.equal((await handlePersonalTasks(request(), deps)).status, 401)
  deps.authenticate = async () => ({ id: 'user-one' })
  deps.ownsBusiness = async () => false
  assert.equal((await handlePersonalTasks(request(), deps)).status, 404)
  assert.equal(calls, 0)
})

test('personal tasks use the authenticated user and owned business scope', async () => {
  let forwarded
  const deps = {
    authenticate: async () => ({ id: 'user-one' }),
    ownsBusiness: async (user, business) => user === 'user-one' && business === 'business-one',
    callWorker: async (path, options) => { forwarded = { path, options }; return Response.json({ ok: true }) },
  }
  const request = new Request('http://localhost/api/tasks?businessId=business-one', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Plan', due_date: '2026-11-10', userId: 'other', slug: 'chosen' }),
  })
  assert.equal((await handlePersonalTasks(request, deps)).status, 200)
  assert.equal(forwarded.path, '/internal/users/user-one/businesses/business-one/tasks')
  const body = JSON.parse(forwarded.options.body)
  assert.equal(body.name, 'Plan')
  assert.notEqual(body.slug, 'chosen')
  assert.equal(body.userId, undefined)
})
