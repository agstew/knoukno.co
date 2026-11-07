export function RatedList({ items }) {
  return (
    <article className="metric-card">
      <div className="panel-head">
        <h3>Rated List</h3>
      </div>
      <ul className="metric-list">
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  )
}
