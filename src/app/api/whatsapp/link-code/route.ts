import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAiToken } from "@/lib/ai-token";
import { getBusinessContext, hasPlanAccess } from "@/lib/request-auth";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json({
    phoneNumber: process.env.WHATSAPP_NUMBER || null,
  });
}

export async function POST() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!hasPlanAccess(context.plan, "pro"))
    return NextResponse.json(
      { error: "WhatsApp assistant is available on Pro." },
      { status: 403 },
    );
  const code = String(randomInt(100000, 1000000));
  await db.query(
    "insert into whatsapp_link_codes (user_id,business_id,code_hash,expires_at) values ($1,$2,$3,now()+interval '10 minutes')",
    [context.user.sub, context.businessId, hash(code)],
  );
  return NextResponse.json({ code, expiresInSeconds: 600 });
}

export async function PUT(request: Request) {
  const { code } = await request.json();
  if (typeof code !== "string" || !/^\d{6}$/.test(code))
    return NextResponse.json(
      { error: "Enter the six-digit WhatsApp linking code." },
      { status: 400 },
    );
  const client = await db.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      "select id,user_id,business_id from whatsapp_link_codes where code_hash=$1 and used_at is null and expires_at>now() for update",
      [hash(code)],
    );
    if (!result.rows[0]) {
      await client.query("rollback");
      return NextResponse.json(
        { error: "This linking code is invalid or expired." },
        { status: 400 },
      );
    }
    await client.query(
      "update whatsapp_link_codes set used_at=now() where id=$1",
      [result.rows[0].id],
    );
    await client.query("commit");
    return NextResponse.json({
      token: await createAiToken(
        String(result.rows[0].user_id),
        String(result.rows[0].business_id),
      ),
    });
  } catch {
    await client.query("rollback").catch(() => undefined);
    return NextResponse.json(
      { error: "Unable to link WhatsApp." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
