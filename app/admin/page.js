'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clearSession, fetchCurrentUser, getSession } from '../../lib/auth-client'
import { adminEmails, adminSummary, aiQuestions } from '../../lib/site-data'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const handleLogout = () => {
    clearSession()
    router.replace('/login')
  }

  if (loading || !user) {
    return null
  }

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark-wrap" aria-label="Kno U Kno home">
          <img src="/brand/logo-lockup.svg" alt="Kno U Kno" className="brand-lockup-image" />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
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
            <button type="button">Generate question set</button>
            <button type="button">Print summary</button>
            <button type="button">Save all</button>
            <button type="button">Delete</button>
          </div>
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
            <h2>AI-generated business questions</h2>
            <ul>
              {aiQuestions.slice(0, 15).map((question, index) => (
                <li key={question}>
                  <span>{index + 1}.</span> {question}
                </li>
              ))}
            </ul>
          </section>
        </section>
      </main>
    </div>
  )
}
