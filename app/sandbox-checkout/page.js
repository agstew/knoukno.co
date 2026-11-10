'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '../../lib/auth-client'
import { pricePlans } from '../../lib/site-data'

export default function SandboxCheckoutPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function request(body) {
    const token = getSession()?.token
    if (!token) throw new Error('Sign in before using the sandbox checkout.')
    const response = await fetch('/api/paypal/sandbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Sandbox checkout failed.')
    return result
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subscriptionId = params.get('subscription_id')
    if (params.has('cancelled')) setMessage('Sandbox checkout was cancelled.')
    if (subscriptionId) {
      request({ action: 'status', subscriptionId })
        .then((result) => setMessage(`Sandbox subscription ${result.id} status: ${result.status}. No paid access has been enabled.`))
        .catch((requestError) => setError(requestError.message))
    }
  }, [])

  async function start(plan) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { approvalUrl } = await request({ action: 'create', plan })
      window.location.assign(approvalUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header"><Link href="/" className="brand-mark-wrap">Kno U Kno</Link></header>
      <main className="business-workflow">
        <section className="business-card">
          <h1>PayPal Sandbox checkout</h1>
          <p>Local testing only. No real payment or paid access is enabled. Sign in with a local account, then use a PayPal Sandbox buyer account.</p>
          {error && <p className="business-message business-error" role="alert">{error}</p>}
          {message && <p className="business-message" role="status">{message}</p>}
          <ul className="business-list">
            {pricePlans.filter((plan) => plan.name !== 'Free').map((plan) => (
              <li key={plan.name}>
                {plan.name}: {plan.price} / {plan.period.toLowerCase()}{' '}
                <button type="button" disabled={busy} onClick={() => start(plan.name)}>Test with PayPal</button>
              </li>
            ))}
          </ul>
          <Link href="/login">Sign in</Link>
        </section>
      </main>
    </div>
  )
}
