export default function DashboardLoading({
  label = "Loading",
}: {
  label?: string;
}) {
  return (
    <div className="dashboard-loading" aria-busy="true" aria-label={label}>
      <span className="loading-line loading-kicker" />
      <span className="loading-block loading-title" />
      <span className="loading-line loading-copy" />
      <span className="loading-line loading-copy loading-copy-short" />
      <div className="loading-panel">
        <span className="loading-line" />
        <span className="loading-block loading-card-title" />
        <span className="loading-line loading-card-copy" />
      </div>
      <div className="loading-grid">
        <span className="loading-card" />
        <span className="loading-card" />
        <span className="loading-card" />
      </div>
    </div>
  );
}
