import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";
import type { AuthFn } from "eve/channels/auth";

const regsureAuth: AuthFn<Request> = async (request) => {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(
    `${process.env.REGSURE_API_URL || "http://localhost:3000"}/api/auth/me`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    user?: {
      id?: string;
      sub?: string;
      email: string;
      plan: string;
      businessId?: string;
      role?: string;
    };
  };
  if (!data.user) return null;
  const principalId = data.user.id || data.user.sub;
  if (!principalId) return null;
  return {
    attributes: {
      user_AI_token: token,
      plan: data.user.plan,
      ...(data.user.businessId ? { businessId: data.user.businessId } : {}),
      ...(data.user.role ? { role: data.user.role } : {}),
      email: data.user.email,
    },
    authenticator: "regsure-ai-token",
    principalId,
    principalType: "user",
  };
};

export default eveChannel({
  auth: [
    regsureAuth,
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
    // This placeholder will not allow browser requests in production.
    // Replace it with your app's auth provider, like Auth.js or Clerk,
    // or use none() for a public demo.
    placeholderAuth(),
  ],
});
