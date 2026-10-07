import InteriorHero from "../components/InteriorHero";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

const capabilities = [
  [
    "Know your stock",
    "Keep quantities, costs, selling prices, reorder points, and adjustments in one dependable record.",
  ],
  [
    "Sell with context",
    "Build a sale from multiple products, apply a discount, record a loan, and keep the customer balance accurate.",
  ],
  [
    "Run the whole business",
    "Switch between businesses and branches, invite your team, and see the numbers that matter to the owner.",
  ],
  [
    "Act before the problem",
    "Low-stock, payment, invitation, and subscription alerts keep the next important action visible.",
  ],
];

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <InteriorHero
          eyebrow="The Regsure platform"
          title={
            <>
              Every moving part, <em>in view.</em>
            </>
          }
        >
          <p>
            Regsure gives growing businesses one clear place to manage stock,
            sales, people, branches, and the decisions between them.
          </p>
        </InteriorHero>

        <section className="content-section shell">
          <div className="content-intro">
            <p className="kicker">
              <span className="kicker-line" /> Built for the working day
            </p>
            <h2>Less catching up. More knowing what happened.</h2>
            <p>
              From the first item received to the last payment collected,
              Regsure keeps operational details connected so the owner can move
              with confidence.
            </p>
          </div>
          <div className="feature-list">
            {capabilities.map(([title, description], index) => (
              <article className="feature-row" key={title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section content-section-tint product-band">
          <div className="shell feature-quote">
            <p className="kicker">
              <span className="kicker-line" /> One connected record
            </p>
            <h2>
              When stock, sales, and customers agree, the business gets easier
              to run.
            </h2>
            <a className="button dark" href="/auth/signup">
              Create your workspace ↗
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
