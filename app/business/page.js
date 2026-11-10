'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { clearSession, getSession } from '../../lib/auth-client'
import { gradePoints, gradeSummary, questionAt } from '../../lib/business-workflow'
import { aiQuestions } from '../../lib/site-data'

export default function BusinessPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('titles')
  const [title, setTitle] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answerText, setAnswerText] = useState('')
  const [grade, setGrade] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const business = businesses.find((item) => item.id === selectedId)

  const request = useCallback(async (method, body) => {
    const token = getSession()?.token
    if (!token) {
      router.replace('/login')
      throw new Error('Please sign in again.')
    }
    const response = await fetch('/api/businesses', {
      method,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const result = await response.json()
    if (response.status === 401) {
      clearSession()
      router.replace('/login')
    }
    if (!response.ok) throw new Error(result.error || 'Unable to complete the request.')
    return result
  }, [router])

  useEffect(() => {
    let active = true
    request('GET')
      .then((result) => { if (active) setBusinesses(result.businesses) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [request])

  useEffect(() => {
    const answer = business?.answers.find((item) => item.questionIndex === questionIndex)
    setAnswerText(answer?.text || '')
    setGrade(answer?.grade || '')
  }, [business, questionIndex])

  async function createBusiness(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request('POST', { title })
      setBusinesses((current) => [...current, result.business])
      setTitle('')
      setNotice('Business title saved. Select it to open the dashboard.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateBusiness(payload, successMessage) {
    if (!business || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request('PATCH', { id: business.id, version: business.version, ...payload })
      setBusinesses((current) => current.map((item) => item.id === result.business.id ? result.business : item))
      setNotice(successMessage)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function moveAnswer(from, to) {
    if (!business || from === to || to < 0 || to >= business.answers.length) return
    const order = business.answers.map((answer) => answer.questionIndex)
    const [item] = order.splice(from, 1)
    order.splice(to, 0, item)
    updateBusiness({ action: 'reorder', order }, 'Ranking saved.')
  }

  function changeView(nextView) {
    setError('')
    setNotice('')
    setView(nextView)
  }

  const summary = gradeSummary(business?.answers || [])

  return (
    <div className="page-shell narrow-shell">
      <header className="site-header business-site-header">
        <Link href="/" className="brand-mark-wrap">Kno U Kno</Link>
        <nav className="main-nav business-nav" aria-label="Business navigation">
          <button type="button" onClick={() => changeView('titles')}>Title</button>
          <button type="button" disabled={!business} onClick={() => changeView('dashboard')}>Dashboard</button>
          <button type="button" disabled={!business} onClick={() => changeView('questions')}>Questions</button>
          <button type="button" disabled={!business} onClick={() => changeView('grade')}>Grade</button>
          <button type="button" disabled={!business} onClick={() => changeView('rated')}>Rated</button>
          <button type="button" disabled={!business} onClick={() => changeView('average')}>Average</button>
          <button type="button" className="nav-logout" onClick={() => { clearSession(); router.replace('/login') }}>Logout</button>
        </nav>
      </header>

      <main className="business-workflow">
        {error && <p className="business-message business-error" role="alert">{error}</p>}
        {notice && <p className="business-message" role="status">{notice}</p>}
        {loading ? <p>Loading business titles...</p> : view === 'titles' ? (
          <section className="business-card">
            <h1>Business titles</h1>
            <form onSubmit={createBusiness} className="business-form">
              <label htmlFor="business-title">Business title</label>
              <input id="business-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
              <button type="submit" disabled={busy}>Save title</button>
            </form>
            <h2>Your titles</h2>
            {businesses.length === 0 ? <p>No business titles yet.</p> : (
              <ul className="business-list">
                {businesses.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => { setSelectedId(item.id); setQuestionIndex(0); changeView('dashboard') }}>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : business ? (
          <section className="business-card">
            {view === 'dashboard' && <>
              <h1>{business.title}</h1>
              <p>Open the questions and examples to write and grade your answers.</p>
              <button type="button" onClick={() => changeView('questions')}>Questions and examples</button>
            </>}
            {view === 'questions' && <>
              <h1>{business.title}: Questions</h1>
              <p>Question {questionIndex + 1} of {aiQuestions.length}</p>
              <h2>{questionAt(questionIndex).question}</h2>
              <p>{questionAt(questionIndex).example || 'No sample example is available for this question.'}</p>
              <form className="business-form" onSubmit={(event) => { event.preventDefault(); updateBusiness({ action: 'answer', questionIndex, text: answerText, grade: grade || null }, 'Answer saved.') }}>
                <label htmlFor="answer">Your answer</label>
                <textarea id="answer" value={answerText} onChange={(event) => setAnswerText(event.target.value)} maxLength={10000} required rows={5} />
                <label htmlFor="grade">Grade</label>
                <select id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} required>
                  <option value="">Select a grade</option>
                  {Object.entries(gradePoints).map(([letter, points]) => <option key={letter} value={letter}>{letter} = {points}</option>)}
                </select>
                <button type="submit" disabled={busy}>Save answer</button>
              </form>
              <div className="business-pagination">
                <button type="button" disabled={busy || questionIndex === 0} onClick={() => { setQuestionIndex((current) => current - 1); setNotice('') }}>Previous</button>
                <button type="button" disabled={busy || questionIndex === aiQuestions.length - 1} onClick={() => { setQuestionIndex((current) => current + 1); setNotice('') }}>Next</button>
              </div>
              <p>Save your answer before changing questions.</p>
            </>}
            {view === 'grade' && <>
              <h1>Grades: {business.title}</h1>
              <p>Total grade points: <strong>{summary.total}</strong> ({summary.count} graded answers)</p>
              <AnswerList answers={business.answers} />
            </>}
            {view === 'rated' && <>
              <h1>Ranked answers: {business.title}</h1>
              <p>Drag answers or use the move buttons to change their order.</p>
              {business.answers.length === 0 ? <p>No saved answers yet.</p> : <ol className="business-ranking">
                {business.answers.map((answer, index) => (
                  <li key={answer.questionIndex} draggable={!busy}
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); if (draggedIndex !== null) moveAnswer(draggedIndex, index); setDraggedIndex(null) }}>
                    <strong>{questionAt(answer.questionIndex).question}</strong>
                    <p>{answer.text}</p>
                    <div className="business-pagination">
                      <button type="button" disabled={busy || index === 0} onClick={() => moveAnswer(index, index - 1)}>Move up</button>
                      <button type="button" disabled={busy || index === business.answers.length - 1} onClick={() => moveAnswer(index, index + 1)}>Move down</button>
                    </div>
                  </li>
                ))}
              </ol>}
            </>}
            {view === 'average' && <>
              <h1>Average: {business.title}</h1>
              <p>{summary.average === null ? 'No graded answers yet.' : <>Average grade points: <strong>{summary.average.toFixed(2)} / 4</strong> across {summary.count} graded answers.</>}</p>
            </>}
          </section>
        ) : <p>Select a business title first.</p>}
      </main>
    </div>
  )
}

function AnswerList({ answers }) {
  if (!answers.length) return <p>No saved answers yet.</p>
  return <ol className="business-ranking">
    {answers.map((answer) => <li key={answer.questionIndex}>
      <strong>{questionAt(answer.questionIndex).question}</strong>
      <p>{answer.text}</p>
      <p>Grade: {answer.grade ? `${answer.grade} = ${gradePoints[answer.grade]}` : 'Not graded'}</p>
    </li>)}
  </ol>
}
