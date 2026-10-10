"use client";
import { useState } from "react";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }
  async function resend() {
    setLoading(true);
    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to resend reset link.");
    }
    setLoading(false);
  }
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <a className="wordmark" href="/">
          <img className="mark-logo" src="/regsure-mark.svg" alt="" />
          <span>regsure</span>
        </a>
        <p className="kicker">
          <span className="kicker-line" />
          Account recovery
        </p>
        <h1>
          Find your way
          <br />
          <em>back in.</em>
        </h1>
        {sent ? (
          <>
            {error && <p className="form-error">{error}</p>}
            <p className="dashboard-lede">
              If an account exists for that email, reset instructions are on the
              way.
            </p>
            <button type="button" className="auth-resend" onClick={resend} disabled={loading}>
              {loading ? "Sending..." : "Resend reset link"}
            </button>
          </>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
              />
            </label>
            <button className="button dark" disabled={loading}>
              {loading ? "Sending..." : "Send reset link ↗"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
