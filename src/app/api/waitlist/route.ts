import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    await db.query(
      "insert into waitlist_signups (email) values ($1) on conflict (email) do nothing",
      [email],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("waitlist signup failed", error);
    return NextResponse.json(
      { error: "We could not save that yet. Please try again." },
      { status: 500 },
    );
  }
}
