import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import InteriorHero from "../components/InteriorHero";
export default function Why() {
  return (
    <>
      <SiteHeader />
      <main>
        <InteriorHero
          eyebrow="The whole picture"
          title={
            <>
              Your business is more than
              <br />
              <em>a spreadsheet.</em>
            </>
          }
        >
          <p>
            Regsure is for the people doing the work: the owner opening the
            shop, the team keeping shelves full, and the family making a living
            from a good idea.
          </p>
        </InteriorHero>
        <section className="why-feature shell">
          <div className="why-feature-image">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85"
              alt="Business owner reviewing products in a small shop"
            />
          </div>
          <div className="why-feature-copy">
            <p className="kicker">
              <span className="kicker-line" />A calmer way to operate
            </p>
            <h2>
              Know what is happening while it still <em>matters.</em>
            </h2>
            <p>
              A busy business produces clues all day long. A product is moving
              faster than expected. A customer needs a follow-up. A supplier is
              due. A quiet Tuesday may be the right moment to plan.
            </p>
            <p>
              Regsure turns those clues into a shared, understandable picture.
              You do not have to reconstruct the week from memory or search
              through five different chats before making a decision.
            </p>
          </div>
        </section>
        <section className="why-story shell">
          <div className="story-pull">
            Good records should give you <em>more time</em>, not more work.
          </div>
          <div className="story-copy">
            <p>
              Most businesses already have the information they need. It is
              scattered across notebooks, WhatsApp threads, memory, and the
              till. That makes the work feel heavier than it needs to be.
            </p>
            <p>
              Regsure brings those small moments together. You see what is
              selling, what needs attention, and what the week is actually
              asking from you. The same record can be useful to the person
              making a sale and the person planning next month.
            </p>
            <p>
              The goal is not to make you feel like an accountant. It is to help
              you feel like the person in control of your business, with enough
              clarity to act before small problems become expensive ones.
            </p>
          </div>
        </section>
        <section className="why-values">
          <div className="shell values-grid">
            <div>
              <span>01</span>
              <h3>Clear, not complicated</h3>
              <p>
                Useful language and useful views, so your records work for you
                on a busy day, even when you are moving between customers.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Built for real rhythm</h3>
              <p>
                Weekly and monthly views that match the way local businesses
                actually plan, review, restock, and make room for the next
                opportunity.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Ready where you are</h3>
              <p>
                Web and WhatsApp working together, because your business does
                not happen in one place and your records should not hold you
                back.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
