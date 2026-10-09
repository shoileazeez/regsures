"use client";
import { useEffect, useState } from "react";
type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  credit_limit: number;
  outstanding_balance: number;
  purchase_count: number;
  notes?: string;
};
type Purchase = { id: number; total: number; status: string; amount_paid: number; discount: number; created_at: string; payment_date?: string; branch_name?: string };
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Customer | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [details, setDetails] = useState<{ customer: Customer; purchases: Purchase[] } | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    phone: "",
    customerType: "retail",
    creditLimit: "",
    notes: "",
  });
  useEffect(() => {
    fetch("/api/customers")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Unable to load customers.");
        setCustomers(d.customers || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  function show(customer?: Customer) {
    setEditing(customer || null);
    setForm(customer ? {
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      customerType: customer.customer_type || "retail",
      creditLimit: customer.credit_limit || "",
      notes: customer.notes || "",
    } : { name: "", email: "", phone: "", customerType: "retail", creditLimit: "", notes: "" });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/customers", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    });
    const d = await r.json();
    if (r.ok) {
      setCustomers(editing ? customers.map((c) => c.id === editing.id ? { ...c, ...d.customer } : c) : [d.customer, ...customers]);
      setForm({
        name: "",
        email: "",
        phone: "",
        customerType: "retail",
        creditLimit: "",
        notes: "",
      });
      setOpen(false);
    } else setError(d.error || "Unable to save customer.");
    setSaving(false);
  }
  async function viewDetails(customer: Customer) {
    setError("");
    const response = await fetch(`/api/customers?id=${customer.id}`);
    const data = await response.json();
    if (response.ok) setDetails(data);
    else setError(data.error || "Unable to load customer details.");
  }
  const shown = customers.filter((c) =>
    `${c.name} ${c.email || ""} ${c.phone || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="dashboard-content">
      <div className="dashboard-top">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Customer records
          </p>
          <h1>
            People who
            <br />
            <em>keep coming back.</em>
          </h1>
        </div>
        <button className="button dark" onClick={() => show()}>
          Add customer +
        </button>
      </div>
      <input
        className="search-field"
        placeholder="Search customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      {loading && <div className="dashboard-loading"><span className="loading-block loading-title" /><span className="loading-line loading-copy" /><div className="loading-grid"><span className="loading-card" /><span className="loading-card" /></div></div>}
      {open && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={save}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2>{editing ? "Edit customer" : "Add customer"}</h2>
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              value={form.customerType}
              onChange={(e) =>
                setForm({ ...form, customerType: e.target.value })
              }
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="business">Business</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="Credit limit"
              value={form.creditLimit}
              onChange={(e) =>
                setForm({ ...form, creditLimit: e.target.value })
              }
            />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="button" className="button light" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
            <button className="button dark" disabled={saving}>{saving ? "Saving..." : "Save customer"}</button>
          </form>
        </div>
      )}
      {!loading && <div className="data-list">
        {shown.map((c) => (
          <div className="data-row" key={c.id}>
            <strong>{c.name}</strong>
            <span>
              {c.customer_type} · Outstanding ₦
              {Number(c.outstanding_balance ?? 0).toLocaleString()} ·{" "}
              {c.purchase_count} purchases
              <button className="text-link" onClick={() => show(c)}>Edit</button>
              <button className="text-link" onClick={() => viewDetails(c)}>View details</button>
            </span>
          </div>
        ))}
      </div>}
      {details && <div className="modal-backdrop" onClick={() => setDetails(null)}><div className="modal-card customer-details" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setDetails(null)}>×</button><h2>{details.customer.name}</h2><p>{details.customer.phone || "No phone"} · {details.customer.email || "No email"}</p><p>Credit limit: ₦{Number(details.customer.credit_limit || 0).toLocaleString()} · Outstanding: ₦{Number(details.customer.outstanding_balance || 0).toLocaleString()}</p><h3>Purchase history</h3>{details.purchases.length ? details.purchases.map((purchase) => <div className="data-row" key={purchase.id}><strong>₦{Number(purchase.total).toLocaleString()}</strong><span>{purchase.status} · {purchase.branch_name || "All branches"} · {new Date(purchase.created_at).toLocaleDateString("en-NG")}</span></div>) : <p>No purchases recorded yet.</p>}</div></div>}
    </div>
  );
}
