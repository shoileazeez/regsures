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
import { subscribeToBusinessNotifications } from "../agent/lib/ably.ts";
import {
  getWhatsAppLink,
  saveWhatsAppLink,
} from "../agent/lib/whatsapp-link.ts";

const sessionId = process.env.ZAILEYS_SESSION_ID || "regsure-whatsapp";
const storage = process.env.ZAILEYS_STORAGE || "sqlite";
const database =
  process.env.ZAILEYS_DATABASE || "./.zaileys/regsure-whatsapp.db";
const connectionString =
  process.env.ZAILEYS_DATABASE_URL || process.env.DATABASE_URL;
const notificationCleanups = new Map<string, () => Promise<void>>();

async function subscribeToUserBusinesses(
  thread: any,
  token: string,
) {
  const response = await fetch(
    `${process.env.REGSURE_API_URL || "http://localhost:3000"}/api/businesses`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return;
  const data = (await response.json()) as {
    businesses?: Array<{ id: string; name: string; plan: string }>;
  };
  for (const business of data.businesses || []) {
    if (business.plan !== "pro" || notificationCleanups.has(String(business.id)))
      continue;
    const cleanup = subscribeToBusinessNotifications(
      String(business.id),
      async (notification: any) => {
        const title = typeof notification?.title === "string" ? notification.title : "Regsure alert";
        const body = typeof notification?.body === "string" ? notification.body : "You have a new business notification.";
        await thread.post(formatWhatsAppText(`${business.name}: ${title}\n${body}`));
      },
    );
    notificationCleanups.set(String(business.id), cleanup);
  }
}

function formatWhatsAppText(value: string) {
  return value
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/```[a-zA-Z0-9_-]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(?<!\w)\*(?!\s)(.*?)\*(?!\w)/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(?<!\w)_(?!\s)(.*?)_(?!\w)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\$(?=\s?[\d,])/g, "₦")
    .replace(/\b(USD|US dollars?)\b/gi, "NGN")
    .replace(/\b(?:business|branch|customer|product|sale|inventory|session)\s*id\s*[:#-]?\s*[A-Za-z0-9_-]+\b/gi, "")
    .replace(/\b(?:business_id|branch_id|customer_id|inventory_item_id|sale_id|session_id)\s*[:=]\s*[A-Za-z0-9_-]+\b/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
  userName: "Regsure",
  autoMarkRead: true,
  richMessages: true,
});

const adapters = { whatsapp };
const bot = new Chat<typeof adapters>({
  userName: "Regsure",
  adapters,
  state: createMemoryState(),
  concurrency: {
    strategy: "queue",
    maxQueueSize: 10,
    queueEntryTtlMs: 90_000,
  },
});

const handleWhatsAppMessage = async (thread: any, message: any) => {
  await thread.subscribe();
  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text) return;

  try {
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
    const data = (await response.json()) as {
      token?: string;
      businessId?: string;
      error?: string;
    };
    if (!response.ok || !data.token) {
      await thread.post(data.error || "That linking code could not be used.");
      return;
    }
    await saveWhatsAppLink(thread.id, {
      token: data.token,
      businessId: data.businessId,
    });
    await subscribeToUserBusinesses(thread, data.token);
    if (data.businessId && !notificationCleanups.has(data.businessId)) {
      const cleanup = subscribeToBusinessNotifications(data.businessId, async (notification: any) => {
        const title = typeof notification?.title === "string" ? notification.title : "Regsure alert";
        const body = typeof notification?.body === "string" ? notification.body : "You have a new business notification.";
        await thread.post(formatWhatsAppText(`${title}\n${body}`));
      });
      notificationCleanups.set(data.businessId, cleanup);
    }
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
  if (link.businessId && !notificationCleanups.has(link.businessId)) {
    const cleanup = subscribeToBusinessNotifications(link.businessId, async (notification: any) => {
      const title = typeof notification?.title === "string" ? notification.title : "Regsure alert";
      const body = typeof notification?.body === "string" ? notification.body : "You have a new business notification.";
      await thread.post(formatWhatsAppText(`${title}\n${body}`));
    });
    notificationCleanups.set(link.businessId, cleanup);
  }
  await subscribeToUserBusinesses(thread, link.token);

  const eve = new EveClient({
    host: process.env.EVE_AGENT_URL || "http://localhost:2000",
    auth: { bearer: link.token },
  });
  const session = link.sessionId
    ? eve.sessions.attach(link.sessionId)
    : undefined;
  let response;
  if (session) {
    try {
      response = await session.send(text);
    } catch (error) {
      console.warn(
        "[regsure] Existing Eve session failed; creating a fresh session.",
        error,
      );
      response = (await eve.sessions.create({ message: text })).response;
    }
  } else {
    response = (await eve.sessions.create({ message: text })).response;
  }
  const result = await Promise.race([
    response.result(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("The assistant took too long to respond.")), 90_000),
    ),
  ]);
  if (result.sessionId !== link.sessionId)
    await saveWhatsAppLink(thread.id, {
      token: link.token,
      sessionId: result.sessionId,
      businessId: link.businessId,
    });
  await thread.post(
    formatWhatsAppText(
      result.message || "I could not complete that request. Please try again.",
    ),
  );
  } catch (error) {
    console.error("[regsure] WhatsApp message failed", error);
    await thread.post(
      error instanceof Error && error.message.includes("too long")
        ? "Regsure is taking longer than expected. Please try again in a moment."
        : "I could not process that message right now. Please try again.",
    );
  }
};

bot.onNewMention(handleWhatsAppMessage);
bot.onSubscribedMessage(handleWhatsAppMessage);

await bot.initialize();
await whatsapp.connect();

console.log(
  storage === "postgres"
    ? "Regsure WhatsApp is running with Postgres-backed session storage."
    : "Regsure WhatsApp is running. Scan the QR shown above in WhatsApp → Linked devices.",
);
