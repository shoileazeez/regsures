import { Chat } from "chat";
import { createMemoryState } from "@chat-adapter/state-memory";
import {
  Client,
  PostgresAuthStore,
  PostgresMessageStore,
  SqliteAuthStore,
  SqliteMessageStore,
} from "zaileys";
import { createZaileysAdapter } from "chat-adapter-zaileys";
import { Client as EveClient } from "eve/client";
import {
  getWhatsAppLink,
  saveWhatsAppLink,
} from "../agent/lib/whatsapp-link.js";

const sessionId = process.env.ZAILEYS_SESSION_ID || "regsure-eve";
const storage = process.env.ZAILEYS_STORAGE || "sqlite";
const database =
  process.env.ZAILEYS_DATABASE || "./.zaileys/regsure-whatsapp.db";
const connectionString =
  process.env.ZAILEYS_DATABASE_URL || process.env.DATABASE_URL;

if (storage === "postgres" && !connectionString) {
  throw new Error(
    "ZAILEYS_DATABASE_URL or DATABASE_URL is required for Postgres storage.",
  );
}

const auth =
  storage === "postgres"
    ? new PostgresAuthStore({ connectionString })
    : new SqliteAuthStore({ database });

const store =
  storage === "postgres"
    ? new PostgresMessageStore({ connectionString })
    : new SqliteMessageStore({ database });

const client = new Client({
  sessionId,
  auth,
  store,
});

const whatsapp = createZaileysAdapter({
  client,
  userName: "Regsure Eve",
  autoMarkRead: true,
  richMessages: true,
});

const adapters = { whatsapp };
const bot = new Chat<typeof adapters>({
  userName: "Regsure Eve",
  adapters,
  state: createMemoryState(),
});

bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const linkMatch = text.match(/^(?:(?:link|connect)\s+)?(\d{6})$/i);
  if (linkMatch) {
    const response = await fetch(
      `${process.env.REGSURE_API_URL || "http://localhost:3000"}/api/whatsapp/link-code`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: linkMatch[1] }),
      },
    );
    const data = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      await thread.post(data.error || "That linking code could not be used.");
      return;
    }
    await saveWhatsAppLink(thread.id, { token: data.token });
    await thread.post(
      "Your Regsure workspace is linked securely. You can now ask me about inventory, sales, customers, and analytics.",
    );
    return;
  }

  const link = await getWhatsAppLink(thread.id);
  if (!link) {
    await thread.post(
      `To connect Regsure, open ${process.env.REGSURE_WEB_URL || "http://localhost:3000"}/whatsapp while signed in, generate a six-digit code, then send CONNECT followed by that code here.`,
    );
    return;
  }

  const eve = new EveClient({
    host: process.env.EVE_AGENT_URL || "http://localhost:2000",
    auth: { bearer: link.token },
  });
  const session = link.sessionId
    ? eve.sessions.attach(link.sessionId)
    : undefined;
  const response = session
    ? await session.send(text)
    : (await eve.sessions.create({ message: text })).response;
  const result = await response.result();
  if (result.sessionId !== link.sessionId)
    await saveWhatsAppLink(thread.id, {
      token: link.token,
      sessionId: result.sessionId,
    });
  await thread.post(
    result.message || "I could not complete that request. Please try again.",
  );
});

await bot.initialize();
await whatsapp.connect();

console.log(
  storage === "postgres"
    ? "Regsure WhatsApp is running with Postgres-backed session storage."
    : "Regsure WhatsApp is running. Scan the QR shown above in WhatsApp → Linked devices.",
);
