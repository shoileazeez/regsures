"use client";
import { useState } from "react";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
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
          <p className="dashboard-lede">
            If an account exists for that email, reset instructions are on the
            way.
          </p>
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
            <button className="button dark">Send reset link ↗</button>
          </form>
        )}
      </div>
    </main>
  );
}
