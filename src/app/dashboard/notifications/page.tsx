"use client";
import { useEffect, useState } from "react";
import Ably from "ably";
export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let realtime: Ably.Realtime | undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    fetch("/api/notifications", { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Unable to load notifications.");
        setItems(d.notifications || []);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError(reason.message || "Unable to load notifications.");
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });
    const tokenRequest = process.env.NEXT_PUBLIC_ABLY_SUBSCRIBE_TOKEN
      ? Promise.resolve({ token: process.env.NEXT_PUBLIC_ABLY_SUBSCRIBE_TOKEN })
      : fetch("/api/notifications/token").then((r) => (r.ok ? r.json() : null));
    tokenRequest.then((token) => {
      if (!token) return;
      realtime = new Ably.Realtime({
        authCallback: (_, cb) => cb(null, token),
      });
      realtime.connection.once("connected", () =>
        fetch("/api/businesses")
          .then((r) => r.json())
          .then((d) => {
            const id = d.businesses?.[0]?.id;
            if (id)
              realtime?.channels
                .get(`business:${id}:notifications`)
                .subscribe("notification", (m) =>
                  setItems((x) => [m.data, ...x]),
                );
          }),
      );
    });
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      realtime?.close();
    };
  }, []);
  async function read(id: number) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((x) =>
      x.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
  }
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Notifications
      </p>
      <h1>
        Keep the right
        <br />
        <em>signals close.</em>
      </h1>
      <p className="dashboard-lede">
        Billing, stock, and account updates arrive here in real time.
      </p>
      {loading && (
        <div
          className="dashboard-loading notification-loading"
          aria-busy="true"
        >
          <span className="loading-line loading-kicker" />
          <span className="loading-block loading-title" />
          <span className="loading-line loading-copy" />
          <div className="loading-grid">
            <span className="loading-card" />
            <span className="loading-card" />
          </div>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {!loading && (
        <div className="data-list">
          {items.length ? (
            items.map((n) => (
              <button
                className="data-row"
                key={n.id}
                onClick={() => read(n.id)}
              >
                <strong>{n.title}</strong>
                <span>
                  {n.read_at ? "Read" : "New"} · {n.body}
                </span>
              </button>
            ))
          ) : (
            <div className="empty-dashboard">
              <h2>No notifications yet.</h2>
              <p>Important workspace updates will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
