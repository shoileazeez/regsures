import { readFile } from "node:fs/promises";
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is missing. Add it to .env.local first.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const client = await pool.connect();
try {
  await client.query(
    "create table if not exists schema_migrations (filename text primary key, applied_at timestamptz not null default now())",
  );
  const migrations = [
    "001_waitlist.sql",
    "002_accounts_billing.sql",
    "003_workspace_access.sql",
    "004_memberships_switching.sql",
    "005_email_verification.sql",
    "006_password_reset.sql",
    "007_inventory_items.sql",
    "008_sales_discounts.sql",
    "009_business_plans.sql",
    "010_subscription_settings.sql",
    "011_operations_detail.sql",
    "012_notifications.sql",
    "013_refresh_tokens.sql",
    "014_ai_tokens.sql",
    "015_alert_tracking.sql",
    "016_whatsapp_link_codes.sql",
  ];
  for (const migration of migrations) {
    const applied = await client.query(
      "select filename from schema_migrations where filename = $1",
      [migration],
    );
    if (applied.rowCount) {
      console.log(`${migration} already applied`);
      continue;
    }
    await client.query("begin");
    await client.query(
      await readFile(
        new URL(`../db/migrations/${migration}`, import.meta.url),
        "utf8",
      ),
    );
    await client.query("insert into schema_migrations (filename) values ($1)", [
      migration,
    ]);
    await client.query("commit");
    console.log(`Applied ${migration}`);
  }
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}
