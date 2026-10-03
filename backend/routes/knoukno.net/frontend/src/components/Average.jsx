import React from 'react';
import { Link } from 'react-router-dom';

export default function AverageButton({ active, to }) {
  return <Link className={`tab-btn${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} to={to}>Average</Link>;
}

export function AveragePanel({ answers, activeTier, selectedTitle, totalQuestions }) {
  const grades = answers.filter((answer) => answer.grade != null).map((answer) => Number(answer.grade)).filter(Number.isFinite);
  const ratings = answers.filter((answer) => answer.rating != null).map((answer) => Number(answer.rating)).filter(Number.isFinite);
  const average = (values) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : 'Not rated';

  return (
    <section className="question-card" id="average-panel">
      <div className="question-meta">
        <span className="question-number">Average</span>
        <h2 className="question-title">{selectedTitle || 'Your progress'}</h2>
      </div>
      <p className="answer-help">{answers.length} saved answers of {totalQuestions || (activeTier === 'pro' ? 75 : activeTier === 'members' ? 50 : 5)} questions</p>
      <div className="grade-input-row">
        <strong>Average grade: {average(grades)}{grades.length ? '%' : ''}</strong>
        <strong>Average rating: {average(ratings)}{ratings.length ? ' / 5' : ''}</strong>
      </div>
    </section>
  );
}