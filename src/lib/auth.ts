import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
export type AuthPayload = {
  sub: string;
  email: string;
  plan: "free" | "basic" | "pro";
  platform: "web" | "mobile" | "ai-agent";
  businessId?: string;
  role?: "owner" | "admin" | "manager" | "staff";
  iat: number;
  exp: number;
};
const secret = () =>
  process.env.JWT_SECRET || "dev-only-regsure-secret-change-me";
const encode = (value: object | string) =>
  Buffer.from(
    typeof value === "string" ? value : JSON.stringify(value),
  ).toString("base64url");
export function signJwt(
  payload: Omit<AuthPayload, "iat" | "exp">,
  expiresInSeconds = 60 * 30,
) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  const signature = createHmac("sha256", secret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}
export function verifyJwt(token: string): AuthPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    const expected = createHmac("sha256", secret())
      .update(`${header}.${body}`)
      .digest("base64url");
    if (
      !signature ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as AuthPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}
