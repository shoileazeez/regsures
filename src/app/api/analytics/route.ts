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
  const branchFilter = context.branchId ? " and branch_id=$2" : "";
  const params = context.branchId ? [context.businessId, context.branchId] : [context.businessId];
  const sales = await db.query(
    `select coalesce(sum(total),0)::int as total,count(*)::int as transactions from sales where business_id=$1${branchFilter} and status='completed' and created_at>=date_trunc('month',now())`,
    params,
  );
  const daily = await db.query(
    `select date_trunc('day',created_at)::date as day,coalesce(sum(total),0)::int as total from sales where business_id=$1${branchFilter} and status='completed' and created_at>=now()-interval '30 days' group by 1 order by 1`,
    params,
  );
  const weekly = await db.query(
    `select date_trunc('week',created_at)::date as week,coalesce(sum(total),0)::int as total,count(*)::int as transactions from sales where business_id=$1${branchFilter} and status='completed' group by 1 order by 1 desc limit 8`,
    params,
  );
  const monthly = await db.query(
    `select date_trunc('month',created_at)::date as month,coalesce(sum(total),0)::int as total,count(*)::int as transactions from sales where business_id=$1${branchFilter} and status='completed' group by 1 order by 1 desc limit 6`,
    params,
  );
  const bestSellers = await db.query(
    `select i.name,coalesce(sum(si.quantity),0)::int as quantity,coalesce(sum(si.quantity*si.unit_price),0)::int as revenue from sale_items si join sales s on s.id=si.sale_id join inventory_items i on i.id=si.inventory_item_id where s.business_id=$1${context.branchId ? " and s.branch_id=$2" : ""} and s.status='completed' and s.created_at>=date_trunc('month',now()) group by i.name order by quantity desc limit 5`,
    params,
  );
  return NextResponse.json({ summary: sales.rows[0], daily: daily.rows, weekly: weekly.rows, monthly: monthly.rows, bestSellers: bestSellers.rows });
}
