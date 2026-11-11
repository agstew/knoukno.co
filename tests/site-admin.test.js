import assert from 'node:assert/strict'
import test from 'node:test'
import { handleSiteAdmin } from '../lib/site-admin.js'

const adminId = 'c0d98a22-07df-48f1-a907-77ba62063a94'
const request = () => new Request('http://localhost/api/site-admin')
const env = { ADMIN_USER_ID: adminId, JWT_SECRET: 'test-secret' }

test('requires a valid administrator account and fails closed if unconfigured', async () => {
  let loads = 0
  const deps = { authenticate: async () => null, loadOverview: async () => { loads++; return {} }, env }
  assert.equal((await handleSiteAdmin(request(), deps)).status, 401)
  deps.authenticate = async () => ({ id: adminId })
  assert.equal((await handleSiteAdmin(request(), { ...deps, env: {} })).status, 503)
  assert.equal((await handleSiteAdmin(request(), { ...deps, env: { ...env, ADMIN_USER_ID: 'invalid' } })).status, 503)
  assert.equal((await handleSiteAdmin(request(), { ...deps, env: { ADMIN_USER_ID: adminId } })).status, 503)
  assert.equal((await handleSiteAdmin(request(), { ...deps, env: { ...env, JWT_SECRET: 'knoukno-dev-secret' } })).status, 503)
  deps.authenticate = async () => ({ id: 'different-user' })
  assert.equal((await handleSiteAdmin(request(), deps)).status, 403)
  assert.equal(loads, 0)
})

test('returns counts and configuration presence without values only to the administrator', async () => {
  const response = await handleSiteAdmin(request(), {
    authenticate: async () => ({ id: adminId }),
    loadOverview: async () => ({ users: 2, businesses: 3, trials: 1 }),
    env: { ...env, RESEND_API_KEY: 'secret', RESEND_FROM: 'sender', NEXT_PUBLIC_APP_URL: 'url' },
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const result = await response.json()
  assert.deepEqual(result, { counts: { users: 2, businesses: 3, trials: 1 }, configuration: { paypal: false, resend: true, ai: false } })
  assert.ok(!JSON.stringify(result).includes('secret'))
})

test('reports database errors instead of showing invented statistics', async () => {
  const original = console.error
  let logged = false
  console.error = () => { logged = true }
  try {
    const response = await handleSiteAdmin(request(), {
      authenticate: async () => ({ id: adminId }),
      loadOverview: async () => { throw new Error('database unavailable') },
      env,
    })
    assert.equal(response.status, 500)
    assert.equal(logged, true)
  } finally {
    console.error = original
  }
})
