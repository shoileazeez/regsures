import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
import { cookies } from "next/headers";
import { headers } from "next/headers";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select id,name,address from branches where business_id=$1 and ($2::bigint is null or id=$2) order by name",
    [context.businessId, context.assignedBranchId],
  );
  const selectedBranchId =
    (await headers()).get("x-regsure-branch") ||
    (await cookies()).get("regsure_branch")?.value ||
    "all";
  return NextResponse.json({
    branches: result.rows,
    selectedBranchId,
    assignedBranchId: context.assignedBranchId,
  });
}
export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (context.role !== "owner")
    return NextResponse.json(
      { error: "You do not have permission to manage branches." },
      { status: 403 },
    );
  if (!hasPlanAccess(context.plan, "pro"))
    return NextResponse.json(
      { error: "Branch management is available on Pro." },
      { status: 403 },
    );
  const { name, address, userId } = await request.json();
  if (!name)
    return NextResponse.json(
      { error: "Branch name is required." },
      { status: 400 },
    );
  if (userId) {
    const member = await db.query(
      "select role from business_memberships where business_id=$1 and user_id=$2",
      [context.businessId, userId],
    );
    if (!member.rows[0])
      return NextResponse.json(
        { error: "That user is not on this team." },
        { status: 400 },
      );
    if (member.rows[0].role === "owner")
      return NextResponse.json(
        { error: "The business owner always has full business access." },
        { status: 400 },
      );
  }
  const client = await db.connect();
  let result;
  try {
    await client.query("begin");
    result = await client.query(
      "insert into branches (business_id,name,address) values ($1,$2,$3) returning *",
      [context.businessId, name, address || null],
    );
    if (userId) {
      await client.query(
        "update business_memberships set branch_id=$1 where business_id=$2 and user_id=$3",
        [result.rows[0].id, context.businessId, userId],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
  return NextResponse.json({ branch: result.rows[0] }, { status: 201 });
}
