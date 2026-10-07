const baseUrl = process.env.REGSURE_API_URL || "http://localhost:3000";
const webUrl = process.env.REGSURE_WEB_URL || baseUrl;
export type AgentContext = {
  session?: {
    auth?: { current?: { attributes?: Record<string, unknown> } | null };
  };
};
function tokenFrom(ctx: AgentContext) {
  const token = ctx.session?.auth?.current?.attributes?.user_AI_token;
  if (typeof token !== "string" || !token)
    throw new Error("Sign in to Regsure before using business tools.");
  return token;
}
export async function regsureRequest<T>(
  ctx: AgentContext,
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenFrom(ctx)}`,
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        `Your Regsure agent session is unavailable. Sign in at ${webUrl}/auth/login, then try again.`,
      );
    if (response.status === 403)
      throw new Error(
        `${data.error || "This action is not available on your plan."} Manage access securely on the web at ${webUrl}/dashboard/billing.`,
      );
    throw new Error(
      data.error || `Regsure request failed (${response.status}).`,
    );
  }
  return data as T;
}
