import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <article className="legal shell">
        <p className="kicker">
          <span className="kicker-line" />
          Regsure policy
        </p>
        <h1>
          Privacy
          <br />
          <em>policy.</em>
        </h1>
        <p className="legal-updated">Last updated: October 5, 2026</p>
        <h2>What we collect</h2>
        <p>
          When you create a Regsure account, we collect details such as your
          name, email address, business information, and the operational data
          you choose to store in the platform.
        </p>
        <h2>How we use it</h2>
        <p>
          We use your information to provide the Regsure service, authenticate
          your account, process payments, send important service emails, and
          deliver the features you request. We do not sell your personal
          information.
        </p>
        <h2>How long we keep it</h2>
        <p>
          We retain account and business records while your account is active
          and for as long as needed for security, legal, and operational
          purposes.
        </p>
        <h2>Your choices</h2>
        <p>
          You can ask us to access, correct, export, or delete your information
          by contacting the Regsure team.
        </p>
        <h2>Contact</h2>
        <p>For privacy questions, email privacy@regsure.app.</p>
      </article>
      <SiteFooter />
    </>
  );
}
