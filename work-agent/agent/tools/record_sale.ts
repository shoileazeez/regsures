import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Record a sale with one or more inventory lines. Confirm products, quantities, discount, customer, and whether it is unpaid before calling.",
  inputSchema: z.object({
    customerId: z.number().optional(),
    customerName: z.string().min(1).optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: z.number(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().int().min(0),
          discountPerUnit: z.number().int().min(0).default(0),
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
    let customerId = input.customerId;
    if (!customerId && input.customerName) {
      const data = await regsureRequest<{
        customers: Array<{ id: number; name: string }>;
      }>(ctx, "/api/customers");
      const matches = data.customers.filter(
        (customer) =>
          customer.name.trim().toLowerCase() ===
          input.customerName!.trim().toLowerCase(),
      );
      if (matches.length > 1)
        throw new Error("More than one customer has that name. Provide a more specific name.");
      if (!matches[0])
        throw new Error(
          `No customer named "${input.customerName}" exists in this workspace. Create that customer first; I will not substitute another customer or Walk-in Guest.`,
        );
      customerId = matches[0].id;
    }
    return regsureRequest(ctx, "/api/sales", {
      method: "POST",
      body: JSON.stringify({ ...input, customerId }),
    });
  },
});
