import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
export async function GET(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const branchId = new URL(request.url).searchParams.get("branchId");
  const effectiveBranch =
    context.assignedBranchId ||
    (branchId && branchId !== "all" ? branchId : null);
  const result = await db.query(
    "select u.id,u.name,u.email,m.role,m.branch_id,b.name as branch_name,m.created_at from business_memberships m join users u on u.id=m.user_id left join branches b on b.id=m.branch_id where m.business_id=$1 and ($2::bigint is null or m.branch_id=$2) order by m.created_at",
    [context.businessId, effectiveBranch],
  );
  const invites = await db.query(
    "select i.id,i.email,i.role,i.branch_id,b.name as branch_name,i.expires_at,i.created_at from team_invites i left join branches b on b.id=i.branch_id where i.business_id=$1 and i.accepted_at is null and i.revoked_at is null and i.expires_at>now() and ($2::bigint is null or i.branch_id=$2) order by i.created_at desc",
    [context.businessId, effectiveBranch],
  );
  return NextResponse.json({ members: result.rows, invites: invites.rows });
}
export async function DELETE(request: Request) {
  const context = await getBusinessContext();
  if (!context || context.role !== "owner")
    return NextResponse.json(
      { error: "You do not have permission." },
      { status: 403 },
    );
  const { userId } = await request.json();
  if (String(userId) === context.user.sub)
    return NextResponse.json(
      { error: "Owners cannot remove themselves." },
      { status: 400 },
    );
  await db.query(
    "delete from business_memberships where business_id=$1 and user_id=$2",
    [context.businessId, userId],
  );
  return NextResponse.json({ ok: true });
}
export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if (!context || !can(context.role, "team:manage"))
    return NextResponse.json(
      { error: "You do not have permission." },
      { status: 403 },
    );
  const { userId, branchId, role } = await request.json();
  const member = await db.query(
    "select role from business_memberships where business_id=$1 and user_id=$2",
    [context.businessId, userId],
  );
  if (!member.rows[0])
    return NextResponse.json(
      { error: "Team member not found." },
      { status: 404 },
    );
  if (member.rows[0].role === "owner")
    return NextResponse.json(
      { error: "The business owner always has full business access." },
      { status: 400 },
    );
  if (branchId) {
    const branch = await db.query(
      "select id from branches where id=$1 and business_id=$2",
      [branchId, context.businessId],
    );
    if (!branch.rows[0])
      return NextResponse.json(
        { error: "That branch is not part of this business." },
        { status: 400 },
      );
  }
  if (role && !["admin", "manager", "staff"].includes(role))
    return NextResponse.json({ error: "Invalid team role." }, { status: 400 });
  await db.query(
    "update business_memberships set branch_id=$1,role=coalesce($2,role) where business_id=$3 and user_id=$4",
    [branchId || null, role || null, context.businessId, userId],
  );
  return NextResponse.json({ ok: true });
}
