"use client";
import { useEffect, useState } from "react";
export default function Billing() {
  const [b, setB] = useState<any>(null),
    [status, setStatus] = useState(""),
    [historyFilter, setHistoryFilter] = useState("all");
  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then(setB);
    const p = new URLSearchParams(location.search),
      id = p.get("transaction_id");
    if (id) {
      setStatus("Payment verification in progress...");
      fetch("/api/payments/flutterwave/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, reference: p.get("tx_ref") }),
      }).then((r) => {
        setStatus(r.ok ? "Plan renewal confirmed." : "Payment needs review.");
        window.history.replaceState({}, "", "/dashboard/billing");
        fetch("/api/billing")
          .then((x) => x.json())
          .then(setB);
      });
    }
  }, []);
  async function pay(plan: string) {
    setStatus("Opening secure checkout...");
    const r = await fetch("/api/payments/flutterwave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await r.json();
    if (d.checkoutUrl) location.href = d.checkoutUrl;
    else setStatus(d.error || "Unable to start payment.");
  }
  async function reverify(reference: string) {
    setStatus("Checking payment status...");
    const response = await fetch("/api/payments/flutterwave/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const data = await response.json();
    setStatus(
      response.ok && data.status !== "already_processed"
        ? "Payment verified and plan updated."
        : response.ok
          ? "Payment was already processed."
          : data.error || "Payment could not be verified.",
    );
    const billing = await fetch("/api/billing", { cache: "no-store" });
    if (billing.ok) setB(await billing.json());
  }
  if (!b)
    return (
      <div className="dashboard-content">
        <div
          className="dashboard-loading"
          aria-busy="true"
          aria-label="Loading billing"
        >
          <span className="loading-line loading-kicker" />
          <span className="loading-block loading-title" />
          <span className="loading-line loading-copy" />
          <span className="loading-line loading-copy loading-copy-short" />
          <div className="loading-panel">
            <span className="loading-line" />
            <span className="loading-block loading-card-title" />
            <span className="loading-line loading-card-copy" />
          </div>
          <div className="loading-grid">
            <span className="loading-card" />
            <span className="loading-card" />
            <span className="loading-card" />
          </div>
        </div>
      </div>
    );
  const plan = b.plan?.plan || "free";
  const expires = b.plan?.plan_expires_at
    ? new Date(b.plan.plan_expires_at).toLocaleDateString()
    : "No paid plan expiry";
  const history = (b.history || []).filter(
    (item: any) =>
      historyFilter === "all" ||
      item.status === historyFilter ||
      item.plan === historyFilter,
  );
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Plans and billing
      </p>
      <h1>
        Your plan,
        <br />
        <em>made visible.</em>
      </h1>
      <p className="dashboard-lede">
        Only the business owner pays. Members use the active business plan
        without separate subscriptions.
      </p>
      <section className="current-plan">
        <h2>
          Current plan: <em>{plan}</em>
        </h2>
        <p>
          {plan === "free"
            ? "Inventory, sales, customers, and weekly overview are included."
            : `Renews or expires on ${expires}. A seven-day grace period applies after expiry.`}
        </p>
        {b.owner && (
          <div>
            {plan === "free" && (
              <button className="button dark" onClick={() => pay("basic")}>
                Upgrade to Basic
              </button>
            )}
            {plan === "free" && (
              <button className="button dark" onClick={() => pay("pro")}>
                Upgrade to Pro
              </button>
            )}
            {plan === "basic" && (
              <button className="button dark" onClick={() => pay("pro")}>
                Upgrade to Pro
              </button>
            )}
            {plan === "pro" && (
              <button className="button dark" onClick={() => pay("pro")}>
                Renew Pro
              </button>
            )}
          </div>
        )}
      </section>
      <div className="billing-plans">
        <article>
          <h2>Free</h2>
          <p>
            Inventory, sales, customers, and weekly overview. No team
            invitations, branches, or WhatsApp assistant.
          </p>
          {plan === "free" && (
            <span className="current-plan-badge">Current plan</span>
          )}
        </article>
        <article>
          <h2>Basic</h2>
          <p>
            Monthly analytics, restock planning, and up to two team members.
            WhatsApp assistant and branches are not included.
          </p>
          {plan === "basic" ? (
            <span className="current-plan-badge">Current plan</span>
          ) : b.owner ? (
            <button className="button dark" onClick={() => pay("basic")}>
              {plan === "free" ? "Upgrade to Basic" : "Change to Basic"}
            </button>
          ) : null}
        </article>
        <article className="billing-featured">
          <h2>Pro</h2>
          <p>
            Unlimited team members, WhatsApp assistant, branches, permissions,
            and advanced reporting.
          </p>
          {plan === "pro" ? (
            <span className="current-plan-badge">Current plan</span>
          ) : b.owner ? (
            <button className="button dark" onClick={() => pay("pro")}>
              Upgrade to Pro
            </button>
          ) : null}
        </article>
      </div>
      {status && <p className="payment-status">{status}</p>}
      <section className="data-list">
        <div className="billing-history-heading">
          <div>
            <p className="kicker">
              <span className="kicker-line" /> Transactions
            </p>
            <h2>Billing history</h2>
          </div>
          <select
            value={historyFilter}
            onChange={(event) => setHistoryFilter(event.target.value)}
            aria-label="Filter billing history"
          >
            <option value="all">All payments</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        {history.length ? (
          history.map((x: any) => {
            const paidAt = new Date(x.created_at);
            const paidExpiry = new Date(paidAt);
            paidExpiry.setMonth(paidExpiry.getMonth() + 1);
            return (
              <div className="data-row billing-history-row" key={x.id}>
                <div>
                  <strong>
                    {x.plan} · ₦{Number(x.amount).toLocaleString()}
                  </strong>
                  <small>Payment date: {paidAt.toLocaleDateString()}</small>
                </div>
                <div>
                  <span className={`billing-status billing-status-${x.status}`}>
                    {x.status}
                  </span>
                  <small>
                    Coverage ends: {paidExpiry.toLocaleDateString()}
                  </small>
                </div>
                {b.owner && x.status === "pending" && (
                  <div className="billing-payment-actions">
                    <button
                      className="text-link"
                      onClick={() => reverify(x.provider_reference)}
                    >
                      Reverify
                    </button>
                    <button className="text-link" onClick={() => pay(x.plan)}>
                      Retry payment
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p>No matching payments found.</p>
        )}
      </section>
    </div>
  );
}
