import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select u.id,u.name,u.email,m.role,m.created_at from business_memberships m join users u on u.id=m.user_id where m.business_id=$1 order by m.created_at",
    [context.businessId],
  );
  return NextResponse.json({ members: result.rows });
}
export async function DELETE(request: Request) {
  const context = await getBusinessContext();
  if (!context || !can(context.role, "team:manage"))
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
