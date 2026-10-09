import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, signJwt } from "@/lib/auth";
import { createRefreshToken } from "@/lib/refresh-tokens";
import { createAiToken } from "@/lib/ai-token";
import { cookies } from "next/headers";
export async function POST(req: Request) {
  try {
    const { email, password, platform = "web" } = await req.json();
    const r = await db.query(
      "select id,email,name,plan,password_hash from users where email=$1",
      [email?.trim().toLowerCase()],
    );
    const u = r.rows[0];
    if (!u || !checkPassword(password || "", u.password_hash))
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    const savedBusiness = (await cookies()).get("regsure_business")?.value;
    const m = await db.query(
      "select business_id,role,branch_id from business_memberships where user_id=$1 order by (case when business_id=$2::bigint then 0 else 1 end),created_at limit 1",
      [u.id, savedBusiness || null],
    );
    const selected = m.rows[0];
    const mode = platform === "mobile" ? "mobile" : "web";
    const access = signJwt({
      sub: String(u.id),
      email: u.email,
      plan: u.plan,
      platform: mode,
      businessId: selected?.business_id
        ? String(selected.business_id)
        : undefined,
      role: selected?.role,
    });
    const refresh = await createRefreshToken(String(u.id), mode);
    const aiToken = selected?.business_id
      ? await createAiToken(String(u.id), String(selected.business_id))
      : null;
    const response = NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        businessId: selected?.business_id,
        role: selected?.role,
      },
      token: mode === "mobile" ? access : undefined,
      refreshToken: mode === "mobile" ? refresh.token : undefined,
      user_AI_token: aiToken,
      expiresIn: 1800,
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
      if (selected?.business_id) {
        response.cookies.set("regsure_business", String(selected.business_id), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
        response.cookies.set(
          "regsure_branch",
          selected.branch_id ? String(selected.branch_id) : "all",
          {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          },
        );
      }
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
