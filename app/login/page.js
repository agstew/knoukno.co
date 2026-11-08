'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginUser } from '../../lib/auth-client'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await loginUser(form)
      router.push('/admin')
    } catch (submitError) {
      setError(submitError.message)
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
          <Link href="/register">Register</Link>
        </nav>
      </header>

      <main className="auth-wrap">
        <section className="auth-card">
          <div className="auth-brand-icon" aria-label="Kno U Kno brand mark">
            <img src="/brand/logo-mark.svg" alt="Kno U Kno brand mark" />
          </div>
          <p className="eyebrow">Login</p>
          <h1>Access your business dashboard</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <p className="form-message error-message">{error}</p> : null}

            <div className="auth-actions-row">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Go to dashboard'}
              </button>
              <Link href="/forgot-password" className="text-link">Forgot my password?</Link>
            </div>
          </form>

          <p className="auth-switch">
            Need an account? <Link href="/register">Create one</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
