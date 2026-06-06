import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { IconEye, IconPlus, IconTrash, IconX } from "../components/Icons";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";
import { Empty, Loading, money } from "../components/ui.jsx";

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: "1" }]);
  const [formError, setFormError] = useState("");

  const load = async () => {
    try {
      const [o, p, c] = await Promise.all([
        api.listOrders(),
        api.listProducts(),
        api.listCustomers(),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [String(p.id), p])),
    [products]
  );

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const p = productById[l.product_id];
      const qty = Number(l.quantity) || 0;
      return sum + (p ? Number(p.price) * qty : 0);
    }, 0);
  }, [lines, productById]);

  const openCreate = () => {
    setCustomerId("");
    setLines([{ product_id: "", quantity: "1" }]);
    setFormError("");
    setCreateOpen(true);
  };

  const updateLine = (i, key, value) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  const addLine = () => setLines((ls) => [...ls, { product_id: "", quantity: "1" }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async () => {
    setFormError("");
    if (!customerId) return setFormError("Please select a customer.");
    const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    if (validLines.length === 0)
      return setFormError("Add at least one product with a quantity.");

    // Client-side stock pre-check (backend re-validates authoritatively).
    for (const l of validLines) {
      const p = productById[l.product_id];
      if (p && Number(l.quantity) > p.quantity) {
        return setFormError(
          `Only ${p.quantity} of "${p.name}" in stock (requested ${l.quantity}).`
        );
      }
    }

    setSaving(true);
    try {
      await api.createOrder({
        customer_id: Number(customerId),
        items: validLines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
        })),
      });
      toast.success("Order created");
      setCreateOpen(false);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (id) => {
    try {
      setDetail(await api.getOrder(id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Cancel order #${o.id}? Stock will be returned to inventory.`)) return;
    try {
      await api.deleteOrder(o.id);
      toast.success("Order cancelled");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} placed.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={loading}>
          <IconPlus width={17} height={17} /> Create order
        </button>
      </div>

      <div className="content">
        <div className="panel">
          {loading ? (
            <Loading label="Loading orders…" />
          ) : orders.length === 0 ? (
            <Empty title="No orders yet" hint="Create an order to reduce stock automatically." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="cell-strong mono">#{o.id}</td>
                      <td>{o.customer?.full_name || `Customer ${o.customer_id}`}</td>
                      <td className="num">{o.items.reduce((s, it) => s + it.quantity, 0)}</td>
                      <td className="num cell-strong">{money(o.total_amount)}</td>
                      <td className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="icon-btn" onClick={() => viewDetail(o.id)} aria-label="View">
                            <IconEye width={16} height={16} />
                          </button>
                          <button className="icon-btn danger" onClick={() => remove(o)} aria-label="Cancel">
                            <IconTrash width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create order modal */}
      {createOpen && (
        <Modal
          title="Create order"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Placing…" : "Place order"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} · {c.email}</option>
              ))}
            </select>
            {customers.length === 0 && <span className="hint">No customers yet — add one first.</span>}
          </div>

          <div className="field">
            <label>Products</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lines.map((l, i) => {
                const p = productById[l.product_id];
                return (
                  <div className="line-row" key={i}>
                    <select value={l.product_id} onChange={(e) => updateLine(i, "product_id", e.target.value)}>
                      <option value="">Select product…</option>
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id} disabled={pr.quantity <= 0}>
                          {pr.name} — {money(pr.price)} ({pr.quantity} in stock)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max={p ? p.quantity : undefined}
                      value={l.quantity}
                      onChange={(e) => updateLine(i, "quantity", e.target.value)}
                    />
                    <button
                      className="icon-btn danger"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      aria-label="Remove line"
                    >
                      <IconX width={15} height={15} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, alignSelf: "flex-start" }} onClick={addLine}>
              <IconPlus width={15} height={15} /> Add another product
            </button>
          </div>

          <div className="line-total">
            <span className="lbl">Estimated total</span>
            <span className="amt">{money(estimatedTotal)}</span>
          </div>
          <span className="hint">
            The final total is calculated and confirmed by the backend when the order is placed.
          </span>

          {formError && <div className="field"><span className="err">{formError}</span></div>}
        </Modal>
      )}

      {/* Detail modal */}
      {detail && (
        <Modal
          title={`Order #${detail.id}`}
          onClose={() => setDetail(null)}
          footer={<button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>}
        >
          <div className="kv"><span className="k">Customer</span><span className="cell-strong">{detail.customer?.full_name}</span></div>
          <div className="kv"><span className="k">Email</span><span className="mono">{detail.customer?.email}</span></div>
          <div className="kv"><span className="k">Placed</span><span>{new Date(detail.created_at).toLocaleString()}</span></div>

          <div className="detail-list">
            {detail.items.map((it) => (
              <div className="detail-item" key={it.id}>
                <div className="detail-meta">
                  <span className="cell-strong">{it.product?.name}</span>
                  <span className="kv"><span className="k mono">{it.product?.sku}</span></span>
                </div>
                <div style={{ textAlign: "right" }} className="num">
                  <div>{it.quantity} × {money(it.unit_price)}</div>
                  <div className="cell-strong">{money(Number(it.unit_price) * it.quantity)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="line-total">
            <span className="lbl">Order total</span>
            <span className="amt">{money(detail.total_amount)}</span>
          </div>
        </Modal>
      )}
    </>
  );
}
