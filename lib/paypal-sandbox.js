import { pricePlans } from './site-data.js'

const API = 'https://api-m.sandbox.paypal.com'
const planVariables = {
  Member: 'PAYPAL_SANDBOX_MEMBER_PLAN_ID',
  'Member-Bonus': 'PAYPAL_SANDBOX_MEMBER_BONUS_PLAN_ID',
  Pro: 'PAYPAL_SANDBOX_PRO_PLAN_ID',
  'Pro-Bonus': 'PAYPAL_SANDBOX_PRO_BONUS_PLAN_ID',
}

export class SandboxError extends Error {}

export function sandboxConfig(env = process.env) {
  if (env.NODE_ENV === 'production' || env.PAYPAL_MODE !== 'sandbox') {
    throw new SandboxError('Sandbox checkout is disabled. It is available only in local development.')
  }
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !env.NEXT_PUBLIC_APP_URL) {
    throw new SandboxError('PayPal Sandbox credentials and NEXT_PUBLIC_APP_URL are required.')
  }
  let url
  try {
    url = new URL(env.NEXT_PUBLIC_APP_URL)
  } catch {
    throw new SandboxError('NEXT_PUBLIC_APP_URL must be a local HTTP URL.')
  }
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.username || url.password) {
    throw new SandboxError('NEXT_PUBLIC_APP_URL must be a local HTTP URL.')
  }
  return { clientId: env.PAYPAL_CLIENT_ID, secret: env.PAYPAL_CLIENT_SECRET, origin: url.origin }
}

export function expectedPlan(name, env = process.env) {
  if (!Object.hasOwn(planVariables, name)) throw new SandboxError('Select a valid paid plan.')
  const plan = pricePlans.find((item) => item.name === name)
  const id = env[planVariables[name]]
  if (!id || !/^P-[A-Za-z0-9]+$/.test(id)) throw new SandboxError(`Configure ${planVariables[name]} with a Sandbox plan ID.`)
  return { id, name, amount: plan.price.slice(1), interval: plan.period === 'Yearly' ? 'YEAR' : 'MONTH' }
}

export function validatePlan(actual, expected) {
  const cycles = actual.billing_cycles
  const cycle = cycles?.[0]
  const price = cycle?.pricing_scheme?.fixed_price
  const setupFee = actual.payment_preferences?.setup_fee
  const tax = actual.taxes
  if (actual.id !== expected.id || actual.status !== 'ACTIVE' || cycles?.length !== 1 ||
      cycle.tenure_type !== 'REGULAR' || cycle.total_cycles !== 0 ||
      cycle.frequency?.interval_unit !== expected.interval || cycle.frequency?.interval_count !== 1 ||
      price?.currency_code !== 'USD' || Number(price.value) !== Number(expected.amount) ||
      (setupFee && Number(setupFee.value) !== 0) || (tax && Number(tax.percentage) !== 0)) {
    throw new SandboxError(`The PayPal Sandbox plan for ${expected.name} does not match the advertised price and billing period.`)
  }
}

async function paypalRequest(path, token, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  })
  if (!response.ok) throw new SandboxError(`PayPal Sandbox request failed (HTTP ${response.status}).`)
  return response.json()
}

async function accessToken(config, fetchImpl) {
  const response = await fetchImpl(`${API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!response.ok) throw new SandboxError(`PayPal Sandbox authentication failed (HTTP ${response.status}).`)
  const payload = await response.json()
  if (!payload.access_token) throw new SandboxError('PayPal Sandbox did not return an access token.')
  return payload.access_token
}

export async function createSandboxSubscription({ name, userId, env = process.env, fetchImpl = fetch }) {
  const config = sandboxConfig(env)
  const expected = expectedPlan(name, env)
  const token = await accessToken(config, fetchImpl)
  const plan = await paypalRequest(`/v1/billing/plans/${expected.id}`, token, {}, fetchImpl)
  validatePlan(plan, expected)
  const subscription = await paypalRequest('/v1/billing/subscriptions', token, {
    method: 'POST',
    body: JSON.stringify({
      plan_id: expected.id,
      custom_id: userId,
      application_context: {
        brand_name: 'Kno U Kno Sandbox',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${config.origin}/sandbox-checkout`,
        cancel_url: `${config.origin}/sandbox-checkout?cancelled=1`,
      },
    }),
  }, fetchImpl)
  const approval = subscription.links?.find((link) => link.rel === 'approve')?.href
  let url
  try {
    url = new URL(approval)
  } catch {
    throw new SandboxError('PayPal Sandbox did not return a valid approval link.')
  }
  if (url.protocol !== 'https:' || !['www.sandbox.paypal.com', 'sandbox.paypal.com'].includes(url.hostname) || url.username || url.password || url.port) {
    throw new SandboxError('PayPal Sandbox returned an unexpected approval link.')
  }
  return { approvalUrl: url.href }
}

export async function getSandboxSubscription({ subscriptionId, userId, env = process.env, fetchImpl = fetch }) {
  const config = sandboxConfig(env)
  if (typeof subscriptionId !== 'string' || !/^I-[A-Za-z0-9]+$/.test(subscriptionId)) {
    throw new SandboxError('Invalid PayPal subscription ID.')
  }
  const token = await accessToken(config, fetchImpl)
  const subscription = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`, token, {}, fetchImpl)
  if (subscription.id !== subscriptionId || subscription.custom_id !== userId) throw new SandboxError('Subscription not found for this account.')
  return { status: subscription.status, id: subscription.id }
}
