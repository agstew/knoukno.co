import { useMemo, useState } from 'react'
import './App.css'
import { Title } from './components/Title'
import { List } from './components/List'
import { Dashboard } from './components/Dashboard'
import { Questions } from './components/Questions'
import { Example } from './components/Example'
import { Answers } from './components/Answers'
import { Grade } from './components/Grade'
import { GradeList } from './components/GradeList'
import { Rated } from './components/Rated'
import { RatedList } from './components/RatedList'
import { Average } from './components/Average'
import { Print } from './components/Print'
import { Delete } from './components/Delete'
import { Admin } from './components/Admin'
import {
  aiQuestions,
  aiExamples,
  clientAnswers,
  pricePlans,
  businessCards,
  gradeList,
  ratedList,
  adminSummary,
  adminEmails,
} from './data/siteData'

const questionPageSize = 5
const examplePageSize = 5
const answerPageSize = 5

function App() {
  const [questionPage, setQuestionPage] = useState(1)
  const [examplePage, setExamplePage] = useState(1)
  const [answerPage, setAnswerPage] = useState(1)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ fullName: '', email: '', password: '' })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')

  const handleLoginChange = (field) => (event) => {
    setLoginData((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleRegisterChange = (field) => (event) => {
    setRegisterData((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleLoginSubmit = (event) => {
    event.preventDefault()
    if (!loginData.email || !loginData.password) {
      setLoginMessage('Please enter your email and password.')
      return
    }
    setLoginMessage(`Login ready for ${loginData.email}.`)
  }

  const handleRegisterSubmit = (event) => {
    event.preventDefault()
    if (!registerData.fullName || !registerData.email || !registerData.password) {
      setRegisterMessage('Please fill in all the fields before registering.')
      return
    }
    setRegisterMessage(`Registration ready for ${registerData.email}.`)
  }

  const questionPages = useMemo(
    () =>
      Array.from({ length: Math.ceil(aiQuestions.length / questionPageSize) }, (_, index) =>
        aiQuestions.slice(index * questionPageSize, (index + 1) * questionPageSize),
      ),
    [],
  )

  const examplePages = useMemo(
    () =>
      Array.from({ length: Math.ceil(aiExamples.length / examplePageSize) }, (_, index) =>
        aiExamples.slice(index * examplePageSize, (index + 1) * examplePageSize),
      ),
    [],
  )

  const answerPages = useMemo(
    () =>
      Array.from({ length: Math.ceil(clientAnswers.length / answerPageSize) }, (_, index) =>
        clientAnswers.slice(index * answerPageSize, (index + 1) * answerPageSize),
      ),
    [],
  )

  const visibleQuestions = questionPages[questionPage - 1] ?? []
  const visibleExamples = examplePages[examplePage - 1] ?? []
  const visibleAnswers = answerPages[answerPage - 1] ?? []

  return (
    <div className="app-shell">
      <Title />

      <main className="page-shell">
        <section id="home" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Business learning platform</p>
            <h1>Start, manage, and grow a business with practical learning.</h1>
            <p className="lead">
              Kno U Kno helps entrepreneurs learn how to start a business, manage day-to-day operations,
              and make money with a smart, disciplined system. The platform uses AI-generated prompts,
              examples, dashboards, and scoring tools to help people learn, plan, and improve their business decisions.
            </p>

            <div className="cta-row">
              <a href="#register" className="primary-button">
                Register now
              </a>
              <a href="#price" className="secondary-button">
                View pricing
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Business categories">
            {businessCards.map((card) => (
              <div key={card} className="hero-badge">
                {card}
              </div>
            ))}
          </div>
        </section>

        <List />

        <section id="price" className="pricing-section">
          <div className="section-heading center-heading">
            <p className="eyebrow">Pricing</p>
            <h2>Choose the tier that matches your business learning pace.</h2>
          </div>

          <div className="pricing-grid">
            {pricePlans.map((plan) => (
              <article key={plan.name} className={`price-card ${plan.highlight ? 'highlight' : ''}`}>
                <div className="price-header">
                  <span className="plan-badge">{plan.period}</span>
                  <h3>{plan.name}</h3>
                </div>

                <div className="price-line">
                  <span className="old-price">{plan.original}</span>
                  <strong>{plan.price}</strong>
                </div>

                <p className="question-caption">{plan.questions}</p>

                <ul className="feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                {plan.discount ? <p className="discount">{plan.discount}</p> : <p className="discount">Free trial</p>}
              </article>
            ))}
          </div>

          <div className="bonus-banner">
            Bonus: 100 questions for $100.00 if you buy now.
          </div>
        </section>

        <Dashboard />

        <section className="panel-grid">
          <Questions
            items={visibleQuestions}
            page={questionPage}
            totalPages={questionPages.length}
            onPrev={() => setQuestionPage((page) => Math.max(page - 1, 1))}
            onNext={() => setQuestionPage((page) => Math.min(page + 1, questionPages.length))}
          />

          <Example
            items={visibleExamples}
            page={examplePage}
            totalPages={examplePages.length}
            onPrev={() => setExamplePage((page) => Math.max(page - 1, 1))}
            onNext={() => setExamplePage((page) => Math.min(page + 1, examplePages.length))}
          />

          <Answers
            items={visibleAnswers}
            page={answerPage}
            totalPages={answerPages.length}
            onPrev={() => setAnswerPage((page) => Math.max(page - 1, 1))}
            onNext={() => setAnswerPage((page) => Math.min(page + 1, answerPages.length))}
          />
        </section>

        <section className="stats-grid">
          <Grade />
          <GradeList items={gradeList} />
          <Rated />
          <RatedList items={ratedList} />
          <Average />
          <Print />
          <Delete />
        </section>

        <section className="admin-summary-wrap">
          <div className="admin-summary-card">
            <p className="eyebrow">Admin content</p>
            <h3>{adminSummary.title}</h3>
            <p>{adminSummary.description}</p>
            <ul>
              {adminEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          </div>
        </section>

        <Admin />

        <section id="login" className="auth-panel">
          <div className="auth-card">
            <div>
              <p className="eyebrow">Login</p>
              <h2>Access your dashboard and saved business learning.</h2>
            </div>

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={loginData.email}
                  onChange={handleLoginChange('email')}
                />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange('password')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowLoginPassword((current) => !current)}
                  >
                    {showLoginPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>
              <button type="submit">Go to dashboard</button>
              {loginMessage ? <span className="form-message">{loginMessage}</span> : null}
            </form>
          </div>
        </section>

        <section id="register" className="auth-panel">
          <div className="auth-card">
            <div>
              <p className="eyebrow">Register</p>
              <h2>Create a business learning account and start building smarter habits.</h2>
            </div>

            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Your name"
                  value={registerData.fullName}
                  onChange={handleRegisterChange('fullName')}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={handleRegisterChange('email')}
                />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={handleRegisterChange('password')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowRegisterPassword((current) => !current)}
                  >
                    {showRegisterPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>
              <button type="submit">Create account</button>
              {registerMessage ? <span className="form-message">{registerMessage}</span> : null}
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 knoukno.co</p>
      </footer>
    </div>
  )
}

export default App
