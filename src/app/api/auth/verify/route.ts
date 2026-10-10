import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  const { email, code } = await request.json();
  const user = await db.query("select id from users where email=$1", [
    email?.trim().toLowerCase(),
  ]);
  const row = user.rows[0];
  if (!row)
    return NextResponse.json(
      { error: "Invalid verification code." },
      { status: 400 },
    );
  const verification = await db.query(
    "select id from verification_codes where user_id=$1 and code_hash=$2 and used_at is null and expires_at>now() and created_at>now()-interval '10 minutes' order by created_at desc limit 1",
    [row.id, createHash("sha256").update(String(code)).digest("hex")],
  );
  if (!verification.rows[0])
    return NextResponse.json(
      { error: "Invalid or expired verification code." },
      { status: 400 },
    );
  await db.query("update verification_codes set used_at=now() where id=$1", [
    verification.rows[0].id,
  ]);
  await db.query("update users set email_verified_at=now() where id=$1", [
    row.id,
  ]);
  return NextResponse.json({ ok: true });
}
