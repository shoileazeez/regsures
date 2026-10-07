import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("verif-hash") || "";
  const secret = process.env.FLUTTERWAVE_SECRET_HASH || "";
  if (
    !secret ||
    !signature ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(secret))
  )
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  try {
    const event = JSON.parse(raw);
    const data = event.data || {};
    const reference = data.tx_ref || data.reference;
    if (reference) {
      const status =
        data.status === "successful" ? "successful" : data.status || "received";
      const payment = await db.query(
        "select user_id,plan,amount from payments where provider_reference=$1",
        [reference],
      );
      await db.query(
        "update payments set status = $1 where provider_reference = $2",
        [status, reference],
      );
      if (status === "successful" && payment.rows[0]) {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        const business = await db.query(
          "select id,owner_id from businesses where owner_id=$1 order by created_at limit 1",
          [payment.rows[0].user_id],
        );
        if (business.rows[0]) {
          await db.query(
            "update businesses set plan=$1,plan_started_at=now(),plan_expires_at=$2::timestamptz,grace_until=$2::timestamptz + interval '7 days' where id=$3",
            [payment.rows[0].plan, expires, business.rows[0].id],
          );
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
