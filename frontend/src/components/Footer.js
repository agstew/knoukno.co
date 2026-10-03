import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="live-footer">
      <strong>Kno U Kno<span>.</span></strong>
      <p>Know you know. The questions come from us; the answers come from you.</p>
      <div><Link to="/">Home</Link><Link to="/price">Price</Link><Link to="/login">Login</Link><Link to="/register">Register</Link></div>
    </footer>
  );
}
