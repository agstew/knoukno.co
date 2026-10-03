import React from 'react';
import { Link } from 'react-router-dom';

function getPageRange(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push('...');
    out.push(n);
    prev = n;
  }
  return out;
}

export default function Questions({
  activeTitle,
  clientTitle,
  questions,
  question,
  selectedQuestionId,
  feedback,
  loadingQ,
  totalQ,
  totalPages,
  page,
  maxQ,
  tier,
  answerText,
  savingAnswer,
  canGoPrev,
  canGoNext,
  onAnswerChange,
  onSaveAnswer,
  onPrevQuestion,
  onNextQuestion,
  onSelectQuestion,
  onFetchPage,
  onBackToTitles
}) {
  const currentQuestion = question || questions[0] || null;
  const currentQuestionPosition = page || 0;
  const maxQuestionPage = Math.min(totalPages, maxQ);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div id="question-top-anchor" className="card" style={{ padding: '1rem 1.1rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
          {clientTitle ? `${clientTitle}${activeTitle ? ` · ${activeTitle}` : ''}` : activeTitle ? activeTitle : 'Question Workspace'}
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.92rem' }}>
          {clientTitle
            ? 'Ask the client for a clear business decision on each page.'
            : activeTitle
              ? 'One hard startup decision per page.'
              : 'Select a question number to review it.'}
        </p>
      </div>

      <div className="card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ marginBottom: '0.9rem' }}>
          <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>Question Flow</h3>
          <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.92rem' }}>
            AI writes the question. The client answers. Save each page in MongoDB.
          </p>
        </div>

        {questions.length > 0 ? (
          <div className="question-page-summary">
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-dark)' }}>One question per page</div>
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                Page {page} of {maxQuestionPage}
              </div>
            </div>
          </div>
        ) : !loadingQ ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-icon">📭</div>
            <h3>No questions available</h3>
            <p>
              {tier === 'free'
                ? 'No free questions are available for this selection. Choose another title or upgrade.'
                : 'No questions are available for this selection right now.'}
            </p>
            {tier === 'free' && <Link to="/price" className="btn btn-primary">Upgrade Plan</Link>}
          </div>
        ) : null}
      </div>

      <div id="question-detail">
        {feedback && (
          <div className={`alert ${feedback.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
            {feedback}
          </div>
        )}

        {loadingQ ? (
          <div className="spinner-wrap"><div className="spinner"></div></div>
        ) : currentQuestion ? (
          <div className="question-card">
            <div className="question-meta">
              <span className="question-number">Q{page}</span>
              <span className="question-progress">Question {currentQuestionPosition} of {maxQuestionPage}</span>
            </div>

            <div className="question-title">Client Prompt</div>
            <p className="question-text">{currentQuestion.questionText}</p>

            <section id="example-section" className="question-example question-workspace-section">
              <h3>Example</h3>
              <p>{currentQuestion.example || 'No example has been added for this question yet.'}</p>
              <small>This is only an example. The answer still comes from you.</small>
            </section>

            <section id="answers-section" className="answer-section question-workspace-section">
              <label htmlFor="answer-textarea">Answers</label>
              <p className="answer-help">Write the client's decision, evidence, tradeoffs, and stop-or-pivot trigger here. Save stores this page in MongoDB.</p>
              <textarea
                id="answer-textarea"
                className="form-control"
                rows={8}
                value={answerText}
                onChange={(event) => onAnswerChange?.(event.target.value)}
                placeholder="Write the client's decision-quality answer here: choice, rejected option, proof, risk controls, and trigger to change direction"
              />
            </section>

            <div className="question-actions">
              <button type="button" className="btn btn-secondary" onClick={onPrevQuestion} disabled={!canGoPrev}>
                Previous
              </button>
              <button type="button" className="btn btn-primary" onClick={onSaveAnswer} disabled={savingAnswer}>
                {savingAnswer ? 'Saving...' : 'Save Answer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onNextQuestion} disabled={!canGoNext}>
                Next Question
              </button>
            </div>

          </div>
        ) : null}
      </div>

      {(activeTitle || (totalQ > 0 && !loadingQ && Math.min(totalPages, maxQ) > 1)) && (
        <div className="question-pagination-bar">
          {activeTitle ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onBackToTitles}>
              Back to Titles
            </button>
          ) : <div />}

          {totalQ > 0 && !loadingQ && Math.min(totalPages, maxQ) > 1 ? (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onFetchPage(1)}
                disabled={page <= 1}
                aria-label="First page"
              >|‹</button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onFetchPage(page - 1)}
                disabled={page <= 1}
              >‹ Prev</button>
              {getPageRange(page, Math.min(totalPages, maxQ)).map((value, idx) => (
                value === '...' ? (
                  <span key={`e${idx}`} className="pagination-info">…</span>
                ) : (
                  <button
                    key={value}
                    type="button"
                    className={`pagination-btn${value === page ? ' active' : ''}`}
                    onClick={() => onFetchPage(value)}
                  >{value}</button>
                )
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onFetchPage(page + 1)}
                disabled={page >= Math.min(totalPages, maxQ)}
              >Next ›</button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onFetchPage(Math.min(totalPages, maxQ))}
                disabled={page >= Math.min(totalPages, maxQ)}
                aria-label="Last page"
              >›|</button>
            </div>
          ) : <div />}
        </div>
      )}
    </div>
  );
}
