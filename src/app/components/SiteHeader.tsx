"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  return (
    <nav className="nav shell">
      <a className="wordmark" href="/">
        <img className="mark-logo" src="/regsure-mark.svg" alt="" />
        <span>regsure</span>
      </a>
      <div className={`nav-links ${open ? "open" : ""}`}>
        <a className={isActive("/features") ? "active" : ""} href="/features">
          Product
        </a>
        <a
          className={isActive("/why-regsure") ? "active" : ""}
          href="/why-regsure"
        >
          Why Regsure
        </a>
        <a className={isActive("/whatsapp") ? "active" : ""} href="/whatsapp">
          WhatsApp
        </a>
        <a className={isActive("/plans") ? "active" : ""} href="/plans">
          Plans
        </a>
        <a
          className={isActive("/auth/login") ? "active" : ""}
          href="/auth/login"
        >
          Log in
        </a>
        <a className="nav-cta" href="/auth/signup">
          Start free <span>↗</span>
        </a>
      </div>
      <button className="menu" onClick={() => setOpen(!open)}>
        {open ? "Close" : "Menu"}
      </button>
    </nav>
  );
}
