import { pricePlans } from './site-data.js'

const API_ORIGIN = 'https://api-m.paypal.com'
const planVariables = {
  Member: 'PAYPAL_LIVE_MEMBER_PLAN_ID',
  Pro: 'PAYPAL_LIVE_PRO_PLAN_ID',
}

export class PayPalLiveError extends Error {}

export function livePayPalConfig(env = process.env) {
  if (!env.PAYPAL_LIVE_CLIENT_ID || !env.PAYPAL_LIVE_CLIENT_SECRET) {
    throw new PayPalLiveError('Live PayPal credentials are not configured.')
  }
  return { clientId: env.PAYPAL_LIVE_CLIENT_ID, secret: env.PAYPAL_LIVE_CLIENT_SECRET }
}

export function expectedLivePlan(name, env = process.env) {
  if (!Object.hasOwn(planVariables, name)) throw new PayPalLiveError('Select a valid live subscription plan.')
  const id = env[planVariables[name]]
  if (typeof id !== 'string' || !/^P-[A-Za-z0-9]+$/.test(id)) {
    throw new PayPalLiveError(`Configure ${planVariables[name]} with a live plan ID.`)
  }
  const plan = pricePlans.find((item) => item.name === name)
  return { id, name, amount: plan.price.slice(1), interval: name === 'Member' ? 'MONTH' : 'YEAR' }
}

function isAmount(value, expected) {
  return typeof value === 'string' && /^\d+(?:\.\d{1,2})?$/.test(value) &&
    Math.round(Number(value) * 100) === Math.round(Number(expected) * 100)
}

export function validateLivePlan(actual, expected) {
  const cycles = actual?.billing_cycles
  const cycle = cycles?.[0]
  const price = cycle?.pricing_scheme?.fixed_price
  const fee = actual?.payment_preferences?.setup_fee
  const tax = actual?.taxes
  if (actual?.id !== expected.id || actual.status !== 'ACTIVE' ||
      !Array.isArray(cycles) || cycles.length !== 1 ||
      cycle?.tenure_type !== 'REGULAR' || cycle.total_cycles !== 0 ||
      cycle.frequency?.interval_unit !== expected.interval || cycle.frequency?.interval_count !== 1 ||
      price?.currency_code !== 'USD' || !isAmount(price.value, expected.amount) ||
      (fee && (fee.currency_code !== 'USD' || !isAmount(fee.value, '0'))) ||
      (tax && !isAmount(tax.percentage, '0'))) {
    throw new PayPalLiveError(`The live PayPal plan for ${expected.name} does not match the advertised terms.`)
  }
}

async function requestJson(url, options, fetchImpl) {
  const response = await fetchImpl(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new PayPalLiveError(`Live PayPal request failed (HTTP ${response.status}).`)
  return response.json()
}

export async function inspectLivePlan(name, { env = process.env, fetchImpl = fetch } = {}) {
  const config = livePayPalConfig(env)
  const expected = expectedLivePlan(name, env)
  const token = await requestJson(`${API_ORIGIN}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  }, fetchImpl)
  if (typeof token.access_token !== 'string' || !token.access_token) {
    throw new PayPalLiveError('Live PayPal did not return an access token.')
  }
  const plan = await requestJson(`${API_ORIGIN}/v1/billing/plans/${expected.id}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }, fetchImpl)
  validateLivePlan(plan, expected)
  return { name: expected.name, id: expected.id, amount: expected.amount, interval: expected.interval }
}
