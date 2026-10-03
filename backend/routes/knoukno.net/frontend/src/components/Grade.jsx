import React from 'react';
import { Link } from 'react-router-dom';

export const GRADE_OPTIONS = [
  { letter: 'A', points: 100 },
  { letter: 'B', points: 85 },
  { letter: 'C', points: 70 },
  { letter: 'D', points: 55 },
  { letter: 'F', points: 0 }
];

export default function GradeButton({ active, to }) {
  return <Link className={`tab-btn${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} to={to}>Grade</Link>;
}

export function GradePanel({ answers, divisor, divisorOptions, onDivisorChange, onGradeChange, savingGradeId, gradeFeedback, selectedTitle }) {
  const graded = answers.filter((answer) => Number.isFinite(Number(answer.grade)) && answer.grade != null);
  const total = graded.reduce((sum, answer) => sum + Number(answer.grade), 0);

  return (
    <section className="question-card" id="grade-panel">
      <div className="question-meta">
        <span className="question-number">Grade</span>
        <h2 className="question-title">{selectedTitle || 'Your answers'}</h2>
      </div>
      <div className="grade-input-row">
        <label htmlFor="grade-divisor">Total questions</label>
        <select id="grade-divisor" className="input" value={divisor} onChange={(event) => onDivisorChange(Number(event.target.value))}>
          {divisorOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        <strong>{total} / {divisor * 100} points</strong>
      </div>
      {gradeFeedback && <p className="answer-help" role="status">{gradeFeedback}</p>}
      {answers.length === 0 ? <p className="answer-help">Save an answer first to grade it.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Question</th><th>Answer</th><th>Grade</th></tr></thead>
            <tbody>{answers.map((answer, index) => {
              const question = typeof answer.questionId === 'object' ? answer.questionId : null;
              const questionId = question?._id || answer.questionId;
              const selected = GRADE_OPTIONS.find((option) => option.points === answer.grade);
              return (
                <tr key={answer._id || questionId || index}>
                  <td>{question?.questionNumber || index + 1}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{answer.answerText?.trim() || 'No saved answer text yet.'}</td>
                  <td>
                    <label htmlFor={`grade-${index}`} className="sr-only">Grade question {question?.questionNumber || index + 1}</label>
                    <select id={`grade-${index}`} className="input" value={selected?.letter || ''} disabled={!questionId || savingGradeId === questionId} onChange={(event) => onGradeChange(answer, event.target.value)}>
                      <option value="">Not graded</option>
                      {GRADE_OPTIONS.map((option) => <option key={option.letter} value={option.letter}>{option.letter} ({option.points})</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}