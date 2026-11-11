import assert from 'node:assert/strict'
import test from 'node:test'
import { expectedLivePlan, inspectLivePlan, livePayPalConfig, validateLivePlan, verifyLiveWebhook } from '../lib/paypal-live.js'

const env = {
  PAYPAL_LIVE_CLIENT_ID: 'client',
  PAYPAL_LIVE_CLIENT_SECRET: 'secret',
  PAYPAL_LIVE_MEMBER_PLAN_ID: 'P-MEMBER123',
  PAYPAL_LIVE_PRO_PLAN_ID: 'P-PRO123',
}
const plan = {
  id: 'P-MEMBER123',
  status: 'ACTIVE',
  billing_cycles: [{
    tenure_type: 'REGULAR',
    total_cycles: 0,
    frequency: { interval_unit: 'MONTH', interval_count: 1 },
    pricing_scheme: { fixed_price: { currency_code: 'USD', value: '39.00' } },
  }],
}

test('requires live credentials and a valid plan selected by the server', () => {
  assert.throws(() => livePayPalConfig({}), /not configured/)
  assert.throws(() => expectedLivePlan('Member-Bonus', env), /valid live subscription/)
  assert.throws(() => expectedLivePlan('Member', { ...env, PAYPAL_LIVE_MEMBER_PLAN_ID: '../bad' }), /plan ID/)
  assert.equal(expectedLivePlan('Pro', env).amount, '436.00')
  assert.equal(expectedLivePlan('Pro', env).interval, 'YEAR')
})

test('rejects live plans with incorrect pricing or billing terms', () => {
  const expected = expectedLivePlan('Member', env)
  assert.doesNotThrow(() => validateLivePlan(plan, expected))
  assert.throws(() => validateLivePlan({ ...plan, status: 'INACTIVE' }, expected), /does not match/)
  assert.throws(() => validateLivePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], total_cycles: 12 }] }, expected), /does not match/)
  assert.throws(() => validateLivePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], frequency: { interval_unit: 'YEAR', interval_count: 1 } }] }, expected), /does not match/)
  for (const value of ['38.00', '39junk', '39.001', '', null]) {
    assert.throws(() => validateLivePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], pricing_scheme: { fixed_price: { currency_code: 'USD', value } } }] }, expected), /does not match/)
  }
  assert.throws(() => validateLivePlan({ ...plan, payment_preferences: { setup_fee: { currency_code: 'USD', value: '100.00' } } }, expected), /does not match/)
  assert.throws(() => validateLivePlan({ ...plan, taxes: { percentage: '5.00' } }, expected), /does not match/)
})

test('inspection uses only read-only calls to the live PayPal API', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method || 'GET' })
    return Response.json(url.endsWith('/oauth2/token') ? { access_token: 'token' } : plan)
  }
  assert.deepEqual(await inspectLivePlan('Member', { env, fetchImpl }), {
    name: 'Member', id: 'P-MEMBER123', amount: '39.00', interval: 'MONTH',
  })
  assert.deepEqual(calls, [
    { url: 'https://api-m.paypal.com/v1/oauth2/token', method: 'POST' },
    { url: 'https://api-m.paypal.com/v1/billing/plans/P-MEMBER123', method: 'GET' },
  ])
})

test('inspection reports provider and authentication failures', async () => {
  await assert.rejects(inspectLivePlan('Member', { env, fetchImpl: async () => new Response('', { status: 401 }) }), /HTTP 401/)
  await assert.rejects(inspectLivePlan('Member', { env, fetchImpl: async () => Response.json({}) }), /access token/)
})

test('verifies a webhook with the live PayPal verification API', async () => {
  const calls = []
  const headers = new Headers({
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api-m.paypal.com/v1/notifications/certs/example',
    'paypal-transmission-id': 'transmission',
    'paypal-transmission-sig': 'signature',
    'paypal-transmission-time': '2026-01-01T00:00:00Z',
  })
  const event = { id: 'WH-TEST', event_type: 'BILLING.SUBSCRIPTION.ACTIVATED', resource: { id: 'I-TEST' } }
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return Response.json(url.endsWith('/oauth2/token') ? { access_token: 'token' } : { verification_status: 'SUCCESS' })
  }
  assert.equal(await verifyLiveWebhook({ headers, event, env: { ...env, PAYPAL_LIVE_WEBHOOK_ID: 'webhook' }, fetchImpl }), event)
  assert.equal(calls[1].url, 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature')
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    auth_algo: 'SHA256withRSA',
    cert_url: 'https://api-m.paypal.com/v1/notifications/certs/example',
    transmission_id: 'transmission',
    transmission_sig: 'signature',
    transmission_time: '2026-01-01T00:00:00Z',
    webhook_id: 'webhook',
    webhook_event: event,
  })
})

test('rejects missing configuration, malformed events, missing headers and failed verification', async () => {
  const configured = { ...env, PAYPAL_LIVE_WEBHOOK_ID: 'webhook' }
  const event = { id: 'WH-TEST', event_type: 'BILLING.SUBSCRIPTION.ACTIVATED' }
  const headers = new Headers({
    'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'cert',
    'paypal-transmission-id': 'id', 'paypal-transmission-sig': 'sig', 'paypal-transmission-time': 'time',
  })
  await assert.rejects(verifyLiveWebhook({ headers, event, env }), /webhook ID/)
  await assert.rejects(verifyLiveWebhook({ headers, event: {}, env: configured }), /Invalid PayPal webhook/)
  await assert.rejects(verifyLiveWebhook({ headers: new Headers(), event, env: configured }), /Missing PayPal webhook header/)
  const fetchImpl = async (url) => Response.json(url.endsWith('/oauth2/token') ? { access_token: 'token' } : { verification_status: 'FAILURE' })
  await assert.rejects(verifyLiveWebhook({ headers, event, env: configured, fetchImpl }), /signature verification failed/)
})
