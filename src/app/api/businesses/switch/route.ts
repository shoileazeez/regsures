import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestUser } from "@/lib/request-auth";
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { businessId } = await request.json();
  const result = await db.query(
    "select m.role,u.plan from business_memberships m join users u on u.id=m.user_id where m.business_id=$1 and m.user_id=$2",
    [businessId, user.sub],
  );
  if (!result.rows[0])
    return NextResponse.json(
      { error: "You do not have access to that business." },
      { status: 403 },
    );
  const response = NextResponse.json({
    ok: true,
    businessId,
    role: result.rows[0].role,
  });
  response.cookies.set("regsure_business", String(businessId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
