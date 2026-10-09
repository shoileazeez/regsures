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
  branch_id?: number | null;
  reorder_threshold_type?: "quantity" | "percent";
  reorder_threshold_value?: number;
};
type Branch = { id: number; name: string };
export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const empty = {
    name: "",
    sku: "",
    quantity: "",
    price: "",
    costPrice: "",
    category: "",
    unitOfMeasure: "unit",
    description: "",
    branchId: "",
    reorderThresholdType: "quantity",
    reorderThresholdValue: "",
  };
  const [form, setForm] = useState<any>(empty);
  useEffect(() => {
    Promise.all([fetch("/api/inventory"), fetch("/api/branches")])
      .then(async ([itemsResponse, branchesResponse]) => {
        const itemsData = await itemsResponse.json();
        const branchesData = await branchesResponse.json();
        if (!itemsResponse.ok) throw new Error(itemsData.error || "Unable to load inventory.");
        setItems(itemsData.items || []);
        setBranches(branchesData.branches || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
            branchId: item.branch_id || "",
            reorderThresholdType: item.reorder_threshold_type || "quantity",
            reorderThresholdValue: item.reorder_threshold_value || "",
          }
        : empty,
    );
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
    } else setError(d.error || "Unable to save inventory item.");
    setSaving(false);
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
            <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">All branches</option>
              {branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name} only</option>)}
            </select>
            <label className="form-label">Low-stock alert threshold</label>
            <div className="form-inline">
              <input
                type="number"
                min="0"
                max={form.reorderThresholdType === "percent" ? 100 : undefined}
                placeholder={form.reorderThresholdType === "percent" ? "10" : "10"}
                value={form.reorderThresholdValue}
                onChange={(e) => setForm({ ...form, reorderThresholdValue: e.target.value })}
              />
              <select value={form.reorderThresholdType} onChange={(e) => setForm({ ...form, reorderThresholdType: e.target.value })}>
                <option value="quantity">Units remaining</option>
                <option value="percent">Percent of opening stock</option>
              </select>
            </div>
            <button className="button dark" disabled={saving}>{saving ? "Saving..." : "Save item"}</button>
          </form>
        </div>
      )}
      {!loading && <div className="data-list">
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
      </div>}
    </div>
  );
}
