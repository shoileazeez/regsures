import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import InteriorHero from "../components/InteriorHero";
export default function WhatsApp() {
  return (
    <>
      <SiteHeader />
      <main>
        <InteriorHero
          eyebrow="Your assistant, in your pocket"
          title={
            <>
              Ask your business
              <br />
              <em>anything.</em>
            </>
          }
        >
          <p>
            Use plain language in WhatsApp to add stock, record a sale, update a
            customer, or understand what changed this week.
          </p>
        </InteriorHero>
        <section className="whatsapp-intro shell">
          <div>
            <img
              src="https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=85"
              alt="Person using a phone to manage business messages"
            />
          </div>
          <div>
            <h2>
              The fastest record is the one you make <em>now.</em>
            </h2>
            <p>
              When a delivery arrives, you are usually not sitting at a desk.
              When a sale happens, you should not need to remember it until the
              end of the day.
            </p>
            <p>
              Regsure’s WhatsApp assistant lets you update the business in the
              same moment. It turns a simple message into a useful record, then
              keeps that record connected to your stock, sales, customers, and
              reports.
            </p>
          </div>
        </section>
        <section className="whatsapp-detail shell">
          <div className="command-list">
            <p className="kicker">
              <span className="kicker-line" />
              Say what happened
            </p>
            <h2>
              Small messages.
              <br />
              <em>Big picture.</em>
            </h2>
            <p className="detail-lede">
              You can write naturally. The assistant is designed to understand
              the everyday language of running a business, then confirm what it
              has done so you stay in control.
            </p>
            {[
              "“Add 10 cartons of Milo to stock.”",
              "“Record a sale of 3 shirts for ₦18,000.”",
              "“Which products need a restock?”",
              "“Show me what sold best this week.”",
            ].map((x, i) => (
              <div className="command" key={x}>
                <span>0{i + 1}</span>
                {x}
              </div>
            ))}
          </div>
          <div className="phone big-phone">
            <div className="phone-head">
              <span>‹</span>
              <b>Regsure assistant</b>
              <span>•••</span>
            </div>
            <div className="chat-date">TODAY</div>
            <div className="message incoming">
              You have 18 cartons left. That is about 9 days at your current
              pace.<small>09:42</small>
            </div>
            <div className="message outgoing">
              Add 10 cartons to my next restock list please.
              <small>09:43 ✓✓</small>
            </div>
            <div className="message incoming">
              Done. I’ll keep an eye on it.
            </div>
            <div className="chat-input">
              Type a message <span>➤</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
