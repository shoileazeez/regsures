import Ably from "ably";

const subscribeToken = process.env.ABLY_SUBSCRIBE_TOKEN;

export function subscribeToBusinessNotifications(
  businessId: string,
  onNotification: (notification: unknown) => void,
) {
  if (!subscribeToken) {
    throw new Error("ABLY_SUBSCRIBE_TOKEN is not configured.");
  }

  const realtime = new Ably.Realtime({ token: subscribeToken });
  const channel = realtime.channels.get(`business:${businessId}:notifications`);

  channel.subscribe((message) => {
    onNotification(message.data);
  });

  return async () => {
    await channel.unsubscribe();
    realtime.close();
  };
}
