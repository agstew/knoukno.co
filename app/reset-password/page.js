'use client'

import Link from 'next/link'
import { useState } from 'react'
import SiteNav from '../site-nav'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('This reset link is invalid. Please request a new one.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to reset password.')
      window.history.replaceState(null, '', '/reset-password')
      setPassword('')
      setConfirmation('')
      setMessage(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header">
        <Link href="/" className="brand-wordmark-card">Kno U Kno</Link>
        <SiteNav />
      </header>
      <main className="auth-wrap">
        <section className="auth-card">
          <p className="eyebrow">Reset password</p>
          <h1>Choose a new password</h1>
          {message ? <p className="form-message success-message">{message} <Link href="/login">Login</Link></p> : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>New password<input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label>Confirm password<input type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
              {error ? <p className="form-message error-message">{error}</p> : null}
              <button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update password'}</button>
            </form>
          )}
          <p className="auth-switch"><Link href="/forgot-password">Request a new reset link</Link></p>
        </section>
      </main>
    </div>
  )
}