"use client";
import { useEffect, useMemo, useState } from "react";
type Item = { id: number; name: string; quantity: number; price: number };
type Customer = { id: number; name: string };
type Line = { item: Item; quantity: number };
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
    [message, setMessage] = useState("");
  const load = () =>
    Promise.all([
      fetch("/api/sales"),
      fetch("/api/inventory"),
      fetch("/api/customers"),
    ]).then(async ([s, i, c]) => {
      setSales((await s.json()).sales || []);
      setItems((await i.json()).items || []);
      setCustomers((await c.json()).customers || []);
    });
  useEffect(() => {
    load();
  }, []);
  const subtotal = useMemo(
    () => cart.reduce((n, l) => n + l.item.price * l.quantity, 0),
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
      { item, quantity: n },
    ]);
    setItemId("");
    setQuantity("1");
  }
  async function record(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || null,
        items: cart.map((l) => ({
          inventoryItemId: l.item.id,
          quantity: l.quantity,
          unitPrice: l.item.price,
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
      return;
    }
    setMessage("Sale recorded.");
    setOpen(false);
    setCart([]);
    load();
  }
  async function settle(s: any) {
    const paid = prompt("Amount received", String(s.total - s.amount_paid));
    if (paid === null) return;
    const r = await fetch("/api/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, amountPaid: paid }),
    });
    if (r.ok) load();
    else setMessage((await r.json()).error || "Unable to update payment.");
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
                  {l.item.name} × {l.quantity}
                </strong>
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
                <button className="button dark">
                  Record ₦
                  {(loan
                    ? Math.max(0, total - Number(amountPaid || 0))
                    : total
                  ).toLocaleString()}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <p className="payment-status">{message}</p>
      <div className="data-list">
        {shown.length ? (
          shown.map((s) => (
            <div className="data-row" key={s.id}>
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
      </div>
    </div>
  );
}
