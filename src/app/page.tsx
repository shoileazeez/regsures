"use client";

import { useState } from "react";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";

const features = [
  {
    number: "01",
    title: "Stock that tells the truth",
    text: "See what is on the shelf, what is moving, and what needs a restock before it becomes a problem.",
  },
  {
    number: "02",
    title: "Sales with a story",
    text: "Turn daily transactions into a clear view of your best sellers, quiet days, and next good decision.",
  },
  {
    number: "03",
    title: "WhatsApp, built in",
    text: "Add goods, record a sale, or ask your business assistant for an update from the chat you already use.",
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function joinWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    const response = await fetch("/api/product-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) setSubmitted(true);
    else {
      const result = await response.json().catch(() => ({}));
      setSubmitError(
        result.error || "We could not save that yet. Please try again.",
      );
    }
    setIsSubmitting(false);
  }
  return (
    <main>
      <SiteHeader />
      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="kicker">
            <span className="kicker-line" />
            For the people behind the business
          </p>
          <h1>
            Run your shop
            <br />
            <em>with certainty.</em>
          </h1>
          <p className="hero-text">
            Regsure brings your stock, sales, customers, and weekly rhythm into
            one calm place, so you can spend less time guessing and more time
            growing.
          </p>
          <div className="hero-actions">
            <a className="button dark" href="/auth/signup">
              Start free <span>↗</span>
            </a>
            <a className="text-link" href="/why-regsure">
              See what it does <span>↗</span>
            </a>
          </div>
          <p className="hero-note">
            Made for local businesses, growing teams, and the people who do
            both.
          </p>
        </div>
        <div className="hero-visual">
          <div className="sunburst" />
          <div className="dashboard-card">
            <div className="dash-top">
              <div>
                <span className="tiny-label">THIS WEEK</span>
                <strong>Good morning, Ada.</strong>
              </div>
              <span className="avatar">A</span>
            </div>
            <div className="metric-row">
              <div>
                <span className="tiny-label">SALES</span>
                <b>₦284,500</b>
                <small className="up">↑ 12.4%</small>
              </div>
              <div>
                <span className="tiny-label">ITEMS MOVING</span>
                <b>148</b>
                <small>across 32 products</small>
              </div>
            </div>
            <div className="chart">
              <div className="chart-label">
                <span>Sales overview</span>
                <span>May 06 - 12</span>
              </div>
              <svg
                viewBox="0 0 450 130"
                preserveAspectRatio="none"
                aria-label="Sales chart"
              >
                <path
                  d="M0 105 C25 92 35 102 56 84 S92 88 108 68 S142 84 164 62 S192 76 215 42 S246 55 273 37 S305 59 333 24 S362 47 388 34 S420 20 450 8"
                  fill="none"
                  stroke="#dce84f"
                  strokeWidth="4"
                />
                <path
                  d="M0 105 C25 92 35 102 56 84 S92 88 108 68 S142 84 164 62 S192 76 215 42 S246 55 273 37 S305 59 333 24 S362 47 388 34 S420 20 450 8 L450 130 L0 130Z"
                  fill="url(#fade)"
                  opacity=".42"
                />
                <defs>
                  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#dce84f" />
                    <stop offset="1" stopColor="#dce84f" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="chart-days">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
          <div className="float-note">
            <span className="float-icon">↗</span>
            <span>
              <b>Restock reminder</b>
              <br />
              Palm oil is running low
            </span>
          </div>
        </div>
      </section>
      <section id="why" className="statement">
        <div className="shell statement-inner">
          <p className="kicker light">
            <span className="kicker-line" />
            The whole picture
          </p>
          <h2>Your business is more than a spreadsheet.</h2>
          <p>
            It is the early morning inventory check. The customer who always
            pays on Friday. The product that suddenly takes off. Regsure helps
            you notice the important things while they are still useful.
          </p>
        </div>
      </section>
      <section className="features shell">
        <div className="section-intro">
          <p className="kicker">
            <span className="kicker-line" />
            The useful bits
          </p>
          <h2>
            Everything in its
            <br />
            <em>right place.</em>
          </h2>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <span className="feature-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>
      <section id="whatsapp" className="whatsapp shell">
        <div className="chat-copy">
          <p className="kicker">
            <span className="kicker-line" />
            Your assistant, in your pocket
          </p>
          <h2>
            Ask your business
            <br />
            <em>anything.</em>
          </h2>
          <p>
            Not every update needs a dashboard. With Regsure on WhatsApp, you
            can say what happened in plain language and keep moving.
          </p>
          <div className="chat-example">
            <span className="chat-avatar">R</span>
            <div>
              <p>“How many cartons of Milo do we have left?”</p>
              <small>Regsure · just now</small>
            </div>
          </div>
        </div>
        <div className="phone">
          <div className="phone-head">
            <span>‹</span>
            <b>Regsure assistant</b>
            <span>•••</span>
          </div>
          <div className="chat-date">TODAY</div>
          <div className="message incoming">
            You have 18 cartons left. That is about 9 days at your current pace.
            <small>09:42</small>
          </div>
          <div className="message outgoing">
            Add 10 cartons to my next restock list please.
            <small>09:43 ✓✓</small>
          </div>
          <div className="message incoming">Done. I’ll keep an eye on it.</div>
          <div className="chat-input">
            Type a message <span>➤</span>
          </div>
        </div>
      </section>
      <section id="plans" className="plans shell">
        <div>
          <p className="kicker">
            <span className="kicker-line" />
            Simple from day one
          </p>
          <h2>
            Start small.
            <br />
            <em>Grow sure.</em>
          </h2>
        </div>
        <div className="plan-copy">
          <p>
            Start with a generous free plan, then add the controls your business
            needs as your team and operations grow.
          </p>
          <a className="text-link" href="/plans">
            Tell me about plans <span>↗</span>
          </a>
        </div>
      </section>
      <section id="join" className="join">
        <div className="shell join-inner">
          <div>
            <p className="kicker light">
              <span className="kicker-line" />
              Keep in the loop
            </p>
            <h2>
              A clearer way to
              <br />
              run your <em>business.</em>
            </h2>
          </div>
          <form onSubmit={joinWaitlist}>
            <label htmlFor="email">Get the first look at Regsure</label>
            <div className="email-row">
              <input
                id="email"
                type="email"
                required
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={isSubmitting || submitted}>
                {isSubmitting
                  ? "Subscribing…"
                  : submitted
                    ? "You’re subscribed ✓"
                    : "Get product updates ↗"}
              </button>
            </div>
            <small>
              {submitError ||
                (submitted
                  ? `Thanks, ${email}. We’ll be in touch.`
                  : "No noise. Just useful updates as we build.")}
            </small>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
