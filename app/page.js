import Link from 'next/link'
import { aiQuestions, pricePlans } from '../lib/site-data'
import SiteNav from './site-nav'
import styles from './home.module.scss'

const freePlan = pricePlans.find((plan) => plan.name === 'Free')
const sampleQuestions = aiQuestions.slice(0, 3)

export default function HomePage() {
  return (
    <div className={`page-shell ${styles.home}`}>
      <header className="site-header">
        <Link href="/" className="brand-mark-wrap brand-home-lockup" aria-label="Kno U Kno home">
          <img src="/brand/logo-mark.svg" alt="" className="brand-mini-icon" />
          <span className="brand-mini-wordmark">Kno U Kno</span>
        </Link>
        <SiteNav />
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> A better way to build your business</p>
            <h1>Make your next move a <em>well-informed</em> one.</h1>
            <p className={styles.lead}>
              Turn big business questions into practical next steps. Kno U Kno gives you a clear,
              guided way to think through your idea, plan your work, and keep learning as you grow.
            </p>
            <div className={styles.actions}>
              <Link href="/trial" className={styles.primaryButton}>Start your free trial <span aria-hidden="true">→</span></Link>
              <Link href="#how-it-works" className={styles.textButton}>See how it works</Link>
            </div>
            <p className={styles.finePrint}>No-cost, {freePlan.period.toLowerCase()} trial · {freePlan.questions.toLowerCase()} · Your pace, your plan</p>
          </div>

          <div className={styles.heroVisual} aria-label="Preview of the Kno U Kno business planning dashboard">
            <div className={styles.visualTopbar}>
              <div className={styles.windowDots}><i /><i /><i /></div>
              <span>YOUR BUSINESS WORKSPACE</span>
              <span className={styles.status}>● IN PROGRESS</span>
            </div>
            <div className={styles.visualBody}>
              <div className={styles.visualWelcome}>
                <span>YOUR STARTING POINT</span>
                <strong>Build a business<br />that works for you.</strong>
                <p>A little clarity today can make a big difference tomorrow.</p>
              </div>
              <div className={styles.progressCard}>
                <div className={styles.progressHeading}><span>Business idea</span><strong>01 <small>/ 05</small></strong></div>
                <div className={styles.progressTrack}><span /></div>
                <p>What problem will your business solve?</p>
              </div>
              <div className={styles.visualFooter}>
                <div><span className={styles.miniIcon}>↗</span><span><b>Think it through</b><small>One useful question at a time</small></span></div>
                <span className={styles.avatar}>K</span>
              </div>
            </div>
            <div className={styles.floatingNote}><span>✦</span><div><b>Progress, not perfection.</b><small>Your plan can grow with you.</small></div></div>
          </div>
          <div className={styles.heroOrnament} aria-hidden="true">K.</div>
        </section>

        <section className={styles.valueStrip} aria-label="Kno U Kno benefits">
          <p>Built for the real work of starting and growing</p>
          <div><span>01</span> Get focused</div>
          <div><span>02</span> Make a plan</div>
          <div><span>03</span> Keep moving</div>
        </section>

        <section id="how-it-works" className={styles.stepsSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>A simple system</p>
            <h2>Less second-guessing.<br /><em>More forward motion.</em></h2>
            <p>Running a business brings a lot of decisions. Start with one question, make sense of what you know, and turn it into an action you can take.</p>
          </div>
          <div className={styles.steps}>
            <article className={styles.stepCard}>
              <span className={styles.stepNumber}>01</span>
              <div className={styles.stepIcon} aria-hidden="true">?</div>
              <h3>Explore the right questions</h3>
              <p>Work through prompts about customers, money, operations, and the next stage of your business.</p>
            </article>
            <article className={styles.stepCard}>
              <span className={styles.stepNumber}>02</span>
              <div className={styles.stepIcon} aria-hidden="true">↗</div>
              <h3>Shape your own answers</h3>
              <p>Use examples as a jumping-off point, then capture the thinking that fits your business.</p>
            </article>
            <article className={styles.stepCard}>
              <span className={styles.stepNumber}>03</span>
              <div className={styles.stepIcon} aria-hidden="true">✓</div>
              <h3>See how you’re progressing</h3>
              <p>Save your work, review your answers, and use simple ratings to spot where to focus next.</p>
            </article>
          </div>
        </section>

        <section className={styles.questionsSection}>
          <div className={styles.questionsCopy}>
            <p className={styles.eyebrow}>A taste of the process</p>
            <h2>Start with a question.<br /><em>Find your next step.</em></h2>
            <p>Good decisions start with better questions. Explore a few of the prompts you can work through in Kno U Kno.</p>
            <Link href="/trial" className={styles.lightButton}>Try it for free <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.questionList}>
            {sampleQuestions.map((question, index) => (
              <article className={styles.questionCard} key={question}>
                <span>0{index + 1}</span>
                <p>{question}</p>
                <span className={styles.questionArrow} aria-hidden="true">↗</span>
              </article>
            ))}
            <p className={styles.disclaimer}>Learning prompts are for general educational purposes and are not legal, tax, or financial advice.</p>
          </div>
        </section>

        <section id="price" className={styles.trialSection}>
          <div className={styles.trialCard}>
            <div className={styles.trialCopy}>
              <p className={styles.eyebrow}>Start where you are</p>
              <h2>Your business deserves a plan that starts with <em>you.</em></h2>
              <p>Try the guided experience at no cost. Take a few thoughtful steps and see what becomes clearer.</p>
              <Link href="/trial" className={styles.primaryButton}>Start your free trial <span aria-hidden="true">→</span></Link>
            </div>
            <div className={styles.trialOffer}>
              <div className={styles.offerMark}>K</div>
              <span>YOUR {freePlan.period.toUpperCase()} TRIAL</span>
              <strong>{freePlan.price}</strong>
              <p>{freePlan.questions} to help you get started.</p>
              <div className={styles.offerDivider} />
              <small>Paid plans are not yet available.</small>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>Kno <span>U</span> Kno</Link>
        <p>Thoughtful steps for the business you’re building.</p>
        <div><Link href="/login">Log in</Link><Link href="/register">Create account</Link></div>
        <small>© 2026 knoukno.co</small>
      </footer>
    </div>
  )
}
