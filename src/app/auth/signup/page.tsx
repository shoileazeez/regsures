import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "../AuthForm";
export default function Signup() {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <a className="wordmark" href="/">
          <img className="mark-logo" src="/regsure-mark.svg" alt="" />
          <span>regsure</span>
        </a>
        <p className="kicker">
          <span className="kicker-line" />
          Start with the essentials
        </p>
        <h1>
          Make room for
          <br />
          <em>better decisions.</em>
        </h1>
        <Suspense fallback={<div className="auth-form-loading" aria-busy="true">Loading…</div>}>
          <AuthForm mode="signup" />
        </Suspense>
        <p className="auth-switch">
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
