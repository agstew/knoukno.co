import assert from 'node:assert/strict'
import test from 'node:test'
import { createSandboxSubscription, expectedPlan, getSandboxSubscription, sandboxConfig, validatePlan } from '../lib/paypal-sandbox.js'
import { pricePlans } from '../lib/site-data.js'

const env = {
  NODE_ENV: 'development',
  PAYPAL_MODE: 'sandbox',
  PAYPAL_CLIENT_ID: 'test-client',
  PAYPAL_CLIENT_SECRET: 'test-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  PAYPAL_SANDBOX_MEMBER_PLAN_ID: 'P-TEST123',
  PAYPAL_SANDBOX_MEMBER_BONUS_PLAN_ID: 'P-BONUS123',
  PAYPAL_SANDBOX_PRO_BONUS_PLAN_ID: 'P-PRO123',
}
const plan = {
  id: 'P-TEST123',
  status: 'ACTIVE',
  billing_cycles: [{
    tenure_type: 'REGULAR',
    total_cycles: 0,
    frequency: { interval_unit: 'MONTH', interval_count: 1 },
    pricing_scheme: { fixed_price: { currency_code: 'USD', value: '39.00' } },
  }],
}

test('sandbox checkout fails closed in production, live mode, and non-local URLs', () => {
  assert.throws(() => sandboxConfig({ ...env, NODE_ENV: 'production' }), /disabled/)
  assert.throws(() => sandboxConfig({ ...env, PAYPAL_MODE: 'live' }), /disabled/)
  assert.throws(() => sandboxConfig({ ...env, NEXT_PUBLIC_APP_URL: 'https://www.knoukno.co' }), /local HTTP/)
  assert.throws(() => expectedPlan('Free', env), /valid paid plan/)
})

test('only active plans matching price, interval, and recurring terms are accepted', () => {
  const expected = expectedPlan('Member', env)
  assert.doesNotThrow(() => validatePlan(plan, expected))
  assert.throws(() => validatePlan({ ...plan, status: 'INACTIVE' }, expected), /does not match/)
  assert.throws(() => validatePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], total_cycles: 1 }] }, expected), /does not match/)
  assert.throws(() => validatePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], frequency: { interval_unit: 'YEAR', interval_count: 1 } }] }, expected), /does not match/)
  assert.throws(() => validatePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], pricing_scheme: { fixed_price: { currency_code: 'USD', value: '38.00' } } }] }, expected), /does not match/)
  assert.throws(() => validatePlan({ ...plan, billing_cycles: [{ ...plan.billing_cycles[0], pricing_scheme: { fixed_price: { currency_code: 'EUR', value: '39.00' } } }] }, expected), /does not match/)
  assert.throws(() => validatePlan({ ...plan, payment_preferences: { setup_fee: { value: '10.00' } } }, expected), /does not match/)
})

test('bonus plans require a one-time $100 fee and the correct base billing interval', () => {
  const member = expectedPlan('Member-Bonus', env)
  const bonusPlan = { ...plan, id: member.id, payment_preferences: { setup_fee: { currency_code: 'USD', value: '100.00' } } }
  assert.equal(member.amount, '39.00')
  assert.equal(member.setupFee, '100.00')
  assert.equal(member.interval, 'MONTH')
  const memberDisplay = pricePlans.find((item) => item.name === 'Member-Bonus')
  assert.equal(memberDisplay.firstPayment, '$139.00')
  assert.equal(Number(memberDisplay.firstPayment.slice(1)), Number(member.amount) + Number(member.setupFee))
  assert.doesNotThrow(() => validatePlan(bonusPlan, member))
  assert.throws(() => validatePlan({ ...bonusPlan, payment_preferences: {} }, member), /does not match/)
  assert.throws(() => validatePlan({ ...bonusPlan, payment_preferences: { setup_fee: { currency_code: 'USD', value: '99.00' } } }, member), /does not match/)
  assert.throws(() => validatePlan({ ...bonusPlan, payment_preferences: { setup_fee: { currency_code: 'EUR', value: '100.00' } } }, member), /does not match/)

  const pro = expectedPlan('Pro-Bonus', env)
  assert.equal(pro.amount, '436.00')
  assert.equal(pro.interval, 'YEAR')
  const proPlan = {
    ...bonusPlan,
    id: pro.id,
    billing_cycles: [{ ...plan.billing_cycles[0], frequency: { interval_unit: 'YEAR', interval_count: 1 }, pricing_scheme: { fixed_price: { currency_code: 'USD', value: '436.00' } } }],
  }
  assert.doesNotThrow(() => validatePlan(proPlan, pro))
  assert.throws(() => validatePlan({
    ...proPlan,
    billing_cycles: [{ ...proPlan.billing_cycles[0], pricing_scheme: { fixed_price: { currency_code: 'USD', value: '525.99' } } }],
  }, pro), /does not match/)
})

test('creates a sandbox subscription with server-selected plan and local return URLs', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/oauth2/token')) return Response.json({ access_token: 'test-token' })
    if (url.endsWith('/plans/P-TEST123')) return Response.json(plan)
    return Response.json({ links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=TEST' }] })
  }
  const result = await createSandboxSubscription({ name: 'Member', userId: 'user-123', env, fetchImpl })
  assert.equal(result.approvalUrl, 'https://www.sandbox.paypal.com/checkoutnow?token=TEST')
  assert.equal(calls.length, 3)
  const body = JSON.parse(calls[2].options.body)
  assert.equal(body.plan_id, 'P-TEST123')
  assert.equal(body.custom_id, 'user-123')
  assert.equal(body.application_context.return_url, 'http://localhost:3000/sandbox-checkout')
  assert.ok(calls.every(({ url }) => url.startsWith('https://api-m.sandbox.paypal.com/')))
})

test('rejects unsafe approval links and subscriptions belonging to another user', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/oauth2/token')) return Response.json({ access_token: 'test-token' })
    if (url.includes('/plans/')) return Response.json(plan)
    if (url.includes('/subscriptions/I-TEST123')) return Response.json({ id: 'I-TEST123', custom_id: 'other-user', status: 'ACTIVE' })
    return Response.json({ links: [{ rel: 'approve', href: 'https://www.paypal.com/checkoutnow' }] })
  }
  await assert.rejects(createSandboxSubscription({ name: 'Member', userId: 'user-123', env, fetchImpl }), /unexpected approval link/)
  await assert.rejects(getSandboxSubscription({ subscriptionId: 'I-TEST123', userId: 'user-123', env, fetchImpl }), /not found/)
})

test('returns a verified sandbox subscription status', async () => {
  const fetchImpl = async (url) => url.endsWith('/oauth2/token')
    ? Response.json({ access_token: 'test-token' })
    : Response.json({ id: 'I-TEST123', custom_id: 'user-123', status: 'ACTIVE' })
  assert.deepEqual(await getSandboxSubscription({ subscriptionId: 'I-TEST123', userId: 'user-123', env, fetchImpl }), { id: 'I-TEST123', status: 'ACTIVE' })
})
