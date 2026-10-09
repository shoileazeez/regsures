"use client";

import { useEffect, useState } from "react";

export default function DashboardWhatsAppPage() {
  const [code, setCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/link-code")
      .then((response) => response.json())
      .then((data) => setPhoneNumber(data.phoneNumber || null))
      .finally(() => setLoaded(true));
  }, []);

  async function generateCode() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/whatsapp/link-code", { method: "POST" });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Unable to generate a linking code.");
      return;
    }
    setCode(data.code);
  }

  return (
    <div className="dashboard-content whatsapp-dashboard">
      <div className="dashboard-top">
        <div>
          <p className="kicker"><span className="kicker-line" />WhatsApp assistant</p>
          <h1>Keep Regsure close to<br /><em>the daily work.</em></h1>
          <p className="dashboard-lede">Link your Regsure workspace once. After that, ask about stock, sales, customers, and analytics from WhatsApp without sharing your password or AI token.</p>
        </div>
        <div className="whatsapp-status"><span />Secure workspace link</div>
      </div>
      <section className="whatsapp-connect-grid">
        <div className="dashboard-card-large whatsapp-step-card">
          <span className="whatsapp-step">01</span>
          <h2>Message the assistant</h2>
          <p>Send a WhatsApp message to this number:</p>
          <strong className="whatsapp-phone">{loaded ? phoneNumber || "Not configured yet" : "Loading number..."}</strong>
        </div>
        <div className="dashboard-card-large whatsapp-step-card whatsapp-code-card">
          <span className="whatsapp-step">02</span>
          <h2>Generate your link code</h2>
          <p>Generate a short-lived code, then send <strong>CONNECT 123456</strong> to the assistant.</p>
          <button className="button dark" onClick={generateCode} disabled={loading}>{loading ? "Generating..." : "Generate linking code"}</button>
          {code && <div className="whatsapp-link-code" aria-live="polite">{code}</div>}
        </div>
      </section>
      <section className="whatsapp-help-card"><h2>What you can ask Regsure</h2><p>“How much stock is left?” · “Show this month’s sales.” · “Record a sale.” · “Which customers owe us?”</p><small>Your code expires quickly and can only link the signed-in workspace.</small></section>
      {error && <div className="modal-backdrop" role="presentation"><section className="settings-modal whatsapp-error-modal" role="dialog" aria-modal="true" aria-labelledby="whatsapp-error-title"><button className="settings-modal-close" onClick={() => setError("")} aria-label="Close">×</button><p className="kicker"><span className="kicker-line" />WhatsApp assistant</p><h2 id="whatsapp-error-title">This feature is part of Pro.</h2><p className="settings-modal-copy">{error}</p><div className="whatsapp-modal-actions"><a className="button dark" href="/dashboard/billing">View plans</a><button className="button light" onClick={() => setError("")}>Close</button></div></section></div>}
    </div>
  );
}
