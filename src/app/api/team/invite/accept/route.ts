import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestUser } from "@/lib/request-auth";
import { hashPassword, signJwt, type AuthPayload } from "@/lib/auth";
import { createHash, randomInt } from "node:crypto";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const { token, password, name } = await request.json();
  const invite = await db.query(
    "select id,business_id,email,role,branch_id,expires_at,accepted_at from team_invites where token=$1 and revoked_at is null",
    [token],
  );
  const row = invite.rows[0];
  if (!row || row.accepted_at || new Date(row.expires_at) < new Date())
    return NextResponse.json(
      { error: "This invite is missing, expired, or already accepted." },
      { status: 400 },
    );
  const existingUser = await getRequestUser();
  let user: AuthPayload;
  let createdJwt: string | null = null;
  const response = NextResponse.json({ ok: true, businessId: row.business_id });
  const setWorkspaceCookies = (target: NextResponse) => {
    const options = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    };
    target.cookies.set("regsure_business", String(row.business_id), options);
    target.cookies.set(
      "regsure_branch",
      row.branch_id ? String(row.branch_id) : "all",
      options,
    );
  };
  if (!existingUser) {
    if (!password || password.length < 8)
      return NextResponse.json(
        {
          error:
            "Create an account with a password of at least 8 characters to accept this invite.",
        },
        { status: 400 },
      );
    const created = await db.query(
      "insert into users (email,name,password_hash) values ($1,$2,$3) returning id,email,plan",
      [row.email, name || "Team member", hashPassword(password)],
    );
    const account = created.rows[0];
    const verificationCode = String(randomInt(100000, 1000000));
    await db.query(
      "insert into verification_codes (user_id,code_hash,expires_at) values ($1,$2,now()+interval '10 minutes')",
      [account.id, createHash("sha256").update(verificationCode).digest("hex")],
    );
    await inngest.send({
      name: "regsure/auth.verification.requested",
      data: { email: account.email, code: verificationCode },
    });
    const payload = {
      sub: String(account.id),
      email: account.email,
      plan: account.plan,
      platform: "web" as const,
      businessId: String(row.business_id),
      role: row.role,
    };
    const jwt = signJwt(payload);
    createdJwt = jwt;
    user = { ...payload, iat: 0, exp: 0 };
    response.cookies.set("regsure_session", jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } else user = existingUser;
  if (user.email !== row.email)
    return NextResponse.json(
      { error: "Sign in with the invited email before accepting." },
      { status: 401 },
    );
  await db.query(
    "insert into business_memberships (business_id,user_id,role,branch_id) values ($1,$2,$3,$4) on conflict (business_id,user_id) do update set branch_id=excluded.branch_id",
    [row.business_id, user.sub, row.role, row.branch_id || null],
  );
  await db.query(
    "update team_invites set accepted_at=now(),accepted_by=$1 where id=$2",
    [user.sub, row.id],
  );
  if (!existingUser) {
    const verificationResponse = NextResponse.json({
      ok: true,
      verificationRequired: true,
      email: row.email,
    });
    verificationResponse.cookies.set("regsure_session", createdJwt!, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    setWorkspaceCookies(verificationResponse);
    return verificationResponse;
  }
  setWorkspaceCookies(response);
  return response;
}
