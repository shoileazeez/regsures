export default function SiteFooter() {
  return (
    <footer className="footer shell">
      <div className="footer-brand">
        <a className="wordmark" href="/">
          <img className="mark-logo" src="/regsure-mark.svg" alt="" />
          <span>regsure</span>
        </a>
        <span>Stock. Sales. Sense.</span>
      </div>
      <div className="footer-links">
        <div>
          <span>Explore</span>
          <a href="/features">Product</a>
          <a href="/why-regsure">Why Regsure</a>
          <a href="/whatsapp">WhatsApp</a>
          <a href="/plans">Plans</a>
        </div>
        <div>
          <span>Account</span>
          <a href="/auth/login">Log in</a>
          <a href="/auth/signup">Start free</a>
        </div>
        <div>
          <span>Legal</span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
      <small>© 2026 Regsure</small>
    </footer>
  );
}
