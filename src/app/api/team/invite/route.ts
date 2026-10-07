import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
import { inngest } from "@/lib/inngest";
import { createNotification } from "@/lib/notifications";
export async function POST(req: Request) {
  const c = await getBusinessContext();
  if (!c || !hasPlanAccess(c.plan, "basic") || !can(c.role, "team:manage"))
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
  const { email, role } = await req.json();
  if (!email || !["admin", "manager", "staff"].includes(role))
    return NextResponse.json(
      { error: "Email and valid role are required." },
      { status: 400 },
    );
  const token = randomUUID();
  const r = await db.query(
    "insert into team_invites (business_id,email,role,token,expires_at) values ($1,$2,$3,$4,now()+interval '7 days') returning token",
    [c.businessId, email.toLowerCase(), role, token],
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
      businessName: "your Regsure business",
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
