import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const { email } = await request.json();
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail)
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  const result = await db.query(
    "select id,email,email_verified_at from users where email=$1",
    [normalizedEmail],
  );
  if (!result.rows[0] || result.rows[0].email_verified_at)
    return NextResponse.json({ ok: true });
  const recent = await db.query(
    "select extract(epoch from (interval '2 minutes' - (now()-created_at))) as retry_after from verification_codes where user_id=$1 and created_at>now()-interval '2 minutes' order by created_at desc limit 1",
    [result.rows[0].id],
  );
  if (recent.rows[0])
    return NextResponse.json(
      {
        error: "Please wait before requesting another code.",
        retryAfterSeconds: Math.max(1, Math.ceil(Number(recent.rows[0].retry_after))),
      },
      { status: 429 },
    );
  const code = String(randomInt(100000, 1000000));
  await db.query(
    "update verification_codes set used_at=now() where user_id=$1 and used_at is null",
    [result.rows[0].id],
  );
  await db.query(
    "insert into verification_codes (user_id,code_hash,expires_at) values ($1,$2,now()+interval '10 minutes')",
    [result.rows[0].id, createHash("sha256").update(code).digest("hex")],
  );
  await inngest.send({
    name: "regsure/auth.verification.requested",
    data: { email: normalizedEmail, code },
  });
  return NextResponse.json({ ok: true });
}
