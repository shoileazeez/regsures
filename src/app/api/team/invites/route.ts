import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context || context.role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can manage invitations." },
      { status: 403 },
    );
  const { action, inviteId, reason } = await request.json();
  const invite = await db.query(
    "select i.*,b.name as business_name,br.name as branch_name from team_invites i join businesses b on b.id=i.business_id left join branches br on br.id=i.branch_id where i.id=$1 and i.business_id=$2 and i.accepted_at is null and i.revoked_at is null",
    [inviteId, context.businessId],
  );
  if (!invite.rows[0])
    return NextResponse.json(
      { error: "Pending invitation not found." },
      { status: 404 },
    );
  const row = invite.rows[0];
  if (action === "revoke") {
    if (!reason?.trim())
      return NextResponse.json(
        { error: "A revoke reason is required." },
        { status: 400 },
      );
    await db.query(
      "update team_invites set revoked_at=now(),revoke_reason=$1 where id=$2",
      [reason.trim(), inviteId],
    );
    await inngest.send({
      name: "regsure/team.invite.revoked",
      data: {
        email: row.email,
        businessName: row.business_name,
        reason: reason.trim(),
      },
    });
    return NextResponse.json({ ok: true });
  }
  if (action !== "resend")
    return NextResponse.json(
      { error: "Unknown invitation action." },
      { status: 400 },
    );
  const token = randomUUID();
  await db.query(
    "update team_invites set token=$1,expires_at=now()+interval '7 days' where id=$2",
    [token, inviteId],
  );
  await inngest.send({
    name: "regsure/team.invite.created",
    data: {
      email: row.email,
      role: row.role,
      token,
      businessName: row.business_name,
      branchName: row.branch_name || "all branches",
    },
  });
  return NextResponse.json({ ok: true });
}
