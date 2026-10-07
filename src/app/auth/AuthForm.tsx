"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "../ToastBridge";
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, platform: "web" }),
    });
    const data = await response.json();
    if (response.ok) {
      showToast(
        mode === "signup"
          ? "Account created. Check your email to verify it."
          : "Welcome back to Regsure.",
      );
      router.push(
        mode === "signup"
          ? `/auth/verify?email=${encodeURIComponent(email)}`
          : "/dashboard",
      );
    } else setError(data.error || "Please try again.");
    setLoading(false);
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "signup" && (
        <label>
          Business name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name or business"
          />
        </label>
      )}
      <label>
        Email address
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@yourbusiness.com"
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="button dark" disabled={loading}>
        {loading
          ? "Working..."
          : mode === "login"
            ? "Sign in ↗"
            : "Create account ↗"}
      </button>
    </form>
  );
}
