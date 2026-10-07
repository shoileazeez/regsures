import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";

export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    `select u.name,u.email,u.phone,b.name as business_name,b.notification_email,b.restock_notifications,b.payment_notifications from users u join businesses b on b.id=$1 where u.id=$2`,
    [context.businessId, context.user.sub],
  );
  return NextResponse.json({ settings: result.rows[0] });
}

export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json();
  if (body.section === "profile") {
    if (!body.name || !body.businessName)
      return NextResponse.json(
        { error: "Name and business name are required." },
        { status: 400 },
      );
    await db.query("update users set name=$1,phone=$2 where id=$3", [
      body.name,
      body.phone || null,
      context.user.sub,
    ]);
    await db.query("update businesses set name=$1 where id=$2", [
      body.businessName,
      context.businessId,
    ]);
  } else if (body.section === "notifications") {
    await db.query(
      "update businesses set notification_email=$1,restock_notifications=$2,payment_notifications=$3 where id=$4",
      [!!body.email, !!body.restock, !!body.payments, context.businessId],
    );
  } else
    return NextResponse.json(
      { error: "Unknown settings section." },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}
