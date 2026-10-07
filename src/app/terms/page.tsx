import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
export default function Terms() {
  return (
    <>
      <SiteHeader />
      <article className="legal shell">
        <p className="kicker">
          <span className="kicker-line" />
          Regsure terms
        </p>
        <h1>
          Terms of
          <br />
          <em>use.</em>
        </h1>
        <p className="legal-updated">Last updated: October 5, 2026</p>
        <h2>About these terms</h2>
        <p>
          These terms describe the basic rules for using the Regsure website and
          using the Regsure platform, website, dashboard, and connected
          services. By creating an account or using Regsure, you agree to these
          terms.
        </p>
        <h2>Early access</h2>
        <p>
          Regsure provides tools for managing business operations. Features,
          plans, pricing, and limits may change as the service develops. We do
          not guarantee that the service will be uninterrupted or error-free.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not misuse the website, submit information that belongs to someone
          else, or attempt to disrupt the service.
        </p>
        <h2>Changes</h2>
        <p>
          We may update these terms as Regsure develops. We will publish the
          current version on this page.
        </p>
        <h2>Contact</h2>
        <p>For questions about these terms, email hello@regsure.app.</p>
      </article>
      <SiteFooter />
    </>
  );
}
