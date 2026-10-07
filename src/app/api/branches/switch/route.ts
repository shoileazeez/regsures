import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { branchId } = await request.json();
  if (branchId !== "all") {
    const result = await db.query(
      "select id from branches where id=$1 and business_id=$2",
      [branchId, context.businessId],
    );
    if (!result.rows[0])
      return NextResponse.json(
        { error: "That branch is not part of this business." },
        { status: 403 },
      );
  }
  const response = NextResponse.json({ ok: true, branchId });
  response.cookies.set("regsure_branch", String(branchId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
