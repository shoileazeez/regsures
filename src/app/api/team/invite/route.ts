import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
import { inngest } from "@/lib/inngest";
import { createNotification } from "@/lib/notifications";
export async function POST(req: Request) {
  const c = await getBusinessContext();
  if (!c || c.role !== "owner" || !hasPlanAccess(c.plan, "basic"))
    return NextResponse.json(
      { error: "Team invites are available on Basic and Pro plans." },
      { status: 403 },
    );
  const seats = await db.query(
    "select (select count(*) from business_memberships where business_id=$1)+(select count(*) from team_invites where business_id=$1 and accepted_at is null and expires_at>now()) as seats",
    [c.businessId],
  );
  if (c.plan === "basic" && Number(seats.rows[0].seats) >= 2)
    return NextResponse.json(
      { error: "Basic plan allows up to two team members or pending invites." },
      { status: 403 },
    );
  const { email, role, branchId } = await req.json();
  if (!email || !["admin", "manager", "staff"].includes(role))
    return NextResponse.json(
      { error: "Email and valid role are required." },
      { status: 400 },
    );
  let branchName = "all branches";
  if (branchId) {
    const branch = await db.query(
      "select name from branches where id=$1 and business_id=$2",
      [branchId, c.businessId],
    );
    if (!branch.rows[0])
      return NextResponse.json(
        { error: "That branch is not part of this business." },
        { status: 400 },
      );
    branchName = branch.rows[0].name;
  }
  const business = await db.query("select name from businesses where id=$1", [
    c.businessId,
  ]);
  const token = randomUUID();
  const r = await db.query(
    "insert into team_invites (business_id,email,role,branch_id,token,expires_at) values ($1,$2,$3,$4,$5,now()+interval '7 days') returning token",
    [c.businessId, email.toLowerCase(), role, branchId || null, token],
  );
  await createNotification({
    businessId: c.businessId!,
    userId: c.user.sub,
    type: "invite",
    title: "Invitation sent",
    body: `An invitation was sent to ${email.toLowerCase()} as ${role}.`,
  });
  await inngest.send({
    name: "regsure/team.invite.created",
    data: {
      email: email.toLowerCase(),
      role,
      token: r.rows[0].token,
      businessName: business.rows[0]?.name || "your Regsure business",
      branchName,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
