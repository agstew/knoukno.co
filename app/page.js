import Link from 'next/link'
import { navItems, pricePlans, aiQuestions, aiExamples, clientAnswers } from '../lib/site-data'
import styles from './home.module.scss'

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
    <div className={`page-shell ${styles.home}`}>
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
              and make decisions with a thoughtful, disciplined plan. Explore prepared questions,
              examples, dashboards, and scoring tools to develop your own business ideas.
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

          <div className="hero-visual">
            <img className={styles.heroImage} src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80" alt="Business owners planning together around a table" />
            <div className={styles.heroNote}>
              <span>YOUR BUSINESS JOURNEY</span>
              <strong>Plan with purpose.<br />Grow with confidence.</strong>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Platform highlights">
          <div>
            <strong>20</strong>
            <span>sample questions</span>
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
            <strong>Self guided</strong>
            <span>business learning</span>
          </div>
        </section>

        <section className="feature-grid">
          <article className="info-card feature-tall">
            <p className="eyebrow">Learning</p>
            <h3>Business prompts</h3>
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

        <section className="business-introduction" aria-labelledby="business-introduction-title">
          <div className="section-heading">
            <p className="eyebrow">Your business journey</p>
            <h2 id="business-introduction-title">From the first idea to a working business</h2>
          </div>
          <div className="business-introduction-copy">
            <h3>Start with a clear idea</h3>
            <p>
              Starting a business means turning an idea into a service or product that people value.
              Kno U Kno gives you a place to think through the decisions involved, from your first
              questions to the work of serving customers. Begin by describing what you want to offer,
              who may need it, and why they would choose it. Consider what you know already and what
              you still need to learn. A clear purpose gives your research direction, but it does not
              need to be perfect. As you gather information, you can revisit your answers and make
              your plan more specific.
            </p>
            <h3>Understand the legal foundations</h3>
            <p>
              Before opening, investigate the rules that apply to your business and where you intend
              to operate. Your business structure, registration, licenses, taxes, insurance, and record
              keeping may all affect what you need to do. Requirements vary by location and industry,
              so identify the agencies and qualified professionals who can help you confirm them.
              Think about contracts, safety, privacy, and the responsibilities you may have to customers
              and workers. Make a list of the decisions, deadlines, and costs you discover. The questions
              on this site are learning prompts, not legal, tax, or financial advice.
            </p>
            <h3>Research your customers and market</h3>
            <p>
              A useful idea solves a problem for real people. Define the customers you hope to reach
              and consider what they need, how they currently meet that need, and what matters most
              when they decide to buy. Study similar businesses and look for gaps you can address.
              Talk with potential customers, observe their habits, and test your assumptions on a small
              scale before committing substantial resources. Separate what people say they want from
              what they are willing to pay for. Record your findings and use them to refine your offer,
              rather than relying only on enthusiasm for the idea.
            </p>
            <h3>Choose a location that fits</h3>
            <p>
              Your location can influence who finds you, how you operate, and what it costs to serve
              customers. A business might need a storefront, a home workspace, a shared facility, an
              online presence, or a combination of these. Compare possible locations by accessibility,
              visibility, customer demand, safety, space, transport, and ongoing expenses. Check zoning,
              permits, lease terms, and any restrictions before making commitments. Consider whether
              suppliers and employees can reach the location and whether it can support future changes.
              The best choice is not always the busiest or least expensive; it is the one that fits
              your customers and business model.
            </p>
            <h3>Plan the money and daily work</h3>
            <p>
              A business needs a practical way to earn enough to cover its costs and keep operating.
              Estimate startup expenses, ongoing bills, inventory, equipment, and the time needed to
              deliver your offer. Set a price that accounts for costs, customer value, and the market.
              Think about cash flow as well as profit: money may leave your account before customers
              pay you. Plan how you will track income, expenses, and important records, and prepare
              for unexpected costs. Then describe the everyday steps needed to deliver consistently,
              from receiving an order to following up after the sale.
            </p>
            <h3>Build the right team</h3>
            <p>
              As your business grows, decide which work you can do yourself and where you need help.
              Define the responsibilities, skills, availability, and experience each role requires.
              Consider whether you need employees, professional advisers, or outside service providers,
              and investigate the legal obligations that apply to each arrangement. Plan how you will
              recruit fairly, train people, communicate expectations, and provide the tools they need.
              Hiring is more than filling a position: the people you work with influence customer
              experience, reliability, and the culture of your business. Review roles as the work changes.
            </p>
            <h3>Serve people and improve</h3>
            <p>
              Customers are more than a number in a sales report. Consider how people first hear about
              your business, what makes them comfortable choosing you, and what happens when they need
              help. Clear information, respectful service, reliable delivery, and a thoughtful response
              to problems can help build trust. Ask for feedback and look for patterns without assuming
              every customer wants the same thing. Track the measures that matter to your goals, such
              as repeat visits, costs, or satisfaction. Use what you learn to improve the offer and
              the systems behind it, while keeping your promises realistic.
            </p>
            <h3>Work through the questions</h3>
            <p>
              Use the business dashboard to save a title and work through prepared questions one at a
              time. Examples illustrate a question in another way; your answer should reflect your own
              business, research, and judgment. Save each answer so you can return to it later, then
              assign a grade on the Grade page. You can review your total and average or reorder your
              answers by importance. The current set is a starting point rather than a complete course.
              Revisit your decisions as you learn,
              and seek professional guidance when your situation calls for it.
            </p>
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
                  {plan.firstPayment && <span className={styles.paymentDetail}>First payment </span>}
                  <strong className={plan.firstPayment ? styles.paymentDetail : undefined}>{plan.firstPayment || plan.price}</strong>
                </div>
                {plan.firstPayment
                  ? <p className={styles.paymentDetail}>Includes {plan.setupFee} one-time bonus charge; then {plan.price} per month.</p>
                  : plan.setupFee && <p className={styles.paymentDetail}>Plus {plan.setupFee} one-time bonus charge</p>}

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
              <p className="eyebrow">Sample questions</p>
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
        <a href="https://isitdown.now/">
          <img
            src="https://isitdown.now/badge/monitor/92b0c58b8ff613e5.svg"
            alt="Uptime monitored by IsItDown.now"
            width="160"
            height="28"
          />
        </a>
      </footer>
    </div>
  )
}
