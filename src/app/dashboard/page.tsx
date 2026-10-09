"use client";
import { useEffect, useState } from "react";
import DashboardLoading from "./DashboardLoading";
type Overview = {
  businessName: string;
  summary: { sales: number; transactions: number; customers: number; unpaidSales: number; unpaidBalance: number };
  daily: Array<{ day: number; total: number }>;
};
export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = days.map(
    (_, i) => data?.daily.find((d) => d.day === i + 1)?.total || 0,
  );
  const max = Math.max(...values, 1);
  if (!data && !error) {
    return (
      <div className="dashboard-content">
        <DashboardLoading label="Loading business overview" />
      </div>
    );
  }
  return (
    <div className="dashboard-content">
      <div className="dashboard-top">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Your business overview
          </p>
          <h1>
            Good morning,
            <br />
            <em>{data?.businessName || "business"}.</em>
          </h1>
          <p className="dashboard-lede">
            A clear view of what has happened this week and what deserves your
            attention next.
          </p>
        </div>
        <a className="button dark" href="/dashboard/inventory">
          Add inventory <span>↗</span>
        </a>
      </div>
      {error && <p className="form-error">{error}</p>}
      <section className="dashboard-metrics">
        <div>
          <span>Sales this week</span>
          <strong>
            {data ? (
              `₦${data.summary.sales.toLocaleString()}`
            ) : (
              <span className="metric-skeleton" />
            )}
          </strong>
          <small>{data?.summary.transactions || 0} recorded transactions</small>
        </div>
        <div>
          <span>Customers</span>
          <strong>
            {data ? (
              data.summary.customers
            ) : (
              <span className="metric-skeleton" />
            )}
          </strong>
          <small>Saved in this business</small>
        </div>
        <div>
          <span>Records this week</span>
          <strong>
            {data ? (
              data.summary.transactions
            ) : (
              <span className="metric-skeleton" />
            )}
          </strong>
          <small>Sales ready for analysis</small>
        </div>
        <div className="dashboard-metric-warning">
          <span>Unpaid sales</span>
          <strong>{data ? data.summary.unpaidSales : <span className="metric-skeleton" />}</strong>
          <small>{data ? `₦${Number(data.summary.unpaidBalance).toLocaleString()} outstanding` : "Awaiting records"}</small>
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-card-large">
          <div className="card-heading">
            <h2>Sales overview</h2>
            <span>Last 7 days</span>
          </div>
          {data && data.summary.transactions === 0 ? (
            <div className="analytics-placeholder">
              Your sales chart will appear after you record your first sale.
            </div>
          ) : (
            <>
              <div className="large-chart">
                {values.map((value, index) => (
                  <i
                    key={days[index]}
                    style={{ height: `${Math.max((value / max) * 84, 6)}%` }}
                  />
                ))}
              </div>
              <div className="chart-axis">
                {days.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="attention-card">
          <div className="card-heading">
            <h2>Next step</h2>
            <span>Keep building</span>
          </div>
          <p className="attention-title">
            {data?.summary.transactions
              ? "Turn records into insight."
              : "Record your first sale."}
          </p>
          <p>
            {data?.summary.transactions
              ? "Add more item-level detail to make your analytics more useful over time."
              : "Start with the sale in front of you. Your overview will become more useful as your records grow."}
          </p>
          <a
            href={
              data?.summary.transactions
                ? "/dashboard/analytics"
                : "/dashboard/sales"
            }
          >
            {data?.summary.transactions
              ? "Open analytics ↗"
              : "Record a sale ↗"}
          </a>
        </div>
      </section>
    </div>
  );
}
