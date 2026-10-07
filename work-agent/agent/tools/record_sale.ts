import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Record a sale with one or more inventory lines. Confirm products, quantities, discount, customer, and whether it is unpaid before calling.",
  inputSchema: z.object({
    customerId: z.number().optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: z.number(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().int().min(0),
        }),
      )
      .min(1),
    discount: z.number().int().min(0).default(0),
    loan: z.boolean().default(false),
    amountPaid: z.number().int().min(0).default(0),
    notes: z.string().optional(),
    confirm: z.literal(true),
  }),
  async execute(input, ctx) {
    return regsureRequest(ctx, "/api/sales", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
});
