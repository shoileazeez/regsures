import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!hasPlanAccess(context.plan, "basic"))
    return NextResponse.json(
      { error: "Basic plan required." },
      { status: 403 },
    );
  const sales = await db.query(
    "select coalesce(sum(total),0)::int as total,count(*)::int as transactions from sales where business_id=$1 and created_at>=date_trunc('month',now())",
    [context.businessId],
  );
  const daily = await db.query(
    "select date_trunc('day',created_at)::date as day,coalesce(sum(total),0)::int as total from sales where business_id=$1 and created_at>=now()-interval '30 days' group by 1 order by 1",
    [context.businessId],
  );
  return NextResponse.json({ summary: sales.rows[0], daily: daily.rows });
}
