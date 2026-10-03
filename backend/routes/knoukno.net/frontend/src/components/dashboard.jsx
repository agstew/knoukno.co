import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardButton({ active, to }) {
  return <Link className={`tab-btn${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} to={to}>Dashboard</Link>;
}