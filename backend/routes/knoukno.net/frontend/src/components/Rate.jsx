import React from 'react';
import { Link } from 'react-router-dom';

export default function RateButton({ active, to }) {
  return <Link className={`tab-btn${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} to={to}>Rated</Link>;
}