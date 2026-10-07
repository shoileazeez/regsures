import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Add a stock item to Regsure after the user explicitly confirms the complete values.",
  inputSchema: z.object({
    name: z.string(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0),
    price: z.number().int().min(0),
    costPrice: z.number().int().min(0).default(0),
    category: z.string().optional(),
    unitOfMeasure: z.string().default("unit"),
    description: z.string().optional(),
    confirm: z.literal(true),
  }),
  async execute(input, ctx) {
    return regsureRequest(ctx, "/api/inventory", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
});
