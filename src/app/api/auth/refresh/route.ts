import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { createRefreshToken, hashRefreshToken } from "@/lib/refresh-tokens";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cookie = (await import("next/headers")).cookies();
  const raw = body.refreshToken || cookie.get("regsure_refresh")?.value;
  if (!raw)
    return NextResponse.json(
      { error: "Refresh token is required." },
      { status: 401 },
    );
  const selectedBusiness = cookie.get("regsure_business")?.value;
  const result = await db.query(
    "select rt.id,rt.user_id,rt.platform,u.email,coalesce(b.plan,u.plan) as plan,m.business_id,m.role from auth_refresh_tokens rt join users u on u.id=rt.user_id left join lateral (select business_id,role from business_memberships where user_id=u.id and ($2::text is null or business_id::text=$2::text) order by created_at limit 1) m on true left join businesses b on b.id=m.business_id where rt.token_hash=$1 and (rt.revoked_at is null or rt.revoked_at>now()-interval '30 seconds') and rt.expires_at>now()",
    [hashRefreshToken(raw), selectedBusiness || null],
  );
  const row = result.rows[0];
  if (!row)
    return NextResponse.json(
      { error: "Refresh token is invalid or expired." },
      { status: 401 },
    );
  const replacement = await createRefreshToken(
    String(row.user_id),
    row.platform,
  );
  await db.query(
    "update auth_refresh_tokens set revoked_at=now(),replaced_by=(select id from auth_refresh_tokens where token_hash=$1) where id=$2",
    [hashRefreshToken(replacement.token), row.id],
  );
  const access = signJwt({
    sub: String(row.user_id),
    email: row.email,
    plan: row.plan,
    platform: row.platform,
    businessId: row.business_id ? String(row.business_id) : undefined,
    role: row.role,
  });
  const response = NextResponse.json({
    accessToken: row.platform === "mobile" ? access : undefined,
    expiresIn: 1800,
    refreshToken: row.platform === "mobile" ? replacement.token : undefined,
  });
  if (row.platform === "web") {
    response.cookies.set("regsure_session", access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1800,
      path: "/",
    });
    response.cookies.set("regsure_refresh", replacement.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
    });
  }
  return response;
}
