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
    return {
      transactions: sales.length,
      total: sales.reduce((sum, s) => sum + Number(s.total || 0), 0),
      unpaid: sales.filter((s) => s.status !== "completed").length,
    };
  },
});
