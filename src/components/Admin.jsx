export function Admin() {
  return (
    <section className="admin-section">
      <div className="section-heading">
        <p className="eyebrow">Admin dashboard</p>
        <h2>AI-generated business questions and admin controls.</h2>
      </div>

      <div className="admin-shell">
        <div className="button-row admin-actions">
          {['free', 'print', 'save', 'question', 'grade', 'rated', 'answers', 'average', 'save answers', 'save grade', 'save rated', 'save all', 'delete'].map((item) => (
            <button key={item} type="button" className="chip-button admin-chip">
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
