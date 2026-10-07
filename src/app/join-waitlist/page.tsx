"use client";
import { FormEvent, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
export default function Join() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="join-page">
        <div className="shell join-page-inner">
          <div>
            <p className="kicker">
              <span className="kicker-line" />
              Regsure product updates
            </p>
            <h1>
              Make the next business
              <br />
              decision with <em>clarity.</em>
            </h1>
            <p>
              Get practical updates about new Regsure features, operating ideas,
              and tools for running a healthier business.
            </p>
            <div className="join-promise">
              <span>01</span>
              <p>Product updates that respect your inbox.</p>
              <span>02</span>
              <p>
                A chance to help shape the tools your business actually needs.
              </p>
              <span>03</span>
              <p>Clear information before you choose a plan.</p>
            </div>
          </div>
          <div className="join-side">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1000&q=85"
              alt="Small business owner working at a counter"
            />
            <form className="join-form" onSubmit={submit}>
              <label htmlFor="join-email">Your work email</label>
              <input
                id="join-email"
                type="email"
                required
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="button dark" disabled={status === "loading"}>
                {status === "loading"
                  ? "Saving..."
                  : status === "success"
                    ? "You’re on the list ✓"
                    : "Get product updates ↗"}
              </button>
              <small>
                {status === "error"
                  ? "We could not save that yet. Please try again."
                  : status === "success"
                    ? `Thanks, ${email}. We’ll be in touch.`
                    : "We will only email when there is something worth opening."}
              </small>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
