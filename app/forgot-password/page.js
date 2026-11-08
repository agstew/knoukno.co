'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ isSubmitted: false, message: '', error: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ isSubmitted: false, message: '', error: '' })

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send reset link.')
      }

      setStatus({
        isSubmitted: true,
        message: payload.message || 'If an account exists, a reset link has been sent.',
        error: '',
      })
    } catch (submitError) {
      setStatus({
        isSubmitted: false,
        message: '',
        error: submitError.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header">
        <div className="brand-wordmark-card" aria-label="Kno U Kno brand">
          <span>Kno U Kno</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <main className="auth-wrap">
        <section className="auth-card">
          <div className="auth-brand-icon" aria-label="Kno U Kno brand mark">
            <img src="/brand/logo-mark.svg" alt="Kno U Kno brand mark" />
          </div>
          <p className="eyebrow">Reset password</p>
          <h1>Forgot your password?</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            {status.error ? <p className="form-message error-message">{status.error}</p> : null}
            {status.isSubmitted ? (
              <p className="form-message success-message">{status.message}</p>
            ) : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="auth-switch">
            Back to <Link href="/login">Login</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
