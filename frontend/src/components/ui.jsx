export const money = (v) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    Number(v || 0)
  );

export function StockBadge({ qty, threshold = 10 }) {
  if (qty <= 0) return <span className="badge out"><span className="badge-dot" />Out of stock</span>;
  if (qty <= threshold) return <span className="badge low"><span className="badge-dot" />Low · {qty}</span>;
  return <span className="badge ok"><span className="badge-dot" />In stock · {qty}</span>;
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="loading-row">
      <div className="spinner" />
      <div style={{ marginTop: 12 }}>{label}</div>
    </div>
  );
}

export function Empty({ title, hint }) {
  return (
    <div className="empty">
      <div className="em-title">{title}</div>
      {hint && <div>{hint}</div>}
    </div>
  );
}
