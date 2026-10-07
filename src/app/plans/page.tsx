import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import InteriorHero from "../components/InteriorHero";
import { getBusinessContext } from "@/lib/request-auth";

const plans = [
  {
    name: "Free",
    price: "₦0",
    priceNote: "forever",
    description: "The essentials for getting a clear record of the business.",
    features: [
      "Inventory basics",
      "Sales recording",
      "Customer records",
      "Weekly overview",
    ],
    locked: [
      "Monthly analytics",
      "WhatsApp assistant",
      "Team roles",
      "Branches",
    ],
  },
  {
    name: "Basic",
    price: "₦15,000",
    priceNote: "per month",
    description:
      "More context for a business that is growing its rhythm, with room for two team members.",
    features: [
      "Everything in Free",
      "Monthly analytics",
      "Restock planning",
      "Up to 2 team members",
    ],
    locked: ["WhatsApp assistant", "Branches", "Unlimited team members"],
  },
  {
    name: "Pro",
    price: "₦35,000",
    priceNote: "per month",
    description:
      "The full workspace for teams, WhatsApp assistance, and businesses with more than one place.",
    features: [
      "Everything in Basic",
      "Unlimited team members",
      "WhatsApp assistant",
      "Multiple branches",
      "Advanced reporting",
    ],
    locked: [],
  },
];

export default async function Plans() {
  const context = await getBusinessContext();
  const current = context?.plan || null;
  return (
    <>
      <SiteHeader />
      <main>
        <InteriorHero
          eyebrow="Simple from day one"
          title={
            <>
              Start small.
              <br />
              <em>Grow sure.</em>
            </>
          }
        >
          <p>
            Choose the amount of clarity your business needs today. You can make
            more room when the work, team, or branches demand it.
          </p>
        </InteriorHero>
        {current && (
          <section className="current-plan shell">
            <p className="kicker">
              <span className="kicker-line" />
              Your current access
            </p>
            <div className="current-plan-head">
              <div>
                <h2>
                  You are on <em>{current}</em>.
                </h2>
                <p>
                  {current === "free"
                    ? "You have the essentials for recording day-to-day business activity."
                    : current === "basic"
                      ? "You have access to analytics, restock planning, and WhatsApp assistance."
                      : "You have the complete Regsure workspace for teams and branches."}
                </p>
              </div>
              <a className="button dark" href="/dashboard/billing">
                Manage plan ↗
              </a>
            </div>
          </section>
        )}
        <section className="plan-matrix shell">
          <div className="plan-matrix-heading">
            <p className="kicker">
              <span className="kicker-line" />
              Compare access
            </p>
            <h2>
              Pick the room
              <br />
              <em>you need.</em>
            </h2>
          </div>
          <div className="plan-matrix-list">
            {plans.map((plan) => (
              <article
                className={`access-plan ${current === plan.name.toLowerCase() ? "access-current" : ""}`}
                key={plan.name}
              >
                <div>
                  <span className="plan-index">
                    {plan.name.toLowerCase() === current ? "CURRENT PLAN" : ""}
                  </span>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <p className="plan-price">
                    {plan.price} <small>{plan.priceNote}</small>
                  </p>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li className="feature-on" key={feature}>
                      ✓ {feature}
                    </li>
                  ))}
                  {plan.locked.map((feature) => (
                    <li className="feature-off" key={feature}>
                      Locked · {feature}
                    </li>
                  ))}
                </ul>
                {plan.name.toLowerCase() !== current && (
                  <a href="/auth/signup" className="text-link">
                    Choose {plan.name} <span>↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="plain-band">
          <div className="shell">
            <h2>
              We keep pricing
              <br />
              <em>honest.</em>
            </h2>
            <p>
              Basic is ₦15,000 monthly and Pro is ₦35,000 monthly. Payment is
              handled securely through Flutterwave, and the owner can renew or
              change plans from the billing page.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
