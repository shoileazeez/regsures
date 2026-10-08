"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "../../ToastBridge";
export default function Verify() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      showToast("Email verified. Your Regsure workspace is ready.");
      router.push("/dashboard");
    } else setError(d.error || "Invalid code.");
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
          Check your inbox
        </p>
        <h1>
          One small
          <br />
          <em>step.</em>
        </h1>
        <p className="dashboard-lede">
          We sent a six-digit verification code to {email}.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Verification code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="000000"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button dark" disabled={loading}>
            {loading ? "Verifying email..." : "Verify email ↗"}
          </button>
        </form>
      </div>
    </main>
  );
}
