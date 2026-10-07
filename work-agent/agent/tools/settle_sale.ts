import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Apply a payment to an unpaid or partial sale after the user confirms the amount.",
  inputSchema: z.object({
    id: z.number(),
    amountPaid: z.number().int().min(0),
    confirm: z.literal(true),
  }),
  async execute(input, ctx) {
    return regsureRequest(ctx, "/api/sales", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
});
