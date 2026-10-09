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
  const requestHeaders = await headers();
  const selected =
    requestHeaders.get("x-regsure-business") ||
    (await cookies()).get("regsure_business")?.value;
  const branch = (await cookies()).get("regsure_branch")?.value;
  const businessId = selected || user.businessId || null;
  let plan = user.plan || "free";
  let role = user.role || "staff";
  let assignedBranchId: string | null = null;
  if (businessId) {
    const result = await db.query(
      "select b.plan,m.role,m.branch_id from businesses b join business_memberships m on m.business_id=b.id where b.id=$1 and m.user_id=$2",
      [businessId, user.sub],
    );
    if (!result.rows[0]) return null;
    plan = result.rows[0].plan || plan;
    role = result.rows[0].role || role;
    assignedBranchId = result.rows[0].branch_id
      ? String(result.rows[0].branch_id)
      : null;
    if (role === "owner") assignedBranchId = null;
  }
  const requestedBranch =
    requestHeaders.get("x-regsure-branch") || branch;
  const effectiveBranchId =
    assignedBranchId ||
    (requestedBranch && requestedBranch !== "all" ? requestedBranch : null);
  return {
    user,
    businessId,
    branchId: effectiveBranchId,
    assignedBranchId,
    role,
    plan,
  };
}
