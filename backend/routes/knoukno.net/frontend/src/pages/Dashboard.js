import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Questions from './Questions';
import { GradePanel, GRADE_OPTIONS } from '../components/Grade.jsx';
import { AveragePanel } from '../components/Average.jsx';
import { apiFetch } from '../api/client';

const gradeDivisorsForTier = (tier) => {
  if (tier === 'members') return [50, 150];
  if (tier === 'pro') return [75];
  return [5];
};

const hasSavedAnswerData = (item) => (
  Boolean(item?.answerText?.trim()) ||
  item?.grade != null ||
  item?.rating != null ||
  item?.isSaved
);

function RatePanel({
  answers,
  onPrintAnswers,
  onRateChange,
  rateFeedback,
  selectedTitle,
  activeTier
}) {
  const tierNumberLimit = activeTier === 'pro' ? 75 : activeTier === 'members' ? 50 : 5;

  const ratingFromRank = (rank, total) => {
    if (!total || total <= 1) return 5;
    const value = Math.round(5 - (4 * (rank - 1)) / (total - 1));
    return Math.max(1, Math.min(5, value));
  };

  const getAnswerKey = (item, index = 0) => {
    const questionData = item?.questionId && typeof item.questionId === 'object' ? item.questionId : null;
    return item?._id || questionData?._id || item?.questionId || `answer-${index}`;
  };

  const sortAnswersByRating = useCallback((items) => {
    return [...items].sort((left, right) => {
      const leftRating = Number(left?.rating);
      const rightRating = Number(right?.rating);
      const leftHasRating = Number.isFinite(leftRating);
      const rightHasRating = Number.isFinite(rightRating);

      if (leftHasRating && rightHasRating && leftRating !== rightRating) {
        return rightRating - leftRating;
      }

      if (leftHasRating !== rightHasRating) {
        return leftHasRating ? -1 : 1;
      }

      const leftQuestionNumber = Number(left?.questionId?.questionNumber) || 0;
      const rightQuestionNumber = Number(right?.questionId?.questionNumber) || 0;
      if (leftQuestionNumber && rightQuestionNumber && leftQuestionNumber !== rightQuestionNumber) {
        return leftQuestionNumber - rightQuestionNumber;
      }

      return new Date(left?.savedAt || 0).getTime() - new Date(right?.savedAt || 0).getTime();
    });
  }, []);

  const [orderedAnswers, setOrderedAnswers] = useState(() => sortAnswersByRating(answers));
  const [answerNumbers, setAnswerNumbers] = useState({});
  const [selectedAnswerKey, setSelectedAnswerKey] = useState('');

  const getAssignedNumber = useCallback((item, index = 0, numbers = answerNumbers) => {
    const key = getAnswerKey(item, index);
    return Number(numbers[key]) || index + 1;
  }, [answerNumbers]);

  useEffect(() => {
    const sortedAnswers = sortAnswersByRating(answers);

    setAnswerNumbers((prev) => {
      const nextNumbers = {};
      const usedNumbers = new Set();

      sortedAnswers.forEach((item, index) => {
        const key = getAnswerKey(item, index);
        const requestedNumber = Number(prev[key]);
        const nextNumber = Number.isInteger(requestedNumber) && requestedNumber >= 1 && requestedNumber <= tierNumberLimit && !usedNumbers.has(requestedNumber)
          ? requestedNumber
          : null;

        if (nextNumber != null) {
          nextNumbers[key] = nextNumber;
          usedNumbers.add(nextNumber);
          return;
        }

        for (let number = 1; number <= tierNumberLimit; number += 1) {
          if (!usedNumbers.has(number)) {
            nextNumbers[key] = number;
            usedNumbers.add(number);
            break;
          }
        }
      });

      return nextNumbers;
    });

    setOrderedAnswers(sortedAnswers);
  }, [answers, sortAnswersByRating, tierNumberLimit]);

  const displayedAnswers = [...orderedAnswers].sort((left, right) => {
    const leftNumber = getAssignedNumber(left);
    const rightNumber = getAssignedNumber(right);
    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return sortAnswersByRating([left, right])[0] === left ? -1 : 1;
  });

  useEffect(() => {
    if (!displayedAnswers.length) {
      setSelectedAnswerKey('');
      return;
    }

    const hasSelectedAnswer = displayedAnswers.some((item, index) => getAnswerKey(item, index) === selectedAnswerKey);
    if (!hasSelectedAnswer) {
      setSelectedAnswerKey(getAnswerKey(displayedAnswers[0], 0));
    }
  }, [displayedAnswers, selectedAnswerKey]);

  const selectedIndex = displayedAnswers.findIndex((item, index) => getAnswerKey(item, index) === selectedAnswerKey);
  const selectedNumber = selectedIndex >= 0 ? getAssignedNumber(displayedAnswers[selectedIndex], selectedIndex) : '';

  const moveSelectedAnswer = (nextPosition) => {
    const parsedPosition = Number(nextPosition);
    if (!Number.isInteger(parsedPosition) || parsedPosition < 1 || parsedPosition > tierNumberLimit || selectedIndex < 0) {
      return;
    }

    if (parsedPosition === selectedNumber) {
      return;
    }

    const selectedItem = displayedAnswers[selectedIndex];
    const selectedKey = getAnswerKey(selectedItem, selectedIndex);
    const swapEntry = displayedAnswers.find((item, index) => {
      const key = getAnswerKey(item, index);
      return key !== selectedKey && Number(answerNumbers[key]) === parsedPosition;
    }) || null;

    setAnswerNumbers((prev) => {
      const nextNumbers = { ...prev };
      if (swapEntry) {
        const swapKey = getAnswerKey(swapEntry);
        nextNumbers[swapKey] = selectedNumber;
      }
      nextNumbers[selectedKey] = parsedPosition;
      return nextNumbers;
    });

    if (typeof onRateChange === 'function') {
      const total = displayedAnswers.length;
      onRateChange(selectedItem, ratingFromRank(parsedPosition, total));
      if (swapEntry) {
        onRateChange(swapEntry, ratingFromRank(selectedNumber, total));
      }
    }
  };

  const resetToBestFirst = () => {
    const sortedAnswers = sortAnswersByRating(answers);
    setOrderedAnswers(sortedAnswers);
    setAnswerNumbers(
      sortedAnswers.reduce((acc, item, index) => {
        acc[getAnswerKey(item, index)] = index + 1;
        return acc;
      }, {})
    );

    if (typeof onRateChange === 'function') {
      const total = sortedAnswers.length;
      sortedAnswers.forEach((item, index) => {
        onRateChange(item, ratingFromRank(index + 1, total));
      });
    }
  };

  return (
    <section className="question-card" id="rate-panel">
      <div className="question-meta">
        <span className="question-number">Rated</span>
        <h2 className="question-title">Answer List</h2>
      </div>

      <div className="grade-input-row" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
        <strong>Total answers: {answers.length}</strong>
        <div className="grade-input-row">
          <button type="button" className="btn btn-secondary" onClick={resetToBestFirst} disabled={answers.length === 0}>
            Best First
          </button>
          <button type="button" className="btn btn-secondary" onClick={onPrintAnswers} disabled={answers.length === 0}>
            Print Answers
          </button>
        </div>
      </div>

      {rateFeedback && <div className="answer-help" style={{ marginBottom: '1rem' }}>{rateFeedback}</div>}

      {answers.length === 0 ? (
        <div className="answer-help">Save an answer first. Your saved answers will show up here as a numbered list.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >
            <div className="question-page-summary">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-dark)' }}>Best answer first</div>
                <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                  Number choices follow your tier range: 1-{tierNumberLimit}.
                </div>
              </div>
            </div>
            <div className="question-page-summary">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-dark)' }}>
                  {selectedIndex >= 0 ? `Selected: #${selectedNumber}` : 'No answer selected'}
                </div>
              </div>
            </div>
          </div>
          <div className="grade-input-row" style={{ justifyContent: 'space-between' }}>
            <div className="answer-help" style={{ marginBottom: 0 }}>
              {selectedIndex >= 0
                ? `Selected answer: ${selectedNumber}`
                : 'Click an answer to choose it.'}
            </div>
            <label htmlFor="rate-answer-position" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '16px' }}>
              <strong style={{ fontSize: '16px' }}>Move to number</strong>
              <select
                id="rate-answer-position"
                className="input"
                value={selectedIndex >= 0 ? String(selectedNumber) : ''}
                onChange={(event) => moveSelectedAnswer(event.target.value)}
                disabled={selectedIndex < 0}
                style={{ fontSize: '16px' }}
              >
                {Array.from({ length: tierNumberLimit }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              {displayedAnswers.map((item, index) => {
                const questionData = item.questionId && typeof item.questionId === 'object' ? item.questionId : null;
                const rowKey = getAnswerKey(item, index);
                const isSelected = rowKey === selectedAnswerKey;
                const assignedNumber = getAssignedNumber(item, index);
                const rankLabel = index === 0 ? 'Best' : index === 1 ? 'Second' : index === 2 ? 'Third' : `#${assignedNumber}`;

                return (
                  <tr
                    key={item._id || `${rowKey}-${index}`}
                    onClick={() => setSelectedAnswerKey(rowKey)}
                    style={{ background: isSelected ? 'rgba(168, 216, 234, 0.22)' : undefined, cursor: 'pointer' }}
                  >
                    <td style={{ minWidth: '120px', verticalAlign: 'top' }}>
                      <div style={{ whiteSpace: 'nowrap', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {assignedNumber}
                      </div>
                      <div style={{ color: 'var(--color-dark)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {rankLabel}
                      </div>
                      <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                        {questionData?.businessTitle || item.businessTitle || 'Business Title'}
                      </div>
                    </td>
                    <td style={{ minWidth: '280px', color: 'var(--color-dark)', whiteSpace: 'pre-wrap' }}>
                      <div style={{ fontWeight: 800 }}>
                        {item.answerText?.trim() || 'No saved answer text yet.'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </section>
  );
}

const API = (path, token, opts = {}) =>
  apiFetch(path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });

function TierBanner({ tier, tierExpiry, isAdmin }) {
  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'members' ? 'Members' : 'Free';
  const expiryDate = tierExpiry ? new Date(tierExpiry) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate - Date.now()) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  if (isAdmin) return null;

  return (
    <div className="tier-banner">
      <div className="tier-info">
        <strong>Plan: {tierLabel}</strong>
        {tier === 'free' && daysLeft !== null && !isExpired && (
          <span style={{ marginLeft: '0.75rem', color: daysLeft <= 1 ? 'var(--color-danger)' : 'inherit' }}>
            {' '}
            · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in free trial
          </span>
        )}
        {isExpired && (
          <span style={{ marginLeft: '0.75rem', color: 'var(--color-danger)', fontWeight: 700 }}>
            {' '}
            · Free trial expired
          </span>
        )}
      </div>
      {tier === 'free' && (
        <Link to="/price" className="btn btn-primary btn-sm">Upgrade Plan</Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, tier, tierExpiry, isAdmin } = useAuth();
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const focus = searchParams.get('focus') || '';
  const activeTitle = searchParams.get('title') || '';
  const clientTitle = searchParams.get('clientTitle') || '';
  const requestedQuestionNumber = Number.parseInt(searchParams.get('question') || '', 10);
  const selectedTitle = clientTitle || activeTitle;

  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQ, setTotalQ] = useState(0);
  const [loadingQ, setLoadingQ] = useState(false);
  const [account, setAccount] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [rateFeedback, setRateFeedback] = useState('');
  const [answersByQuestionId, setAnswersByQuestionId] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [answersError, setAnswersError] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [savingGradeId, setSavingGradeId] = useState(null);
  const [savingRateId, setSavingRateId] = useState(null);
  const [saveTrace, setSaveTrace] = useState(null);
  const QUESTIONS_PER_PAGE = 1;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setSuccessMsg('Payment successful! Your plan has been upgraded.');
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedTitle) {
      document.title = `${selectedTitle} | KNO U KNO`;
      return;
    }

    document.title = 'Dashboard | KNO U KNO';
  }, [selectedTitle]);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await API('/api/auth/me', token);
        if (res.ok) {
          setAccount(await res.json());
        }
      } catch {}
    };

    if (token) {
      fetchAccount();
    }
  }, [token]);

  const fetchSavedAnswers = useCallback(async () => {
    setLoadingAnswers(true);
    setAnswersError('');
    try {
      const res = await API('/api/answers/my', token);
      if (!res.ok) throw new Error('Could not load saved answers.');

      const data = await res.json();
      const relevantAnswers = (Array.isArray(data) ? data : []).filter((item) => {
        if (clientTitle) return item.clientTitle === clientTitle;
        if (activeTitle) {
          const questionTitle = typeof item.questionId === 'object' ? item.questionId?.businessTitle : '';
          return item.businessTitle === activeTitle || questionTitle === activeTitle;
        }
        return !item.clientTitle;
      });
      const nextAnswers = relevantAnswers.reduce((acc, item) => {
        const questionId = item?.questionId?._id || item?.questionId;
        if (questionId) {
          acc[questionId] = item;
        }
        return acc;
      }, {});

      setAnswersByQuestionId(nextAnswers);
    } catch {
      setAnswersError('Could not load saved answers. Please try again.');
    } finally {
      setLoadingAnswers(false);
    }
  }, [token, activeTitle, clientTitle]);

  useEffect(() => {
    if (token) {
      fetchSavedAnswers();
    }
  }, [fetchSavedAnswers, token]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasExplicitDashboardTarget = Boolean(
      searchParams.get('tab') ||
      searchParams.get('focus') ||
      searchParams.get('title') ||
      searchParams.get('clientTitle')
    );

    if (!hasExplicitDashboardTarget) {
      navigate('/list', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchQuestion = useCallback(async (nextPage = 1) => {
    setLoadingQ(true);
    setFeedback('');

    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(QUESTIONS_PER_PAGE) });
      if (activeTitle) {
        params.set('businessTitle', activeTitle);
      }

      const res = await API(`/api/questions?${params.toString()}`, token);
      if (!res.ok) {
        const data = await res.json();
        setFeedback(data.message || 'Could not load questions.');
        return;
      }

      const data = await res.json();
      const nextQuestions = data.questions || [];
      const initialQuestion = nextQuestions[0] || null;

      setQuestions(nextQuestions);
      setQuestion(initialQuestion);
      setSelectedQuestionId(initialQuestion?._id || null);
      setTotalPages(data.pages || 1);
      setTotalQ(data.total || 0);
      setPage(nextPage);
    } catch {
      setFeedback('Network error loading questions.');
    } finally {
      setLoadingQ(false);
    }
  }, [token, activeTitle]);

  useEffect(() => {
    if (token) {
      const initialPage = Number.isNaN(requestedQuestionNumber) || requestedQuestionNumber < 1 ? 1 : requestedQuestionNumber;
      fetchQuestion(initialPage);
    }
  }, [fetchQuestion, requestedQuestionNumber, token]);

  useEffect(() => {
    if (!selectedQuestionId) {
      setAnswerText('');
      return;
    }

    setAnswerText(answersByQuestionId[selectedQuestionId]?.answerText || '');
  }, [answersByQuestionId, selectedQuestionId]);

  const selectQuestion = async (nextQuestion) => {
    if (!nextQuestion) return;

    if (nextQuestion.questionNumber && nextQuestion.questionNumber !== page) {
      cacheCurrentAnswerDraft();
      const direction = nextQuestion.questionNumber > page ? 'next' : 'previous';
      const didSave = await saveAnswer({ silent: true, source: direction });
      if (!didSave) {
        setFeedback('Answer kept on the page. Could not save to MongoDB before changing questions.');
      }
      fetchQuestion(nextQuestion.questionNumber);
      return;
    }

    setSelectedQuestionId(nextQuestion._id);
    setQuestion(nextQuestion);

    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set('question', String(nextQuestion.questionNumber));
    navigate(`${location.pathname}?${nextSearchParams.toString()}`, { replace: true });

    const elem = document.getElementById('question-detail');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPage = async (nextPage) => {
    if (!nextPage || nextPage === page) return;
    cacheCurrentAnswerDraft();
    const direction = nextPage > page ? 'next' : 'previous';
    const didSave = await saveAnswer({ silent: true, source: direction });
    if (!didSave) {
      setFeedback('Answer kept on the page. Could not save to MongoDB before changing questions.');
    }
    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set('question', String(nextPage));
    navigate(`${location.pathname}?${nextSearchParams.toString()}`, { replace: true });
    fetchQuestion(nextPage);
  };

  const currentQuestionIndex = questions.findIndex((item) => item._id === selectedQuestionId);

  const cacheCurrentAnswerDraft = useCallback(() => {
    if (!selectedQuestionId) return;

    setAnswersByQuestionId((prev) => ({
      ...prev,
      [selectedQuestionId]: {
        ...(prev[selectedQuestionId] || {}),
        questionId: prev[selectedQuestionId]?.questionId || question || selectedQuestionId,
        businessTitle:
          prev[selectedQuestionId]?.businessTitle ||
          question?.businessTitle ||
          '',
        clientTitle: selectedTitle || '',
        answerText,
        isSaved: prev[selectedQuestionId]?.isSaved || Boolean(answerText?.trim())
      }
    }));
  }, [answerText, question, selectedQuestionId]);

  const saveAnswer = async ({ silent = false, source = 'save' } = {}) => {
    if (!selectedQuestionId) {
      if (!silent) {
        setFeedback('Select a question first.');
      }
      setSaveTrace({
        status: 'blocked',
        source,
        title: selectedTitle || question?.businessTitle || 'All titles',
        questionNumber: question?.questionNumber || requestedQuestionNumber || page,
        message: 'No question selected.',
        time: new Date().toLocaleTimeString()
      });
      return false;
    }

    cacheCurrentAnswerDraft();
    setSaveTrace({
      status: 'saving',
      source,
      title: selectedTitle || question?.businessTitle || 'All titles',
      questionNumber: question?.questionNumber || requestedQuestionNumber || page,
      message: 'Saving answer to MongoDB...',
      time: new Date().toLocaleTimeString()
    });

    setSavingAnswer(true);
    if (!silent) {
      setFeedback('');
    }

    try {
      const res = await API('/api/answers/save', token, {
        method: 'POST',
        body: JSON.stringify({ questionId: selectedQuestionId, answerText, clientTitle: selectedTitle })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveTrace({
          status: 'failed',
          source,
          title: selectedTitle || question?.businessTitle || 'All titles',
          questionNumber: question?.questionNumber || requestedQuestionNumber || page,
          message: data.message || 'Could not save answer.',
          time: new Date().toLocaleTimeString()
        });
        if (!silent) {
          setFeedback(data.message || 'Could not save answer.');
        }
        return false;
      }

      const savedAnswer = data.answer;
      if (savedAnswer) {
        setAnswersByQuestionId((prev) => ({
          ...prev,
          [selectedQuestionId]: {
            ...(prev[selectedQuestionId] || {}),
            ...savedAnswer,
            questionId: prev[selectedQuestionId]?.questionId || question || savedAnswer.questionId
          }
        }));
      }

      await fetchSavedAnswers();

      setSaveTrace({
        status: 'saved',
        source,
        title: selectedTitle || question?.businessTitle || savedAnswer?.businessTitle || 'All titles',
        questionNumber: question?.questionNumber || requestedQuestionNumber || page,
        message: 'Answer saved to MongoDB.',
        time: new Date().toLocaleTimeString()
      });

      if (!silent) {
        setFeedback('✅ Answer saved');
      }
      return true;
    } catch {
      setSaveTrace({
        status: 'failed',
        source,
        title: selectedTitle || question?.businessTitle || 'All titles',
        questionNumber: question?.questionNumber || requestedQuestionNumber || page,
        message: 'Network error saving answer.',
        time: new Date().toLocaleTimeString()
      });
      if (!silent) {
        setFeedback('Network error saving answer.');
      }
      return false;
    } finally {
      setSavingAnswer(false);
    }
  };

  const goToAdjacentQuestion = async (direction) => {
    const nextPage = page + direction;
    const maxPage = Math.min(totalPages, maxQ);
    if (nextPage < 1 || nextPage > maxPage) return;

    cacheCurrentAnswerDraft();
    const didSave = await saveAnswer({ silent: true, source: direction > 0 ? 'next' : 'previous' });
    if (!didSave) {
      setFeedback('Answer kept on the page. Could not save to MongoDB before changing questions.');
    }

    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set('question', String(nextPage));
    navigate(`${location.pathname}?${nextSearchParams.toString()}`, { replace: true });
    fetchQuestion(nextPage);
  };

  const tierLimits = { free: 5, members: 50, pro: 75 };
  const maxBonusByTier = { members: 100, pro: 100 };
  const activeTier = account?.tier || tier;
  const bonusLimit = Math.max(
    0,
    Math.min(Number(account?.bonusQuestions) || 0, maxBonusByTier[activeTier] || 0)
  );
  const maxQ = isAdmin ? totalQ : ((tierLimits[activeTier] || 5) + bonusLimit);
  const hasAdvancedTools = isAdmin || activeTier === 'members' || activeTier === 'pro';
  const divisorOptions = gradeDivisorsForTier(activeTier);
  const [selectedDivisor, setSelectedDivisor] = useState(divisorOptions[divisorOptions.length - 1]);

  useEffect(() => {
    const nextOptions = gradeDivisorsForTier(activeTier);
    if (!nextOptions.includes(selectedDivisor)) {
      setSelectedDivisor(nextOptions[nextOptions.length - 1]);
    }
  }, [activeTier, selectedDivisor]);

  useEffect(() => {
    if (!hasAdvancedTools && ['grade', 'rate', 'average'].includes(focus)) {
      navigate('/price', { replace: true });
    }
  }, [focus, hasAdvancedTools, navigate]);

  const displayedAnswers = Object.values(answersByQuestionId)
    .filter((item) => {
      if (!item) return false;
      if (clientTitle) return item.clientTitle === clientTitle && hasSavedAnswerData(item);
      if (!activeTitle) return hasSavedAnswerData(item);

      const questionBusinessTitle = item.questionId && typeof item.questionId === 'object'
        ? item.questionId.businessTitle
        : '';

      return (item.businessTitle === activeTitle || questionBusinessTitle === activeTitle) &&
        hasSavedAnswerData(item);
    })
    .sort((left, right) => {
      const leftQuestionNumber = left.questionId && typeof left.questionId === 'object'
        ? Number(left.questionId.questionNumber) || 0
        : 0;
      const rightQuestionNumber = right.questionId && typeof right.questionId === 'object'
        ? Number(right.questionId.questionNumber) || 0
        : 0;

      if (leftQuestionNumber && rightQuestionNumber) {
        return leftQuestionNumber - rightQuestionNumber;
      }

      return new Date(left.savedAt || 0).getTime() - new Date(right.savedAt || 0).getTime();
    });

  const currentQuestionNumber = question?.questionNumber || requestedQuestionNumber || page;

  const saveGrade = async (answer, letter) => {
    const selectedOption = GRADE_OPTIONS.find((option) => option.letter === letter);
    if (!selectedOption) return;

    const questionId = answer?.questionId?._id || answer?.questionId;
    if (!questionId) {
      setGradeFeedback('Question not found for this answer.');
      return;
    }

    setSavingGradeId(questionId);
    setGradeFeedback('');

    try {
      const res = await API('/api/answers/grade', token, {
        method: 'POST',
        body: JSON.stringify({ questionId, grade: selectedOption.points, clientTitle: selectedTitle })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGradeFeedback(data.message || 'Could not save grade.');
        return;
      }

      const savedAnswer = data.answer;
      if (savedAnswer) {
        setAnswersByQuestionId((prev) => ({
          ...prev,
          [questionId]: {
            ...(prev[questionId] || answer),
            ...savedAnswer,
            questionId: prev[questionId]?.questionId || answer.questionId
          }
        }));
      }

      setGradeFeedback(`Grade saved: ${selectedOption.letter} = ${selectedOption.points}`);
    } catch {
      setGradeFeedback('Network error saving grade.');
    } finally {
      setSavingGradeId(null);
    }
  };

  const saveRate = async (answer, rating) => {
    const questionId = answer?.questionId?._id || answer?.questionId;
    if (!questionId) {
      setRateFeedback('Question not found for this answer.');
      return;
    }

    setSavingRateId(questionId);
    setRateFeedback('');

    try {
      const res = await API('/api/answers/rate', token, {
        method: 'POST',
        body: JSON.stringify({ questionId, rating, clientTitle: selectedTitle })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRateFeedback(data.message || 'Could not save rating.');
        return;
      }

      const savedAnswer = data.answer;
      if (savedAnswer) {
        setAnswersByQuestionId((prev) => ({
          ...prev,
          [questionId]: {
            ...(prev[questionId] || answer),
            ...savedAnswer,
            questionId: prev[questionId]?.questionId || answer.questionId
          }
        }));
      }

      await fetchSavedAnswers();

      setRateFeedback(`Rating saved to MongoDB: ${rating} / 5`);
    } catch {
      setRateFeedback('Network error saving rating.');
    } finally {
      setSavingRateId(null);
    }
  };

  const printableAnswers = displayedAnswers.filter((item) => item.answerText?.trim());

  const printAnswers = () => {
    if (loadingAnswers || answersError) return;
    if (printableAnswers.length === 0) {
      setRateFeedback('No saved answers to print.');
      return;
    }

    const escapedTitle = (selectedTitle || 'All Saved Answers')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

    const answerMarkup = printableAnswers.map((item, index) => {
      const answerLabel = `Answer ${index + 1}`;
      const answerTextValue = (item.answerText?.trim() || 'No saved answer text yet.')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('\n', '<br />');

      return `
        <li>
          <h2>${answerLabel}</h2>
          <p class="answer-line">${answerTextValue}</p>
        </li>
      `;
    }).join('');

    const htmlDocument = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${escapedTitle} - Print</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; margin: 32px; line-height: 1.5; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { margin: 0 0 12px; }
            ol { padding-left: 24px; }
            li { margin-bottom: 28px; }
            h2 { font-size: 18px; margin: 0 0 8px; }
            .answer-line { margin: 0 0 8px; }
          </style>
        </head>
        <body>
          <h1>${escapedTitle}</h1>
          <p>Printed answer list with saved responses.</p>
          <ol>${answerMarkup}</ol>
        </body>
      </html>`;

    // Use a hidden iframe in the current page to render and print.
    // This avoids ERR_FILE_NOT_FOUND issues that some browsers show when
    // opening blob: URLs in a new tab/window.
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        win.focus();
        win.print();
      } catch (err) {
        setRateFeedback('Could not open the print dialog.');
      } finally {
        cleanup();
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      setRateFeedback('Could not prepare the print view.');
      return;
    }
    doc.open();
    doc.write(htmlDocument);
    doc.close();
  };

  return (
    <div className="dashboard">
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{successMsg}</div>
      )}

      <div className="dashboard-header">
        <h1>{selectedTitle || `Welcome, ${user?.name || 'Business Owner'}`}</h1>
      </div>

      {saveTrace && (
        <div className="question-page-summary" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-dark)' }}>
              Save trace: {saveTrace.status}
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Action: {saveTrace.source === 'next' ? 'Next Question' : saveTrace.source === 'previous' ? 'Previous Question' : 'Save Answer'}
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Title: {saveTrace.title}
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Question: {saveTrace.questionNumber}
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Result: {saveTrace.message}
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Time: {saveTrace.time}
            </div>
          </div>
        </div>
      )}

      <TierBanner tier={account?.tier || tier} tierExpiry={account?.tierExpiry || tierExpiry} isAdmin={isAdmin} />

      {focus === 'print' ? (
        <section className="question-card" id="print-panel">
          <h2>Print</h2>
          <p>Print all saved answers for {selectedTitle || 'your workspace'}.</p>
          {loadingAnswers ? <p role="status">Loading saved answers...</p> : answersError ? (
            <div role="alert">
              <p>{answersError}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchSavedAnswers}>Try Again</button>
            </div>
          ) : printableAnswers.length === 0 ? <p>Save an answer to print it here.</p> : (
            <>
              <button type="button" className="btn btn-primary" onClick={printAnswers}>Print All Answers</button>
              <ol>{printableAnswers.map((answer, index) => (
                <li key={answer._id || index} style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{answer.answerText}</li>
              ))}</ol>
            </>
          )}
          {rateFeedback && <p role="status">{rateFeedback}</p>}
        </section>
      ) : focus === 'grade' ? (
        <GradePanel
          answers={displayedAnswers}
          divisor={selectedDivisor}
          divisorOptions={divisorOptions}
          onDivisorChange={setSelectedDivisor}
          onGradeChange={saveGrade}
          savingGradeId={savingGradeId}
          gradeFeedback={gradeFeedback}
          selectedTitle={selectedTitle}
        />
      ) : focus === 'rate' ? (
        <RatePanel
          answers={displayedAnswers}
          onPrintAnswers={printAnswers}
          onRateChange={saveRate}
          rateFeedback={rateFeedback}
          selectedTitle={selectedTitle}
          activeTier={activeTier}
        />
      ) : focus === 'average' ? (
        <AveragePanel
          answers={displayedAnswers}
          activeTier={activeTier}
          selectedTitle={selectedTitle}
          totalQuestions={totalQ}
        />
      ) : (
        <Questions
          activeTitle={activeTitle}
          clientTitle={clientTitle}
          questions={questions}
          question={question}
          selectedQuestionId={selectedQuestionId}
          feedback={feedback}
          loadingQ={loadingQ}
          totalQ={totalQ}
          totalPages={totalPages}
          page={page}
          maxQ={maxQ}
          tier={tier}
          answerText={answerText}
          savingAnswer={savingAnswer}
          canGoPrev={page > 1}
          canGoNext={page < Math.min(totalPages, maxQ)}
          onAnswerChange={setAnswerText}
          onSaveAnswer={saveAnswer}
          onPrevQuestion={() => goToAdjacentQuestion(-1)}
          onNextQuestion={() => goToAdjacentQuestion(1)}
          onSelectQuestion={selectQuestion}
          onFetchPage={goToPage}
          onBackToTitles={() => navigate('/list')}
        />
      )}
    </div>
  );
}
