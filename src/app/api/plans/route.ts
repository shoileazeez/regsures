import { NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/request-auth";

export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const features = {
    free: [
      "Inventory basics",
      "Sales recording",
      "Customer records",
      "Weekly overview",
    ],
    basic: [
      "Everything in Free",
      "Monthly analytics",
      "Restock planning",
      "Up to 2 team members",
    ],
    pro: [
      "Everything in Basic",
      "Multiple branches",
      "Team roles",
      "WhatsApp assistant",
      "Advanced reports",
    ],
  };
  return NextResponse.json({
    current: context.plan,
    features,
    access: {
      analytics: context.plan !== "free",
      branches: context.plan === "pro",
      team: context.plan !== "free",
      whatsapp: context.plan === "pro",
    },
  });
}
