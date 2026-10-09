"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
const links = [
  ["Overview", "/dashboard"],
  ["Inventory", "/dashboard/inventory"],
  ["Sales", "/dashboard/sales"],
  ["Analytics", "/dashboard/analytics"],
  ["Customers", "/dashboard/customers"],
  ["Team", "/dashboard/team"],
  ["Branches", "/dashboard/branches"],
  ["Billing", "/dashboard/billing"],
  ["Notifications", "/dashboard/notifications"],
  ["WhatsApp assistant", "/dashboard/whatsapp"],
  ["Settings", "/dashboard/settings"],
  ["New business", "/dashboard/businesses/new"],
];
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [businesses, setBusinesses] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [assignedBranch, setAssignedBranch] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/businesses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setBusinesses(d.businesses || []);
        if (d.selectedBusinessId) setSelected(String(d.selectedBusinessId));
      });
    const load = () =>
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (d) =>
            d &&
            setUnread(
              (d.notifications || []).filter((n: any) => !n.read_at).length,
            ),
        );
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selected) return;
    setSelectedBranch("all");
    fetch("/api/branches", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { branches: [] }))
      .then((d) => {
        setBranches(d.branches || []);
        setAssignedBranch(d.assignedBranchId || null);
        setSelectedBranch(d.assignedBranchId || d.selectedBranchId || "all");
      });
  }, [selected]);
  async function switchBusiness(id: string) {
    setSelected(id);
    const response = await fetch("/api/businesses/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    if (!response.ok) return;
    window.location.assign(path);
  }
  async function switchBranch(id: string) {
    setSelectedBranch(id);
    const response = await fetch("/api/branches/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId: id }),
    });
    if (!response.ok) return;
    window.location.assign(path);
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }
  return (
    <div className="dashboard-app">
      <aside className="dashboard-sidebar">
        <a className="wordmark" href="/dashboard" aria-label="Open dashboard">
          <img className="mark-logo" src="/regsure-mark.svg" alt="" />
          <span>regsure</span>
        </a>
        {businesses.length > 0 && (
          <details className="switcher-field">
            <summary>
              Workspace switcher{" "}
              <strong>
                {businesses.find((b) => String(b.id) === selected)?.name ||
                  "Select workspace"}
              </strong>
            </summary>
            <select
              className="business-switcher"
              value={selected}
              onChange={(e) => switchBusiness(e.target.value)}
            >
              {businesses.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </details>
        )}
        {branches.length > 0 && (
          <details className="switcher-field">
            <summary>
              Branch view{" "}
              <strong>
                {selectedBranch === "all"
                  ? "All branches"
                  : branches.find((b) => String(b.id) === selectedBranch)
                      ?.name || "Select branch"}
              </strong>
            </summary>
            <select
              className="business-switcher branch-switcher"
              value={selectedBranch}
              onChange={(e) => switchBranch(e.target.value)}
            >
              {!assignedBranch && <option value="all">All branches</option>}
              {branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </details>
        )}
        <nav>
          {links.map(([label, href]) => (
            <a className={path === href ? "active" : ""} href={href} key={href}>
              {label}
              {label === "Notifications" && unread > 0 && (
                <span
                  className="notification-dot"
                  aria-label={`${unread} unread notifications`}
                />
              )}
            </a>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
