import Link from 'next/link'
import { navItems, businessCards, pricePlans, aiQuestions, aiExamples, clientAnswers } from '../lib/site-data'

const questionPageSize = 5
const examplePageSize = 5
const answerPageSize = 5

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )
}

export default function HomePage() {
  const questions = chunk(aiQuestions, questionPageSize)
  const examples = chunk(aiExamples, examplePageSize)
  const answers = chunk(clientAnswers, answerPageSize)

  return (
    <div className="page-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark-wrap brand-home-lockup" aria-label="Kno U Kno home">
          <img src="/brand/logo-mark.svg" alt="Kno U Kno logo mark" className="brand-mini-icon" />
          <span className="brand-mini-wordmark">Kno U Kno</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <section id="home" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Business learning platform</p>
            <h1>Start, manage, and grow a business with practical learning.</h1>
            <p className="lead">
              Kno U Kno helps entrepreneurs learn how to start a business, manage day-to-day operations,
              and make money with a smart, disciplined system. The platform uses AI-generated prompts,
              examples, dashboards, and scoring tools to help people learn, plan, and improve business decisions.
            </p>
            <div className="cta-row">
              <Link href="/register" className="primary-button">
                Register now
              </Link>
              <Link href="#price" className="secondary-button">
                View pricing
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-label="Business categories">
            <div className="brand-hero-card">
              <img src="/brand/home-logo.png" alt="Kno U Kno logo" className="hero-logo-mark" width="629" height="699" />
            </div>
            {businessCards.map((card) => (
              <div key={card} className="hero-badge">
                {card}
              </div>
            ))}
          </div>
        </section>

        <section className="trust-strip" aria-label="Platform highlights">
          <div>
            <strong>3,000+</strong>
            <span>business prompts</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>decision support</span>
          </div>
          <div>
            <strong>5-step</strong>
            <span>growth system</span>
          </div>
          <div>
            <strong>AI guided</strong>
            <span>business learning</span>
          </div>
        </section>

        <section className="image-strip" aria-label="Business images">
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80" alt="Business strategy" />
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80" alt="Startup team planning" />
          <img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80" alt="Investor meeting" />
          <img src="https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80" alt="Business dashboard" />
        </section>

        <section className="feature-grid">
          <article className="info-card feature-tall">
            <p className="eyebrow">Learning</p>
            <h3>AI business prompts</h3>
            <p>Practice real-world decision making with questions designed to build operational clarity.</p>
          </article>
          <article className="info-card feature-tall">
            <p className="eyebrow">Systems</p>
            <h3>Daily business habit tracking</h3>
            <p>Use dashboards, scoring, rates, and summaries to keep your business momentum consistent.</p>
          </article>
          <article className="info-card feature-tall">
            <p className="eyebrow">Growth</p>
            <h3>Build with confidence</h3>
            <p>Track outputs, compare decisions, and create a sharper path to sustainable business growth.</p>
          </article>
        </section>

        <section className="workflow-section">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Learn the system behind startup growth.</h2>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step">
              <span>01</span>
              <h3>Answer</h3>
              <p>Work through prompts about pricing, cash flow, operations, and market positioning.</p>
            </div>
            <div className="workflow-step">
              <span>02</span>
              <h3>Review</h3>
              <p>See how your thinking compares against practical examples and real-world strategies.</p>
            </div>
            <div className="workflow-step">
              <span>03</span>
              <h3>Improve</h3>
              <p>Track grades, ratings, and averages to strengthen your business decisions over time.</p>
            </div>
          </div>
        </section>

        <section id="price" className="pricing-section">
          <div className="section-heading center-heading">
            <p className="eyebrow">Planned pricing</p>
            <h2>Choose the tier that matches your business learning pace.</h2>
            <p>These plans are not yet available for purchase. Question limits apply to the entire subscription, not each billing period.</p>
          </div>

          <div className="pricing-grid">
            {pricePlans.map((plan) => (
              <article key={plan.name} className={`price-card ${plan.highlight ? 'highlight' : ''}`}>
                <div className="price-header">
                  <span className="plan-badge">{plan.period}</span>
                  <h3>{plan.name}</h3>
                </div>

                <div className="price-line">
                  <strong>{plan.price}</strong>
                </div>

                <p className="question-caption">{plan.questions}</p>

                <ul className="feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <p className="discount">{plan.discount}</p>
              </article>
            ))}
          </div>

          <div className="bonus-banner">Paid plans will include daily learning emails for up to two years while the subscription is active.</div>
        </section>

        <section className="panel-grid">
          <div className="sub-panel">
            <div className="panel-head">
              <p className="eyebrow">AI questions</p>
              <h3>Business growth prompts</h3>
            </div>
            <div className="qa-list">
              {questions[0]?.map((question) => (
                <div key={question} className="qa-item">
                  <p>{question}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sub-panel">
            <div className="panel-head">
              <p className="eyebrow">Examples</p>
              <h3>Real business scenarios</h3>
            </div>
            <div className="qa-list">
              {examples[0]?.map((example) => (
                <div key={example} className="qa-item">
                  <p>{example}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sub-panel">
            <div className="panel-head">
              <p className="eyebrow">Client answers</p>
              <h3>Owner thought patterns</h3>
            </div>
            <div className="qa-list">
              {answers[0]?.map((answer) => (
                <div key={answer} className="qa-item">
                  <p>{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="metric-card">
            <p className="eyebrow">Grade</p>
            <h3>Business score tracker</h3>
            <p>Monitor how well a business idea, cash flow, and decision quality are developing.</p>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Rated</p>
            <h3>Performance rating</h3>
            <p>Rate clarity, usefulness, and action steps so users can focus on high-value growth habits.</p>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Average</p>
            <h3>Average progress</h3>
            <p>Understand the average business performance progression over time.</p>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 knoukno.co</p>
      </footer>
    </div>
  )
}
