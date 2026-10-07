import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export const REFRESH_DAYS = 60;
export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function createRefreshToken(
  userId: string,
  platform: "web" | "mobile",
) {
  const raw = randomBytes(48).toString("base64url");
  const result = await db.query(
    "insert into auth_refresh_tokens (user_id,token_hash,platform,expires_at) values ($1,$2,$3,now()+interval '60 days') returning id,expires_at",
    [userId, hashRefreshToken(raw), platform],
  );
  return { token: raw, expiresAt: result.rows[0].expires_at };
}
