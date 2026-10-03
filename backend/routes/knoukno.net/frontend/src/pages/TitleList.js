import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

const EMPTY = { businessTitle: '', industry: '', location: '', description: '' };

export default function TitleList() {
  const [form, setForm] = useState(EMPTY);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/titles', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load business titles.');
      setTitles(data.titles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const change = (event) => {
    setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/api/titles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save business title.');
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event, title) => {
    event.stopPropagation();
    if (!window.confirm(`Delete ${title.businessTitle} and its saved answers?`)) return;
    try {
      const res = await apiFetch(`/api/titles/${title._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not delete business title.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const open = (title) => {
    localStorage.setItem('kk_active_business_title', title.businessTitle);
    navigate(`/dashboard?${new URLSearchParams({ clientTitle: title.businessTitle, tab: 'questions' }).toString()}`);
  };

  return (
    <section className="title-list-page">
      <header className="title-list-header">
        <p className="title-list-eyebrow">Title</p>
        <h1>Name the business</h1>
        <p>Everything starts here. Add the title, trade, and location. Your questions and saved answers stay under the business you choose.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="business-title-form" onSubmit={submit}>
        <div className="business-title-fields">
          <div className="form-group business-title-primary">
            <label className="form-label" htmlFor="businessTitle">Business title</label>
            <input id="businessTitle" name="businessTitle" className="form-control" value={form.businessTitle} onChange={change} placeholder="Kno U Kno Coffee House" maxLength="120" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="industry">Industry</label>
            <input id="industry" name="industry" className="form-control" value={form.industry} onChange={change} placeholder="Food and drink" maxLength="120" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="location">Location</label>
            <input id="location" name="location" className="form-control" value={form.location} onChange={change} placeholder="Atlanta, GA" maxLength="120" />
          </div>
          <div className="form-group business-title-description">
            <label className="form-label" htmlFor="description">What is the business?</label>
            <textarea id="description" name="description" className="form-control" rows="3" value={form.description} onChange={change} placeholder="Two sentences on what you sell and who buys it." maxLength="1000" />
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save business title'}</button>
      </form>

      <h2 className="title-list-subheading">Your business titles</h2>
      {loading ? <div className="spinner-wrap"><div className="spinner"></div></div> : (
        titles.length === 0 ? (
          <div className="empty-state"><h3>No business title yet</h3><p>Write one above and it will show up here.</p></div>
        ) : (
          <div className="title-list-grid">
            {titles.map(title => (
              <article className="title-list-card" key={title._id} role="button" tabIndex="0" onClick={() => open(title)} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && open(title)}>
                <div>
                  <h3>{title.businessTitle}</h3>
                  <p>{[title.industry, title.location].filter(Boolean).join(' · ') || 'No details yet'}</p>
                  <small>{title.answerCount || 0} saved {(title.answerCount || 0) === 1 ? 'answer' : 'answers'}</small>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={(event) => remove(event, title)}>Delete</button>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  );
}
