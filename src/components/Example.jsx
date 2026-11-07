export function Example({ items, page, totalPages, onPrev, onNext }) {
  return (
    <section className="sub-panel">
      <div className="panel-head">
        <h3>Example</h3>
      </div>

      <div className="qa-list">
        {items.map((example, index) => (
          <article key={`${example}-${index}`} className="qa-item muted">
            <span className="small-tag">Example {index + 1}</span>
            <p>{example}</p>
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
