export function Questions({ items, page, totalPages, onPrev, onNext }) {
  return (
    <section className="sub-panel">
      <div className="panel-head">
        <h3>Questions</h3>
      </div>

      <div className="qa-list">
        {items.map((question, index) => (
          <article key={`${question}-${index}`} className="qa-item">
            <span className="small-tag">Question {index + 1}</span>
            <p>{question}</p>
          </article>
        ))}
      </div>

      <div className="pager">
        <button type="button" onClick={onPrev}>Prev</button>
        <span>{page} / {totalPages}</span>
        <button type="button" onClick={onNext}>Next</button>
      </div>
    </section>
  )
}
