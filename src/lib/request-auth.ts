import { cookies, headers } from "next/headers";
import { verifyJwt } from "./auth";
import { db } from "./db";
import { getAiPrincipal } from "./ai-token";
export async function getRequestUser() {
  const headerToken = (await headers())
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const token = headerToken || (await cookies()).get("regsure_session")?.value;
  if (!token) return null;
  const jwtUser = verifyJwt(token);
  if (jwtUser) {
    const verification = await db.query(
      "select email_verified_at from users where id=$1",
      [jwtUser.sub],
    );
    if (!verification.rows[0]?.email_verified_at) return null;
    return jwtUser;
  }
  return await getAiPrincipal(token);
}
export function hasPlanAccess(
  plan: string | undefined,
  required: "free" | "basic" | "pro",
) {
  const levels = { free: 0, basic: 1, pro: 2 };
  return !!plan && levels[plan as keyof typeof levels] >= levels[required];
}
export async function getBusinessContext() {
  const user = await getRequestUser();
  if (!user) return null;
  const selected = (await cookies()).get("regsure_business")?.value;
  const branch = (await cookies()).get("regsure_branch")?.value;
  const businessId = selected || user.businessId || null;
  let plan = user.plan || "free";
  if (businessId) {
    const result = await db.query("select plan from businesses where id=$1", [
      businessId,
    ]);
    plan = result.rows[0]?.plan || plan;
  }
  return {
    user,
    businessId,
    branchId: branch && branch !== "all" ? branch : null,
    role: user.role || "staff",
    plan,
  };
}
