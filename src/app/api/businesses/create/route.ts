import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestUser } from "@/lib/request-auth";
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { name, plan = "free" } = await request.json();
  if (!name)
    return NextResponse.json(
      { error: "Business name is required." },
      { status: 400 },
    );
  if (!["free", "basic", "pro"].includes(plan))
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  const client = await db.connect();
  try {
    await client.query("begin");
    const business = (
      await client.query(
        "insert into businesses (owner_id,name,plan) values ($1,$2,$3) returning id,name,plan",
        [user.sub, name, plan === "free" ? "free" : "free"],
      )
    ).rows[0];
    await client.query(
      "insert into business_memberships (business_id,user_id,role) values ($1,$2,'owner')",
      [business.id, user.sub],
    );
    await client.query("commit");
    return NextResponse.json(
      { business, requestedPlan: plan },
      { status: 201 },
    );
  } catch {
    await client.query("rollback");
    return NextResponse.json(
      { error: "Unable to create business." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
