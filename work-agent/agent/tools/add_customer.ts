import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Create a customer after confirming the collected customer details.",
  inputSchema: z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    customerType: z.enum(["retail", "wholesale", "business"]).default("retail"),
    creditLimit: z.number().int().min(0).default(0),
    notes: z.string().optional(),
    confirm: z.literal(true),
  }),
  async execute(input, ctx) {
    return regsureRequest(ctx, "/api/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
});
