import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Summarize the last seven days of sales using real Regsure records.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const data = await regsureRequest<{ sales: Array<any> }>(ctx, "/api/sales");
    const since = Date.now() - 7 * 86400000;
    const sales = data.sales.filter(
      (s) => new Date(s.created_at).getTime() >= since,
    );
    const completed = sales.filter((s) => s.status === "completed");
    const outstanding = sales.filter((s) => s.status !== "completed");
    return {
      transactions: completed.length,
      total: completed.reduce((sum, s) => sum + Number(s.total || 0), 0),
      unpaid: outstanding.length,
      outstandingBalance: outstanding.reduce((sum, s) => sum + Math.max(0, Number(s.total || 0) - Number(s.amount_paid || 0)), 0),
    };
  },
});
