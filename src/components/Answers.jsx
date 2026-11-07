export function Answers({ items, page, totalPages, onPrev, onNext }) {
  return (
    <section className="sub-panel">
      <div className="panel-head">
        <h3>Answers</h3>
      </div>

      <div className="qa-list">
        {items.map((answer, index) => (
          <article key={`${answer}-${index}`} className="qa-item answer-item">
            <span className="small-tag">Answer {index + 1}</span>
            <p>{answer}</p>
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
