import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestUser } from "@/lib/request-auth";
import { cookies } from "next/headers";
import { headers } from "next/headers";
export async function GET() {
  const user = await getRequestUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select b.id,b.name,m.role from businesses b join business_memberships m on m.business_id=b.id where m.user_id=$1 order by b.name",
    [user.sub],
  );
  const selected =
    (await headers()).get("x-regsure-business") ||
    (await cookies()).get("regsure_business")?.value;
  return NextResponse.json({
    businesses: result.rows,
    selectedBusinessId: selected || String(result.rows[0]?.id || ""),
  });
}
