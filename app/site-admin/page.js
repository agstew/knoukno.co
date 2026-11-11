'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearSession, getSession } from '../../lib/auth-client'
import SiteNav from '../site-nav'
import { recordCategories } from '../../lib/admin-records'

export default function SiteAdminPage() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState('')
  const [businesses, setBusinesses] = useState([])
  const [sets, setSets] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [questionsError, setQuestionsError] = useState('')
  const [busy, setBusy] = useState(false)
  const [records, setRecords] = useState(null)
  const [recordsError, setRecordsError] = useState('')
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordCategory, setRecordCategory] = useState('')

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

  useEffect(() => {
    if (!overview) return
    const controller = new AbortController()
    fetch('/api/site-admin/questions', {
      headers: { Authorization: `Bearer ${getSession()?.token}` },
      cache: 'no-store',
      signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load question sets.')
      setBusinesses(data.businesses)
      setSets(data.sets)
    }).catch((err) => { if (err.name !== 'AbortError') setQuestionsError(err.message) })
    return () => controller.abort()
  }, [overview])

  async function generateQuestions(event) {
    event.preventDefault()
    if (!businessId || !window.confirm('Generate 300 AI questions for this business? The AI provider may charge for this request.')) return
    setBusy(true)
    setQuestionsError('')
    try {
      const response = await fetch('/api/site-admin/questions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getSession()?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate questions.')
      setSets((current) => [...current.filter((set) => set.businessId !== businessId), data])
    } catch (err) {
      setQuestionsError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function loadRecords(category) {
    setRecordCategory(category)
    setRecords(null)
    setRecordsError('')
    setRecordsLoading(true)
    try {
      const response = await fetch(`/api/site-admin/records?category=${encodeURIComponent(category)}`, {
        headers: { Authorization: `Bearer ${getSession()?.token}` },
        cache: 'no-store',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load records.')
      setRecords(result)
    } catch (err) {
      setRecordsError(err.message)
    } finally {
      setRecordsLoading(false)
    }
  }

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
          <h2>MongoDB records</h2>
          <p>Choose a category to inspect existing records. Some actions do not yet have stored records.</p>
          <nav aria-label="Administrator record categories">
            {recordCategories.map(([key, label]) => <button key={key} type="button" disabled={recordsLoading} onClick={() => loadRecords(key)}>{label}</button>)}
          </nav>
          {recordCategory && <section aria-live="polite">
            <h3>{recordCategories.find(([key]) => key === recordCategory)?.[1]}</h3>
            {recordsLoading && <p>Loading records...</p>}
            {recordsError && <p role="alert">{recordsError}</p>}
            {records && <><p>{records.note}</p>{records.records.length ? <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(records.records, null, 2)}</pre> : <p>No records available.</p>}</>}
          </section>}
          <h2>Service configuration</h2>
          <p>These indicators only show whether required variables are present; they do not verify that a service works.</p>
          <ul>
            <li>PayPal: {overview.configuration.paypal ? 'Configured' : 'Missing settings'}</li>
            <li>Resend: {overview.configuration.resend ? 'Configured' : 'Missing settings'}</li>
            <li>AI provider: {overview.configuration.ai ? 'Configured' : 'Missing settings'}</li>
          </ul>
          <p>Paid checkout and campaign emails are not yet available.</p>
          <h2>AI questions for admin review</h2>
          <p>Generate one set of 300 short, general business questions per business. Sets are for administrator review only; customers cannot access them yet. Provider charges may apply. Showing up to 50 recent business titles.</p>
          <form className="business-form" onSubmit={generateQuestions}>
            <label htmlFor="admin-business">Business title</label>
            <select id="admin-business" value={businessId} onChange={(event) => setBusinessId(event.target.value)} required>
              <option value="">Select a business</option>
              {businesses.map((business) => <option key={business.id} value={business.id}>{business.title}</option>)}
            </select>
            <button type="submit" disabled={busy || !businessId || sets.some((set) => set.businessId === businessId)}>
              {busy ? 'Generating questions...' : 'Generate 300 questions'}
            </button>
          </form>
          {questionsError && <p role="alert">{questionsError}</p>}
          {businessId && sets.filter((set) => set.businessId === businessId).map((set) =>
            <section key={set.businessId}>
              <h3>Questions for review ({set.questions.length})</h3>
              <ol>{set.questions.map((question, index) => <li key={index}>{question}</li>)}</ol>
            </section>)}
        </>}
      </section>
    </main>
  </div>
}
