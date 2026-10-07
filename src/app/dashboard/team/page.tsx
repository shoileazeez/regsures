"use client";
import { useEffect, useState } from "react";
type Member = { id: number; name: string; email: string; role: string };
function notify(message: string, kind: "success" | "error" = "success") {
  window.dispatchEvent(
    new CustomEvent("regsure:toast", {
      detail: { id: Date.now() + Math.random(), kind, message },
    }),
  );
}
export default function Team() {
  const [members, setMembers] = useState<Member[]>([]),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("staff"),
    [loading, setLoading] = useState("");
  async function load() {
    const r = await fetch("/api/team/members");
    const d = await r.json();
    if (r.ok) setMembers(d.members || []);
  }
  useEffect(() => {
    load();
  }, []);
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading("invite");
    const r = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const d = await r.json();
    setLoading("");
    if (r.ok) {
      notify("Invite email queued.");
      setEmail("");
    } else notify(d.error || "Unable to send invite.", "error");
  }
  async function remove(id: number) {
    if (!confirm("Remove this member from the business?")) return;
    setLoading(`remove-${id}`);
    const r = await fetch("/api/team/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setLoading("");
    if (r.ok) {
      notify("Member access removed.");
      load();
    } else {
      const d = await r.json();
      notify(d.error || "Unable to remove member.", "error");
    }
  }
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        People and permissions
      </p>
      <h1>
        Give the right people
        <br />
        <em>the right room.</em>
      </h1>
      <p className="dashboard-lede">
        Invite teammates, see their current role, and remove access when
        responsibilities change.
      </p>
      <div className="data-list member-list">
        {members.map((m) => (
          <div className="data-row" key={m.id}>
            <div>
              <strong>{m.name}</strong>
              <small>{m.email}</small>
            </div>
            <span>{m.role}</span>
            <button disabled={!!loading} onClick={() => remove(m.id)}>
              {loading === `remove-${m.id}` ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>
      <form className="invite-form" onSubmit={invite}>
        <h2>Invite a teammate</h2>
        <input
          type="email"
          required
          placeholder="teammate@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button className="button dark" disabled={!!loading}>
          {loading === "invite" ? "Sending..." : "Send invite ↗"}
        </button>
      </form>
    </div>
  );
}
