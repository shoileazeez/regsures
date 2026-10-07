import { NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/request-auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (context.role !== "owner")
    return NextResponse.json(
      { error: "Only the business owner can manage billing." },
      { status: 403 },
    );
  const { plan } = await request.json();
  const prices: Record<string, number> = { basic: 15000, pro: 35000 };
  if (!prices[plan])
    return NextResponse.json(
      { error: "That plan is not available." },
      { status: 400 },
    );
  const reference = `regsure-${context.user.sub}-${Date.now()}`;
  await db.query(
    "insert into payments (user_id,provider,provider_reference,plan,amount) values ($1,$2,$3,$4,$5)",
    [context.user.sub, "flutterwave", reference, plan, prices[plan]],
  );
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount: prices[plan],
      currency: "NGN",
      redirect_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?payment=complete`,
      customer: { email: context.user.email },
      customizations: {
        title: "Regsure plan",
        description: `${plan} plan subscription`,
      },
    }),
  });
  if (!response.ok)
    return NextResponse.json(
      { error: "Unable to start payment." },
      { status: 502 },
    );
  const data = await response.json();
  return NextResponse.json({ checkoutUrl: data.data?.link, reference });
}
