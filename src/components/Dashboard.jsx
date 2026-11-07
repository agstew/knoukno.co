export function Dashboard() {
  return (
    <section id="dashboard" className="dashboard-section">
      <div className="section-heading">
        <p className="eyebrow">Client dashboard</p>
        <h2>Business question board with print, save, grade, and review tools.</h2>
      </div>

      <div className="dashboard-shell">
        <div className="dashboard-panel">
          <div className="button-row">
            {['print', 'save', 'question', 'grade', 'rated', 'answers', 'average', 'save answers', 'save grade', 'save rated', 'save all', 'delete'].map((item) => (
              <button key={item} type="button" className="chip-button">
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
