'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearSession, getSession } from '../../lib/auth-client'
import SiteNav from '../site-nav'

export default function FreeTrialPage() {
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [trial, setTrial] = useState(null)
  const [title, setTitle] = useState('')
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function request(method, body) {
    const token = getSession()?.token
    if (!token) throw new Error('Please sign in again.')
    const response = await fetch('/api/free-trial', {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    })
    const payload = await response.json()
    if (response.status === 401) {
      clearSession()
      setSignedIn(false)
    }
    if (!response.ok) {
      if (response.status === 403 && method === 'PATCH') {
        setTrial((current) => current && { ...current, active: false })
      }
      throw new Error(payload.error || 'Unable to access your free trial.')
    }
    return payload.trial
  }

  useEffect(() => {
    if (!getSession()?.token) {
      setLoading(false)
      return
    }
    setSignedIn(true)
    request('GET')
      .then(setTrial)
      .catch((err) => { setError(err.message); setLoadFailed(true) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setAnswer(trial?.answers?.[index] || '')
  }, [trial, index])

  async function start(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('POST', { title })
      setTrial(result)
      setNotice(result.active ? 'Your trial is ready. Save each answer before changing questions.' : 'Your trial has already ended.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      setTrial(await request('PATCH', { index, text: answer }))
      setNotice('Answer saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="page-shell narrow-shell">
    <header className="site-header business-site-header"><Link href="/" className="brand-mark-wrap">Kno U Kno</Link><SiteNav beforeLeave={() => !trial || answer === (trial.answers?.[index] || '') || window.confirm('You have an unsaved answer. Leave without saving?')} /></header>
    <main className="business-workflow">
      <section className="business-card">
        <h1>Free three-day trial</h1>
        {loading ? <p>Loading your trial...</p> : !signedIn ? <>
          <p>Register or sign in to start your one-time trial of five prepared questions and examples.</p>
          <p><Link href="/register?next=trial">Register</Link> or <Link href="/login?next=trial">sign in</Link></p>
        </> : loadFailed ? <p>Reload the page to try again.</p> : !trial ? <>
          <p>Starting your trial gives you three days to answer five prepared questions. You can start it once per account.</p>
          <form className="business-form" onSubmit={start}>
            <label htmlFor="trial-title">Business title</label>
            <input id="trial-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
            <button type="submit" disabled={busy}>Start free trial</button>
          </form>
        </> : <>
          <h2>{trial.title}</h2>
          <p>Trial ends: {new Date(trial.expiresAt).toLocaleString()}. {trial.active ? 'Save your answers before it ends.' : 'Your trial has ended; saved answers remain available to view and print.'}</p>
          <p>Question {index + 1} of 5</p>
          <h3>{trial.questions[index].question}</h3>
          <p>{trial.questions[index].example}</p>
          <form className="business-form" onSubmit={save}>
            <label htmlFor="trial-answer">Your answer</label>
            <textarea id="trial-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={10000} rows={5} disabled={!trial.active} required />
            <button type="submit" disabled={busy || !trial.active}>Save answer</button>
          </form>
          <nav className="business-pagination" aria-label="Trial question pagination">
            {trial.questions.map((question, itemIndex) => <button key={itemIndex} type="button" disabled={busy} aria-current={index === itemIndex ? 'page' : undefined} onClick={() => { setIndex(itemIndex); setNotice('') }}>{itemIndex + 1}</button>)}
          </nav>
          <p>Save your answer before changing questions. Print includes all saved answers.</p>
          <button type="button" onClick={() => window.print()}>Print page</button>
        </>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
    {trial && <section className="business-print-report" aria-label="Saved trial answers">
      <h1>{trial.title}</h1>
      <h2>Saved trial answers</h2>
      <ol>{trial.questions.map((question, itemIndex) => <li key={itemIndex}>
        <h3>{question.question}</h3>
        <p>{question.example}</p>
        <p className="business-print-answer">{trial.answers?.[itemIndex] || 'No saved answer.'}</p>
      </li>)}</ol>
    </section>}
  </div>
}
