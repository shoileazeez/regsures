"use client";
import { useEffect, useState } from "react";
type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  branch_id: number | null;
  branch_name: string | null;
};
type Branch = { id: number; name: string };
type Invite = {
  id: number;
  email: string;
  role: string;
  branch_name: string | null;
  expires_at: string;
};
function notify(message: string, kind: "success" | "error" = "success") {
  window.dispatchEvent(
    new CustomEvent("regsure:toast", {
      detail: { id: Date.now() + Math.random(), kind, message },
    }),
  );
}
export default function Team() {
  const [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<Invite[]>([]),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("staff"),
    [inviteBranch, setInviteBranch] = useState(""),
    [loading, setLoading] = useState(""),
    [branches, setBranches] = useState<Branch[]>([]),
    [assignedBranch, setAssignedBranch] = useState<string | null>(null),
    [branchFilter, setBranchFilter] = useState("all"),
    [revokeInvite, setRevokeInvite] = useState<Invite | null>(null),
    [revokeReason, setRevokeReason] = useState(""),
    [editMember, setEditMember] = useState<Member | null>(null),
    [editRole, setEditRole] = useState("staff"),
    [editBranch, setEditBranch] = useState("all");
  async function load(filter = branchFilter) {
    const r = await fetch(`/api/team/members?branchId=${filter}`);
    const body = await r.text();
    let data: { members?: Member[]; invites?: Invite[]; error?: string } = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      data = { error: "The team response was not valid JSON." };
    }
    if (r.ok) {
      setMembers(data.members || []);
      setInvites(data.invites || []);
    } else {
      notify(data.error || "Unable to load team members.", "error");
    }
  }
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        setBranches(d.branches || []);
        setAssignedBranch(d.assignedBranchId || null);
        if (d.assignedBranchId) setBranchFilter(String(d.assignedBranchId));
      });
    load();
  }, []);
  async function assign(id: number, branchId: string) {
    setLoading(`assign-${id}`);
    const r = await fetch("/api/team/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: id,
        branchId: branchId === "all" ? null : branchId,
      }),
    });
    setLoading("");
    if (r.ok) {
      notify("Branch access updated.");
      load();
    } else notify("Unable to update branch access.", "error");
  }
  async function saveMemberAccess() {
    if (!editMember) return;
    setLoading(`edit-${editMember.id}`);
    const r = await fetch("/api/team/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: editMember.id,
        branchId: editBranch === "all" ? null : editBranch,
        role: editRole,
      }),
    });
    setLoading("");
    if (r.ok) {
      notify("Member access updated.");
      setEditMember(null);
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      notify(d.error || "Unable to update member access.", "error");
    }
  }
  async function inviteAction(
    action: "resend" | "revoke",
    invite: Invite,
    reason?: string,
  ) {
    setLoading(`${action}-${invite.id}`);
    const r = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, inviteId: invite.id, reason }),
    });
    const d = await r.json();
    setLoading("");
    if (r.ok) {
      notify(
        action === "resend"
          ? "Invitation email resent."
          : "Invitation revoked.",
      );
      setRevokeInvite(null);
      setRevokeReason("");
      load();
    } else notify(d.error || "Unable to update invitation.", "error");
  }
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading("invite");
    const r = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        role,
        branchId: inviteBranch || undefined,
      }),
    });
    const d = await r.json();
    setLoading("");
    if (r.ok) {
      notify("Invite email queued.");
      setEmail("");
      setInviteBranch("");
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
        <div className="team-filter">
          <label>View team by branch</label>
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              load(e.target.value);
            }}
          >
            {!assignedBranch && <option value="all">All branches</option>}
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        {members.map((m) => (
          <div className="data-row" key={m.id}>
            <div>
              <strong>{m.name}</strong>
              <button
                className="member-email"
                onClick={() => {
                  setEditMember(m);
                  setEditRole(m.role);
                  setEditBranch(m.branch_id ? String(m.branch_id) : "all");
                }}
              >
                {m.email}
              </button>
              <small>
                {m.branch_name ? `Branch: ${m.branch_name}` : "All branches"}
              </small>
            </div>
            <span>{m.role}</span>
            {m.role !== "owner" && (
              <select
                disabled={!!loading}
                value={m.branch_id ? String(m.branch_id) : "all"}
                onChange={(e) => assign(m.id, e.target.value)}
                aria-label={`Assign ${m.name} to a branch`}
              >
                <option value="all">All branches</option>
                {branches.map((branch) => (
                  <option value={branch.id} key={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
            <button disabled={!!loading} onClick={() => remove(m.id)}>
              {loading === `remove-${m.id}` ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
        {invites.map((invite) => (
          <div className="data-row pending-invite" key={`invite-${invite.id}`}>
            <div>
              <strong>{invite.email}</strong>
              <small>Pending invitation · {invite.role}</small>
              <small>
                {invite.branch_name
                  ? `Branch: ${invite.branch_name}`
                  : "All branches"}
              </small>
            </div>
            <span>
              Expires {new Date(invite.expires_at).toLocaleDateString()}
            </span>
            <button
              disabled={!!loading}
              onClick={() => inviteAction("resend", invite)}
            >
              {loading === `resend-${invite.id}` ? "Resending..." : "Resend"}
            </button>
            <button
              disabled={!!loading}
              onClick={() => setRevokeInvite(invite)}
            >
              Revoke
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
        <select
          value={inviteBranch}
          onChange={(e) => setInviteBranch(e.target.value)}
          aria-label="Assign invite to branch"
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option value={branch.id} key={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <button className="button dark" disabled={!!loading}>
          {loading === "invite" ? "Sending..." : "Send invite ↗"}
        </button>
      </form>
      {revokeInvite && (
        <div className="settings-modal-backdrop" role="presentation">
          <section className="settings-modal" role="dialog" aria-modal="true">
            <button
              className="settings-modal-close"
              onClick={() => setRevokeInvite(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="kicker">
              <span className="kicker-line" />
              Revoke invitation
            </p>
            <h2>Remove this invite?</h2>
            <p className="settings-modal-copy">
              This will stop <strong>{revokeInvite.email}</strong> from
              accepting the invitation. A reason is required and will be emailed
              to them.
            </p>
            <form
              className="settings-modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                inviteAction("revoke", revokeInvite, revokeReason);
              }}
            >
              <label>
                Reason
                <textarea
                  required
                  minLength={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="For example, the role is no longer available."
                />
              </label>
              <button
                className="button dark"
                disabled={loading === `revoke-${revokeInvite.id}`}
              >
                {loading === `revoke-${revokeInvite.id}`
                  ? "Revoking..."
                  : "Revoke invitation"}
              </button>
            </form>
          </section>
        </div>
      )}
      {editMember && (
        <div className="settings-modal-backdrop" role="presentation">
          <section className="settings-modal" role="dialog" aria-modal="true">
            <button
              className="settings-modal-close"
              onClick={() => setEditMember(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="kicker">
              <span className="kicker-line" />
              Member access
            </p>
            <h2>Manage {editMember.name}.</h2>
            <p className="settings-modal-copy">
              Update this accepted member’s role and workspace access.
            </p>
            <div className="settings-modal-form">
              <label>
                Role
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Branch access
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                >
                  <option value="all">All branches</option>
                  {branches.map((branch) => (
                    <option value={branch.id} key={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button dark"
                onClick={saveMemberAccess}
                disabled={loading === `edit-${editMember.id}`}
              >
                {loading === `edit-${editMember.id}`
                  ? "Saving access..."
                  : "Save access"}
              </button>
              <button
                className="member-danger"
                onClick={() => {
                  setEditMember(null);
                  remove(editMember.id);
                }}
              >
                Remove from business
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
