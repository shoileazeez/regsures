import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`reset:${ip}`, 5))
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const { email } = await request.json();
  const result = await db.query("select id from users where email=$1", [
    email?.trim().toLowerCase(),
  ]);
  if (result.rows[0]) {
    const recent = await db.query(
      "select extract(epoch from (interval '2 minutes' - (now()-created_at))) as retry_after from password_reset_tokens where user_id=$1 and created_at>now()-interval '2 minutes' and used_at is null order by created_at desc limit 1",
      [result.rows[0].id],
    );
    if (recent.rows[0])
      return NextResponse.json(
        {
          error: "Please wait before requesting another reset link.",
          retryAfterSeconds: Math.max(1, Math.ceil(Number(recent.rows[0].retry_after))),
        },
        { status: 429 },
      );
    const token = randomBytes(32).toString("hex");
    await db.query(
      "update password_reset_tokens set used_at=now() where user_id=$1 and used_at is null",
      [result.rows[0].id],
    );
    await db.query(
      "insert into password_reset_tokens (user_id,token_hash,expires_at) values ($1,$2,now()+interval '30 minutes')",
      [result.rows[0].id, createHash("sha256").update(token).digest("hex")],
    );
    console.log(`Password reset token for ${email}: ${token}`);
  }
  return NextResponse.json({ ok: true });
}
