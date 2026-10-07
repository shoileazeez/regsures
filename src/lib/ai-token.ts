import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export function hashAiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function createAiToken(userId: string, businessId: string) {
  const raw = `rsai_${randomBytes(40).toString("base64url")}`;
  await db.query(
    "insert into ai_tokens (user_id,business_id,token_hash,expires_at) values ($1,$2,$3,now()+interval '90 days')",
    [userId, businessId, hashAiToken(raw)],
  );
  return raw;
}
export async function getAiPrincipal(token: string) {
  const result = await db.query(
    "select t.user_id,t.business_id,u.email,b.plan,m.role from ai_tokens t join users u on u.id=t.user_id join businesses b on b.id=t.business_id left join business_memberships m on m.business_id=t.business_id and m.user_id=t.user_id where t.token_hash=$1 and t.revoked_at is null and t.expires_at>now()",
    [hashAiToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  await db.query(
    "update ai_tokens set last_used_at=now() where token_hash=$1",
    [hashAiToken(token)],
  );
  return {
    sub: String(row.user_id),
    email: row.email,
    plan: row.plan,
    platform: "ai-agent" as const,
    businessId: String(row.business_id),
    role: row.role || "staff",
    iat: 0,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
  };
}
