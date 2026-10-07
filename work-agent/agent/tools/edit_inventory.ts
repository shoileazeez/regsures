import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Edit a stock item or quantity after explicit confirmation. Explain stock changes before calling.",
  inputSchema: z.object({
    id: z.number(),
    name: z.string(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0),
    price: z.number().int().min(0),
    costPrice: z.number().int().min(0),
    category: z.string().optional(),
    unitOfMeasure: z.string(),
    description: z.string().optional(),
    confirm: z.literal(true),
  }),
  async execute(input, ctx) {
    return regsureRequest(ctx, "/api/inventory", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
});
