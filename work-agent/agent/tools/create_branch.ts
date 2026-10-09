import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "Create a branch for the active business. This is owner-only and Pro-only; require confirmation before creating it.",
  inputSchema: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    userId: z.string().optional(),
    confirm: z.literal(true),
  }),
  async execute({ name, address, userId }, ctx) {
    return regsureRequest(ctx, "/api/branches", {
      method: "POST",
      body: JSON.stringify({ name, address, userId }),
    });
  },
});
