import Ably from "ably";
export function getAblyServer() {
  if (!process.env.ABLY_API_KEY) return null;
  return new Ably.Rest(process.env.ABLY_API_KEY);
}
