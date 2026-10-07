import Link from "next/link";
import AuthForm from "../AuthForm";
export default function Login() {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <a className="wordmark" href="/">
          <img className="mark-logo" src="/regsure-mark.svg" alt="" />
          <span>regsure</span>
        </a>
        <p className="kicker">
          <span className="kicker-line" />
          Welcome back
        </p>
        <h1>
          Good to see
          <br />
          <em>you again.</em>
        </h1>
        <AuthForm mode="login" />
        <p className="auth-switch">
          New to Regsure? <Link href="/auth/signup">Create your account</Link>
        </p>
      </div>
    </main>
  );
}
