import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { IconEdit, IconPlus, IconTrash } from "../components/Icons";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";
import { Empty, Loading, StockBadge, money } from "../components/ui.jsx";

const BLANK = { name: "", sku: "", price: "", quantity: "" };

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = "Name is required";
  if (!form.sku.trim()) e.sku = "SKU is required";
  if (form.price === "" || isNaN(Number(form.price))) e.price = "Enter a valid price";
  else if (Number(form.price) < 0) e.price = "Price cannot be negative";
  if (form.quantity === "" || !Number.isInteger(Number(form.quantity)))
    e.quantity = "Enter a whole number";
  else if (Number(form.quantity) < 0) e.quantity = "Quantity cannot be negative";
  return e;
}

export default function Products() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await api.listProducts());
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

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity) });
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
        toast.success("Product updated");
      } else {
        await api.createProduct(payload);
        toast.success("Product created");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(p.id);
      toast.success("Product deleted");
      setItems((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const inventoryValue = useMemo(
    () => items.reduce((s, p) => s + Number(p.price) * p.quantity, 0),
    [items]
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">
            {items.length} item{items.length !== 1 ? "s" : ""} · {money(inventoryValue)} inventory value
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus width={17} height={17} /> Add product
        </button>
      </div>

      <div className="content">
        <div className="panel">
          {loading ? (
            <Loading label="Loading products…" />
          ) : items.length === 0 ? (
            <Empty title="No products yet" hint="Add your first product to start tracking inventory." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="cell-strong">{p.name}</td>
                      <td className="mono">{p.sku}</td>
                      <td className="num">{money(p.price)}</td>
                      <td><StockBadge qty={p.quantity} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="icon-btn" onClick={() => openEdit(p)} aria-label="Edit">
                            <IconEdit width={16} height={16} />
                          </button>
                          <button className="icon-btn danger" onClick={() => remove(p)} aria-label="Delete">
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

      {open && (
        <Modal
          title={editing ? "Edit product" : "Add product"}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Product name</label>
            <input className={errors.name ? "invalid" : ""} value={form.name} onChange={set("name")} placeholder="e.g. Stainless Water Bottle" />
            {errors.name && <span className="err">{errors.name}</span>}
          </div>
          <div className="field">
            <label>SKU / code</label>
            <input className={errors.sku ? "invalid" : ""} value={form.sku} onChange={set("sku")} placeholder="e.g. WB-500-STL" />
            {errors.sku && <span className="err">{errors.sku}</span>}
            <span className="hint">Must be unique across all products.</span>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Price</label>
              <input className={errors.price ? "invalid" : ""} value={form.price} onChange={set("price")} placeholder="0.00" inputMode="decimal" />
              {errors.price && <span className="err">{errors.price}</span>}
            </div>
            <div className="field">
              <label>Quantity in stock</label>
              <input className={errors.quantity ? "invalid" : ""} value={form.quantity} onChange={set("quantity")} placeholder="0" inputMode="numeric" />
              {errors.quantity && <span className="err">{errors.quantity}</span>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
