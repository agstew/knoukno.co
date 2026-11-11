'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authDestination, authLink, registerUser } from '../../lib/auth-client'
import SiteNav from '../site-nav'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginLink, setLoginLink] = useState('/login')

  useEffect(() => {
    setLoginLink(authLink('/login', window.location.search))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await registerUser(form)
      router.push(authDestination(window.location.search))
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
        <SiteNav loginHref={loginLink} />
      </header>

      <main className="auth-wrap">
        <section className="auth-card">
          <div className="auth-brand-icon" aria-label="Kno U Kno brand mark">
            <img src="/brand/logo-mark.svg" alt="Kno U Kno brand mark" />
          </div>
          <p className="eyebrow">Register</p>
          <h1>Create your account</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
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
                minLength={6}
                required
              />
            </label>

            {error ? <p className="form-message error-message">{error}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href={loginLink}>Login</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
