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
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
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
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (r.ok) {
      setCustomers([d.customer, ...customers]);
      setForm({
        name: "",
        email: "",
        phone: "",
        customerType: "retail",
        creditLimit: "",
        notes: "",
      });
      setOpen(false);
    }
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
        <button className="button dark" onClick={() => setOpen(true)}>
          Add customer +
        </button>
      </div>
      <input
        className="search-field"
        placeholder="Search customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
            <h2>Add customer</h2>
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
            <button className="button dark">Save customer</button>
          </form>
        </div>
      )}
      <div className="data-list">
        {shown.map((c) => (
          <div className="data-row" key={c.id}>
            <strong>{c.name}</strong>
            <span>
              {c.customer_type} · Outstanding ₦
              {Number(c.outstanding_balance).toLocaleString()} ·{" "}
              {c.purchase_count} purchases
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
