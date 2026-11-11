'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { clearSession, getSession } from '../../lib/auth-client'
import { gradePoints, gradeSummary, questionAt, questionPageIndices, rankingDraft } from '../../lib/business-workflow'
import { aiQuestions } from '../../lib/site-data'

export default function BusinessPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('titles')
  const [title, setTitle] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answerText, setAnswerText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [rankingDrafts, setRankingDrafts] = useState({})
  const business = businesses.find((item) => item.id === selectedId)
  const rankingOrder = business ? rankingDraft(business.answers, rankingDrafts[business.id]) : []
  const rankedAnswers = business ? rankingOrder.map((index) => business.answers.find((answer) => answer.questionIndex === index)) : []
  const rankingChanged = business && rankingOrder.some((index, position) => index !== business.answers[position].questionIndex)
  const hasRankingDrafts = Object.keys(rankingDrafts).length > 0

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
  }, [business, questionIndex])

  useEffect(() => {
    if (!hasRankingDrafts) return
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasRankingDrafts])

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
    if (!business || busy) return false
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request('PATCH', { id: business.id, version: business.version, ...payload })
      setBusinesses((current) => current.map((item) => item.id === result.business.id ? result.business : item))
      setNotice(successMessage)
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  function moveAnswer(from, to) {
    if (!business || busy || from === to || from < 0 || from >= rankingOrder.length || to < 0 || to >= rankingOrder.length) return
    const order = [...rankingOrder]
    const [item] = order.splice(from, 1)
    order.splice(to, 0, item)
    setRankingDrafts((current) => {
      const next = { ...current }
      if (order.every((index, position) => index === business.answers[position].questionIndex)) delete next[business.id]
      else next[business.id] = order
      return next
    })
    setNotice('')
    setError('')
  }

  async function saveRanking() {
    if (!business || !rankingChanged || busy) return
    const id = business.id
    if (await updateBusiness({ action: 'reorder', order: rankingOrder }, 'Ranking saved.')) {
      setRankingDrafts((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
    }
  }

  function confirmLeave() {
    return !hasRankingDrafts || window.confirm('You have unsaved ranking changes. Leave without saving?')
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
        <Link href="/" className="brand-mark-wrap" onClick={(event) => { if (!confirmLeave()) event.preventDefault() }}>Kno U Kno</Link>
        <nav className="main-nav business-nav" aria-label="Business navigation">
          <button type="button" onClick={() => changeView('titles')}>Title</button>
          <button type="button" disabled={!business} onClick={() => changeView('dashboard')}>Dashboard</button>
          <button type="button" disabled={!business} onClick={() => changeView('questions')}>Questions</button>
          <button type="button" disabled={!business} onClick={() => changeView('tasks')}>Tasks</button>
          <button type="button" disabled={!business} onClick={() => changeView('grade')}>Grade</button>
          <button type="button" disabled={!business} onClick={() => changeView('rated')}>Rated</button>
          <button type="button" disabled={!business} onClick={() => changeView('average')}>Average</button>
          <button type="button" className="nav-logout" onClick={() => { if (confirmLeave()) { clearSession(); router.replace('/login') } }}>Logout</button>
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
              <p>Open the questions and examples to write your answers, then assign grades on the Grade page.</p>
              <button type="button" onClick={() => changeView('questions')}>Questions and examples</button>
              <button type="button" onClick={() => changeView('tasks')}>Tasks</button>
              <button type="button" onClick={() => window.print()}>Print saved answers</button>
              <p>The print report includes saved answers and ranking, not unsaved changes.</p>
            </>}
            {view === 'tasks' && <PersonalTasks key={business.id} business={business} />}
            {view === 'questions' && <>
              <h1>{business.title}: Questions</h1>
              <p>Question {questionIndex + 1} of {aiQuestions.length}</p>
              <h2>{questionAt(questionIndex).question}</h2>
              <p>{questionAt(questionIndex).example || 'No sample example is available for this question.'}</p>
              <form className="business-form" onSubmit={(event) => { event.preventDefault(); updateBusiness({ action: 'answer', questionIndex, text: answerText }, 'Answer saved. Assign its grade on the Grade page.') }}>
                <label htmlFor="answer">Your answer</label>
                <textarea id="answer" value={answerText} onChange={(event) => setAnswerText(event.target.value)} maxLength={10000} required rows={5} />
                <button type="submit" disabled={busy}>Save answer</button>
              </form>
              <nav className="business-pagination" aria-label="Question pagination">
                <button type="button" disabled={busy || questionIndex === 0} onClick={() => { setQuestionIndex((current) => current - 1); setNotice('') }}>Previous</button>
                {questionPageIndices(questionIndex, aiQuestions.length).map((index) => (
                  <button type="button" key={index} disabled={busy} aria-label={`Question ${index + 1}`}
                    aria-current={index === questionIndex ? 'page' : undefined}
                    onClick={() => { setQuestionIndex(index); setNotice('') }}>{index + 1}</button>
                ))}
                <button type="button" disabled={busy || questionIndex === aiQuestions.length - 1} onClick={() => { setQuestionIndex((current) => current + 1); setNotice('') }}>Next</button>
              </nav>
              <p>Save your answer before changing questions.</p>
            </>}
            {view === 'grade' && <>
              <h1>Grades: {business.title}</h1>
              <p>Total grade points: <strong>{summary.total}</strong> ({summary.count} graded answers)</p>
              <p>Ungraded answers are excluded from the total and average.</p>
              <AnswerList answers={business.answers} busy={busy} onGrade={(questionIndex, grade) => updateBusiness({ action: 'grade', questionIndex, grade }, 'Grade saved.')} />
            </>}
            {view === 'rated' && <>
              <h1>Ranked answers: {business.title}</h1>
              <p>Drag answers or use the move buttons, then select Save ranking. Unsaved changes are lost if you leave or reload.</p>
              {rankingChanged && <p role="status">You have unsaved ranking changes.</p>}
              {business.answers.length === 0 ? <p>No saved answers yet.</p> : <ol className="business-ranking">
                {rankedAnswers.map((answer, index) => (
                  <li key={answer.questionIndex} draggable={!busy}
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); if (draggedIndex !== null) moveAnswer(draggedIndex, index); setDraggedIndex(null) }}>
                    <strong>{questionAt(answer.questionIndex).question}</strong>
                    <p>{answer.text}</p>
                    <div className="business-pagination">
                      <button type="button" disabled={busy || index === 0} onClick={() => moveAnswer(index, index - 1)}>Move up</button>
                      <button type="button" disabled={busy || index === rankedAnswers.length - 1} onClick={() => moveAnswer(index, index + 1)}>Move down</button>
                    </div>
                  </li>
                ))}
              </ol>}
              <button type="button" disabled={busy || !rankingChanged} onClick={saveRanking}>Save ranking</button>
            </>}
            {view === 'average' && <>
              <h1>Average: {business.title}</h1>
              <p>{summary.average === null ? 'No graded answers yet.' : <>Average grade points: <strong>{summary.average.toFixed(2)} / 4</strong> across {summary.count} graded answers.</>}</p>
            </>}
          </section>
        ) : <p>Select a business title first.</p>}
      </main>
      {business && <section className="business-print-report" aria-label="Saved business answers">
        <h1>{business.title}</h1>
        <h2>Saved answers</h2>
        <p>Total grade points: {summary.total} ({summary.count} graded answers)</p>
        <p>{summary.average === null ? 'No graded answers yet.' : `Average grade points: ${summary.average.toFixed(2)} / 4`}</p>
        <p>Answers are listed in saved ranking order. Ungraded answers are excluded from the total and average.</p>
        {business.answers.length === 0 ? <p>No saved answers yet.</p> : <ol>
          {business.answers.map((answer) => <li key={answer.questionIndex}>
            <h3>Question {answer.questionIndex + 1}: {questionAt(answer.questionIndex).question}</h3>
            <p className="business-print-answer">{answer.text}</p>
            <p>Grade: {answer.grade ? `${answer.grade} = ${gradePoints[answer.grade]}` : 'Not graded'}</p>
          </li>)}
        </ol>}
      </section>}
    </div>
  )
}

function PersonalTasks({ business }) {
  const [tasks, setTasks] = useState([])
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const request = useCallback(async (method, body, currentPage = 0, signal) => {
    const token = getSession()?.token
    if (!token) throw new Error('Please sign in again.')
    const params = new URLSearchParams({ businessId: business.id, page: String(currentPage) })
    const response = await fetch(`/api/tasks?${params}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
      signal,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unable to access tasks.')
    return result
  }, [business.id])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    request('GET', null, page, controller.signal)
      .then((result) => setTasks(result.tasks))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, request])

  async function createTask(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request('POST', { name, due_date: dueDate })
      setName('')
      setDueDate('')
      setNotice('Task saved.')
      if (page !== 0) setPage(0)
      else setTasks((await request('GET', null, 0)).tasks)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.name}"?`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request('DELETE', { slug: task.slug })
      setTasks((current) => current.filter((item) => item.slug !== task.slug))
      setNotice('Task deleted.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <h1>Tasks: {business.title}</h1>
    <p>Tasks are private to your account and this business.</p>
    {error && <p className="business-message business-error" role="alert">{error}</p>}
    {notice && <p className="business-message" role="status">{notice}</p>}
    <form className="business-form" onSubmit={createTask}>
      <label htmlFor="task-name">Task name</label>
      <input id="task-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
      <label htmlFor="task-due">Due date</label>
      <input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
      <button type="submit" disabled={busy}>Save task</button>
    </form>
    {loading ? <p>Loading tasks...</p> : tasks.length === 0 ? <p>No tasks on this page.</p> :
      <ul className="business-ranking">{tasks.map((task) => <li key={task.slug}>
        <strong>{task.name}</strong><p>Due: {task.due_date}</p>
        <button type="button" disabled={busy} onClick={() => deleteTask(task)}>Delete task</button>
      </li>)}</ul>}
    <div className="business-pagination">
      <button type="button" disabled={busy || loading || page === 0} onClick={() => setPage((current) => current - 1)}>Previous</button>
      <span>Page {page + 1}</span>
      <button type="button" disabled={busy || loading || tasks.length < 20 || page === 50} onClick={() => setPage((current) => current + 1)}>Next</button>
    </div>
  </>
}

function AnswerList({ answers, busy, onGrade }) {
  if (!answers.length) return <p>No saved answers yet.</p>
  return <ol className="business-ranking">
    {answers.map((answer) => <li key={answer.questionIndex}>
      <strong>{questionAt(answer.questionIndex).question}</strong>
      <p>{answer.text}</p>
      <p>Grade: {answer.grade ? `${answer.grade} = ${gradePoints[answer.grade]}` : 'Not graded'}</p>
      <form className="business-form" onSubmit={(event) => {
        event.preventDefault()
        onGrade(answer.questionIndex, new FormData(event.currentTarget).get('grade'))
      }}>
        <label htmlFor={`grade-${answer.questionIndex}`}>Assign grade</label>
        <select id={`grade-${answer.questionIndex}`} name="grade" defaultValue={answer.grade || ''} required disabled={busy}>
          <option value="">Select a grade</option>
          {Object.entries(gradePoints).map(([letter, points]) => <option key={letter} value={letter}>{letter} = {points}</option>)}
        </select>
        <button type="submit" disabled={busy}>Save grade</button>
      </form>
    </li>)}
  </ol>
}
