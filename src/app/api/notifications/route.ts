import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { getAblyServer } from "@/lib/ably";
export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select id,type,title,body,read_at,created_at from notifications where user_id=$1 and business_id=$2 order by created_at desc limit 50",
    [context.user.sub, context.businessId],
  );
  return NextResponse.json(
    { notifications: result.rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id, all } = await request.json();
  if (all) {
    await db.query(
      "update notifications set read_at=now() where user_id=$1 and business_id=$2 and read_at is null",
      [context.user.sub, context.businessId],
    );
  } else {
    await db.query(
      "update notifications set read_at=now() where id=$1 and user_id=$2 and business_id=$3",
      [id, context.user.sub, context.businessId],
    );
  }
  return NextResponse.json({ ok: true });
}
export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { type, title, body } = await request.json();
  const result = await db.query(
    "insert into notifications (business_id,user_id,type,title,body) values ($1,$2,$3,$4,$5) returning *",
    [context.businessId, context.user.sub, type || "system", title, body],
  );
  const ably = getAblyServer();
  if (ably)
    await ably.channels
      .get(`business:${context.businessId}:notifications`)
      .publish("notification", result.rows[0]);
  return NextResponse.json({ notification: result.rows[0] }, { status: 201 });
}
