import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "Switch the authenticated user to an accessible Regsure business. Always list businesses first, explain the target business, and require confirmation.",
  inputSchema: z.object({
    businessId: z.string().min(1),
    confirm: z.literal(true),
  }),
  async execute({ businessId }, ctx) {
    const result = await regsureRequest(ctx, "/api/businesses/switch", {
      method: "POST",
      body: JSON.stringify({ businessId }),
    });
    const attributes = ctx.session?.auth?.current?.attributes;
    if (attributes) {
      attributes.businessId = businessId;
      delete attributes.branchId;
    }
    return result;
  },
});
