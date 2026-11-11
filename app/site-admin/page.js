'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearSession, getSession } from '../../lib/auth-client'
import SiteNav from '../site-nav'

export default function SiteAdminPage() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    const session = getSession()
    const token = session?.token
    if (!token) {
      setError('Sign in with the configured site administrator account.')
      setLoading(false)
      return
    }
    setAccountId(session.user?.id || '')
    const controller = new AbortController()
    fetch('/api/site-admin', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (response.status === 401) clearSession()
        if (!response.ok) throw new Error(result.error || 'Unable to load site administration.')
        setOverview(result)
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return <div className="page-shell narrow-shell">
    <header className="site-header"><Link href="/" className="brand-mark-wrap">Kno U Kno</Link><SiteNav /></header>
    <main className="business-workflow">
      <section className="business-card">
        <h1>Site administration</h1>
        {loading && <p>Loading site overview...</p>}
        {error && <><p role="alert">{error}</p><Link href="/login">Sign in</Link></>}
        {accountId && <p>Your signed-in account ID: <code>{accountId}</code></p>}
        {overview && <>
          <h2>Site overview</h2>
          <p>Registered accounts: {overview.counts.users}</p>
          <p>Business titles: {overview.counts.businesses}</p>
          <p>Free trials started: {overview.counts.trials}</p>
          <h2>Service configuration</h2>
          <p>These indicators only show whether required variables are present; they do not verify that a service works.</p>
          <ul>
            <li>PayPal: {overview.configuration.paypal ? 'Configured' : 'Missing settings'}</li>
            <li>Resend: {overview.configuration.resend ? 'Configured' : 'Missing settings'}</li>
            <li>AI provider: {overview.configuration.ai ? 'Configured' : 'Missing settings'}</li>
          </ul>
          <p>Paid checkout, campaign emails, and AI question generation are not yet available.</p>
        </>}
      </section>
    </main>
  </div>
}
