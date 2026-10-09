"use client";
import { useEffect, useMemo, useState } from "react";
type Item = { id: number; name: string; quantity: number; price: number };
type Customer = { id: number; name: string };
type Line = { item: Item; quantity: number; discountPerUnit: number };
export default function Sales() {
  const [sales, setSales] = useState<any[]>([]),
    [items, setItems] = useState<Item[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [open, setOpen] = useState(false),
    [itemId, setItemId] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [customerId, setCustomerId] = useState(""),
    [cart, setCart] = useState<Line[]>([]),
    [discount, setDiscount] = useState("0"),
    [loan, setLoan] = useState(false),
    [amountPaid, setAmountPaid] = useState("0"),
    [filter, setFilter] = useState("all"),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [selectedSale, setSelectedSale] = useState<any>(null),
    [paymentSale, setPaymentSale] = useState<any>(null),
    [paymentAmount, setPaymentAmount] = useState(""),
    [paymentSaving, setPaymentSaving] = useState(false);
  const load = () =>
    Promise.all([
      fetch("/api/sales"),
      fetch("/api/inventory"),
      fetch("/api/customers"),
    ]).then(async ([s, i, c]) => {
      const salesData = await s.json();
      const inventoryData = await i.json();
      const customersData = await c.json();
      if (!s.ok) throw new Error(salesData.error || "Unable to load sales.");
      setSales(salesData.sales || []);
      setItems(inventoryData.items || []);
      setCustomers(customersData.customers || []);
    });
  useEffect(() => {
    load().catch((e) => setMessage(e.message)).finally(() => setLoading(false));
  }, []);
  const subtotal = useMemo(
    () => cart.reduce((n, l) => n + (l.item.price - l.discountPerUnit) * l.quantity, 0),
    [cart],
  );
  const total = Math.max(0, subtotal - Number(discount || 0));
  function add(e: React.FormEvent) {
    e.preventDefault();
    const item = items.find((x) => String(x.id) === itemId),
      n = Number(quantity);
    if (!item || n < 1 || n > item.quantity) return;
    setCart((x) => [
      ...x.filter((l) => l.item.id !== item.id),
      { item, quantity: n, discountPerUnit: 0 },
    ]);
    setItemId("");
    setQuantity("1");
  }
  async function record(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || null,
        items: cart.map((l) => ({
          inventoryItemId: l.item.id,
          quantity: l.quantity,
          unitPrice: l.item.price,
          discountPerUnit: l.discountPerUnit,
        })),
        discount,
        loan,
        amountPaid,
        notes: "",
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error);
      setSaving(false);
      return;
    }
    setMessage("Sale recorded.");
    setOpen(false);
    setCart([]);
    await load();
    setSaving(false);
  }
  async function settle(s: any) {
    setPaymentSale(s);
    setPaymentAmount(String(s.amount_paid || 0));
  }
  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentSale) return;
    setPaymentSaving(true);
    const r = await fetch("/api/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: paymentSale.id, amountPaid: paymentAmount }),
    });
    if (r.ok) { setPaymentSale(null); await load(); }
    else setMessage((await r.json()).error || "Unable to update payment.");
    setPaymentSaving(false);
  }
  const shown = sales.filter((s) => filter === "all" || s.status === filter);
  return (
    <div className="dashboard-content">
      <div className="dashboard-top">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Sales records
          </p>
          <h1>
            Every sale
            <br />
            <em>has a signal.</em>
          </h1>
        </div>
        <button className="button dark" onClick={() => setOpen(true)}>
          Add sale +
        </button>
      </div>
      <div className="sales-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partially paid</option>
        </select>
      </div>
      {loading && <div className="dashboard-loading"><span className="loading-block loading-title" /><span className="loading-line loading-copy" /><div className="loading-grid"><span className="loading-card" /><span className="loading-card" /></div></div>}
      {open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <h2>Record sale</h2>
            <form onSubmit={add} className="inline-create">
              <select
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                <option value="">Product</option>
                {items.map((i) => (
                  <option disabled={!i.quantity} value={i.id} key={i.id}>
                    {i.name} · {i.quantity} left
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <button className="button light">Add product</button>
            </form>
            {cart.map((l) => (
              <div className="data-row" key={l.item.id}>
                <strong>
                  {l.item.name} × {l.quantity} · ₦{l.discountPerUnit.toLocaleString()} off each
                </strong>
                <input type="number" min="0" max={l.item.price} placeholder="Discount per item" value={l.discountPerUnit} onChange={(e) => setCart(cart.map((line) => line.item.id === l.item.id ? { ...line, discountPerUnit: Number(e.target.value) || 0 } : line))} />
                <button
                  className="text-link"
                  onClick={() =>
                    setCart(cart.filter((x) => x.item.id !== l.item.id))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {cart.length > 0 && (
              <form onSubmit={record} className="inline-create">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Walk-in customer</option>
                  {customers.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={loan}
                    onChange={(e) => setLoan(e.target.checked)}
                  />{" "}
                  Loan / unpaid
                </label>
                {loan && (
                  <input
                    type="number"
                    min="0"
                    placeholder="Amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                )}
                <button className="button dark" disabled={saving}>
                  Record ₦
                  {(loan
                    ? Math.max(0, total - Number(amountPaid || 0))
                    : total
                  ).toLocaleString()}{saving ? " · Saving..." : ""}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <p className="payment-status">{message}</p>
      {!loading && <div className="data-list">
        {shown.length ? (
          shown.map((s) => (
            <div className="data-row" key={s.id} onClick={() => setSelectedSale(s)} role="button" tabIndex={0}>
              <strong>
                ₦{Number(s.total).toLocaleString()} ·{" "}
                {s.customer_name || "Walk-in"}
              </strong>
              <span>
                {s.status} · {s.salesperson_name || "Staff"}{" "}
                {s.status !== "completed" && (
                  <button className="text-link" onClick={() => settle(s)}>
                    Record payment
                  </button>
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-dashboard">
            <h2>No matching sales.</h2>
            <p>Record a sale or change the status filter.</p>
          </div>
        )}
      </div>}
      {selectedSale && <div className="modal-backdrop" onClick={() => setSelectedSale(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelectedSale(null)}>×</button><h2>Sale details</h2><p>Status: {selectedSale.status}</p><p>Total: ₦{Number(selectedSale.total).toLocaleString()}</p><p>Customer: {selectedSale.customer_name || "Walk-in"}</p><p>Salesperson: {selectedSale.salesperson_name || "Staff"}</p><p>Paid: ₦{Number(selectedSale.amount_paid || 0).toLocaleString()}</p><p>Outstanding: ₦{Math.max(0, Number(selectedSale.total) - Number(selectedSale.amount_paid || 0)).toLocaleString()}</p><p>Recorded: {new Date(selectedSale.created_at).toLocaleString("en-NG")}</p>{selectedSale.status !== "completed" && <button className="button dark" onClick={() => { setSelectedSale(null); settle(selectedSale); }}>Update payment</button>}</div></div>}
      {paymentSale && <div className="modal-backdrop" onClick={() => setPaymentSale(null)}><form className="modal-card" onSubmit={savePayment} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setPaymentSale(null)}>×</button><h2>Update payment</h2><p>Sale total: ₦{Number(paymentSale.total).toLocaleString()}</p><input type="number" min="0" max={paymentSale.total} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Total amount paid" required /><button className="button dark" disabled={paymentSaving}>{paymentSaving ? "Saving..." : "Save payment"}</button><button type="button" className="button light" onClick={() => setPaymentSale(null)}>Cancel</button></form></div>}
    </div>
  );
}
