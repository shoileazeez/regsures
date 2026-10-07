import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || !password || password.length < 8)
    return NextResponse.json(
      { error: "Token and an 8-character password are required." },
      { status: 400 },
    );
  const result = await db.query(
    "select id,user_id from password_reset_tokens where token_hash=$1 and used_at is null and expires_at>now()",
    [createHash("sha256").update(token).digest("hex")],
  );
  const row = result.rows[0];
  if (!row)
    return NextResponse.json(
      { error: "That reset link is invalid or expired." },
      { status: 400 },
    );
  await db.query("update users set password_hash=$1 where id=$2", [
    hashPassword(password),
    row.user_id,
  ]);
  await db.query("update password_reset_tokens set used_at=now() where id=$1", [
    row.id,
  ]);
  return NextResponse.json({ ok: true });
}
