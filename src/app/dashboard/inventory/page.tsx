"use client";
import { useEffect, useState } from "react";
type Item = {
  id: number;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  cost_price: number;
  category?: string;
  unit_of_measure?: string;
  description?: string;
};
export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const empty = {
    name: "",
    sku: "",
    quantity: "",
    price: "",
    costPrice: "",
    category: "",
    unitOfMeasure: "unit",
    description: "",
  };
  const [form, setForm] = useState<any>(empty);
  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);
  function show(item?: Item) {
    setEditing(item || null);
    setForm(
      item
        ? {
            name: item.name,
            sku: item.sku || "",
            quantity: item.quantity,
            price: item.price,
            costPrice: item.cost_price,
            category: item.category || "",
            unitOfMeasure: item.unit_of_measure || "unit",
            description: item.description || "",
          }
        : empty,
    );
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/inventory", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    });
    const d = await r.json();
    if (r.ok) {
      setItems(
        editing
          ? items.map((x) => (x.id === editing.id ? d.item : x))
          : [d.item, ...items],
      );
      setOpen(false);
    }
  }
  const shown = items.filter(
    (x) =>
      x.name.toLowerCase().includes(query.toLowerCase()) ||
      x.sku?.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="dashboard-content">
      <div className="dashboard-top">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Stock control
          </p>
          <h1>
            Inventory that
            <br />
            <em>tells the truth.</em>
          </h1>
        </div>
        <button className="button dark" onClick={() => show()}>
          Add item +
        </button>
      </div>
      <input
        className="search-field"
        placeholder="Search name or SKU"
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
            <h2>{editing ? "Edit item" : "Add inventory item"}</h2>
            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="SKU / barcode"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Opening stock"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Selling price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              type="number"
              min="0"
              placeholder="Cost price"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <input
              placeholder="Unit of measure"
              value={form.unitOfMeasure}
              onChange={(e) =>
                setForm({ ...form, unitOfMeasure: e.target.value })
              }
            />
            <textarea
              placeholder="Product description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <button className="button dark">Save item</button>
          </form>
        </div>
      )}
      <div className="data-list">
        {shown.length ? (
          shown.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.quantity} {item.unit_of_measure} · ₦
                {Number(item.price).toLocaleString()}{" "}
                <button className="text-link" onClick={() => show(item)}>
                  Edit
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="empty-dashboard">
            <h2>Your inventory starts here.</h2>
            <button className="button dark" onClick={() => show()}>
              Add your first item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
