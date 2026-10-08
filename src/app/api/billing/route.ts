import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";

export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const business = await db.query(
    "select plan,plan_started_at,plan_expires_at,grace_until from businesses where id=$1",
    [context.businessId],
  );
  const history = await db.query(
    "select id,plan,amount,currency,status,provider_reference,created_at from payments where user_id=$1 and business_id=$2 order by created_at desc",
    [context.user.sub, context.businessId],
  );
  return NextResponse.json(
    {
      plan: business.rows[0],
      history: history.rows,
      owner: context.role === "owner",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
