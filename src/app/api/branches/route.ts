import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select id,name,address from branches where business_id=$1 order by name",
    [context.businessId],
  );
  return NextResponse.json({ branches: result.rows });
}
export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(context.role, "branches:manage"))
    return NextResponse.json(
      { error: "You do not have permission to manage branches." },
      { status: 403 },
    );
  if (!hasPlanAccess(context.plan, "pro"))
    return NextResponse.json(
      { error: "Branch management is available on Pro." },
      { status: 403 },
    );
  const { name, address } = await request.json();
  if (!name)
    return NextResponse.json(
      { error: "Branch name is required." },
      { status: 400 },
    );
  const result = await db.query(
    "insert into branches (business_id,name,address) values ($1,$2,$3) returning *",
    [context.businessId, name, address || null],
  );
  return NextResponse.json({ branch: result.rows[0] }, { status: 201 });
}
