"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "../../ToastBridge";
export default function AcceptInvite() {
  const params = useSearchParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/team/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token"), name, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      showToast("Invitation accepted. Welcome to the workspace.");
      router.push(
        data.verificationRequired
          ? `/auth/verify?email=${encodeURIComponent(data.email)}`
          : "/dashboard",
      );
    } else setMessage(data.error || "Unable to accept invite.");
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
          You have been invited
        </p>
        <h1>
          Join the
          <br />
          <em>business.</em>
        </h1>
        <p className="dashboard-lede">
          Existing users should sign in first. New users can create an account
          here.
        </p>
        <form className="auth-form" onSubmit={accept}>
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (new users)"
            />
          </label>
          <label>
            Password for a new account
            <input
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if already signed in"
            />
          </label>
          {message && <p className="form-error">{message}</p>}
          <button className="button dark" disabled={loading}>
            {loading ? "Accepting invite..." : "Accept invite ↗"}
          </button>
        </form>
      </div>
    </main>
  );
}
