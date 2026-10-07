import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Read customers and outstanding balances for the selected Regsure business.",
  inputSchema: z.object({ search: z.string().optional() }),
  async execute({ search }, ctx) {
    const data = await regsureRequest<{
      customers: Array<Record<string, unknown>>;
    }>(ctx, "/api/customers");
    const customers = search
      ? data.customers.filter(
          (customer) =>
            String(customer.name || "")
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            String(customer.phone || "").includes(search),
        )
      : data.customers;
    return { customers };
  },
});
