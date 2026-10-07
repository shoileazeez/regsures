"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function NewBusiness() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await fetch("/api/businesses/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan }),
    });
    const d = await r.json();
    if (r.ok) {
      await fetch("/api/businesses/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: d.business.id }),
      });
      router.push("/dashboard");
    } else setError(d.error || "Unable to create business.");
    setLoading(false);
  }
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        New workspace
      </p>
      <h1>
        Give the next idea
        <br />
        <em>its own room.</em>
      </h1>
      <p className="dashboard-lede">
        Create a separate business workspace with its own inventory, customers,
        sales, branches, and plan. Your existing business data will stay
        separate.
      </p>
      <form className="new-business-form" onSubmit={submit}>
        <label>
          Business name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="For example, Ada’s Fashion"
          />
        </label>
        <label>
          Starting plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="free">Free · Essentials</option>
            <option value="basic">Basic · Analytics and WhatsApp</option>
            <option value="pro">Pro · Teams and branches</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="button dark" disabled={loading}>
          {loading ? "Creating..." : "Create business ↗"}
        </button>
      </form>
    </div>
  );
}
