import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!context.businessId)
    return NextResponse.json({
      businessName: "My business",
      summary: { sales: 0, transactions: 0, customers: 0 },
      daily: [],
      scope: "business",
    });
  const filter = context.branchId ? " and branch_id=$2" : "";
  const params = context.branchId
    ? [context.businessId, context.branchId]
    : [context.businessId];
  const [business, sales, customers, daily] = await Promise.all([
    db.query("select name from businesses where id=$1", [context.businessId]),
    db.query(
      `select coalesce(sum(total),0)::int as total,count(*)::int as transactions from sales where business_id=$1${filter} and created_at>=date_trunc('week',now())`,
      params,
    ),
    db.query(
      `select count(*)::int as total from customers where business_id=$1`,
      [context.businessId],
    ),
    db.query(
      `select extract(isodow from created_at)::int as day,coalesce(sum(total),0)::int as total from sales where business_id=$1${filter} and created_at>=now()-interval '7 days' group by 1 order by 1`,
      params,
    ),
  ]);
  return NextResponse.json({
    businessName: business.rows[0]?.name || "My business",
    summary: {
      sales: sales.rows[0].total,
      transactions: sales.rows[0].transactions,
      customers: customers.rows[0].total,
    },
    daily: daily.rows,
    scope: context.branchId ? "branch" : "business",
    branchId: context.branchId,
  });
}
