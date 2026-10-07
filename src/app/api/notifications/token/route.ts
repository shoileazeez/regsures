import { NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/request-auth";
import { getAblyServer } from "@/lib/ably";
export async function GET() {
  const context = await getBusinessContext();
  const ably = getAblyServer();
  if (!context || !ably)
    return NextResponse.json(
      { error: "Realtime notifications are not configured." },
      { status: 503 },
    );
  const token = await ably.auth.requestToken({
    clientId: `user:${context.user.sub}`,
    capability: {
      [`business:${context.businessId}:notifications`]: ["subscribe"],
    },
  });
  return NextResponse.json(token);
}
