import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const result = await pool.query("select now() as connected_at");
console.log(`Postgres connected at ${result.rows[0].connected_at}`);
await pool.end();
