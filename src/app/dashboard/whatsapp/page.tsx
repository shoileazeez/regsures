"use client";

import { useEffect, useState } from "react";

export default function DashboardWhatsAppPage() {
  const [code, setCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/link-code")
      .then((response) => response.json())
      .then((data) => setPhoneNumber(data.phoneNumber || null));
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
    <main className="dashboard-page shell">
      <p className="kicker">WhatsApp assistant</p>
      <h1>Connect Eve without sharing a token.</h1>
      <p>
        Generate a short-lived code here, then send it to your Regsure WhatsApp
        assistant as <strong>CONNECT 123456</strong>.
      </p>
      <p>
        Message this WhatsApp number:{" "}
        <strong>{phoneNumber || "Not configured yet"}</strong>
      </p>
      <button
        className="button button-dark"
        onClick={generateCode}
        disabled={loading}
      >
        {loading ? "Generating…" : "Generate linking code"}
      </button>
      {code && <p className="whatsapp-link-code">{code}</p>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
