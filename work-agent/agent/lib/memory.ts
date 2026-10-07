import { Redis } from "@upstash/redis";
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
function key(userId: string) {
  return `regsure:agent:memory:${userId}`;
}
export async function readMemory(userId: string) {
  return redis
    ? (await redis.get<Record<string, unknown>>(key(userId))) || {}
    : {};
}
export async function writeMemory(
  userId: string,
  memory: Record<string, unknown>,
) {
  if (redis) await redis.set(key(userId), memory, { ex: 60 * 60 * 24 * 180 });
  return memory;
}
