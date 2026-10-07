import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { inngest } from "@/lib/inngest";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (context.role !== "owner")
    return NextResponse.json(
      { error: "Only the business owner can manage billing." },
      { status: 403 },
    );
  const { transactionId, reference } = await request.json();
  if (!transactionId && !reference)
    return NextResponse.json(
      { error: "Transaction reference is required." },
      { status: 400 },
    );
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId || reference}/verify`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    },
  );
  if (!response.ok)
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 502 },
    );
  const payload = await response.json();
  const data = payload.data;
  if (
    payload.status !== "success" ||
    data.status !== "successful" ||
    data.currency !== "NGN"
  )
    return NextResponse.json(
      { error: "Payment was not successful." },
      { status: 400 },
    );
  const payment = await db.query(
    "select plan,amount,status from payments where provider_reference=$1 and user_id=$2",
    [data.tx_ref, context.user.sub],
  );
  if (!payment.rows[0])
    return NextResponse.json(
      { error: "Payment record was not found." },
      { status: 404 },
    );
  if (payment.rows[0].status === "successful")
    return NextResponse.json({
      ok: true,
      status: "already_processed",
      plan: payment.rows[0].plan,
    });
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  const activated = await db.query(
    "update payments set status='successful' where provider_reference=$1 and status <> 'successful' returning id",
    [data.tx_ref],
  );
  if (!activated.rows[0])
    return NextResponse.json({
      ok: true,
      status: "already_processed",
      plan: payment.rows[0].plan,
    });
  await db.query(
    "update businesses set plan=$1,plan_started_at=now(),plan_expires_at=$2::timestamptz,grace_until=$2::timestamptz + interval '7 days' where id=$3",
    [payment.rows[0].plan, expires, context.businessId],
  );
  await createNotification({
    businessId: context.businessId!,
    userId: context.user.sub,
    type: "payment_success",
    title: "Plan payment confirmed",
    body: `Your ${payment.rows[0].plan} plan is active until ${expires.toLocaleDateString()}.`,
  });
  await inngest.send({
    name: "regsure/billing.plan.activated",
    data: {
      email: context.user.email,
      plan: payment.rows[0].plan,
      amount: payment.rows[0].amount,
    },
  });
  return NextResponse.json({
    ok: true,
    status: "successful",
    plan: payment.rows[0].plan,
    expiresAt: expires.toISOString(),
  });
}
