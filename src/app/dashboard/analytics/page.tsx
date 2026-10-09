"use client";
import { useEffect, useState } from "react";
export default function Analytics() {
  const [unlocked, setUnlocked] = useState(false), [data, setData] = useState<any>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { fetch("/api/plans").then((r) => r.json()).then((plan) => setUnlocked(plan.analytics !== false)).catch(() => undefined); fetch("/api/analytics").then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const weekly = data?.weekly || [];
  const monthly = data?.monthly || [];
  const bestSellers = data?.bestSellers || [];
  const maxWeekly = Math.max(...weekly.map((item: any) => Number(item.total)), 1);
  const maxMonthly = Math.max(...monthly.map((item: any) => Number(item.total)), 1);
  const maxSeller = Math.max(...bestSellers.map((item: any) => Number(item.quantity)), 1);
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Business intelligence
      </p>
      <h1>
        See the pattern,
        <br />
        <em>not just the sale.</em>
      </h1>
      <p className="dashboard-lede">
        Analytics turns your records into the questions worth asking about your
        products, customers, and next month.
      </p>
      {loading ? <div className="dashboard-loading"><span className="loading-block loading-title" /><span className="loading-line loading-copy" /><div className="loading-grid"><span className="loading-card" /><span className="loading-card" /></div></div> : error ? <p className="form-error">{error}</p> : unlocked ? (
        <div className="analytics-panels">
          <div className="dashboard-card-large">
            <div className="analytics-card-heading"><div><h2>Weekly sales</h2><p>Last eight weeks</p></div></div>
            {weekly.length ? <div className="sales-chart" aria-label="Weekly sales chart">
              {weekly.slice().reverse().map((item: any) => <div className="sales-chart-column" key={item.week}>
                <span className="sales-chart-value">₦{Number(item.total).toLocaleString()}</span>
                <div className="sales-chart-track"><i style={{ height: `${Math.max((Number(item.total) / maxWeekly) * 100, 4)}%` }} /></div>
                <small>{new Date(item.week).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</small>
              </div>)}
            </div> : <div className="analytics-empty">No weekly sales yet.</div>}
            <p className="analytics-footnote">{data?.summary?.transactions || 0} transactions this month</p>
          </div>
          <div className="dashboard-card-large">
            <div className="analytics-card-heading"><div><h2>Monthly sales</h2><p>Last six months</p></div><strong>₦{Number(data?.summary?.total || 0).toLocaleString()}</strong></div>
            {monthly.length ? <div className="sales-chart" aria-label="Monthly sales chart">
              {monthly.slice().reverse().map((item: any) => <div className="sales-chart-column" key={item.month}>
                <span className="sales-chart-value">₦{Number(item.total).toLocaleString()}</span>
                <div className="sales-chart-track"><i className="sales-chart-month-bar" style={{ height: `${Math.max((Number(item.total) / maxMonthly) * 100, 4)}%` }} /></div>
                <small>{new Date(item.month).toLocaleDateString("en-NG", { month: "short" })}</small>
              </div>)}
            </div> : <div className="analytics-empty">No monthly sales yet.</div>}
            <p className="analytics-footnote">Monthly totals include completed and outstanding recorded sales.</p>
          </div>
          <div className="dashboard-card-large">
            <div className="analytics-card-heading"><div><h2>Best sellers</h2><p>Units sold this month</p></div></div>
            {bestSellers.length ? <div className="seller-chart">
              {bestSellers.map((item: any) => <div className="seller-row" key={item.name}><div className="seller-row-label"><strong>{item.name}</strong><span>{item.quantity} units · ₦{Number(item.revenue).toLocaleString()}</span></div><div className="seller-track"><i style={{ width: `${Math.max((Number(item.quantity) / maxSeller) * 100, 4)}%` }} /></div></div>)}
            </div> : <div className="analytics-empty">No itemised sales yet.</div>}
          </div>
        </div>
      ) : (
        <div className="locked-card">
          <span className="lock-mark">◇</span>
          <h2>Analytics is part of Basic</h2>
          <p>
            Upgrade when you are ready to compare periods, understand best
            sellers, and plan with more confidence.
          </p>
          <a className="button dark" href="/dashboard/billing">
            View plans <span>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
