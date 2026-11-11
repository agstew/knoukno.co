import { inspectLivePlan } from '../lib/paypal-live.js'

try {
  for (const name of ['Member', 'Pro']) {
    const plan = await inspectLivePlan(name)
    console.log(`${plan.name}: active USD $${plan.amount} per ${plan.interval.toLowerCase()}; terms verified.`)
  }
  console.log('Plan verification does not enable checkout or confirm paid access.')
} catch (error) {
  console.error(`Live PayPal plan verification failed: ${error.message}`)
  process.exitCode = 1
}
