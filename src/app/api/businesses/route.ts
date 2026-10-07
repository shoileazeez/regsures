import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestUser } from "@/lib/request-auth";
export async function GET() {
  const user = await getRequestUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select b.id,b.name,m.role from businesses b join business_memberships m on m.business_id=b.id where m.user_id=$1 order by b.name",
    [user.sub],
  );
  return NextResponse.json({ businesses: result.rows });
}
