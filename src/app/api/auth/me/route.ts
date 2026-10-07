import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
export async function GET() {
  const user = await getRequestUser();
  return user
    ? NextResponse.json({ user })
    : NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}
