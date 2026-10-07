import DashboardShell from "./DashboardShell";
import FetchAuthBridge from "./FetchAuthBridge";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FetchAuthBridge />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
