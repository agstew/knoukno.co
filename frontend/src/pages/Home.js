import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/content/landing', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Landing content unavailable');
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.sections)) {
          setContent(Object.fromEntries(data.sections.filter((section) => section?.slug).map((section) => [section.slug, section])));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const stages = [
    {
      slug: 'law', label: 'Stage one', title: 'Law first, so the business is real', image: 'section-law.svg', alt: 'Business formation paperwork on a desk',
      paragraphs: [
        'Before you open the doors, put the business on paper. Choose an entity, register the name, understand your taxes, and find the licences and insurance your work requires.',
        'Answer the practical questions now: who signs, what the lease demands, and what happens if you need to step away.'
      ]
    },
    {
      slug: 'location', label: 'Stage two', title: 'The best place to put a business', image: 'section-location.svg', alt: 'A storefront on a busy street',
      paragraphs: [
        'A storefront, a place customers drive to, or a business that lives online: the right location depends on the people you serve and the numbers you can support.',
        'Work through rent, zoning, foot traffic, and a second choice before you commit.'
      ]
    },
    {
      slug: 'hiring', label: 'Stage three', title: 'What type of person to hire', image: 'section-hiring.svg', alt: 'A small team working together',
      paragraphs: [
        'Your first hire sets the tone. Name the work that needs doing, the person who can do it, what you can pay, and what success should look like after thirty days.',
        'Think through contractors, employees, training, and the work you want to keep in your own hands.'
      ]
    },
    {
      slug: 'people', label: 'Stage four', title: 'The people who come to your business', image: 'section-people.svg', alt: 'Customers being served at a counter',
      paragraphs: [
        'Who are your customers? What brings them to you, how will they find you, and what makes them return?',
        'By the end, you should be able to explain who you serve and exactly what you sell them in a single sentence.'
      ]
    }
  ];

  return (
    <div className="site-home">
      <section className="live-hero">
        <div className="live-hero-inner">
          <p className="live-eyebrow">knoukno.org</p>
          <h1>Kno U Kno<br /><span>Know you know.</span></h1>
          <p className="live-hero-copy">
            We show you how to start a business — from the basics all the way to the finish.
            Law, location, hiring, and the people who come to your business. We ask the questions.
            You write the answers, and we keep every one of them.
          </p>
          <div className="live-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="live-button">Go to dashboard <span aria-hidden="true">↗</span></Link>
          ) : (
            <>
              <Link to="/register" className="live-button">Start free — 5 questions <span aria-hidden="true">↗</span></Link>
              <Link to="/price" className="live-button live-button-outline">See the price</Link>
            </>
          )}
          </div>
        </div>
      </section>

      <section className="live-section live-intro">
        <div className="live-section-inner">
          <div className="live-section-copy">
            <p className="live-section-label">Know you know</p>
            <h2>{content['start-here']?.heading || 'Start a business from the very first step'}</h2>
            <p>{content['start-here']?.body || "Build your own plan by answering the questions a real business needs answered, in an order you can work through. No template, and no one else's answers."}</p>
            <p>Start with law. Then find your place, work out who to hire, and get to know the people who will come to your business.</p>
            <p>Your answers stay with you. Return to grade, rank, and print them whenever you need to make your next decision.</p>
          </div>
          <figure className="live-figure"><img src="/img/section-start.svg" alt="A founder writing the first plan for a new business" /></figure>
        </div>
      </section>

      {stages.map((stage, index) => (
        <section className={`live-section live-stage${index % 2 ? ' live-stage-alt' : ''}`} key={stage.label}>
          <div className="live-section-inner">
            <div className="live-section-copy">
              <p className="live-section-label">{stage.label}</p>
              <h2>{content[stage.slug]?.heading || stage.title}</h2>
              {(content[stage.slug]?.body ? [content[stage.slug].body] : stage.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <figure className="live-figure"><img src={`/img/${stage.image}`} alt={stage.alt} loading="lazy" /></figure>
          </div>
        </section>
      ))}

      <section className="live-section live-process">
        <div className="live-section-inner">
          <div className="live-section-copy">
            <p className="live-section-label">How it works</p>
            <h2>{content['the-answer-is-yours']?.heading || 'The question is ours. The answer is yours.'}</h2>
            <p>{content['the-answer-is-yours']?.body || 'Write your answers under your business title. Grade each one, rank your strongest work first, see your average, and keep a copy of the plan you built.'}</p>
            <p>The result is not a certificate. It is your own thinking, written down and ready to share with a partner, lender, or first employee.</p>
          </div>
          <figure className="live-figure"><img src="/img/section-answers.svg" alt="Handwritten answers in a workbook" loading="lazy" /></figure>
        </div>
      </section>

      <section className="live-end">
        <div className="live-end-inner">
          <p className="live-section-label">Everyone starts somewhere</p>
          <h2>Name your business and answer the first question</h2>
          <p>Register and start with five questions, free for three days. No card required until you decide to keep going.</p>
          <div className="live-actions">
            <Link className="live-button" to={isAuthenticated ? '/dashboard' : '/register'}>{isAuthenticated ? 'Open dashboard' : 'Register free'} <span aria-hidden="true">↗</span></Link>
            <Link className="live-button live-button-outline" to="/price">See the price</Link>
          </div>
        </div>
      </section>
      <footer className="live-footer">
        <strong>Kno U Kno<span>.</span></strong>
        <p>Know you know. The questions come from us; the answers come from you.</p>
        <div><Link to="/">Home</Link><Link to="/price">Price</Link><Link to="/login">Login</Link><Link to="/register">Register</Link></div>
      </footer>
    </div>
  );
}
