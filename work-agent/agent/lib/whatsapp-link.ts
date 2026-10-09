import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { readMemory, writeMemory } from "./memory.ts";

export type Link = { token: string; sessionId?: string; businessId?: string };
const key = createHash("sha256")
  .update(process.env.WHATSAPP_LINK_SECRET || "development-only-secret")
  .digest();

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decrypt(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getWhatsAppLink(threadId: string): Promise<Link | null> {
  const value = await readMemory(`whatsapp:${threadId}`);
  if (typeof value.token !== "string") return null;
  return {
    token: decrypt(value.token),
    sessionId:
      typeof value.sessionId === "string" ? value.sessionId : undefined,
    businessId:
      typeof value.businessId === "string" ? value.businessId : undefined,
  };
}

export async function saveWhatsAppLink(threadId: string, link: Link) {
  await writeMemory(`whatsapp:${threadId}`, {
    token: encrypt(link.token),
    sessionId: link.sessionId,
    businessId: link.businessId,
  });
}
