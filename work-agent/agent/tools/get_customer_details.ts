import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "Read one customer's contact details, balances, and purchase history for the selected Regsure workspace.",
  inputSchema: z.object({ customerId: z.number().int().positive() }),
  async execute({ customerId }, ctx) {
    return regsureRequest(ctx, `/api/customers?id=${customerId}`);
  },
});
