"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Suspense } from "react";
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-page" />}>
      <ResetPassword />
    </Suspense>
  );
}
function ResetPassword() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token"), password }),
    });
    const d = await r.json();
    if (r.ok) router.push("/auth/login");
    else setError(d.error || "Unable to reset password.");
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
          New password
        </p>
        <h1>
          Make it
          <br />
          <em>secure.</em>
        </h1>
        <form className="auth-form" onSubmit={submit}>
          <label>
            New password
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button dark">Save password ↗</button>
        </form>
      </div>
    </main>
  );
}
