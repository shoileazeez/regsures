"use client";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const typeMeta: Record<string, { label: string; tone: string }> = {
  payment_success: { label: "Payments", tone: "payment" },
  subscription_expiry: { label: "Billing", tone: "billing" },
  subscription_expired: { label: "Billing", tone: "billing" },
  low_stock: { label: "Inventory", tone: "inventory" },
  unpaid_sale: { label: "Sales", tone: "sales" },
  sale_paid: { label: "Sales", tone: "sales" },
  invitation: { label: "Team", tone: "team" },
  system: { label: "Workspace", tone: "system" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const failSafe = window.setTimeout(() => {
      setLoading(false);
      setError(
        "Notifications took too long to load. Please sign in again and retry.",
      );
    }, 6000);
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
        window.clearTimeout(failSafe);
        setLoading(false);
      });
    const poll = window.setInterval(() => {
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.notifications) setItems(d.notifications);
        })
        .catch(() => undefined);
    }, 30000);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(failSafe);
      window.clearInterval(poll);
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
  async function markAllRead() {
    if (!items.some((item) => !item.read_at)) return;
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (response.ok) {
      const timestamp = new Date().toISOString();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || timestamp,
        })),
      );
    }
  }
  const unreadCount = items.filter((item) => !item.read_at).length;
  const typeOptions = Array.from(new Set(items.map((item) => item.type)));
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "unread" ? !item.read_at : Boolean(item.read_at));
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        const search = query.trim().toLowerCase();
        const matchesQuery =
          !search ||
          `${item.title} ${item.body}`.toLowerCase().includes(search);
        return matchesStatus && matchesType && matchesQuery;
      }),
    [items, query, statusFilter, typeFilter],
  );

  return (
    <div className="dashboard-content">
      <div className="notification-heading">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Notifications
          </p>
          <h1>
            Keep the right <em>signals close.</em>
          </h1>
          <p className="dashboard-lede">
            Billing, stock, and account updates arrive here in real time.
          </p>
        </div>
        <div className="notification-count">
          <strong>{unreadCount}</strong>
          <span>unread updates</span>
        </div>
      </div>
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
        <>
          <div className="notification-toolbar">
            <div
              className="notification-filters"
              role="group"
              aria-label="Filter notifications by status"
            >
              {(["all", "unread", "read"] as const).map((filter) => (
                <button
                  className={statusFilter === filter ? "is-active" : ""}
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter[0].toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <select
              aria-label="Filter notifications by type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All types</option>
              {typeOptions.map((type) => (
                <option value={type} key={type}>
                  {typeMeta[type]?.label || type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <input
              aria-label="Search notifications"
              placeholder="Search updates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="notification-mark-all"
              onClick={markAllRead}
              disabled={!unreadCount}
            >
              Mark all read
            </button>
          </div>
          <div className="notification-list">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const meta = typeMeta[item.type] || {
                  label: "Workspace",
                  tone: "system",
                };
                return (
                  <article
                    className={`notification-item ${item.read_at ? "is-read" : "is-unread"}`}
                    key={item.id}
                  >
                    <span
                      className={`notification-icon notification-icon-${meta.tone}`}
                      aria-hidden="true"
                    >
                      {meta.label.slice(0, 1)}
                    </span>
                    <div className="notification-copy">
                      <div className="notification-meta">
                        <span>{meta.label}</span>
                        <time dateTime={item.created_at}>
                          {formatDate(item.created_at)}
                        </time>
                      </div>
                      <h2>{item.title}</h2>
                      <p>{item.body}</p>
                    </div>
                    {!item.read_at && (
                      <button
                        className="notification-read"
                        onClick={() => read(item.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="empty-dashboard">
                <h2>
                  {items.length
                    ? "No updates match these filters."
                    : "No notifications yet."}
                </h2>
                <p>
                  {items.length
                    ? "Try a different status, type, or search term."
                    : "Important workspace updates will appear here."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
