import { db } from "./db";
import { getAblyServer } from "./ably";

export async function createNotification(input: {
  businessId: string | number;
  userId?: string | number | null;
  type: string;
  title: string;
  body: string;
}) {
  const result = await db.query(
    "insert into notifications (business_id,user_id,type,title,body) values ($1,$2,$3,$4,$5) returning *",
    [
      input.businessId,
      input.userId || null,
      input.type,
      input.title,
      input.body,
    ],
  );
  const notification = result.rows[0];
  const ably = getAblyServer();
  if (ably)
    await ably.channels
      .get(`business:${input.businessId}:notifications`)
      .publish("notification", notification);
  return notification;
}
