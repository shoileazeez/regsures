"use client";
import { useEffect, useState } from "react";
export default function Branches() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState<
    Array<{ id: number; name: string; email: string }>
  >([]);
  const [assignee, setAssignee] = useState("");
  useEffect(() => {
    fetch("/api/team/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []));
  }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, userId: assignee || undefined }),
    });
    const d = await r.json();
    setMessage(r.ok ? "Branch created." : d.error);
  }
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Pro workspace
      </p>
      <h1>
        One business,
        <br />
        <em>many places.</em>
      </h1>
      <p className="dashboard-lede">
        Keep branches under one business so owners can understand the whole
        operation while managers stay close to their location.
      </p>
      <div className="locked-card branch-form">
        <h2>Add a branch</h2>
        <p>
          Branch creation is available on Pro. Each branch can later have its
          own inventory, team access, and sales view.
        </p>
        <form className="inline-create" onSubmit={add}>
          <input
            required
            placeholder="Branch name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            aria-label="Assign team member"
          >
            <option value="">Assign later or all-business access</option>
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.name} · {member.email}
              </option>
            ))}
          </select>
          <button className="button dark">Create branch +</button>
        </form>
        {message && <small>{message}</small>}
      </div>
    </div>
  );
}
