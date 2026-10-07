import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  const result = await db.query(
    "insert into waitlist_signups (email) values ($1) on conflict (email) do nothing returning email",
    [email],
  );
  if (result.rows[0]) {
    await inngest.send({
      name: "regsure/marketing.product-updates.subscribed",
      data: { email },
    });
  }
  return NextResponse.json({ ok: true });
}
