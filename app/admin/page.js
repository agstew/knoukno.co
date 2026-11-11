'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clearSession, fetchCurrentUser, getSession } from '../../lib/auth-client'
import { sampleQuestions } from '../../lib/personal-question-sets'
import { adminEmails, adminSummary, aiQuestions } from '../../lib/site-data'

async function questionSetRequest(options = {}) {
  const token = getSession()?.token
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch('/api/question-sets', {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Unable to access your question sets.')
  return result
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState([])
  const [currentSet, setCurrentSet] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loadingSets, setLoadingSets] = useState(true)
  const [reloadSets, setReloadSets] = useState(0)
  const busy = saving || deleting

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = getSession()
        if (!session?.token) {
          router.replace('/login')
          return
        }

        const currentUser = await fetchCurrentUser()
        if (!currentUser) {
          clearSession()
          router.replace('/login')
          return
        }

        setUser(currentUser)
      } catch {
        clearSession()
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  useEffect(() => {
    if (!user) return
    let active = true
    setLoadingSets(true)
    setLoadError('')
    questionSetRequest()
      .then(({ sets: savedSets }) => {
        if (active) setSets(savedSets)
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingSets(false)
      })
    return () => { active = false }
  }, [user, reloadSets])

  const generateSet = () => {
    if (currentSet && !currentSet.saved && !window.confirm('Replace the unsaved sample set?')) return
    setCurrentSet({ id: crypto.randomUUID(), questions: sampleQuestions(), saved: false })
    setMessage('Sample set created. Select Save all to keep it.')
    setError('')
  }

  const saveSet = async () => {
    if (!currentSet || currentSet.saved || saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { set } = await questionSetRequest({ method: 'POST', body: JSON.stringify({ id: currentSet.id, questions: currentSet.questions }) })
      setCurrentSet({ ...set, saved: true })
      setSets((previous) => [set, ...previous.filter((item) => item.id !== set.id)].slice(0, 50))
      setMessage('Your sample question set was saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const showSavedSet = (set) => {
    if (currentSet && !currentSet.saved && !window.confirm('Discard the unsaved sample set?')) return
    setCurrentSet({ ...set, saved: true })
    setMessage('Showing your saved sample question set.')
    setError('')
  }

  const deleteSet = async () => {
    if (!currentSet || busy || loadingSets) return
    const prompt = currentSet.saved
      ? 'Delete this saved sample set? Your business answers and other sets will not be deleted.'
      : 'Discard this unsaved sample set?'
    if (!window.confirm(prompt)) return
    setDeleting(true)
    setError('')
    setMessage('')
    try {
      if (currentSet.saved) {
        await questionSetRequest({ method: 'DELETE', body: JSON.stringify({ id: currentSet.id }) })
        setSets((previous) => previous.filter((set) => set.id !== currentSet.id))
      }
      setCurrentSet(null)
      setMessage(currentSet.saved ? 'Your selected sample set was deleted.' : 'The unsaved sample set was discarded.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    clearSession()
    router.replace('/login')
  }

  if (loading || !user) {
    return null
  }

  const questions = currentSet?.questions || aiQuestions

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header admin-site-header">
        <Link href="/" className="brand-mark-wrap" aria-label="Kno U Kno home">
          <img src="/brand/logo-lockup.svg" alt="Kno U Kno" className="brand-lockup-image" />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/business">Business titles</Link>
          <Link href="/login">Login</Link>
          <button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="admin-page">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="eyebrow">Admin dashboard</p>
              <h1>AI business content manager</h1>
            </div>
            <span className="status-pill">Live</span>
          </div>

          <p className="lead">Welcome back, {user.fullName}. This dashboard manages question generation, summaries, and email updates.</p>

          <div className="admin-controls">
            <button type="button" disabled={busy || loadingSets} onClick={generateSet}>Generate question set</button>
            <button type="button" onClick={() => window.print()}>Print summary</button>
            <button type="button" disabled={!currentSet || currentSet.saved || busy || loadingSets} onClick={saveSet}>Save all</button>
            <button type="button" disabled={!currentSet || busy || loadingSets} onClick={deleteSet}>Delete</button>
          </div>
          <p>Generate creates a personal set from the 20 existing sample questions, not a paid tier or AI-generated questions. Save all saves this sample set, not your business answers. Delete removes only the selected set. Paid tier question sets are not yet available.</p>
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
          {loadError && <p role="alert">Could not load saved sets: {loadError} <button type="button" disabled={busy} onClick={() => setReloadSets((value) => value + 1)}>Retry</button></p>}
          {sets.length > 0 && (
            <div>
              <h2>Your saved sample sets</h2>
              <p>Showing up to 50 most recent sets.</p>
              <ul>
                {sets.map((set, index) => (
                  <li key={set.id}><button type="button" disabled={busy} onClick={() => showSavedSet(set)}>Open saved set {index + 1}</button></li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <p className="eyebrow">Performance</p>
            <h3>Business readiness</h3>
            <div className="stats-row">
              <strong>94%</strong>
              <span>System health</span>
            </div>
          </article>

          <article className="dashboard-card">
            <p className="eyebrow">Questions</p>
            <h3>Prompt volume</h3>
            <div className="stats-row">
              <strong>1,240</strong>
              <span>Generated this quarter</span>
            </div>
          </article>

          <article className="dashboard-card">
            <p className="eyebrow">Users</p>
            <h3>Member growth</h3>
            <div className="stats-row">
              <strong>318</strong>
              <span>Active learners</span>
            </div>
          </article>
        </section>

        <section className="admin-detail-grid">
          <section className="admin-summary-card">
            <p className="eyebrow">Admin content</p>
            <h3>{adminSummary.title}</h3>
            <p>{adminSummary.description}</p>
            <ul className="admin-email-list">
              {adminEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          </section>

          <section className="question-list-panel">
            <h2>{currentSet ? 'Personal sample question set' : 'Prepared sample questions'}</h2>
            <ul>
              {questions.map((question, index) => (
                <li key={question}>
                  <span>{index + 1}.</span> {question}
                </li>
              ))}
            </ul>
          </section>
        </section>
      </main>
      <section className="admin-print-report" aria-label="Prepared question summary">
        <h1>Prepared business questions</h1>
        <p>{questions.length} sample questions{currentSet && !currentSet.saved ? ' (not saved)' : ''}</p>
        <ol>
          {questions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </section>
    </div>
  )
}
