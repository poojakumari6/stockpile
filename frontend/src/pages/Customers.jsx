import { useEffect, useState } from "react";
import { api } from "../api";
import { IconPlus, IconTrash } from "../components/Icons";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";
import { Empty, Loading } from "../components/ui.jsx";

const BLANK = { full_name: "", email: "", phone: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.full_name.trim()) e.full_name = "Name is required";
  if (!f.email.trim()) e.email = "Email is required";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email";
  if (!f.phone.trim()) e.phone = "Phone is required";
  return e;
}

export default function Customers() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await api.listCustomers());
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
    setForm(BLANK);
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await api.createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast.success("Customer added");
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.full_name}"? Their orders will also be removed.`)) return;
    try {
      await api.deleteCustomer(c.id);
      toast.success("Customer deleted");
      setItems((list) => list.filter((x) => x.id !== c.id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">{items.length} registered customer{items.length !== 1 ? "s" : ""}.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus width={17} height={17} /> Add customer
        </button>
      </div>

      <div className="content">
        <div className="panel">
          {loading ? (
            <Loading label="Loading customers…" />
          ) : items.length === 0 ? (
            <Empty title="No customers yet" hint="Add a customer before creating orders." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-strong">{c.full_name}</td>
                      <td className="mono">{c.email}</td>
                      <td className="mono">{c.phone}</td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button className="icon-btn danger" onClick={() => remove(c)} aria-label="Delete">
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
          title="Add customer"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Add customer"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Full name</label>
            <input className={errors.full_name ? "invalid" : ""} value={form.full_name} onChange={set("full_name")} placeholder="e.g. Priya Sharma" />
            {errors.full_name && <span className="err">{errors.full_name}</span>}
          </div>
          <div className="field">
            <label>Email address</label>
            <input className={errors.email ? "invalid" : ""} value={form.email} onChange={set("email")} placeholder="name@example.com" />
            {errors.email && <span className="err">{errors.email}</span>}
            <span className="hint">Must be unique across all customers.</span>
          </div>
          <div className="field">
            <label>Phone number</label>
            <input className={errors.phone ? "invalid" : ""} value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </div>
        </Modal>
      )}
    </>
  );
}
