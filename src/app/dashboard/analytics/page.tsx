import { getRequestUser, hasPlanAccess } from "@/lib/request-auth";
export default async function Analytics() {
  const user = await getRequestUser();
  const unlocked = hasPlanAccess(user?.plan, "basic");
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Business intelligence
      </p>
      <h1>
        See the pattern,
        <br />
        <em>not just the sale.</em>
      </h1>
      <p className="dashboard-lede">
        Analytics turns your records into the questions worth asking about your
        products, customers, and next month.
      </p>
      {unlocked ? (
        <div className="analytics-panels">
          <div className="dashboard-card-large">
            <h2>Monthly sales</h2>
            <div className="analytics-placeholder">
              Analytics data is connected to the sales ledger and will populate
              as your business records transactions.
            </div>
          </div>
          <div className="dashboard-card-large">
            <h2>Best sellers</h2>
            <div className="analytics-placeholder">
              Product-level performance will appear here when itemised sales are
              connected.
            </div>
          </div>
        </div>
      ) : (
        <div className="locked-card">
          <span className="lock-mark">◇</span>
          <h2>Analytics is part of Basic</h2>
          <p>
            Upgrade when you are ready to compare periods, understand best
            sellers, and plan with more confidence.
          </p>
          <a className="button dark" href="/dashboard/billing">
            View plans <span>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
