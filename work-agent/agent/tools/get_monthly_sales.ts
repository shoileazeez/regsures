import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Summarize the current month of sales using real Regsure records.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const data = await regsureRequest<{ sales: Array<any> }>(ctx, "/api/sales");
    const now = new Date();
    const sales = data.sales.filter((s) => {
      const d = new Date(s.created_at);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
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
