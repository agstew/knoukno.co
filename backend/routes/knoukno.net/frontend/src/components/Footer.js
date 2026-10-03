import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="kk-footer no-print">
      <div className="kk-footer-inner">
        <section className="kk-footer-brand">
          <strong>Kno U <span>Kno</span></strong>
          <p>Know you know. The questions come from us — the answers come from you, and they are kept so you can use them later.</p>
          <small>knoukno.online</small>
        </section>
        <section>
          <h2>Pages</h2>
          <nav aria-label="Footer pages">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/price">Price</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
        </section>
        <section>
          <h2>The path</h2>
          <nav aria-label="Business path">
            <a href="/#law">Law</a>
            <a href="/#location">Location</a>
            <a href="/#hiring">Hiring</a>
            <a href="/#people">People</a>
          </nav>
        </section>
        <section>
          <h2>Plans</h2>
          <ul>
            <li>Free — 5 questions, 3 days, $0</li>
            <li>Members — 50 questions, $39</li>
            <li>Pro — 75 questions, $436</li>
            <li className="text-gold">Bonus — 100 extra questions, $100</li>
          </ul>
          <Link className="btn btn-gold btn-sm btn-block" to="/price">Buy Now</Link>
        </section>
      </div>
      <div className="kk-footer-bottom">
        <span>&copy; {new Date().getFullYear()} Kno U Kno. All rights reserved.</span>
        <a href="mailto:knoukno006@gmail.com">knoukno006@gmail.com</a>
      </div>
    </footer>
  );
}
