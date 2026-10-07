import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Read sales records and payment statuses for the selected Regsure business.",
  inputSchema: z.object({
    status: z.enum(["all", "completed", "unpaid", "partial"]).default("all"),
  }),
  async execute({ status }, ctx) {
    const data = await regsureRequest<{
      sales: Array<Record<string, unknown>>;
    }>(ctx, "/api/sales");
    return {
      sales:
        status === "all"
          ? data.sales
          : data.sales.filter((sale) => sale.status === status),
    };
  },
});
