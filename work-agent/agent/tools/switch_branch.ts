import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "Switch to an accessible branch or the full business view. List branches first, explain the target scope, and require confirmation.",
  inputSchema: z.object({
    branchId: z.union([z.string().min(1), z.literal("all")]),
    confirm: z.literal(true),
  }),
  async execute({ branchId }, ctx) {
    const result = await regsureRequest(ctx, "/api/branches/switch", {
      method: "POST",
      body: JSON.stringify({ branchId }),
    });
    const attributes = ctx.session?.auth?.current?.attributes;
    if (attributes) attributes.branchId = branchId;
    return result;
  },
});
