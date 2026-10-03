import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-dark)', marginBottom: '0.5rem' }}>
          About Kno U Kno
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginBottom: '2.5rem' }}>
          Business intelligence through deep self-examination.
        </p>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Our Mission</h2>
          </div>
          <p style={{ lineHeight: 1.8, color: 'var(--color-text)' }}>
            Most business owners fail not because they lack ambition, but because they don't know
            what they don't know. Kno U Kno is designed to change that. We present the real
            questions — the ones experienced operators ask — so you can honestly assess your
            knowledge, identify gaps, and fill them before they cost you your business.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">What Makes Kno U Kno Different</h2>
          </div>
          <ul style={{ lineHeight: 2.0, color: 'var(--color-text)', paddingLeft: '1.2rem' }}>
            <li style={{ marginBottom: '0.6rem' }}>
              <strong>No multiple choice.</strong> Our questions require real written answers — forcing you
              to articulate what you actually know, not guess what sounds right.
            </li>
            <li style={{ marginBottom: '0.6rem' }}>
              <strong>Real scenarios.</strong> Every question is grounded in a realistic business situation
              with a concrete example so you can apply it to your own context.
            </li>
            <li style={{ marginBottom: '0.6rem' }}>
              <strong>Self-graded.</strong> You grade yourself. Our goal is honest self-assessment, not
              judgment. The only person who benefits from inflating your score is a competitor.
            </li>
            <li style={{ marginBottom: '0.6rem' }}>
              <strong>Progression tracking.</strong> Come back, improve your answers, see your scores rise
              over time as your business education deepens.
            </li>
          </ul>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">The Five Business Areas</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {[
              { icon: '🚀', title: 'Starting Your Business', desc: 'Validation, legal structure, pricing, operational setup, vendor relationships' },
              { icon: '⚙️', title: 'Managing Operations', desc: 'SOPs, quality control, technology, scaling, customer service' },
              { icon: '💰', title: 'Business Finances', desc: 'Cash flow, accounting, financing, budgeting, financial modeling' },
              { icon: '👥', title: 'Employee Management', desc: 'Compensation, performance, culture, hiring, onboarding' },
              { icon: '📈', title: 'Business Growth', desc: 'Scaling, expansion, sales pipelines, market entry strategy' },
            ].map(area => (
              <div key={area.title} style={{ background: 'var(--color-snow)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{area.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '0.3rem' }}>{area.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>{area.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Our Plans</h2>
          </div>
          <div style={{ lineHeight: 1.8, color: 'var(--color-text)' }}>
            <p><strong>Free Trial (3 days):</strong> Access 5 foundational questions to experience the platform.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Members ($39):</strong> Unlock 50 questions across all business categories. One-time payment.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Pro ($436):</strong> Full access to all 75 questions — our complete business knowledge curriculum. One-time payment.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Start Your Free Trial</Link>
        </div>
      </div>
    </div>
  );
}
