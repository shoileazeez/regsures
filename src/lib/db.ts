import { Pool } from "pg";

const globalForDb = globalThis as unknown as { regsurePool?: Pool };

export const db =
  globalForDb.regsurePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.regsurePool = db;
