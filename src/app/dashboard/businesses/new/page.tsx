"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function NewBusiness() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("free");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Creating your workspace...");
    const r = await fetch("/api/businesses/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan }),
    });
    const d = await r.json();
    if (r.ok) {
      const switched = await fetch("/api/businesses/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: d.business.id }),
      });
      if (!switched.ok) {
        setError("Business was created, but could not be selected.");
      } else if (d.requestedPlan !== "free") {
        setStatus(`Preparing your ${d.requestedPlan} plan payment...`);
        const payment = await fetch("/api/payments/flutterwave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: d.requestedPlan }),
        });
        const paymentData = await payment.json();
        if (payment.ok && paymentData.checkoutUrl) {
          setStatus("Redirecting you to secure payment...");
          window.location.href = paymentData.checkoutUrl;
          return;
        }
        setError(
          paymentData.error ||
            "Business created, but payment could not be started.",
        );
      } else {
        setStatus("Workspace created. Opening dashboard...");
        window.location.assign("/dashboard");
      }
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
        <fieldset className="business-plan-picker">
          <legend>Choose a starting plan</legend>
          <div className="business-plan-grid">
            {[
              [
                "free",
                "Free",
                "₦0",
                "Inventory, sales, customers, and weekly overview.",
              ],
              [
                "basic",
                "Basic",
                "₦15,000 / month",
                "Monthly analytics, restock planning, and up to two team members.",
              ],
              [
                "pro",
                "Pro",
                "₦35,000 / month",
                "Unlimited team members, branches, advanced reporting, and WhatsApp assistant.",
              ],
            ].map(([value, title, price, features]) => (
              <label className={plan === value ? "selected" : ""} key={value}>
                <input
                  type="radio"
                  name="plan"
                  value={value}
                  checked={plan === value}
                  onChange={() => setPlan(value)}
                />
                <strong>{title}</strong>
                <b>{price}</b>
                <span>{features}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        {status && <p className="payment-status">{status}</p>}
        <button className="button dark" disabled={loading}>
          {loading
            ? plan === "free"
              ? "Creating workspace..."
              : "Starting secure checkout..."
            : "Create business ↗"}
        </button>
      </form>
    </div>
  );
}
