import { randomInt, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signJwt } from "@/lib/auth";
import { createRefreshToken } from "@/lib/refresh-tokens";
import { inngest } from "@/lib/inngest";
export async function POST(request: Request) {
  const client = await db.connect();
  try {
    const { email, password, name, platform = "web" } = await request.json();
    if (!email || !password || password.length < 8)
      return NextResponse.json(
        { error: "Use an email and a password with at least 8 characters." },
        { status: 400 },
      );
    await client.query("begin");
    const result = await client.query(
      "insert into users (email,name,password_hash) values ($1,$2,$3) returning id,email,name,plan",
      [
        email.trim().toLowerCase(),
        name?.trim() || "Business owner",
        hashPassword(password),
      ],
    );
    const row = result.rows[0];
    const business = await client.query(
      "insert into businesses (owner_id,name) values ($1,$2) returning id",
      [row.id, name?.trim() || "My business"],
    );
    await client.query(
      "insert into business_memberships (business_id,user_id,role) values ($1,$2,$3)",
      [business.rows[0].id, row.id, "owner"],
    );
    const code = String(randomInt(100000, 999999));
    await client.query(
      "insert into verification_codes (user_id,code_hash,expires_at) values ($1,$2,now()+interval '10 minutes')",
      [row.id, createHash("sha256").update(code).digest("hex")],
    );
    await client.query("commit");
    await inngest.send({
      name: "regsure/auth.verification.requested",
      data: { email: row.email, code },
    });
    const mode = platform === "mobile" ? "mobile" : "web";
    const access = signJwt({
      sub: String(row.id),
      email: row.email,
      plan: row.plan,
      platform: mode,
      businessId: String(business.rows[0].id),
      role: "owner",
    });
    const refresh = await createRefreshToken(String(row.id), mode);
    const response = NextResponse.json({
      user: row,
      token: mode === "mobile" ? access : undefined,
      refreshToken: mode === "mobile" ? refresh.token : undefined,
      expiresIn: 1800,
      verificationRequired: true,
    });
    if (mode === "web") {
      response.cookies.set("regsure_session", access, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1800,
        path: "/",
      });
      response.cookies.set("regsure_refresh", refresh.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 60,
        path: "/",
      });
    }
    return response;
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json(
      { error: "That email may already be registered." },
      { status: 409 },
    );
  } finally {
    client.release();
  }
}
